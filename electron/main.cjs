const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: 'emf.vis — 3D Electromagnetic Fields & Vector Calculus Visualizer',
    backgroundColor: '#070a13',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false
    }
  });

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/app.html`);
  } else {
    // In production desktop app, load app.html directly for immediate visualizer access
    mainWindow.loadFile(path.join(__dirname, '../dist/app.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in the default web browser instead of Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Intercept navigation to prevent opening landing page inside desktop app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.includes('index.html')) {
      event.preventDefault();
      mainWindow.loadFile(path.join(__dirname, '../dist/app.html'));
    }
  });

  setupMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload Visualizer',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.loadFile(path.join(__dirname, '../dist/app.html'));
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Concepts',
      submenu: [
        {
          label: '1. Coordinate Systems',
          accelerator: 'CmdOrCtrl+Shift+1',
          click: () => {
            if (mainWindow) {
              mainWindow.loadFile(path.join(__dirname, '../dist/app.html'), { query: { topic: 'coords' } });
            }
          }
        },
        {
          label: '2. The Gradient (∇V)',
          accelerator: 'CmdOrCtrl+Shift+2',
          click: () => {
            if (mainWindow) {
              mainWindow.loadFile(path.join(__dirname, '../dist/app.html'), { query: { topic: 'gradient' } });
            }
          }
        },
        {
          label: '3. The Divergence (∇·A)',
          accelerator: 'CmdOrCtrl+Shift+3',
          click: () => {
            if (mainWindow) {
              mainWindow.loadFile(path.join(__dirname, '../dist/app.html'), { query: { topic: 'divergence' } });
            }
          }
        },
        {
          label: '4. The Curl (∇×A)',
          accelerator: 'CmdOrCtrl+Shift+4',
          click: () => {
            if (mainWindow) {
              mainWindow.loadFile(path.join(__dirname, '../dist/app.html'), { query: { topic: 'curl' } });
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'GitHub Repository',
          click: () => {
            shell.openExternal('https://github.com/kareem-ghazi/emf-vis');
          }
        },
        { type: 'separator' },
        {
          label: 'About emf.vis',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About emf.vis',
              message: 'emf.vis — 3D Electromagnetic Fields & Vector Calculus Visualizer',
              detail: 'Version 1.0.0\nAuthor: Kareem Ghazi (2026)\nLicense: MIT\n\nA real-time interactive 3D visualization and scientific calculation tool for curvilinear coordinate systems, potential gradients, divergence flux, and curl vorticity.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
