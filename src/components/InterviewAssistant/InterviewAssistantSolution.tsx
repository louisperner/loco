import React from "react";
import { FiSend, FiCopy, FiCheck, FiX } from "react-icons/fi";
import { Solution } from "./InterviewAssistantTypes";

interface SolutionProps {
  isCode: boolean;
  isGenerating: boolean;
  solution: Solution | null;
  screenshots: { id: string; dataUrl: string; timestamp: number; }[];
  problemText: string;
  generateSolution: () => void;
  setSolution: (solution: Solution | null) => void;
  isCopied: boolean;
  copyCodeToClipboard: () => void;
  isTyping: boolean;
  typedSolution: string;
}

export const InterviewAssistantSolution: React.FC<SolutionProps> = ({
  isCode,
  isGenerating,
  solution,
  screenshots,
  problemText,
  generateSolution,
  setSolution,
  isCopied,
  copyCodeToClipboard,
  isTyping,
  typedSolution
}) => {
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#222222] p-4">
        <div className="w-10 h-10 border-4 border-[#42ca75] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-center">
          <p className="text-white/90 font-minecraft mb-1">AI is thinking...</p>
          <p className="text-white/60 text-xs">Analyzing the problem and generating a solution</p>
        </div>
      </div>
    );
  }
  
  if (solution) {
    return (
      <div className="p-2 bg-[#2C2C2C] overflow-auto h-full">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-xs font-medium font-minecraft text-white/90">{isCode ? "Solution" : "Answer"}</h4>
          <div className="flex space-x-1">
            <button 
              className="text-white/60 hover:text-white flex items-center gap-1 text-[10px] p-1 rounded bg-[#222222] border-2 border-[#151515] transition-colors duration-200"
              onClick={copyCodeToClipboard}
            >
              {isCopied ? (
                <>
                  <FiCheck className="text-[#42ca75]" size={12} /> Copied
                </>
              ) : (
                <>
                  <FiCopy size={12} /> Copy
                </>
              )}
            </button>
            <button 
              className="text-white/60 hover:text-white flex items-center gap-1 text-[10px] p-1 rounded bg-[#222222] border-2 border-[#151515] transition-colors duration-200"
              onClick={() => setSolution(null)}
              title="Back to Generation"
            >
              <FiX size={12} /> Back
            </button>
          </div>
        </div>
        
        {/* Solution code */}
        <div className="bg-[#222222] rounded p-2 text-xs font-mono whitespace-pre overflow-x-auto border-2 border-[#151515] h-[66%] overflow-y-auto shadow-inner text-white/90
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
          [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
          {isTyping ? 'Loading...' : JSON.parse(solution.code).code}
          {isTyping && <span className="animate-pulse">|</span>}
        </div>
        
        <div className="flex mt-2 justify-between">
          <div className="flex-1 mr-2">
            <h4 className="text-xs font-medium font-minecraft text-white/90 mb-1">Explanation</h4>
            <div className="bg-[#222222] rounded p-1.5 text-xs border-2 border-[#151515] h-20 overflow-y-auto shadow-inner
              [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
              [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
              <p className="text-white/90">{JSON.parse(solution.code).explanation}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Generate Solution Button
  return (
    <div className='flex justify-center items-center h-auto p-2 bg-[#222222]'>
      <button
        className='w-full bg-[#42ca75] text-white rounded-md px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-[#666666] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-[#151515]'
        onClick={generateSolution}
        disabled={isGenerating || (screenshots.length === 0 && (!problemText || problemText.trim() === ""))}
      >
        <FiSend size={16} className="mr-1" />
        <span>{isCode ? "Generate Solution" : "Answer Question"}</span>
      </button>
    </div>
  );
}; 