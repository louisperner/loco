import React, { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { elementClickTrackerScript } from '../../utils/webviewInjection';
import WebViewControls from './WebViewControls';
import { useImageStore } from '../../store/useImageStore';
import * as THREE from 'three';

// BoxFrame agora é compatível com o componente original, mas utiliza Zustand
function BoxFrame({ 
  url, 
  frameId, 
  position,
  rotation,
  onMediaDragStart, 
  onClose, 
  onRestorePosition, 
  hasCustomPosition, 
  onUrlChange
}) {
  const webviewRef = useRef();
  const [currentUrl, setCurrentUrl] = useState(url);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showControls, setShowControls] = useState(true);
  
  // Removemos o useThree e usaremos o camera que vier como prop ou através do event handler
  const addImage = useImageStore(state => state.addImage);

  useEffect(() => {
    const webview = webviewRef.current;
    
    if (!webview) return;
    
    // Handle console messages from webview
    const handleConsoleMessage = (e) => {
      try {
        // Try to parse as JSON first
        const parsedMessage = JSON.parse(e.message);
        // console.log(parsedMessage);
        if (parsedMessage.type === 'image') {
          console.log('Image event received:', parsedMessage);
          addImage(parsedMessage);
        }
      } catch (error) {
        // console.log(e.message);
      }
    };
    
    webview.addEventListener('console-message', handleConsoleMessage);
    
    const handleDomReady = () => {
      try {
        // Add a small delay to ensure DOM is fully ready
        setTimeout(() => {
          // Check if webview is still available - don't use isDestroyed method
          if (webview && webview.getWebContentsId) {
            webview.executeJavaScript(elementClickTrackerScript)
              .then(() => {
                // console.log('JavaScript successfully injected');
              })
              .catch(err => {
                // console.error('Error injecting JavaScript:', err);
                // // Try with a simpler script to test if injection works at all
                // const testScript = `console.log('Test injection');`;
                // webview.executeJavaScript(testScript).catch(e => {
                //   console.warn('Even simple script injection failed:', e);
                // });
              });
          }
        }, 300);
      } catch (error) {
        console.error('General error in dom-ready handler:', error);
        setLoadError(`Error: ${error.message}`);
      }
    };

    webview.addEventListener('dom-ready', handleDomReady);

    return () => {
      if (webview) {
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('console-message', handleConsoleMessage);
      }
    };
  }, [url, onMediaDragStart, frameId, addImage]);

  // When URL changes internally, notify parent component
  useEffect(() => {
    if (currentUrl !== url && onUrlChange) {
      onUrlChange(frameId, currentUrl);
    }
  }, [currentUrl, url, onUrlChange, frameId]);

  const handleCloseWebview = () => {
    if (onClose) {
      onClose(frameId);
    }
  };

  // Handle URL changes from WebViewControls
  const handleUrlChange = (newUrl) => {
    setCurrentUrl(newUrl);
    
    // Save to localStorage with frame ID for direct access
    try {
      localStorage.setItem(`frame_${frameId}_url`, newUrl);
    } catch (error) {
      console.error(`❌ Error saving URL for frame ${frameId}:`, error);
    }
  };

  return (
    <div className="webview-container relative">
      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {loadError}
        </div>
      )}
      
      {showControls && (
        <WebViewControls
          webviewRef={webviewRef} 
          onClose={handleCloseWebview} 
          initialUrl={url}
          onRestorePosition={hasCustomPosition ? onRestorePosition : null}
          onUrlChange={handleUrlChange}
          frameId={frameId}
        />
      )}
      
      <webview
        ref={webviewRef}
        className='w-screen h-screen'
        src={`${url.includes('https://') ? '' : 'https://'}${url}`}
        allowpopups="true"
        partition="persist:webviewsession"
        webpreferences="allowRunningInsecureContent=yes, autoplayPolicy=no-user-gesture-required"
      ></webview>
    </div>
  );
}

export default BoxFrame;