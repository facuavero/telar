// Telar · acceso a Supabase desde el worker.
// Dos modos: con el token del usuario (respeta RLS, sirve para autorizar) o
// con la service role key (salta RLS, solo para escribir corridas y leer tokens).

function base(env) {
  const url = env.SUPABASE_URL;
  if (!url) throw new Error('Falta la variable SUPABASE_URL en el worker.');
  return url.replace(/\/+$/, '');
}

async function pedir(env, camino, { metodo = 'GET', token, servicio, cuerpo, prefer } = {}) {
  const clave = servicio ? env.SUPABASE_SERVICE_ROLE : env.SUPABASE_ANON_KEY;
  if (!clave) throw new Error(servicio
    ? 'Falta el secreto SUPABASE_SERVICE_ROLE en el worker.'
    : 'Falta la variable SUPABASE_ANON_KEY en el worker.');

  // apikey identifica al proyecto; el rol sale del JWT del Authorization.
  // Es el mismo par que manda supabase-js desde el navegador.
  const cabeceras = {
    apikey: env.SUPABASE_ANON_KEY || clave,
    Authorization: 'Bearer ' + (servicio ? env.SUPABASE_SERVICE_ROLE : (token || clave))
  };
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  if (prefer) cabeceras.Prefer = prefer;

  const r = await fetch(base(env) + camino, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
  });
  const texto = await r.text();
  let datos = null;
  if (texto) { try { datos = JSON.parse(texto); } catch { datos = texto; } }
  if (!r.ok) {
    const e = new Error(datos?.message || datos?.error_description || texto || ('HTTP ' + r.status));
    e.estado = r.status;
    e.codigo = datos?.code;
    throw e;
  }
  return datos;
}

export const db = {
  // Lecturas/escrituras con la service role key.
  leer: (env, tabla, query) => pedir(env, `/rest/v1/${tabla}?${query}`, { servicio: true }),
  insertar: (env, tabla, fila) =>
    pedir(env, `/rest/v1/${tabla}`, { metodo: 'POST', servicio: true, cuerpo: fila, prefer: 'return=representation' })
      .then(f => (Array.isArray(f) ? f[0] : f)),
  actualizar: (env, tabla, query, campos) =>
    pedir(env, `/rest/v1/${tabla}?${query}`, { metodo: 'PATCH', servicio: true, cuerpo: campos, prefer: 'return=representation' })
      .then(f => (Array.isArray(f) ? f[0] : f)),

  // Lectura con el token del usuario: si RLS no lo deja, vuelve vacío.
  leerComoUsuario: (env, token, tabla, query) => pedir(env, `/rest/v1/${tabla}?${query}`, { token }),

  // ¿De quién es este token? Devuelve null si no vale.
  usuario: async (env, token) => {
    if (!token) return null;
    try { return await pedir(env, '/auth/v1/user', { token }); } catch { return null; }
  }
};

// Autoriza contra RLS: si el usuario ve la automatización, es miembro del workspace.
export async function automatizacionDelUsuario(env, token, id) {
  const filas = await db.leerComoUsuario(env, token, 'automatizaciones', `id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return filas?.[0] || null;
}

export async function workspaceDelUsuario(env, token, ws) {
  const filas = await db.leerComoUsuario(env, token, 'workspaces', `id=eq.${encodeURIComponent(ws)}&select=id,nombre&limit=1`);
  return filas?.[0] || null;
}
