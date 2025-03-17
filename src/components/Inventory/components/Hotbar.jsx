import React from 'react';

const Hotbar = ({ 
  hotbarItems, 
  selectedSlot, 
  onSlotClick,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverSlot
}) => {
  const handleDragStart = (e, item) => {
    if (!item) return;
    
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    
    // Create a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'fixed w-12 h-12 bg-gray-800 rounded-lg opacity-70 pointer-events-none flex items-center justify-center';
    dragImage.innerHTML = `<img src="${item.icon}" class="w-10 h-10 object-contain" alt="${item.name}" />`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 24, 24);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    // Add a class to the canvas to show it's a valid drop target
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.add('valid-drop-target');
    }
  };

  const handleDragEnd = () => {
    // Remove the valid drop target indicator from canvas
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.classList.remove('valid-drop-target');
      canvas.style.outline = 'none';
    }
  };

  return (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none">
      <div className="bg-black/80 p-1.5 rounded-lg pointer-events-auto border-2 border-gray-700">
        <div className="grid grid-cols-9 gap-1">
          {hotbarItems.map((item, index) => (
            <div
              key={index}
              className={`w-14 h-14 bg-gray-700 border-2 
                ${selectedSlot === index ? 'border-white' : 'border-gray-600'}
                ${dragOverSlot === index ? 'border-blue-500 bg-blue-500/20' : ''}
                rounded relative cursor-pointer hover:bg-gray-600 flex items-center justify-center transition-colors`}
              onClick={() => onSlotClick(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragLeave={() => onDragLeave()}
              onDrop={(e) => onDrop(e, index)}
              draggable={!!item}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
            >
              {item && (
                <div className="w-12 h-12 relative flex items-center justify-center">
                  <img 
                    src={item.icon} 
                    alt={item.name}
                    className="max-w-full max-h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  {item.count > 1 && (
                    <span className="absolute bottom-0 right-0 bg-black/70 px-1 text-xs rounded">
                      {item.count}
                    </span>
                  )}
                </div>
              )}
              <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-white text-shadow text-sm">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hotbar; 