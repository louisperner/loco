// Helper function to determine image category based on filename
export const getImageCategory = (fileName: string): string => {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg') || lowerFileName.endsWith('.png') || lowerFileName.endsWith('.webp') || lowerFileName.endsWith('.gif')) {
    return 'images';
  }
  return 'other';
};

// Helper function to determine model category based on filename
export const getModelCategory = (fileName: string): string => {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.includes('character') || lowerFileName.includes('person')) return 'characters';
  if (lowerFileName.includes('furniture') || lowerFileName.includes('chair') || lowerFileName.includes('table')) return 'furniture';
  if (lowerFileName.includes('vehicle') || lowerFileName.includes('car')) return 'vehicles';
  return 'models';
};

// Helper function to determine video category based on filename
export const getVideoCategory = (fileName: string): string => {
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.webm') || lowerFileName.endsWith('.mov') || lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.mkv')) {
    if (lowerFileName.includes('tutorial')) return 'tutorials';
    if (lowerFileName.includes('animation')) return 'animations';
    if (lowerFileName.includes('background')) return 'backgrounds';
    return 'videos';
  }
  return 'other';
};

// Create a key for localStorage
export const HOTBAR_STORAGE_KEY = 'loco-hotbar-items';

// Interface for inventory item
export interface InventoryItem {
  fileName: string;
  [key: string]: unknown;
}

// Function to show visual feedback when item is added to canvas
export const showAddedToCanvasIndicator = (item: InventoryItem): void => {
  const indicator = document.createElement('div');
  indicator.className = 'canvas-add-indicator';
  indicator.textContent = `Added ${item.fileName} to canvas`;
  document.body.appendChild(indicator);
  
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