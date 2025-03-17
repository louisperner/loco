// Helper function to determine image category based on filename
export const getImageCategory = (fileName) => {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes('texture') || lowerFileName.includes('pattern')) return 'textures';
  if (lowerFileName.includes('background') || lowerFileName.includes('bg')) return 'backgrounds';
  if (lowerFileName.includes('icon')) return 'icons';
  return 'images';
};

// Helper function to determine model category based on filename
export const getModelCategory = (fileName) => {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes('character') || lowerFileName.includes('person')) return 'characters';
  if (lowerFileName.includes('furniture') || lowerFileName.includes('chair') || lowerFileName.includes('table')) return 'furniture';
  if (lowerFileName.includes('vehicle') || lowerFileName.includes('car')) return 'vehicles';
  return 'models';
};

// Create a key for localStorage
export const HOTBAR_STORAGE_KEY = 'loco-hotbar-items';

// Function to show visual feedback when an item is added to canvas
export const showAddedToCanvasIndicator = (item) => {
  // Create a temporary element to show the item was added
  const indicator = document.createElement('div');
  indicator.className = 'canvas-add-indicator';
  indicator.textContent = `Added ${item.fileName} to canvas`;
  document.body.appendChild(indicator);
  
  // Animate and remove after animation
  setTimeout(() => {
    indicator.classList.add('show');
    setTimeout(() => {
      indicator.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(indicator);
      }, 300);
    }, 2000);
  }, 10);
}; 