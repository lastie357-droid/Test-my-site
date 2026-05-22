const express = require('express');
const router  = express.Router();
const mgr     = require('../browser');

/**
 * GET /api/browser/status
 */
router.get('/status', (req, res) => {
  res.json({
    status:    mgr.status,
    lastStep:  mgr.lastStep,
    session:   mgr.getSession() ? {
      phone:    mgr.session.phone,
      savedAt:  mgr.session.savedAt,
      hasToken: !!mgr.session.apiToken,
      url:      mgr.session.url,
    } : null,
  });
});

/**
 * POST /api/browser/login
 * body: { phone, password }
 */
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ error: 'phone and password required' });

  // Fire-and-forget — results stream via WebSocket
  // But also return a tracking acknowledgement immediately
  res.json({ ok: true, message: 'Browser login started — watch the progress panel' });

  try {
    await mgr.login(phone, password);
  } catch (err) {
    mgr.broadcast('browser_error', { message: err.message });
  }
});

/**
 * POST /api/browser/login-sync
 * Same as /login but waits for result (max 60s)
 */
router.post('/login-sync', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ error: 'phone and password required' });
  try {
    const result = await mgr.login(phone, password);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/browser/screenshot
 */
router.get('/screenshot', async (req, res) => {
  try {
    const img = await mgr.screenshot();
    if (!img) return res.status(404).json({ error: 'No browser running' });
    res.json({ img });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/navigate
 * body: { url }
 */
router.post('/navigate', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const result = await mgr.navigate(url);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/browser/session
 */
router.get('/session', (req, res) => {
  const s = mgr.getSession();
  if (!s) return res.status(404).json({ error: 'No saved session' });
  res.json(s);
});

/**
 * POST /api/browser/restore
 * Restore saved cookies into the live browser
 */
router.post('/restore', async (req, res) => {
  try {
    const ok = await mgr.restoreSessionToBrowser();
    const img = await mgr.screenshot();
    res.json({ ok, img });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/browser/session
 */
router.delete('/session', (req, res) => {
  mgr.clearSession();
  res.json({ ok: true });
});

/**
 * POST /api/browser/close
 */
router.post('/close', async (req, res) => {
  await mgr.close();
  res.json({ ok: true });
});

/**
 * POST /api/browser/import
 */
router.post('/import', (req, res) => {
  const { phone, apiToken, cookies } = req.body;
  if (!apiToken && (!cookies || !cookies.length))
    return res.status(400).json({ error: 'apiToken or cookies required' });
  try {
    const session = mgr.importManualSession({ phone, apiToken, cookies });
    res.json({ ok: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/click
 * body: { x, y }
 */
router.post('/click', async (req, res) => {
  const { x, y } = req.body;
  if (x == null || y == null) return res.status(400).json({ error: 'x and y required' });
  try {
    const result = await mgr.click(Number(x), Number(y));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/keypress
 * body: { key, ctrl?, shift? }
 */
router.post('/keypress', async (req, res) => {
  const { key, ctrl = false, shift = false } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  try {
    const result = await mgr.keypress(key, ctrl, shift);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/scroll
 * body: { deltaY }
 */
router.post('/scroll', async (req, res) => {
  const { deltaY = 300 } = req.body;
  try {
    const result = await mgr.scroll(Number(deltaY));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/back
 */
router.post('/back', async (req, res) => {
  try { res.json(await mgr.goBack()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/browser/forward
 */
router.post('/forward', async (req, res) => {
  try { res.json(await mgr.goForward()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/browser/reload
 */
router.post('/reload', async (req, res) => {
  try { res.json(await mgr.reload()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/browser/eval
 * Execute JavaScript in the browser page
 */
router.post('/eval', async (req, res) => {
  if (!mgr.page) return res.status(404).json({ error: 'No browser running' });
  const { script } = req.body;
  if (!script) return res.status(400).json({ error: 'script required' });
  try {
    // Use page.evaluate with a properly scoped async function
    const result = await mgr.page.evaluate(async (code) => {
      try {
        // eslint-disable-next-line no-eval
        const fn = new Function('return (async function() { ' + code + ' })()');
        const val = await fn();
        return typeof val === 'string' ? val : JSON.stringify(val);
      } catch (e) {
        return 'EVAL_ERROR: ' + e.message;
      }
    }, script);
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/spribe-inspect
 * Use CDP to capture ALL network requests from ALL frames (including game iframe).
 * Clicks #gtm-aviator and records every request/response for 20 seconds.
 */
router.post('/spribe-inspect', async (req, res) => {
  if (!mgr.page) return res.status(404).json({ error: 'No browser running' });
  const events = [];
  let cdpClient = null;
  try {
    // Create a CDP session on the main page
    cdpClient = await mgr.page.target().createCDPSession();
    await cdpClient.send('Network.enable');

    // Capture request sent events (from ALL frames)
    cdpClient.on('Network.requestWillBeSent', (params) => {
      const url = params.request.url;
      // Only log game-related or auth-related requests
      if (url.includes('spribe') || url.includes('gameapi') || url.includes('plqservice')
          || url.includes('fapi.shabiki') || url.includes('token')) {
        events.push({
          type: 'request',
          requestId: params.requestId,
          method: params.request.method,
          url: url.substring(0, 250),
          initiator: params.initiator?.type,
          frameId: params.frameId,
          ts: Date.now(),
        });
      }
    });

    // Capture response headers (status + Location for redirects)
    cdpClient.on('Network.responseReceived', (params) => {
      const url = params.response.url;
      if (url.includes('spribe') || url.includes('gameapi') || url.includes('plqservice')
          || url.includes('fapi.shabiki') || url.includes('token')) {
        events.push({
          type: 'response',
          requestId: params.requestId,
          status: params.response.status,
          url: url.substring(0, 250),
          location: params.response.headers?.location || params.response.headers?.Location || null,
          mimeType: params.response.mimeType,
          ts: Date.now(),
        });
      }
    });

    // Also capture load failures
    cdpClient.on('Network.loadingFailed', (params) => {
      events.push({ type: 'failed', requestId: params.requestId, error: params.errorText, ts: Date.now() });
    });

    // Click #gtm-aviator to launch game
    const clicked = await mgr.page.evaluate(() => {
      const el = document.getElementById('gtm-aviator');
      if (el) { el.click(); return true; }
      return false;
    }).catch(() => false);

    // Wait 20 seconds for all game network activity to complete
    await new Promise(r => setTimeout(r, 20000));

    // Detach CDP session
    await cdpClient.detach().catch(() => {});

    // Also get current iframe src for reference
    const iframes = await mgr.page.evaluate(() =>
      Array.from(document.querySelectorAll('iframe')).map(f => ({ src: f.src?.substring(0, 200), id: f.id }))
    ).catch(() => []);

    res.json({ clicked, events, iframes, eventCount: events.length });
  } catch (err) {
    if (cdpClient) await cdpClient.detach().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/game-inspect
 * Navigate to game page with full interception — returns all fapi calls made
 */
router.post('/game-inspect', async (req, res) => {
  if (!mgr.page) return res.status(404).json({ error: 'No browser running' });
  const url = req.body.url || `https://www.shabiki.com/casino/game/116234`;
  const calls = [];
  try {
    await mgr.page.setRequestInterception(true).catch(() => {});
    const rh = async req2 => {
      const u = req2.url();
      if (u.includes('fapi.shabiki') || u.includes('gameapi') || u.includes('plqservice') || u.includes('spribe')) {
        calls.push({ method: req2.method(), url: u.substring(0, 200) });
      }
      if (u.includes('/user/userLink') && u.includes('lang=null')) {
        req2.continue({ url: u.replace('lang=null', 'lang=en') }).catch(() => req2.continue().catch(() => {}));
        return;
      }
      req2.continue().catch(() => {});
    };
    const rsp = async resp2 => {
      const u = resp2.url();
      if (u.includes('fapi.shabiki') || u.includes('gameapi') || u.includes('plqservice') || u.includes('spribe')) {
        let body = ''; try { body = (await resp2.text()).substring(0, 500); } catch {}
        const entry = calls.find(c => c.url === u.substring(0, 200));
        if (entry) entry.response = { status: resp2.status(), body };
        else calls.push({ url: u.substring(0, 200), response: { status: resp2.status(), body } });
      }
    };
    mgr.page.on('request', rh);
    mgr.page.on('response', rsp);
    await mgr.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 8000));
    // Also get all current iframes
    const iframes = await mgr.page.evaluate(() =>
      Array.from(document.querySelectorAll('iframe')).map(f => f.src)
    ).catch(() => []);
    const pageText = await mgr.page.evaluate(() => document.body?.innerText?.substring(0, 300)).catch(() => '');
    mgr.page.off('request', rh);
    mgr.page.off('response', rsp);
    await mgr.page.setRequestInterception(false).catch(() => {});
    const img = await mgr.screenshot().catch(() => null);
    res.json({ calls, iframes, pageText, img });
  } catch (err) {
    await mgr.page.setRequestInterception(false).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/aviator
 * Restore session and navigate directly to Aviator game
 */
router.post('/aviator', async (req, res) => {
  try {
    const result = await mgr.navigateToAviator();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/capture-session
 * Reads cookies + localStorage from the live page and saves as session
 */
router.post('/capture-session', async (req, res) => {
  try {
    const session = await mgr.captureSession();
    if (!session) return res.status(404).json({ error: 'No browser running' });
    res.json({ ok: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/capture-casino-api
 * Use CDP to capture all network requests for N seconds while triggering SPA navigation.
 * body: { seconds?, triggerUrl? }
 */
router.post('/capture-casino-api', async (req, res) => {
  if (!mgr.page) return res.status(404).json({ error: 'No browser running' });
  const { seconds = 12, triggerUrl = '/casino/game/116234' } = req.body;
  const events = [];
  let cdpClient = null;
  const responseBodyMap = {};
  try {
    cdpClient = await mgr.page.target().createCDPSession();
    await cdpClient.send('Network.enable');

    cdpClient.on('Network.requestWillBeSent', (p) => {
      const url = p.request.url;
      events.push({
        type: 'req', requestId: p.requestId,
        method: p.request.method, url: url.substring(0, 300),
        headers: Object.keys(p.request.headers || {}).slice(0, 5),
        ts: Date.now()
      });
    });

    cdpClient.on('Network.responseReceived', async (p) => {
      const url = p.response.url;
      const entry = { type: 'res', requestId: p.requestId, status: p.response.status, url: url.substring(0, 300), mime: p.response.mimeType, ts: Date.now() };
      events.push(entry);
      // Try to get body for API responses
      if (p.response.mimeType && (p.response.mimeType.includes('json') || p.response.mimeType.includes('text')) && (url.includes('fapi') || url.includes('backoffice') || url.includes('gameapi') || url.includes('casino') || url.includes('spribe') || url.includes('plq'))) {
        try {
          const body = await cdpClient.send('Network.getResponseBody', { requestId: p.requestId });
          entry.body = body.body.substring(0, 500);
        } catch {}
      }
    });

    // Trigger SPA navigation via history.pushState
    await mgr.page.evaluate((url) => {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, triggerUrl).catch(() => {});

    await new Promise(r => setTimeout(r, seconds * 1000));
    await cdpClient.detach().catch(() => {});

    // Filter to only relevant API calls
    const relevant = events.filter(e => {
      const url = e.url || '';
      return url.includes('fapi') || url.includes('backoffice') || url.includes('gameapi') || url.includes('plqservice') || url.includes('logiqgames') || url.includes('spribe') || (url.includes('casino') && !url.includes('cdn'));
    });

    res.json({ events: relevant, total: events.length });
  } catch (err) {
    if (cdpClient) await cdpClient.detach().catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/browser/intercept-ajax
 * Patch jQuery/fetch/XHR in the browser to capture ALL AJAX calls for N seconds.
 * Also optionally triggers a SPA route change.
 */
router.post('/intercept-ajax', async (req, res) => {
  if (!mgr.page) return res.status(404).json({ error: 'No browser running' });
  const { seconds = 10, triggerUrl } = req.body;
  try {
    const calls = await mgr.page.evaluate(async ({ seconds, triggerUrl }) => {
      const captured = [];
      const isRelevant = (url) => url && (
        url.includes('fapi.shabiki') || url.includes('backoffice-new') ||
        url.includes('gameapi') || url.includes('plqservice') ||
        url.includes('logiqgames') || url.includes('casino') || url.includes('spribe')
      );

      // Patch jQuery AJAX if available
      if (window.$ && window.$.ajax) {
        const origAjax = window.$.ajax.bind(window.$);
        window.$.ajax = function(...args) {
          const opts = args[0] || {};
          const url = typeof opts === 'string' ? opts : (opts.url || '');
          if (isRelevant(url)) {
            const origSuccess = opts.success;
            opts.success = function(data, ...rest) {
              captured.push({ type: 'jquery', url: url.substring(0, 200), data: JSON.stringify(data).substring(0, 400) });
              if (origSuccess) origSuccess.apply(this, [data, ...rest]);
            };
          }
          return origAjax(...args);
        };
      }

      // Patch fetch
      const origFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const resp = await origFetch(...args);
        if (isRelevant(url)) {
          const clone = resp.clone();
          clone.text().then(body => captured.push({ type: 'fetch', url: url.substring(0, 200), status: resp.status, body: body.substring(0, 400) })).catch(() => {});
        }
        return resp;
      };

      // Trigger SPA navigation
      if (triggerUrl) {
        window.history.pushState({}, '', triggerUrl);
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      }

      await new Promise(r => setTimeout(r, seconds * 1000));
      window.fetch = origFetch;
      return captured;
    }, { seconds, triggerUrl });

    res.json({ calls, count: calls.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
