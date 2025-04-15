import React, { useEffect, useRef } from 'react';
import nipplejs, { JoystickManager, JoystickOutputData } from 'nipplejs';

interface TouchControlsProps {
  enabled: boolean;
  isMobile: boolean;
  touchState: {
    moveJoystick: {
      active: boolean;
      currentX: number;
      currentY: number;
    };
    lookJoystick: {
      active: boolean;
      currentX: number;
      currentY: number;
    };
  };
  onTouchStateChange?: (state: TouchControlsProps['touchState']) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ enabled, isMobile, touchState, onTouchStateChange }) => {
  const moveJoystickContainerRef = useRef<HTMLDivElement>(null);
  const lookJoystickContainerRef = useRef<HTMLDivElement>(null);
  const moveJoystickRef = useRef<JoystickManager | null>(null);
  const lookJoystickRef = useRef<JoystickManager | null>(null);

  // Função para simular clique do mouse
  const simulateMouseClick = (button: number, e: React.MouseEvent | React.TouchEvent) => {
    // Impedir qualquer propagação de evento
    e.stopPropagation();
    e.preventDefault();

    // Encontrar o elemento canvas
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('Canvas não encontrado para simular clique');
      return;
    }

    // Criamos uma classe personalizada do MouseEvent para adicionar propriedades extras
    class SimulatedMouseEvent extends MouseEvent {
      constructor(type: string, init: MouseEventInit) {
        super(type, init);
        // Adicionamos uma propriedade para identificar que é um clique simulado
        Object.defineProperty(this, 'isSimulated', {
          value: true,
          writable: false,
        });
      }
    }

    // Posição central do canvas para o evento
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Cria eventos personalizados
    const clickParams = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: button,
      buttons: button === 0 ? 1 : button === 2 ? 2 : 0,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
    };

    // Dispara eventos diretamente no canvas
    const downEvent = new SimulatedMouseEvent('mousedown', clickParams);
    canvas.dispatchEvent(downEvent);

    // Dispara o evento de clique após o mousedown
    const clickEvent = new SimulatedMouseEvent('click', clickParams);
    canvas.dispatchEvent(clickEvent);

    // Simula o mouseup após um pequeno delay
    setTimeout(() => {
      const upEvent = new SimulatedMouseEvent('mouseup', clickParams);
      canvas.dispatchEvent(upEvent);
    }, 100);
  };

  // Função para simular teclas do teclado
  const simulateKeyPress = (keyCode: string, e: React.TouchEvent) => {
    // Impedir qualquer propagação de evento
    e.stopPropagation();
    e.preventDefault();

    // Simula keydown
    const keydownEvent = new KeyboardEvent('keydown', {
      code: keyCode,
      key: keyCode === 'Space' ? ' ' : keyCode.replace('Key', '').toLowerCase(),
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(keydownEvent);

    // Simula keyup após um pequeno delay
    setTimeout(() => {
      const keyupEvent = new KeyboardEvent('keyup', {
        code: keyCode,
        key: keyCode === 'Space' ? ' ' : keyCode.replace('Key', '').toLowerCase(),
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(keyupEvent);
    }, 100);
  };

  // Função para abrir o inventário
  const openInventory = (e: React.TouchEvent) => {
    // Impedir qualquer propagação de evento
    e.stopPropagation();
    e.preventDefault();

    // Simula a tecla E para abrir o inventário
    simulateKeyPress('KeyE', e);
  };

  useEffect(() => {
    if (!isMobile || !enabled) return;

    const moveJoystickContainer = moveJoystickContainerRef.current;
    const lookJoystickContainer = lookJoystickContainerRef.current;

    if (!moveJoystickContainer || !lookJoystickContainer) return;

    // Cleanup any existing instances first
    if (moveJoystickRef.current) {
      moveJoystickRef.current.destroy();
    }
    
    if (lookJoystickRef.current) {
      lookJoystickRef.current.destroy();
    }

    // Create nipplejs instances
    moveJoystickRef.current = nipplejs.create({
      zone: moveJoystickContainer,
      color: 'white',
      size: 100,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      restOpacity: 0.7,
      fadeTime: 250,
      dynamicPage: true,
      lockX: false,
      lockY: false,
      catchDistance: 150,
      shape: 'circle',
      dataOnly: false,
      threshold: 0.05,
      maxNumberOfNipples: 1,
      multitouch: true,
    });

    lookJoystickRef.current = nipplejs.create({
      zone: lookJoystickContainer,
      color: 'white',
      size: 100,
      mode: 'static',
      position: { left: '50%', top: '50%' },
      restOpacity: 0.7,
      fadeTime: 250,
      dynamicPage: true,
      lockX: false,
      lockY: false,
      catchDistance: 150,
      shape: 'circle',
      dataOnly: false,
      threshold: 0.05,
      maxNumberOfNipples: 1,
      multitouch: true,
    });

    const moveJoystick = moveJoystickRef.current;
    const lookJoystick = lookJoystickRef.current;

    // Handle move joystick events
    const handleMoveStart = () => {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { type: 'move:start' }
      }));
      
      onTouchStateChange?.({
        moveJoystick: {
          active: true,
          currentX: 0,
          currentY: 0,
        },
        lookJoystick: touchState.lookJoystick,
      });
    };

    const handleMoveMove = (_evt: any, data: JoystickOutputData) => {
      // Extract directional data (using vector instead of angle for more accuracy)
      // Normalize based on distance factor for smoother control
      const maxDistance = 75; // Maximum practical distance in pixels
      const normalizedDistance = Math.min(data.distance / maxDistance, 1);
      
      // Get the x and y vector directly from nipplejs data
      // This is more accurate than calculating from angle
      const x = data.vector.x * normalizedDistance;
      const y = data.vector.y * normalizedDistance;

      // Dispatch custom event with joystick data
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { 
          type: 'move:move',
          x: x,
          y: y,
          vector: data.vector,
          direction: data.direction
        }
      }));
      
      // Update touch state (make sure the values are clamped between -1 and 1)
      onTouchStateChange?.({
        moveJoystick: {
          active: true,
          currentX: Math.max(-1, Math.min(1, x)),
          currentY: Math.max(-1, Math.min(1, -y)), // Invert Y for proper controls
        },
        lookJoystick: touchState.lookJoystick,
      });
    };

    const handleMoveEnd = () => {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { type: 'move:end' }
      }));
      
      onTouchStateChange?.({
        moveJoystick: {
          active: false,
          currentX: 0,
          currentY: 0,
        },
        lookJoystick: touchState.lookJoystick,
      });
    };

    // Handle look joystick events
    const handleLookStart = () => {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { type: 'look:start' }
      }));
      
      onTouchStateChange?.({
        moveJoystick: touchState.moveJoystick,
        lookJoystick: {
          active: true,
          currentX: 0,
          currentY: 0,
        },
      });
    };

    const handleLookMove = (_evt: any, data: JoystickOutputData) => {
      // Extract directional data (using vector instead of angle for more accuracy)
      // Normalize based on distance factor for smoother control
      const maxDistance = 75; // Maximum practical distance in pixels
      const normalizedDistance = Math.min(data.distance / maxDistance, 1);
      
      // Get the x and y vector directly from nipplejs data
      // This is more accurate than calculating from angle
      const x = data.vector.x * normalizedDistance;
      const y = data.vector.y * normalizedDistance;

      // Dispatch custom event with joystick data
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { 
          type: 'look:move',
          x: x,
          y: y, 
          vector: data.vector,
          direction: data.direction
        }
      }));
      
      // Update touch state (make sure the values are clamped between -1 and 1)
      onTouchStateChange?.({
        moveJoystick: touchState.moveJoystick,
        lookJoystick: {
          active: true,
          currentX: Math.max(-1, Math.min(1, x)),
          currentY: Math.max(-1, Math.min(1, -y)), // Invert Y for proper controls
        },
      });
    };

    const handleLookEnd = () => {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { type: 'look:end' }
      }));
      
      onTouchStateChange?.({
        moveJoystick: touchState.moveJoystick,
        lookJoystick: {
          active: false,
          currentX: 0,
          currentY: 0,
        },
      });
    };

    // Register nipplejs event handlers
    moveJoystick.on('start', handleMoveStart);
    moveJoystick.on('move', handleMoveMove);
    moveJoystick.on('end', handleMoveEnd);
    
    lookJoystick.on('start', handleLookStart);
    lookJoystick.on('move', handleLookMove);
    lookJoystick.on('end', handleLookEnd);

    // Cleanup
    return () => {
      if (moveJoystickRef.current) {
        moveJoystickRef.current.off('start', handleMoveStart);
        moveJoystickRef.current.off('move', handleMoveMove);
        moveJoystickRef.current.off('end', handleMoveEnd);
        moveJoystickRef.current.destroy();
        moveJoystickRef.current = null;
      }
      
      if (lookJoystickRef.current) {
        lookJoystickRef.current.off('start', handleLookStart);
        lookJoystickRef.current.off('move', handleLookMove);
        lookJoystickRef.current.off('end', handleLookEnd);
        lookJoystickRef.current.destroy();
        lookJoystickRef.current = null;
      }
    };
  }, [enabled, isMobile, onTouchStateChange]);

  useEffect(() => {
    if (!isMobile || !enabled) return;

    // Listener for mouse events (for debugging purposes)
    const debugMouseEvents = () => {
      // Debug handling removed
    };

    // Adicionar ouvintes para depuração
    document.addEventListener('click', debugMouseEvents);
    document.addEventListener('mousedown', debugMouseEvents);
    document.addEventListener('mouseup', debugMouseEvents);

    return () => {
      // Remover ouvintes na limpeza
      document.removeEventListener('click', debugMouseEvents);
      document.removeEventListener('mousedown', debugMouseEvents);
      document.removeEventListener('mouseup', debugMouseEvents);
    };
  }, [isMobile, enabled]);

  if (!isMobile || !enabled) return null;

  return (
    <div className='fixed inset-0 pointer-events-none z-50 opacity-10 select-none'>
      {/* Movement Joystick com botões acima */}
      <div className='absolute left-2 bottom-4'>
        {/* Control buttons div separado e posicionado acima do joystick esquerdo */}
        <div className='absolute -top-20 left-0 right-0 w-full flex justify-between gap-2 mb-2 z-10'>
          {/* Inventory button */}
          <div className='pointer-events-auto'>
            <button
              className='w-14 h-14 rounded-full bg-purple-500/70 border-2 border-white flex items-center justify-center active:bg-purple-600 shadow-lg'
              onClick={(e) => e.stopPropagation()}
              onTouchStart={openInventory}
              aria-label='Open Inventory'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-7 w-7' viewBox='0 0 20 20' fill='white'>
                <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
              </svg>
            </button>
          </div>

          {/* Up button */}
          <div className='pointer-events-auto'>
            <button
              className='w-14 h-14 rounded-full bg-green-500/70 border-2 border-white flex items-center justify-center active:bg-green-600 shadow-lg'
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => simulateKeyPress('Space', e)}
              aria-label='Move Up'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-8 w-8' viewBox='0 0 20 20' fill='white'>
                <path
                  fillRule='evenodd'
                  d='M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>

          {/* Down button */}
          <div className='pointer-events-auto'>
            <button
              className='w-14 h-14 rounded-full bg-green-500/70 border-2 border-white flex items-center justify-center active:bg-green-600 shadow-lg'
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => simulateKeyPress('ControlLeft', e)}
              aria-label='Move Down'
            >
              <svg xmlns='http://www.w3.org/2000/svg' className='h-8 w-8' viewBox='0 0 20 20' fill='white'>
                <path
                  fillRule='evenodd'
                  d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
        </div>

        {/* O joystick esquerdo com nipplejs */}
        <div
          ref={moveJoystickContainerRef}
          className='w-32 h-32 pointer-events-auto relative rounded-full bg-slate-800/40 backdrop-blur-sm border-2 border-white/50 shadow-lg select-none'
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Look Joystick com botões L e R acima */}
      <div className='absolute right-2 bottom-4'>
        {/* Mouse buttons div separado e posicionado acima do joystick direito */}
        <div className='absolute -top-20 -left-4 right-0 w-full flex justify-between mb-2 z-10 gap-2'>
          {/* Left mouse button */}
          <div className='pointer-events-auto'>
            <button
              className='w-14 h-14 rounded-full bg-blue-500/70 border-2 border-white flex items-center justify-center active:bg-blue-600 shadow-lg'
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                simulateMouseClick(0, e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                simulateMouseClick(0, e);
              }}
              aria-label='Left Click'
            >
              <span className='text-white font-bold text-lg'>L</span>
            </button>
          </div>

          {/* Right mouse button */}
          <div className='pointer-events-auto'>
            <button
              className='w-14 h-14 rounded-full bg-red-500/70 border-2 border-white flex items-center justify-center active:bg-red-600 shadow-lg'
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                simulateMouseClick(2, e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                simulateMouseClick(2, e);
              }}
              aria-label='Right Click'
            >
              <span className='text-white font-bold text-lg'>R</span>
            </button>
          </div>
        </div>

        {/* O joystick direito com nipplejs */}
        <div
          ref={lookJoystickContainerRef}
          className='w-32 h-32 pointer-events-auto relative rounded-full bg-slate-800/40 backdrop-blur-sm border-2 border-white/50 shadow-lg select-none'
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
};

export default TouchControls;
