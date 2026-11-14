const { app, BrowserWindow, Menu, shell } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

// 内置静态服务器，让 /tool/<lang>/ 路径路由在桌面端同样可用
function startStaticServer() {
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    let filePath = path.normalize(path.join(DIST_DIR, requestPath));

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end();
      return;
    }

    // 未知路径回退到 index.html，交给前端路由处理
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, {
        'Content-Type':
          MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function createWindow() {
  const server = await startStaticServer();
  const { port } = server.address();

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#05070f',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    // HTML 预览通过 blob 地址在新窗口打开
    if (url.startsWith('blob:')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
