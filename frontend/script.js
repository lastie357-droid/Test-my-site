// API Base URL
const API_BASE = '/api';
const DEFAULT_DOMAIN = 'https://www.shabiki.com';
const DEFAULT_LOGIN_URL = 'https://www.shabiki.com';

// DOM Elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const loginForm = document.getElementById('loginForm');
const screenshotBtn = document.getElementById('screenshotBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const htmlBtn = document.getElementById('htmlBtn');
const previewContainer = document.getElementById('previewContainer');
const loginStatus = document.getElementById('loginStatus');
const toolForm = document.getElementById('toolForm');
const toolSelect = document.getElementById('toolSelect');
const reportForm = document.getElementById('reportForm');
const htmlModal = document.getElementById('htmlModal');
const closeBtn = document.querySelector('.close');

let currentSessionId = null;
let currentUrl = null;

// Navigation
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = link.getAttribute('href').substring(1);
    showSection(sectionId);
  });
});

function showSection(sectionId) {
  sections.forEach(section => section.classList.remove('active'));
  navLinks.forEach(link => link.classList.remove('active'));
  
  const section = document.getElementById(sectionId);
  const link = document.querySelector(`[href="#${sectionId}"]`);
  
  if (section) section.classList.add('active');
  if (link) link.classList.add('active');

  // Load content when switching sections
  if (sectionId === 'tools') loadTools();
  if (sectionId === 'reports') loadReports();
}

// ============== LOGIN & PREVIEW ==============

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const domain = DEFAULT_DOMAIN;
  const loginUrl = DEFAULT_LOGIN_URL;

  currentUrl = domain;

  showStatus(loginStatus, 'Testing Shabiki login...', 'info');

  try {
    const response = await fetch(`${API_BASE}/auth/test-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        phone,
        password,
        loginUrl
      })
    });

    const data = await response.json();

    if (response.ok) {
      currentSessionId = data.sessionId;
      showStatus(loginStatus, `✅ ${data.message}`, 'success');
      
      // Auto-take screenshot after successful login
      setTimeout(() => takeScreenshot(currentUrl), 1000);
    } else {
      showStatus(loginStatus, `❌ ${data.error}`, 'error');
    }
  } catch (error) {
    showStatus(loginStatus, `❌ Error: ${error.message}`, 'error');
  }
});

screenshotBtn.addEventListener('click', async () => {
  if (!currentUrl) {
    alert('Please enter a URL first');
    return;
  }
  takeScreenshot(currentUrl);
});

async function takeScreenshot(url) {
  showStatus(loginStatus, 'Capturing screenshot...', 'info');

  try {
    const response = await fetch(`${API_BASE}/preview/screenshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, sessionId: currentSessionId })
    });

    const data = await response.json();

    if (response.ok) {
      previewContainer.innerHTML = `<img src="${data.screenshot}" alt="Screenshot" style="max-width: 100%; height: auto;">`;
      showStatus(loginStatus, '✅ Screenshot captured', 'success');
    } else {
      showStatus(loginStatus, `❌ ${data.error}`, 'error');
    }
  } catch (error) {
    showStatus(loginStatus, `❌ Error: ${error.message}`, 'error');
  }
}

analyzeBtn.addEventListener('click', async () => {
  if (!currentUrl) {
    alert('Please enter a URL first');
    return;
  }

  showStatus(loginStatus, 'Analyzing security...', 'info');

  try {
    const response = await fetch(`${API_BASE}/preview/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl })
    });

    const data = await response.json();

    if (response.ok) {
      displayAnalysisResults(data);
      showStatus(loginStatus, '✅ Analysis complete', 'success');
    } else {
      showStatus(loginStatus, `❌ ${data.error}`, 'error');
    }
  } catch (error) {
    showStatus(loginStatus, `❌ Error: ${error.message}`, 'error');
  }
});

htmlBtn.addEventListener('click', async () => {
  if (!currentUrl) {
    alert('Please enter a URL first');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/preview/html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: currentUrl })
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById('htmlContent').textContent = data.html;
      htmlModal.style.display = 'block';
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
});

function displayAnalysisResults(data) {
  const analysisPanel = document.getElementById('analysisPanel');
  const analysisResults = document.getElementById('analysisResults');

  let html = '<div class="analysis-results">';

  if (data.issues && data.issues.length > 0) {
    data.issues.forEach(issue => {
      html += `
        <div class="finding-item ${issue.severity}">
          <div class="finding-title">🔔 ${issue.type}</div>
          <div class="finding-details">
            <strong>Severity:</strong> ${issue.severity.toUpperCase()}<br>
            ${issue.header ? `<strong>Header:</strong> ${issue.header}<br>` : ''}
            ${issue.recommendation ? `<strong>Recommendation:</strong> ${issue.recommendation}` : ''}
          </div>
        </div>
      `;
    });
  } else {
    html += '<p>No security issues detected</p>';
  }

  html += '</div>';
  analysisResults.innerHTML = html;
  analysisPanel.style.display = 'block';
}

// ============== TOOLS ==============

async function loadTools() {
  const toolsGrid = document.getElementById('toolsGrid');
  toolsGrid.innerHTML = '<div class="loading">Loading tools...</div>';

  try {
    const response = await fetch(`${API_BASE}/tools/list`);
    const tools = await response.json();

    let html = '';
    const installedTools = [];

    tools.forEach(tool => {
      const statusClass = tool.installed ? 'installed' : 'not-installed';
      const statusText = tool.installed ? '✅ Installed' : '⚠️ Not Installed';

      html += `
        <div class="tool-card">
          <h4>${tool.name}</h4>
          <div class="tool-category">${tool.category}</div>
          <p>${tool.description}</p>
          <div class="tool-status ${statusClass}">${statusText}</div>
          <a href="${tool.website}" target="_blank" style="font-size: 12px; color: #2563eb;">Learn more →</a>
        </div>
      `;

      if (tool.installed) {
        installedTools.push({ name: tool.name, value: tool.name.toLowerCase() });
      }
    });

    toolsGrid.innerHTML = html;

    // Update tool select dropdown
    toolSelect.innerHTML = '<option value="">-- Select a tool --</option>';
    installedTools.forEach(tool => {
      const option = document.createElement('option');
      option.value = tool.value;
      option.textContent = tool.name;
      toolSelect.appendChild(option);
    });

    if (installedTools.length === 0) {
      toolSelect.innerHTML += '<option disabled>No tools installed. Install tools first!</option>';
    }
  } catch (error) {
    toolsGrid.innerHTML = `<p>Error loading tools: ${error.message}</p>`;
  }
}

toolForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const tool = document.getElementById('toolSelect').value;
  const target = document.getElementById('toolTarget').value;
  const options = document.getElementById('toolOptions').value;

  if (!tool) {
    alert('Please select a tool');
    return;
  }

  const toolStatus = document.getElementById('toolStatus');
  showStatus(toolStatus, `Executing ${tool}...`, 'info');

  try {
    const response = await fetch(`${API_BASE}/tools/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, target, options })
    });

    const data = await response.json();

    if (response.ok) {
      displayToolOutput(data);
      showStatus(toolStatus, '✅ Tool executed successfully', 'success');
    } else {
      showStatus(toolStatus, `❌ ${data.error}`, 'error');
    }
  } catch (error) {
    showStatus(toolStatus, `❌ Error: ${error.message}`, 'error');
  }
});

