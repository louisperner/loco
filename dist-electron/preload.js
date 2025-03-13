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
  }
});
function withPrototype(obj) {
  const protos = Object.getPrototypeOf(obj);
  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key))
      continue;
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
