/* Tema claro/oscuro: guarda la eleccion y respeta la del sistema si no hay ninguna. */
(function () {
  const KEY = 'telar-tema';
  const root = document.documentElement;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function resolve() {
    const s = stored();
    return s === 'dark' || s === 'light' ? s : (mq.matches ? 'dark' : 'light');
  }
  function paint(tema, animar) {
    if (animar) {
      root.setAttribute('data-theme-anim', '');
      clearTimeout(paint.t);
      paint.t = setTimeout(() => root.removeAttribute('data-theme-anim'), 300);
    }
    root.setAttribute('data-theme', tema);
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.setAttribute('aria-pressed', String(tema === 'dark'));
      b.setAttribute('title', tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
      b.setAttribute('aria-label', b.getAttribute('title'));
    });
    document.dispatchEvent(new CustomEvent('telar:tema', { detail: tema }));
  }

  window.telarTema = {
    get current() { return root.getAttribute('data-theme') || 'light'; },
    set: function (tema) {
      try { localStorage.setItem(KEY, tema); } catch (e) {}
      paint(tema, true);
    },
    toggle: function () { this.set(this.current === 'dark' ? 'light' : 'dark'); }
  };

  // Si el usuario no eligio nada, seguimos al sistema.
  mq.addEventListener('change', () => { if (!stored()) paint(resolve(), true); });

  function boot() {
    paint(resolve(), false);
    document.addEventListener('click', e => {
      const b = e.target.closest('.theme-btn');
      if (b) window.telarTema.toggle();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
