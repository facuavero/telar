// Telar · OAuth de Slack y envío de mensajes. El bot token se guarda cifrado
// dentro de conexiones.config, igual que el refresh token de Gmail.

import { cifrar, descifrar } from './cripto.js';
import { db } from './supabase.js';

const AUTORIZAR = 'https://slack.com/oauth/v2/authorize';
const API = 'https://slack.com/api';
const ALCANCES = 'chat:write,channels:read,groups:read';

export function urlDeAutorizacion(env, { redirect, state }) {
  return AUTORIZAR + '?' + new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID, redirect_uri: redirect,
    scope: ALCANCES, state
  });
}

export async function canjearCodigo(env, { code, redirect }) {
  const r = await fetch(API + '/oauth.v2.access', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, redirect_uri: redirect, client_id: env.SLACK_CLIENT_ID, client_secret: env.SLACK_CLIENT_SECRET })
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok || !datos?.ok) throw new Error('Slack rechazó la conexión: ' + (datos?.error || r.status));
  return datos;
}

export async function guardarConexion(env, { ws, autorizacion }) {
  const sobre = await cifrar(env.CLAVE_CIFRADO, autorizacion.access_token);
  const campos = {
    estado: 'activa', cuenta: autorizacion.team?.name || 'Workspace de Slack', nombre: 'Slack',
    config: { oauth: sobre, alcances: autorizacion.scope, team_id: autorizacion.team?.id,
      bot_user_id: autorizacion.bot_user_id, conectada_en: new Date().toISOString() }
  };
  const previas = await db.leer(env, 'conexiones', `workspace_id=eq.${ws}&proveedor=eq.slack&select=id&limit=1`);
  if (previas?.length) return db.actualizar(env, 'conexiones', `id=eq.${previas[0].id}`, campos);
  return db.insertar(env, 'conexiones', { workspace_id: ws, proveedor: 'slack', ...campos });
}

async function llamar(token, metodo, cuerpo) {
  const r = await fetch(API + '/' + metodo, {
    method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(cuerpo)
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok || !datos?.ok) throw new Error('Slack respondió: ' + (datos?.error || r.status));
  return datos;
}

async function idDelCanal(token, canal) {
  if (/^[CGD][A-Z0-9]+$/i.test(canal)) return canal;
  const buscado = canal.replace(/^#/, '').toLowerCase();
  let cursor = null;
  do {
    const datos = await llamar(token, 'conversations.list', {
      types: 'public_channel,private_channel', limit: 200, exclude_archived: true,
      ...(cursor ? { cursor } : {})
    });
    const encontrado = datos.channels?.find(c => c.name?.toLowerCase() === buscado);
    if (encontrado) return encontrado.id;
    cursor = datos.response_metadata?.next_cursor || null;
  } while (cursor);
  throw new Error(`No encontré el canal ${canal}. Invitá al bot al canal y revisá el nombre.`);
}

export async function enviar(env, ws, { canal, texto }) {
  const filas = await db.leer(env, 'conexiones', `workspace_id=eq.${ws}&proveedor=eq.slack&estado=eq.activa&select=*&limit=1`);
  const conexion = filas?.[0];
  if (!conexion) throw new Error('Slack no está conectado en este workspace.');
  const token = await descifrar(env.CLAVE_CIFRADO, conexion.config?.oauth);
  if (!token) throw new Error('La conexión de Slack no tiene token guardado. Volvé a conectarla.');
  const channel = await idDelCanal(token, canal);
  const enviado = await llamar(token, 'chat.postMessage', { channel, text: texto });
  return { canal: enviado.channel, ts: enviado.ts, cuenta: conexion.cuenta };
}
