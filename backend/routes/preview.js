const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const axios = require('axios');

/**
 * POST /api/preview/screenshot
 * Get a screenshot of the webpage
 */
router.post('/screenshot', async (req, res) => {
  try {
    const { url, sessionId, cookies } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Set cookies if provided
      if (cookies && Array.isArray(cookies)) {
        await page.setCookie(...cookies);
      }

      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Take screenshot
      const screenshot = await page.screenshot({ encoding: 'base64' });

      res.json({
        screenshot: `data:image/png;base64,${screenshot}`,
        url: page.url(),
        title: await page.title()
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ error: 'Failed to capture screenshot', details: error.message });
  }
});

/**
 * POST /api/preview/html
 * Get HTML content of a webpage
 */
router.post('/html', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const html = await page.content();
      const cookies = await page.cookies();

      res.json({
        html,
        cookies,
        url: page.url(),
        title: await page.title()
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('HTML fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch HTML', details: error.message });
  }
});

/**
 * POST /api/preview/analyze
 * Analyze webpage for security issues
 */
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const response = await axios.get(url, { timeout: 10000 });
    const html = response.data;
    const headers = response.headers;

    const issues = [];

    // Check for security headers
    const securityHeaders = {
      'strict-transport-security': 'HSTS',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-frame-options': 'X-Frame-Options',
      'content-security-policy': 'CSP',
      'x-xss-protection': 'X-XSS-Protection'
    };

    Object.entries(securityHeaders).forEach(([header, name]) => {
      if (!headers[header]) {
        issues.push({
          severity: 'medium',
          type: 'Missing Security Header',
          header: name,
          recommendation: `Add ${name} header`
        });
      }
    });

    // Check for common vulnerabilities in HTML
    if (html.includes('eval(')) {
      issues.push({ severity: 'high', type: 'Potential Code Injection', details: 'eval() found in code' });
    }
    if (!html.includes('<!DOCTYPE')) {
      issues.push({ severity: 'low', type: 'Missing DOCTYPE' });
    }
    if (html.includes('http://') && !html.includes('https://')) {
      issues.push({ severity: 'medium', type: 'Mixed Content', details: 'HTTP content detected' });
    }

    res.json({
      url,
      issues,
      headers: Object.keys(headers),
      isSecure: url.startsWith('https')
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

module.exports = router;
