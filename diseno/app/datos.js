// Telar · capa de datos sobre Supabase. Todo pasa por el workspace activo.
(function () {
  const D = {};
  const sb = () => window.telar.sb;

  D.error = null;

  function chequear({ data, error }) {
    if (error) throw error;
    return data;
  }

  // ---- sesión / perfil ----

  D.perfil = async (session) => {
    const { data } = await sb().from('perfiles').select('*').eq('id', session.user.id).maybeSingle();
    if (data) return data;
    // El trigger de alta puede no haber corrido (usuarios viejos): lo creamos acá.
    const fila = {
      id: session.user.id,
      email: session.user.email,
      nombre: (session.user.email || '').split('@')[0]
    };
    const { data: nuevo } = await sb().from('perfiles').upsert(fila).select().maybeSingle();
    return nuevo || fila;
  };

  // Devuelve el workspace del usuario; si no tiene, intenta crearlo.
  D.workspaceActivo = async (session) => {
    const mios = chequear(await sb().from('workspaces').select('*').order('creado_en').limit(1));
    if (mios && mios.length) return mios[0];

    const nombre = (session.user.email || 'Mi espacio').split('@')[0];
    const ws = chequear(await sb().from('workspaces').insert({ nombre, dueno: session.user.id }).select().single());
    await sb().from('miembros').insert({ workspace_id: ws.id, usuario_id: session.user.id, rol: 'admin' });
    return ws;
  };

  // ---- automatizaciones ----

  D.automatizaciones = (ws) =>
    sb().from('automatizaciones').select('*').eq('workspace_id', ws).order('actualizada_en', { ascending: false })
      .then(chequear);

  D.automatizacion = (id) =>
    sb().from('automatizaciones').select('*').eq('id', id).single().then(chequear);

  D.crearAutomatizacion = (ws, usuario, datos) =>
    sb().from('automatizaciones').insert({
      workspace_id: ws,
      creada_por: usuario,
      nombre: datos.nombre || 'Sin nombre',
      descripcion: datos.descripcion || null,
      definicion: datos.definicion || { disparador: null, pasos: [] }
    }).select().single().then(chequear);

  D.guardarAutomatizacion = (id, campos) =>
    sb().from('automatizaciones').update(campos).eq('id', id).select().single().then(chequear);

  D.borrarAutomatizacion = (id) =>
    sb().from('automatizaciones').delete().eq('id', id).then(chequear);

  // ---- conexiones ----

  D.conexiones = (ws) =>
    sb().from('conexiones').select('*').eq('workspace_id', ws).order('creada_en').then(chequear);

  D.conectar = (ws, proveedor, nombre) =>
    sb().from('conexiones').insert({ workspace_id: ws, proveedor, nombre, estado: 'pendiente' })
      .select().single().then(chequear);

  D.desconectar = (id) =>
    sb().from('conexiones').delete().eq('id', id).then(chequear);

  // ---- ejecuciones ----

  D.ejecuciones = (ws, limite = 50) =>
    sb().from('ejecuciones').select('*, automatizaciones(nombre)').eq('workspace_id', ws)
      .order('empezada_en', { ascending: false }).limit(limite).then(chequear);

  D.ejecucionesDe = (automatizacionId, limite = 5) =>
    sb().from('ejecuciones').select('*').eq('automatizacion_id', automatizacionId)
      .order('empezada_en', { ascending: false }).limit(limite).then(chequear);

  // ---- motor (worker de Cloudflare) ----
  // El front nunca toca la service role key ni las claves de las integraciones:
  // manda el token de la sesión y el worker hace el resto.

  D.api = async (camino, { metodo = 'GET', cuerpo } = {}) => {
    const { data } = await sb().auth.getSession();
    const token = data?.session?.access_token;
    const r = await fetch(camino, {
      method: metodo,
      headers: Object.assign({}, token ? { Authorization: 'Bearer ' + token } : {},
        cuerpo ? { 'Content-Type': 'application/json' } : {}),
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    let datos = null;
    try { datos = await r.json(); } catch (_) { /* respuesta vacía o HTML */ }
    if (!r.ok) throw new Error(datos?.error || 'El motor respondió HTTP ' + r.status + '.');
    if (!datos) throw new Error('El motor no está publicado en este dominio.');
    return datos;
  };

  // Corrida real: recorre los pasos y deja el resultado de cada uno.
  D.ejecutar = (automatizacion) =>
    D.api('/api/ejecutar', { metodo: 'POST', cuerpo: { automatizacion_id: automatizacion.id } })
      .then(r => r.ejecucion);

  D.aprobar = (ejecucionId) =>
    D.api('/api/ejecuciones/' + encodeURIComponent(ejecucionId) + '/aprobar', { metodo: 'POST' })
      .then(r => r.ejecucion);

  // URL del webhook y próxima corrida programada.
  D.disparador = (id) =>
    D.api('/api/disparador?automatizacion_id=' + encodeURIComponent(id));

  D.conectarGmail = (ws) =>
    D.api('/api/oauth/gmail/iniciar', { metodo: 'POST', cuerpo: { workspace_id: ws, volver: location.pathname } })
      .then(r => r.url);

  D.conectarSlack = (ws) =>
    D.api('/api/oauth/slack/iniciar', { metodo: 'POST', cuerpo: { workspace_id: ws, volver: location.pathname } })
      .then(r => r.url);

  D.salud = () => D.api('/api/salud');

  window.datos = D;
})();
