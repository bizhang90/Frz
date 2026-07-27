const { URL } = require('url');
const crypto = require('crypto');
const { getAdminClient, requirePermission, insertLog } = require('./supabase');
const { notifyGroup, maskPhone } = require('./notify');
const { aiReply, classifyMessage } = require('./fnb-ai');
const { syncKiotViet } = require('./kiotviet');

function send(res, code, data){
  res.statusCode=code;
  res.setHeader('content-type','application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let data='';
    req.on('data',c=>{ data+=c; if(data.length>2_000_000) req.destroy(); });
    req.on('end',()=>{ try{ resolve(data ? JSON.parse(data) : {}); }catch(_){ resolve({ raw:data }); } });
    req.on('error',reject);
  });
}
function pathOf(req){
  const u = new URL(req.url, 'http://localhost');
  return u.pathname.replace(/^\/api\/?/,'').replace(/\/$/,'') || 'health';
}
function cleanText(value, max=250){ return String(value || '').trim().slice(0,max); }
function cleanEmail(value){
  const email=cleanText(value,320).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error('Email nhân viên không hợp lệ'),{statusCode:400});
  return email;
}
function cleanMinutes(value, fallback=480){
  const n=Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(0,Math.min(1440,n)) : fallback;
}
function codePrefix(unitCode, role){ return String(role).toUpperCase()==='MANAGER' ? `${unitCode}_QL` : `${unitCode}_`; }
async function nextStaffCode(sb, unitCode, role){
  const isManager=String(role).toUpperCase()==='MANAGER';
  const prefix=codePrefix(unitCode,role);
  const { data, error }=await sb.from('fnb_staff').select('code').like('code',`${prefix}%`);
  if(error) throw error;
  const codes=(data||[]).map(x=>x.code);
  if(isManager && !codes.includes(`${unitCode}_QL`)) return `${unitCode}_QL`;
  const nums=codes.map(code=>Number((code.match(/(?:_QL)?(\d+)$/)||[])[1]||0));
  const next=Math.max(0,...nums)+1;
  return isManager ? `${unitCode}_QL${String(next).padStart(2,'0')}` : `${unitCode}_${String(next).padStart(2,'0')}`;
}
async function findAuthUserByEmail(sb,email){
  for(let page=1;page<=10;page++){
    const { data,error }=await sb.auth.admin.listUsers({page,perPage:1000});
    if(error) throw error;
    const user=(data?.users||[]).find(x=>String(x.email||'').toLowerCase()===email);
    if(user) return user;
    if((data?.users||[]).length<1000) break;
  }
  return null;
}
async function handleStaffInvite(req,res){
  if(req.method!=='POST') return send(res,405,{ok:false,error:'Method not allowed'});
  const body=await readBody(req);
  const unitCode=cleanText(body.unit_code,80);
  const ctx=await requirePermission(req,'hr',unitCode);
  const email=cleanEmail(body.email);
  const requesterRole=String(ctx.staff.role||'').toUpperCase();
  const role=['STAFF','MANAGER','ADMIN'].includes(String(body.role||'STAFF').toUpperCase()) ? String(body.role||'STAFF').toUpperCase() : 'STAFF';
  if(role==='ADMIN' && requesterRole!=='ADMIN') return send(res,403,{ok:false,error:'Chỉ ADMIN được tạo ADMIN'});
  const allowedPermissions=['dashboard','attendance','finance','customers','hr','kiot','hotel','settings'];
  let permissions=Array.isArray(body.permissions) ? body.permissions : String(body.permissions||'attendance').split(',');
  permissions=[...new Set(permissions.map(x=>cleanText(x,30)).filter(x=>allowedPermissions.includes(x)))];
  if(requesterRole!=='ADMIN') permissions=permissions.filter(p=>(ctx.staff.permissions||[]).includes(p));
  if(!permissions.includes('attendance') && body.work_mode!=='no_attendance') permissions.unshift('attendance');

  const { data:existingProfile }=await ctx.sb.from('fnb_staff').select('code,auth_user_id,email').ilike('email',email).maybeSingle();
  if(existingProfile?.auth_user_id) return send(res,409,{ok:false,error:'Email này đã liên kết với nhân sự '+existingProfile.code});

  let authUser=await findAuthUserByEmail(ctx.sb,email);
  let inviteSent=false;
  if(!authUser){
    const redirectTo=process.env.FNB_AUTH_REDIRECT_URL || 'https://friendzonegroup.net/login/?setup=1';
    const { data,error }=await ctx.sb.auth.admin.inviteUserByEmail(email,{redirectTo,data:{staff_name:cleanText(body.name,150),unit_code:unitCode}});
    if(error) throw Object.assign(new Error(error.message),{statusCode:400});
    authUser=data?.user;
    inviteSent=true;
  }
  if(!authUser?.id) throw Object.assign(new Error('Không tạo được tài khoản Supabase Auth'),{statusCode:500});

  const code=existingProfile?.code || await nextStaffCode(ctx.sb,unitCode,role);
  const row={
    code,
    auth_user_id:authUser.id,
    email,
    name:cleanText(body.name,150)||email,
    phone:cleanText(body.phone,30)||null,
    unit_code:unitCode,
    role,
    position:cleanText(body.position,120)||null,
    department:cleanText(body.department,120)||null,
    salary_type:['monthly','hourly','daily'].includes(body.salary_type)?body.salary_type:'monthly',
    base_salary:Math.max(0,Number(body.base_salary)||0),
    hourly_rate:Math.max(0,Number(body.hourly_rate)||0),
    work_mode:body.work_mode==='no_attendance'?'no_attendance':'hourly',
    expected_daily_minutes:cleanMinutes(body.expected_daily_minutes,480),
    employee_status:['active','probation','suspended','left'].includes(body.employee_status)?body.employee_status:'active',
    permissions,
    active:true,
    joined_on:body.joined_on||new Date().toISOString().slice(0,10),
    updated_at:new Date().toISOString()
  };
  const { data:staff,error:staffError }=await ctx.sb.from('fnb_staff').upsert(row,{onConflict:'code'}).select().single();
  if(staffError) throw Object.assign(new Error(staffError.message),{statusCode:400});
  const { error:assignmentError }=await ctx.sb.from('fnb_staff_unit_assignments').upsert({staff_code:code,unit_code:unitCode,is_primary:true,active:true,effective_from:row.joined_on},{onConflict:'staff_code,unit_code'});
  if(assignmentError) throw Object.assign(new Error(assignmentError.message),{statusCode:400});
  await insertLog('hr-staff-invite',{actor:ctx.staff.code,staff_code:code,unit_code:unitCode,email,invite_sent:inviteSent}).catch(()=>{});
  return send(res,200,{ok:true,staff,inviteSent,message:inviteSent?'Đã tạo nhân sự và gửi email mời':'Đã liên kết tài khoản Auth có sẵn'});
}

