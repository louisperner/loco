import React from "react";
import { FiX } from "react-icons/fi";
import { Screenshot } from "./InterviewAssistantTypes";
import { useInterviewAssistantStore } from "../../store/interviewAssistantStore";

interface ScreenshotsProps {
  screenshots: Screenshot[];
  captureScreenshot: () => void;
  isCapturing: boolean;
  resetAll: () => void;
}

export const InterviewAssistantScreenshots: React.FC<ScreenshotsProps> = ({
  screenshots,
  captureScreenshot,
  isCapturing,
  resetAll
}) => {
  return (
    <div className="p-2 bg-[#2C2C2C] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-xs font-medium font-minecraft text-white/90">Screenshots ({screenshots.length})</h4>
        <div className="flex space-x-1">
          {screenshots.length > 0 && (
            <button 
              className="text-xs text-white/60 hover:text-white bg-[#222222] rounded px-1 py-0.5 transition-colors duration-200 text-[10px]"
              onClick={() => resetAll()}
              title="Clear Screenshots"
            >
              Clear
            </button>
          )}
          <button 
            className={`text-xs text-white/60 hover:text-white bg-[#222222] rounded px-1 py-0.5 transition-colors duration-200 text-[10px]`}
            onClick={captureScreenshot}
            disabled={isCapturing}
          >
            Capture
          </button>
        </div>
      </div>
      {screenshots.length > 0 ? (
        <div className="h-[180px] overflow-y-auto
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
          [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
          <div className="grid grid-cols-1 gap-1">
            {screenshots.map((ss, index) => (
              <div 
                key={ss.id} 
                className="relative rounded overflow-hidden border-2 border-[#151515] shadow-md group hover:border-[#555555] transition-colors duration-200"
                style={{ height: '200px' }}
              >
                <div className="absolute top-0 left-0 bg-[#151515] bg-opacity-70 text-xs text-white py-0.5 px-1 rounded-br">
                  #{screenshots.length - index}
                </div>
                <img 
                  src={ss.dataUrl} 
                  alt={`Screenshot ${new Date(ss.timestamp).toLocaleTimeString()}`} 
                  className="w-full h-full object-contain bg-[#222222]"
                  onError={(e) => {
                    console.error("Error loading image", e);
                    (e.target as HTMLImageElement).src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
                    (e.target as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
                {ss.region && (
                  <div className="absolute bottom-1 right-1 bg-[#151515] bg-opacity-70 text-xs text-white py-0.5 px-1 rounded">
                    {Math.round(ss.region.width)} × {Math.round(ss.region.height)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="bg-[#bb2222] hover:bg-[#D46464] text-white text-xs rounded-full p-1 transition-colors duration-200"
                    onClick={() => {
                      // Filter out this screenshot
                      const updatedScreenshots = screenshots.filter(s => s.id !== ss.id);
                      if (updatedScreenshots.length === 0) {
                        resetAll();
                      } else {
                        useInterviewAssistantStore.setState({ screenshots: updatedScreenshots });
                      }
                    }}
                    title="Remove Screenshot"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[180px] bg-[#222222] rounded-md text-white/40 text-xs text-center px-2">
          Capture a screenshot using ⌘+H or select a region with ⌘+4
        </div>
      )}
    </div>
  );
}; 