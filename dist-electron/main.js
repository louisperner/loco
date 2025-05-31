"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}
const rnds8Pool = new Uint8Array(256);
let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}
const native = { randomUUID: crypto.randomUUID };
function v4(options, buf, offset) {
  var _a;
  if (native.randomUUID && true && !options) {
    return native.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? ((_a = options.rng) == null ? void 0 : _a.call(options)) ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  return unsafeStringify(rnds);
}
const APP_DIR = path.join(os.homedir(), ".loco");
const MODELS_DIR = path.join(APP_DIR, "models");
const IMAGES_DIR = path.join(APP_DIR, "images");
const VIDEOS_DIR = path.join(APP_DIR, "videos");
function ensureDirectoriesExist() {
  try {
    if (!fs.existsSync(APP_DIR)) fs.mkdirSync(APP_DIR);
    if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR);
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);
    if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);
  } catch (error) {
    console.error("Error creating app directories:", error);
  }
}
const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};
let tray = null;
electron.app.whenReady().then(() => {
  ensureDirectoriesExist();
  electron.protocol.registerFileProtocol("app-file", (request, callback) => {
    const url = request.url.substring(10);
    try {
      const decodedUrl = decodeURI(url);
      if (!fs.existsSync(decodedUrl)) {
        console.error("File not found:", decodedUrl);
        return callback({ error: -2 });
      }
      const ext = path.extname(decodedUrl).toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".png") mimeType = "image/png";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".svg") mimeType = "image/svg+xml";
      return callback({
        path: decodedUrl,
        mimeType
      });
    } catch (error) {
      console.error("Protocol handler error:", error);
      return callback({ error: -2 });
    }
  });
  const win = new electron.BrowserWindow({
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
    skipTaskbar: true,
    // Hide from taskbar
    titleBarStyle: "hidden",
    // simpleFullscreen: true
    icon: path.join(process.cwd(), "loco-icon.icns"),
    webPreferences: {
      sandbox: true,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webSecurity: true
      // Permite carregar arquivos locais (use com cuidado em produção)
    }
  });
  win.webContents.on("did-finish-load", () => {
    createTrayIcon(win);
  });
  win.on("closed", () => {
    if (tray && !tray.isDestroyed()) {
      logger.log("Destroying tray icon on window close");
      tray.destroy();
      tray = null;
    }
  });
  win.setAlwaysOnTop(true, "floating", 1);
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (details.url.startsWith("blob:")) {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Access-Control-Allow-Origin": ["*"],
          "Access-Control-Allow-Methods": ["GET, POST, OPTIONS"],
          "Access-Control-Allow-Headers": ["Content-Type, Authorization"],
          "Content-Security-Policy": ["default-src 'self' app-file: file: data: blob: 'unsafe-inline' 'unsafe-eval' https://* http://*; media-src 'self' https://* http://* blob: app-file:; connect-src 'self' https://* http://* ws://* wss://* blob: app-file: data:; img-src 'self' data: blob: https://* http://* app-file:;"]
        }
      });
    } else {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["default-src 'self' app-file: file: data: blob: 'unsafe-inline' 'unsafe-eval' https://* http://*; media-src 'self' https://* http://* blob: app-file:; connect-src 'self' https://* http://* ws://* wss://* blob: app-file: data:; img-src 'self' data: blob: https://* http://* app-file:;"]
        }
      });
    }
  });
  win.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    if (details.url.startsWith("app-file://")) ;
    callback({});
  });
  const persistentSession = electron.session.fromPartition("persist:webviewsession");
  persistentSession.protocol.registerFileProtocol("app-file", (request, callback) => {
    const url = request.url.substring(10);
    try {
      const decodedUrl = decodeURI(url);
      if (!fs.existsSync(decodedUrl)) {
        console.error("File not found:", decodedUrl);
        return callback({ error: -2 });
      }
      const ext = path.extname(decodedUrl).toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".png") mimeType = "image/png";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".svg") mimeType = "image/svg+xml";
      return callback({
        path: decodedUrl,
        mimeType
      });
    } catch (error) {
      console.error("Protocol handler error in webview session:", error);
      return callback({ error: -2 });
    }
  });
  persistentSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self' app-file: file: data: blob: 'unsafe-inline' 'unsafe-eval' https://* http://*; media-src 'self' https://* http://* blob: app-file:; connect-src 'self' https://* http://* ws://* wss://* blob: app-file: data:; img-src 'self' data: blob: https://* http://* app-file:;"]
      }
    });
  });
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    logger.log(`Permission request: ${permission} for ${url}`);
    if (permission === "media" || permission === "mediaKeySystem" || permission === "geolocation" || permission === "notifications" || permission === "fullscreen" || permission === "display-capture" || permission === "pointerLock") {
      logger.log(`Granting permission: ${permission}`);
      callback(true);
    } else {
      logger.log(`Denying permission: ${permission}`);
      callback(false);
    }
  });
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    webContents.getURL();
    if (permission === "media" || permission === "mediaKeySystem" || permission === "geolocation" || permission === "notifications" || permission === "fullscreen" || permission === "display-capture" || permission === "pointerLock") {
      logger.log(`Granting permission: ${permission}`);
      callback(true);
    } else {
      logger.log(`Denying permission: ${permission}`);
      callback(false);
    }
  });
  win.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === "media" || permission === "pointerLock") {
      return true;
    }
    return false;
  });
  win.maximize();
  win.show();
  win.setFocusable(true);
  win.setAlwaysOnTop(true, "floating", 1);
  registerGlobalShortcuts(win);
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile("dist/index.html");
  }
  electron.ipcMain.handle("save-model-file", async (event, fileBuffer, fileName) => {
    try {
      const uniqueFileName = `${v4()}-${fileName}`;
      const filePath = path.join(MODELS_DIR, uniqueFileName);
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      return `app-file://${filePath}`;
    } catch (error) {
      logger.error("Error saving model file:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("save-image-file", async (event, fileBuffer, fileName) => {
    try {
      const uniqueFileName = `${v4()}-${fileName}`;
      const filePath = path.join(IMAGES_DIR, uniqueFileName);
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      return `app-file://${filePath}`;
    } catch (error) {
      console.error("Error saving image file:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("save-video-file", async (event, fileBuffer, fileName) => {
    try {
      const uniqueFileName = `${v4()}-${fileName}`;
      const filePath = path.join(VIDEOS_DIR, uniqueFileName);
      fs.writeFileSync(filePath, Buffer.from(fileBuffer));
      return `app-file://${filePath}`;
    } catch (error) {
      console.error("Error saving video file:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("list-videos-from-disk", async (event) => {
    try {
      const files = fs.readdirSync(VIDEOS_DIR);
      const videoFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".mp4", ".webm", ".mov", ".avi", ".mkv"].includes(ext);
      });
      const videos = videoFiles.map((file) => {
        const filePath = path.join(VIDEOS_DIR, file);
        const stats = fs.statSync(filePath);
        const fileName = file.includes("-") ? file.substring(file.indexOf("-") + 1) : file;
        return {
          id: v4(),
          // Generate a new ID for each video
          fileName,
          url: `app-file://${filePath}`,
          thumbnailUrl: "",
          // No thumbnail for now
          filePath,
          fileSize: stats.size,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
          type: "video"
        };
      });
      return { success: true, videos };
    } catch (error) {
      logger.error("Error listing videos from disk:", error);
      return { success: false, videos: [], error: error.message };
    }
  });
  electron.ipcMain.handle("test-file-access", async (event, filePath) => {
    try {
      const exists = fs.existsSync(filePath);
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
  electron.ipcMain.handle("read-file-as-buffer", async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }
      const buffer = fs.readFileSync(filePath);
      return buffer;
    } catch (error) {
      logger.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  });
  electron.ipcMain.handle("get-screen-sources", async () => {
    try {
      logger.log("Electron: Fetching screen sources");
      const sources = await electron.desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 150, height: 150 },
        // Small thumbnails for debugging
        fetchWindowIcons: true
      });
      logger.log(`Electron: Found ${sources.length} screen sources:`, sources.map((s) => s.name));
      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        display_id: source.display_id,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null
      }));
    } catch (error) {
      logger.error("Electron: Error getting screen sources:", error);
      throw error;
    }
  });
  electron.ipcMain.handle("reload-app", () => {
    logger.log("Reloading application...");
    electron.app.relaunch();
    electron.app.exit(0);
  });
  electron.ipcMain.handle("toggle-always-on-top", (event, shouldBeOnTop) => {
    logger.log(`Setting always-on-top: ${shouldBeOnTop}`);
    win.setAlwaysOnTop(shouldBeOnTop, "floating", 1);
    return win.isAlwaysOnTop();
  });
  electron.app.on("will-quit", () => {
    electron.globalShortcut.unregisterAll();
    if (tray && !tray.isDestroyed()) {
      logger.log("Destroying tray icon on app quit");
      tray.destroy();
      tray = null;
    }
  });
  electron.ipcMain.on("toggle-interview-assistant", () => {
    win.webContents.send("global-shortcut", "toggle-interview-assistant");
  });
  electron.ipcMain.on("capture-screenshot", () => {
    win.webContents.send("global-shortcut", "capture-screenshot");
  });
  electron.ipcMain.on("generate-solution", () => {
    win.webContents.send("global-shortcut", "generate-solution");
  });
  electron.ipcMain.on("set-always-on-top", (event, enabled) => {
    if (enabled) {
      win.setAlwaysOnTop(true, "floating", 1);
    } else {
      win.setAlwaysOnTop(false);
    }
    event.returnValue = win.isAlwaysOnTop();
  });
  electron.ipcMain.handle("get-always-on-top", () => {
    return win.isAlwaysOnTop();
  });
});
function createTrayIcon(mainWindow) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    logger.error("Cannot create tray icon: window is not available");
    return;
  }
  if (tray && !tray.isDestroyed()) {
    logger.log("Destroying existing tray icon to prevent duplicates");
    tray.destroy();
    tray = null;
  }
  const iconPath = path.join(process.cwd(), "loco-icon.png");
  let trayIcon;
  try {
    trayIcon = electron.nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      logger.log("Tray icon not found, using fallback");
      trayIcon = electron.nativeImage.createEmpty();
      const size = 16;
      trayIcon = electron.nativeImage.createFromBuffer(Buffer.from(
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" rx="${size / 4}" fill="#FF5A5A"/>
          <text x="${size / 2}" y="${size * 0.75}" font-family="Arial" font-size="${size * 0.7}" text-anchor="middle" fill="white">L</text>
        </svg>`
      ));
    }
  } catch (error) {
    logger.error("Error creating tray icon:", error);
    trayIcon = electron.nativeImage.createEmpty();
  }
  trayIcon = trayIcon.resize({ width: 16, height: 16 });
  tray = new electron.Tray(trayIcon);
  tray.setToolTip("Loco App");
  const contextMenu = electron.Menu.buildFromTemplate([
    { label: "Show App", click: () => {
      mainWindow.show();
    } },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: mainWindow.isAlwaysOnTop(),
      click: (menuItem) => {
        mainWindow.setAlwaysOnTop(menuItem.checked, "floating", 1);
      }
    },
    { type: "separator" },
    { label: "Global Shortcuts:", enabled: false },
    { label: "Cmd+Shift+Space: Show/Hide App", enabled: false },
    { label: "Cmd+B: Toggle Interview Assistant", enabled: false },
    { label: "Cmd+H: Capture Screenshot", enabled: false },
    { label: "Cmd+Enter: Generate Solution", enabled: false },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        electron.app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}
function registerGlobalShortcuts(win) {
  electron.globalShortcut.unregisterAll();
  electron.globalShortcut.register("CommandOrControl+Shift+Space", () => {
    logger.log("Global shortcut triggered: CommandOrControl+Shift+Space");
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });
  electron.globalShortcut.register("CommandOrControl+B", () => {
    logger.log("Global shortcut triggered: CommandOrControl+B");
    win.webContents.send("global-shortcut", "toggle-interview-assistant");
  });
  electron.globalShortcut.register("CommandOrControl+H", () => {
    logger.log("Global shortcut triggered: CommandOrControl+H");
    win.webContents.send("global-shortcut", "capture-screenshot");
  });
  electron.globalShortcut.register("CommandOrControl+Return", () => {
    logger.log("Global shortcut triggered: CommandOrControl+Return");
    win.webContents.send("global-shortcut", "generate-solution");
  });
  if (!electron.globalShortcut.isRegistered("CommandOrControl+Shift+Space") || !electron.globalShortcut.isRegistered("CommandOrControl+B") || !electron.globalShortcut.isRegistered("CommandOrControl+H") || !electron.globalShortcut.isRegistered("CommandOrControl+Return")) {
    logger.error("Global shortcut registration failed");
  }
}
