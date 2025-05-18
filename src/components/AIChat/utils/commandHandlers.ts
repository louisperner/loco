import { useAIChatStore } from '@/store/useAIChatStore';
import { parsePosition, extractNumber } from './aiChatUtils';
import { createPrimitiveAtCamera } from './primitiveHandlers';

// Process text commands like "create cube at 0,0,0"
export const processCommand = (
  content: string,
  setCommandFeedback: (feedback: string | null) => void
): boolean => {
  const lowerContent = content.toLowerCase();
  
  // Check if it's a cube/sphere/plane creation command
  if (lowerContent.startsWith('create') || lowerContent.startsWith('add')) {
    // Handle cube creation
    if (lowerContent.includes('cube') || lowerContent.includes('box')) {
      const count = extractNumber(lowerContent);
      let position: [number, number, number] = [0, 1, 0];
      
      // Extract position if specified
      const posMatch = lowerContent.match(/at\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
      if (posMatch) {
        const parsedPos = parsePosition(posMatch[1]);
        if (parsedPos) {
          position = parsedPos;
          
          // Create multiple cubes at specified position
          for (let i = 0; i < count; i++) {
            const posOffset: [number, number, number] = [
              position[0] + (i % 3), 
              position[1] + Math.floor(i / 9), 
              position[2] + Math.floor((i % 9) / 3)
            ];
            
            createPrimitiveAtCamera('cube', 1, posOffset);
          }
        }
      } else {
        // Use camera position if no position specified
        position = createPrimitiveAtCamera('cube', count);
      }
      
      setCommandFeedback(`Created ${count} cube${count > 1 ? 's' : ''} at position [${position.join(', ')}]`);
      return true;
    }
    
    // Handle sphere creation
    else if (lowerContent.includes('sphere') || lowerContent.includes('ball')) {
      const count = extractNumber(lowerContent);
      let position: [number, number, number] = [0, 1, 0];
      
      // Extract position if specified
      const posMatch = lowerContent.match(/at\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
      if (posMatch) {
        const parsedPos = parsePosition(posMatch[1]);
        if (parsedPos) {
          position = parsedPos;
          
          // Create multiple spheres at specified position
          for (let i = 0; i < count; i++) {
            // const posOffset: [number, number, number] = [
            //   position[0] + (i % 3), 
            //   position[1] + Math.floor(i / 9), 
            //   position[2] + Math.floor((i % 9) / 3)
            // ];
            
            createPrimitiveAtCamera('sphere', 1);
          }
        }
      } else {
        // Use camera position if no position specified
        position = createPrimitiveAtCamera('sphere', count);
      }
      
      setCommandFeedback(`Created ${count} sphere${count > 1 ? 's' : ''} at position [${position.join(', ')}]`);
      return true;
    }
    
    // Handle plane creation
    else if (lowerContent.includes('plane') || lowerContent.includes('floor')) {
      const count = extractNumber(lowerContent);
      let position: [number, number, number] = [0, 0, 0];
      
      // Extract position if specified
      const posMatch = lowerContent.match(/at\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
      if (posMatch) {
        const parsedPos = parsePosition(posMatch[1]);
        if (parsedPos) {
          position = parsedPos;
          
          // Create multiple planes at specified position
          for (let i = 0; i < count; i++) {
            // const posOffset: [number, number, number] = [
            //   position[0] + (i % 3) * 2, 
            //   position[1], 
            //   position[2] + Math.floor(i / 3) * 2
            // ];
            
            createPrimitiveAtCamera('plane', 1);
          }
        }
      } else {
        // Use camera position if no position specified
        position = createPrimitiveAtCamera('plane', count);
      }
      
      setCommandFeedback(`Created ${count} plane${count > 1 ? 's' : ''} at position [${position.join(', ')}]`);
      return true;
    }
  }
  
  // Check for teleport command
  if (lowerContent.startsWith('teleport') || lowerContent.startsWith('goto') || lowerContent.startsWith('tp')) {
    const posMatch = lowerContent.match(/to\s+([^,\s]+(?:\s*,\s*[^,\s]+){2}|x:[^,\s]+ y:[^,\s]+ z:[^,\s]+)/);
    if (posMatch) {
      const position = parsePosition(posMatch[1]);
      if (position && window.mainCamera) {
        window.mainCamera.position.set(position[0], position[1], position[2]);
        setCommandFeedback(`Teleported to position [${position.join(', ')}]`);
        return true;
      }
    }
  }
  
  // Check for help command
  if (lowerContent === 'help' || lowerContent === 'commands') {
    const helpText = `
Available commands:
- create cube at x:0 y:0 z:0
- create 5 cubes at 0,0,0
- create sphere at 1,2,3
- create plane at 0,0,0
- teleport to 10,5,10

You can also just chat with the AI normally!
    `.trim();
    
    const { addMessage } = useAIChatStore.getState();
    addMessage({
      content: helpText,
      role: 'assistant',
      model: 'system',
    });
    
    return true;
  }
  
  return false;
}; 