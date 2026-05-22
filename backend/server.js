const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
const http       = require('http');
const WebSocket  = require('ws');

const authRoutes    = require('./routes/auth');
const toolsRoutes   = require('./routes/tools');
const previewRoutes = require('./routes/preview');
const reportRoutes  = require('./routes/reports');
const proxyRoutes   = require('./routes/proxy');
const browserRoutes = require('./routes/browser');
const browserMgr    = require('./browser');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',    authRoutes);
app.use('/api/tools',   toolsRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/proxy',   proxyRoutes);
app.use('/api/browser', browserRoutes);

app.get('/api/health', (req, res) =>
  res.json({ status: 'running', ts: new Date() })
);
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
);
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  // Register with browser manager for real-time push
  browserMgr.wsClients.add(ws);

  // Send current status immediately on connect
  ws.send(JSON.stringify({
    event:   'connected',
    status:  browserMgr.status,
    session: browserMgr.getSession() ? {
      phone:    browserMgr.session.phone,
      savedAt:  browserMgr.session.savedAt,
      hasToken: !!browserMgr.session.apiToken,
    } : null,
  }));

  ws.on('close', () => { browserMgr.wsClients.delete(ws); });
  ws.on('error', ()  => { browserMgr.wsClients.delete(ws); });
});

server.listen(PORT, () => {
  console.log(`🚀 Shabiki Dashboard running on http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  await browserMgr.close();
  server.close(() => process.exit(0));
});

module.exports = app;
