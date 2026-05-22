const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const { kenyaHeaders, KENYA_IP } = require('../geoHeaders');

const FAPI    = 'https://fapi.shabiki.com';
const SHABIKI = 'https://www.shabiki.com';

// ── CORS-bypass + Kenya geo script injected into every proxied page ──
const INJECT_SCRIPT = (ip) => `
<script>
(function() {
  /* ── Kenya Geo Bypass ── */
  var PROXY  = '/api/proxy/fapi';
  var FAPI   = 'https://fapi.shabiki.com';

  // Patch globalPageData with Kenya locale before Shabiki's bundle reads it
  window.globalPageData = window.globalPageData || {};
  Object.assign(window.globalPageData, {
    lang:     'en',
    country:  'KE',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    clientIp: '${ip}'
  });

  // Override fetch to route fapi calls through our Kenya-IP proxy
  var origFetch = window.fetch.bind(window);
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.indexOf(FAPI) === 0) {
      var path = url.replace(FAPI, '');
      return origFetch(PROXY + path, opts);
    }
    return origFetch(url, opts);
  };

  // Override XMLHttpRequest similarly
  var OrigXHR = window.XMLHttpRequest;
  function ProxyXHR() {
    this._xhr = new OrigXHR();
    var self = this;
    ['readyState','status','statusText','responseText','response',
     'responseXML','responseType','responseURL','upload',
     'withCredentials','timeout'].forEach(function(p) {
      Object.defineProperty(self, p, {
        get: function() { return self._xhr[p]; },
        set: function(v) { self._xhr[p] = v; }
      });
    });
    ['onreadystatechange','onload','onerror','onprogress',
     'onabort','ontimeout','onloadstart','onloadend'].forEach(function(ev) {
      Object.defineProperty(self, ev, {
        get: function() { return self._xhr[ev]; },
        set: function(v) { self._xhr[ev] = v; }
      });
    });
  }
  ProxyXHR.prototype.open = function(m, url, async, u, p) {
    var t = (typeof url === 'string' && url.indexOf(FAPI) === 0)
      ? PROXY + url.replace(FAPI, '') : url;
    return this._xhr.open(m, t, async === undefined ? true : async, u, p);
  };
  ProxyXHR.prototype.send    = function(d) { return this._xhr.send(d); };
  ProxyXHR.prototype.abort   = function()  { return this._xhr.abort(); };
  ProxyXHR.prototype.setRequestHeader    = function(h,v) { return this._xhr.setRequestHeader(h,v); };
  ProxyXHR.prototype.getResponseHeader   = function(h)   { return this._xhr.getResponseHeader(h); };
  ProxyXHR.prototype.getAllResponseHeaders = function()   { return this._xhr.getAllResponseHeaders(); };
  ProxyXHR.UNSENT = 0; ProxyXHR.OPENED = 1; ProxyXHR.HEADERS_RECEIVED = 2;
  ProxyXHR.LOADING = 3; ProxyXHR.DONE = 4;
  window.XMLHttpRequest = ProxyXHR;
})();
</script>`;

/**
 * GET /api/proxy/site?url=...
 * Fetch + serve any Shabiki page with geo-bypass and CORS injection
 */
router.get('/site', async (req, res) => {
  const url = req.query.url || SHABIKI;

  try {
    const response = await axios.get(url, {
      headers: kenyaHeaders({ Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }),
      timeout: 15000,
      responseType: 'arraybuffer',
      maxRedirects: 5
    });

    let body = response.data.toString('utf8');
    const base = new URL(url);

    // Rewrite root-relative URLs → absolute so assets load
    body = body
      .replace(/(href|src|action)="\/(?!\/)/g, `$1="${base.origin}/`)
      .replace(/(href|src|action)='\/(?!\/)/g,  `$1='${base.origin}/`);

    // Inject geo+CORS bypass right before </head>
    const inject = `<base href="${base.origin}/">${INJECT_SCRIPT(KENYA_IP)}`;
    body = body.includes('<head>')
      ? body.replace('<head>', `<head>${inject}`)
      : inject + body;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.send(body);

  } catch (error) {
    const isCF = error.message.includes('403') || error.message.includes('blocked') || error.message.includes('522') || error.message.includes('521');
    res.status(200).send(`
      <!DOCTYPE html><html><body style="margin:0;font-family:'Segoe UI',sans-serif;background:#0d1232;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:40px">
        <div style="font-size:56px;margin-bottom:16px">${isCF ? '🛡️' : '⚠️'}</div>
        <h2 style="color:#e8192c;margin-bottom:10px">${isCF ? 'Cloudflare Protection Active' : 'Could not load site'}</h2>
        <p style="color:#94a3b8;max-width:420px;margin-bottom:24px">
          ${isCF
            ? 'This server\'s IP is geo-blocked by Cloudflare. Use the <strong style="color:#f5a623">Chrome Browser Login</strong> above — Puppeteer bypasses this automatically.'
            : error.message}
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
          <a href="${url}" target="_blank" rel="noopener"
             style="background:#e8192c;color:white;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
            ↗ Open Shabiki Directly
          </a>
          <button onclick="window.location.reload()"
             style="background:#1e2660;color:white;padding:10px 22px;border-radius:8px;border:1px solid #2a3070;font-weight:700;font-size:14px;cursor:pointer">
            🔄 Retry
          </button>
        </div>
      </body></html>`);
  }
});

/**
 * ALL /api/proxy/fapi/*
 * Forward every fapi.shabiki.com request with Kenya geo headers
 */
router.all('/fapi/*', async (req, res) => {
  const path  = req.params[0] || '';
  const qs    = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${FAPI}/${path}${qs}`;

  try {
    const fapiRes = await axios({
      method: req.method,
      url: target,
      headers: kenyaHeaders({
        'Content-Type': req.headers['content-type'] || 'application/json',
        ...(req.headers['authorization'] ? { Authorization: req.headers['authorization'] } : {})
      }),
      data: ['POST','PUT','PATCH'].includes(req.method) ? req.body : undefined,
      timeout: 15000,
      validateStatus: () => true
    });

    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.removeHeader('X-Frame-Options');
    res.status(fapiRes.status).json(fapiRes.data);

  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

router.options('/fapi/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.sendStatus(204);
});

/**
 * GET /api/proxy/page-info
 * Live Shabiki promotions/settings with Kenya geo
 */
router.get('/page-info', async (req, res) => {
  const { token } = req.query;
  try {
    const headers = kenyaHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    const r = await axios.get(`${FAPI}/skin/v2/getPromotions`, { headers, timeout: 8000 });
    res.json({ promotions: r.data, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
