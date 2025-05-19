import React, { RefObject } from "react";

interface ProblemTextProps {
  isCode: boolean;
  isEditingProblem: boolean;
  problemText: string;
  editedProblemText: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  toggleProblemEditing: () => void;
  setEditedProblemText: (text: string) => void;
  setProblemText: (text: string) => void;
}

export const InterviewAssistantProblem: React.FC<ProblemTextProps> = ({
  isCode,
  isEditingProblem,
  problemText,
  editedProblemText,
  textareaRef,
  toggleProblemEditing,
  setEditedProblemText,
  setProblemText
}) => {
  return (
    <div className="p-2 bg-[#2C2C2C] border-t-2 border-[#222222]">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <h4 className="text-xs font-medium font-minecraft text-white/90 mr-2">{isCode ? "Problem Text" : "Question"}</h4>
          <button
            className={`text-[10px] px-1 rounded border text-white/60 ${isEditingProblem ? "bg-[#42ca75] text-white border-[#42ca75]" : "border-[#333333]"}`}
            onClick={toggleProblemEditing}
            title="Toggle Edit Mode (⌘+E)"
          >
            {isEditingProblem ? "Save" : "Edit"}
          </button>
        </div>
        <button
          className="text-[10px] px-1 rounded border border-[#333333] text-white/60"
          onClick={() => setProblemText("")}
          title="Clear Problem Text"
        >
          Clear
        </button>
      </div>
      
      {isEditingProblem ? (
        <textarea
          ref={textareaRef}
          className="w-full h-24 p-2 bg-[#151515] border-2 border-[#333333] rounded-md text-white/90 placeholder-white/40 focus:outline-none focus:border-[#666666] text-sm resize-none"
          value={editedProblemText}
          onChange={(e) => setEditedProblemText(e.target.value)}
          placeholder={isCode ? "Enter your problem description or code here..." : "Enter your question here..."}
        />
      ) : (
        <div className="whitespace-pre-wrap text-white/90 text-sm h-24 overflow-y-auto p-2 bg-[#222222] rounded-md
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm
          [&::-webkit-scrollbar-thumb]:bg-[#555555] [&::-webkit-scrollbar-track]:bg-[#333333]">
          {problemText || (
            <div className="text-white/40 text-xs">
              Capture a screenshot or click the Edit button to enter {isCode ? "problem text" : "your question"} manually
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 