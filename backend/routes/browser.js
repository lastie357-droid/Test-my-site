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

module.exports = router;
