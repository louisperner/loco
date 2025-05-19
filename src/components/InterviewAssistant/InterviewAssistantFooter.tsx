import React from "react";

interface FooterProps {
  isCode: boolean;
}

export const InterviewAssistantFooter: React.FC<FooterProps> = ({ isCode }) => {
  return (
    <div className="p-1 bg-[#222222] text-[10px] text-white/60 border-t-2 border-[#151515] font-minecraft flex justify-between">
      <div className="flex space-x-2">
        <span>⌘+B: Toggle</span>
        <span>⌘+H: Screenshot</span>
        <span>⌘+4: Region</span>
      </div>
      <div className="flex space-x-2">
        <span>⌘+↵: {isCode ? "Solution" : "Answer"}</span>
        <span>⌘+E: Edit</span>
      </div>
    </div>
  );
}; 