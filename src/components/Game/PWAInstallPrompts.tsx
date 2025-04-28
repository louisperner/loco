import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompts: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallClick = async (): Promise<void> => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    //const { outcome } = await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);

    // Hide the install button
    setShowInstallPrompt(false);

    // console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className='fixed bottom-4 left-0 right-0 mx-auto w-[90%] max-w-md bg-slate-800 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between'>
      <div>
        <p className='text-sm text-slate-300'>Add Loco to your home screen</p>
      </div>
      <div className='flex gap-2'>
        <button
          onClick={() => setShowInstallPrompt(false)}
          className='px-3 py-1.5 rounded-md text-sm bg-transparent hover:bg-slate-700 transition-colors'
        >
          Later
        </button>
        <button
          onClick={handleInstallClick}
          className='px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-500 hover:bg-indigo-600 transition-colors'
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompts;