async function handleStaffUpdate(req,res){
  if(!['POST','PATCH'].includes(req.method)) return send(res,405,{ok:false,error:'Method not allowed'});
  const body=await readBody(req);
  const code=cleanText(body.code,80);
  const admin=getAdminClient();
  if(!admin) throw Object.assign(new Error('Backend chưa cấu hình Supabase'),{statusCode:503});
  const {data:target,error:targetError}=await admin.from('fnb_staff').select('*').eq('code',code).maybeSingle();
  if(targetError) throw targetError;
  if(!target) throw Object.assign(new Error('Không tìm thấy nhân sự'),{statusCode:404});
  const ctx=await requirePermission(req,'hr',target.unit_code);
  const requesterRole=String(ctx.staff.role||'').toUpperCase();
  if(String(target.role||'').toUpperCase()==='ADMIN' && requesterRole!=='ADMIN') throw Object.assign(new Error('Chỉ ADMIN được sửa hồ sơ ADMIN'),{statusCode:403});
  const newUnit=cleanText(body.unit_code||target.unit_code,80);
  if(newUnit!==target.unit_code) await requirePermission(req,'hr',newUnit);
  const nextRole=['STAFF','MANAGER','ADMIN'].includes(String(body.role||target.role).toUpperCase())?String(body.role||target.role).toUpperCase():String(target.role||'STAFF').toUpperCase();
  if(nextRole==='ADMIN'&&requesterRole!=='ADMIN') throw Object.assign(new Error('Chỉ ADMIN được cấp vai trò ADMIN'),{statusCode:403});
  const allowedPermissions=['dashboard','attendance','finance','customers','hr','kiot','hotel','settings'];
  let permissions=Array.isArray(body.permissions)?body.permissions:String(body.permissions||'attendance').split(',');
  permissions=[...new Set(permissions.map(x=>cleanText(x,30)).filter(x=>allowedPermissions.includes(x)))];
  if(requesterRole!=='ADMIN') permissions=permissions.filter(p=>(ctx.staff.permissions||[]).includes(p));
  const status=['active','probation','suspended','left'].includes(body.employee_status)?body.employee_status:target.employee_status;
  const patch={
    name:cleanText(body.name,150)||target.name,
    phone:cleanText(body.phone,30)||null,
    unit_code:newUnit,
    role:nextRole,
    position:cleanText(body.position,120)||null,
    department:cleanText(body.department,120)||null,
    manager_code:cleanText(body.manager_code,80)||null,
    employee_status:status,
    active:status!=='left',
    work_mode:body.work_mode==='no_attendance'?'no_attendance':'hourly',
    expected_daily_minutes:cleanMinutes(body.expected_daily_minutes,target.expected_daily_minutes||480),
    salary_type:['monthly','hourly','daily'].includes(body.salary_type)?body.salary_type:(target.salary_type||'monthly'),
    base_salary:Math.max(0,Number(body.base_salary)||0),
    hourly_rate:Math.max(0,Number(body.hourly_rate)||0),
    joined_on:body.joined_on||target.joined_on||null,
    left_on:status==='left'?(body.left_on||target.left_on||new Date().toISOString().slice(0,10)):(body.left_on||null),
    notes:cleanText(body.notes,2000)||null,
    permissions,
    updated_at:new Date().toISOString()
  };
  const {data:staff,error}=await ctx.sb.from('fnb_staff').update(patch).eq('code',code).select().single();
  if(error) throw Object.assign(new Error(error.message),{statusCode:400});
  if(newUnit!==target.unit_code){
    const {error:disableOld}=await ctx.sb.from('fnb_staff_unit_assignments').update({is_primary:false,active:false,effective_to:new Date().toISOString().slice(0,10)}).eq('staff_code',code).eq('unit_code',target.unit_code);
    if(disableOld) throw Object.assign(new Error(disableOld.message),{statusCode:400});
    const {error:newPrimary}=await ctx.sb.from('fnb_staff_unit_assignments').upsert({staff_code:code,unit_code:newUnit,is_primary:true,active:true,effective_from:new Date().toISOString().slice(0,10),effective_to:null},{onConflict:'staff_code,unit_code'});
    if(newPrimary) throw Object.assign(new Error(newPrimary.message),{statusCode:400});
  }
  await insertLog('hr-staff-update',{actor:ctx.staff.code,staff_code:code,patch}).catch(()=>{});
  return send(res,200,{ok:true,staff,message:'Đã cập nhật hồ sơ nhân sự'});
}

