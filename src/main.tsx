import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/navigation.css';
import Player from './components/Game/Game';
import SplashScreen from './components/Game/SplashScreen';
import PWAInstallPrompts from './components/Game/PWAInstallPrompts';
import DrawingOverlay from './components/ui/DrawingOverlay';
import DownloadBanner from './components/ui/DownloadBanner';
// @ts-ignore
import { Analytics } from '@vercel/analytics/react';
import { useAuthStore } from './store/useAuthStore';
import AuthWrapper from './components/Game/AuthWrapper';
import { InterviewAssistant } from './components/InterviewAssistant';
import AIChat from './components/AIChat';
import { useAIChatStore } from './store/useAIChatStore';
import { useInterviewAssistantStore } from './store/interviewAssistantStore';
import UnifiedNavigation from './components/ui/UnifiedNavigation';
import BrowserLanding from './components/BrowserLanding/BrowserLanding';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialize = useAuthStore(state => state.initialize);
  
  useEffect(() => {
    const unsubscribe = initialize();
    
    return () => unsubscribe();
  }, [initialize]);
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { currentUser, authModalOpen, isFirebaseAvailable } = useAuthStore();
  const { isVisible, toggleVisibility } = useAIChatStore();
  const interviewAssistant = useInterviewAssistantStore();

  // Check if running in browser (not Electron)
  const isBrowser = typeof window !== 'undefined' && 
    !window.navigator.userAgent.toLowerCase().includes('electron');

  // @ts-ignore
  useEffect(() => {
    // Initialize global shortcut handling for Electron
    if (window.electron) {
      const unsubscribe = window.electron.onGlobalShortcut((command: string) => {
        // console.log('Global shortcut received:', command);
        
        switch (command) {
          case 'toggle-interview-assistant':
            interviewAssistant.setVisible(!interviewAssistant.isVisible);
            break;
          case 'capture-screenshot':
            // Only trigger if the interview assistant is visible
            if (interviewAssistant.isVisible) {
              const captureScreenshot = async () => {
                if (interviewAssistant.isCapturing) return;
                
                // const screenshots = interviewAssistant.screenshots;
                const wasVisible = interviewAssistant.isVisible;
                
                interviewAssistant.setCapturing(true);
                interviewAssistant.setVisible(false);
                
                // Add small delay to ensure UI is hidden
                await new Promise(resolve => setTimeout(resolve, 100));
                
                try {
                  // Use captureScreen from utils
                  const { captureScreen } = await import('./utils/screenCapture');
                  const dataUrl = await captureScreen();
                  
                  if (dataUrl) {
                    interviewAssistant.addScreenshot({
                      id: Date.now().toString(),
                      dataUrl,
                      timestamp: Date.now()
                    });
                  }
                } catch (error) {
                  console.error('Error capturing screenshot:', error);
                } finally {
                  interviewAssistant.setCapturing(false);
                  interviewAssistant.setVisible(wasVisible);
                }
              };
              
              captureScreenshot();
            }
            break;
          case 'generate-solution':
            // Only trigger if the interview assistant is visible
            if (interviewAssistant.isVisible && !interviewAssistant.isGenerating) {
              // We need to trigger generate solution here - but since it depends on component state
              // we'll just toggle a flag that the component can watch for
              window.dispatchEvent(new CustomEvent('interview-assistant-generate'));
            }
            break;
        }
      });
      
      return unsubscribe;
    }
  }, [interviewAssistant]);

  useEffect(() => {
    const initializeApp = async (): Promise<void> => {
      try {
        // Continue with app initialization
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
      }
    };

    // Execute the async initialization
    initializeApp();
    
    // Setup key binding for AI Chat
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle AI Chat on "/" key
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        // Check if the target is an input, textarea, or any editor-related element
        const target = e.target as HTMLElement;
        const isEditorActive = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.closest('.editor-container') !== null ||
          target.closest('.safe-live-editor') !== null ||
          target.closest('[data-no-pointer-lock]') !== null ||
          target.closest('.react-live') !== null ||
          target.classList.contains('CodeMirror') ||
          /editor|code-editor|monaco-editor/.test(target.className || '');
          
        // Don't open AI Chat if we're in a text editor
        if (isEditorActive) {
          return;
        }
        
        e.preventDefault();
        toggleVisibility();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleVisibility]);

  // Show browser landing page if in browser
  if (isBrowser) {
    return <BrowserLanding />;
  }

  return (
    <div className='fixed inset-0 w-screen h-screen overflow-hidden select-none' draggable={false}>
      {isLoading && <SplashScreen />}
      {!currentUser && authModalOpen && isFirebaseAvailable && <AuthWrapper />}
      <Player />
      <DrawingOverlay />
      <DownloadBanner />
      {typeof window !== 'undefined' && 
        !window.navigator.userAgent.toLowerCase().includes('electron') && 
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(window.navigator.userAgent.toLowerCase()) && 
        <PWAInstallPrompts />}
      <Analytics />
      
      {/* Unified Navigation */}
      <UnifiedNavigation />
      
      {/* AI Chat Component */}
      <AIChat isVisible={isVisible} toggleVisibility={toggleVisibility} />
      
      {/* Add the Interview Assistant component */}
      <InterviewAssistant />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
