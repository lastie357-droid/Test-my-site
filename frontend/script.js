/* ─────────────────────────────────────────────
   Shabiki Remote-Browser Dashboard
   ───────────────────────────────────────────── */
const API      = '/api';
const STORE    = 'shabiki_browser_v1';
const VP_W     = 1366;   // Puppeteer viewport width
const VP_H     = 768;    // Puppeteer viewport height

// ── DOM refs ──────────────────────────────────
const addressBar     = document.getElementById('addressBar');
const goBtn          = document.getElementById('goBtn');
const backBtn        = document.getElementById('backBtn');
const fwdBtn         = document.getElementById('fwdBtn');
const reloadBtn      = document.getElementById('reloadBtn');
const launchBtn      = document.getElementById('launchBtn');
const splashLaunchBtn= document.getElementById('splashLaunchBtn');
const resumeBtn      = document.getElementById('resumeBtn');
const saveSessionBtn = document.getElementById('saveSessionBtn');
const barStatus      = document.getElementById('barStatus');
const barStatusText  = document.getElementById('barStatusText');
const secIcon        = document.getElementById('secIcon');

const splash         = document.getElementById('splash');
const splashSession  = document.getElementById('splashSession');
const splashSessionText = document.getElementById('splashSessionText');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingLabel   = document.getElementById('loadingLabel');
const browserShot    = document.getElementById('browserShot');
const pageInfoBar    = document.getElementById('pageInfoBar');
const pageTitle      = document.getElementById('pageTitle');
const sessionStatusDot = document.getElementById('sessionStatusDot');

const sessionBadge   = document.getElementById('sessionBadge');
const sessionPhone   = document.getElementById('sessionPhone');

const showManualBtn  = document.getElementById('showManualBtn');
const manualImportBox= document.getElementById('manualImportBox');
const importTokenBtn = document.getElementById('importTokenBtn');
const importStatus   = document.getElementById('importStatus');

// ── State ─────────────────────────────────────
let browserActive  = false;
let currentUrl     = 'https://www.shabiki.com';
let lastShot       = null;
let shotPollTimer  = null;
let shotSeq        = 0;   // debounce rapid-fire screenshots
let isBusy         = false;
let savedSession   = null;

// ── TAB NAVIGATION ───────────────────────────
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.tab;
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + id)?.classList.add('active');
    if (id === 'tools')   loadTools();
    if (id === 'reports') loadReports();
  });
});

// ── STATUS BAR ────────────────────────────────
function setStatus(state, label) {
  barStatus.className = 'bar-status ' + state;
  barStatusText.textContent = label;
}

// ── LAUNCH BROWSER ────────────────────────────
async function launchBrowser() {
  if (browserActive) return;
  setStatus('busy', 'Launching…');
  setLoading(true, '🚀 Starting Chromium…');
  launchBtn.textContent = '⏳';
  launchBtn.disabled = true;

  try {
    // Ensure browser is up by doing a navigate — server auto-launches
    const url = addressBar.value.trim() || 'https://www.shabiki.com';
    await doNavigate(url);
  } catch (e) {
    setStatus('error', 'Launch failed');
    setLoading(false);
    launchBtn.textContent = '🚀 Launch';
    launchBtn.disabled = false;
  }
}

