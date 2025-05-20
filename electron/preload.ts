import { contextBridge, ipcRenderer, IpcRenderer } from 'electron';

// Add type declaration for window._imageBlobCache
declare global {
  interface Window {
    _imageBlobCache: Record<string, string>;
    _videoBlobCache: Record<string, string>;
  }
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', withPrototype(ipcRenderer));

// Expose Electron-specific APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // File saving operations
  saveModelFile: async (file, fileName) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target || !event.target.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          const buffer = event.target.result;
          const result = await ipcRenderer.invoke('save-model-file', buffer, fileName);
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
            reject(new Error('Failed to read file'));
            return;
          }
          
          const buffer = event.target.result;
          const result = await ipcRenderer.invoke('save-image-file', buffer, fileName);
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
      // Remove o protocolo file:// ou app-file:// se presente
      let path = filePath;
      if (path.startsWith('file://')) {
        path = path.substring(7);
      } else if (path.startsWith('app-file://')) {
        path = path.substring(11);
      }
      
      // Solicita ao processo principal para verificar o arquivo
      const exists = await ipcRenderer.invoke('test-file-access', path);
      return { success: true, exists };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Função para carregar um arquivo e convertê-lo em Blob URL
  loadFileAsBlob: async (filePath) => {
    try {
      // Remove o protocolo file:// ou app-file:// se presente
      let path = filePath;
      if (path.startsWith('file://')) {
        path = path.substring(7);
      } else if (path.startsWith('app-file://')) {
        path = path.substring(11);
      }
      
      // Solicita ao processo principal para ler o arquivo
      const fileBuffer = await ipcRenderer.invoke('read-file-as-buffer', path);
      
      // Criar um Blob e URL a partir do buffer
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
      // If it's already a blob URL, just return it
      if (appFilePath.startsWith('blob:')) {
        return { success: true, url: appFilePath };
      }
      
      // If it's an app-file URL, convert it to a blob URL
      if (appFilePath.startsWith('app-file://')) {
        const path = appFilePath.substring(11); // Remove 'app-file://'
        const fileBuffer = await ipcRenderer.invoke('read-file-as-buffer', decodeURI(path));
        
        // Determine MIME type based on file extension
        const ext = path.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'gif') mimeType = 'image/gif';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'svg') mimeType = 'image/svg+xml';
        
        // Create a blob with the correct MIME type
        const blob = new Blob([fileBuffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        
        // Cache the blob URL to prevent garbage collection
        window._imageBlobCache = window._imageBlobCache || {};
        window._imageBlobCache[appFilePath] = blobUrl;
        
        return { success: true, url: blobUrl };
      }
      
      // If it's a regular URL, just return it
      return { success: true, url: appFilePath };
    } catch (error) {
      console.error('Error loading image from app-file:', error);
      return { success: false, error: error.message, url: appFilePath };
    }
  },
  
  // Helper function to load videos from app-file URLs
  loadVideoFromAppFile: async (appFilePath) => {
    try {
      // If it's already a blob URL, just return it
      if (appFilePath.startsWith('blob:')) {
        return { success: true, url: appFilePath };
      }
      
      // If it's an app-file URL, convert it to a blob URL
      if (appFilePath.startsWith('app-file://') || appFilePath.startsWith('file://')) {
        const prefix = appFilePath.startsWith('app-file://') ? 'app-file://' : 'file://';
        const path = appFilePath.substring(prefix.length); // Remove prefix
        const fileBuffer = await ipcRenderer.invoke('read-file-as-buffer', decodeURI(path));
        
        // Determine MIME type based on file extension
        const ext = path.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (ext === 'mp4') mimeType = 'video/mp4';
        else if (ext === 'webm') mimeType = 'video/webm';
        else if (ext === 'mov') mimeType = 'video/quicktime';
        else if (ext === 'avi') mimeType = 'video/x-msvideo';
        else if (ext === 'mkv') mimeType = 'video/x-matroska';
        
        // Create a blob with the correct MIME type
        const blob = new Blob([fileBuffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        
        // Cache the blob URL to prevent garbage collection
        window._videoBlobCache = window._videoBlobCache || {};
        window._videoBlobCache[appFilePath] = blobUrl;
        
        return { success: true, url: blobUrl };
      }
      
      // If it's a regular URL, just return it
      return { success: true, url: appFilePath };
    } catch (error) {
      console.error('Error loading video from app-file:', error);
      return { success: false, error: error.message, url: appFilePath };
    }
  },
  
  // Save a video file to disk
  saveVideoFile: async (fileData, fileName) => {
    try {
      const fileBlob = new Blob([fileData]);
      const buffer = await fileBlob.arrayBuffer();
      const result = await ipcRenderer.invoke('save-video-file', new Uint8Array(buffer), fileName);
      return result;
    } catch (error) {
      console.error('Error saving video file:', error);
      throw error;
    }
  },
  
  // List all videos from disk
  listVideosFromDisk: async () => {
    try {
      const result = await ipcRenderer.invoke('list-videos-from-disk');
      return result;
    } catch (error) {
      console.error('Error listing videos from disk:', error);
      return { success: false, videos: [], error: error.message };
    }
  },
  
  // Screen capture functionality
  getScreenSources: async () => {
    try {
      return await ipcRenderer.invoke('get-screen-sources');
    } catch (error) {
      console.error('Error getting screen sources:', error);
      throw error;
    }
  },
  
  // Reload the application
  reloadApp: () => {
    ipcRenderer.invoke('reload-app');
  },
  
  // Global shortcuts handler
  onGlobalShortcut: (callback) => {
    const handler = (_event, command) => {
      callback(command);
    };
    
    // Add the event listener
    ipcRenderer.on('global-shortcut', handler);
    
    // Return a function to remove the event listener
    return () => {
      ipcRenderer.removeListener('global-shortcut', handler);
    };
  }
});

