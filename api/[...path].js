const { route } = require('../api_src/router');
module.exports = async function handler(req, res){
  try { await route(req, res); }
  catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('content-type','application/json; charset=utf-8');
    res.end(JSON.stringify({ ok:false, error: err.message || String(err) }));
  }
};
