import React from "react";

interface RegionSelectorProps {
  cancelRegionSelection: () => void;
}

export const InterviewAssistantRegionSelector: React.FC<RegionSelectorProps> = ({
  cancelRegionSelection
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <div className="bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg text-center">
          <p className="font-medium">Click and drag to select a region.</p>
          <p className="text-xs mt-1 text-gray-300">Press ESC to cancel</p>
        </div>
      </div>
      
      <div 
        className="relative w-full h-full cursor-crosshair"
        style={{ maxWidth: '90vw', maxHeight: '80vh' }}
      >
        {/* The actual overlay is created in the startRegionSelection function */}
      </div>
      
      <button 
        className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
        onClick={cancelRegionSelection}
      >
        Cancel
      </button>
    </div>
  );
}; 