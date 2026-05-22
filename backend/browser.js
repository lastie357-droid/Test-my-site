const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin   = require('puppeteer-extra-plugin-stealth');
const fs              = require('fs');
const path            = require('path');
const { KENYA_IP }    = require('./geoHeaders');

puppeteerExtra.use(StealthPlugin());

const SESSION_FILE = path.join(__dirname, 'session_store.json');
const SHABIKI      = 'https://www.shabiki.com';

// ── Login form selectors (ordered by specificity) ──
const SEL = {
  loginLink: [
    'a[href="/login"]', 'a[href*="login"]',
    'button[class*="login" i]', '.login-btn', '[data-testid*="login"]',
    'a[class*="sign" i]', 'button[class*="sign" i]'
  ],
  phone: [
    'input[name="login_username"]', 'input[name="username"]',
    'input[type="tel"]', 'input[placeholder*="phone" i]',
    'input[placeholder*="Phone" i]', 'input[placeholder*="mobile" i]',
    'input[id*="phone" i]', 'input[id*="username" i]',
    'input[class*="username" i]', 'input[autocomplete="username"]',
    'input[autocomplete="tel"]'
  ],
  password: [
    'input[type="password"]', 'input[name="login_password"]',
    'input[name="password"]', 'input[id*="password" i]',
    'input[placeholder*="password" i]'
  ],
  submit: [
    'button[type="submit"]', 'input[type="submit"]',
    'button[class*="login" i]', 'button[class*="submit" i]',
    'button[class*="sign" i]', '.login-button', '[data-testid*="submit"]'
  ]
};

class BrowserManager {
  constructor() {
    this.browser   = null;
    this.page      = null;
    this.session   = null;
    this.status    = 'idle';
    this.lastStep  = '';
    this.wsClients = new Set();
    this._loadSession();
  }

  // ── WebSocket broadcast ──────────────────────────────────────────────────
  broadcast(event, data) {
    const msg = JSON.stringify({ event, ...data });
    this.wsClients.forEach(ws => {
      try { if (ws.readyState === 1) ws.send(msg); } catch {}
    });
  }

  step(label, detail = '') {
    this.lastStep = label;
    console.log('[Browser]', label, detail ? `(${detail})` : '');
    this.broadcast('browser_step', { label, detail, status: this.status, ts: Date.now() });
  }

  // ── Session persistence ──────────────────────────────────────────────────
  _loadSession() {
    try {
      if (fs.existsSync(SESSION_FILE))
        this.session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch {}
  }

  saveSession(data) {
    this.session = { ...data, savedAt: new Date().toISOString() };
    try { fs.writeFileSync(SESSION_FILE, JSON.stringify(this.session, null, 2)); } catch {}
    this.broadcast('session_saved', { session: this.session });
  }

  clearSession() {
    this.session = null;
    try { if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE); } catch {}
    this.broadcast('session_cleared', {});
  }

  getSession() { return this.session; }

  // ── Browser lifecycle ────────────────────────────────────────────────────
  async launch() {
    if (this.browser) return;
    this.status = 'launching';
    this.step('🚀 Launching Chromium with stealth…');

    const CHROME_PATHS = [
      '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
    ];
    const executablePath = CHROME_PATHS.find(p => { try { return fs.existsSync(p); } catch { return false; } });

    this.browser = await puppeteerExtra.launch({
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--window-size=1366,768',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--lang=en-KE',
        // Anti-detection: remove automation flags
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        // Enable features that real browsers have (needed for games)
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--allow-running-insecure-content',
        '--disable-web-security',
        // Better rendering for game iframes
        '--enable-accelerated-2d-canvas',
        '--enable-gpu-rasterization',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
      ],
      defaultViewport: { width: 1366, height: 768 },
      ignoreHTTPSErrors: true,
    });

