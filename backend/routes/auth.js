const express = require('express');
const router = express.Router();
const axios = require('axios');
const puppeteer = require('puppeteer');

// Store sessions temporarily (in production, use a database)
const sessions = new Map();

/**
 * POST /api/auth/test-login
 * Test login credentials against target domain
 */
router.post('/test-login', async (req, res) => {
  try {
    const { domain, username, password, email, loginUrl, usernameSelector, passwordSelector, submitSelector } = req.body;

    if (!domain || !password) {
      return res.status(400).json({ error: 'Domain and password are required' });
    }

    const url = loginUrl || `${domain}`;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Navigate to login page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Fill in credentials
      if (usernameSelector) {
        await page.type(usernameSelector, username || email);
      }
      if (passwordSelector) {
        await page.type(passwordSelector, password);
      }

      // Submit form
      if (submitSelector) {
        await page.click(submitSelector);
      } else {
        await page.keyboard.press('Enter');
      }

      // Wait for navigation
      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});

      // Get page content
      const content = await page.content();
      const url = page.url();

      // Check for common success/failure indicators
      const isAuthenticated = !content.includes('login') && !content.includes('password') && !content.includes('unauthorized');

      const sessionId = Math.random().toString(36).substr(2, 9);
      sessions.set(sessionId, {
        domain,
        username: username || email,
        authenticated: isAuthenticated,
        timestamp: new Date(),
        url: url
      });

      res.json({
        success: isAuthenticated,
        sessionId,
        url,
        message: isAuthenticated ? 'Login successful' : 'Login failed or page content unclear'
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Login test error:', error);
    res.status(500).json({ error: 'Login test failed', details: error.message });
  }
});

/**
 * GET /api/auth/session/:sessionId
 * Get session information
 */
router.get('/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

/**
 * GET /api/auth/sessions
 * List all active sessions
 */
router.get('/sessions', (req, res) => {
  const allSessions = Array.from(sessions.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
  res.json(allSessions);
});

/**
 * DELETE /api/auth/session/:sessionId
 * Delete a session
 */
router.delete('/session/:sessionId', (req, res) => {
  const deleted = sessions.delete(req.params.sessionId);
  res.json({ success: deleted });
});

module.exports = router;
