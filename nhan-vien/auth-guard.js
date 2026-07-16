(() => {
  'use strict';
  const CONFIG = window.FNB_CONFIG || {};
  const SESSION_KEY = 'FZ_EMPLOYEE_SESSION';
  const localSession = localStorage.getItem(SESSION_KEY);
  const hasSupabase = Boolean(window.supabase && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

  function goLogin() {
    const next = encodeURIComponent(location.pathname + location.search);
    location.replace(`/login/?next=${next}`);
  }

  if (localSession) return;
  if (!hasSupabase) {
    goLogin();
    return;
  }

  const client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  client.auth.getSession().then(({ data }) => {
    if (!data?.session) {
      goLogin();
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      mode: 'supabase',
      identity: data.session.user.email || 'Nhân viên',
      userId: data.session.user.id,
      loginAt: new Date().toISOString()
    }));
  }).catch(goLogin);
})();
