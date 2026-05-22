const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const { kenyaHeaders } = require('../geoHeaders');

const FAPI_BASE = 'https://fapi.shabiki.com';
const sessions  = new Map();

router.post('/test-login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ error: 'Phone and password are required' });

    const response = await axios.post(
      `${FAPI_BASE}/api_user/login?lang=en`,
      { body: { login_username: phone, login_password: password, device_type: 'mobile' } },
      {
        headers: kenyaHeaders({ 'Content-Type': 'application/json', 'Referer': 'https://www.shabiki.com/login' }),
        timeout: 15000
      }
    );

    const data    = response.data;
    const success = data.login_status === 'OK' || !!(data.data && data.data.api_token);
    const sessionId = Math.random().toString(36).substr(2, 9);

    sessions.set(sessionId, {
      phone,
      authenticated: success,
      timestamp: new Date(),
      apiToken:  data.data?.api_token || null,
      userData:  data.data || null
    });

    res.json({
      success,
      sessionId,
      login_status: data.login_status,
      login_msg:    data.login_msg,
      message:      success ? 'Login successful' : (data.login_msg || 'Login failed'),
      userData:     success ? data.data : null,
      raw:          data
    });

  } catch (error) {
    const status = (error.response?.status >= 400 && error.response?.status < 600)
      ? error.response.status : 500;
    const msg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('Login error:', msg);
    res.status(status).json({ error: 'Login request failed', details: msg, status });
  }
});

router.get('/session/:sessionId', (req, res) => {
  const s = sessions.get(req.params.sessionId);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  res.json(s);
});

router.get('/sessions', (req, res) => {
  res.json(Array.from(sessions.entries()).map(([id, d]) => ({ id, ...d })));
});

router.delete('/session/:sessionId', (req, res) => {
  res.json({ success: sessions.delete(req.params.sessionId) });
});

module.exports = router;
