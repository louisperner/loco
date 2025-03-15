import { app, screen, BrowserWindow, ipcMain, dialog, protocol, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Define diretórios para armazenamento de arquivos
const ASSETS_DIR = path.join(app.getPath('userData'), 'assets');
const MODELS_DIR = path.join(ASSETS_DIR, 'models');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');

// Garante que os diretórios existam
function ensureDirectoriesExist() {
  [ASSETS_DIR, MODELS_DIR, IMAGES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

app.whenReady().then(() => {
  // Garante que os diretórios existam
  ensureDirectoriesExist();

  // Configurar protocolo de arquivo personalizado
  protocol.registerFileProtocol('app-file', (request, callback) => {
    const url = request.url.substring(10); // Remove 'app-file://'
    try {
      // Decode the URL to handle special characters
      const decodedUrl = decodeURI(url);
      console.log('Loading file via app-file protocol:', decodedUrl);
      
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

  const win = new BrowserWindow({
    show: true,
    transparent: true,
    frame: false,
    // width: 1500,
    // height: 1500,
    center: true,
    hasShadow: false,
    movable: false,
    alwaysOnTop: false,
    focusable: true,
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
          'Content-Security-Policy': ['default-src \'self\' app-file: file: data: blob: \'unsafe-inline\' \'unsafe-eval\' https://* http://*; media-src \'self\' https://* http://* blob: app-file:; connect-src \'self\' https://* http://* ws://* wss://* blob: app-file:; img-src \'self\' data: blob: https://* http://* app-file:;']
        }
      });
    } else {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['default-src \'self\' app-file: file: data: blob: \'unsafe-inline\' https://* http://*; media-src \'self\' https://* http://* blob: app-file:; connect-src \'self\' https://* http://* ws://* wss://* blob: app-file:; img-src \'self\' data: blob: https://* http://* app-file:;']
        }
      });
    }
  });

  // Configure the default session to allow loading blob URLs
  win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    // Allow all requests, including blob URLs and app-file URLs
    if (details.url.startsWith('app-file://')) {
      console.log('Allowing app-file request:', details.url);
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
      console.log('Loading file via app-file protocol (webview session):', decodedUrl);
      
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
        'Content-Security-Policy': ['default-src \'self\' app-file: file: data: blob: \'unsafe-inline\' \'unsafe-eval\' https://* http://*; media-src \'self\' https://* http://* blob: app-file:; connect-src \'self\' https://* http://* ws://* wss://* blob: app-file:; img-src \'self\' data: blob: https://* http://* app-file:;']
      }
    });
  });
  
  // Set permissions for media
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    
    // Allow all permissions for now - you can make this more restrictive if needed
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

  win.maximize();
  win.show();
  win.setFocusable(true);

  // win.getFocusedWindow();

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

  // setInterval(() => {
  //   const point = screen.getCursorScreenPoint();
  //   const [x, y] = win.getPosition();
  //   const [w, h] = win.getSize();

  //   if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
  //     updateIgnoreMouseEvents(point.x - x, point.y - y);
  //   }
  // }, 300);

  // const updateIgnoreMouseEvents = async (x, y) => {
  //   // console.log('updateIgnoreMouseEvents');

  //   // capture 1x1 image of mouse position.
  //   const image = await win.webContents.capturePage({
  //     x,
  //     y,
  //     width: 1,
  //     height: 1,
  //   });

  //   var buffer = image.getBitmap();

  //   // set ignore mouse events by alpha.
  //   win.setIgnoreMouseEvents(!buffer[3]);
  //   // console.log('setIgnoreMouseEvents', !buffer[3]);
  // };

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
      console.error('Error saving model file:', error);
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

  // Manipulador para testar acesso a arquivos
  ipcMain.handle('test-file-access', async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
      console.log(`Verificando acesso ao arquivo: ${filePath} - Existe: ${exists}`);
      
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
      // console.log(`Lendo arquivo como buffer: ${filePath}`);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      
      // Ler o arquivo como buffer
      const buffer = fs.readFileSync(filePath);
      
      // Retornar o buffer
      return buffer;
    } catch (error) {
      console.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  });
});
