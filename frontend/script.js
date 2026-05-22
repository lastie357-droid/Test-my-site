const API_BASE = '/api';
const DEFAULT_DOMAIN = 'https://www.shabiki.com';

const sections  = document.querySelectorAll('.section');
const navLinks  = document.querySelectorAll('.nav-link');
const loginForm = document.getElementById('loginForm');
const loginBtn  = document.getElementById('loginBtn');
const loginStatus = document.getElementById('loginStatus');
const userDataCard  = document.getElementById('userDataCard');
const previewContainer = document.getElementById('previewContainer');
const previewActions   = document.getElementById('previewActions');
const screenshotBtn = document.getElementById('screenshotBtn');
const analyzeBtn    = document.getElementById('analyzeBtn');
const htmlBtn       = document.getElementById('htmlBtn');
const toolForm    = document.getElementById('toolForm');
const toolSelect  = document.getElementById('toolSelect');
const reportForm  = document.getElementById('reportForm');
const htmlModal   = document.getElementById('htmlModal');
const closeBtn    = document.querySelector('.close');

let currentSessionId = null;
let currentUrl = DEFAULT_DOMAIN;

// ── NAVIGATION ──
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showSection(link.getAttribute('href').substring(1));
  });
});

function showSection(id) {
  sections.forEach(s => s.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  const s = document.getElementById(id);
  const l = document.querySelector(`[href="#${id}"]`);
  if (s) s.classList.add('active');
  if (l) l.classList.add('active');
  if (id === 'tools') loadTools();
  if (id === 'reports') loadReports();
}

// ── LOGIN ──
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const phone    = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;

  loginBtn.disabled = true;
  loginBtn.textContent = '⏳ Testing...';
  showStatus(loginStatus, 'Sending request to fapi.shabiki.com...', 'info');
  userDataCard.style.display = 'none';
  previewActions.style.display = 'none';

  previewContainer.innerHTML = `
    <div class="preview-placeholder">
      <p>⏳ Awaiting API response...</p>
    </div>`;

  try {
    const res  = await fetch(`${API_BASE}/auth/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const data = await res.json();

    currentSessionId = data.sessionId;

    // Show raw JSON response
    previewContainer.innerHTML = `<pre class="json-box">${JSON.stringify(data, null, 2)}</pre>`;

    if (data.success) {
      showStatus(loginStatus, `✅ ${data.message}`, 'success');
      renderUserCard(data);
      previewActions.style.display = 'flex';
    } else {
      showStatus(loginStatus, `❌ ${data.message || data.login_msg || 'Login failed'}`, 'error');
    }
  } catch (err) {
    showStatus(loginStatus, `❌ Error: ${err.message}`, 'error');
    previewContainer.innerHTML = `<div class="preview-placeholder"><p>❌ Request failed</p></div>`;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = '🚀 Test Login';
  }
});

function renderUserCard(data) {
  const u = data.userData || {};
  const rows = [
    ['Login Status', data.login_status || 'OK'],
    ['Message',      data.message],
    ['Session ID',   data.sessionId],
    ...(u.api_token  ? [['API Token', u.api_token]] : []),
    ...(u.username   ? [['Username', u.username]]   : []),
    ...(u.balance    ? [['Balance',  u.balance]]     : []),
    ...(u.currency   ? [['Currency', u.currency]]    : []),
  ];

  userDataCard.innerHTML = `
    <h4>✅ Login Response</h4>
    ${rows.map(([k, v]) => `
      <div class="user-data-row">
        <span class="user-data-label">${k}</span>
        <span class="user-data-value ${k === 'API Token' ? 'token-value' : ''}">${v || '—'}</span>
      </div>`).join('')}
  `;
  userDataCard.style.display = 'block';
}

// ── SCREENSHOT ──
screenshotBtn.addEventListener('click', () => takeScreenshot(currentUrl));

async function takeScreenshot(url) {
  showStatus(loginStatus, '📷 Capturing screenshot...', 'info');
  previewContainer.innerHTML = `<div class="preview-placeholder"><p>⏳ Launching headless browser...</p></div>`;

  try {
    const res  = await fetch(`${API_BASE}/preview/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, sessionId: currentSessionId })
    });
    const data = await res.json();

    if (res.ok) {
      previewContainer.innerHTML = `<img src="${data.screenshot}" alt="Screenshot" style="max-width:100%;height:auto;">`;
      showStatus(loginStatus, '✅ Screenshot captured', 'success');
    } else {
      showStatus(loginStatus, `❌ ${data.error}`, 'error');
      previewContainer.innerHTML = `<div class="preview-placeholder"><p>❌ Screenshot failed</p></div>`;
    }
  } catch (err) {
    showStatus(loginStatus, `❌ ${err.message}`, 'error');
  }
}

