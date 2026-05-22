const express = require('express');
const router = express.Router();
const axios = require('axios');

const FAPI_BASE = 'https://fapi.shabiki.com';
const sessions = new Map();

router.post('/test-login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const response = await axios.post(
      `${FAPI_BASE}/api_user/login?lang=en`,
      { username: phone, password },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://www.shabiki.com',
          'Referer': 'https://www.shabiki.com/login',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      }
    );

    const data = response.data;
    const success = data.login_status === 'OK' || (data.data && data.data.api_token);

    const sessionId = Math.random().toString(36).substr(2, 9);
    sessions.set(sessionId, {
      phone,
      authenticated: success,
      timestamp: new Date(),
      apiToken: data.data ? data.data.api_token : null,
      userData: data.data || null
    });

    res.json({
      success,
      sessionId,
      login_status: data.login_status,
      login_msg: data.login_msg,
      message: success ? 'Login successful' : (data.login_msg || 'Login failed'),
      userData: success ? data.data : null
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Login request failed', details: error.message });
  }
});

router.get('/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.get('/sessions', (req, res) => {
  const all = Array.from(sessions.entries()).map(([id, data]) => ({ id, ...data }));
  res.json(all);
});

router.delete('/session/:sessionId', (req, res) => {
  const deleted = sessions.delete(req.params.sessionId);
  res.json({ success: deleted });
});

module.exports = router;
