// Telar · worker de Cloudflare. Sirve el sitio estático de /diseno y expone
// la API del motor en /api/*. Las claves (service role, IA, Google) viven acá
// como secrets: nunca salen al front.

import { db, automatizacionDelUsuario, workspaceDelUsuario } from './supabase.js';
import { ejecutar } from './motor.js';
import { toca, proxima } from './programado.js';
import { sellar, abrirSello, firmar, firmaValida } from './cripto.js';
import * as gmail from './gmail.js';

const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), { status: estado, headers: { 'content-type': 'application/json; charset=utf-8' } });

const problema = (mensaje, estado = 400) => json({ error: mensaje }, estado);

const tokenDe = req => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') || null;

function firmaSecreta(env) {
  const s = env.CLAVE_FIRMA || env.SUPABASE_SERVICE_ROLE;
  if (!s) throw new Error('Falta el secreto CLAVE_FIRMA en el worker.');
  return s;
}

const urlWebhook = async (env, origen, id) =>
  `${origen}/api/webhook/${id}/${await firmar(firmaSecreta(env), 'webhook:' + id)}`;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(req);

    try {
      return await rutear(req, env, url, ctx);
    } catch (e) {
      return problema(e?.message || 'Se rompió algo en el worker.', 500);
    }
  },

  // Disparador programado: se fija qué automatización activa le toca correr.
  async scheduled(evento, env, ctx) {
    ctx.waitUntil(correrProgramadas(env, new Date(evento.scheduledTime)));
  }
};

async function rutear(req, env, url, ctx) {
  const ruta = url.pathname;

  if (ruta === '/api/salud') {
    return json({
      ok: true,
      motor: 'listo',
      ia: !!env.CLAVE_IA,
      gmail: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.CLAVE_CIFRADO),
      base: !!env.SUPABASE_SERVICE_ROLE
    });
  }

  // --- correr a mano desde el editor ---
  if (ruta === '/api/ejecutar' && req.method === 'POST') {
    const token = tokenDe(req);
    if (!token) return problema('Falta la sesión.', 401);
    const cuerpo = await req.json().catch(() => ({}));
    if (!cuerpo.automatizacion_id) return problema('Falta automatizacion_id.');

    const autom = await automatizacionDelUsuario(env, token, cuerpo.automatizacion_id);
    if (!autom) return problema('Esa automatización no existe o no es tuya.', 403);

    const fila = await ejecutar(env, autom, {
      tipo: 'manual',
      detalle: autom.definicion?.disparador?.detalle || null,
      entrada: cuerpo.entrada ?? null
    });
    return json({ ejecucion: fila });
  }

  // --- datos del disparador (URL del webhook, próxima corrida) ---
  if (ruta === '/api/disparador' && req.method === 'GET') {
    const token = tokenDe(req);
    if (!token) return problema('Falta la sesión.', 401);
    const id = url.searchParams.get('automatizacion_id');
    const autom = id && await automatizacionDelUsuario(env, token, id);
    if (!autom) return problema('Esa automatización no existe o no es tuya.', 403);

    const disp = autom.definicion?.disparador || {};
    return json({
      tipo: disp.tipo || 'manual',
      webhook: await urlWebhook(env, url.origin, autom.id),
      programado: disp.tipo === 'cron' ? proxima(disp.detalle) : null
    });
  }

  // --- webhook: lo llama cualquiera que tenga la URL firmada ---
  const webhook = ruta.match(/^\/api\/webhook\/([0-9a-f-]{36})\/([\w-]+)$/i);
  if (webhook) {
    const [, id, firma] = webhook;
    if (!(await firmaValida(firmaSecreta(env), 'webhook:' + id, firma))) return problema('Firma inválida.', 403);

    const filas = await db.leer(env, 'automatizaciones', `id=eq.${id}&select=*&limit=1`);
    const autom = filas?.[0];
    if (!autom) return problema('No existe esa automatización.', 404);
    if (autom.estado !== 'activa') return problema('La automatización está en ' + autom.estado + ': activala para que el webhook la dispare.', 409);

    const entrada = req.method === 'POST'
      ? await req.json().catch(() => null) ?? Object.fromEntries(url.searchParams)
      : Object.fromEntries(url.searchParams);

    const fila = await ejecutar(env, autom, { tipo: 'webhook', detalle: autom.definicion?.disparador?.detalle || null, entrada });
    return json({ ejecucion: { id: fila.id, estado: fila.estado, error: fila.error } });
  }

  // --- OAuth de Gmail ---
  if (ruta === '/api/oauth/gmail/iniciar' && req.method === 'POST') {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return problema('Falta configurar las credenciales de Google en el worker.', 501);
    if (!env.CLAVE_CIFRADO) return problema('Falta el secreto CLAVE_CIFRADO en el worker.', 501);
    const token = tokenDe(req);
    if (!token) return problema('Falta la sesión.', 401);
    const cuerpo = await req.json().catch(() => ({}));
    const ws = cuerpo.workspace_id && await workspaceDelUsuario(env, token, cuerpo.workspace_id);
    if (!ws) return problema('Ese workspace no es tuyo.', 403);

    const redirect = url.origin + '/api/oauth/gmail/callback';
    const state = await sellar(firmaSecreta(env), { ws: ws.id, volver: cuerpo.volver || '/app/index.html' });
    return json({ url: gmail.urlDeAutorizacion(env, { redirect, state }) });
  }

  if (ruta === '/api/oauth/gmail/callback') {
    const volverA = (destino, params) => Response.redirect(url.origin + destino + params, 302);
    const error = url.searchParams.get('error');
    if (error) return volverA('/app/index.html', '#integraciones?gmail=' + encodeURIComponent(error));

    const datos = await abrirSello(firmaSecreta(env), url.searchParams.get('state'));
    if (!datos) return volverA('/app/index.html', '#integraciones?gmail=state_invalido');

    try {
      const canje = await gmail.canjearCodigo(env, {
        code: url.searchParams.get('code'),
        redirect: url.origin + '/api/oauth/gmail/callback'
      });
      if (!canje.refresh_token) throw new Error('Google no mandó refresh token. Quitá el acceso a Telar en tu cuenta de Google y probá de nuevo.');
      await gmail.guardarConexion(env, {
        ws: datos.ws,
        cuenta: gmail.mailDelIdToken(canje.id_token) || 'cuenta de Gmail',
        refreshToken: canje.refresh_token
      });
      return volverA(datos.volver, '#integraciones?gmail=ok');
    } catch (e) {
      return volverA(datos.volver, '#integraciones?gmail=' + encodeURIComponent(e.message));
    }
  }

  return problema('No existe ese endpoint.', 404);
}

// ---------- disparador programado ----------

export async function correrProgramadas(env, momento) {
  const activas = await db.leer(env, 'automatizaciones',
    `estado=eq.activa&definicion->disparador->>tipo=eq.cron&select=*&limit=200`);

  const corridas = [];
  for (const autom of activas || []) {
    const ultimas = await db.leer(env, 'ejecuciones',
      `automatizacion_id=eq.${autom.id}&select=empezada_en&order=empezada_en.desc&limit=1`);
    const turno = toca(autom.definicion?.disparador?.detalle, ultimas?.[0]?.empezada_en, momento);
    if (!turno) continue;
    const fila = await ejecutar(env, autom, { tipo: 'cron', detalle: autom.definicion?.disparador?.detalle || null, entrada: { programada_para: turno.cuando } });
    corridas.push({ automatizacion: autom.id, ejecucion: fila.id, estado: fila.estado });
  }
  return corridas;
}
