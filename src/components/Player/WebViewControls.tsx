import React, { useState, useRef, useEffect, RefObject } from 'react';
import { FaArrowLeft, FaRedo, FaTimes, FaHome, FaHistory } from 'react-icons/fa';

// Define types for WebView element
interface WebViewElement extends HTMLElement {
  loadURL?: (url: string) => void;
  goBack?: () => void;
  executeJavaScript?: <T = any>(code: string) => Promise<T>;
  canGoBack?: () => boolean;
  addEventListener: (event: string, handler: (...args: any[]) => void) => void;
  removeEventListener: (event: string, handler: (...args: any[]) => void) => void;
}

// Types for scroll position
interface ScrollPosition {
  x: number;
  y: number;
  height: number;
  savedAt: string;
}

// Types for history entry
interface HistoryEntry {
  url: string;
  timestamp: string;
  frameId: string;
}

// Safe storage type
interface SafeStorage {
  get: <T>(key: string, defaultValue?: T | null) => T | null;
  set: (key: string, value: any) => boolean;
  remove: (key: string) => boolean;
}

// Props for the component
interface WebViewControlsProps {
  webviewRef: RefObject<WebViewElement>;
  onClose: () => void;
  initialUrl?: string;
  onRestorePosition?: () => void;
  onToast?: (message: string, type: string) => void;
  onUrlChange?: (url: string) => void;
  frameId?: string;
}

// Constants for localStorage keys - same as in WebFrames
const STORAGE_KEYS = {
  FRAMES: 'webview-frames',
  SCROLL_POSITIONS: 'webviewScrollPositions',
  URL_HISTORY: 'webviewUrlHistory',
  FRAME_URL_PREFIX: 'frame_'
};

