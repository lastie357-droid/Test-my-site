const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const FAPI    = 'https://fapi.shabiki.com';
const SHABIKI = 'https://www.shabiki.com';

// ── CORS-bypass script injected into every proxied page ──
const INJECT_SCRIPT = `
<script>
(function() {
  var PROXY = '/api/proxy/fapi';
  var FAPI  = 'https://fapi.shabiki.com';

  // Override fetch
  var origFetch = window.fetch.bind(window);
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.indexOf(FAPI) === 0) {
      var path = url.replace(FAPI, '');
      return origFetch(PROXY + path, opts);
    }
    return origFetch(url, opts);
  };

  // Override XMLHttpRequest
  var OrigXHR = window.XMLHttpRequest;
  function ProxyXHR() {
    this._xhr = new OrigXHR();
    var self = this;
    ['readyState','status','statusText','responseText','response',
     'responseXML','responseType','responseURL','upload',
     'withCredentials','timeout'].forEach(function(prop) {
      Object.defineProperty(self, prop, {
        get: function() { return self._xhr[prop]; },
        set: function(v) { self._xhr[prop] = v; }
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
  ProxyXHR.prototype.open = function(method, url, async, user, pass) {
    var target = (typeof url === 'string' && url.indexOf(FAPI) === 0)
      ? PROXY + url.replace(FAPI, '')
      : url;
    return this._xhr.open(method, target, async === undefined ? true : async, user, pass);
  };
  ProxyXHR.prototype.send    = function(d) { return this._xhr.send(d); };
  ProxyXHR.prototype.abort   = function()  { return this._xhr.abort(); };
  ProxyXHR.prototype.setRequestHeader = function(h,v) { return this._xhr.setRequestHeader(h,v); };
  ProxyXHR.prototype.getResponseHeader = function(h)  { return this._xhr.getResponseHeader(h); };
  ProxyXHR.prototype.getAllResponseHeaders = function(){ return this._xhr.getAllResponseHeaders(); };
  ProxyXHR.UNSENT = 0; ProxyXHR.OPENED = 1; ProxyXHR.HEADERS_RECEIVED = 2;
  ProxyXHR.LOADING = 3; ProxyXHR.DONE = 4;
  window.XMLHttpRequest = ProxyXHR;
})();
</script>
`;

/**
 * GET /api/proxy/site?url=https://www.shabiki.com[/path]
 * Fetches the page, strips framing headers, injects CORS bypass
 */
router.get('/site', async (req, res) => {
  const url = req.query.url || SHABIKI;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000,
      responseType: 'arraybuffer',
      maxRedirects: 5
    });

    let body = response.data.toString('utf8');

    // Rewrite root-relative URLs to absolute
    const base = new URL(url);
    body = body
      .replace(/(href|src|action)="\/(?!\/)/g, `$1="${base.origin}/`)
      .replace(/(href|src|action)='\/(?!\/)/g,  `$1='${base.origin}/`);

    // Inject CORS bypass + base tag right after <head>
    body = body
      .replace('<head>', `<head><base href="${base.origin}/">`)
      .replace('</head>', INJECT_SCRIPT + '</head>');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.send(body);

  } catch (error) {
    res.status(500).send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#0d1232;color:#fff;text-align:center">
        <h2>⚠️ Could not load ${url}</h2>
        <p style="color:#94a3b8">${error.message}</p>
        <p style="margin-top:20px"><a href="${url}" target="_top" style="color:#e8192c;font-weight:bold">
          ↗ Open directly in new tab
        </a></p>
      </body></html>`);
  }
});

/**
 * ALL /api/proxy/fapi/*
 * Forwards requests to fapi.shabiki.com, adding proper CORS headers
 */
router.all('/fapi/*', async (req, res) => {
  const path   = req.params[0];
  const query  = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const target = `${FAPI}/${path}${query}`;

  try {
    const fapiRes = await axios({
      method: req.method,
      url: target,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Origin': SHABIKI,
        'Referer': `${SHABIKI}/`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': req.headers['accept'] || 'application/json, */*',
        ...(req.headers['authorization'] ? { Authorization: req.headers['authorization'] } : {})
      },
      data: ['POST','PUT','PATCH'].includes(req.method) ? req.body : undefined,
      timeout: 15000,
      validateStatus: () => true
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.removeHeader('X-Frame-Options');
    res.status(fapiRes.status).json(fapiRes.data);

  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

// Handle OPTIONS preflight
router.options('/fapi/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.sendStatus(204);
});

/**
 * GET /api/proxy/page-info
 * Returns live Shabiki data (promotions, settings)
 */
router.get('/page-info', async (req, res) => {
  const token = req.query.token;
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0',
      'Origin': SHABIKI
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const r = await axios.get(`${FAPI}/skin/v2/getPromotions`, { headers, timeout: 8000 });
    res.json({ promotions: r.data, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