async function handleStaffAssignment(req,res){
  if(req.method!=='POST') return send(res,405,{ok:false,error:'Method not allowed'});
  const body=await readBody(req);
  const action=cleanText(body.action||'upsert',30);
  const admin=getAdminClient();
  if(!admin) throw Object.assign(new Error('Backend chưa cấu hình Supabase'),{statusCode:503});

  if(action==='deactivate'){
    const assignmentId=cleanText(body.assignment_id,80);
    const {data:assignment,error:assignmentError}=await admin.from('fnb_staff_unit_assignments').select('*').eq('id',assignmentId).maybeSingle();
    if(assignmentError) throw assignmentError;
    if(!assignment) throw Object.assign(new Error('Không tìm thấy phân công cơ sở'),{statusCode:404});
    if(assignment.is_primary) throw Object.assign(new Error('Không thể kết thúc cơ sở chính tại đây. Hãy chuyển cơ sở chính trong hồ sơ nhân sự.'),{statusCode:400});
    const {data:target,error:targetError}=await admin.from('fnb_staff').select('code,unit_code').eq('code',assignment.staff_code).maybeSingle();
    if(targetError) throw targetError;
    if(!target) throw Object.assign(new Error('Không tìm thấy nhân sự'),{statusCode:404});
    const ctx=await requirePermission(req,'hr',target.unit_code);
    await requirePermission(req,'hr',assignment.unit_code);
    const endedOn=body.effective_to||new Date().toISOString().slice(0,10);
    const {data,error}=await ctx.sb.from('fnb_staff_unit_assignments').update({active:false,effective_to:endedOn,note:cleanText(body.note,500)||assignment.note||null}).eq('id',assignmentId).select().single();
    if(error) throw Object.assign(new Error(error.message),{statusCode:400});
    await insertLog('hr-staff-assignment-deactivate',{actor:ctx.staff.code,assignment_id:assignmentId,staff_code:assignment.staff_code,unit_code:assignment.unit_code,effective_to:endedOn}).catch(()=>{});
    return send(res,200,{ok:true,assignment:data,message:'Đã kết thúc phân công cơ sở bổ sung'});
  }

  const staffCode=cleanText(body.staff_code,80);
  const unitCode=cleanText(body.unit_code,80);
  const {data:target,error:targetError}=await admin.from('fnb_staff').select('code,unit_code').eq('code',staffCode).maybeSingle();
  if(targetError) throw targetError;
  if(!target) throw Object.assign(new Error('Không tìm thấy nhân sự'),{statusCode:404});
  if(target.unit_code===unitCode) throw Object.assign(new Error('Đây đã là cơ sở chính của nhân sự'),{statusCode:400});
  const ctx=await requirePermission(req,'hr',target.unit_code);
  await requirePermission(req,'hr',unitCode);
  const from=body.effective_from||null;
  const to=body.effective_to||null;
  if(from&&to&&to<from) throw Object.assign(new Error('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu'),{statusCode:400});
  const row={staff_code:staffCode,unit_code:unitCode,is_primary:false,active:true,effective_from:from,effective_to:to,note:cleanText(body.note,500)||null};
  const {data,error}=await ctx.sb.from('fnb_staff_unit_assignments').upsert(row,{onConflict:'staff_code,unit_code'}).select().single();
  if(error) throw Object.assign(new Error(error.message),{statusCode:400});
  await insertLog('hr-staff-assignment',{actor:ctx.staff.code,...row}).catch(()=>{});
  return send(res,200,{ok:true,assignment:data,message:'Đã phân công thêm cơ sở'});
}

