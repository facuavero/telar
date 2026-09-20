// Telar · OAuth de Gmail y envío de mails.
// El refresh token se guarda cifrado en conexiones.config.oauth: la clave
// (CLAVE_CIFRADO) vive solo en el worker, nunca sale al front.

import { cifrar, descifrar } from './cripto.js';
import { db } from './supabase.js';

const AUTORIZAR = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const ENVIAR = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
export const ALCANCES = 'openid email https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly';

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
  const token = await refrescar(env, refreshToken);
  const perfil = await pedirGmail(API + '/profile', token.access_token);
  const campos = {
    estado: 'activa',
    cuenta,
    nombre: 'Gmail',
    config: { oauth: sobre, alcances: ALCANCES, history_id: perfil.historyId, conectada_en: new Date().toISOString() }
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

async function pedirGmail(url, token) {
  const r = await fetch(url, { headers: { authorization: 'Bearer ' + token } });
  const datos = await r.json().catch(() => null);
  if (!r.ok) throw new Error('Gmail respondió: ' + (datos?.error?.message || r.status));
  return datos;
}

const cabecera = (mensaje, nombre) =>
  mensaje?.payload?.headers?.find(h => h.name.toLowerCase() === nombre.toLowerCase())?.value || null;

// Gmail no puede llamar al worker sin Pub/Sub. El cron trae los cambios desde
// el último historyId y luego adelanta el cursor dentro de conexiones.config.
export async function correosNuevos(env, conexion) {
  const token = await accessToken(env, conexion);
  let historyId = conexion.config?.history_id;
  if (!historyId) {
    const perfil = await pedirGmail(API + '/profile', token);
    await db.actualizar(env, 'conexiones', `id=eq.${conexion.id}`, {
      config: { ...conexion.config, history_id: perfil.historyId }
    });
    return [];
  }

  const encontrados = [];
  let pagina = null;
  let ultimoHistory = historyId;
  do {
    const qs = new URLSearchParams({ startHistoryId: historyId, historyTypes: 'messageAdded', maxResults: '100' });
    if (pagina) qs.set('pageToken', pagina);
    let datos;
    try {
      datos = await pedirGmail(API + '/history?' + qs, token);
    } catch (e) {
      if (/historyId|too old|404/i.test(e.message)) {
        const perfil = await pedirGmail(API + '/profile', token);
        await db.actualizar(env, 'conexiones', `id=eq.${conexion.id}`, {
          config: { ...conexion.config, history_id: perfil.historyId }
        });
        return [];
      }
      throw e;
    }
    ultimoHistory = datos.historyId || ultimoHistory;
    for (const cambio of datos.history || []) {
      for (const agregado of cambio.messagesAdded || []) {
        const id = agregado.message?.id;
        if (id && !encontrados.includes(id)) encontrados.push(id);
      }
    }
    pagina = datos.nextPageToken || null;
  } while (pagina);

  const correos = [];
  for (const id of encontrados.slice(-50)) {
    const m = await pedirGmail(API + `/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, token);
    if (!m.labelIds?.includes('INBOX')) continue;
    correos.push({
      id: m.id,
      hilo_id: m.threadId,
      de: cabecera(m, 'From'),
      para: cabecera(m, 'To'),
      asunto: cabecera(m, 'Subject') || '(sin asunto)',
      fecha: cabecera(m, 'Date'),
      resumen: m.snippet || ''
    });
  }

  await db.actualizar(env, 'conexiones', `id=eq.${conexion.id}`, {
    config: { ...conexion.config, history_id: ultimoHistory, ultimo_poll_en: new Date().toISOString() }
  });
  return correos;
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
