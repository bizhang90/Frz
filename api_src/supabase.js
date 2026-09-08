const { createClient } = require('@supabase/supabase-js');

function getAdminClient(){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });
}

function bearerToken(req){
  const value = String(req.headers.authorization || '');
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

async function getAuthenticatedStaff(req){
  const sb = getAdminClient();
  if(!sb) throw Object.assign(new Error('Backend chưa cấu hình SUPABASE_SERVICE_ROLE_KEY'), { statusCode:503 });
  const token = bearerToken(req);
  if(!token) throw Object.assign(new Error('Thiếu access token'), { statusCode:401 });
  const { data:userData, error:userError } = await sb.auth.getUser(token);
  if(userError || !userData?.user) throw Object.assign(new Error('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'), { statusCode:401 });
  const { data:staff, error:staffError } = await sb.from('fnb_staff').select('*').eq('auth_user_id', userData.user.id).maybeSingle();
  if(staffError) throw Object.assign(new Error(staffError.message), { statusCode:500 });
  if(!staff || !staff.active || !['active','probation'].includes(staff.employee_status || 'active')) {
    throw Object.assign(new Error('Tài khoản chưa được liên kết với nhân sự đang hoạt động'), { statusCode:403 });
  }
  return { sb, user:userData.user, staff };
}

async function canAccessUnit(sb, staff, unitCode){
  if(!unitCode) return false;
  if(String(staff.role).toUpperCase()==='ADMIN' || staff.unit_code==='GROUP_ALL') return true;
  if(staff.unit_code===unitCode) return true;
  const { data:target } = await sb.from('fnb_units').select('code,parent_code').eq('code',unitCode).maybeSingle();
  if(target?.parent_code===staff.unit_code) return true;
  const { data:assignments, error } = await sb.from('fnb_staff_unit_assignments')
    .select('unit_code,active,effective_from,effective_to')
    .eq('staff_code',staff.code)
    .eq('active',true);
  if(error) throw Object.assign(new Error(error.message), { statusCode:500 });
  const now = new Date().toISOString().slice(0,10);
  return (assignments || []).some(a => {
    const dateOk = (!a.effective_from || a.effective_from<=now) && (!a.effective_to || a.effective_to>=now);
    return dateOk && (a.unit_code===unitCode || a.unit_code==='GROUP_ALL' || target?.parent_code===a.unit_code);
  });
}

async function requirePermission(req, permission, unitCode){
  const ctx = await getAuthenticatedStaff(req);
  const role = String(ctx.staff.role || '').toUpperCase();
  if(role!=='ADMIN' && !(ctx.staff.permissions || []).includes(permission)) {
    throw Object.assign(new Error(`Không có quyền ${permission}`), { statusCode:403 });
  }
  if(unitCode && !(await canAccessUnit(ctx.sb, ctx.staff, unitCode))) {
    throw Object.assign(new Error('Không được phép thao tác cơ sở này'), { statusCode:403 });
  }
  return ctx;
}

async function insertLog(type, payload){
  const sb = getAdminClient();
  if(!sb) return { skipped:true };
  const { data, error } = await sb.from('fnb_sync_logs').insert({ type, payload, created_at: new Date().toISOString() }).select().single();
  if(error) throw error;
  return data;
}

module.exports = { getAdminClient, getAuthenticatedStaff, requirePermission, canAccessUnit, insertLog };