// ── NAVIGATE ──────────────────────────────────
async function doNavigate(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  addressBar.value = url;
  setStatus('busy', 'Loading…');
  setLoading(true, '🌐 Navigating…');

  try {
    const res  = await fetch(`${API}/browser/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    showShot(data.img);
    addressBar.value = data.url || url;
    if (data.title) pageTitle.textContent = data.title;
    updateSecIcon(data.url || url);
    setStatus('ready', 'Ready');
    showBrowserUI();
  } finally {
    setLoading(false);
    launchBtn.textContent = '🔄 Refresh';
    launchBtn.classList.add('active');
    launchBtn.disabled = false;
  }
}

function showBrowserUI() {
  if (!browserActive) {
    browserActive = true;
    splash.classList.add('hidden');
    browserShot.classList.remove('hidden');
    pageInfoBar.classList.remove('hidden');
    saveSessionBtn.classList.remove('hidden');
  }
}

// ── SCREENSHOT DISPLAY ────────────────────────
function showShot(img) {
  if (!img || img === lastShot) return;
  lastShot = img;
  browserShot.src = img;
  showBrowserUI();
}

// ── LOADING OVERLAY ───────────────────────────
function setLoading(on, label = 'Loading…') {
  loadingOverlay.classList.toggle('hidden', !on);
  loadingLabel.textContent = label;
  isBusy = on;
}

// ── CLICK FORWARDING ─────────────────────────
browserShot.addEventListener('click', async (e) => {
  if (isBusy) return;
  browserShot.classList.add('focused');

  const rect = browserShot.getBoundingClientRect();
  const scaleX = VP_W / rect.width;
  const scaleY = VP_H / rect.height;
  const x = Math.round((e.clientX - rect.left) * scaleX);
  const y = Math.round((e.clientY - rect.top)  * scaleY);

  setStatus('busy', 'Clicking…');
  try {
    const res  = await fetch(`${API}/browser/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    });
    const data = await res.json();
    if (data.img) {
      showShot(data.img);
      if (data.url) { addressBar.value = data.url; updateSecIcon(data.url); }
      if (data.title) pageTitle.textContent = data.title;
      autoDetectSession(data);
    }
  } finally { setStatus('ready', 'Ready'); }
});

// ── KEYBOARD FORWARDING ──────────────────────
browserShot.addEventListener('keydown', async (e) => {
  e.preventDefault();
  if (isBusy) return;

  const key = e.key;
  const ctrl = e.ctrlKey;

  // Allow ctrl shortcuts through
  if (ctrl && ['r','l'].includes(key)) { e.preventDefault(); return; }

  try {
    const res  = await fetch(`${API}/browser/keypress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, ctrl, shift: e.shiftKey })
    });
    const data = await res.json();
    if (data.img) {
      showShot(data.img);
      if (data.url)   { addressBar.value = data.url; updateSecIcon(data.url); }
      if (data.title) pageTitle.textContent = data.title;
      autoDetectSession(data);
    }
  } catch {}
});

// ── SCROLL FORWARDING ────────────────────────
browserShot.addEventListener('wheel', async (e) => {
  e.preventDefault();
  if (isBusy) return;
  const my = ++shotSeq;
  await new Promise(r => setTimeout(r, 80));
  if (my !== shotSeq) return;  // debounce

  try {
    const res  = await fetch(`${API}/browser/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deltaY: e.deltaY })
    });
    const data = await res.json();
    if (data.img) showShot(data.img);
  } catch {}
}, { passive: false });

// ── ADDRESS BAR ──────────────────────────────
addressBar.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    doNavigate(addressBar.value.trim());
  }
});
goBtn.addEventListener('click', () => doNavigate(addressBar.value.trim()));

function updateSecIcon(url) {
  secIcon.textContent = url?.startsWith('https') ? '🔒' : '⚠️';
}

// ── NAV BUTTONS ──────────────────────────────
backBtn.addEventListener('click', async () => {
  setLoading(true, '← Going back…');
  try {
    const d = await apiPost(`${API}/browser/back`);
    if (d.img) { showShot(d.img); addressBar.value = d.url || addressBar.value; }
  } finally { setLoading(false); }
});

fwdBtn.addEventListener('click', async () => {
  setLoading(true, '→ Going forward…');
  try {
    const d = await apiPost(`${API}/browser/forward`);
    if (d.img) { showShot(d.img); addressBar.value = d.url || addressBar.value; }
  } finally { setLoading(false); }
});

reloadBtn.addEventListener('click', async () => {
  setLoading(true, '↺ Reloading…');
  try {
    const d = await apiPost(`${API}/browser/reload`);
    if (d.img) { showShot(d.img); }
  } finally { setLoading(false); setStatus('ready', 'Ready'); }
});

