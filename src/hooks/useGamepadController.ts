import { useEffect, useState, useRef } from 'react';

const GAMEPAD_DEBUG = false;
// eslint-disable-next-line
const logGamepad = (message: string, ...args: any[]): void => {
  if (GAMEPAD_DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`[Gamepad] ${message}`, ...args);
  }
};

export interface GamepadState {
  connected: boolean;
  buttonStates: Map<number, boolean>;
  axesValues: number[];
  hotbarSlot?: number;
}

// Standard gamepad mapping indices
export const GamepadButton = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LEFT_SHOULDER: 4,    // LB
  RIGHT_SHOULDER: 5,   // RB
  LEFT_TRIGGER: 6,     // LT
  RIGHT_TRIGGER: 7,    // RT
  SELECT: 8,
  START: 9,
  LEFT_STICK_PRESS: 10,
  RIGHT_STICK_PRESS: 11,
  D_PAD_UP: 12,
  D_PAD_DOWN: 13,
  D_PAD_LEFT: 14,
  D_PAD_RIGHT: 15,
};

// Standard gamepad axis mapping
export const GamepadAxis = {
  LEFT_STICK_X: 0,
  LEFT_STICK_Y: 1,
  RIGHT_STICK_X: 2,
  RIGHT_STICK_Y: 3,
  LEFT_TRIGGER: 4,  // Some controllers use axes for triggers
  RIGHT_TRIGGER: 5, // Some controllers use axes for triggers
};

// The deadzone value
const DEADZONE = 0.15;
// The trigger threshold for activation
const TRIGGER_THRESHOLD = 0.1;

// Function to apply deadzone to joysticks to prevent drift
const applyDeadzone = (value: number): number => {
  return Math.abs(value) < DEADZONE 
    ? 0 
    : value > 0 
      ? (value - DEADZONE) / (1 - DEADZONE) 
      : (value + DEADZONE) / (1 - DEADZONE);
};

// Simulate a keyboard event
const simulateKeyEvent = (code: string, type: 'keydown' | 'keyup') => {
  const event = new KeyboardEvent(type, {
    code,
    key: code === 'Space' ? ' ' : code.replace('Key', '').toLowerCase(),
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
};

// Simulate a mouse event
const simulateMouseEvent = (type: string, button: number = 0) => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window,
    button,
    buttons: button === 0 ? 1 : button === 2 ? 2 : 0,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
  });
  canvas.dispatchEvent(event);
};

