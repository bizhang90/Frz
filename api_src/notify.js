function maskPhone(text=''){
  return String(text).replace(/(?:\+?84|0)(?:\d[\s.-]?){8,10}\d/g, m => {
    const d = m.replace(/\D/g,'');
    return d.length < 8 ? '***' : d.slice(0,3) + '****' + d.slice(-2);
  });
}
async function sendTelegram(text){
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID_FNB || process.env.TELEGRAM_CHAT_ID;
  if(!token || !chatId) return { skipped:true, reason:'missing TELEGRAM_BOT_TOKEN/CHAT_ID' };
  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:'POST', headers:{'content-type':'application/json'},
    body: JSON.stringify({ chat_id:chatId, text: maskPhone(text), parse_mode:'HTML', disable_web_page_preview:true })
  });
  return { ok: resp.ok, status: resp.status, body: await resp.text() };
}
async function sendZaloGateway(route, text){
  const url = process.env.ZALO_GATEWAY_URL;
  const secret = process.env.ZALO_GATEWAY_SECRET;
  if(!url || !secret) return { skipped:true, reason:'missing ZALO_GATEWAY_URL/SECRET' };
  const endpoint = url.endsWith('/send') ? url : url.replace(/\/$/,'') + '/send';
  const resp = await fetch(endpoint, {
    method:'POST', headers:{'content-type':'application/json','x-zalo-gateway-secret':secret},
    body: JSON.stringify({ route: route || 'fnb', text: maskPhone(text) })
  });
  return { ok: resp.ok, status: resp.status, body: await resp.text() };
}
async function notifyGroup({ route='fnb', text }){
  const safe = maskPhone(text || '');
  const results = [];
  results.push(await sendTelegram(safe).catch(e=>({ok:false,error:e.message})));
  results.push(await sendZaloGateway(route, safe).catch(e=>({ok:false,error:e.message})));
  return { ok:true, safeText:safe, results };
}
module.exports = { maskPhone, notifyGroup };