// ── LAUNCH BUTTONS ────────────────────────────
launchBtn.addEventListener('click', () => {
  if (browserActive) {
    doNavigate(addressBar.value.trim());
  } else {
    launchBrowser();
  }
});
splashLaunchBtn.addEventListener('click', launchBrowser);

// ── RESUME SESSION ────────────────────────────
resumeBtn?.addEventListener('click', async () => {
  setLoading(true, '🔄 Restoring session…');
  try {
    const d = await apiPost(`${API}/browser/restore`);
    if (d.img) {
      showShot(d.img);
      setStatus('ready', 'Session restored');
      showBrowserUI();
    }
  } finally { setLoading(false); }
});

// ── SAVE SESSION ─────────────────────────────
saveSessionBtn.addEventListener('click', async () => {
  try {
    const d = await fetch(`${API}/browser/session`).then(r => r.json());
    if (d.phone || d.apiToken) {
      saveLocal(d);
      renderSessionBadge(d);
      setStatus('ready', '✅ Session saved');
    } else {
      // Force-save current cookies/state
      const d2 = await apiPost(`${API}/browser/capture-session`);
      if (d2.session) { saveLocal(d2.session); renderSessionBadge(d2.session); }
      setStatus('ready', '✅ Captured');
    }
  } catch {}
});

// ── AUTO SESSION DETECT ───────────────────────
function autoDetectSession(data) {
  if (data.session) {
    saveLocal(data.session);
    renderSessionBadge(data.session);
    sessionStatusDot.textContent = '⬤ Session active';
    sessionStatusDot.className = 'session-status-dot active-session';
    saveSessionBtn.textContent = '💾 Saved ✅';
    setTimeout(() => { saveSessionBtn.textContent = '💾 Save'; }, 2000);
  }
}

// ── MANUAL TOKEN IMPORT ───────────────────────
showManualBtn.addEventListener('click', () => {
  manualImportBox.classList.toggle('hidden');
  showManualBtn.textContent = manualImportBox.classList.contains('hidden')
    ? 'Already logged in? Paste your token →'
    : 'Hide ↑';
});

