const API_BASE = '/api';
const STORAGE_KEY = 'shabiki_session';

// ── DOM refs ──
const loginForm   = document.getElementById('loginForm');
const loginBtn    = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');
const userDataCard   = document.getElementById('userDataCard');
const apiResponse    = document.getElementById('apiResponse');
const shabikiFrame   = document.getElementById('shabikiFrame');
const shabikiFrameFull = document.getElementById('shabikiFrameFull');
const liveUrl        = document.getElementById('liveUrl');
const reloadSiteBtn  = document.getElementById('reloadSiteBtn');
const openTabBtn     = document.getElementById('openTabBtn');
const liveStatus     = document.getElementById('liveStatus');
const sessionBadge   = document.getElementById('sessionBadge');
const sessionPhone   = document.getElementById('sessionPhone');
const navClearBtn    = document.getElementById('navClearBtn');
const htmlModal      = document.getElementById('htmlModal');
const closeBtn       = document.querySelector('.close');

let currentSessionId = null;
let currentApiToken  = null;

// ── SESSION PERSISTENCE ──
function saveSession(phone, password, data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    phone, password,
    sessionId:   data.sessionId,
    apiToken:    data.userData?.api_token || null,
    login_status: data.login_status,
    message:     data.message,
    userData:    data.userData || null,
    savedAt:     new Date().toISOString()
  }));
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  currentSessionId = null;
  currentApiToken  = null;
  userDataCard.style.display = 'none';
  sessionBadge.classList.add('hidden');
  apiResponse.innerHTML = '<span class="empty-hint">Session cleared. Log in again.</span>';
  showStatus(loginStatus, '🗑️ Session cleared', 'info');
}

function restoreSession(s) {
  if (!s?.sessionId) return;
  if (s.phone)    document.getElementById('phone').value    = s.phone;
  if (s.password) document.getElementById('password').value = s.password;
  currentSessionId = s.sessionId;
  currentApiToken  = s.apiToken;

  apiResponse.innerHTML = `<span class="restored-hint">✅ Session restored — ${new Date(s.savedAt).toLocaleString()}</span>
<pre>${JSON.stringify(s, null, 2)}</pre>`;
  apiResponse.classList.remove('empty-box');

  renderUserCard({ login_status: s.login_status, message: s.message, sessionId: s.sessionId, userData: s.userData });
  showNavBadge(s.phone);
  showStatus(loginStatus, `✅ Session restored from ${new Date(s.savedAt).toLocaleString()}`, 'success');
}

function showNavBadge(phone) {
  sessionPhone.textContent = phone;
  sessionBadge.classList.remove('hidden');
}

// ── NAVIGATION ──
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showSection(link.getAttribute('href').substring(1));
  });
});

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const s = document.getElementById(id);
  const l = document.querySelector(`[href="#${id}"]`);
  if (s) s.classList.add('active');
  if (l) l.classList.add('active');
  if (id === 'tools')   loadTools();
  if (id === 'reports') loadReports();
}

