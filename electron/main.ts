import { app, screen, BrowserWindow, ipcMain, dialog, protocol, session, desktopCapturer, Tray, Menu, nativeImage, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

// Define paths for storing app data
const APP_DIR = path.join(os.homedir(), '.loco');
const MODELS_DIR = path.join(APP_DIR, 'models');
const IMAGES_DIR = path.join(APP_DIR, 'images');
const VIDEOS_DIR = path.join(APP_DIR, 'videos');

// Garante que os diretórios existam
function ensureDirectoriesExist() {
  try {
    // Create app directory and subdirectories if they don't exist
    if (!fs.existsSync(APP_DIR)) fs.mkdirSync(APP_DIR);
    if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR);
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);
  } catch (error) {
    console.error('Error creating app directories:', error);
  }
}

// Add a logger helper at the top of the file (after imports)
const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};

// Add at the top level, after the logger declaration
let tray: Tray | null = null;

app.whenReady().then(() => {
  // Garante que os diretórios existam
  ensureDirectoriesExist();
  
  // Configurar protocolo de arquivo personalizado
  protocol.registerFileProtocol('app-file', (request, callback) => {
    const url = request.url.substring(10); // Remove 'app-file://'
    try {
      // Decode the URL to handle special characters
      const decodedUrl = decodeURI(url);
      // console.log('Loading file via app-file protocol:', decodedUrl);
      
      // Check if file exists
      if (!fs.existsSync(decodedUrl)) {
        console.error('File not found:', decodedUrl);
        return callback({ error: -2 }); // FILE_NOT_FOUND
      }
      
      // Get file extension to set proper MIME type
      const ext = path.extname(decodedUrl).toLowerCase();
      let mimeType = 'application/octet-stream'; // Default MIME type
      
      // Set appropriate MIME type for common image formats
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      
      return callback({
        path: decodedUrl,
        mimeType: mimeType
      });
    } catch (error) {
      console.error('Protocol handler error:', error);
      return callback({ error: -2 });
    }
  });
  
  // Create the window first, then create the tray icon after the window is ready
  const win = new BrowserWindow({
    show: true,
    transparent: true,
    frame: false,
    // width: 1500,
    // height: 1500,
    center: true,
    hasShadow: false,
    movable: true,
    alwaysOnTop: true,
    focusable: true,
    skipTaskbar: true,   // Hide from taskbar
    titleBarStyle: 'hidden',
    // simpleFullscreen: true
    icon: path.join(process.cwd(), 'loco-icon.icns'),
    webPreferences: {
      sandbox: true, 
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Permite carregar arquivos locais (use com cuidado em produção)
    },
  });
  
  // Move the tray icon creation to after the window is fully loaded
  win.webContents.on('did-finish-load', () => {
    // Create the tray icon after the window is ready
    createTrayIcon(win);
  });

  // Clean up tray when window is closed
  win.on('closed', () => {
    if (tray && !tray.isDestroyed()) {
      logger.log('Destroying tray icon on window close');
      tray.destroy();
      tray = null;
    }
  });

  // Ensure window stays on top even when focus changes - using floating level (highest)
  win.setAlwaysOnTop(true, 'floating', 1);

  // Configurar Content Security Policy para permitir carregar recursos locais
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    // For blob URLs, ensure CORS headers are set properly
    if (details.url.startsWith('blob:')) {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*'],
          'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
          'Access-Control-Allow-Headers': ['Content-Type, Authorization'],
          'Content-Security-Policy': ['default-src \'self\' app-file: file: data: blob: \'unsafe-inline\' \'unsafe-eval\' https://* http://*; media-src \'self\' https://* http://* blob: app-file:; connect-src \'self\' https://* http://* ws://* wss://* blob: app-file: data:; img-src \'self\' data: blob: https://* http://* app-file:;']
        }
      });
    } else {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['default-src \'self\' app-file: file: data: blob: \'unsafe-inline\' \'unsafe-eval\' https://* http://*; media-src \'self\' https://* http://* blob: app-file:; connect-src \'self\' https://* http://* ws://* wss://* blob: app-file: data:; img-src \'self\' data: blob: https://* http://* app-file:;']
        }
      });
    }
  });

  // Configure the default session to allow loading blob URLs
  win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    // Allow all requests, including blob URLs and app-file URLs
    if (details.url.startsWith('app-file://')) {
      // console.log('Allowing app-file request:', details.url);
    }
    callback({});
  });

  // Configure persistent session for webviews
  const persistentSession = session.fromPartition('persist:webviewsession');
  
  // Apply the same protocol handler to the persistent session
  persistentSession.protocol.registerFileProtocol('app-file', (request, callback) => {
    const url = request.url.substring(10); // Remove 'app-file://'
    try {
      // Decode the URL to handle special characters
      const decodedUrl = decodeURI(url);
      // console.log('Loading file via app-file protocol (webview session):', decodedUrl);
      
      // Check if file exists
      if (!fs.existsSync(decodedUrl)) {
        console.error('File not found:', decodedUrl);
        return callback({ error: -2 }); // FILE_NOT_FOUND
      }
      
      // Get file extension to set proper MIME type
      const ext = path.extname(decodedUrl).toLowerCase();
      let mimeType = 'application/octet-stream'; // Default MIME type
      
      // Set appropriate MIME type for common image formats
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      
      return callback({
        path: decodedUrl,
        mimeType: mimeType
      });
    } catch (error) {
      console.error('Protocol handler error in webview session:', error);
      return callback({ error: -2 });
    }
  });
  
  // Configure the persistent session with the same CSP
  persistentSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['default-src \'self\' app-file: file: data: blob: \'unsafe-inline\' \'unsafe-eval\' https://* http://*; media-src \'self\' https://* http://* blob: app-file:; connect-src \'self\' https://* http://* ws://* wss://* blob: app-file: data:; img-src \'self\' data: blob: https://* http://* app-file:;']
      }
    });
  });

  // Set permissions for media
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    
    logger.log(`Permission request: ${permission} for ${url}`);
    
    // Always allow screen capture and input permissions
    if (permission === 'media' || 
        permission === 'mediaKeySystem' || 
        permission === 'geolocation' || 
        permission === 'notifications' ||
        permission === 'fullscreen' ||
        permission === 'display-capture' ||
        permission === 'pointerLock') {
      logger.log(`Granting permission: ${permission}`);
      callback(true);
    } else {
      logger.log(`Denying permission: ${permission}`);
      callback(false);
    }
  });

  // Also set permissions for the main window's session
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    
    // logger.log(`Main window permission request: ${permission} for ${url}`);
    
    // Always allow screen capture and input permissions
    if (permission === 'media' || 
        permission === 'mediaKeySystem' || 
        permission === 'geolocation' || 
        permission === 'notifications' ||
        permission === 'fullscreen' ||
        permission === 'display-capture' ||
        permission === 'pointerLock') {
      logger.log(`Granting permission: ${permission}`);
      callback(true);
    } else {
      logger.log(`Denying permission: ${permission}`);
      callback(false);
    }
  });

  // Enable screen sharing on this window
  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'pointerLock') {
      return true;
    }
    return false;
  });

  win.maximize();
  win.show();
  win.setFocusable(true);
  
  // Initial always-on-top setting - will be controlled by user preference after this
  win.setAlwaysOnTop(true, 'floating', 1);

  // win.getFocusedWindow();

  // Register global shortcuts that work even when app is not focused
  registerGlobalShortcuts(win);

  // pointer none
  // win.setIgnoreMouseEvents(true);

  // You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load your file
    win.loadFile('dist/index.html');
  }

  // const win = BrowserWindow.getFocusedWindow();
  // let win = BrowserWindow.getAllWindows()[0];

  ///// uncomment to enable pointer pass through - START
  setInterval(() => {
    const point = screen.getCursorScreenPoint();
    const [x, y] = win.getPosition();
    const [w, h] = win.getSize();

    if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
      updateIgnoreMouseEvents(point.x - x, point.y - y);
    }
  }, 300);

  const updateIgnoreMouseEvents = async (x, y) => {
    // // console.log('updateIgnoreMouseEvents');

    // capture 1x1 image of mouse position.
    const image = await win.webContents.capturePage({
      x,
      y,
      width: 1,
      height: 1,
    });

    const buffer = image.getBitmap();

    // set ignore mouse events by alpha.
    win.setIgnoreMouseEvents(!buffer[3]);
    // // console.log('setIgnoreMouseEvents', !buffer[3]);
  };
    ///// uncomment to enable pointer pass through - END

  // Handle IPC calls for saving files
  ipcMain.handle('save-model-file', async (event, fileBuffer, fileName) => {
    try {
      // Generate a unique filename
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const filePath = path.join(MODELS_DIR, uniqueFileName);
      
      // Write the file to disk
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      
      // Return the file path with app-file protocol
      return `app-file://${filePath}`;
    } catch (error) {
      logger.error('Error saving model file:', error);
      throw error;
    }
  });

  ipcMain.handle('save-image-file', async (event, fileBuffer, fileName) => {
    try {
      // Generate a unique filename
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const filePath = path.join(IMAGES_DIR, uniqueFileName);
      
      // Write the file to disk
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      
      // Return the file path with app-file protocol
      return `app-file://${filePath}`;
    } catch (error) {
      console.error('Error saving image file:', error);
      throw error;
    }
  });

  ipcMain.handle('save-video-file', async (event, fileBuffer, fileName) => {
    try {
      // Generate a unique filename
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const filePath = path.join(VIDEOS_DIR, uniqueFileName);
      
      // Write the file to disk
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      
      // Return the file path with app-file protocol
      return `app-file://${filePath}`;
    } catch (error) {
      console.error('Error saving video file:', error);
      throw error;
    }
  });

  // Handler to list all video files from the videos directory
  ipcMain.handle('list-videos-from-disk', async (event) => {
    try {
      const files = fs.readdirSync(VIDEOS_DIR);
      const videoFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext);
      });
      
      const videos = videoFiles.map(file => {
        const filePath = path.join(VIDEOS_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Get original file name (after the UUID)
        const fileName = file.includes('-') ? file.substring(file.indexOf('-') + 1) : file;
        
        // Create a basic thumbnail for videos (could be improved with real thumbnails)
        
        return {
          id: uuidv4(), // Generate a new ID for each video
          fileName: fileName,
          url: `app-file://${filePath}`,
          thumbnailUrl: '', // No thumbnail for now
          filePath: filePath,
          fileSize: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          type: 'video'
        };
      });
      
      return { success: true, videos };
    } catch (error) {
      logger.error('Error listing videos from disk:', error);
      return { success: false, videos: [], error: error.message };
    }
  });

  // Manipulador para testar acesso a arquivos
  ipcMain.handle('test-file-access', async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      // console.log(`Verificando acesso ao arquivo: ${filePath} - Existe: ${exists}`);
      
      if (exists) {
        // Tenta ler algumas informações para verificar permissões
        const stats = fs.statSync(filePath);
        return { exists, size: stats.size, isFile: stats.isFile() };
      }
      
      return { exists };
    } catch (error) {
      console.error(`Erro ao verificar arquivo ${filePath}:`, error);
      throw error;
    }
  });

  // Manipulador para ler arquivo como buffer
  ipcMain.handle('read-file-as-buffer', async (event, filePath) => {
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      
      // Ler o arquivo como buffer
      const buffer = fs.readFileSync(filePath);
      
      // Retornar o buffer
      return buffer;
    } catch (error) {
      logger.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  });

  // Add handler for screen capture
  ipcMain.handle('get-screen-sources', async () => {
    try {
      logger.log("Electron: Fetching screen sources");
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 150, height: 150 }, // Small thumbnails for debugging
        fetchWindowIcons: true
      });
      
      logger.log(`Electron: Found ${sources.length} screen sources:`, sources.map(s => s.name));
      
      // Return only the necessary data to the renderer process
      return sources.map(source => ({
        id: source.id,
        name: source.name,
        display_id: source.display_id,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null
      }));
    } catch (error) {
      logger.error('Electron: Error getting screen sources:', error);
      throw error;
    }
  });

  // Add handler for app reload
  ipcMain.handle('reload-app', () => {
    logger.log('Reloading application...');
    app.relaunch();
    app.exit(0);
  });

  // Add handler for toggling always-on-top state
  ipcMain.handle('toggle-always-on-top', (event, shouldBeOnTop) => {
    logger.log(`Setting always-on-top: ${shouldBeOnTop}`);
    win.setAlwaysOnTop(shouldBeOnTop, 'floating', 1);
    return win.isAlwaysOnTop();
  });

  // Clean up when app is about to quit
  app.on('will-quit', () => {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
    
    // Destroy tray icon if it exists
    if (tray && !tray.isDestroyed()) {
      logger.log('Destroying tray icon on app quit');
      tray.destroy();
      tray = null;
    }
  });

  // Listen for IPC messages for toggling visibility and functions
  ipcMain.on('toggle-interview-assistant', () => {
    // Send a message to the renderer process
    win.webContents.send('global-shortcut', 'toggle-interview-assistant');
  });

  ipcMain.on('capture-screenshot', () => {
    win.webContents.send('global-shortcut', 'capture-screenshot');
  });

  ipcMain.on('generate-solution', () => {
    win.webContents.send('global-shortcut', 'generate-solution');
  });

  // IPC handler for setting always-on-top state
  ipcMain.on('set-always-on-top', (event, enabled) => {
    if (enabled) {
      win.setAlwaysOnTop(true, 'floating', 1);
    } else {
      win.setAlwaysOnTop(false);
    }
    // Return the current state
    event.returnValue = win.isAlwaysOnTop();
  });

  // Return current always-on-top state
  ipcMain.handle('get-always-on-top', () => {
    return win.isAlwaysOnTop();
  });
});