importTokenBtn.addEventListener('click', async () => {
  const token = document.getElementById('manualToken').value.trim();
  const phone = document.getElementById('manualPhone').value.trim();
  if (!token) { importStatus.textContent = '❌ Token required'; importStatus.className = 'manual-import-status error'; return; }
  importStatus.textContent = '⏳ Importing…'; importStatus.className = 'manual-import-status';
  try {
    const res  = await fetch(`${API}/browser/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, apiToken: token })
    });
    const data = await res.json();
    if (data.ok) {
      saveLocal(data.session);
      renderSessionBadge(data.session);
      importStatus.textContent = '✅ Imported — session active!';
      importStatus.className = 'manual-import-status ok';
      sessionStatusDot.textContent = '⬤ Session active';
      sessionStatusDot.className = 'session-status-dot active-session';
      document.getElementById('manualToken').value = '';
    } else {
      importStatus.textContent = '❌ ' + (data.error || 'Failed');
      importStatus.className = 'manual-import-status error';
    }
  } catch (e) {
    importStatus.textContent = '❌ ' + e.message;
    importStatus.className = 'manual-import-status error';
  }
});

// ── CLEAR SESSION ─────────────────────────────
document.getElementById('navClearBtn')?.addEventListener('click', () => {
  localStorage.removeItem(STORE);
  savedSession = null;
  sessionBadge.classList.add('hidden');
  splashSession.classList.add('hidden');
  sessionStatusDot.textContent = '⬤ No session';
  sessionStatusDot.className = 'session-status-dot no-session';
  fetch(`${API}/browser/session`, { method: 'DELETE' }).catch(() => {});
});

// ── SESSION PERSISTENCE ───────────────────────
function saveLocal(s) {
  savedSession = s;
  try { localStorage.setItem(STORE, JSON.stringify(s)); } catch {}
}
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORE)); } catch { return null; }
}
function renderSessionBadge(s) {
  if (!s?.phone && !s?.apiToken) return;
  const label = s.phone || 'session';
  sessionPhone.textContent = label;
  sessionBadge.classList.remove('hidden');
}

// ── WEBSOCKET ─────────────────────────────────
function connectWS() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}`);

  ws.onopen = () => {};

  ws.onmessage = ({ data }) => {
    let msg; try { msg = JSON.parse(data); } catch { return; }

    if (msg.event === 'screenshot' && msg.img) {
      showShot(msg.img);
      if (msg.url)   addressBar.value = msg.url;
      if (msg.title) pageTitle.textContent = msg.title;
    }

    if (msg.event === 'browser_step') {
      setStatus('busy', msg.label.replace(/^[🚀🌐🔍📝⌨️🔑✅❌⏳⏳]\s*/, '').substring(0, 40));
      if (!isBusy && msg.label.startsWith('🚀')) setLoading(true, msg.label);
    }

    if (msg.event === 'session_saved') {
      const s = msg.session;
      if (s) {
        saveLocal(s);
        renderSessionBadge(s);
        sessionStatusDot.textContent = '⬤ Session active';
        sessionStatusDot.className = 'session-status-dot active-session';
      }
    }

    if (msg.event === 'cf_blocked') {
      setLoading(false);
      setStatus('error', 'CF blocked — use manual import');
      manualImportBox.classList.remove('hidden');
      showManualBtn.textContent = 'Hide ↑';
    }

    if (msg.event === 'connected' && msg.session) {
      savedSession = msg.session;
      splashSession.classList.remove('hidden');
      splashSessionText.textContent = `Session saved — ${msg.session.phone || 'ready'}`;
      renderSessionBadge(msg.session);
    }
  };

  ws.onclose = () => setTimeout(connectWS, 2000);
  ws.onerror = () => {};
}

// ── TOOLS ─────────────────────────────────────
async function loadTools() {
  const grid = document.getElementById('toolsGrid');
  grid.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const tools = await fetch(`${API}/tools/list`).then(r => r.json());
    const inst  = [];
    grid.innerHTML = tools.map(t => {
      if (t.installed) inst.push(t.name);
      return `<div class="tool-card">
        <h4>${t.name}</h4>
        <div class="tool-category">${t.category}</div>
        <p>${t.description}</p>
        <div class="tool-status ${t.installed ? 'installed' : 'not-installed'}">${t.installed ? '✅ Installed' : '⚠️ Not installed'}</div>
        <a href="${t.website}" target="_blank" style="font-size:11px;color:var(--accent);margin-top:6px;display:block">Learn more →</a>
      </div>`;
    }).join('') || '<p style="color:var(--muted)">No tools found.</p>';

    const sel = document.getElementById('toolSelect');
    sel.innerHTML = '<option value="">-- Select --</option>';
    inst.forEach(n => sel.innerHTML += `<option value="${n.toLowerCase()}">${n}</option>`);
  } catch (e) { grid.innerHTML = `<p style="color:var(--accent)">${e.message}</p>`; }
}

document.getElementById('toolForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const tool = document.getElementById('toolSelect').value;
  const target = document.getElementById('toolTarget').value;
  const options = document.getElementById('toolOptions').value;
  const status = document.getElementById('toolStatus');
  if (!tool) { alert('Select a tool first'); return; }
  showMsg(status, `⏳ Running ${tool}…`, 'info');
  try {
    const res = await fetch(`${API}/tools/run`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, target, options })
    });
    const d = await res.json();
    if (res.ok) {
      document.getElementById('toolOutput').textContent = d.output || 'Done';
      document.getElementById('toolOutputPanel').style.display = 'block';
      showMsg(status, '✅ Done', 'success');
    } else showMsg(status, '❌ ' + d.error, 'error');
  } catch (e) { showMsg(status, '❌ ' + e.message, 'error'); }
});