const WebViewControls: React.FC<WebViewControlsProps> = ({ 
  webviewRef, 
  onClose, 
  initialUrl = '', 
  onRestorePosition, 
  onToast, 
  onUrlChange, 
  frameId 
}) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [inputUrl, setInputUrl] = useState<string>(initialUrl);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [urlHistory, setUrlHistory] = useState<HistoryEntry[]>([]);
  const lastUrlRef = useRef<string>(initialUrl);
  const scrollPositionsRef = useRef<Record<string, ScrollPosition>>({});

  // Create safe localStorage wrapper
  const safeStorage: SafeStorage = {
    get<T>(key: string, defaultValue: T | null = null): T | null {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error(`❌ Error getting ${key} from localStorage:`, error);
        return defaultValue;
      }
    },
    set(key: string, value: any): boolean {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`❌ Error setting ${key} in localStorage:`, error);
        return false;
      }
    },
    remove(key: string): boolean {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error(`❌ Error removing ${key} from localStorage:`, error);
        return false;
      }
    }
  };

  // Notify parent component when URL changes
  useEffect(() => {
    if (url !== initialUrl && onUrlChange) {
      onUrlChange(url);
    }
  }, [url, initialUrl, onUrlChange]);

  // Load saved data from localStorage at component mount
  useEffect(() => {
    try {
      // Load scroll positions
      const savedPositions = safeStorage.get<Record<string, ScrollPosition>>(STORAGE_KEYS.SCROLL_POSITIONS, {});
      scrollPositionsRef.current = savedPositions || {};
      
      // Load URL history
      const savedHistory = safeStorage.get<HistoryEntry[]>(STORAGE_KEYS.URL_HISTORY, []);
      setUrlHistory(savedHistory || []);
      
      // Load frame-specific URL if available
      if (frameId) {
        const frameUrlKey = `${STORAGE_KEYS.FRAME_URL_PREFIX}${frameId}_url`;
        const savedFrameUrl = localStorage.getItem(frameUrlKey);
        
        if (savedFrameUrl && savedFrameUrl !== 'about:blank' && savedFrameUrl !== initialUrl) {
          console.log(`📥 Loading saved URL for frame ${frameId}:`, savedFrameUrl);
          setUrl(savedFrameUrl);
          setInputUrl(savedFrameUrl);
          lastUrlRef.current = savedFrameUrl;
          
          // Handle navigation in next tick to ensure component is fully mounted
          setTimeout(() => {
            if (webviewRef?.current && webviewRef.current.loadURL) {
              webviewRef.current.loadURL(savedFrameUrl);
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('❌ Error loading data from localStorage:', error);
    }
  }, [frameId, initialUrl, webviewRef]);

  // Save all data to localStorage
  const saveAllDataToLocalStorage = (): boolean => {
    if (!frameId) return false;
    
    try {
      // Save scroll positions
      safeStorage.set(STORAGE_KEYS.SCROLL_POSITIONS, scrollPositionsRef.current);
      
      // Save URL history
      safeStorage.set(STORAGE_KEYS.URL_HISTORY, urlHistory);
      
      // Save current URL for this frame
      if (url && url !== 'about:blank') {
        const frameUrlKey = `${STORAGE_KEYS.FRAME_URL_PREFIX}${frameId}_url`;
        localStorage.setItem(frameUrlKey, url);
        
        // Also save as lastVisitedUrl
        localStorage.setItem('lastVisitedUrl', url);
        
        // Update current webview URL
        localStorage.setItem('currentWebviewUrl', url);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save data to localStorage:', error);
      return false;
    }
  };
  
  
  // Save scroll position
  const saveScrollPosition = (url: string, position: ScrollPosition): boolean => {
    if (!url || url === 'about:blank') return false;
    
    try {
      // Update in-memory reference
      scrollPositionsRef.current = {
        ...scrollPositionsRef.current,
        [url]: position
      };
      
      // Save to localStorage
      safeStorage.set(STORAGE_KEYS.SCROLL_POSITIONS, scrollPositionsRef.current);
      
      if (onToast) {
        onToast('Posição salva', 'success');
      }
      return true;
    } catch (error) {
      console.error('❌ Error saving scroll position:', error);
      if (onToast) {
        onToast('Erro ao salvar posição', 'error');
      }
      return false;
    }
  };
  
  // Capture current scroll position
  const captureScrollPosition = (): void => {
    if (!webviewRef?.current || !url || !webviewRef.current.executeJavaScript) return;
    
    try {
      webviewRef.current.executeJavaScript(`
        (function() {
          return {
            x: window.scrollX,
            y: window.scrollY,
            height: document.documentElement.scrollHeight,
            url: document.location.href
          };
        })();
      `)
      .then(result => {
        if (result && typeof result.y === 'number') {
          saveScrollPosition(url, {
            x: result.x,
            y: result.y,
            height: result.height,
            savedAt: new Date().toISOString()
          });
        }
      })
      .catch(error => {
        console.error('Error capturing scroll position:', error);
      });
    } catch (error) {
      console.error('Error in captureScrollPosition:', error);
    }
  };

  const handleClose = (): void => {
    captureScrollPosition(); // Save position before closing
    saveAllDataToLocalStorage();
    if (onClose) onClose();
  };

  const handleGoBack = (): void => {
    if (!webviewRef?.current || !webviewRef.current.goBack) return;
    try {
      webviewRef.current.goBack();
    } catch (error) {
      console.error('Error going back:', error);
    }
  };

  const handleReload = (): void => {
    if (!webviewRef?.current || !webviewRef.current.loadURL) return;
    try {
      webviewRef.current.loadURL(url);
    } catch (error) {
      console.error('Error reloading:', error);
    }
  };

  const handleNavigate = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!webviewRef?.current || !webviewRef.current.loadURL) return;
    
    let processedUrl = inputUrl.trim();
    if (!processedUrl) return;
    
    // Auto-add https:// if no protocol is provided
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = 'https://' + processedUrl;
    }
    
    try {
      setUrl(processedUrl);
      webviewRef.current.loadURL(processedUrl);
    } catch (error) {
      console.error('Error navigating to URL:', error);
    }
  };

  const navigateToHistoryItem = (historyUrl: string): void => {
    if (!webviewRef?.current || !webviewRef.current.loadURL) return;
    
    try {
      setInputUrl(historyUrl);
      setUrl(historyUrl);
      setShowHistory(false);
      webviewRef.current.loadURL(historyUrl);
    } catch (error) {
      console.error('Error navigating to history item:', error);
    }
  };

  const toggleHistory = (): void => {
    setShowHistory(!showHistory);
  };

  return (
    <div className="bg-black bg-opacity-80 text-white p-1 rounded-lg flex flex-col w-full max-w-lg z-50 backdrop-blur-sm shadow-lg">
      <form onSubmit={handleNavigate} className="flex items-center gap-1 mb-1">
        <button 
          type="button" 
          onClick={handleGoBack} 
          className={`p-2 rounded hover:bg-gray-700 opacity-50 cursor-not-allowed`}
        >
          <FaArrowLeft size={12} />
        </button>
        <button 
          type="button" 
          onClick={handleReload}
          className="p-2 rounded hover:bg-gray-700"
        >
          <FaRedo size={12} />
        </button>
        <input 
          type="text" 
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="URL do site..."
          className="flex-1 bg-gray-900 text-white px-2 py-1 rounded text-sm"
        />
        <button 
          type="button" 
          onClick={toggleHistory}
          className={`p-2 rounded ${showHistory ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-gray-700'}`}
        >
          <FaHistory size={12} />
        </button>
        <button 
          type="button" 
          onClick={handleClose}
          className="p-2 rounded hover:bg-red-500"
        >
          <FaTimes size={12} />
        </button>
      </form>
      
      {showHistory && (
        <div className="max-h-64 overflow-y-auto bg-gray-900 rounded p-2 mb-1">
          <div className="text-xs text-gray-400 mb-2">Histórico</div>
          {urlHistory.length === 0 ? (
            <div className="text-xs italic text-gray-500">Nenhum histórico disponível</div>
          ) : (
            <ul className="space-y-1">
              {urlHistory.map((entry, index) => (
                <li key={`${entry.url}-${index}`} className="text-xs">
                  <button 
                    onClick={() => navigateToHistoryItem(entry.url)}
                    className="flex items-start hover:bg-gray-800 p-1 rounded w-full text-left"
                  >
                    <span className="truncate flex-1">{entry.url}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {onRestorePosition && (
        <div className="flex justify-between items-center mt-1">
          <button 
            onClick={onRestorePosition}
            className="text-xs bg-transparent hover:bg-gray-700 px-2 py-1 rounded flex items-center gap-1"
          >
            <FaHome size={10} />
            <span>Reposicionar frame</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default WebViewControls; 