import React, { useState, useEffect } from 'react';

/**
 * SimsHelp - Provides a help overlay for The Sims 4-like interface
 */
function SimsHelp({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Show help on first load (or based on localStorage)
  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('hasSeenSimsWebHelp');
    if (!hasSeenHelp) {
      setIsVisible(true);
    }
  }, []);
  
  // Handle closing the help
  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenSimsWebHelp', 'true');
    if (onClose) onClose();
  };
  
  // Keyboard shortcut to show help (F1)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsVisible(true);
      } else if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 max-w-4xl w-full rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-2xl font-bold">Web Space - Ajuda</h2>
          <button 
            onClick={handleClose}
            className="text-white hover:text-red-200 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-white">
          <h3 className="text-xl font-bold mb-4 text-blue-400">Bem-vindo ao Web Space!</h3>
          <p className="mb-4">
            Inspirado no The Sims 4, este ambiente permite que você adicione e posicione websites em um espaço 3D.
            Aqui está como usar:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Modos */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-green-400">Modos</h4>
              <ul className="space-y-2">
                <li className="flex">
                  <span className="text-green-400 mr-2">👁️</span>
                  <div>
                    <strong>Modo Live (1)</strong>: Explore o espaço livremente
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blue-400 mr-2">🏠</span>
                  <div>
                    <strong>Modo Build (2)</strong>: Posicione websites no espaço
                  </div>
                </li>
                <li className="flex">
                  <span className="text-purple-400 mr-2">🛒</span>
                  <div>
                    <strong>Catálogo Web</strong>: Escolha websites para adicionar
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Controles */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="text-lg font-bold mb-2 text-yellow-400">Controles</h4>
              <ul className="space-y-2">
                <li className="flex">
                  <span className="text-gray-400 mr-2">⌨️</span>
                  <div>
                    <strong>WASD</strong>: Movimento
                  </div>
                </li>
                <li className="flex">
                  <span className="text-gray-400 mr-2">🖱️</span>
                  <div>
                    <strong>Mouse</strong>: Olhar ao redor
                  </div>
                </li>
                <li className="flex">
                  <span className="text-gray-400 mr-2">Space</span>
                  <div>
                    <strong>Espaço</strong>: Subir
                  </div>
                </li>
                <li className="flex">
                  <span className="text-gray-400 mr-2">Shift</span>
                  <div>
                    <strong>Shift</strong>: Descer
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Atalhos */}
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="text-lg font-bold mb-2 text-pink-400">Atalhos de Teclado</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center">
                <kbd className="bg-gray-600 px-2 py-1 rounded text-xs mr-2">Cmd+B</kbd>
                <span>Abrir Catálogo</span>
              </div>
              <div className="flex items-center">
                <kbd className="bg-gray-600 px-2 py-1 rounded text-xs mr-2">1</kbd>
                <span>Modo Live</span>
              </div>
              <div className="flex items-center">
                <kbd className="bg-gray-600 px-2 py-1 rounded text-xs mr-2">2</kbd>
                <span>Modo Build</span>
              </div>
              <div className="flex items-center">
                <kbd className="bg-gray-600 px-2 py-1 rounded text-xs mr-2">F1</kbd>
                <span>Mostrar Ajuda</span>
              </div>
              <div className="flex items-center">
                <kbd className="bg-gray-600 px-2 py-1 rounded text-xs mr-2">Esc</kbd>
                <span>Fechar Janelas</span>
              </div>
            </div>
          </div>
          
          {/* Dicas */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="text-lg font-bold mb-2 text-orange-400">Dicas</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>Alterne entre o modo Live e Build para ter experiências diferentes</li>
              <li>No modo Build, você verá uma prévia do website antes de posicioná-lo</li>
              <li>Adicione seus sites favoritos ao catálogo para usá-los novamente</li>
              <li>Navegue pelo espaço 3D para visualizar websites de diferentes ângulos</li>
              <li>Posicione websites relacionados próximos uns aos outros para criar áreas temáticas</li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-900 px-6 py-4 flex justify-end">
          <button 
            onClick={handleClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimsHelp; 