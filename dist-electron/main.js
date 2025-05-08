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
    movable: false,
    alwaysOnTop: false,
    focusable: true,
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
    webContents.getURL();
    if (permission === "media" || permission === "mediaKeySystem" || permission === "geolocation" || permission === "notifications" || permission === "fullscreen") {
      callback(true);
    } else {
      callback(false);
    }
  });
  win.maximize();
  win.show();
  win.setFocusable(true);
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
      console.error("Error saving model file:", error);
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
      console.error("Error listing videos from disk:", error);
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
      console.error(`Erro ao ler arquivo ${filePath}:`, error);
      throw error;
    }
  });
});
