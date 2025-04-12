import React, { useState, useEffect } from 'react';

type SplashScreenProps = {
  // Add any props here if needed in the future
};

const SplashScreen: React.FC<SplashScreenProps> = () => {
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  useEffect(() => {
    // Start fade out animation shortly before the component is unmounted
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1800); // Start fade out 200ms before the 2000ms loading time completes

    return () => clearTimeout(fadeTimer);
  }, []);

  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full flex justify-center items-center bg-transparent z-[9999] transition-opacity duration-500 ease-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <img 
        src="/cover_loco2.png" 
        alt="Loco Loading" 
        className="fixed z-[9999] object-contain max-w-[80%] max-h-[80%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:max-w-[30%] md:max-h-[30%] md:object-contain md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 shadow-lg" 
      />
    </div>
    
  );
};

export default SplashScreen; 