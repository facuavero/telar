/* Telar · motor de idioma.
   Recorre los nodos de texto y los cambia según TELAR_DICT, guardando el
   original para poder volver al castellano sin recargar. */
(function () {
  // Claves normalizadas: el HTML parte frases en varias líneas.
  const squash = t => t.trim().replace(/\s+/g, ' ');
  const DICT = {};
  for (const lang of Object.keys(window.TELAR_DICT || {})) {
    DICT[lang] = {};
    for (const k of Object.keys(window.TELAR_DICT[lang])) DICT[lang][squash(k)] = window.TELAR_DICT[lang][k];
  }
  const SKIP = /^(SCRIPT|STYLE|NOSCRIPT)$/;
  const original = new WeakMap();
  let current = 'es';
  let baseTitle = document.title;

  function paint(node) {
    if (!original.has(node)) original.set(node, node.nodeValue);
    const source = original.get(node);
    const key = squash(source);
    if (!key) return;
    const table = DICT[current];
    const hit = table && table[key];
    const next = hit ? source.replace(source.trim(), hit) : source;
    if (node.nodeValue !== next) node.nodeValue = next;
  }

  function walk(root) {
    if (root.nodeType === 3) { paint(root); return; }
    if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => {
        const p = n.parentNode;
        if (!p || SKIP.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        if (p.namespaceURI === 'http://www.w3.org/2000/svg') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = it.nextNode())) paint(n);
  }

  // Fragmentos que solo existen en algunos idiomas (el orden de las palabras
  // cambia: "qué puede tocar Telar" vs "what Telar can touch").
  function tails() {
    const table = DICT[current] || {};
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
      el.textContent = table['@' + el.dataset.i18nKey] || '';
    });
  }

  function apply(lang) {
    current = DICT[lang] ? lang : 'es';
    document.documentElement.lang = current;
    walk(document.body);
    tails();
    const table = DICT[current];
    document.title = (table && table[baseTitle]) || baseTitle;
    document.dispatchEvent(new CustomEvent('telar:lang', { detail: current }));
  }

  // El contenido que dibuja el propio JS de la página (recetas, tarjetas)
  // también pasa por el traductor cuando aparece.
  new MutationObserver(muts => {
    if (current === 'es') return;
    for (const m of muts) for (const node of m.addedNodes) walk(node);
  }).observe(document.documentElement, { childList: true, subtree: true });

  let saved = 'es';
  try { saved = localStorage.getItem('telar-lang') || 'es'; } catch (e) {}

  window.telarI18n = {
    get current() { return current; },
    saved: saved,
    set: function (lang) {
      apply(lang);
      try { localStorage.setItem('telar-lang', lang); } catch (e) {}
    }
  };

  function boot() { baseTitle = document.title; if (saved !== 'es') apply(saved); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
