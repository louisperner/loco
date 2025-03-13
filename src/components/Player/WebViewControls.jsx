import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaRedo, FaTimes, FaStar, FaHome, FaBookmark, FaHistory } from 'react-icons/fa';

// Constants for localStorage keys - same as in WebFrames
const STORAGE_KEYS = {
  FRAMES: 'webview-frames',
  SCROLL_POSITIONS: 'webviewScrollPositions',
  URL_HISTORY: 'webviewUrlHistory',
  FRAME_URL_PREFIX: 'frame_'
};

const WebViewControls = ({ webviewRef, onClose, initialUrl = '', onRestorePosition, onToast, onUrlChange, frameId }) => {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isNavigating, setIsNavigating] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hoveredElement, setHoveredElement] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [urlHistory, setUrlHistory] = useState([]);
  const highlightRef = useRef(null);
  const lastUrlRef = useRef(initialUrl);
  const scrollPositionsRef = useRef({});
  const hasInitializedRef = useRef(false);

  // Create safe localStorage wrapper
  const safeStorage = {
    get: (key, defaultValue = null) => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.error(`❌ Error getting ${key} from localStorage:`, error);
        return defaultValue;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error(`❌ Error setting ${key} in localStorage:`, error);
        return false;
      }
    },
    remove: (key) => {
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
      const savedPositions = safeStorage.get(STORAGE_KEYS.SCROLL_POSITIONS, {});
      scrollPositionsRef.current = savedPositions;
      
      // Load URL history
      const savedHistory = safeStorage.get(STORAGE_KEYS.URL_HISTORY, []);
      setUrlHistory(savedHistory);
      
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
            if (webviewRef?.current) {
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
  const saveAllDataToLocalStorage = () => {
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
  
  // Save URL to history
  const saveUrlToHistory = (newUrl) => {
    if (!newUrl || newUrl === 'about:blank') return false;
    
    try {
      // Create history entry
      const historyEntry = {
        url: newUrl,
        timestamp: new Date().toISOString(),
        frameId: frameId || 'unknown'
      };
      
      // Update in-memory history (max 100 entries)
      const updatedHistory = [
        historyEntry,
        ...urlHistory.filter(item => item.url !== newUrl)
      ].slice(0, 100);
      
      setUrlHistory(updatedHistory);
      
      // Save to localStorage
      safeStorage.set(STORAGE_KEYS.URL_HISTORY, updatedHistory);
      
      // Save as current URL for this frame
      if (frameId) {
        const frameUrlKey = `${STORAGE_KEYS.FRAME_URL_PREFIX}${frameId}_url`;
        localStorage.setItem(frameUrlKey, newUrl);
        localStorage.setItem('lastVisitedUrl', newUrl);
        localStorage.setItem('currentWebviewUrl', newUrl);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error saving URL to history:', error);
      return false;
    }
  };
  
  // Normalize and extract domain from URL
  const getDomainFromUrl = (urlString) => {
    if (!urlString) return '';
    
    try {
      let url = urlString;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return new URL(url).hostname.replace('www.', '');
    } catch (error) {
      return urlString;
    }
  };
  
  // Save scroll position
  const saveScrollPosition = (url, position) => {
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
  const captureScrollPosition = () => {
    if (!webviewRef?.current || !url) return;
    
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
  
  // Restore scroll position
  const restoreScrollPosition = (currentUrl) => {
    if (!webviewRef?.current || !currentUrl) return;
    
    try {
      const position = scrollPositionsRef.current[currentUrl];
      if (!position) return;
      
      // Only restore if position data is valid
      if (typeof position.y === 'number') {
        setTimeout(() => {
          webviewRef.current.executeJavaScript(`
            window.scrollTo(${position.x || 0}, ${position.y || 0});
            console.log('Scroll position restored to y=${position.y}');
            true;
          `)
          .then(() => {
            if (onToast) {
              onToast(`Posição restaurada`, 'info');
            }
            if (onRestorePosition) {
              onRestorePosition(currentUrl, position);
            }
          })
          .catch(error => {
            console.error('Error restoring scroll position:', error);
          });
        }, 500); // Delay to ensure page is loaded
      }
    } catch (error) {
      console.error('Error in restoreScrollPosition:', error);
    }
  };
  
  // Clear frame data
  const clearFrameData = () => {
    try {
      if (frameId) {
        // Remove frame-specific URL
        const frameUrlKey = `${STORAGE_KEYS.FRAME_URL_PREFIX}${frameId}_url`;
        localStorage.removeItem(frameUrlKey);
      }
      
      // Clean up scroll positions for current URL
      if (url) {
        const positions = {...scrollPositionsRef.current};
        if (positions[url]) {
          delete positions[url];
          safeStorage.set(STORAGE_KEYS.SCROLL_POSITIONS, positions);
          scrollPositionsRef.current = positions;
        }
      }
      
      if (onToast) {
        onToast('Dados limpos', 'success');
      }
      return true;
    } catch (error) {
      console.error('❌ Error clearing frame data:', error);
      if (onToast) {
        onToast('Erro ao limpar dados', 'error');
      }
      return false;
    }
  };
  
  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados salvos? Esta ação não pode ser desfeita.')) {
      try {
        // Clear all web-related localStorage data
        Object.values(STORAGE_KEYS).forEach(keyPrefix => {
          // For frame URL prefixes, we need to find all matching keys
          if (keyPrefix === STORAGE_KEYS.FRAME_URL_PREFIX) {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith(keyPrefix)) {
                localStorage.removeItem(key);
              }
            });
          } else {
            localStorage.removeItem(keyPrefix);
          }
        });
        
        // Clear additional specific keys
        const additionalKeys = ['lastVisitedUrl', 'currentWebviewUrl', 'favoriteWebsites', 'webFrames'];
        additionalKeys.forEach(key => localStorage.removeItem(key));
        
        // Reset in-memory state
        scrollPositionsRef.current = {};
        setUrlHistory([]);
        setShowHistory(false);
        
        if (onToast) {
          onToast('Todos os dados limpos', 'success');
        }
        console.log('🗑️ All localStorage data cleared');
        
        return true;
      } catch (error) {
        console.error('❌ Error clearing all data:', error);
        if (onToast) {
          onToast('Erro ao limpar todos os dados', 'error');
        }
        return false;
      }
    }
    return false;
  };
  
  // Handle close
  const handleClose = () => {
    // Save current state before closing
    saveAllDataToLocalStorage();
    
    // Call the original onClose handler
    if (onClose) {
      onClose();
    }
  };

  // Handle navigation
  const handleGoBack = () => {
    if (!webviewRef?.current || !canGoBack) return;
    
    // Save current position before going back
    captureScrollPosition();
    webviewRef.current.goBack();
  };

  const handleReload = () => {
    if (!webviewRef?.current) return;
    
    // Save position before reload
    captureScrollPosition();
    webviewRef.current.reload();
    if (onToast) {
      onToast('Recarregando página...', 'info');
    }
  };

  const handleNavigate = (e) => {
    e.preventDefault();
    if (!webviewRef?.current) return;
    
    // Save current position before navigating
    captureScrollPosition();
    
    let targetUrl = inputUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    
    // Special handling for YouTube URLs
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      // For YouTube, ensure we're using a clean session with proper permissions
      if (onToast) {
        onToast(`Loading YouTube, please wait...`, 'info');
      }
    }
    
    webviewRef.current.loadURL(targetUrl);
    setIsNavigating(true);
    lastUrlRef.current = targetUrl;
    
    // Save to history
    saveUrlToHistory(targetUrl);
    
    if (onToast) {
      try {
        const urlObj = new URL(targetUrl);
        onToast(`Navegando para: ${urlObj.hostname}`, 'info');
      } catch (error) {
        onToast(`Navegando para: ${targetUrl}`, 'info');
      }
    }
  };

  // Handle navigation to a history item
  const navigateToHistoryItem = (historyUrl) => {
    if (!webviewRef?.current) return;
    
    let targetUrl = historyUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    
    webviewRef.current.loadURL(targetUrl);
    setInputUrl(targetUrl);
    setIsNavigating(true);
    lastUrlRef.current = targetUrl;
    setShowHistory(false);
    
    if (onToast) {
      onToast(`Navegando para item do histórico`, 'info');
    }
  };

  // Toggle history dropdown
  const toggleHistory = () => {
    setShowHistory(prev => {
      if (!prev) {
        // When opening the history dropdown, show how many URLs are saved
        const count = urlHistory.length;
        if (onToast && count > 0) {
          onToast(`${count} URLs salvas no histórico`, 'info');
        }
      }
      return !prev;
    });
  };

  // Save current position explicitly (for bookmark button)
  const saveCurrentPosition = () => {
    captureScrollPosition();
  };

  const addToFavorites = () => {
    if (!url) return;
    
    // Get existing favorites
    const savedFavorites = localStorage.getItem('favoriteWebsites');
    const favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    // Create a simple name from the URL
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = urlObj.hostname.replace('www.', '');
    const name = domain.split('.')[0];
    
    // Check if this URL is already in favorites
    const alreadyExists = favorites.some(fav => 
      fav.url === url || fav.url === domain
    );
    
    if (alreadyExists) {
      if (onToast) {
        onToast('Este site já está nos favoritos', 'error');
      } else {
        alert('Este site já está nos favoritos');
      }
      return;
    }
    
    // Add to favorites
    const newFavorites = [...favorites, {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      url: domain,
      icon: '🌐'
    }];
    
    // Save to localStorage
    localStorage.setItem('favoriteWebsites', JSON.stringify(newFavorites));
    
    // Show confirmation
    if (onToast) {
      onToast(`${domain} adicionado aos favoritos!`, 'success');
    } else {
      alert(`${domain} adicionado aos favoritos!`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Ensure localStorage is updated when URL changes
  useEffect(() => {
    // This useEffect specifically handles URL changes and ensures localStorage is updated
    if (url && url !== 'about:blank') {
      localStorage.setItem('currentWebviewUrl', url);
      // console.log('🔄 Current URL updated in localStorage:', url);
    }
  }, [url]);

  useEffect(() => {
    if (!webviewRef?.current) return;

    const webview = webviewRef.current;

    // Update URL when webview navigates
    const handleDidNavigate = (e) => {
      // console.log('Navigation to:', e.url);
      setUrl(e.url);
      setInputUrl(e.url);
      setIsNavigating(false);
      
      // Save URL to history
      saveUrlToHistory(e.url);
      
      // Only show toast for significant URL changes
      if (e.url !== lastUrlRef.current) {
        const newUrlObj = new URL(e.url.startsWith('http') ? e.url : `https://${e.url}`);
        const oldUrlObj = lastUrlRef.current ? 
          new URL(lastUrlRef.current.startsWith('http') ? lastUrlRef.current : `https://${lastUrlRef.current}`) : 
          null;
        
        // Check if domain changed
        if (!oldUrlObj || newUrlObj.hostname !== oldUrlObj.hostname) {
          if (onToast) {
            onToast(`Navegou para: ${newUrlObj.hostname}`, 'info');
          }
        }
        
        lastUrlRef.current = e.url;
      }
    };

    // Handle in-page navigation (like clicking on anchor links)
    const handleDidNavigateInPage = (e) => {
      // console.log('In-page navigation to:', e.url);
      setUrl(e.url);
      setInputUrl(e.url);
      
      // Save URL to history (even for in-page navigation)
      saveUrlToHistory(e.url);
      
      // Update back button state
      if (webview.canGoBack()) {
        setCanGoBack(true);
      } else {
        setCanGoBack(false);
      }
    };

    // Handle URL updates after redirects or when load finishes
    const handleDidFinishLoad = () => {
      try {
        // Get the current URL directly from the webview
        const currentUrl = webview.getURL();
        // console.log('Finished loading:', currentUrl);
        setUrl(currentUrl);
        setInputUrl(currentUrl);
        setIsNavigating(false);
        
        // Save the URL to history after load completes
        const saved = saveUrlToHistory(currentUrl);
        if (saved && onToast) {
          // Optional toast to confirm URL was saved (uncomment if desired)
          // onToast(`URL salva: ${getDomainFromUrl(currentUrl)}`, 'success');
        }
        
        // Check for redirects
        if (currentUrl !== lastUrlRef.current) {
          try {
            const newUrlObj = new URL(currentUrl);
            const oldUrlObj = new URL(lastUrlRef.current.startsWith('http') ? lastUrlRef.current : `https://${lastUrlRef.current}`);
            
            // If we were redirected to a different domain
            if (newUrlObj.hostname !== oldUrlObj.hostname) {
              if (onToast) {
                onToast(`Redirecionado para: ${newUrlObj.hostname}`, 'info');
              }
            }
            
            lastUrlRef.current = currentUrl;
          } catch (error) {
            console.error('Error comparing URLs:', error);
          }
        }
        
        // Update back button state
        if (webview.canGoBack()) {
          setCanGoBack(true);
        } else {
          setCanGoBack(false);
        }
        
        // Restore scroll position if available
        restoreScrollPosition(currentUrl);
        
        // Try to capture page title for history
        webview.executeJavaScript('document.title')
          .then(title => {
            if (title) {
              // Update the history item with the title
              const updatedHistory = urlHistory.map(item => 
                item.url === currentUrl ? { ...item, title } : item
              );
              setUrlHistory(updatedHistory);
              localStorage.setItem('webviewUrlHistory', JSON.stringify(updatedHistory));
            }
          })
          .catch(err => console.error('Error getting page title:', err));
      } catch (error) {
        console.error('Error getting current URL:', error);
      }
    };

    // Handle when frame navigation starts
    const handleWillNavigate = (e) => {
      console.log('Will navigate to:', e.url);
      setIsNavigating(true);
      
      // Save scroll position before navigating away
      captureScrollPosition();
    };

    // Check if can go back
    const updateBackButtonState = () => {
      try {
        if (webview.canGoBack()) {
          setCanGoBack(true);
        } else {
          setCanGoBack(false);
        }
      } catch (error) {
        console.error('Error checking canGoBack:', error);
      }
    };

    // Handle loading progress
    const handleDidChangeLoadingProgress = (progress) => {
      console.log('Loading progress:', progress);
      setLoadingProgress(progress);
    };

    // Track loading state
    const handleDidStartLoading = () => {
      setIsNavigating(true);
      setLoadingProgress(0);
    };
    
    const handleDidStopLoading = () => {
      setIsNavigating(false);
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500); // Reset progress after a delay
      updateBackButtonState();
    };

    // Handle load failures
    const handleDidFailLoad = (e) => {
      // console.error('Failed to load:', e);
      if (onToast) {
        onToast(`Falha ao carregar: ${e.errorDescription || 'Erro desconhecido'}`, 'error');
      }
      setIsNavigating(false);
    };

    // Handle dom-ready event to initialize URL and back state
    const handleDomReady = () => {
      try {
        // Get the initial URL after the webview is ready
        const initialCurrentUrl = webview.getURL();
        if (initialCurrentUrl && initialCurrentUrl !== 'about:blank') {
          setUrl(initialCurrentUrl);
          setInputUrl(initialCurrentUrl);
          lastUrlRef.current = initialCurrentUrl;
          
          // Save initial URL to history
          saveUrlToHistory(initialCurrentUrl);
        }
        
        // Update back button state
        updateBackButtonState();
        
        // Inject element hover tracking script
        injectHoverTracking();
        
        // Set up scroll event listener
        injectScrollListener();
      } catch (error) {
        console.error('Error in dom-ready handler:', error);
      }
    };

    webview.addEventListener('did-start-navigate', handleWillNavigate);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-change-loading-progress', handleDidChangeLoadingProgress);
    webview.addEventListener('dom-ready', handleDomReady);

    // Inject element hover tracking script
    const injectHoverTracking = () => {
      const hoverTrackingScript = `
        document.addEventListener('mousemove', (e) => {
          const element = document.elementFromPoint(e.clientX, e.clientY);
          if (element) {
            const rect = element.getBoundingClientRect();
            window.parent.postMessage({
              type: 'element-hover',
              data: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              }
            }, '*');
          }
        });
        
        // Adicionar listeners para links clicados
        document.addEventListener('click', (e) => {
          const link = e.target.closest('a');
          if (link && link.href) {
            console.log({type: 'link-clicked', data: link.href});
          }
        });
      `;
      
      const webview = webviewRef.current;
      // Check if webview is still available - don't use isDestroyed method
      if (webview && webview.getWebContentsId) {
        webview.executeJavaScript(hoverTrackingScript)
          .then(() => {
            // console.log("Hover tracking successfully injected")
          })
          .catch(err => {
            // console.error('Error injecting hover tracking script:', err);
          });
      }
    };
    
    // Inject scroll position tracking
    const injectScrollListener = () => {
      const scrollScript = `
        // Create a throttle function to limit the number of events
        function throttle(func, delay) {
          let lastCall = 0;
          return function(...args) {
            const now = new Date().getTime();
            if (now - lastCall >= delay) {
              lastCall = now;
              return func(...args);
            }
          };
        }

        // Use try-catch to handle potential errors
        try {
          // Capture scroll events with throttling
          window.addEventListener('scroll', throttle(function() {
            // Only send if window.parent exists
            if (window.parent) {
              window.parent.postMessage({
                type: 'scroll-position',
                data: {
                  scrollY: window.scrollY,
                  scrollX: window.scrollX,
                  height: document.body.scrollHeight,
                  innerHeight: window.innerHeight,
                  innerWidth: window.innerWidth
                }
              }, '*');
            }
          }, 300)); // Throttle to prevent too many events
          
          console.log("Scroll listener injected");
        } catch (e) {
          console.error("Error in scroll listener:", e);
        }
      `;
      
      // Add a delay before injection to ensure page is ready
      setTimeout(() => {
        const webview = webviewRef.current;
        // Check if webview is still available - don't use isDestroyed method
        if (webview && webview.getWebContentsId) {
          webview.executeJavaScript(scrollScript)
            .then(() => {
              // console.log("Scroll listener successfully injected")
            })
            .catch(err => {
              // console.error('Error injecting scroll listener:', err);
            });
        }
      }, 500);
    };

    // Listen for hover events from the webview
    const handleWindowMessage = (event) => {
      if (event.data?.type === 'element-hover') {
        setHoveredElement(event.data.data);
      } else if (event.data?.type === 'scroll-position') {
        // Store current scroll position in memory (don't save to localStorage on every scroll)
        scrollPositionsRef.current[url] = event.data.data;
      }
    };
    
    window.addEventListener('message', handleWindowMessage);

    return () => {
      webview.removeEventListener('did-start-navigate', handleWillNavigate);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      webview.removeEventListener('did-stop-loading', handleDidStopLoading);
      webview.removeEventListener('did-change-loading-progress', handleDidChangeLoadingProgress);
      webview.removeEventListener('dom-ready', handleDomReady);
      window.removeEventListener('message', handleWindowMessage);
      
      // Save final data to localStorage when component unmounts
      localStorage.setItem('webviewScrollPositions', JSON.stringify(scrollPositionsRef.current));
      localStorage.setItem('webviewUrlHistory', JSON.stringify(urlHistory));
    };
  }, [webviewRef, onToast, url, urlHistory]);

  return (
    <div className="webview-controls-container">
      {/* Controls bar */}
      <div className="webview-controls bg-gray-800 text-white p-2 flex items-center space-x-2">
        <button 
          onClick={handleGoBack} 
          disabled={!canGoBack}
          className={`p-2 rounded hover:bg-blue-600 transition-colors ${!canGoBack ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Go back"
        >
          <FaArrowLeft />
        </button>
        
        <button 
          onClick={handleReload} 
          className="p-2 rounded hover:bg-blue-600 transition-colors"
          title="Reload page"
        >
          <FaRedo className={isNavigating ? 'animate-spin' : ''} />
        </button>
        
        <form onSubmit={handleNavigate} className="flex-1 flex relative">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 bg-gray-700 text-white px-3 py-1 rounded-l outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter URL..."
          />
          <button 
            type="submit" 
            className="bg-blue-600 px-4 py-1 rounded-r hover:bg-blue-700 transition-colors"
          >
            Go
          </button>
          
          {/* Loading progress bar */}
          {loadingProgress > 0 && (
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all" style={{ width: `${loadingProgress}%` }}></div>
          )}
        </form>
        
        <div className="relative">
          <button 
            onClick={toggleHistory} 
            className="p-2 rounded hover:bg-blue-600 transition-colors"
            title="Histórico de navegação"
          >
            <FaHistory />
          </button>
          
          {/* History dropdown */}
          {showHistory && (
            <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-gray-700 font-medium">
                Histórico de Navegação
                <div className="text-xs text-gray-400">
                  Todas as URLs são salvas automaticamente no localStorage
                </div>
              </div>
              {urlHistory.length > 0 ? (
                <ul className="p-1">
                  {urlHistory.map((item, index) => (
                    <li 
                      key={index} 
                      className="p-2 hover:bg-gray-700 rounded cursor-pointer flex flex-col"
                      onClick={() => navigateToHistoryItem(item.url)}
                    >
                      <span className="font-medium truncate">{item.title || getDomainFromUrl(item.url)}</span>
                      <span className="text-xs text-gray-400 truncate">{item.url}</span>
                      <span className="text-xs text-gray-500">{formatDate(item.timestamp)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Sem histórico de navegação
                </div>
              )}
              <div className="p-2 border-t border-gray-700 flex space-x-2">
                <button 
                  className="flex-1 p-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                  onClick={() => {
                    const data = localStorage.getItem('webviewUrlHistory');
                    console.log('📋 LocalStorage URL History:', JSON.parse(data || '[]'));
                    if (onToast) onToast('Dados do localStorage exibidos no console', 'info');
                  }}
                >
                  Ver no Console
                </button>
                <button 
                  className="flex-1 p-1 text-xs bg-red-600 hover:bg-red-700 rounded"
                  onClick={() => {
                    localStorage.removeItem('webviewUrlHistory');
                    localStorage.removeItem('lastVisitedUrl');
                    localStorage.removeItem('currentWebviewUrl');
                    setUrlHistory([]);
                    setShowHistory(false);
                    if (onToast) onToast('Histórico limpo', 'info');
                  }}
                >
                  Limpar Histórico
                </button>
              </div>
              <div className="p-2 border-t border-gray-700 flex space-x-2">
                <button 
                  className="flex-1 p-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded"
                  onClick={clearFrameData}
                >
                  Limpar Dados deste Frame
                </button>
                <button 
                  className="flex-1 p-1 text-xs bg-red-800 hover:bg-red-900 rounded"
                  onClick={clearAllData}
                >
                  Limpar Todos os Dados
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={saveCurrentPosition} 
          className="p-2 rounded hover:bg-purple-600 transition-colors"
          title="Salvar posição atual"
        >
          <FaBookmark />
        </button>
        
        <button 
          onClick={addToFavorites} 
          className="p-2 rounded hover:bg-yellow-600 transition-colors"
          title="Adicionar aos favoritos"
        >
          <FaStar />
        </button>
        
        {onRestorePosition && (
          <button 
            onClick={onRestorePosition} 
            className="p-2 rounded hover:bg-green-600 transition-colors"
            title="Restaurar posição original"
          >
            <FaHome />
          </button>
        )}
        
        <button 
          onClick={handleClose} 
          className="p-2 rounded hover:bg-red-600 transition-colors"
          title="Close webview"
        >
          <FaTimes />
        </button>
      </div>
      
      {/* Blue highlight for hovered elements */}
      {hoveredElement && (
        <div 
          ref={highlightRef}
          className="absolute pointer-events-none border-2 border-blue-500 z-50 transition-all duration-100"
          style={{
            top: hoveredElement.top + 'px',
            left: hoveredElement.left + 'px',
            width: hoveredElement.width + 'px',
            height: hoveredElement.height + 'px'
          }}
        />
      )}
    </div>
  );
};

export default WebViewControls; 