    this.page = await this.browser.newPage();
    await this._stealthSetup(this.page);
    this.step('✅ Chromium ready (stealth mode)');
  }

  async _stealthSetup(page) {
    // Stealth plugin handles most fingerprint spoofing.
    // Extra: hide all automation signals that game providers check.
    await page.evaluateOnNewDocument((ip) => {
      // Remove webdriver flag
      Object.defineProperty(navigator, 'webdriver', { get: () => false });

      // Realistic language/locale
      Object.defineProperty(navigator, 'languages', { get: () => ['en-KE', 'en', 'sw'] });
      Object.defineProperty(navigator, 'language',  { get: () => 'en-KE' });

      // Realistic hardware
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
      Object.defineProperty(navigator, 'deviceMemory',        { get: () => 8 });
      Object.defineProperty(navigator, 'platform',            { get: () => 'Win32' });

      // Realistic screen
      Object.defineProperty(screen, 'width',       { get: () => 1366 });
      Object.defineProperty(screen, 'height',      { get: () => 768 });
      Object.defineProperty(screen, 'availWidth',  { get: () => 1366 });
      Object.defineProperty(screen, 'availHeight', { get: () => 728 });
      Object.defineProperty(screen, 'colorDepth',  { get: () => 24 });
      Object.defineProperty(screen, 'pixelDepth',  { get: () => 24 });
      Object.defineProperty(window, 'devicePixelRatio', { get: () => 1 });

      // Kenya timezone
      const origDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(locale, opts) {
        opts = opts || {};
        if (!opts.timeZone) opts.timeZone = 'Africa/Nairobi';
        return new origDateTimeFormat(locale, opts);
      };
      Object.assign(Intl.DateTimeFormat, origDateTimeFormat);

      // Permissions API (games check this)
      if (navigator.permissions) {
        const origQuery = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (params) => {
          if (params.name === 'notifications') return Promise.resolve({ state: 'denied' });
          return origQuery(params);
        };
      }

      // Plugin list (empty in headless — fill with realistic ones)
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const arr = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            { name: 'Native Client',     filename: 'internal-nacl-plugin',  description: '' },
          ];
          arr.item = (i) => arr[i];
          arr.namedItem = (n) => arr.find(p => p.name === n) || null;
          return arr;
        }
      });
    }, KENYA_IP);

    // Desktop UA that matches Chrome 120 (same as sec-ch-ua)
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-KE,en;q=0.9,sw;q=0.8',
      'sec-ch-ua': '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    });
    try { await page.setGeolocation({ latitude: -1.2921, longitude: 36.8219 }); } catch {}
  }

  // ── Core: Login ──────────────────────────────────────────────────────────
  async login(phone, password) {
    await this.launch();
    this.status = 'navigating';

    try {
      // 1. Navigate to Shabiki
      this.step('🌐 Navigating to www.shabiki.com…');
      await this.page.goto(SHABIKI, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this._delay(3000);

      const title1 = await this.page.title();
      const shot1  = await this.screenshot();
      this.broadcast('screenshot', { img: shot1, label: `Page loaded: ${title1}` });

      // Check for Cloudflare block
      if (title1.includes('Attention') || title1.includes('Just a moment') || title1.includes('Cloudflare')) {
        this.step('⏳ Cloudflare challenge detected — waiting for clearance…');
        // Wait up to 15s for CF to resolve
        await this._delay(8000);
        const title2 = await this.page.title();
        if (title2.includes('Attention') || title2.includes('Cloudflare')) {
          this.step('🛡️ CF block active on this IP — see manual import option');
          const shot = await this.screenshot();
          this.broadcast('screenshot', { img: shot, label: 'Cloudflare block — use manual import below' });
          this.status = 'error';
          this.broadcast('cf_blocked', {
            message: 'Cloudflare is blocking this server\'s IP. Use the Manual Token Import below instead — paste your token from the Shabiki website in your own browser.'
          });
          throw new Error('Cloudflare IP block active. Use Manual Token Import instead.');
        }
      }

      // 2. Find login link/button
      this.step('🔍 Finding login entry point…');
      const loginClicked = await this._clickFirstMatch(this.page, SEL.loginLink);
      if (loginClicked) {
        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
        await this._delay(2000);
      }

      const shot2 = await this.screenshot();
      this.broadcast('screenshot', { img: shot2, label: 'Login page' });

      // 3. Fill phone
      this.status = 'logging_in';
      this.step('📝 Locating login form…');
      const phoneEl = await this._waitForFirstMatch(this.page, SEL.phone, 8000);
      if (!phoneEl) {
        // Dump DOM for debugging
        const html = await this.page.content().catch(() => '');
        const inputs = await this.page.evaluate(() =>
          Array.from(document.querySelectorAll('input')).map(i => `${i.type}|${i.name}|${i.id}|${i.placeholder}`)
        ).catch(() => []);
        console.log('[Browser] Available inputs:', inputs);
        throw new Error(`Login form not found. Inputs found: ${inputs.length > 0 ? inputs.join(', ') : 'none'}. Page: ${await this.page.title()}`);
      }

      this.step('⌨️ Entering credentials…');
      await phoneEl.click({ clickCount: 3 });
      await phoneEl.type(phone, { delay: 60 });
      await this._delay(400);

      const passEl = await this._waitForFirstMatch(this.page, SEL.password, 5000);
      if (!passEl) throw new Error('Password field not found');
      await passEl.click({ clickCount: 3 });
      await passEl.type(password, { delay: 60 });
      await this._delay(400);

      const shot3 = await this.screenshot();
      this.broadcast('screenshot', { img: shot3, label: 'Form filled — submitting…' });

      // 4. Submit
      this.step('🚀 Submitting…');
      await this._clickFirstMatch(this.page, SEL.submit);
      await this._delay(5000);

      const shot4 = await this.screenshot();
      this.broadcast('screenshot', { img: shot4, label: 'Response received' });

      // 5. Extract session
      this.step('🔑 Extracting session data…');
      const cookies = await this.page.cookies();
      const url     = this.page.url();
      const title   = await this.page.title().catch(() => '');

      const lsData = await this.page.evaluate(() => {
        const keys = ['api_token','auth_token','token','access_token','user','userData','currentUser','shabiki_token'];
        const out = {};
        keys.forEach(k => { try { const v = localStorage.getItem(k); if (v) { try { out[k] = JSON.parse(v); } catch { out[k] = v; } } } catch {} });
        return out;
      }).catch(() => ({}));

      const apiToken = lsData.api_token || lsData.token || lsData.auth_token
        || cookies.find(c => c.name.toLowerCase().includes('token'))?.value
        || null;

      const isLoggedIn = !url.includes('/login') || !!apiToken
        || cookies.some(c => ['session','auth','token','sid'].some(k => c.name.toLowerCase().includes(k)));

      const result = {
        success: isLoggedIn,
        phone, url, title, apiToken,
        cookies: cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain })),
        localStorage: lsData,
        savedAt: new Date().toISOString(),
      };

      if (isLoggedIn) {
        this.status = 'active';
        this.saveSession(result);
        this.step('✅ Logged in — session saved!');
      } else {
        this.status = 'error';
        this.step('❌ Login may have failed', `URL: ${url}`);
      }

      const shot5 = await this.screenshot();
      this.broadcast('screenshot', { img: shot5, label: isLoggedIn ? '✅ Session active!' : '⚠️ Check credentials' });
      return result;

    } catch (err) {
      this.status = 'error';
      this.step('❌ ' + err.message);
      const shot = await this.screenshot().catch(() => null);
      if (shot) this.broadcast('screenshot', { img: shot, label: 'Error — ' + err.message.substring(0, 60) });
      throw err;
    }
  }

  // ── Manual session import ────────────────────────────────────────────────
  importManualSession(data) {
    const session = {
      success:   true,
      phone:     data.phone || 'manual-import',
      url:       SHABIKI,
      title:     'Shabiki',
      apiToken:  data.apiToken || data.token || null,
      cookies:   data.cookies || [],
      localStorage: {},
      manual:    true,
      savedAt:   new Date().toISOString(),
    };
    this.saveSession(session);
    this.status = 'active';
    return session;
  }

  // ── Navigate ─────────────────────────────────────────────────────────────
  async navigate(url) {
    await this.launch();
    this.status = 'navigating';
    this.step('🌐 Navigating…', url);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await this._delay(1500);
    this.status = 'active';
    const result = {
      url:   this.page.url(),
      title: await this.page.title().catch(() => ''),
      img:   await this.screenshot(),
    };
    this.broadcast('screenshot', { img: result.img, url: result.url, title: result.title });
    return result;
  }

  // ── Click at x,y ─────────────────────────────────────────────────────────
  async click(x, y) {
    if (!this.page) throw new Error('Browser not running');
    await this.page.mouse.click(x, y);
    // Short settle delay then grab screenshot immediately
    await this._delay(120);
    const img   = await this.screenshot();
    const url   = this.page.url();
    const title = await this.page.title().catch(() => '');
    this.broadcast('screenshot', { img, url, title });
    // Background: wait for network + extract session without blocking response
    this.page.waitForNetworkIdle({ timeout: 2000, idleTime: 250 }).catch(() => {}).then(async () => {
      const img2  = await this.screenshot();
      const url2  = this.page.url();
      const title2 = await this.page.title().catch(() => '');
      this.broadcast('screenshot', { img: img2, url: url2, title: title2 });
      const session = await this._tryExtractSession();
      if (session) this.broadcast('session_saved', { session });
    });
    return { img, url, title, session: null };
  }

  // ── Keypress ─────────────────────────────────────────────────────────────
  async keypress(key, ctrl = false, shift = false) {
    if (!this.page) throw new Error('Browser not running');
    const mods = [];
    if (ctrl)  mods.push('Control');
    if (shift) mods.push('Shift');

    // Map common JS keys to Puppeteer keys
    const MAP = {
      Enter: 'Enter', Backspace: 'Backspace', Tab: 'Tab', Escape: 'Escape',
      Delete: 'Delete', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
      ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
      Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
      F5: 'F5', ' ': 'Space',
    };

    const ppKey = MAP[key] || (key.length === 1 ? key : null);
    if (!ppKey) return { img: await this.screenshot() };

    if (mods.length) await this.page.keyboard.down(mods[0]);
    await this.page.keyboard.press(ppKey);
    if (mods.length) await this.page.keyboard.up(mods[0]);

    await this._delay(100);
    const img   = await this.screenshot();
    const url   = this.page.url();
    const title = await this.page.title().catch(() => '');
    this.broadcast('screenshot', { img, url, title });
    // Background settle for keys like Enter that may navigate
    this.page.waitForNetworkIdle({ timeout: 2000, idleTime: 250 }).catch(() => {}).then(async () => {
      const img2 = await this.screenshot();
      const url2 = this.page.url();
      const title2 = await this.page.title().catch(() => '');
      this.broadcast('screenshot', { img: img2, url: url2, title: title2 });
    });
    return { img, url, title };
  }

  // ── Scroll ────────────────────────────────────────────────────────────────
  async scroll(deltaY = 300) {
    if (!this.page) throw new Error('Browser not running');
    await this.page.mouse.wheel({ deltaY });
    await this._delay(500);
    const img = await this.screenshot();
    this.broadcast('screenshot', { img });
    return { img };
  }

  // ── Back / Forward / Reload ──────────────────────────────────────────────
  async goBack() {
    if (!this.page) throw new Error('Browser not running');
    await this.page.goBack({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await this._delay(1000);
    const url = this.page.url();
    const img = await this.screenshot();
    this.broadcast('screenshot', { img, url });
    return { img, url };
  }

  async goForward() {
    if (!this.page) throw new Error('Browser not running');
    await this.page.goForward({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await this._delay(1000);
    const url = this.page.url();
    const img = await this.screenshot();
    this.broadcast('screenshot', { img, url });
    return { img, url };
  }

  async reload() {
    if (!this.page) throw new Error('Browser not running');
    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await this._delay(1000);
    const url   = this.page.url();
    const title = await this.page.title().catch(() => '');
    const img   = await this.screenshot();
    this.broadcast('screenshot', { img, url, title });
    return { img, url, title };
  }

  // ── Capture session from live page ───────────────────────────────────────
  async captureSession() {
    if (!this.page) return null;
    const cookies = await this.page.cookies().catch(() => []);
    const lsData  = await this.page.evaluate(() => {
      const keys = ['api_token','auth_token','token','access_token','user','userData','currentUser'];
      const out = {};
      keys.forEach(k => { try { const v = localStorage.getItem(k); if (v) { try { out[k] = JSON.parse(v); } catch { out[k] = v; } } } catch {} });
      return out;
    }).catch(() => ({}));
    // Token may be nested inside lsData.user.api_token (Shabiki's structure)
    const userObj = lsData.user || {};
    const parsedUser = typeof userObj === 'string' ? (() => { try { return JSON.parse(userObj); } catch { return {}; } })() : userObj;
    const apiToken = lsData.api_token || lsData.token || lsData.auth_token
      || parsedUser.api_token || parsedUser.public_api_access_token
      || cookies.find(c => c.name.toLowerCase().includes('token'))?.value || null;
    const session = {
      success: true,
      phone: this.session?.phone || null,
      url: this.page.url(),
      title: await this.page.title().catch(() => ''),
      apiToken,
      cookies: cookies.map(c => ({ name: c.name, value: c.value, domain: c.domain })),
      localStorage: lsData,
      savedAt: new Date().toISOString(),
    };
    if (apiToken || cookies.length > 2) {
      this.saveSession(session);
      this.broadcast('session_saved', { session });
    }
    return session;
  }

  // ── Try to extract session silently (no-throw) ───────────────────────────
  async _tryExtractSession() {
    try { return await this.captureSession(); } catch { return null; }
  }

  // ── Screenshot ────────────────────────────────────────────────────────────
  async screenshot() {
    if (!this.page) return null;
    try {
      const buf = await this.page.screenshot({ encoding: 'base64', fullPage: false, type: 'jpeg', quality: 72 });
      return `data:image/jpeg;base64,${buf}`;
    } catch { return null; }
  }

  // ── Restore ───────────────────────────────────────────────────────────────
  async restoreSessionToBrowser() {
    if (!this.session) return false;
    await this.launch();
    try {
      const lsData = this.session.localStorage || {};

      // Extract api_token from wherever it lives in the session
      const userObj = lsData.user || {};
      const apiToken = this.session.apiToken
        || (typeof userObj === 'string' ? JSON.parse(userObj).api_token : userObj.api_token)
        || null;

      // ── KEY FIX: inject localStorage BEFORE the page scripts run ──
      // evaluateOnNewDocument runs at the very start of each page load,
      // before any SPA code executes, so the SPA reads the injected data.
      // Also inject lang:en to prevent userLink?lang=null validation failure.
      const enrichedLsData = { lang: 'en', language: 'en', ...lsData };
      await this.page.evaluateOnNewDocument((lsData) => {
        try {
          Object.entries(lsData).forEach(([key, value]) => {
            try {
              const v = typeof value === 'string' ? value : JSON.stringify(value);
              window.localStorage.setItem(key, v);
            } catch {}
          });
        } catch {}
      }, enrichedLsData);

      // Set cookies BEFORE navigation so they're sent with the first request
      const cookies = (this.session.cookies || []).map(c => ({
        name: c.name, value: c.value,
        domain: c.domain || '.shabiki.com', path: '/'
      }));

      // Intercept network requests to capture auth validation calls
      const authCalls = [];
      await this.page.setRequestInterception(true).catch(() => {});
      const reqHandler = async (req) => {
        let url = req.url();
        const isFapi = url.includes('fapi.shabiki.com') || url.includes('shabiki.com/api');
        if (isFapi) {
          authCalls.push({ method: req.method(), url: url.substring(0, 120) });
        }
        // Fix lang=null → lang=en in userLink validation call
        if (url.includes('/user/userLink') && url.includes('lang=null')) {
          url = url.replace('lang=null', 'lang=en');
          req.continue({ url }).catch(() => req.continue().catch(() => {}));
          return;
        }
        req.continue().catch(() => {});
      };
      const respHandler = async (resp) => {
        const url = resp.url();
        const isFapi = url.includes('fapi.shabiki.com') || url.includes('shabiki.com/api');
        if (isFapi && url.includes('userLink')) {
          const body = await resp.text().catch(() => '');
          console.log('[Restore] userLink response:', resp.status(), body.substring(0, 200));
        }
      };
      this.page.on('request', reqHandler);
      this.page.on('response', respHandler);

      // Navigate to Shabiki (localStorage is pre-injected for this load)
      await this.page.goto(SHABIKI, { waitUntil: 'domcontentloaded', timeout: 25000 });

      // Set cookies now (they persist for future navigations)
      if (cookies.length) {
        await this.page.setCookie(...cookies).catch(() => {});
      }

      // Wait for SPA to initialise and make its auth API calls
      await this._delay(4000);

      // Stop interception
      this.page.off('request', reqHandler);
      this.page.off('response', respHandler);
      await this.page.setRequestInterception(false).catch(() => {});
      console.log('[Restore] Intercepted fapi calls:', authCalls.map(c=>c.url.replace('https://fapi.shabiki.com','')).join(', '));

      // Verify localStorage actually has the user data
      const lsCheck = await this.page.evaluate(() => {
        try {
          const raw = localStorage.getItem('user');
          if (!raw) return null;
          const u = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return { id: u.id, hasToken: !!(u.api_token || u.public_api_access_token) };
        } catch { return null; }
      }).catch(() => null);

      console.log('[Restore] localStorage check:', JSON.stringify(lsCheck));

      // Check if the SPA thinks the user is logged in (look for login/logout UI)
      const loggedIn = await this.page.evaluate(() => {
        const body = document.body.innerHTML;
        const hasLogin    = /login|create.account|sign.in/i.test(body);
        const hasLogout   = /logout|my.account|balance|withdraw/i.test(body);
        const hasAvatar   = !!document.querySelector('[class*="avatar"],[class*="user-menu"],[class*="account-menu"]');
        return { hasLogin, hasLogout, hasAvatar };
      }).catch(() => ({ hasLogin: true }));

      console.log('[Restore] Page login state:', JSON.stringify(loggedIn));

      this.status = 'active';
      this.step(lsCheck?.hasToken ? '✅ Session restored & logged in' : '⚠️ Session injected but SPA may need re-auth');
      return !!(lsCheck?.hasToken);
    } catch (e) {
      this.step('⚠️ Restore failed: ' + e.message);
      return false;
    }
  }

  // ── Navigate to Aviator ───────────────────────────────────────────────────
  // PROVEN APPROACH:
  //   1. Navigate to /casino (SPA listing page — single goto, no Cloudflare Error 1000)
  //   2. Click #gtm-aviator (the Aviator nav-link) — this triggers the SPA's internal
  //      game-launch flow which sets the gameapi.plqservice.com iframe src correctly.
  //   Navigating directly to /casino/game/116234 does NOT trigger the game component.
  async navigateToAviator() {
    await this.launch();
    this.status = 'navigating';
    this.step('🎮 Opening Aviator…');

    const CASINO_URL = 'https://www.shabiki.com/casino';

    try {
      const lsData = (this.session && this.session.localStorage) ? this.session.localStorage : {};

      const enrichedLs = { lang: 'en', language: 'en', ...lsData };

      // Pre-inject localStorage BEFORE SPA scripts run so the SPA reads auth data.
      await this.page.evaluateOnNewDocument((ls) => {
        try {
          Object.entries(ls).forEach(([k, v]) => {
            try { window.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch {}
          });
        } catch {}
      }, enrichedLs);

      // Intercept: fix lang=null in userLink, log game requests
      const gameRequests = [];
      await this.page.setRequestInterception(true);

      const reqH = req => {
        let url = req.url();
        if (url.includes('/user/userLink') && url.includes('lang=null')) {
          url = url.replace('lang=null', 'lang=en');
          req.continue({ url }).catch(() => req.continue().catch(() => {}));
          return;
        }
        const isGame = url.includes('spribe') || url.includes('gameapi') || url.includes('plqservice');
        if (isGame) {
          gameRequests.push({ type: 'req', method: req.method(), url: url.substring(0, 200) });
          console.log('[Aviator] → REQ', req.method(), url.substring(0, 150));
        }
        req.continue().catch(() => {});
      };

      const respH = async resp => {
        const url = resp.url();
        const isGame = url.includes('spribe') || url.includes('gameapi') || url.includes('plqservice');
        if (isGame) {
          let body = '';
          try { body = (await resp.text()).substring(0, 300); } catch {}
          gameRequests.push({ type: 'resp', status: resp.status(), url: url.substring(0, 200), body });
          console.log('[Aviator] ← RESP', resp.status(), url.substring(0, 100));
        }
        if (url.includes('userLink')) {
          let body = ''; try { body = (await resp.text()).substring(0, 200); } catch {}
          console.log('[Aviator] userLink:', resp.status(), body);
        }
      };

      this.page.on('request', reqH);
      this.page.on('response', respH);

      // ── Step 1: Navigate to casino listing (one goto) ─────────────────────
      this.step('🎮 Loading casino page…');
      await this.page.goto(CASINO_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
        .catch(e => this.step('⚠️ goto warn: ' + e.message));

      // Wait for SPA to fully boot and auth to validate
      await this._delay(5000);

      // Verify login state
      const loggedIn = await this.page.evaluate(() => {
        const body = document.body.innerHTML;
        return {
          hasLogout: /Logout|logout/.test(body),
          lsUser:    !!localStorage.getItem('user'),
          url:       window.location.href,
        };
      }).catch(() => ({ hasLogout: false }));
      console.log('[Aviator] Casino page state:', JSON.stringify(loggedIn));
      this.step(loggedIn.hasLogout ? '✅ Logged in — clicking Aviator…' : '⚠️ Session may need refresh');

      // ── Step 2: Click #gtm-aviator to launch game via SPA ────────────────
      // This is the ONLY reliable way to trigger Shabiki's SPA game launch.
      // The SPA constructs the gameapi.plqservice.com iframe URL from localStorage.
      const aviatorClicked = await this.page.evaluate(async () => {
        const el = document.getElementById('gtm-aviator');
        if (!el) return false;
        el.click();
        return true;
      }).catch(() => false);

      if (aviatorClicked) {
        this.step('🎮 Aviator clicked — waiting for game iframe…');
      } else {
        // Fallback: navigate to game URL via JS (no new HTTP request to Cloudflare)
        this.step('⚠️ #gtm-aviator not found — using JS router nav…');
        await this.page.evaluate(() => {
          window.history.pushState({}, '', '/casino/game/116234');
          window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
        }).catch(() => {});
      }

      // ── Step 3: Wait for game iframe to appear ────────────────────────────
      let iframeFound = false;
      let iframeSrc   = '';
      const isGameIframe = (src) =>
        src && src !== 'about:blank' && !src.includes('WebPush')
        && !src.includes('clarity') && !src.includes('hotjar')
        && !src.includes('analytics') && !src.startsWith('javascript');

      try {
        await this.page.waitForFunction(() => {
          const frames = Array.from(document.querySelectorAll('iframe'));
          return frames.some(f => {
            const s = f.src || '';
            return s && s !== 'about:blank' && !s.includes('WebPush')
              && !s.includes('clarity') && !s.includes('hotjar')
              && !s.startsWith('javascript');
          });
        }, { timeout: 20000 });

        iframeSrc = await this.page.evaluate(() => {
          const frames = Array.from(document.querySelectorAll('iframe'));
          const real = frames.find(f => {
            const s = f.src || '';
            return s && s !== 'about:blank' && !s.includes('WebPush') && !s.includes('clarity');
          });
          return real ? real.src : frames.map(f => f.src).join(' | ');
        });
        this.step('🎮 Game iframe: ' + iframeSrc.substring(0, 100));
        iframeFound = true;
        await this._delay(5000); // let the game render
      } catch {
        const allFrames = await this.page.evaluate(() =>
          Array.from(document.querySelectorAll('iframe')).map(f => f.src)
        ).catch(() => []);
        this.step('⏰ Iframe wait timeout — frames: ' + JSON.stringify(allFrames).substring(0, 150));
      }

      // ── Final screenshot ──────────────────────────────────────────────────
      this.page.off('request', reqH);
      this.page.off('response', respH);
      await this.page.setRequestInterception(false).catch(() => {});

      const finalUrl   = this.page.url();
      const finalTitle = await this.page.title().catch(() => '');
      const img        = await this.screenshot();
      this.status = 'active';
      this.broadcast('screenshot', { img, url: finalUrl, title: finalTitle });
      this.step(iframeFound ? '✅ Aviator game loaded!' : '⚠️ Game page ready (iframe not yet visible)');
      console.log('[Aviator] gameRequests:', JSON.stringify(gameRequests.slice(-5), null, 2));
      return { img, url: finalUrl, title: finalTitle, restored: loggedIn.lsUser, clicked: aviatorClicked, iframeFound, iframeSrc, gameRequests };

    } catch (err) {
      await this.page.setRequestInterception(false).catch(() => {});
      this.step('⚠️ Aviator error: ' + err.message);
      const img = await this.screenshot().catch(() => null);
      if (img) this.broadcast('screenshot', { img });
      this.status = 'active';
      return { img, url: this.page?.url(), title: '', restored: false, error: err.message };
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  async _clickFirstMatch(page, selectors) {
    for (const sel of selectors) {
      try { const el = await page.$(sel); if (el) { await el.click(); return true; } } catch {}
    }
    return false;
  }

  async _waitForFirstMatch(page, selectors, timeout = 8000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      for (const sel of selectors) {
        try { const el = await page.$(sel); if (el) return el; } catch {}
      }
      await this._delay(200);
    }
    return null;
  }

  _delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  async close() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null; this.page = null; this.status = 'idle';
    }
  }
}

module.exports = new BrowserManager();