// Modify the createTrayIcon function to accept the window as a parameter
function createTrayIcon(mainWindow) {
  // Check if mainWindow is valid
  if (!mainWindow || mainWindow.isDestroyed()) {
    logger.error('Cannot create tray icon: window is not available');
    return;
  }

  // Destroy existing tray icon if it exists to prevent duplicates
  if (tray && !tray.isDestroyed()) {
    logger.log('Destroying existing tray icon to prevent duplicates');
    tray.destroy();
    tray = null;
  }

  // Create tray icon
  const iconPath = path.join(process.cwd(), 'loco-icon.png'); // Update with your icon path
  let trayIcon;
  
  try {
    // Try to load the icon
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      // If icon not found or empty, create a simple one
      logger.log('Tray icon not found, using fallback');
      trayIcon = nativeImage.createEmpty();
      const size = 16;
      trayIcon = nativeImage.createFromBuffer(Buffer.from(
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" rx="${size/4}" fill="#FF5A5A"/>
          <text x="${size/2}" y="${size*0.75}" font-family="Arial" font-size="${size*0.7}" text-anchor="middle" fill="white">L</text>
        </svg>`
      ));
    }
  } catch (error) {
    logger.error('Error creating tray icon:', error);
    trayIcon = nativeImage.createEmpty();
  }
  
  // Set the icon size appropriate for macOS menu bar
  trayIcon = trayIcon.resize({ width: 16, height: 16 });
  
  // Create the tray
  tray = new Tray(trayIcon);
  tray.setToolTip('Loco App');
  
  // Create the context menu for the tray
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { mainWindow.show(); } },
    { 
      label: 'Always on Top', 
      type: 'checkbox', 
      checked: mainWindow.isAlwaysOnTop(),
      click: (menuItem) => {
        mainWindow.setAlwaysOnTop(menuItem.checked, 'floating', 1);
      }
    },
    { type: 'separator' },
    { label: 'Global Shortcuts:', enabled: false },
    { label: 'Cmd+Shift+Space: Show/Hide App', enabled: false },
    { label: 'Cmd+B: Toggle Interview Assistant', enabled: false },
    { label: 'Cmd+H: Capture Screenshot', enabled: false },
    { label: 'Cmd+Enter: Generate Solution', enabled: false },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => { 
        app.quit(); 
      } 
    }
  ]);
  
  // Apply the context menu
  tray.setContextMenu(contextMenu);
  
  // Optional: Make single click on the tray icon show/hide the app
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      // Don't change the always-on-top state here
    }
  });
}

// Add this function at the end of the file
function registerGlobalShortcuts(win: BrowserWindow) {
  // Unregister any existing shortcuts
  globalShortcut.unregisterAll();

  // Command+Space to show/hide app
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    logger.log('Global shortcut triggered: CommandOrControl+Shift+Space');
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      // Don't change the always-on-top state here
    }
  });

  // Command+B to toggle interview assistant
  globalShortcut.register('CommandOrControl+B', () => {
    logger.log('Global shortcut triggered: CommandOrControl+B');
    win.webContents.send('global-shortcut', 'toggle-interview-assistant');
  });

  // Command+H to capture screenshot in interview assistant
  globalShortcut.register('CommandOrControl+H', () => {
    logger.log('Global shortcut triggered: CommandOrControl+H');
    win.webContents.send('global-shortcut', 'capture-screenshot');
  });

  // Command+Enter to generate solution in interview assistant
  globalShortcut.register('CommandOrControl+Return', () => {
    logger.log('Global shortcut triggered: CommandOrControl+Return');
    win.webContents.send('global-shortcut', 'generate-solution');
  });

  // Log if registration fails
  if (!globalShortcut.isRegistered('CommandOrControl+Shift+Space') ||
      !globalShortcut.isRegistered('CommandOrControl+B') ||
      !globalShortcut.isRegistered('CommandOrControl+H') ||
      !globalShortcut.isRegistered('CommandOrControl+Return')) {
    logger.error('Global shortcut registration failed');
  }
}
