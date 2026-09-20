// Telar · si hay sesión, el nav muestra un avatar circular en vez de
// "Iniciar sesión" / "Empezar gratis". Cargar después de auth.js.
(function () {
  const right = document.querySelector('nav.top .right');
  if (!right || !window.telar || telar.sinConfigurar) return;

  const guest = [...right.querySelectorAll('a[href$="login.html"], a[href$="registro.html"]')];

  // Evita el parpadeo: si Supabase ya dejó un token, escondemos los botones
  // antes de preguntar por la sesión.
  const conToken = (() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) return true;
      }
    } catch (e) {}
    return false;
  })();
  if (conToken) guest.forEach(a => a.style.display = 'none');

  function inicial(email) {
    return (email || '?').trim().charAt(0).toUpperCase();
  }

  function montar(session) {
    guest.forEach(a => a.remove());

    const email = session.user.email || '';
    const box = document.createElement('div');
    box.className = 'avatar-box';
    box.innerHTML = `
      <button class="avatar-btn" type="button" aria-haspopup="true" aria-expanded="false" title="${email}">
        <span class="avatar-ini"></span>
      </button>
      <div class="avatar-menu" role="menu">
        <div class="avatar-mail"></div>
        <a href="app/" role="menuitem">Abrir la app</a>
        <a href="cuenta.html" role="menuitem">Tu cuenta</a>
        <button type="button" role="menuitem" class="avatar-out">Cerrar sesión</button>
      </div>`;
    box.querySelector('.avatar-ini').textContent = inicial(email);
    box.querySelector('.avatar-mail').textContent = email;
    right.appendChild(box);

    const btn = box.querySelector('.avatar-btn');
    const cerrar = () => { box.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const abierto = box.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(abierto));
    });
    document.addEventListener('click', cerrar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
    box.querySelector('.avatar-menu').addEventListener('click', e => e.stopPropagation());
    box.querySelector('.avatar-out').addEventListener('click', async () => {
      await telar.signOut();
      window.location.reload();
    });
  }

  telar.getSession().then(session => {
    if (session) montar(session);
    else guest.forEach(a => a.style.display = '');
  }).catch(() => guest.forEach(a => a.style.display = ''));
})();
