const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Define asset directories
const ASSETS_DIR = path.join(app.getPath('userData'), 'assets');
const MODELS_DIR = path.join(ASSETS_DIR, 'models');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');

// Ensure directories exist
function ensureDirectoriesExist() {
  [ASSETS_DIR, MODELS_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

app.whenReady().then(() => {
  ensureDirectoriesExist();
  
  // Register app-file protocol
  protocol.registerFileProtocol('app-file', (request, callback) => {
    const url = request.url.substring(10);
    try {
      const decodedUrl = decodeURI(url);
      // console.log('Loading file via app-file protocol:', decodedUrl);
      
      if (!fs.existsSync(decodedUrl)) {
        console.error('File not found:', decodedUrl);
        return callback({ error: -2 });
      }
      
      const ext = path.extname(decodedUrl).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      
      return callback({
        path: decodedUrl,
        mimeType
      });
    } catch (error) {
      console.error('Protocol handler error:', error);
      return callback({ error: -2 });
    }
  });
  
  const win = new BrowserWindow({
    show: true,
    transparent: true,
    frame: false,
    center: true,
    hasShadow: false,
    movable: false,
    alwaysOnTop: false,
    focusable: true,
    icon: path.join(process.cwd(), 'loco-icon.icns'),
    webPreferences: {
      sandbox: false,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Permite carregar arquivos locais (use com cuidado em produção)
    }
  });
  
  // Configure CSP headers
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (details.url.startsWith('blob:')) {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*'],
          'Access-Control-Allow-Methods': ['GET, POST, OPTIONS'],
          'Access-Control-Allow-Headers': ['Content-Type, Authorization'],
          'Content-Security-Policy': [
            "default-src 'self' app-file: file: data: blob: 'unsafe-inline' 'unsafe-eval' https://* http://*; " +
            "media-src 'self' https://* http://* blob: app-file:; " +
            "connect-src 'self' https://* http://* ws://* wss://* blob: app-file:; " +
            "img-src 'self' data: blob: https://* http://* app-file:;"
          ]
        }
      });
    } else {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' app-file: file: data: blob: 'unsafe-inline' 'unsafe-eval' https://* http://*; " +
            "media-src 'self' https://* http://* blob: app-file:; " +
            "connect-src 'self' https://* http://* ws://* wss://* blob: app-file:; " +
            "img-src 'self' data: blob: https://* http://* app-file:;"
          ]
        }
      });
    }
  });
  
  // Configure webview session
  const persistentSession = session.fromPartition('persist:webviewsession');
  persistentSession.protocol.registerFileProtocol('app-file', (request, callback) => {
    const url = request.url.substring(10);
    try {
      const decodedUrl = decodeURI(url);
      // console.log('Loading file via app-file protocol (webview session):', decodedUrl);
      
      if (!fs.existsSync(decodedUrl)) {
        console.error('File not found:', decodedUrl);
        return callback({ error: -2 });
      }
      
      const ext = path.extname(decodedUrl).toLowerCase();
      let mimeType = 'application/octet-stream';
      
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      
      return callback({
        path: decodedUrl,
        mimeType
      });
    } catch (error) {
      console.error('Protocol handler error in webview session:', error);
      return callback({ error: -2 });
    }
  });
  
  // Set CSP for webview session
  persistentSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' app-file: file: data: blob: 'unsafe-inline' 'unsafe-eval' https://* http://*; " +
          "media-src 'self' https://* http://* blob: app-file:; " +
          "connect-src 'self' https://* http://* ws://* wss://* blob: app-file:; " +
          "img-src 'self' data: blob: https://* http://* app-file:;"
        ]
      }
    });
  });
  
  // Set permission handler for webview session
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    if (permission === 'media' || 
        permission === 'mediaKeySystem' || 
        permission === 'geolocation' || 
        permission === 'notifications' || 
        permission === 'fullscreen') {
      callback(true);
    } else {
      callback(false);
    }
  });
  
  // Configure window
  win.maximize();
  win.show();
  win.setFocusable(true);
  
  // Load app
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile('dist/index.html');
  }
  
  // IPC handlers
  
  // Save model file
  ipcMain.handle('save-model-file', async (event, fileBuffer, fileName) => {
    try {
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const filePath = path.join(MODELS_DIR, uniqueFileName);
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      
      // Generate a thumbnail for the model
      // This will be implemented in the renderer process
      // We'll just return the model path for now
      
      return `app-file://${filePath}`;
    } catch (error) {
      console.error('Error saving model file:', error);
      throw error;
    }
  });
  
  // Save image file
  ipcMain.handle('save-image-file', async (event, fileBuffer, fileName) => {
    try {
      const uniqueFileName = `${uuidv4()}-${fileName}`;
      const filePath = path.join(IMAGES_DIR, uniqueFileName);
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      return `app-file://${filePath}`;
    } catch (error) {
      console.error('Error saving image file:', error);
      throw error;
    }
  });
  
  // List images from disk
  ipcMain.handle('list-images-from-disk', async (event) => {
    try {
      // console.log('Listing images from disk...');
      
      // Check if the images directory exists
      if (!fs.existsSync(IMAGES_DIR)) {
        // console.log('Images directory does not exist, creating it...');
        fs.mkdirSync(IMAGES_DIR, { recursive: true });
        return [];
      }
      
      // Read all files in the images directory
      const files = fs.readdirSync(IMAGES_DIR);
      // console.log(`Found ${files.length} files in images directory`);
      
      // Filter for image files and create image objects
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
      });
      
      // console.log(`Found ${imageFiles.length} image files`);
      
      // Create image objects with metadata
      const images = imageFiles.map(file => {
        const filePath = path.join(IMAGES_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Extract original filename (remove UUID prefix)
        const originalFileName = file.substring(file.indexOf('-') + 1);
        
        return {
          id: file.split('-')[0], // Use the UUID part as the ID
          fileName: originalFileName,
          url: `app-file://${filePath}`,
          thumbnailUrl: `app-file://${filePath}`,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        };
      });
      
      return images;
    } catch (error) {
      console.error('Error listing images from disk:', error);
      throw error;
    }
  });
  
  // Test file access
  ipcMain.handle('test-file-access', async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      // console.log(`Verificando acesso ao arquivo: ${filePath} - Existe: ${exists}`);
      
      if (exists) {
        const stats = fs.statSync(filePath);
        return { exists, size: stats.size, isFile: stats.isFile() };
      }
      
      return { exists };
    } catch (error) {
      console.error(`Erro ao verificar arquivo ${filePath}:`, error);
      throw error;
    }
  });
  
  // Read file as buffer
  ipcMain.handle('read-file-as-buffer', async (event, filePath) => {
    try {
      // // console.log(`Lendo arquivo como buffer: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      
      const buffer = fs.readFileSync(filePath);
      return buffer;
    } catch (error) {
      console.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  });

  // Clean all files from inventory
  ipcMain.handle('clean-all-files', async (event) => {
    try {
      // console.log('Cleaning all files from inventory...');
      
      // Check if directories exist
      if (!fs.existsSync(IMAGES_DIR) && !fs.existsSync(MODELS_DIR)) {
        // console.log('No directories to clean');
        return { success: true, message: 'No files to clean' };
      }
      
      let deletedCount = 0;
      
      // Clean images directory
      if (fs.existsSync(IMAGES_DIR)) {
        // console.log(`Images directory exists at: ${IMAGES_DIR}`);
        const imageFiles = fs.readdirSync(IMAGES_DIR);
        // console.log(`Found ${imageFiles.length} image files to delete`);
        
        for (const file of imageFiles) {
          const filePath = path.join(IMAGES_DIR, file);
          // console.log(`Deleting image file: ${filePath}`);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
        // console.log(`Deleted ${imageFiles.length} image files`);
      } else {
        // console.log(`Images directory does not exist: ${IMAGES_DIR}`);
      }
      
      // Clean models directory
      if (fs.existsSync(MODELS_DIR)) {
        // console.log(`Models directory exists at: ${MODELS_DIR}`);
        const modelFiles = fs.readdirSync(MODELS_DIR);
        // console.log(`Found ${modelFiles.length} model files to delete`);
        
        for (const file of modelFiles) {
          const filePath = path.join(MODELS_DIR, file);
          // console.log(`Deleting model file: ${filePath}`);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
        // console.log(`Deleted ${modelFiles.length} model files`);
      } else {
        // console.log(`Models directory does not exist: ${MODELS_DIR}`);
      }
      
      // console.log(`Clean operation completed. Deleted ${deletedCount} files in total.`);
      return { 
        success: true, 
        message: `Successfully cleaned ${deletedCount} files from inventory` 
      };
    } catch (error) {
      console.error('Error cleaning files from inventory:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  });
}); 