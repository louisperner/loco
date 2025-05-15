import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center mt-1 space-x-1">
      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
    </div>
  );
};

export default TypingIndicator; 