// ── ANALYZE ──
analyzeBtn.addEventListener('click', async () => {
  showStatus(loginStatus, '🔍 Analyzing security headers...', 'info');
  try {
    const res  = await fetch(`${API_BASE}/preview/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl })
    });
    const data = await res.json();
    if (res.ok) {
      displayAnalysisResults(data);
      showStatus(loginStatus, '✅ Analysis complete', 'success');
    } else {
      showStatus(loginStatus, `❌ ${data.error}`, 'error');
    }
  } catch (err) {
    showStatus(loginStatus, `❌ ${err.message}`, 'error');
  }
});

// ── HTML VIEW ──
htmlBtn.addEventListener('click', async () => {
  try {
    const res  = await fetch(`${API_BASE}/preview/html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('htmlContent').textContent = data.html;
      htmlModal.style.display = 'block';
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
});

function displayAnalysisResults(data) {
  const panel   = document.getElementById('analysisPanel');
  const results = document.getElementById('analysisResults');

  let html = '';
  if (data.issues && data.issues.length > 0) {
    data.issues.forEach(i => {
      html += `
        <div class="finding-item ${i.severity}">
          <div class="finding-title">🔔 ${i.type}</div>
          <div class="finding-details">
            <strong>Severity:</strong> ${i.severity.toUpperCase()}
            ${i.header ? ` &nbsp;|&nbsp; <strong>Header:</strong> ${i.header}` : ''}
            ${i.recommendation ? `<br>${i.recommendation}` : ''}
          </div>
        </div>`;
    });
  } else {
    html = '<p style="color:var(--shabiki-green)">✅ No security issues detected</p>';
  }

  results.innerHTML = html;
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth' });
}

// ── TOOLS ──
async function loadTools() {
  const grid = document.getElementById('toolsGrid');
  grid.innerHTML = '<div class="loading">Loading tools...</div>';

  try {
    const res   = await fetch(`${API_BASE}/tools/list`);
    const tools = await res.json();

    const installed = [];
    let html = '';
    tools.forEach(t => {
      const cls  = t.installed ? 'installed' : 'not-installed';
      const txt  = t.installed ? '✅ Installed' : '⚠️ Not Installed';
      html += `
        <div class="tool-card">
          <h4>${t.name}</h4>
          <div class="tool-category">${t.category}</div>
          <p>${t.description}</p>
          <div class="tool-status ${cls}">${txt}</div>
          <a href="${t.website}" target="_blank" style="font-size:11px;color:var(--shabiki-accent);margin-top:8px;display:block;">Learn more →</a>
        </div>`;
      if (t.installed) installed.push(t.name);
    });

    grid.innerHTML = html || '<p style="color:var(--text-muted)">No tools found.</p>';

    toolSelect.innerHTML = '<option value="">-- Select a tool --</option>';
    installed.forEach(n => {
      const o = document.createElement('option');
      o.value = n.toLowerCase();
      o.textContent = n;
      toolSelect.appendChild(o);
    });
    if (!installed.length) {
      toolSelect.innerHTML += '<option disabled>No tools installed</option>';
    }
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--shabiki-accent)">Error: ${err.message}</p>`;
  }
}

toolForm.addEventListener('submit', async e => {
  e.preventDefault();
  const tool   = toolSelect.value;
  const target = document.getElementById('toolTarget').value;
  const options = document.getElementById('toolOptions').value;
  const status = document.getElementById('toolStatus');

  if (!tool) { alert('Please select a tool'); return; }

  showStatus(status, `⏳ Executing ${tool}...`, 'info');

  try {
    const res  = await fetch(`${API_BASE}/tools/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, target, options })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('toolOutput').textContent = data.output || 'No output';
      document.getElementById('toolOutputPanel').style.display = 'block';
      document.getElementById('toolOutputPanel').scrollIntoView({ behavior: 'smooth' });
      showStatus(status, '✅ Tool executed', 'success');
    } else {
      showStatus(status, `❌ ${data.error}`, 'error');
    }
  } catch (err) {
    showStatus(status, `❌ ${err.message}`, 'error');
  }
});

// ── REPORTS ──
async function loadReports() {
  const list = document.getElementById('reportsList');
  list.innerHTML = '<p style="color:var(--text-muted)">Loading...</p>';

  try {
    const res     = await fetch(`${API_BASE}/reports/list`);
    const reports = await res.json();

    if (!reports.length) {
      list.innerHTML = '<p style="color:var(--text-muted)">No reports yet. Create one above!</p>';
      return;
    }

    list.innerHTML = reports.map(r => `
      <div class="report-card">
        <div class="report-header">
          <div class="report-title">${r.testName}</div>
          <div class="report-severity ${r.severity}">${(r.severity || 'low').toUpperCase()}</div>
        </div>
        <div class="report-domain">🌐 ${r.domain}</div>
        <div class="report-date">📅 ${new Date(r.createdAt).toLocaleDateString()}</div>
        <div class="report-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewReport('${r.id}')">View</button>
          <button class="btn btn-danger btn-sm" onclick="deleteReport('${r.id}')">Delete</button>
        </div>
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<p style="color:var(--shabiki-accent)">Error: ${err.message}</p>`;
  }
}

reportForm.addEventListener('submit', async e => {
  e.preventDefault();
  const testName = document.getElementById('reportName').value;
  const domain   = document.getElementById('reportDomain').value;
  const findings = document.getElementById('reportFindings').value
    .split('\n').filter(f => f.trim())
    .map(f => ({ type: 'Finding', description: f, severity: 'medium' }));
  const status = document.getElementById('reportStatus');

  showStatus(status, 'Creating report...', 'info');

  try {
    const res  = await fetch(`${API_BASE}/reports/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testName, domain, findings })
    });
    const data = await res.json();
    if (res.ok) {
      showStatus(status, `✅ Report created: ${data.fileName}`, 'success');
      reportForm.reset();
      loadReports();
    } else {
      showStatus(status, `❌ ${data.error}`, 'error');
    }
  } catch (err) {
    showStatus(status, `❌ ${err.message}`, 'error');
  }
});

function viewReport(id) { alert('Report ID: ' + id); }
function deleteReport(id) {
  if (!confirm('Delete this report?')) return;
  fetch(`${API_BASE}/reports/${id}`, { method: 'DELETE' })
    .then(() => loadReports())
    .catch(err => alert('Error: ' + err.message));
}

// ── UTILITIES ──
function showStatus(el, msg, type) {
  el.textContent = msg;
  el.className = `status-message ${type}`;
}

closeBtn.addEventListener('click', () => htmlModal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === htmlModal) htmlModal.style.display = 'none'; });

// WebSocket
function initWebSocket() {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${window.location.host}`);
  ws.onopen  = () => console.log('WebSocket connected');
  ws.onclose = () => setTimeout(initWebSocket, 3000);
  ws.onerror = () => {};
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard initialized');
  initWebSocket();
});
