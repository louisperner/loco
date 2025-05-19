import React from "react";
import { FiServer, FiCloud, FiAlertCircle } from "react-icons/fi";
import { Model } from "./InterviewAssistantTypes";

interface SettingsProps {
  isCode: boolean;
  setIsCode: (isCode: boolean) => void;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  selectedModel: string;
  handleModelChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  ollamaEnabled: boolean;
  toggleProvider: () => void;
  ollamaConnectionError: string | null;
  getModelsForCurrentProvider: () => Model[];
  isLoadingModels: boolean;
}

export const InterviewAssistantSettings: React.FC<SettingsProps> = ({
  isCode,
  setIsCode,
  selectedLanguage,
  setSelectedLanguage,
  selectedModel,
  handleModelChange,
  ollamaEnabled,
  toggleProvider,
  ollamaConnectionError,
  getModelsForCurrentProvider,
  isLoadingModels
}) => {
  return (
    <div className="flex flex-col gap-2 p-2 border-t-2 border-b-2 border-[#222222] bg-[#2C2C2C]">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Mode:</span>
        <div className="flex bg-[#222222] border-2 border-[#151515] rounded-md p-0.5">
          <button
            className={`text-xs px-2 py-1 rounded ${isCode ? 'bg-[#42ca75] text-white' : 'text-white/60'}`}
            onClick={() => setIsCode(true)}
          >
            Code
          </button>
          <button
            className={`text-xs px-2 py-1 rounded ${!isCode ? 'bg-[#42ca75] text-white' : 'text-white/60'}`}
            onClick={() => setIsCode(false)}
          >
            Question
          </button>
        </div>
        {/* Provider toggle */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Provider:</span>
          <button 
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
              ollamaEnabled 
                ? 'bg-blue-900/30 text-blue-400 border border-blue-600/20' 
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-600/20'
            }`}
            onClick={toggleProvider}
          >
            {ollamaEnabled ? (
              <>
                <FiServer className="w-3 h-3" />
                Ollama (Local)
              </>
            ) : (
              <>
                <FiCloud className="w-3 h-3" />
                OpenRouter (Cloud)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Language and Model selection */}
      <div className="flex gap-2">
        {/* Show language dropdown only if in code mode */}
        {isCode ? (
          <div className="w-1/2">
            <div className="flex items-center">
              <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Language:</span>
              <select
                className="w-full bg-[#222222] text-white/90 rounded p-1 text-xs border-2 border-[#151515] focus:outline-none focus:border-[#666666] transition-colors duration-200"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c++">C++</option>
                <option value="c#">C#</option>
                <option value="go">Go</option>
                <option value="ruby">Ruby</option>
                <option value="php">PHP</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="rust">Rust</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="w-1/2">
            <div className="flex items-center">
              <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Type:</span>
              <div className="text-xs p-1 bg-[#222222] rounded border-2 border-[#151515] text-white/90 w-full">
                General Question
              </div>
            </div>
          </div>
        )}
        
        <div className="w-1/2">
          <div className="flex flex-col">
            {/* Show Ollama connection error if any */}
            {ollamaEnabled && ollamaConnectionError && (
              <div className="flex items-center text-red-400 text-[10px] mb-1 bg-red-900/20 px-1 py-0.5 rounded">
                <FiAlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{ollamaConnectionError}</span>
              </div>
            )}
            
            {/* Model selector */}
            <div className="flex items-center">
              <span className="text-xs font-minecraft text-white/90 mr-2 whitespace-nowrap">Model:</span>
              <select
                className={`w-full rounded p-1 text-xs border-2 focus:outline-none focus:border-[#666666] transition-colors duration-200 ${
                  ollamaEnabled 
                    ? 'bg-[#222222] text-blue-100 border-[#151515]' 
                    : 'bg-[#222222] text-yellow-100 border-[#151515]'
                }`}
                value={selectedModel}
                onChange={handleModelChange}
                disabled={isLoadingModels || (ollamaEnabled && ollamaConnectionError !== null)}
              >
                {isLoadingModels ? (
                  <option value="">Loading models...</option>
                ) : (
                  getModelsForCurrentProvider().map((model) => (
                    <option key={model.id} value={model.id} className="bg-[#222222]">
                      {model.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 