function displayToolOutput(data) {
  const toolOutputPanel = document.getElementById('toolOutputPanel');
  const toolOutput = document.getElementById('toolOutput');

  toolOutput.textContent = data.output || 'No output';
  toolOutputPanel.style.display = 'block';
  toolOutputPanel.scrollIntoView({ behavior: 'smooth' });
}

// ============== REPORTS ==============

async function loadReports() {
  const reportsList = document.getElementById('reportsList');
  reportsList.innerHTML = '<p>Loading reports...</p>';

  try {
    const response = await fetch(`${API_BASE}/reports/list`);
    const reports = await response.json();

    if (reports.length === 0) {
      reportsList.innerHTML = '<p>No reports yet. Create one above!</p>';
      return;
    }

    let html = '';
    reports.forEach(report => {
      const date = new Date(report.createdAt).toLocaleDateString();
      html += `
        <div class="report-card">
          <div class="report-header">
            <div class="report-title">${report.testName}</div>
            <div class="report-severity ${report.severity}">${report.severity.toUpperCase()}</div>
          </div>
          <div class="report-domain">🌐 ${report.domain}</div>
          <div class="report-date">📅 ${date}</div>
          <div class="report-actions">
            <button class="btn btn-secondary btn-sm" onclick="viewReport('${report.id}')">View</button>
            <button class="btn btn-danger btn-sm" onclick="deleteReport('${report.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    reportsList.innerHTML = html;
  } catch (error) {
    reportsList.innerHTML = `<p>Error loading reports: ${error.message}</p>`;
  }
}

reportForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const testName = document.getElementById('reportName').value;
  const domain = document.getElementById('reportDomain').value;
  const findingsText = document.getElementById('reportFindings').value;
  const findings = findingsText.split('\n').filter(f => f.trim());

  const reportStatus = document.getElementById('reportStatus');
  showStatus(reportStatus, 'Creating report...', 'info');

  try {
    const response = await fetch(`${API_BASE}/reports/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testName,
        domain,
        findings: findings.map(f => ({
          type: 'Finding',
          description: f,
          severity: 'medium'
        }))
      })
    });

    const data = await response.json();

    if (response.ok) {
      showStatus(reportStatus, `✅ Report created: ${data.fileName}`, 'success');
      reportForm.reset();
      loadReports();
    } else {
      showStatus(reportStatus, `❌ ${data.error}`, 'error');
    }
  } catch (error) {
    showStatus(reportStatus, `❌ Error: ${error.message}`, 'error');
  }
});

function viewReport(reportId) {
  alert('Report details: ' + reportId);
  // In a real app, you would load and display the report details
}

function deleteReport(reportId) {
  if (confirm('Are you sure you want to delete this report?')) {
    fetch(`${API_BASE}/reports/${reportId}`, { method: 'DELETE' })
      .then(() => loadReports())
      .catch(error => alert('Error: ' + error.message));
  }
}

// ============== UTILITIES ==============

function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status-message ${type}`;
}

// Modal functionality
closeBtn.addEventListener('click', () => {
  htmlModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === htmlModal) {
    htmlModal.style.display = 'none';
  }
});

// WebSocket for real-time updates
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${protocol}://${window.location.host}`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    console.log('Message from server:', event.data);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Reconnect after 3 seconds
    setTimeout(initWebSocket, 3000);
  };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard initialized');
  initWebSocket();
});
