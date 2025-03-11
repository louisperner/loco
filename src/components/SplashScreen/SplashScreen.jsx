import React, { useState, useEffect } from 'react';

const SplashScreen = () => {
  const [fadeOut, setFadeOut] = useState(false);

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
        className="max-w-[40%] max-h-[40%] object-contain" 
      />
    </div>
  );
};

export default SplashScreen; 