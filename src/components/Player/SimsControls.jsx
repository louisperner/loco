import React from 'react';

/**
 * SimsControls - Provides a Sims 4-like control panel for mode selection
 */
function SimsControls({ currentMode, onModeChange, onCatalogOpen }) {
  // Available modes in The Sims style
  const modes = [
    { id: 'live', icon: '👁️', label: 'Live Mode', color: 'bg-green-600', hoverColor: 'bg-green-500' },
    { id: 'build', icon: '🏠', label: 'Build Mode', color: 'bg-blue-600', hoverColor: 'bg-blue-500' },
  ];

  // Handle mode selection
  const handleModeClick = (modeId) => {
    if (modeId === 'buy') {
      onCatalogOpen();
    } else {
      onModeChange(modeId);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 bg-opacity-80 rounded-full px-2 py-1 shadow-lg backdrop-blur-sm flex">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeClick(mode.id)}
            className={`
              relative mx-1 p-2 rounded-full transition-all duration-200
              ${currentMode === mode.id ? `${mode.color} ring-2 ring-white` : 'bg-gray-700 hover:bg-opacity-90 hover:ring-1 hover:ring-gray-300'}
              ${currentMode !== mode.id ? 'hover:' + mode.hoverColor : ''}
            `}
            title={mode.label}
          >
            <span className="text-xl">{mode.icon}</span>
            
            {/* Mode tooltip */}
            <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              {mode.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SimsControls; 