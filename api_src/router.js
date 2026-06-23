const { URL } = require('url');
const { getAdminClient, insertLog } = require('./supabase');
const { notifyGroup, maskPhone } = require('./notify');
const { aiReply, classifyMessage } = require('./fnb-ai');
const { syncKiotViet } = require('./kiotviet');
function send(res, code, data){ res.statusCode=code; res.setHeader('content-type','application/json; charset=utf-8'); res.end(JSON.stringify(data)); }
function readBody(req){ return new Promise((resolve,reject)=>{ let data=''; req.on('data',c=>data+=c); req.on('end',()=>{ try{ resolve(data ? JSON.parse(data) : {}); }catch(e){ resolve({ raw:data }); } }); req.on('error',reject); }); }
function pathOf(req){ const u = new URL(req.url, 'http://localhost'); return u.pathname.replace(/^\/api\/?/,'').replace(/\/$/,'') || 'health'; }
async function route(req,res){
  const path = pathOf(req);
  if(req.method === 'OPTIONS'){ res.statusCode=204; res.end(); return; }
  if(path === 'health') return send(res,200,{ ok:true, app:'Friendzone F&B Ops', time:new Date().toISOString(), supabase:!!getAdminClient() });
  if(path === 'notify-test'){
    const out = await notifyGroup({ route:'fnb', text:'Test Friendzone F&B Ops: thông báo nhóm không public SĐT 0912345678.' });
    await insertLog('notify-test', out).catch(()=>{});
    return send(res,200,out);
  }
  if(path === 'ai-consult'){
    const body = await readBody(req);
    const out = await aiReply({ text:body.text || '', unitName: body.unitName || 'Friendzone' });
    return send(res,200,{ ok:true, ...out, safeText: maskPhone(body.text || '') });
  }
  if(path === 'page-message'){
    const body = await readBody(req);
    const text = body.text || body.message || '';
    const unit_code = body.unit_code || 'NHA_SAIGONPHO';
    const customer_name = body.customer_name || 'Khách Page';
    const c = classifyMessage(text);
    const safeText = maskPhone(text);
    const notice = `💬 KHÁCH F&B/HOTEL MỚI\nKhách: ${maskPhone(customer_name)}\nNhu cầu: ${c.intent}\nCơ sở: ${unit_code}\nƯu tiên: ${c.priority}\nNội dung: ${safeText}\nAI đã tư vấn: ${c.next}\nTrạng thái: Cần nhân sự xác nhận.`;
    const sb = getAdminClient();
    if(sb){
      await sb.from('fnb_customer_messages').insert({ unit_code, customer_name, text, intent:c.intent, status:'new', created_at:new Date().toISOString(), raw:body });
      await sb.from('fnb_customer_leads').insert({ unit_code, customer_name:maskPhone(customer_name), need:c.intent, source:'Facebook Page/API', status:'new', no_phone_public:true, note:c.next, created_at:new Date().toISOString() });
    }
    const notify = await notifyGroup({ route:'fnb', text:notice });
    return send(res,200,{ ok:true, classify:c, notice, notify });
  }
  if(path === 'kiotviet-sync'){
    const body = await readBody(req);
    const out = await syncKiotViet({ unit: body.unit || 'GROUP_ALL' });
    await insertLog('kiotviet-sync', out).catch(()=>{});
    return send(res,200,out);
  }
  if(path === 'meta-webhook'){
    if(req.method === 'GET'){
      const u = new URL(req.url, 'http://localhost');
      const verifyToken = process.env.META_VERIFY_TOKEN || process.env.FNB_META_VERIFY_TOKEN;
      if(u.searchParams.get('hub.verify_token') === verifyToken){ res.statusCode=200; res.end(u.searchParams.get('hub.challenge') || ''); return; }
      res.statusCode=403; res.end('verify token mismatch'); return;
    }
    const body = await readBody(req);
    await insertLog('meta-webhook', body).catch(()=>{});
    return send(res,200,{ ok:true, received:true });
  }
  if(path === 'kiot-webhook'){
    const secret = process.env.KIOTVIET_WEBHOOK_SECRET;
    if(secret && req.headers['x-kiotviet-signature'] && req.headers['x-kiotviet-signature'] !== secret) return send(res,403,{ok:false,error:'bad signature'});
    const body = await readBody(req);
    await insertLog('kiot-webhook', body).catch(()=>{});
    return send(res,200,{ ok:true });
  }
  return send(res,404,{ ok:false, error:'Unknown API path', path });
}
module.exports = { route };
