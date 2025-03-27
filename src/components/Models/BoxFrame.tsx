import React, { useState, useRef, useEffect  } from 'react';
import { elementClickTrackerScript } from '../../utils/webviewInjection';
import WebViewControls from './WebViewControls';
import { useImageStore } from '../../store/useImageStore';
import { sanitizeUrl } from '../../utils/urlSanitizer';

// Define interfaces
interface BoxFrameProps {
  url: string;
  frameId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  onMediaDragStart?: (data: { type: string; url: string; alt?: string }) => void;
  onClose?: (frameId: string) => void;
  onRestorePosition?: () => void;
  hasCustomPosition?: boolean;
  onUrlChange?: (frameId: string, newUrl: string) => void;
}

interface WebViewElement extends HTMLElement {
  loadURL?: (url: string) => void;
  goBack?: () => void;
  executeJavaScript?: <T = unknown>(code: string) => Promise<T>;
  canGoBack?: () => boolean;
  addEventListener: (event: string, handler: (e: WebViewEvent) => void) => void;
  removeEventListener: (event: string, handler: (e: WebViewEvent) => void) => void;
  getWebContentsId?: () => number;
  src: string;
}

interface WebViewEvent {
  message?: string;
  type?: string;
  url?: string;
  alt?: string;
}

// BoxFrame agora é compatível com o componente original, mas utiliza Zustand
const BoxFrame: React.FC<BoxFrameProps> = ({ 
  url, 
  frameId, 
  onClose, 
  onRestorePosition, 
  hasCustomPosition = false, 
  onUrlChange
}) => {
  const webviewRef = useRef<WebViewElement>(null) as React.MutableRefObject<WebViewElement>;
  const [currentUrl, setCurrentUrl] = useState<string>(sanitizeUrl(url));
  const [loadError, setLoadError] = useState<string | null>(null);
  // @ts-ignore
  const [showControls, setShowControls] = useState<boolean>(true);
  
  // Removemos o useThree e usaremos o camera que vier como prop ou através do event handler
  const addImage = useImageStore(state => state.addImage);

  useEffect(() => {
    const webview = webviewRef.current;
    
    if (!webview) return;
    
    // Handle console messages from webview
    const handleConsoleMessage = (e: WebViewEvent) => {
      try {
        // Try to parse as JSON first
        if (e.message) {
          const parsedMessage = JSON.parse(e.message);
          // // console.log(parsedMessage);
          if (parsedMessage.type === 'image') {
            // console.log('Image event received:', parsedMessage);
            addImage(parsedMessage);
          }
        }
      } catch (error) {
        // // console.log(e.message);
      }
    };
    
    webview.addEventListener('console-message', handleConsoleMessage);
    
    const handleDomReady = () => {
      try {
        // Add a small delay to ensure DOM is fully ready
        setTimeout(() => {
          // Check if webview is still available - don't use isDestroyed method
          if (webview && webview.getWebContentsId) {
            webview.executeJavaScript?.(elementClickTrackerScript)
              .then(() => {
                // // console.log('JavaScript successfully injected');
              })
              .catch(err => {
                console.error('Error injecting JavaScript:', err);
                // Try with a simpler script to test if injection works at all
                const testScript = `// console.log('Test injection');`;
                webview.executeJavaScript?.(testScript).catch(e => {
                  console.warn('Even simple script injection failed:', e);
                });
              });
          }
        }, 300);
      } catch (error) {
        console.error('General error in dom-ready handler:', error);
        setLoadError(`Error: ${(error as Error).message}`);
      }
    };

    webview.addEventListener('dom-ready', handleDomReady);

    return () => {
      if (webview) {
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('console-message', handleConsoleMessage);
      }
    };
  }, [addImage]);

  const handleCloseWebview = (): void => {
    if (onClose) {
      onClose(frameId);
    }
  };

  const handleUrlChange = (newUrl: string): void => {
    // Sanitize the URL before setting it
    const safeUrl = sanitizeUrl(newUrl);
    setCurrentUrl(safeUrl);
    if (onUrlChange) {
      onUrlChange(frameId, safeUrl);
    }
  };

  return (
    <div className="relative w-full h-full">
      <webview
        ref={webviewRef}
        src={currentUrl}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {showControls && (
        <WebViewControls
          webviewRef={webviewRef}
          onClose={handleCloseWebview}
          initialUrl={currentUrl}
          onUrlChange={handleUrlChange}
          onRestorePosition={hasCustomPosition ? onRestorePosition : undefined}
          frameId={frameId}
        />
      )}
      {loadError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
          {loadError}
        </div>
      )}
    </div>
  );
};

export default BoxFrame; 