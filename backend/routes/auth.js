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
    const { domain, username, phone, password, email, loginUrl, usernameSelector, passwordSelector, submitSelector } = req.body;

    if (!domain || !password) {
      return res.status(400).json({ error: 'Domain and password are required' });
    }

    const credentials = username || email || phone;
    const url = loginUrl || `${domain}`;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Navigate to login page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Determine selectors automatically when not provided
      const defaultUsernameSelectors = [
        'input[type=tel]',
        'input[name*=phone]',
        'input[id*=phone]',
        'input[name*=username]',
        'input[id*=username]',
        'input[name*=user]',
        'input[id*=user]',
        'input[type=text]'
      ];
      const defaultPasswordSelectors = ['input[type=password]'];
      const defaultSubmitSelectors = ['button[type=submit]', 'input[type=submit]', 'button'];

      const findSelector = async (selectors) => {
        for (const selector of selectors) {
          const element = await page.$(selector);
          if (element) return selector;
        }
        return null;
      };

      const usernameField = usernameSelector || await findSelector(defaultUsernameSelectors);
      const passwordField = passwordSelector || await findSelector(defaultPasswordSelectors);
      const submitField = submitSelector || await findSelector(defaultSubmitSelectors);

      if (usernameField && credentials) {
        await page.type(usernameField, credentials.toString(), { delay: 50 });
      }
      if (passwordField) {
        await page.type(passwordField, password, { delay: 50 });
      }

      if (submitField) {
        await page.click(submitField);
      } else {
        await page.keyboard.press('Enter');
      }

      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});

      const content = await page.content();
      const currentUrl = page.url();
      const isAuthenticated = !content.includes('login') && !content.includes('password') && !content.includes('unauthorized');

      const sessionId = Math.random().toString(36).substr(2, 9);
      sessions.set(sessionId, {
        domain,
        username: credentials,
        authenticated: isAuthenticated,
        timestamp: new Date(),
        url: currentUrl
      });

      res.json({
        success: isAuthenticated,
        sessionId,
        url: currentUrl,
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