function vnDate(){ return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date()); }
function minutesText(value){
  const m=Math.max(0,Math.round(Number(value)||0));
  const h=Math.floor(m/60),r=m%60;
  return h?`${h}h${r?String(r).padStart(2,'0'):''}`:`${r} phút`;
}
async function handleAttendanceDailyReport(req,res){
  const secret=process.env.CRON_SECRET;
  if(!secret || req.headers.authorization!==`Bearer ${secret}`) return send(res,401,{ok:false,error:'Unauthorized cron'});
  const sb=getAdminClient();
  if(!sb) return send(res,503,{ok:false,error:'Supabase backend chưa cấu hình'});
  const date=vnDate();
  const {data:rows,error}=await sb.from('fnb_v_attendance_daily').select('*').eq('work_date',date).order('unit_code').order('staff_name');
  if(error) throw error;
  const {data:openRecords,error:openError}=await sb.from('fnb_attendance_records').select('id,staff_code,unit_code,work_date,check_in_at').is('check_out_at',null).eq('status','working').order('check_in_at');
  if(openError) throw openError;
  const staffCodes=[...new Set((openRecords||[]).map(x=>x.staff_code))];
  const unitCodes=[...new Set((openRecords||[]).map(x=>x.unit_code))];
  const {data:openStaff}=staffCodes.length?await sb.from('fnb_staff').select('code,name').in('code',staffCodes):{data:[]};
  const {data:openUnits}=unitCodes.length?await sb.from('fnb_units').select('code,name').in('code',unitCodes):{data:[]};
  const staffMap=Object.fromEntries((openStaff||[]).map(x=>[x.code,x.name]));
  const unitMap=Object.fromEntries((openUnits||[]).map(x=>[x.code,x.name]));
  const off=(rows||[]).filter(x=>['off','leave','holiday'].includes(x.day_status));
  const working=(rows||[]).filter(x=>x.day_status==='work');
  const open=(openRecords||[]).map(x=>({...x,staff_name:staffMap[x.staff_code]||x.staff_code,unit_name:unitMap[x.unit_code]||x.unit_code}));
  const lines=[`🕘 TỔNG KẾT CHẤM CÔNG ${date}`,''];
  lines.push('OFF / NGHỈ:');
  lines.push(off.length?off.map(x=>`- ${x.staff_name}`).join('\n'):'- Không có');
  lines.push('','ĐÃ CHẤM CÔNG:');
  lines.push(working.length?working.map(x=>{
    if(x.has_open_session) return `- ${x.staff_name}: chưa checkout`;
    if(Number(x.missing_minutes)>0) return `- ${x.staff_name}: thiếu ${minutesText(x.missing_minutes)}`;
    return `- ${x.staff_name}: đủ giờ (${minutesText(x.actual_minutes)})`;
  }).join('\n'):'- Chưa có dữ liệu');
  if(open.length){
    lines.push('','⚠️ PHIÊN ĐANG MỞ:');
    lines.push(open.map(x=>`- ${x.staff_name} · ${x.unit_name||x.unit_code} · vào ${new Date(x.check_in_at).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}`).join('\n'));
    lines.push('Hệ thống không tự checkout. Nhân sự cần checkout hoặc gửi điều chỉnh.');
  }
  const text=lines.join('\n');
  const notify=await notifyGroup({route:'fnb',text});
  try{ await sb.from('fnb_notification_logs').insert({channel:'attendance-daily',content:text,status:'sent',raw:{date,row_count:(rows||[]).length,notify}}); }catch(_){}
  return send(res,200,{ok:true,date,rowCount:(rows||[]).length,text,notify});
}

