(() => {
  'use strict';
  const CONFIG=window.FNB_CONFIG||{};
  const SESSION_KEY='FZ_EMPLOYEE_SESSION';
  const form=document.querySelector('#login-form');
  const identity=document.querySelector('#identity');
  const password=document.querySelector('#password');
  const message=document.querySelector('#login-message');
  const demoButton=document.querySelector('#demo-login');
  const resetButton=document.querySelector('#reset-password');
  const recoveryForm=document.querySelector('#recovery-form');
  const newPassword=document.querySelector('#new-password');
  const confirmPassword=document.querySelector('#confirm-password');
  let recoveryMode=/type=(invite|recovery)/.test(location.hash+location.search)||new URLSearchParams(location.search).get('setup')==='1';
  const submitButton=form.querySelector('button[type="submit"]');
  const togglePassword=document.querySelector('#toggle-password');
  const hasSupabase=Boolean(window.supabase&&CONFIG.SUPABASE_URL&&CONFIG.SUPABASE_ANON_KEY);
  const isDemo=CONFIG.APP_ENV!=='production';
  const client=hasSupabase?window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY):null;
  function setMessage(text,type=''){message.textContent=text;message.className=`message ${type}`.trim();}
  function saveLocalSession(payload){localStorage.setItem(SESSION_KEY,JSON.stringify({...payload,loginAt:new Date().toISOString()}));}
  async function validateProfile(session){
    const {data:profile,error}=await client.rpc('fnb_get_my_profile');
    if(error) throw error;
    if(!profile?.code) throw new Error('Tài khoản chưa được liên kết với hồ sơ nhân sự. Liên hệ quản lý hệ thống.');
    saveLocalSession({mode:'supabase',identity:session.user.email||'Nhân viên',userId:session.user.id,displayName:profile.name,staffCode:profile.code});
    return profile;
  }
  async function redirectIfSignedIn(){
    if(!client||recoveryMode) return;
    const {data}=await client.auth.getSession();
    if(data?.session){await validateProfile(data.session);location.replace('/nhan-vien/');}
  }
  togglePassword.addEventListener('click',()=>{const showing=password.type==='text';password.type=showing?'password':'text';togglePassword.setAttribute('aria-label',showing?'Hiện mật khẩu':'Ẩn mật khẩu');});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const account=identity.value.trim().toLowerCase();
    const secret=password.value;
    if(!account||!secret){setMessage('Vui lòng nhập đầy đủ email và mật khẩu.','error');return;}
    if(!account.includes('@')){setMessage('Vui lòng đăng nhập bằng email nhân viên đã được cấp.','error');return;}
    if(!client){setMessage('Hệ thống production chưa cấu hình Supabase Auth.','error');return;}
    submitButton.disabled=true;setMessage('Đang xác minh tài khoản và hồ sơ nhân sự…');
    try{
      const {data,error}=await client.auth.signInWithPassword({email:account,password:secret});
      if(error) throw error;
      await validateProfile(data.session);
      setMessage('Đăng nhập thành công. Đang mở màn hình nhân viên…','success');
      location.replace('/nhan-vien/');
    }catch(error){await client.auth.signOut().catch(()=>{});localStorage.removeItem(SESSION_KEY);setMessage(error?.message||'Không thể đăng nhập.','error');}
    finally{submitButton.disabled=false;}
  });
  resetButton?.addEventListener('click',async()=>{
    const email=identity.value.trim().toLowerCase();
    if(!email.includes('@')){setMessage('Nhập email nhân viên trước khi yêu cầu đặt lại mật khẩu.','error');return;}
    if(!client){setMessage('Supabase chưa được cấu hình.','error');return;}
    resetButton.disabled=true;
    try{
      const redirectTo=`${location.origin}/login/?setup=1`;
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});
      if(error) throw error;
      setMessage('Đã gửi email đặt lại mật khẩu. Kiểm tra cả thư mục Spam.','success');
    }catch(e){setMessage(e.message||'Không gửi được email đặt lại mật khẩu.','error');}
    finally{resetButton.disabled=false;}
  });

  function showRecovery(){
    recoveryMode=true;
    form.hidden=true;
    resetButton.hidden=true;
    demoButton.hidden=true;
    recoveryForm.hidden=false;
    setMessage('Tạo mật khẩu mới tối thiểu 8 ký tự để hoàn tất tài khoản.');
  }
  recoveryForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    if(newPassword.value.length<8){setMessage('Mật khẩu phải có ít nhất 8 ký tự.','error');return;}
    if(newPassword.value!==confirmPassword.value){setMessage('Hai mật khẩu chưa trùng nhau.','error');return;}
    const button=recoveryForm.querySelector('button[type="submit"]');button.disabled=true;
    try{
      const {data,error}=await client.auth.updateUser({password:newPassword.value});
      if(error)throw error;
      const {data:sessionData}=await client.auth.getSession();
      if(!sessionData?.session)throw new Error('Không lấy được phiên đăng nhập sau khi đặt mật khẩu');
      await validateProfile(sessionData.session);
      setMessage('Đã thiết lập mật khẩu. Đang mở hệ thống…','success');
      history.replaceState(null,'',location.pathname);
      location.replace('/nhan-vien/');
    }catch(e){setMessage(e.message||'Không thể đặt mật khẩu. Yêu cầu gửi lại email mời.','error');}
    finally{button.disabled=false;}
  });
  client?.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY'||/type=(invite|recovery)/.test(location.hash)||new URLSearchParams(location.search).get('setup')==='1') showRecovery();
  });
  if(recoveryMode) showRecovery();

  if(isDemo&&!recoveryMode){demoButton.hidden=false;demoButton.addEventListener('click',()=>{saveLocalSession({mode:'demo',identity:'GROUP_ALL_QL',displayName:'Quản trị demo'});location.replace('/nhan-vien/');});}
  const err=new URLSearchParams(location.search).get('error');
  if(err==='profile') setMessage('Tài khoản chưa liên kết với hồ sơ nhân sự hoặc đã ngừng hoạt động.','error');
  if(err==='session') setMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.','error');
  if(err==='supabase-config') setMessage('Hệ thống chưa hoàn tất cấu hình Supabase production.','error');
  redirectIfSignedIn().catch(()=>{});
})();
