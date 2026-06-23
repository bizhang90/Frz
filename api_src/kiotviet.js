const { getAdminClient } = require('./supabase');
async function getKiotToken(){
  const retailer = process.env.KIOTVIET_RETAILER;
  const client_id = process.env.KIOTVIET_CLIENT_ID;
  const client_secret = process.env.KIOTVIET_CLIENT_SECRET;
  if(!retailer || !client_id || !client_secret) return null;
  const body = new URLSearchParams({ scopes:'PublicApi.Access', grant_type:'client_credentials', client_id, client_secret });
  const resp = await fetch('https://id.kiotviet.vn/connect/token', { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body });
  if(!resp.ok) throw new Error('KiotViet token failed: '+resp.status+' '+await resp.text());
  const js = await resp.json();
  return { token: js.access_token, retailer };
}
async function kiotFetch(path){
  const tk = await getKiotToken();
  if(!tk) return { skipped:true, reason:'missing KIOTVIET env' };
  const base = process.env.KIOTVIET_API_BASE || 'https://public.kiotapi.com';
  const resp = await fetch(base + path, { headers:{ Authorization:'Bearer '+tk.token, Retailer:tk.retailer } });
  if(!resp.ok) throw new Error('KiotViet fetch failed: '+resp.status+' '+await resp.text());
  return await resp.json();
}
async function syncKiotViet({ unit='GROUP_ALL' }={}){
  const sb = getAdminClient();
  const token = await getKiotToken();
  if(!token) return { ok:false, message:'Chưa cấu hình KIOTVIET_RETAILER / CLIENT_ID / CLIENT_SECRET. App đang chạy dữ liệu demo.', unit };
  const branches = await kiotFetch('/branches?pageSize=100');
  if(sb && Array.isArray(branches.data)){
    const rows = branches.data.map(b => ({ kiot_id:String(b.id), name:b.branchName || b.name, address:b.address || '', raw:b, updated_at:new Date().toISOString() }));
    await sb.from('fnb_kiot_branches').upsert(rows, { onConflict:'kiot_id' });
  }
  return { ok:true, message:'Đã gọi KiotViet API. Bản v1 sync branch trước, invoice/stock mở ở vòng tiếp theo.', branches: branches.data?.length || 0 };
}
module.exports = { syncKiotViet, kiotFetch };