// ── REPORTS ───────────────────────────────────
async function loadReports() {
  const list = document.getElementById('reportsList');
  list.innerHTML = '<p style="color:var(--muted)">Loading…</p>';
  try {
    const reports = await fetch(`${API}/reports/list`).then(r => r.json());
    if (!reports.length) { list.innerHTML = '<p style="color:var(--muted)">No reports.</p>'; return; }
    list.innerHTML = reports.map(r => `
      <div class="report-card">
        <div class="report-header">
          <div class="report-title">${r.testName}</div>
          <div class="report-severity ${r.severity}">${(r.severity||'low').toUpperCase()}</div>
        </div>
        <div class="report-domain">🌐 ${r.domain}</div>
        <div class="report-date">📅 ${new Date(r.createdAt).toLocaleDateString()}</div>
        <div class="report-actions">
          <button class="btn btn-secondary btn-sm" onclick="alert('${r.id}')">View</button>
          <button class="btn btn-sm" style="background:var(--accent);color:white" onclick="deleteReport('${r.id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch (e) { list.innerHTML = `<p style="color:var(--accent)">${e.message}</p>`; }
}

document.getElementById('reportForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const st = document.getElementById('reportStatus');
  showMsg(st, 'Saving…', 'info');
  try {
    const res = await fetch(`${API}/reports/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testName: document.getElementById('reportName').value,
        domain:   document.getElementById('reportDomain').value,
        findings: document.getElementById('reportFindings').value.split('\n')
          .filter(f => f.trim()).map(f => ({ type: 'Finding', description: f, severity: 'medium' }))
      })
    });
    const d = await res.json();
    res.ok ? showMsg(st, '✅ Saved: ' + d.fileName, 'success') : showMsg(st, '❌ ' + d.error, 'error');
    if (res.ok) loadReports();
  } catch (e) { showMsg(st, '❌ ' + e.message, 'error'); }
});

function deleteReport(id) {
  if (!confirm('Delete?')) return;
  fetch(`${API}/reports/${id}`, { method: 'DELETE' }).then(() => loadReports());
}

// ── SERVER BROWSER POLL ───────────────────────
async function checkServerBrowser() {
  try {
    const d = await fetch(`${API}/browser/status`).then(r => r.json());
    if (d.status === 'active' || d.status === 'navigating') {
      // Already ready — grab screenshot
      const s = await fetch(`${API}/browser/screenshot`).then(r => r.ok ? r.json() : null);
      if (s?.img) { showShot(s.img); setStatus('ready', 'Browser active'); }
    } else if (d.status === 'launching') {
      // Still starting — show loading, then poll
      setLoading(true, d.lastStep || 'Starting Chromium…');
      launchBtn.disabled = true;
      splashLaunchBtn.disabled = true;
      pollUntilReady();
    }
    if (d.session) { saveLocal(d.session); renderSessionBadge(d.session); }
  } catch {}
}

function pollUntilReady() {
  const timer = setInterval(async () => {
    try {
      const d = await fetch(`${API}/browser/status`).then(r => r.json());
      if (d.lastStep) setLoading(true, d.lastStep);
      if (d.status === 'active' || d.status === 'navigating') {
        clearInterval(timer);
        const s = await fetch(`${API}/browser/screenshot`).then(r => r.ok ? r.json() : null);
        if (s?.img) { showShot(s.img); setStatus('ready', 'Ready'); }
        setLoading(false);
        launchBtn.disabled = false;
        launchBtn.textContent = '🔄 Refresh';
        launchBtn.classList.add('active');
        splashLaunchBtn.disabled = false;
      } else if (d.status === 'idle' || d.status === 'error') {
        clearInterval(timer);
        setLoading(false);
        launchBtn.disabled = false;
        splashLaunchBtn.disabled = false;
        if (d.status === 'error') setStatus('error', d.lastStep || 'Error');
      }
    } catch { clearInterval(timer); setLoading(false); }
  }, 1500);
}

// ── UTILS ─────────────────────────────────────
function showMsg(el, msg, type) {
  el.textContent = msg;
  el.className = 'status-message ' + type;
}
async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

