import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';

interface AuthWrapperProps {
  initialView?: 'login' | 'signup';
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ initialView = 'login' }) => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>(initialView);

  const toggleView = (): void => {
    setCurrentView(currentView === 'login' ? 'signup' : 'login');
  };

  return (
    <div className='bg-[#222222] flex flex-row z-[9999] absolute w-[500px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
      {currentView === 'login' ? (
        <div className='flex flex-col justify-center items-center'>
          <Login />
          <div className="absolute bottom-5 left-0 right-0 text-center md:text-left md:left-10">
            <button
              onClick={toggleView}
              className="text-white hover:text-[#7d3296] transition-colors"
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        </div>
      ) : (
        <div className='w-full h-full flex flex-col justify-center items-center'>
          <SignUp />
          <div className="absolute bottom-5 left-0 right-0 text-center md:text-left md:left-10">
            <button
              onClick={toggleView}
              className="text-white hover:text-[#7d3296] transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthWrapper; 