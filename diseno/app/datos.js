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

  // Corrida de prueba: no toca ninguna herramienta, deja el rastro de los pasos
  // para ver el flujo completo mientras el motor no existe.
  D.probar = async (ws, automatizacion) => {
    const pasos = (automatizacion.definicion?.pasos || []).map(p => ({
      tipo: p.tipo,
      detalle: p.detalle,
      estado: 'simulado',
      en: new Date().toISOString()
    }));
    const fila = chequear(await sb().from('ejecuciones').insert({
      workspace_id: ws,
      automatizacion_id: automatizacion.id,
      estado: pasos.length ? 'ok' : 'error',
      error: pasos.length ? null : 'La automatización no tiene pasos.',
      terminada_en: new Date().toISOString(),
      pasos
    }).select().single());
    return fila;
  };

  window.datos = D;
})();
