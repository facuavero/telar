// Telar · helpers de auth sobre Supabase. Cargar después de supabase-js y supabase-config.js.
(function () {
  const cfg = window.TELAR_SUPABASE || {};
  const sinConfigurar = !cfg.url || cfg.url.includes("TU-PROYECTO");

  const telar = { sinConfigurar };

  if (!sinConfigurar) {
    telar.sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  telar.signUp = (email, password) =>
    telar.sb.auth.signUp({ email, password });

  telar.signIn = (email, password) =>
    telar.sb.auth.signInWithPassword({ email, password });

  telar.signOut = () => telar.sb.auth.signOut();

  telar.getSession = async () => (await telar.sb.auth.getSession()).data.session;

  // Para páginas protegidas: si no hay sesión, redirige al login.
  telar.requireSession = async (redirectTo) => {
    if (sinConfigurar) return null;
    const session = await telar.getSession();
    if (!session) window.location.href = redirectTo || "login.html";
    return session;
  };

  // Para login/registro: si ya hay sesión, redirige a la cuenta.
  telar.redirectIfSession = async (redirectTo) => {
    if (sinConfigurar) return null;
    const session = await telar.getSession();
    if (session) window.location.href = redirectTo || "cuenta.html";
    return session;
  };

  window.telar = telar;
})();
