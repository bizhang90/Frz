const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function assert(ok,msg){if(!ok)throw new Error(msg);}
const app=read('nhan-vien/app.js');
const sql=read('supabase/005_hr_attendance_production.sql');
const vercel=JSON.parse(read('vercel.json'));
const config=read('nhan-vien/config.js');
assert(config.includes("APP_ENV: 'production'"),'config.js is not production');
assert(!app.includes('activeStaffSelect'),'Employee can still select another staff member');
assert(!app.includes('autoOffDemo'),'Legacy automatic OFF remains');
assert(sql.includes('uq_fnb_attendance_one_open_per_staff'),'Missing duplicate-open guard');
assert(sql.includes('fnb_check_in'),'Missing check-in RPC');
assert(sql.includes('fnb_check_out'),'Missing check-out RPC');
assert(sql.includes('fnb_attendance_audit_logs'),'Missing attendance audit');
assert(sql.includes('late_minutes')&&sql.includes('early_leave_minutes'),'Missing late/early reporting');
assert(sql.includes('schedule_exception'),'Missing schedule/location exception tracking');
assert(sql.includes('check_in_request_id=p_request_id')&&sql.includes('check_out_request_id=p_request_id'),'Missing idempotent retry handling');
assert(sql.includes('fnb_unit_location_audit_logs'),'Missing location audit');
assert(sql.includes('revoke all on all tables in schema public from anon'),'Anon table access not revoked');
assert(!sql.includes('create policy "fnb_internal_open_select"'),'Open demo RLS policy found');
assert(vercel.headers.some(x=>(x.headers||[]).some(h=>h.key==='Permissions-Policy'&&h.value.includes('geolocation=(self)'))),'Geolocation is not enabled for self');
assert((vercel.crons||[]).some(x=>x.path==='/api/attendance-daily-report'),'Attendance report cron missing');
assert(app.includes('exportAttendanceCsv'),'CSV attendance export missing');
assert(app.includes('fetchPaged'),'Paginated data loader missing');
assert(app.includes('cancelOwnRequest'),'Pending-request cancellation missing');
assert(app.includes('staff-edit-select'),'Full staff profile editor missing');
assert(app.includes('deactivateAssignment')&&app.includes('deactivate-assignment'),'Secondary assignment lifecycle is incomplete');
assert(app.includes('Production never restores operational, salary or attendance data from localStorage'),'Production localStorage hardening missing');
assert(sql.includes('uq_fnb_staff_one_active_primary_assignment'),'Missing one-primary-assignment guard');
assert(sql.includes("fnb_has_permission('hr',v_row.unit_code)")&&sql.includes("fnb_has_permission('hr',v_adj.unit_code)"),'HR approval functions are not permission-scoped');
assert(sql.includes('from public,anon'),'Default PUBLIC function execution was not revoked');
assert(fs.existsSync(path.join(root,'supabase/007_post_deploy_verification.sql')),'Post-deploy verification SQL missing');
const suspicious=[];
for(const file of ['nhan-vien/config.js','nhan-vien/config.example.js','api_src/router.js','api_src/supabase.js']){
  const t=read(file);
  if(/SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][A-Za-z0-9_-]{20,}/.test(t))suspicious.push(file);
}
assert(!suspicious.length,'Potential service key committed: '+suspicious.join(','));
console.log('FriendZones v2.5.0 QA: PASS');