// ── VIRTUAL KEYBOARD ──────────────────────────
(function initVirtualKeyboard() {
  const vkPanel     = document.getElementById('vkPanel');
  const vkToggleBtn = document.getElementById('vkToggleBtn');
  const vkCloseBtn  = document.getElementById('vkCloseBtn');
  const vkHeader    = document.getElementById('vkHeader');
  const vkShiftBtns = document.querySelectorAll('.vk-shift');
  const vkCapsBtn   = document.getElementById('vkCapsBtn');

  let vkShiftOn = false;
  let vkCapsOn  = false;

  // ── Toggle open/close ──
  function openVK() {
    vkPanel.classList.remove('hidden');
    vkToggleBtn.classList.add('active');
  }
  function closeVK() {
    vkPanel.classList.add('hidden');
    vkToggleBtn.classList.remove('active');
  }

  vkToggleBtn.addEventListener('click', () => {
    vkPanel.classList.contains('hidden') ? openVK() : closeVK();
  });
  vkCloseBtn.addEventListener('click', closeVK);

  // ── Drag to reposition ──
  let dragging = false, dragOffX = 0, dragOffY = 0;

  vkHeader.addEventListener('mousedown', e => {
    if (e.target === vkCloseBtn) return;
    dragging = true;
    const rect = vkPanel.getBoundingClientRect();
    dragOffX = e.clientX - rect.left;
    dragOffY = e.clientY - rect.top;
    vkPanel.style.transition = 'none';
    vkPanel.style.bottom = 'auto';
    vkPanel.style.right  = 'auto';
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    vkPanel.style.left = (e.clientX - dragOffX) + 'px';
    vkPanel.style.top  = (e.clientY - dragOffY) + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });

  // ── Shift & Caps state ──
  function setShift(on) {
    vkShiftOn = on;
    vkShiftBtns.forEach(b => b.classList.toggle('vk-active', on));
    updateKeyLabels();
  }

  function updateKeyLabels() {
    const upper = vkShiftOn !== vkCapsOn; // XOR: either shift or caps (not both)
    document.querySelectorAll('.vk-key[data-key]').forEach(btn => {
      const k = btn.dataset.key;
      if (k && k.length === 1 && k >= 'a' && k <= 'z') {
        btn.textContent = upper ? k.toUpperCase() : k.toUpperCase();
      }
    });
  }

  // ── Send key to browser ──
  async function sendKey(key, shift = false, ctrl = false) {
    if (isBusy) return;
    try {
      const res  = await fetch(`${API}/browser/keypress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, shift, ctrl })
      });
      const data = await res.json();
      if (data.img) {
        showShot(data.img);
        if (data.url)   { addressBar.value = data.url; updateSecIcon(data.url); }
        if (data.title) pageTitle.textContent = data.title;
        autoDetectSession(data);
      }
    } catch {}
  }

  // ── Key click handler ──
  document.querySelectorAll('.vk-key').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault()); // keep browser focus on shot

    btn.addEventListener('click', async () => {
      const key = btn.dataset.key;
      if (!key) return;

      if (key === 'Shift') {
        setShift(!vkShiftOn);
        return;
      }

      if (key === 'CapsLock') {
        vkCapsOn = !vkCapsOn;
        vkCapsBtn.classList.toggle('vk-active', vkCapsOn);
        updateKeyLabels();
        await sendKey('CapsLock');
        return;
      }

      const useShift = vkShiftOn;
      let sendKeyVal = key;

      if (key.length === 1 && key >= 'a' && key <= 'z') {
        sendKeyVal = useShift || vkCapsOn ? key.toUpperCase() : key;
      }

      await sendKey(sendKeyVal, useShift);

      if (vkShiftOn) setShift(false);
    });
  });
})();

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  connectWS();

  // Restore local session
  const saved = loadLocal();
  if (saved) {
    savedSession = saved;
    splashSession.classList.remove('hidden');
    splashSessionText.textContent = `Session saved — ${saved.phone || saved.apiToken?.substring(0,12) + '…' || 'ready'}`;
    renderSessionBadge(saved);
    sessionStatusDot.textContent = '⬤ Session active';
    sessionStatusDot.className = 'session-status-dot active-session';
  }

  // If server already has a running browser, grab a screenshot + poll while launching
  checkServerBrowser();
});