// ── LOGIN ──
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const phone    = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;

  loginBtn.disabled = true;
  loginBtn.textContent = '⏳ Testing...';
  apiResponse.innerHTML = '<span class="empty-hint">⏳ Contacting fapi.shabiki.com...</span>';
  apiResponse.classList.remove('empty-box');
  showStatus(loginStatus, 'Sending request...', 'info');
  userDataCard.style.display = 'none';

  try {
    const res  = await fetch(`${API_BASE}/auth/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();

    currentSessionId = data.sessionId;
    currentApiToken  = data.userData?.api_token || null;

    apiResponse.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    if (data.success) {
      saveSession(phone, password, data);
      showStatus(loginStatus, `✅ ${data.message} — session saved`, 'success');
      renderUserCard(data);
      showNavBadge(phone);
      // Reload the live frame in case we can inject the token later
      reloadLiveFrame(liveUrl.value);
    } else {
      showStatus(loginStatus, `❌ ${data.message || data.login_msg}`, 'error');
    }
  } catch (err) {
    showStatus(loginStatus, `❌ ${err.message}`, 'error');
    apiResponse.innerHTML = `<span class="empty-hint">❌ Request failed: ${err.message}</span>`;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = '🚀 Test Login';
  }
});

function renderUserCard(data) {
  const u = data.userData || {};
  const rows = [
    ['Status',     data.login_status || 'OK'],
    ['Message',    data.message],
    ['Session ID', data.sessionId],
    ...(u.api_token !== undefined ? [['API Token', u.api_token]] : []),
    ...(u.username  ? [['Username', u.username]] : []),
    ...(u.balance   !== undefined ? [['Balance', u.balance]] : []),
    ...(u.currency  ? [['Currency', u.currency]] : []),
  ];

  userDataCard.innerHTML = `
    <h4>✅ Active Session</h4>
    ${rows.map(([k, v]) => `
      <div class="user-data-row">
        <span class="user-data-label">${k}</span>
        <span class="user-data-value ${k === 'API Token' ? 'token-value' : ''}">${v ?? '—'}</span>
      </div>`).join('')}
    <button class="btn btn-secondary btn-sm" id="clearSessionBtn" style="margin-top:14px;width:100%;">🗑️ Clear Session</button>
  `;
  userDataCard.style.display = 'block';
  document.getElementById('clearSessionBtn').addEventListener('click', clearSession);
}

// ── LIVE IFRAME ──
function reloadLiveFrame(url) {
  const encoded = encodeURIComponent(url);
  const src = `/api/proxy/site?url=${encoded}`;
  if (shabikiFrame)     { shabikiFrame.src = src; }
  if (shabikiFrameFull) { shabikiFrameFull.src = src; }
  const display = document.getElementById('iframeUrlDisplay');
  if (display) display.textContent = url;
  liveStatus.textContent = '🔄 Loading...';
  setTimeout(() => { liveStatus.textContent = '✅ Loaded'; }, 3000);
}

reloadSiteBtn?.addEventListener('click', () => reloadLiveFrame(liveUrl.value));

openTabBtn?.addEventListener('click', () => window.open(liveUrl.value, '_blank'));

liveUrl?.addEventListener('keydown', e => {
  if (e.key === 'Enter') reloadLiveFrame(liveUrl.value);
});

// Full-page frame controls
document.getElementById('fullpageGoBtn')?.addEventListener('click', () => {
  const url = document.getElementById('fullpageUrl').value;
  if (shabikiFrameFull) shabikiFrameFull.src = `/api/proxy/site?url=${encodeURIComponent(url)}`;
});

document.getElementById('fullpageReloadBtn')?.addEventListener('click', () => {
  if (shabikiFrameFull) shabikiFrameFull.src = shabikiFrameFull.src;
});

// Update live URL bar when iframe loads
shabikiFrame?.addEventListener('load', () => {
  liveStatus.textContent = '✅ Loaded';
});

// ── NAVBAR CLEAR ──
navClearBtn?.addEventListener('click', clearSession);

// ── TOOLS ──
async function loadTools() {
  const grid = document.getElementById('toolsGrid');
  grid.innerHTML = '<div class="loading">Loading tools...</div>';
  try {
    const res   = await fetch(`${API_BASE}/tools/list`);
    const tools = await res.json();
    const installed = [];
    grid.innerHTML = tools.map(t => {
      const cls = t.installed ? 'installed' : 'not-installed';
      const txt = t.installed ? '✅ Installed' : '⚠️ Not Installed';
      if (t.installed) installed.push(t.name);
      return `<div class="tool-card">
        <h4>${t.name}</h4>
        <div class="tool-category">${t.category}</div>
        <p>${t.description}</p>
        <div class="tool-status ${cls}">${txt}</div>
        <a href="${t.website}" target="_blank" style="font-size:11px;color:var(--shabiki-accent);margin-top:8px;display:block;">Learn more →</a>
      </div>`;
    }).join('') || '<p style="color:var(--text-muted)">No tools found.</p>';

    const toolSelect = document.getElementById('toolSelect');
    toolSelect.innerHTML = '<option value="">-- Select a tool --</option>';
    installed.forEach(n => {
      const o = document.createElement('option');
      o.value = n.toLowerCase(); o.textContent = n;
      toolSelect.appendChild(o);
    });
    if (!installed.length) toolSelect.innerHTML += '<option disabled>No tools installed</option>';
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--shabiki-accent)">Error: ${err.message}</p>`;
  }
}

