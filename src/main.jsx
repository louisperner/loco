import React from 'react';
import ReactDOM from 'react-dom/client';
import Player from './components/Player/Player';

const App = () => {
  return (
    <div>
      <Player />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
