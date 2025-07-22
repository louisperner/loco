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
              Clone from GitHub
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
              How to run Loco
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Clone & Setup
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Clone the repository from GitHub</li>
                    <li>• Install dependencies with <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm install</code></li>
                    <li>• Run <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run dev</code> for development</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Building
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Build for production with <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run build</code></li>
                    <li>• Build Electron app with <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run electron:build</code></li>
                    <li>• Package for distribution with <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run package</code></li>
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
                    Requirements
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Node.js 18+ and npm</li>
                    <li>• Modern browser with WebGL/WebGPU support</li>
                    <li>• Git for version control</li>
                    <li>• Optional: Docker for containerized development</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">5</span>
                    Development
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• Hot reload enabled in dev mode</li>
                    <li>• TypeScript support included</li>
                    <li>• Vite for fast bundling</li>
                    <li>• ESLint and Prettier for code quality</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">6</span>
                    Scripts
                  </h3>
                  <ul className="text-gray-200 space-y-2 ml-11">
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run lint</code> - Run ESLint</li>
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run test</code> - Run tests</li>
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run preview</code> - Preview build</li>
                    <li>• <code className="bg-gray-800 px-2 py-1 rounded text-sm">npm run electron:dev</code> - Run Electron dev</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-indigo-600/20 rounded-lg border border-indigo-400/30">
              <h4 className="text-lg font-semibold text-white mb-3">💡 Developer Tips</h4>
              <ul className="text-gray-200 space-y-1 text-sm">
                <li>• Check <code className="bg-gray-800 px-1 rounded text-xs">package.json</code> for all available scripts</li>
                <li>• Environment variables can be set in <code className="bg-gray-800 px-1 rounded text-xs">.env</code> files</li>
                <li>• The app supports both browser and Electron environments</li>
                <li>• Hot reload works for both frontend and Electron main process</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserLanding;