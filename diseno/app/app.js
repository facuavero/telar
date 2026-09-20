// Telar · app. Render simple: un estado, funciones que pintan cada vista.
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const APPS = [
    { id: 'slack', nombre: 'Slack', letra: '#' },
    { id: 'gmail', nombre: 'Gmail', letra: 'M' },
    { id: 'drive', nombre: 'Google Drive', letra: 'Dr' },
    { id: 'sheets', nombre: 'Google Sheets', letra: 'S' },
    { id: 'notion', nombre: 'Notion', letra: 'N' },
    { id: 'webhook', nombre: 'Webhook', letra: 'W' }
  ];

  const TIPOS_PASO = [
    ['ia', 'Pedirle algo a la IA'],
    ['accion', 'Acción en una herramienta'],
    ['condicion', 'Condición'],
    ['aprobacion', 'Esperar aprobación'],
    ['aviso', 'Avisar']
  ];

  const est = { session: null, perfil: null, ws: null, autom: [], conex: [], ejec: [], editando: null };

  // ---------- utilidades ----------

  function aviso(txt) {
    if (!txt) { $('#aviso').hidden = true; return; }
    $('#aviso-txt').textContent = txt;
    $('#aviso').hidden = false;
  }

  function explicar(e) {
    const msg = e?.message || String(e);
    if (e?.code === '42501' || /row-level security/i.test(msg))
      return 'La base rechazó la operación por permisos (RLS). Falta correr db/reparar-rls.sql en Supabase.';
    return msg;
  }

  const fecha = iso => iso ? new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const PINTA = { ok: 'ok', error: 'err', corriendo: 'warn', cancelada: '', esperando_aprobacion: 'warn' };

  // ---------- navegación ----------

  function ir(vista, titulo) {
    $$('.vista').forEach(v => v.classList.toggle('on', v.id === 'v-' + vista));
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.vista === vista));
    $('#crumb').innerHTML = '<b>' + esc(titulo || vista[0].toUpperCase() + vista.slice(1)) + '</b>';
    location.hash = vista === 'editor' ? '#editor/' + est.editando?.id : '#' + vista;
  }

  // ---------- render ----------

  function pintarSidebar() {
    $('#ws-nombre').textContent = est.ws?.nombre || 'Mi espacio';
    $('#ws-plan').textContent = 'Workspace · Plan ' + (est.ws?.plan || 'gratis');
    const nombre = est.perfil?.nombre || (est.session.user.email || '').split('@')[0];
    $('#me-nombre').textContent = nombre;
    $('#me-mail').textContent = est.session.user.email || '';
    $('#me-ini').textContent = (nombre[0] || '?').toUpperCase();
    $('#hola-nombre').textContent = nombre;
    $('#c-autom').textContent = est.autom.length || '';
    const activas = est.conex.filter(c => c.estado === 'activa' || c.estado === 'pendiente').length;
    $('#c-conex').textContent = activas || '';
    $('#m-conex').textContent = activas + ' / ' + APPS.length;
    $('#m-conex-bar').style.width = Math.round(activas / APPS.length * 100) + '%';
    const mes = est.ejec.length;
    $('#m-tareas').textContent = mes + ' / 500';
    $('#m-tareas-bar').style.width = Math.min(100, Math.round(mes / 500 * 100)) + '%';
  }

  function filaAutom(a) {
    const pasos = a.definicion?.pasos?.length || 0;
    return `<div class="fila" data-abrir="${a.id}">
      <span class="punto ${a.estado === 'activa' ? 'ok' : a.estado === 'pausada' ? 'warn' : ''}"></span>
      <div class="fila-txt"><b>${esc(a.nombre)}</b><small>${esc(a.descripcion || (pasos + ' paso' + (pasos === 1 ? '' : 's')))}</small></div>
      <span class="badge ${a.estado === 'activa' ? 'ok' : ''}">${a.estado}</span>
      <small class="cuando">${fecha(a.actualizada_en)}</small>
      <button class="icon-btn" data-borrar="${a.id}" title="Borrar"><svg class="i sm"><use href="#i-x"/></svg></button>
    </div>`;
  }

  function pintarInicio() {
    $('#k-activas').textContent = est.autom.filter(a => a.estado === 'activa').length;
    $('#k-ejec').textContent = est.ejec.length;
    $('#k-error').textContent = est.ejec.filter(e => e.estado === 'error').length;
    const ult = est.autom.slice(0, 5);
    $('#recientes').innerHTML = ult.length
      ? ult.map(filaAutom).join('')
      : `<div class="vacio">Todavía no hay automatizaciones. Escribí arriba lo que querés que pase.</div>`;
  }

  function pintarAutom() {
    $('#lista-autom').innerHTML = est.autom.length
      ? est.autom.map(filaAutom).join('')
      : `<div class="vacio">Nada acá todavía. Creá la primera con el botón “Nueva”.</div>`;
  }

  function pintarConex() {
    $('#lista-conex').innerHTML = APPS.map(app => {
      const c = est.conex.find(x => x.proveedor === app.id);
      return `<div class="app-card">
        <span class="app ${app.id}">${app.letra}</span>
        <div><b>${esc(app.nombre)}</b><small>${c ? 'Conectada · ' + c.estado : 'Sin conectar'}</small></div>
        ${c
          ? `<button class="btn btn-sm btn-ghost" data-desconectar="${c.id}">Quitar</button>`
          : `<button class="btn btn-sm btn-outline" data-conectar="${app.id}">Conectar</button>`}
      </div>`;
    }).join('');
  }

  function pintarActividad() {
    $('#lista-ejec').innerHTML = est.ejec.length
      ? est.ejec.map(e => `<div class="fila">
          <span class="punto ${PINTA[e.estado] || ''}"></span>
          <div class="fila-txt"><b>${esc(e.automatizaciones?.nombre || 'Automatización borrada')}</b>
            <small>${esc(e.error || (e.pasos?.length || 0) + ' pasos')}</small></div>
          <span class="badge ${e.estado === 'ok' ? 'ok' : e.estado === 'error' ? 'err' : ''}">${e.estado}</span>
          <small class="cuando">${fecha(e.empezada_en)}</small>
        </div>`).join('')
      : `<div class="vacio">Sin ejecuciones todavía. Probá una automatización desde el editor.</div>`;
  }

  // ---------- editor ----------

  function pintarPasos() {
    const pasos = est.editando.definicion.pasos || [];
    $('#e-pasos').innerHTML = pasos.length ? pasos.map((p, i) => `
      <div class="paso" data-i="${i}">
        <span class="npaso">${i + 1}</span>
        <select data-campo="tipo">${TIPOS_PASO.map(([v, t]) =>
          `<option value="${v}"${p.tipo === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
        <input data-campo="detalle" value="${esc(p.detalle || '')}" placeholder="Qué hace este paso">
        <button class="icon-btn" data-quitar="${i}" title="Quitar"><svg class="i sm"><use href="#i-x"/></svg></button>
      </div>`).join('')
      : `<div class="vacio chico">Sin pasos. Agregá el primero.</div>`;
  }

  async function abrirEditor(id) {
    est.editando = await datos.automatizacion(id);
    est.editando.definicion = est.editando.definicion || { disparador: null, pasos: [] };
    est.editando.definicion.pasos = est.editando.definicion.pasos || [];
    $('#e-nombre').value = est.editando.nombre;
    $('#e-desc').value = est.editando.descripcion || '';
    const d = est.editando.definicion.disparador || {};
    $('#e-disp-tipo').value = d.tipo || 'manual';
    $('#e-disp-conf').value = d.detalle || '';
    $('#e-estado').textContent = est.editando.estado === 'activa' ? 'Pausar' : 'Activar';
    pintarPasos();
    ir('editor', est.editando.nombre);
    datos.ejecucionesDe(id).then(list => {
      $('#e-ejec').innerHTML = list.length
        ? list.map(e => `<div class="mini-ejec"><span class="badge ${e.estado === 'ok' ? 'ok' : 'err'}">${e.estado}</span>
            <small>${fecha(e.empezada_en)}</small><small>${esc(e.error || (e.pasos?.length || 0) + ' pasos')}</small></div>`).join('')
        : `<div class="vacio chico">Todavía no corrió.</div>`;
    }).catch(e => aviso(explicar(e)));
  }

  function leerEditor() {
    return {
      nombre: $('#e-nombre').value.trim() || 'Sin nombre',
      descripcion: $('#e-desc').value.trim() || null,
      definicion: {
        disparador: { tipo: $('#e-disp-tipo').value, detalle: $('#e-disp-conf').value.trim() || null },
        pasos: [...$$('#e-pasos .paso')].map(el => ({
          tipo: el.querySelector('[data-campo="tipo"]').value,
          detalle: el.querySelector('[data-campo="detalle"]').value.trim()
        }))
      }
    };
  }

  // ---------- acciones ----------

  async function recargar() {
    const [autom, conex, ejec] = await Promise.all([
      datos.automatizaciones(est.ws.id).catch(e => (aviso(explicar(e)), [])),
      datos.conexiones(est.ws.id).catch(() => []),
      datos.ejecuciones(est.ws.id).catch(() => [])
    ]);
    est.autom = autom; est.conex = conex; est.ejec = ejec;
    pintarSidebar(); pintarInicio(); pintarAutom(); pintarConex(); pintarActividad();
  }

  async function crearDesdeComposer() {
    const texto = $('#ctext').textContent.trim();
    if (!texto) { $('#ctext').focus(); return; }
    const nombre = texto.length > 60 ? texto.slice(0, 57).trim() + '…' : texto;
    try {
      const a = await datos.crearAutomatizacion(est.ws.id, est.session.user.id, {
        nombre,
        descripcion: texto,
        definicion: { disparador: { tipo: 'manual', detalle: null }, pasos: [{ tipo: 'ia', detalle: texto }] }
      });
      $('#ctext').textContent = '';
      await recargar();
      abrirEditor(a.id);
    } catch (e) { aviso(explicar(e)); }
  }

  // ---------- arranque ----------

  async function arrancar() {
    if (!window.telar) {
      $('#cargando').innerHTML = '<div class="fallo"><b>No cargó la librería de Supabase.</b>' +
        '<p>Revisá la conexión y recargá.</p></div>';
      return;
    }
    if (telar.sinLibreria) {
      $('#cargando').innerHTML = '<div class="fallo"><b>No cargó la librería de Supabase.</b>' +
        '<p>Falta <code>vendor/supabase.js</code> o la red lo bloqueó. Recargá.</p></div>';
      return;
    }
    if (telar.sinConfigurar) {
      $('#cargando').textContent = 'Falta configurar supabase-config.js.';
      return;
    }
    const session = await telar.requireSession('../login.html');
    if (!session) return;
    est.session = session;

    try {
      est.perfil = await datos.perfil(session);
      est.ws = await datos.workspaceActivo(session);
    } catch (e) {
      $('#cargando').innerHTML = '<div class="fallo"><b>No se pudo abrir el workspace.</b><p>' + esc(explicar(e)) + '</p></div>';
      return;
    }

    $('#cargando').hidden = true;
    $('#shell').hidden = false;
    await recargar();

    const ruta = location.hash.slice(1);
    if (ruta.startsWith('editor/')) abrirEditor(ruta.split('/')[1]).catch(() => ir('inicio'));
    else ir(['automatizaciones', 'integraciones', 'actividad'].includes(ruta) ? ruta : 'inicio');
  }

  // ---------- eventos ----------

  document.addEventListener('click', async (ev) => {
    const t = ev.target;
    const nav = t.closest('#nav a');
    if (nav) return ir(nav.dataset.vista);

    if (t.closest('#btn-nueva, #btn-nueva-2')) {
      try {
        const a = await datos.crearAutomatizacion(est.ws.id, est.session.user.id, { nombre: 'Nueva automatización' });
        await recargar();
        return abrirEditor(a.id);
      } catch (e) { return aviso(explicar(e)); }
    }

    if (t.closest('#btn-crear')) return crearDesdeComposer();
    if (t.closest('#btn-refrescar')) return recargar();
    if (t.closest('#btn-volver')) { est.editando = null; return ir('automatizaciones'); }

    if (t.closest('#btn-salir')) { await telar.signOut(); location.href = '../landing.html'; return; }

    const borrar = t.closest('[data-borrar]');
    if (borrar) {
      ev.stopPropagation();
      if (!confirm('¿Borrar esta automatización? No se puede deshacer.')) return;
      try { await datos.borrarAutomatizacion(borrar.dataset.borrar); await recargar(); }
      catch (e) { aviso(explicar(e)); }
      return;
    }

    const abrir = t.closest('[data-abrir]');
    if (abrir) return abrirEditor(abrir.dataset.abrir).catch(e => aviso(explicar(e)));

    const conectar = t.closest('[data-conectar]');
    if (conectar) {
      const app = APPS.find(a => a.id === conectar.dataset.conectar);
      try { await datos.conectar(est.ws.id, app.id, app.nombre); await recargar(); }
      catch (e) { aviso(explicar(e)); }
      return;
    }

    const quitar = t.closest('[data-desconectar]');
    if (quitar) {
      try { await datos.desconectar(quitar.dataset.desconectar); await recargar(); }
      catch (e) { aviso(explicar(e)); }
      return;
    }

    // --- editor ---
    if (t.closest('#e-add-paso')) {
      est.editando.definicion.pasos = leerEditor().definicion.pasos.concat({ tipo: 'accion', detalle: '' });
      return pintarPasos();
    }
    const quitarPaso = t.closest('[data-quitar]');
    if (quitarPaso) {
      const pasos = leerEditor().definicion.pasos;
      pasos.splice(Number(quitarPaso.dataset.quitar), 1);
      est.editando.definicion.pasos = pasos;
      return pintarPasos();
    }
    if (t.closest('#e-guardar')) {
      try {
        est.editando = await datos.guardarAutomatizacion(est.editando.id, leerEditor());
        aviso(null); await recargar();
        t.closest('#e-guardar').textContent = 'Guardado';
        setTimeout(() => { const b = $('#e-guardar'); if (b) b.textContent = 'Guardar'; }, 1200);
      } catch (e) { aviso(explicar(e)); }
      return;
    }
    if (t.closest('#e-estado')) {
      const nuevo = est.editando.estado === 'activa' ? 'pausada' : 'activa';
      try {
        est.editando = await datos.guardarAutomatizacion(est.editando.id, { ...leerEditor(), estado: nuevo });
        $('#e-estado').textContent = nuevo === 'activa' ? 'Pausar' : 'Activar';
        await recargar();
      } catch (e) { aviso(explicar(e)); }
      return;
    }
    if (t.closest('#e-probar')) {
      try {
        est.editando = await datos.guardarAutomatizacion(est.editando.id, leerEditor());
        await datos.probar(est.ws.id, est.editando);
        await recargar();
        await abrirEditor(est.editando.id);
      } catch (e) { aviso(explicar(e)); }
      return;
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey) && ev.target.id === 'ctext') crearDesdeComposer();
    if (ev.key === 'n' && !/INPUT|TEXTAREA/.test(ev.target.tagName) && !ev.target.isContentEditable) {
      const b = $('#btn-nueva'); if (b) b.click();
    }
  });

  arrancar();
})();
