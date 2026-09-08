(() => {
  'use strict';
  const CONFIG=window.FNB_CONFIG||{};
  const SESSION_KEY='FZ_EMPLOYEE_SESSION';
  const hasSupabase=Boolean(window.supabase&&CONFIG.SUPABASE_URL&&CONFIG.SUPABASE_ANON_KEY);
  const isProduction=CONFIG.APP_ENV==='production';
  function goLogin(reason=''){
    localStorage.removeItem(SESSION_KEY);
    const next=encodeURIComponent(location.pathname+location.search);
    location.replace(`/login/?next=${next}${reason?`&error=${encodeURIComponent(reason)}`:''}`);
  }
  if(!hasSupabase){
    if(isProduction) return goLogin('supabase-config');
    if(!localStorage.getItem(SESSION_KEY)) return goLogin();
    return;
  }
  const client=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);
  Promise.resolve().then(async()=>{
    const {data,error}=await client.auth.getSession();
    if(error||!data?.session) return goLogin('session');
    const {data:profile,error:profileError}=await client.rpc('fnb_get_my_profile');
    if(profileError||!profile?.code){
      await client.auth.signOut().catch(()=>{});
      return goLogin('profile');
    }
    localStorage.setItem(SESSION_KEY,JSON.stringify({mode:'supabase',identity:data.session.user.email||'Nhân viên',userId:data.session.user.id,displayName:profile.name,staffCode:profile.code,loginAt:new Date().toISOString()}));
  }).catch(()=>goLogin('session'));
})();