// Hook to handle gamepad controller input
export function useGamepadController() {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    buttonStates: new Map(),
    axesValues: [],
  });
  
  // Use ref to track the current hotbar slot
  const hotbarSlotRef = useRef(1);

  useEffect(() => {
    let animationFrameId: number;
    let activeGamepad: Gamepad | null = null;
    const lastButtonStates = new Map<number, boolean>();
    
    // Handle gamepad connection
    const handleGamepadConnected = (event: GamepadEvent) => {
      logGamepad('Gamepad connected:', event.gamepad.id);
      activeGamepad = event.gamepad;
      setGamepadState(prev => ({
        ...prev,
        connected: true,
      }));
    };

    // Handle gamepad disconnection
    const handleGamepadDisconnected = (event: GamepadEvent) => {
      logGamepad('Gamepad disconnected:', event.gamepad.id);
      if (activeGamepad && event.gamepad.index === activeGamepad.index) {
        activeGamepad = null;
        setGamepadState({
          connected: false,
          buttonStates: new Map(),
          axesValues: [],
        });
      }
    };

    // Map gamepad input to keyboard/mouse controls
    const mapControlsToKeyboardAndMouse = (buttonStates: Map<number, boolean>, axesValues: number[]) => {
      // Movement with left stick
      const leftX = axesValues[GamepadAxis.LEFT_STICK_X];
      const leftY = axesValues[GamepadAxis.LEFT_STICK_Y];
      
      // W - Forward
      if (leftY < -DEADZONE) {
        simulateKeyEvent('KeyW', 'keydown');
      } else {
        simulateKeyEvent('KeyW', 'keyup');
      }
      
      // S - Backward
      if (leftY > DEADZONE) {
        simulateKeyEvent('KeyS', 'keydown');
      } else {
        simulateKeyEvent('KeyS', 'keyup');
      }
      
      // A - Left
      if (leftX < -DEADZONE) {
        simulateKeyEvent('KeyA', 'keydown');
      } else {
        simulateKeyEvent('KeyA', 'keyup');
      }
      
      // D - Right
      if (leftX > DEADZONE) {
        simulateKeyEvent('KeyD', 'keydown');
      } else {
        simulateKeyEvent('KeyD', 'keyup');
      }
      
      // SPRINT with LEFT_STICK_PRESS (like Minecraft)
      if (buttonStates.get(GamepadButton.LEFT_STICK_PRESS) && !lastButtonStates.get(GamepadButton.LEFT_STICK_PRESS)) {
        // Toggle sprint by simulating Shift key
        simulateKeyEvent('ShiftLeft', 'keydown');
      } else if (!buttonStates.get(GamepadButton.LEFT_STICK_PRESS) && lastButtonStates.get(GamepadButton.LEFT_STICK_PRESS)) {
        simulateKeyEvent('ShiftLeft', 'keyup');
      }
      
      // Jump with A button
      if (buttonStates.get(GamepadButton.A) && !lastButtonStates.get(GamepadButton.A)) {
        simulateKeyEvent('Space', 'keydown');
      } else if (!buttonStates.get(GamepadButton.A) && lastButtonStates.get(GamepadButton.A)) {
        simulateKeyEvent('Space', 'keyup');
      }

      // Sneak/Crouch with B button
      if (buttonStates.get(GamepadButton.B) && !lastButtonStates.get(GamepadButton.B)) {
        simulateKeyEvent('ControlLeft', 'keydown');
      } else if (!buttonStates.get(GamepadButton.B) && lastButtonStates.get(GamepadButton.B)) {
        simulateKeyEvent('ControlLeft', 'keyup');
      }
      
      // Inventory with Y button
      if (buttonStates.get(GamepadButton.Y) && !lastButtonStates.get(GamepadButton.Y)) {
        simulateKeyEvent('KeyE', 'keydown');
        setTimeout(() => simulateKeyEvent('KeyE', 'keyup'), 100);
      }

      // Hotbar selection with LEFT_SHOULDER (LB) or D-PAD_LEFT
      if ((buttonStates.get(GamepadButton.LEFT_SHOULDER) && !lastButtonStates.get(GamepadButton.LEFT_SHOULDER)) ||
          (buttonStates.get(GamepadButton.D_PAD_LEFT) && !lastButtonStates.get(GamepadButton.D_PAD_LEFT))) {
        logGamepad('Previous hotbar triggered - LB or D-Pad Left');
        
        // Calculate previous slot with wrap-around
        const currentSlot = hotbarSlotRef.current;
        const prevSlot = currentSlot <= 1 ? 9 : currentSlot - 1;
        hotbarSlotRef.current = prevSlot;
        
        logGamepad(`Switching to hotbar slot ${prevSlot}`);
        
        // Use the number key corresponding to the slot
        const keyCode = `Digit${prevSlot}`;
        simulateKeyEvent(keyCode, 'keydown');
        setTimeout(() => simulateKeyEvent(keyCode, 'keyup'), 100);
      }
      
      // Hotbar selection with RIGHT_SHOULDER (RB) or D-PAD_RIGHT
      if ((buttonStates.get(GamepadButton.RIGHT_SHOULDER) && !lastButtonStates.get(GamepadButton.RIGHT_SHOULDER)) ||
          (buttonStates.get(GamepadButton.D_PAD_RIGHT) && !lastButtonStates.get(GamepadButton.D_PAD_RIGHT))) {
        logGamepad('Next hotbar triggered - RB or D-Pad Right');
        
        // Calculate next slot with wrap-around
        const currentSlot = hotbarSlotRef.current;
        const nextSlot = currentSlot >= 9 ? 1 : currentSlot + 1;
        hotbarSlotRef.current = nextSlot;
        
        logGamepad(`Switching to hotbar slot ${nextSlot}`);
        
        // Use the number key corresponding to the slot
        const keyCode = `Digit${nextSlot}`;
        simulateKeyEvent(keyCode, 'keydown');
        setTimeout(() => simulateKeyEvent(keyCode, 'keyup'), 100);
      }
      
      // Handle triggers - check both button states and axes for cross-controller compatibility
      // RIGHT TRIGGER (primary action - left mouse button)
      const rightTriggerPressed = buttonStates.get(GamepadButton.RIGHT_TRIGGER) || 
                                 (axesValues[GamepadAxis.RIGHT_TRIGGER] !== undefined && 
                                  axesValues[GamepadAxis.RIGHT_TRIGGER] > TRIGGER_THRESHOLD);
      const rightTriggerWasPressed = lastButtonStates.get(GamepadButton.RIGHT_TRIGGER);
      
      if (rightTriggerPressed && !rightTriggerWasPressed) {
        simulateMouseEvent('mousedown', 0);
        simulateMouseEvent('click', 0);
      } else if (!rightTriggerPressed && rightTriggerWasPressed) {
        simulateMouseEvent('mouseup', 0);
      }
      
      // LEFT TRIGGER (secondary action - right mouse button)
      const leftTriggerPressed = buttonStates.get(GamepadButton.LEFT_TRIGGER) || 
                                (axesValues[GamepadAxis.LEFT_TRIGGER] !== undefined && 
                                 axesValues[GamepadAxis.LEFT_TRIGGER] > TRIGGER_THRESHOLD);
      const leftTriggerWasPressed = lastButtonStates.get(GamepadButton.LEFT_TRIGGER);
      
      if (leftTriggerPressed && !leftTriggerWasPressed) {
        simulateMouseEvent('mousedown', 2);
        simulateMouseEvent('contextmenu');
      } else if (!leftTriggerPressed && leftTriggerWasPressed) {
        simulateMouseEvent('mouseup', 2);
      }
      
      // Open menu (pause) with START button
      if (buttonStates.get(GamepadButton.START) && !lastButtonStates.get(GamepadButton.START)) {
        simulateKeyEvent('Escape', 'keydown');
        setTimeout(() => simulateKeyEvent('Escape', 'keyup'), 100);
      }
      
      // Drop item with X button
      if (buttonStates.get(GamepadButton.X) && !lastButtonStates.get(GamepadButton.X)) {
        simulateKeyEvent('KeyQ', 'keydown');
        setTimeout(() => simulateKeyEvent('KeyQ', 'keyup'), 100);
      }
      
      // Camera control with right stick
      // This is handled separately as it requires custom event dispatching
      const rightX = axesValues[GamepadAxis.RIGHT_STICK_X];
      const rightY = axesValues[GamepadAxis.RIGHT_STICK_Y];
      
      // Log stick movement if significant
      if (Math.abs(rightX) > 0.3 || Math.abs(rightY) > 0.3) {
        logGamepad('Right stick:', rightX.toFixed(2), rightY.toFixed(2));
      }
      
      // Always dispatch the joystick event for camera control, even with zero values
      // This ensures the camera responds properly to joystick movements
      window.dispatchEvent(new CustomEvent('joystick-event', {
        detail: { 
          type: 'look:move',
          x: applyDeadzone(rightX) * 1.5, // Apply multiplier for more responsive camera movement
          y: applyDeadzone(rightY) * 1.5, // Reduced from 2 to 1.5 for better control
          vector: { x: rightX, y: rightY },
          direction: { x: Math.sign(rightX), y: Math.sign(rightY) },
        }
      }));
    };

    // Main update loop
    const updateGamepadState = () => {
      const gamepads = navigator.getGamepads();
      let currentGamepad = null;
      
      // First, look for the active gamepad
      if (activeGamepad && gamepads[activeGamepad.index]) {
        currentGamepad = gamepads[activeGamepad.index];
      } else if (!activeGamepad) {
        // If there's no active gamepad yet, look for the first connected one
        for (let i = 0; i < gamepads.length; i++) {
          if (gamepads[i]) {
            currentGamepad = gamepads[i];
            activeGamepad = currentGamepad;
            break;
          }
        }
      }

      if (currentGamepad) {
        const newButtonStates = new Map<number, boolean>();
        
        // Update button states
        for (let i = 0; i < currentGamepad.buttons.length; i++) {
          const button = currentGamepad.buttons[i];
          newButtonStates.set(i, button.pressed);
        }
        
        // Update axes values with deadzone applied
        const newAxesValues = Array.from(currentGamepad.axes).map(applyDeadzone);
        
        // Map controls to keyboard/mouse
        mapControlsToKeyboardAndMouse(newButtonStates, newAxesValues);
        
        // Update state
        setGamepadState({
          connected: true,
          buttonStates: newButtonStates,
          axesValues: newAxesValues,
        });
        
        // Save current button states for next comparison
        newButtonStates.forEach((value, key) => {
          lastButtonStates.set(key, value);
        });
      }
      
      animationFrameId = requestAnimationFrame(updateGamepadState);
    };

    // Start the loop
    animationFrameId = requestAnimationFrame(updateGamepadState);
    
    // Add event listeners
    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      
      // Release any held keys
      simulateKeyEvent('KeyW', 'keyup');
      simulateKeyEvent('KeyA', 'keyup');
      simulateKeyEvent('KeyS', 'keyup');
      simulateKeyEvent('KeyD', 'keyup');
      simulateKeyEvent('Space', 'keyup');
      simulateKeyEvent('ControlLeft', 'keyup');
    };
  }, []);

  return gamepadState;
}

export default useGamepadController; 