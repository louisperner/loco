"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", withPrototype(electron.ipcRenderer));
electron.contextBridge.exposeInMainWorld("electron", {
  // File saving operations
  saveModelFile: async (file, fileName) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target || !event.target.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          const buffer = event.target.result;
          const result = await electron.ipcRenderer.invoke("save-model-file", buffer, fileName);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },
  saveImageFile: async (file, fileName) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target || !event.target.result) {
            reject(new Error("Failed to read file"));
            return;
          }
          const buffer = event.target.result;
          const result = await electron.ipcRenderer.invoke("save-image-file", buffer, fileName);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },
  // Função para testar o acesso a um arquivo
  testFileAccess: async (filePath) => {
    try {
      let path = filePath;
      if (path.startsWith("file://")) {
        path = path.substring(7);
      } else if (path.startsWith("app-file://")) {
        path = path.substring(11);
      }
      const exists = await electron.ipcRenderer.invoke("test-file-access", path);
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // Função para carregar um arquivo e convertê-lo em Blob URL
  loadFileAsBlob: async (filePath) => {
    try {
      let path = filePath;
      if (path.startsWith("file://")) {
        path = path.substring(7);
      } else if (path.startsWith("app-file://")) {
        path = path.substring(11);
      }
      const fileBuffer = await electron.ipcRenderer.invoke("read-file-as-buffer", path);
      const blob = new Blob([fileBuffer]);
      const blobUrl = URL.createObjectURL(blob);
      return { success: true, blobUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  // Helper function to load images from app-file URLs
  loadImageFromAppFile: async (appFilePath) => {
    try {
      if (appFilePath.startsWith("blob:")) {
        return { success: true, url: appFilePath };
      }
      if (appFilePath.startsWith("app-file://")) {
        const path = appFilePath.substring(11);
        const fileBuffer = await electron.ipcRenderer.invoke("read-file-as-buffer", decodeURI(path));
        const ext = path.split(".").pop().toLowerCase();
        let mimeType = "application/octet-stream";
        if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
        else if (ext === "png") mimeType = "image/png";
        else if (ext === "gif") mimeType = "image/gif";
        else if (ext === "webp") mimeType = "image/webp";
        else if (ext === "svg") mimeType = "image/svg+xml";
        const blob = new Blob([fileBuffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        window._imageBlobCache = window._imageBlobCache || {};
        window._imageBlobCache[appFilePath] = blobUrl;
        return { success: true, url: blobUrl };
      }
      return { success: true, url: appFilePath };
    } catch (error) {
      console.error("Error loading image from app-file:", error);
      return { success: false, error: error.message, url: appFilePath };
    }
  },
  // Helper function to load videos from app-file URLs
  loadVideoFromAppFile: async (appFilePath) => {
    try {
      if (appFilePath.startsWith("blob:")) {
        return { success: true, url: appFilePath };
      }
      if (appFilePath.startsWith("app-file://") || appFilePath.startsWith("file://")) {
        const prefix = appFilePath.startsWith("app-file://") ? "app-file://" : "file://";
        const path = appFilePath.substring(prefix.length);
        const fileBuffer = await electron.ipcRenderer.invoke("read-file-as-buffer", decodeURI(path));
        const ext = path.split(".").pop().toLowerCase();
        let mimeType = "application/octet-stream";
        if (ext === "mp4") mimeType = "video/mp4";
        else if (ext === "webm") mimeType = "video/webm";
        else if (ext === "mov") mimeType = "video/quicktime";
        else if (ext === "avi") mimeType = "video/x-msvideo";
        else if (ext === "mkv") mimeType = "video/x-matroska";
        const blob = new Blob([fileBuffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        window._videoBlobCache = window._videoBlobCache || {};
        window._videoBlobCache[appFilePath] = blobUrl;
        return { success: true, url: blobUrl };
      }
      return { success: true, url: appFilePath };
    } catch (error) {
      console.error("Error loading video from app-file:", error);
      return { success: false, error: error.message, url: appFilePath };
    }
  },
  // Save a video file to disk
  saveVideoFile: async (fileData, fileName) => {
    try {
      const fileBlob = new Blob([fileData]);
      const buffer = await fileBlob.arrayBuffer();
      const result = await electron.ipcRenderer.invoke("save-video-file", new Uint8Array(buffer), fileName);
      return result;
    } catch (error) {
      console.error("Error saving video file:", error);
      throw error;
    }
  },
  // List all videos from disk
  listVideosFromDisk: async () => {
    try {
      const result = await electron.ipcRenderer.invoke("list-videos-from-disk");
      return result;
    } catch (error) {
      console.error("Error listing videos from disk:", error);
      return { success: false, videos: [], error: error.message };
    }
  },
  // Screen capture functionality
  getScreenSources: async () => {
    try {
      return await electron.ipcRenderer.invoke("get-screen-sources");
    } catch (error) {
      console.error("Error getting screen sources:", error);
      throw error;
    }
  },
  // Reload the application
  reloadApp: () => {
    electron.ipcRenderer.invoke("reload-app");
  },
  // Global shortcuts handler
  onGlobalShortcut: (callback) => {
    const handler = (_event, command) => {
      callback(command);
    };
    electron.ipcRenderer.on("global-shortcut", handler);
    return () => {
      electron.ipcRenderer.removeListener("global-shortcut", handler);
    };
  }
});
function withPrototype(obj) {
  const protos = Object.getPrototypeOf(obj);
  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (typeof value === "function") {
      obj[key] = function(...args) {
        return value.call(obj, ...args);
      };
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
