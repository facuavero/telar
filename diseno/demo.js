/* Telar · la demo del hero rota entre cinco ejemplos.
   El castellano es la fuente; i18n.js traduce lo que se va dibujando. */
(function () {
  const demo = document.querySelector('.demo');
  if (!demo) return;

  const promptEl = demo.querySelector('.prompt-text');
  const badgesEl = demo.querySelector('.understood');
  const flowEl = demo.querySelector('.flow');
  const dotsEl = demo.querySelector('.demo-dots');
  const CICLO = 15000;

  // Conector "trama": los tres hilos trenzados entre nodo y nodo.
  const TRAMA = h => `<svg class="trama live" viewBox="0 0 24 ${h}" width="24" height="${h}" aria-hidden="true">` +
    `<path class="h1" d="M12 0C3 ${h * .25} 21 ${h * .75} 12 ${h}"/>` +
    `<path class="h2" d="M12 0C21 ${h * .25} 3 ${h * .75} 12 ${h}"/>` +
    `<path class="h3" d="M12 0V${h}"/></svg>`;

  // prompt: ['t', texto] o ['m', logo, etiqueta] · nodos: [tipo, ícono, título, subtítulo, estado]
  const EJEMPLOS = [
    {
      prompt: [['t', 'Todos los lunes a las 9, resumí lo que se habló en '], ['m', 'l-slack', '#ventas'],
      ['t', ' y sumá los deals nuevos a '], ['m', 'l-sheets', 'Pipeline Q3'], ['t', '. Después avisá en el canal.']],
      badges: ['2 herramientas: Slack, Google Sheets', 'Cada lunes, 9:00', 'Aprobás antes de publicar'],
      nodos: [
        ['trigger', 'p-clock', 'Cada lunes, 9:00', '', 'ok'],
        ['action', 'l-slack', 'Leer #ventas', 'Últimos 7 días · 214 mensajes', 'ok'],
        ['ai', 'p-spark', 'Resumir y detectar deals', '5 puntos · 3 deals nuevos', 'ok'],
        ['action', 'l-sheets', 'Agregar 3 filas en Pipeline Q3', '', 'ok'],
        ['action', 'l-slack', 'Publicar resumen en #ventas', '', 'warn']
      ]
    },
    {
      prompt: [['t', 'Cuando llegue una factura a '], ['m', 'l-gmail', 'Gmail'],
      ['t', ', guardá el PDF en '], ['m', 'l-drive', 'Facturas 2026'], ['t', ' y avisá en #finanzas.']],
      badges: ['3 herramientas: Gmail, Drive, Slack', 'Cada mail con PDF adjunto', 'Archiva sin pedirte nada'],
      nodos: [
        ['trigger', 'l-gmail', 'Mail nuevo con PDF adjunto', 'Etiqueta: facturas', 'ok'],
        ['ai', 'p-spark', 'Leer proveedor, monto y fecha', 'Factura-0932 · $148.200', 'ok'],
        ['action', 'l-drive', 'Guardar en Facturas 2026', 'Renombrado por proveedor', 'ok'],
        ['action', 'l-slack', 'Avisar en #finanzas', '', 'ok']
      ]
    },
    {
      prompt: [['t', 'Cada consulta nueva que llegue a '], ['m', 'l-gmail', 'ventas@'],
      ['t', ' cargala como contacto en '], ['m', 'l-hubspot', 'HubSpot'], ['t', ' y avisame por Slack.']],
      badges: ['3 herramientas: Gmail, HubSpot, Slack', 'Al recibir cada consulta', 'Aprobás antes de crear el deal'],
      nodos: [
        ['trigger', 'l-gmail', 'Consulta nueva en ventas@', '', 'ok'],
        ['ai', 'p-spark', 'Extraer nombre, empresa y monto', '3 campos detectados', 'ok'],
        ['action', 'l-hubspot', 'Crear contacto y deal', 'Etapa: primer contacto', 'warn'],
        ['action', 'l-slack', 'Avisar al dueño de la cuenta', '', 'ok']
      ]
    },
    {
      prompt: [['t', 'Después de cada reunión de '], ['m', 'l-calendar', 'Calendar'],
      ['t', ', resumí el doc de notas y guardalo en '], ['m', 'l-notion', 'Notion'], ['t', ' con las tareas.']],
      badges: ['3 herramientas: Calendar, Docs, Notion', 'Al terminar cada reunión', 'Aprobás antes de asignar tareas'],
      nodos: [
        ['trigger', 'l-calendar', 'Terminó una reunión con cliente', '', 'ok'],
        ['action', 'l-docs', 'Leer el doc de notas', '1.400 palabras', 'ok'],
        ['ai', 'p-spark', 'Resumir y separar tareas', '6 puntos · 4 tareas', 'ok'],
        ['action', 'l-notion', 'Crear página con responsables', 'Base: Minutas', 'warn']
      ]
    },
    {
      prompt: [['t', 'Si una fila de '], ['m', 'l-sheets', 'Stock'],
      ['t', ' baja del mínimo, avisá en '], ['m', 'l-slack', '#operaciones'], ['t', ' y abrí una tarjeta en Trello.']],
      badges: ['3 herramientas: Sheets, Slack, Trello', 'Revisa cada mañana, 8:00', 'Avisa sin pedirte nada'],
      nodos: [
        ['trigger', 'p-clock', 'Cada mañana, 8:00', '', 'ok'],
        ['action', 'l-sheets', 'Leer la hoja de Stock', '214 productos', 'ok'],
        ['ai', 'p-spark', 'Detectar faltantes', '2 productos bajo el mínimo', 'ok'],
        ['action', 'l-slack', 'Avisar en #operaciones', 'Con el detalle de cada ítem', 'ok'],
        ['action', 'l-trello', 'Abrir tarjeta de reposición', '', 'ok']
      ]
    }
  ];

  const CLASE_ICONO = { trigger: 's-trigger', ai: 's-ai', action: '' };
  const esMarca = id => id.indexOf('l-') === 0;

  const verPrompt = ej => ej.prompt.map(p => p[0] === 't'
    ? p[1]
    : `<span class="mention"><svg class="brand"><use href="#${p[1]}"/></svg>${p[2]}</span>`
  ).join('') + '<span class="caret"></span>';

  const verBadges = ej => ej.badges.map(b =>
    `<span class="badge neutral"><svg class="i"><use href="#i-check"/></svg>${b}</span>`).join('');

  const verFlujo = ej => ej.nodos.map(function (n, i) {
    const tipo = n[0], icono = n[1], titulo = n[2], sub = n[3], estado = n[4];
    const svg = esMarca(icono)
      ? `<svg class="brand"><use href="#${icono}"/></svg>`
      : `<svg class="step-i ${CLASE_ICONO[tipo]}"><use href="#${icono}"/></svg>`;
    const badge = estado === 'warn'
      ? '<span class="badge warn"><svg class="i"><use href="#i-usercheck"/></svg>Espera tu OK</span>'
      : '<span class="badge ok"><svg class="i"><use href="#i-check"/></svg>OK</span>';
    const nodo = `<div class="node t-${tipo}" style="--i:${i * 2}"><div class="nmain">${svg}` +
      `<div class="ntxt"><div class="ntitle">${titulo}</div>` +
      (sub ? `<div class="nsub">${sub}</div>` : '') + `</div>${badge}</div></div>`;
    const hilo = i < ej.nodos.length - 1
      ? `<div class="tj" style="--i:${i * 2 + 1}" data-trama="26"></div>` : '';
    return nodo + hilo;
  }).join('');

  let actual = 0;
  let reloj = null;

  function pintar(i) {
    const ej = EJEMPLOS[i];
    promptEl.innerHTML = verPrompt(ej);
    badgesEl.innerHTML = verBadges(ej);
    flowEl.innerHTML = verFlujo(ej);
    flowEl.querySelectorAll('[data-trama]').forEach(el => { el.innerHTML = TRAMA(+el.dataset.trama || 30); });
    [...dotsEl.children].forEach((d, j) => d.setAttribute('aria-selected', String(j === i)));
    const activo = dotsEl.children[i];
    if (activo) { activo.style.animation = 'none'; void activo.offsetWidth; activo.style.animation = ''; }
  }

  function ir(i) {
    demo.classList.add('saliendo');
    setTimeout(() => {
      actual = (i + EJEMPLOS.length) % EJEMPLOS.length;
      pintar(actual);
      demo.classList.remove('saliendo');
    }, 280);
    reiniciar();
  }

  function reiniciar() {
    clearInterval(reloj);
    reloj = setInterval(() => ir(actual + 1), CICLO);
  }

  EJEMPLOS.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Ejemplo ' + (i + 1));
    b.addEventListener('click', () => ir(i));
    dotsEl.appendChild(b);
  });
  dotsEl.style.setProperty('--dur', CICLO + 'ms');

  // Se frena mientras lo estás mirando de cerca, y cuando la pestaña no se ve.
  demo.addEventListener('mouseenter', () => { demo.classList.add('pausa'); clearInterval(reloj); });
  demo.addEventListener('mouseleave', () => { demo.classList.remove('pausa'); reiniciar(); });
  document.addEventListener('visibilitychange', () => { document.hidden ? clearInterval(reloj) : reiniciar(); });

  pintar(0);
  reiniciar();
})();
