const { createClient } = require('@supabase/supabase-js');
function getAdminClient(){
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key) return null;
  return createClient(url, key, { auth: { persistSession:false } });
}
async function insertLog(type, payload){
  const sb = getAdminClient();
  if(!sb) return { skipped:true };
  const { data, error } = await sb.from('fnb_sync_logs').insert({ type, payload, created_at: new Date().toISOString() }).select().single();
  if(error) throw error;
  return data;
}
module.exports = { getAdminClient, insertLog };
