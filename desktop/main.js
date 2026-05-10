const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = 45123;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  let parsed = url.parse(req.url);
  let filePath = path.join(DIST, parsed.pathname.replace(/^\//, '') || 'index.html');

  // Serve directory as index.html
  fs.stat(filePath, (err, stats) => {
    if (err || (stats && stats.isDirectory())) {
      filePath = path.join(DIST, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // SPA fallback
        fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Easy-Vibe',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(`http://localhost:${PORT}`);

  win.webContents.setWindowOpenHandler(({ url: extUrl }) => {
    shell.openExternal(extUrl);
    return { action: 'deny' };
  });
}

server.listen(PORT, () => {
  app.whenReady().then(createWindow);
});

app.on('window-all-closed', () => {
  server.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
