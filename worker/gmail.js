// Telar · OAuth de Gmail y envío de mails.
// El refresh token se guarda cifrado en conexiones.config.oauth: la clave
// (CLAVE_CIFRADO) vive solo en el worker, nunca sale al front.

import { cifrar, descifrar } from './cripto.js';
import { db } from './supabase.js';

const AUTORIZAR = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const ENVIAR = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
// Mínimo indispensable: mandar mails y saber de qué cuenta se trata.
// Para disparadores por mail entrante hay que sumar gmail.readonly y volver a autorizar.
export const ALCANCES = 'openid email https://www.googleapis.com/auth/gmail.send';

export function urlDeAutorizacion(env, { redirect, state }) {
  const p = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirect,
    response_type: 'code',
    scope: ALCANCES,
    access_type: 'offline',     // sin esto no llega refresh token
    prompt: 'consent',          // fuerza el refresh token aunque ya haya autorizado antes
    include_granted_scopes: 'true',
    state
  });
  return AUTORIZAR + '?' + p.toString();
}

async function aToken(env, cuerpo) {
  const r = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(cuerpo).toString()
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error('Google rechazó el token: ' + (datos?.error_description || datos?.error || r.status));
  return datos;
}

export const canjearCodigo = (env, { code, redirect }) => aToken(env, {
  code,
  client_id: env.GOOGLE_CLIENT_ID,
  client_secret: env.GOOGLE_CLIENT_SECRET,
  redirect_uri: redirect,
  grant_type: 'authorization_code'
});

export const refrescar = (env, refreshToken) => aToken(env, {
  refresh_token: refreshToken,
  client_id: env.GOOGLE_CLIENT_ID,
  client_secret: env.GOOGLE_CLIENT_SECRET,
  grant_type: 'refresh_token'
});

// El id_token viene de Google por TLS en el mismo canje: leemos el mail sin validar firma.
export function mailDelIdToken(idToken) {
  try {
    const cuerpo = String(idToken).split('.')[1];
    const json = atob(cuerpo.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((cuerpo.length + 3) % 4));
    return JSON.parse(json).email || null;
  } catch { return null; }
}

// Deja la conexión lista y visible en la app.
export async function guardarConexion(env, { ws, cuenta, refreshToken }) {
  const sobre = await cifrar(env.CLAVE_CIFRADO, refreshToken);
  const campos = {
    estado: 'activa',
    cuenta,
    nombre: 'Gmail',
    config: { oauth: sobre, alcances: ALCANCES, conectada_en: new Date().toISOString() }
  };
  const previas = await db.leer(env, 'conexiones',
    `workspace_id=eq.${ws}&proveedor=eq.gmail&select=id&limit=1`);
  if (previas?.length) {
    return db.actualizar(env, 'conexiones', `id=eq.${previas[0].id}`, campos);
  }
  return db.insertar(env, 'conexiones', { workspace_id: ws, proveedor: 'gmail', ...campos });
}

export async function conexionDe(env, ws) {
  const filas = await db.leer(env, 'conexiones',
    `workspace_id=eq.${ws}&proveedor=eq.gmail&estado=eq.activa&select=*&limit=1`);
  return filas?.[0] || null;
}

async function accessToken(env, conexion) {
  const refresh = await descifrar(env.CLAVE_CIFRADO, conexion.config?.oauth);
  if (!refresh) throw new Error('La conexión de Gmail no tiene token guardado. Volvé a conectarla.');
  try {
    const t = await refrescar(env, refresh);
    return t.access_token;
  } catch (e) {
    await db.actualizar(env, 'conexiones', `id=eq.${conexion.id}`, { estado: 'error' });
    throw new Error('Google no renovó el permiso de Gmail (' + e.message + '). Hay que conectarla de nuevo.');
  }
}

// RFC 2822 en base64url, como pide la API.
function armarMail({ para, asunto, cuerpo, de }) {
  const utf8 = t => '=?UTF-8?B?' + btoa(String.fromCharCode(...new TextEncoder().encode(t))) + '?=';
  const crudo = [
    'From: ' + de,
    'To: ' + para,
    'Subject: ' + utf8(asunto),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(String.fromCharCode(...new TextEncoder().encode(cuerpo)))
  ].join('\r\n');
  return btoa(String.fromCharCode(...new TextEncoder().encode(crudo)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function enviar(env, ws, { para, asunto, cuerpo }) {
  const conexion = await conexionDe(env, ws);
  if (!conexion) throw new Error('Gmail no está conectado en este workspace.');
  const token = await accessToken(env, conexion);
  const r = await fetch(ENVIAR, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ raw: armarMail({ para, asunto, cuerpo, de: conexion.cuenta }) })
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error('Gmail no aceptó el mail: ' + (datos?.error?.message || r.status));
  return { id: datos.id, cuenta: conexion.cuenta, para };
}
