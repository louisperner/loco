import React from "react";
import { FiEyeOff, FiCamera, FiRefreshCw, FiMove, FiCrop } from "react-icons/fi";

interface HeaderProps {
  isCapturing: boolean;
  isSelectingRegion: boolean;
  captureScreenshot: () => void;
  startRegionSelection: () => void;
  resetAll: () => void;
  setVisible: (visible: boolean) => void;
}

export const InterviewAssistantHeader: React.FC<HeaderProps> = ({
  isCapturing,
  isSelectingRegion,
  captureScreenshot,
  startRegionSelection,
  resetAll,
  setVisible
}) => {
  return (
    <div className="flex items-center justify-between p-2 bg-[#2C2C2C] border-b-4 border-[#222222] font-minecraft">
      <div className="flex items-center space-x-2">
        <FiMove className="cursor-move text-white/60 hover:text-white" />
      </div>
      <div className="flex items-center space-x-2">
        <button
          className="text-white/60 hover:text-white transition-colors duration-200"
          onClick={() => setVisible(false)}
          title="Hide (⌘+B)"
        >
          <FiEyeOff size={16} />
        </button>
        <button
          className={`text-white/60 hover:text-white transition-colors duration-200 ${isCapturing ? "animate-pulse text-[#42ca75]" : ""}`}
          onClick={captureScreenshot}
          disabled={isCapturing}
          title="Capture Screenshot (⌘+H)"
        >
          <FiCamera size={16} />
        </button>
        <button
          className={`text-white/60 hover:text-white transition-colors duration-200 ${isSelectingRegion ? "animate-pulse text-[#42ca75]" : ""}`}
          onClick={startRegionSelection}
          disabled={isSelectingRegion}
          title="Select Region (⌘+4)"
        >
          <FiCrop size={16} />
        </button>
        <button
          className="text-white/60 hover:text-white transition-colors duration-200"
          onClick={resetAll}
          title="Reset (⌘+G)"
        >
          <FiRefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}; 