document.getElementById('toolForm').addEventListener('submit', async e => {
  e.preventDefault();
  const tool    = document.getElementById('toolSelect').value;
  const target  = document.getElementById('toolTarget').value;
  const options = document.getElementById('toolOptions').value;
  const status  = document.getElementById('toolStatus');
  if (!tool) { alert('Please select a tool'); return; }
  showStatus(status, `⏳ Executing ${tool}...`, 'info');
  try {
    const res  = await fetch(`${API_BASE}/tools/run`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, target, options })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('toolOutput').textContent = data.output || 'No output';
      document.getElementById('toolOutputPanel').style.display = 'block';
      document.getElementById('toolOutputPanel').scrollIntoView({ behavior: 'smooth' });
      showStatus(status, '✅ Done', 'success');
    } else {
      showStatus(status, `❌ ${data.error}`, 'error');
    }
  } catch (err) { showStatus(status, `❌ ${err.message}`, 'error'); }
});

// ── REPORTS ──
async function loadReports() {
  const list = document.getElementById('reportsList');
  list.innerHTML = '<p style="color:var(--text-muted)">Loading...</p>';
  try {
    const res     = await fetch(`${API_BASE}/reports/list`);
    const reports = await res.json();
    if (!reports.length) { list.innerHTML = '<p style="color:var(--text-muted)">No reports yet.</p>'; return; }
    list.innerHTML = reports.map(r => `
      <div class="report-card">
        <div class="report-header">
          <div class="report-title">${r.testName}</div>
          <div class="report-severity ${r.severity}">${(r.severity||'low').toUpperCase()}</div>
        </div>
        <div class="report-domain">🌐 ${r.domain}</div>
        <div class="report-date">📅 ${new Date(r.createdAt).toLocaleDateString()}</div>
        <div class="report-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewReport('${r.id}')">View</button>
          <button class="btn btn-danger btn-sm" onclick="deleteReport('${r.id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch (err) { list.innerHTML = `<p style="color:var(--shabiki-accent)">Error: ${err.message}</p>`; }
}

document.getElementById('reportForm').addEventListener('submit', async e => {
  e.preventDefault();
  const testName = document.getElementById('reportName').value;
  const domain   = document.getElementById('reportDomain').value;
  const findings = document.getElementById('reportFindings').value
    .split('\n').filter(f => f.trim())
    .map(f => ({ type: 'Finding', description: f, severity: 'medium' }));
  const status = document.getElementById('reportStatus');
  showStatus(status, 'Creating...', 'info');
  try {
    const res  = await fetch(`${API_BASE}/reports/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testName, domain, findings })
    });
    const data = await res.json();
    if (res.ok) { showStatus(status, `✅ Created: ${data.fileName}`, 'success'); reportForm.reset(); loadReports(); }
    else        { showStatus(status, `❌ ${data.error}`, 'error'); }
  } catch (err) { showStatus(status, `❌ ${err.message}`, 'error'); }
});

function viewReport(id)   { alert('Report ID: ' + id); }
function deleteReport(id) {
  if (!confirm('Delete?')) return;
  fetch(`${API_BASE}/reports/${id}`, { method: 'DELETE' }).then(() => loadReports());
}

// ── UTILS ──
function showStatus(el, msg, type) {
  el.textContent = msg;
  el.className = `status-message ${type}`;
}

closeBtn?.addEventListener('click', () => htmlModal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === htmlModal) htmlModal.style.display = 'none'; });

function initWebSocket() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${window.location.host}`);
  ws.onopen  = () => console.log('WebSocket connected');
  ws.onclose = () => setTimeout(initWebSocket, 3000);
  ws.onerror = () => {};
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard initialized');
  initWebSocket();

  const stored = loadSession();
  if (stored?.sessionId) {
    console.log('Restoring saved session...');
    restoreSession(stored);
  }

  // Load the live site
  liveStatus.textContent = '🔄 Loading Shabiki...';
});