async function route(req,res){
  const path=pathOf(req);
  try{
    if(req.method==='OPTIONS'){ res.statusCode=204; res.end(); return; }
    if(path==='health') return send(res,200,{ok:true,app:'FriendZones F&B Ops',version:'2.5.0',time:new Date().toISOString(),supabase:!!getAdminClient()});
    if(path==='staff-invite') return await handleStaffInvite(req,res);
    if(path==='staff-update') return await handleStaffUpdate(req,res);
    if(path==='staff-assignment') return await handleStaffAssignment(req,res);
    if(path==='attendance-daily-report') return await handleAttendanceDailyReport(req,res);
    if(path==='notify-test'){
      await requirePermission(req,'settings');
      const out=await notifyGroup({route:'fnb',text:'Test FriendZones F&B Ops: thông báo nhóm không public SĐT 0912345678.'});
      await insertLog('notify-test',out).catch(()=>{});
      return send(res,200,out);
    }
    if(path==='ai-consult'){
      await requirePermission(req,'customers');
      const body=await readBody(req);
      const out=await aiReply({text:body.text||'',unitName:body.unitName||'FriendZones'});
      return send(res,200,{ok:true,...out,safeText:maskPhone(body.text||'')});
    }
    if(path==='page-message'){
      const body=await readBody(req);
      const text=body.text||body.message||'';
      const unit_code=body.unit_code||'NHA_SAIGONPHO';
      const customer_name=body.customer_name||'Khách Page';
      const c=classifyMessage(text);
      const safeText=maskPhone(text);
      const notice=`💬 KHÁCH F&B/HOTEL MỚI\nKhách: ${maskPhone(customer_name)}\nNhu cầu: ${c.intent}\nCơ sở: ${unit_code}\nƯu tiên: ${c.priority}\nNội dung: ${safeText}\nAI đã tư vấn: ${c.next}\nTrạng thái: Cần nhân sự xác nhận.`;
      const sb=getAdminClient();
      if(sb){
        await sb.from('fnb_customer_messages').insert({unit_code,customer_name,text,intent:c.intent,status:'new',created_at:new Date().toISOString(),raw:body});
        await sb.from('fnb_customer_leads').insert({unit_code,customer_name:maskPhone(customer_name),need:c.intent,source:'Facebook Page/API',status:'new',no_phone_public:true,note:c.next,created_at:new Date().toISOString()});
      }
      const notify=await notifyGroup({route:'fnb',text:notice});
      return send(res,200,{ok:true,classify:c,notice,notify});
    }
    if(path==='kiotviet-sync'){
      const body=await readBody(req);
      await requirePermission(req,'kiot',body.unit||null);
      const out=await syncKiotViet({unit:body.unit||'GROUP_ALL'});
      await insertLog('kiotviet-sync',out).catch(()=>{});
      return send(res,200,out);
    }
    if(path==='meta-webhook'){
      if(req.method==='GET'){
        const u=new URL(req.url,'http://localhost');
        const verifyToken=process.env.META_VERIFY_TOKEN||process.env.FNB_META_VERIFY_TOKEN;
        if(u.searchParams.get('hub.verify_token')===verifyToken){res.statusCode=200;res.end(u.searchParams.get('hub.challenge')||'');return;}
        res.statusCode=403;res.end('verify token mismatch');return;
      }
      const body=await readBody(req);
      await insertLog('meta-webhook',body).catch(()=>{});
      return send(res,200,{ok:true,received:true});
    }
    if(path==='kiot-webhook'){
      const secret=process.env.KIOTVIET_WEBHOOK_SECRET;
      if(secret&&req.headers['x-kiotviet-signature']&&req.headers['x-kiotviet-signature']!==secret) return send(res,403,{ok:false,error:'bad signature'});
      const body=await readBody(req);
      await insertLog('kiot-webhook',body).catch(()=>{});
      return send(res,200,{ok:true});
    }
    return send(res,404,{ok:false,error:'Unknown API path',path});
  }catch(error){
    const status=Number(error.statusCode)||500;
    console.error(path,error);
    return send(res,status,{ok:false,error:error.message||'Lỗi hệ thống',requestId:crypto.randomUUID()});
  }
}
module.exports={route};
