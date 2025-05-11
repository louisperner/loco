import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthWrapperProps {
  initialView?: 'login' | 'signup';
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ initialView = 'login' }) => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>(initialView);
  const { toggleAuthModal } = useAuth();

  const toggleView = (): void => {
    setCurrentView(currentView === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="bg-[#222222] z-[9999] absolute w-full max-w-4xl h-auto rounded-lg shadow-xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex overflow-hidden">
      <div className="w-full md:w-1/2 p-8 relative">
        <button 
          onClick={() => toggleAuthModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-[#7d3296] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      
        <div className="mb-8 flex justify-center">
          <img className="h-20 w-auto" src="/loco-logo.png" alt="Loco" />
        </div>
        
        {currentView === 'login' ? (
          <>
            <Login />
            <div className="mt-8 text-center">
              <button
                onClick={toggleView}
                className="text-gray-400 hover:text-[#7d3296] transition-colors text-sm"
              >
                Don&apos;t have an account? <span className="font-semibold">Sign up</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <SignUp />
            <div className="mt-8 text-center">
              <button
                onClick={toggleView}
                className="text-gray-400 hover:text-[#7d3296] transition-colors text-sm"
              >
                Already have an account? <span className="font-semibold">Sign in</span>
              </button>
            </div>
          </>
        )}
      </div>
      <div className="hidden md:block md:w-1/2 bg-[url('/loco-bg.jpg')] bg-cover bg-center"></div>
    </div>
  );
};

export default AuthWrapper; 