// `exposeInMainWorld` can't detect attributes and methods of `prototype`, manually patching it.
function withPrototype(obj: IpcRenderer): IpcRenderer {
  const protos = Object.getPrototypeOf(obj);

  for (const [key, value] of Object.entries(protos)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) continue;

    if (typeof value === 'function') {
      // Some native APIs, like `NodeJS.EventEmitter['on']`, don't work in the Renderer process. Wrapping them into a function.
      obj[key] = function (...args: unknown[]) {
        return value.call(obj, ...args);
      };
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

// --------- Preload scripts loading ---------
// function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
//   return new Promise((resolve) => {
//     if (condition.includes(document.readyState)) {
//       resolve(true);
//     } else {
//       document.addEventListener('readystatechange', () => {
//         if (condition.includes(document.readyState)) {
//           resolve(true);
//         }
//       });
//     }
//   });
// }

// const safeDOM = {
//   append(parent: HTMLElement, child: HTMLElement) {
//     if (!Array.from(parent.children).find((e) => e === child)) {
//       parent.appendChild(child);
//     }
//   },
//   remove(parent: HTMLElement, child: HTMLElement) {
//     if (Array.from(parent.children).find((e) => e === child)) {
//       parent.removeChild(child);
//     }
//   },
// };

// /**
//  * https://tobiasahlin.com/spinkit
//  * https://connoratherton.com/loaders
//  * https://projects.lukehaas.me/css-loaders
//  * https://matejkustec.github.io/SpinThatShit
//  */
// function useLoading() {
//   const className = `loaders-css__square-spin`;
//   const styleContent = `
// @keyframes square-spin {
//   25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
//   50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
//   75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
//   100% { transform: perspective(100px) rotateX(0) rotateY(0); }
// }
// .${className} > div {
//   background-size: cover;
//   background-position: center;
//   background-repeat: no-repeat;
//   animation-fill-mode: both;
//   width: 50px;
//   height: 50px;
//   background: red;
//   animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
// }
// .app-loading-wrap {
//   position: fixed;
//   top: 0;
//   left: 0;
//   width: 100vw;
//   height: 100vh;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   background: #282c34;
//   z-index: 9;
// }
//     `;
//   const oStyle = document.createElement('style');
//   const oDiv = document.createElement('div');

//   oStyle.id = 'app-loading-style';
//   oStyle.innerHTML = styleContent;
//   oDiv.className = 'app-loading-wrap';
//   oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

//   return {
//     appendLoading() {
//       safeDOM.append(document.head, oStyle);
//       safeDOM.append(document.body, oDiv);
//     },
//     removeLoading() {
//       safeDOM.remove(document.head, oStyle);
//       safeDOM.remove(document.body, oDiv);
//     },
//   };
// }

// ----------------------------------------------------------------------

// const { appendLoading, removeLoading } = useLoading();
// domReady().then(appendLoading);

// window.onmessage = (ev) => {
//   ev.data.payload === 'removeLoading' && removeLoading();
// };

// setTimeout(removeLoading, 4999);
