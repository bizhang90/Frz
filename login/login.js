(() => {
  'use strict';
  const CONFIG = window.FNB_CONFIG || {};
  const SESSION_KEY = 'FZ_EMPLOYEE_SESSION';
  const form = document.querySelector('#login-form');
  const identity = document.querySelector('#identity');
  const password = document.querySelector('#password');
  const message = document.querySelector('#login-message');
  const demoButton = document.querySelector('#demo-login');
  const submitButton = form.querySelector('button[type="submit"]');
  const togglePassword = document.querySelector('#toggle-password');
  const hasSupabase = Boolean(window.supabase && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
  const isDemo = CONFIG.APP_ENV !== 'production' || !hasSupabase;
  const client = hasSupabase ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY) : null;

  function setMessage(text, type = '') {
    message.textContent = text;
    message.className = `message ${type}`.trim();
  }

  function saveLocalSession(payload) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...payload,
      loginAt: new Date().toISOString()
    }));
  }

  async function redirectIfSignedIn() {
    const localSession = localStorage.getItem(SESSION_KEY);
    if (localSession) {
      location.replace('/nhan-vien/');
      return;
    }
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data?.session) {
      saveLocalSession({ mode: 'supabase', identity: data.session.user.email || 'Nhân viên' });
      location.replace('/nhan-vien/');
    }
  }

  togglePassword.addEventListener('click', () => {
    const showing = password.type === 'text';
    password.type = showing ? 'password' : 'text';
    togglePassword.setAttribute('aria-label', showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const account = identity.value.trim();
    const secret = password.value;
    if (!account || !secret) {
      setMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu.', 'error');
      return;
    }
    submitButton.disabled = true;
    setMessage('Đang kiểm tra tài khoản…');
    try {
      if (!client) {
        setMessage('Hệ thống chưa cấu hình Supabase Auth. Dùng nút “Vào bản demo nội bộ” để kiểm tra giao diện.', 'error');
        return;
      }
      if (!account.includes('@')) {
        setMessage('Khi dùng Supabase Auth, vui lòng đăng nhập bằng email nhân viên.', 'error');
        return;
      }
      const { data, error } = await client.auth.signInWithPassword({ email: account, password: secret });
      if (error) throw error;
      saveLocalSession({ mode: 'supabase', identity: data.user?.email || account, userId: data.user?.id || '' });
      setMessage('Đăng nhập thành công. Đang mở màn hình nhân viên…', 'success');
      location.replace('/nhan-vien/');
    } catch (error) {
      setMessage(error?.message || 'Không thể đăng nhập. Kiểm tra lại tài khoản.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  if (isDemo) {
    demoButton.hidden = false;
    demoButton.addEventListener('click', () => {
      saveLocalSession({ mode: 'demo', identity: identity.value.trim() || 'GROUP_ALL_QL', displayName: 'Nhân viên demo' });
      setMessage('Đang mở bản demo nội bộ…', 'success');
      location.replace('/nhan-vien/');
    });
  }

  redirectIfSignedIn().catch(() => {});
})();
