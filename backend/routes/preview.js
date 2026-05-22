const express = require('express');
const router  = express.Router();
const puppeteer = require('puppeteer');
const axios   = require('axios');
const { kenyaHeaders, KENYA_IP } = require('../geoHeaders');

/**
 * POST /api/preview/screenshot
 */
router.post('/screenshot', async (req, res) => {
  const { url, sessionId, cookies } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        `--lang=en-KE`,
        `--accept-lang=en-KE`
      ]
    });
    const page = await browser.newPage();

    // Spoof geolocation to Nairobi, Kenya
    await page.setGeolocation({ latitude: -1.2921, longitude: 36.8219 });
    await page.setExtraHTTPHeaders({
      'Accept-Language':  'en-KE,en;q=0.9',
      'X-Forwarded-For':  KENYA_IP,
      'X-Real-IP':        KENYA_IP,
      'CF-IPCountry':     'KE',
      'CF-Connecting-IP': KENYA_IP
    });
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Tecno Spark 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');

    try {
      if (cookies && Array.isArray(cookies)) await page.setCookie(...cookies);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const screenshot = await page.screenshot({ encoding: 'base64' });
      res.json({ screenshot: `data:image/png;base64,${screenshot}`, url: page.url(), title: await page.title() });
    } finally {
      await browser.close();
    }
  } catch (error) {
    res.status(500).json({ error: 'Screenshot failed', details: error.message });
  }
});

/**
 * POST /api/preview/html
 */
router.post('/html', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'X-Forwarded-For': KENYA_IP, 'CF-IPCountry': 'KE' });
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; Tecno Spark 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      res.json({ html: await page.content(), cookies: await page.cookies(), url: page.url(), title: await page.title() });
    } finally {
      await browser.close();
    }
  } catch (error) {
    res.status(500).json({ error: 'HTML fetch failed', details: error.message });
  }
});

/**
 * POST /api/preview/analyze
 */
router.post('/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const response = await axios.get(url, {
      headers: kenyaHeaders({ Accept: 'text/html,*/*' }),
      timeout: 10000
    });
    const html    = response.data;
    const headers = response.headers;
    const issues  = [];

    const securityHeaders = {
      'strict-transport-security': 'HSTS',
      'x-content-type-options':    'X-Content-Type-Options',
      'x-frame-options':           'X-Frame-Options',
      'content-security-policy':   'CSP',
      'x-xss-protection':          'X-XSS-Protection'
    };

    Object.entries(securityHeaders).forEach(([h, name]) => {
      if (!headers[h]) issues.push({ severity: 'medium', type: 'Missing Security Header', header: name, recommendation: `Add ${name} header` });
    });

    if (html.includes('eval('))  issues.push({ severity: 'high',   type: 'Potential Code Injection', details: 'eval() found' });
    if (!html.includes('<!DOCTYPE')) issues.push({ severity: 'low', type: 'Missing DOCTYPE' });
    if (html.includes('http://') && !html.includes('https://')) issues.push({ severity: 'medium', type: 'Mixed Content' });

    res.json({ url, issues, headers: Object.keys(headers), isSecure: url.startsWith('https') });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

module.exports = router;
