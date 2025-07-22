import React from 'react';

const BrowserLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="flex items-center justify-center p-8 min-h-screen relative z-10">
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          <div className="flex justify-center mb-8">
            <img 
              src="/cover_loco_2.png" 
              alt="Loco Logo" 
              className="w-[600px] object-contain"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Loco Desktop
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
            For the best experience, download our desktop app from GitHub
          </p>
          
          <div className="space-y-4">
            <a
              href="https://github.com/louisperner/loco"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg 
                className="w-6 h-6 mr-3" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Download from GitHub
            </a>
          </div>
          
          <p className="text-sm text-gray-400 mt-8">
            Available for Windows, macOS and Linux
          </p>
        </div>
      </div>
      
      {/* Documentation Section */}
      <div className="px-8 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              How to use Loco
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Installation
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Download the executable from GitHub</li>
                    <li>• Run the installer for your operating system</li>
                    <li>• Open Loco Desktop after installation</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Navigation
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Use WASD to move in the 3D world</li>
                    <li>• Mouse to look around</li>
                    <li>• Spacebar to jump</li>
                    <li>• Shift to run</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                    AI Chat
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Press F to open AI chat</li>
                    <li>• Configure OpenRouter or Ollama in settings</li>
                    <li>• Ask questions and get intelligent responses</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">4</span>
                    3D Objects
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Drag and drop files into the 3D world</li>
                    <li>• Support for models, images and videos</li>
                    <li>• Click to interact with objects</li>
                    <li>• Use inventory to manage items</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                    Settings
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Access settings from the main menu</li>
                    <li>• Adjust graphics and performance</li>
                    <li>• Configure AI providers</li>
                    <li>• Customize colors and interface</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                    Advanced Features
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Interview assistant with Cmd+Shift+I</li>
                    <li>• WebGPU support for better performance</li>
                    <li>• Procedural world generation</li>
                    <li>• Integrated physics system</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-indigo-600/20 rounded-lg border border-indigo-400/30">
              <h4 className="text-lg font-semibold text-white mb-3">💡 Important Tips</h4>
              <ul className="text-gray-200 space-y-1 text-sm">
                <li>• Loco works better as a desktop app than in browser</li>
                <li>• For better performance, make sure your system supports WebGPU</li>
                <li>• AI models need to be configured before use</li>
                <li>• Use Ctrl/Cmd + S to save your progress</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserLanding;