import React, { useEffect, useRef } from 'react';

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
  onTouchStateChange?: (state: any) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ enabled, isMobile, touchState, onTouchStateChange }) => {
  const moveJoystickRef = useRef<HTMLDivElement>(null);
  const lookJoystickRef = useRef<HTMLDivElement>(null);

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
    console.log(`Enviado mousedown para o canvas, botão: ${button}`);

    // Dispara o evento de clique após o mousedown
    const clickEvent = new SimulatedMouseEvent('click', clickParams);
    canvas.dispatchEvent(clickEvent);
    console.log(`Enviado click para o canvas, botão: ${button}`);

    // Simula o mouseup após um pequeno delay
    setTimeout(() => {
      const upEvent = new SimulatedMouseEvent('mouseup', clickParams);
      canvas.dispatchEvent(upEvent);
      console.log(`Enviado mouseup para o canvas, botão: ${button}`);
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

    const moveJoystick = moveJoystickRef.current;
    const lookJoystick = lookJoystickRef.current;

    if (!moveJoystick || !lookJoystick) return;

    // Add non-passive touch event listeners
    const moveStartHandler = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = moveJoystick.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = touch.clientX - rect.left - centerX;
      const y = touch.clientY - rect.top - centerY;

      onTouchStateChange?.({
        moveJoystick: {
          active: true,
          currentX: x / centerX,
          currentY: y / centerY,
        },
        lookJoystick: touchState.lookJoystick,
      });
    };

    const moveMoveHandler = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchState.moveJoystick.active) return;

      const touch = e.touches[0];
      const rect = moveJoystick.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = touch.clientX - rect.left - centerX;
      const y = touch.clientY - rect.top - centerY;

      onTouchStateChange?.({
        moveJoystick: {
          active: true,
          currentX: Math.max(-1, Math.min(1, x / centerX)),
          currentY: Math.max(-1, Math.min(1, y / centerY)),
        },
        lookJoystick: touchState.lookJoystick,
      });
    };

    const moveEndHandler = (e: TouchEvent) => {
      e.preventDefault();
      onTouchStateChange?.({
        moveJoystick: { active: false, currentX: 0, currentY: 0 },
        lookJoystick: touchState.lookJoystick,
      });
    };

    const lookStartHandler = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = lookJoystick.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = touch.clientX - rect.left - centerX;
      const y = touch.clientY - rect.top - centerY;

      onTouchStateChange?.({
        moveJoystick: touchState.moveJoystick,
        lookJoystick: {
          active: true,
          currentX: x / centerX,
          currentY: y / centerY,
        },
      });
    };

    const lookMoveHandler = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchState.lookJoystick.active) return;

      const touch = e.touches[0];
      const rect = lookJoystick.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = touch.clientX - rect.left - centerX;
      const y = touch.clientY - rect.top - centerY;

      onTouchStateChange?.({
        moveJoystick: touchState.moveJoystick,
        lookJoystick: {
          active: true,
          currentX: Math.max(-1, Math.min(1, x / centerX)),
          currentY: Math.max(-1, Math.min(1, y / centerY)),
        },
      });
    };

    const lookEndHandler = (e: TouchEvent) => {
      e.preventDefault();
      onTouchStateChange?.({
        moveJoystick: touchState.moveJoystick,
        lookJoystick: { active: false, currentX: 0, currentY: 0 },
      });
    };

    // Add event listeners with non-passive option
    moveJoystick.addEventListener('touchstart', moveStartHandler, { passive: false });
    moveJoystick.addEventListener('touchmove', moveMoveHandler, { passive: false });
    moveJoystick.addEventListener('touchend', moveEndHandler, { passive: false });
    moveJoystick.addEventListener('touchcancel', moveEndHandler, { passive: false });

    lookJoystick.addEventListener('touchstart', lookStartHandler, { passive: false });
    lookJoystick.addEventListener('touchmove', lookMoveHandler, { passive: false });
    lookJoystick.addEventListener('touchend', lookEndHandler, { passive: false });
    lookJoystick.addEventListener('touchcancel', lookEndHandler, { passive: false });

    // Cleanup
    return () => {
      moveJoystick.removeEventListener('touchstart', moveStartHandler);
      moveJoystick.removeEventListener('touchmove', moveMoveHandler);
      moveJoystick.removeEventListener('touchend', moveEndHandler);
      moveJoystick.removeEventListener('touchcancel', moveEndHandler);

      lookJoystick.removeEventListener('touchstart', lookStartHandler);
      lookJoystick.removeEventListener('touchmove', lookMoveHandler);
      lookJoystick.removeEventListener('touchend', lookEndHandler);
      lookJoystick.removeEventListener('touchcancel', lookEndHandler);
    };
  }, [enabled, isMobile, onTouchStateChange, touchState.lookJoystick, touchState.moveJoystick.active]);

  useEffect(() => {
    if (!isMobile || !enabled) return;

    // Registrar um ouvinte global para depuração de eventos
    const debugMouseEvents = (e: MouseEvent) => {
      if (e.type === 'click' || e.type === 'mousedown' || e.type === 'mouseup') {
        console.log(`Global mouse event captured: ${e.type}, button: ${e.button}`);
      }
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
    <div className='fixed inset-0 pointer-events-none z-50'>
      {/* Movement Joystick com botões acima */}
      <div className='absolute left-8 bottom-4'>
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

        {/* O joystick esquerdo em si */}
        <div
          ref={moveJoystickRef}
          className={`w-24 h-24 pointer-events-auto ${touchState.moveJoystick.active ? 'opacity-100' : 'opacity-50'}`}
          style={{ touchAction: 'none' }}
        >
          <div className='absolute inset-0 rounded-full bg-white/20 border-2 border-white/50' />
          {touchState.moveJoystick.active && (
            <div
              className='absolute w-12 h-12 rounded-full bg-white/50'
              style={{
                left: `${Math.min(Math.max(touchState.moveJoystick.currentX * 48 + 48, 0), 96)}px`,
                top: `${Math.min(Math.max(touchState.moveJoystick.currentY * 48 + 48, 0), 96)}px`,
              }}
            />
          )}
        </div>
      </div>

      {/* Look Joystick com botões L e R acima */}
      <div className='absolute right-8 bottom-4'>
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

        {/* O joystick direito em si */}
        <div
          ref={lookJoystickRef}
          className={`w-24 h-24 pointer-events-auto ${touchState.lookJoystick.active ? 'opacity-100' : 'opacity-50'}`}
          style={{ touchAction: 'none' }}
        >
          <div className='absolute inset-0 rounded-full bg-white/20 border-2 border-white/50' />
          {touchState.lookJoystick.active && (
            <div
              className='absolute w-12 h-12 rounded-full bg-white/50'
              style={{
                left: `${Math.min(Math.max(touchState.lookJoystick.currentX * 48 + 48, 0), 96)}px`,
                top: `${Math.min(Math.max(touchState.lookJoystick.currentY * 48 + 48, 0), 96)}px`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TouchControls;
