import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import Store from 'electron-store';

// Initialize store for app settings
const store = new Store();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Get stored window dimensions and position
  const windowState = store.get('windowState', {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined
  });

  // Create the browser window with stored dimensions
  const mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    title: 'Canvas Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable webview tag for our browser shape
      webSecurity: true, // Enable web security for the main app
    },
  });
  
  // Enable DevTools CDP domains before window is loaded
  mainWindow.webContents.debugger.attach('1.3');
  
  try {
    // Add any required debugger commands here
    mainWindow.webContents.debugger.sendCommand('Network.enable');
    mainWindow.webContents.debugger.sendCommand('Page.enable');
  } catch (err) {
    console.log('Debugger attach failed: ', err);
  }
  
  // Configure global session settings
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src * 'self' data: blob:; connect-src * 'self' data: blob:; img-src * 'self' data: blob:; font-src * 'self' data: blob:; script-src * 'self' 'unsafe-inline' 'unsafe-eval'; style-src * 'self' 'unsafe-inline';"]
      }
    });
  });
  
  // Configure Electron to behave like a standard browser
  // These switches are necessary for proper web compatibility
  app.commandLine.appendSwitch('disable-site-isolation-trials');
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  
  // Configure permission handling like a standard browser
  // Most permissions are allowed but could be prompted in a real browser
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Standard browser permissions to allow
    const browserPermissions = [
      'media', 'geolocation', 'notifications', 'fullscreen',
      'clipboard-read', 'clipboard-write', 'display-capture',
      'midi', 'midi-sysex', 'pointerLock', 'openExternal'
    ];
    
    // Allow most browser permissions
    if (browserPermissions.includes(permission)) {
      callback(true);
    } else {
      // Log but still allow other permissions - a real browser would prompt
      console.log(`Permission requested: ${permission}`);
      callback(true);
    }
  });
  
  // Log webviews being created
  app.on('web-contents-created', (event, contents) => {
    if (contents.getType() === 'webview') {
      
      // For webviews, we don't enforce any CSP - let the site set its own
      // This mimics normal browser behavior where each site has its own security context
      
      // Configure each webview
      contents.setWindowOpenHandler((e) => {
          mainWindow.webContents.send('cb-on-new-window', e)
          return { action: 'deny' };
      });
      
      // Handle navigation events
      contents.on('will-navigate', (e, url) => {
        console.log('Webview navigating to:', url);
      });
      
      // Handle errors
      contents.on('did-fail-load', (_, errorCode, errorDescription) => {
        console.error(`Webview failed to load: ${errorCode} - ${errorDescription}`);
      });
      
      // We could enable developer tools here if needed
      // But we'll leave them disabled by default
      
      // Set permissions for webviews to allow normal browser behavior
      contents.session.setPermissionRequestHandler((_, permission, callback) => {
        // Allow all permissions for browsing functionality
        console.log(`Webview permission requested: ${permission}`);
        callback(true);
      });
    }
  });
  
  // Log when webviews attach
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    console.log('Webview attached to main window:', webContents.getURL());
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools only in development
  if (process.env.NODE_ENV === 'development') {
    // mainWindow.webContents.openDevTools();
  }

  // Save window state on close and when resized or moved
  const saveWindowState = () => {
    if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      const bounds = mainWindow.getBounds();
      store.set('windowState', bounds);
    }
  };

  // Save when closing
  mainWindow.on('close', saveWindowState);
  
  // Also save periodically when resized or moved
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
