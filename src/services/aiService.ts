import { Solution } from '../store/interviewAssistantStore';
import { useOpenRouterStore } from '../store/useOpenRouterStore';
import { useOllamaStore } from '../store/useOllamaStore';
import { OPENROUTER_MODELS } from '../lib/openrouter-constants';
import { openRouterApi, MessageContent as OpenRouterMessageContent, TextContent, ImageContent } from '../lib/openrouter';
import { ollamaApi, OllamaContent, OllamaTextContent, OllamaImageContent, MessageContent as OllamaMessageContent } from '../lib/ollama';
import { useInterviewAssistantStore } from '../store/interviewAssistantStore';
import { DEFAULT_OLLAMA_MODELS, normalizeEndpoint } from '../lib/ollama-constants';

// Logger to handle console safely
const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
};

/**
 * Get available models for solution generation
 * @returns Array of available models
 */
export const getAvailableModels = (): { id: string; name: string }[] => {
  const ollamaStore = useOllamaStore.getState();
  
  // If Ollama is enabled, try to use stored custom models or default to built-in models
  if (ollamaStore.isEnabled) {
    // Check if we have dynamically loaded models in localStorage
    try {
      const storedModels = localStorage.getItem('ollamaModels');
      if (storedModels) {
        const parsedModels = JSON.parse(storedModels);
        if (Array.isArray(parsedModels) && parsedModels.length > 0) {
          return parsedModels;
        }
      }
    } catch (error) {
      console.error('Error reading Ollama models from localStorage:', error);
    }
    
    // If no stored models, return default models
    return DEFAULT_OLLAMA_MODELS;
  }
  
  // Otherwise return OpenRouter models
  return OPENROUTER_MODELS;
};

/**
 * Generate a solution for a coding problem using OpenRouter API or Ollama
 * 
 * @param problemText The text of the problem to solve
 * @param language The programming language to use for the solution
 * @param modelId Optional model ID to use (defaults to the one in store)
 * @param isCode Whether this is a coding problem or a general question
 * @returns Promise that resolves to a solution
 */
export const generateSolution = async (
  problemText: string,
  language: string = 'javascript',
  modelId?: string,
  isCode: boolean = true
): Promise<Solution> => {
  try {
    // First check if we should use Ollama
    const ollamaStore = useOllamaStore.getState();
    
    if (ollamaStore.isEnabled) {
      return generateSolutionWithOllama(problemText, language, modelId, isCode);
    }
    
    // Otherwise use OpenRouter
    logger.log('Generating solution with OpenRouter API');
    
    // Get state from the OpenRouter store
    const store = useOpenRouterStore.getState();
    
    // Get screenshots from the interview assistant store
    const { screenshots } = useInterviewAssistantStore.getState();
    
    // Use provided modelId or fall back to store default
    const selectedModel = modelId || store.defaultModel;
    
    // Get API key from store, environment or localStorage
    const apiKey = store.apiKey || 
                  process.env.VITE_OPENROUTER_API_KEY || 
                  localStorage.getItem('openRouterApiKey') || 
                  '';
    
    if (!apiKey) {
      logger.error('No OpenRouter API key found');
      return {
        code: `// Error: No OpenRouter API key found\n// Please set your API key in the settings`,
        explanation: 'No OpenRouter API key found. Please set your API key in the application settings.',
        complexity: {
          time: 'N/A',
          space: 'N/A'
        }
      };
    }
    
    // Prepare the system prompt based on whether this is a coding question or general question
    const systemPrompt = isCode
      ? `You are a coding assistant. Solve the given coding problem in ${language}.
YOUR RESPONSE MUST BE VALID JSON. Format your response EXACTLY as follows (including the outer braces):
{
  "code": "The full code solution with comments",
  "explanation": "A brief explanation of your approach",
  "timeComplexity": "The time complexity of your solution",
  "spaceComplexity": "The space complexity of your solution"
}
DO NOT include any text before or after the JSON. Return ONLY the JSON object.`
      : `You are a helpful assistant. Answer the following question in a clear and concise way.
YOUR RESPONSE MUST BE VALID JSON. Format your response EXACTLY as follows (including the outer braces):
{
  "code": "Any code snippets relevant to the answer",
  "explanation": "Your detailed answer to the question"
}
DO NOT include any text before or after the JSON. Return ONLY the JSON object.`;
    
    // Prepare the messages for the API request
    let messages: { role: string; content: OpenRouterMessageContent }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: problemText }
    ];
    
    // Include screenshots if available and the selected model supports vision
    const supportsVision = ['openai/gpt-4-vision', 'openai/gpt-4o', 'anthropic/claude-3-opus', 'anthropic/claude-3-sonnet', 'anthropic/claude-3-haiku'].includes(selectedModel);
    
    if (screenshots.length > 0 && supportsVision) {
      logger.log('Including screenshots in the request');
      
      // Convert screenshots to image_url content format
      const imageContents = screenshots.map(screenshot => ({
        type: 'image_url' as const,
        image_url: {
          url: screenshot.dataUrl
        }
      }));
      
      // Create a multimodal message with text and images
      messages = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user',
          content: [
            { type: 'text', text: problemText },
            ...imageContents
          ]
        }
      ];
    }
    
    // Define site information for the API request
    const siteInfo = {
      url: store.siteUrl,
      title: store.siteName
    };
    
    // Prepare the request payload
    const requestPayload = {
      model: selectedModel,
      messages,
      temperature: 0.7, // Moderate creativity
      response_format: { type: 'json_object' } // Request JSON response
    };
    
    try {
      // Make the API request using the OpenRouter API client
      const response = await openRouterApi.chat(
        apiKey,
        requestPayload,
        siteInfo
      );
      
      logger.log('Received response from OpenRouter API:', response.model);
      
      // Extract the content and model from the response
      const content = response.choices[0]?.message?.content || '';
      const responseModel = response.model;
      
      // Add to history if we have a valid response
      if (content && store.addToHistory) {
        store.addToHistory(
          problemText.substring(0, 100) + '...', // Truncate problem text for history
          content.substring(0, 100) + '...', // Truncate response for history
          responseModel
        );
      }
      
      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(content);
        
        // Format the solution
        return {
          code: parsedResponse.code || 'Error: No code was generated',
          explanation: parsedResponse.explanation || 'No explanation provided',
          complexity: {
            time: parsedResponse.timeComplexity || 'Unknown',
            space: parsedResponse.spaceComplexity || 'Unknown'
          }
        };
      } catch (parseError) {
        logger.error('Error parsing AI response:', parseError);
        
        // If parsing fails, try to extract code section
        const codeSection = extractCodeSection(content);
        
        return {
          code: codeSection || 'Error: Could not parse the response',
          explanation: 'The AI generated an invalid response format. Using best-effort extraction.',
          complexity: {
            time: 'Unknown',
            space: 'Unknown'
          }
        };
      }
    } catch (apiError) {
      // Handle API-specific errors
      logger.error('OpenRouter API error:', apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
      
      return {
        code: `// Error calling OpenRouter API\n// ${errorMessage}`,
        explanation: 'There was an error connecting to the OpenRouter API. Please check your network connection and API key, then try again.',
        complexity: {
          time: 'N/A',
          space: 'N/A'
        }
      };
    }
  } catch (error: unknown) {
    logger.error('Error generating solution:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Simple fallback when API fails
    return {
      code: `// Error generating solution for ${language}\n// ${errorMessage}`,
      explanation: 'There was an unexpected error. Please try again or contact support if the issue persists.',
      complexity: {
        time: 'N/A',
        space: 'N/A'
      }
    };
  }
};

/**
 * Generate a solution using Ollama API
 */
async function generateSolutionWithOllama(
  problemText: string,
  language: string = 'javascript',
  modelId?: string,
  isCode: boolean = true
): Promise<Solution> {
  try {
    logger.log('Generating solution with Ollama API');
    
    // Get state from the Ollama store
    const store = useOllamaStore.getState();
    
    // Use provided modelId or fall back to store default
    const selectedModel = modelId || store.defaultModel;
    
    // Normalize the endpoint URL
    const endpoint = normalizeEndpoint(store.endpoint);
    
    // Get screenshots from the interview assistant store
    const { screenshots } = useInterviewAssistantStore.getState();
    
    // Prepare the system prompt based on whether this is a coding question or general question
    const systemPrompt = isCode
      ? `You are a coding assistant. Solve the given coding problem in ${language}.
YOUR RESPONSE MUST BE VALID JSON. Format your response EXACTLY as follows (including the outer braces):
{
  "code": "The full code solution with comments",
  "explanation": "A brief explanation of your approach",
  "timeComplexity": "The time complexity of your solution",
  "spaceComplexity": "The space complexity of your solution"
}
DO NOT include any text before or after the JSON. Return ONLY the JSON object.`
      : `You are a helpful assistant. Answer the following question in a clear and concise way.
YOUR RESPONSE MUST BE VALID JSON. Format your response EXACTLY as follows (including the outer braces):
{
  "code": "Any code snippets relevant to the answer",
  "explanation": "Your detailed answer to the question"
}
DO NOT include any text before or after the JSON. Return ONLY the JSON object.`;

    // Prepare messages array
    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: problemText }
    ];
    
    // Check if we have screenshots and if the model might support images
    // For now, treat any model with "llava" in the name as a vision model
    const supportsVision = selectedModel.toLowerCase().includes('llava');
    
    // If we have screenshots and the model supports vision, add screenshots as base64 data
    if (screenshots.length > 0) {
      logger.log('Including screenshots in the Ollama request for vision model');
      
      // Extract base64 data from all screenshots
      const imageBase64Array: string[] = [];
      
      // Function to resize image data and reduce size
      const resizeBase64Image = async (base64Data: string, maxWidth = 800, quality = 0.8): Promise<string> => {
        return new Promise((resolve) => {
          // Create an image element to work with the image data
          const img = new Image();
          img.onload = () => {
            // Calculate new dimensions while preserving aspect ratio
            let width = img.width;
            let height = img.height;
            
            // Only resize if larger than maxWidth
            if (width > maxWidth) {
              const aspectRatio = width / height;
              width = maxWidth;
              height = width / aspectRatio;
            }
            
            // Create a canvas to draw the resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            // Draw the image on the canvas with the new dimensions
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              
              // Get the resized image as base64 (with quality parameter to reduce file size)
              const resizedBase64 = canvas.toDataURL('image/jpeg', quality).replace(/^data:image\/\w+;base64,/, '');
              resolve(resizedBase64);
            } else {
              // Fallback if context is not available - use original but log warning
              logger.error('Failed to get canvas context for image resizing');
              resolve(base64Data);
            }
          };
          
          img.onerror = () => {
            // Fallback in case of error
            logger.error('Error loading image for resizing');
            resolve(base64Data);
          };
          
          // Set source to the original base64 image data 
          img.src = `data:image/png;base64,${base64Data}`;
        });
      };
      
      // Process each screenshot - resize and add to array
      const processScreenshots = async () => {
        try {
          // Process each screenshot, resize and add to array
          for (const screenshot of screenshots) {
            // Extract base64 data (remove the data:image/png;base64, prefix)
            const originalBase64 = screenshot.dataUrl.replace(/^data:image\/\w+;base64,/, '');
            
            // Resize the image to reduce payload size
            const resizedBase64 = await resizeBase64Image(originalBase64);
            imageBase64Array.push(resizedBase64);
            
            // Debug the image data (truncated for brevity)
            const reductionPercent = Math.round((1 - (resizedBase64.length / originalBase64.length)) * 100);
            logger.log(`Added image to base64 array, reduced by ${reductionPercent}%, original: ${originalBase64.length}, new: ${resizedBase64.length} bytes`);
          }
          
          // Check if the total size is still too large
          const totalSize = imageBase64Array.reduce((sum, img) => sum + img.length, 0);
          const maxRequestSize = 10 * 1024 * 1024; // 10MB limit
          
          if (totalSize > maxRequestSize) {
            logger.log(`Image payload large (${Math.round(totalSize/1024/1024)}MB), attempting more aggressive reduction.`);
            
            // Try to reduce the size more aggressively with smaller dimensions and quality
            try {
              // Empty the array and re-add the images with more aggressive reduction
              const aggressiveReduction = async () => {
                imageBase64Array.length = 0; // Clear the array
                
                // Only process the first image if there are multiple to reduce payload further
                const imagesToProcess = screenshots.length > 2 ? [screenshots[0]] : screenshots;
                
                for (const screenshot of imagesToProcess) {
                  const originalBase64 = screenshot.dataUrl.replace(/^data:image\/\w+;base64,/, '');
                  // Use smaller dimensions (400px) and lower quality (0.6)
                  const smallerBase64 = await resizeBase64Image(originalBase64, 400, 0.6);
                  imageBase64Array.push(smallerBase64);
                  
                  const reductionPercent = Math.round((1 - (smallerBase64.length / originalBase64.length)) * 100);
                  logger.log(`Reduced image more aggressively: ${reductionPercent}% reduction, size: ${smallerBase64.length} bytes`);
                }
              };
              
              await aggressiveReduction();
              
              // Check size again
              const newTotalSize = imageBase64Array.reduce((sum, img) => sum + img.length, 0);
              
              // If still too large, use text only
              if (newTotalSize > maxRequestSize) {
                logger.error(`Image payload still too large (${Math.round(newTotalSize/1024/1024)}MB) after reduction. Using text only.`);
                messages = [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: `${problemText} (Note: Images were removed due to size limitations.)` }
                ];
                return; // Exit the function early
              }
            } catch (error) {
              logger.error('Error during aggressive image reduction, fallback to text only:', error);
              messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: problemText }
              ];
              return; // Exit the function early
            }
          }
          
          // Continue with the request now that images are processed
          // Update the messages array with the multimodal message
          // Ollama's newer API expects 'images' array rather than content array with 'image' objects
          const updatedMessage = {
            role: 'user',
            content: problemText,
            images: imageBase64Array
          };
          
          // Define a new properly-typed messages array
          const multimodalMessages = [
            { role: 'system', content: systemPrompt },
            updatedMessage
          ];
          
          // TypeScript hack: we know this will work with Ollama API even though types don't match
          messages = multimodalMessages as unknown as typeof messages;
          
          logger.log('Added screenshots to Ollama request:', 
            JSON.stringify({
              messageCount: messages.length,
              imagesCount: imageBase64Array.length,
              totalSizeKB: Math.round(imageBase64Array.reduce((sum, img) => sum + img.length, 0) / 1024),
              messageFormat: 'Using images array format for Ollama vision models'
            })
          );
        } catch (error) {
          logger.error('Error processing screenshots:', error);
          // Continue with text-only request as fallback
          messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: problemText }
          ];
        }
      };
      
      // Start the screenshot processing and wait for it to complete
      await processScreenshots();
    }
    
    // Prepare the request payload
    const requestPayload = {
      model: selectedModel,
      messages,
      options: {
        temperature: 0.7 // Moderate creativity
      }
    };
    
    // Debug the full request payload structure (without the actual image data for brevity)
    logger.log('Request payload structure:', JSON.stringify({
      model: requestPayload.model,
      messageCount: requestPayload.messages.length,
      messageTypes: requestPayload.messages.map(msg => {
        if (typeof msg.content === 'string') {
          return { role: msg.role, contentType: 'string' };
        } else {
          return { 
            role: msg.role, 
            contentType: 'array', 
            contentItems: Array.isArray(msg.content) 
              ? (msg.content as OllamaContent[]).map((item: OllamaContent) => item.type) 
              : 'unknown'
          };
        }
      })
    }));
    
    try {
      // Make the API request using the specialized Ollama API client for interview assistant
      logger.log('Sending request to Ollama using specialized interview assistant method');
      
      const response = await ollamaApi.interviewAssistantChat(
        endpoint,
        requestPayload
      );
      
      logger.log('Received response from Ollama API:', response.model);
      
      // Extract the content from the response
      const content = response.content || '';
      
      // Add to history if we have a valid response
      if (content) {
        store.addToHistory(
          problemText.substring(0, 100) + '...', // Truncate problem text for history
          content.substring(0, 100) + '...', // Truncate response for history
          selectedModel
        );
      }
      
      // Log the full content for debugging
      logger.log('Raw content from Ollama:', content.substring(0, 200) + '...');
      
      // Try to parse as JSON
      try {
        // Try direct JSON parsing first
        const parsedResponse = JSON.parse(content);
        logger.log('Successfully parsed response as JSON');
        
        return {
          code: parsedResponse.code || 'Error: No code was generated',
          explanation: parsedResponse.explanation || 'No explanation provided',
          complexity: {
            time: parsedResponse.timeComplexity || parsedResponse.time_complexity || 'Unknown',
            space: parsedResponse.spaceComplexity || parsedResponse.space_complexity || 'Unknown'
          }
        };
      } catch (jsonError) {
        logger.error('Failed to parse response as JSON:', jsonError);
        
        // Fall back to extracting code blocks
        const codeSection = extractCodeSection(content);
        
        return {
          code: codeSection || content || 'Error: Could not parse the response',
          explanation: 'The AI generated a response that could not be parsed as JSON. Showing raw response.',
          complexity: {
            time: 'Unknown',
            space: 'Unknown'
          }
        };
      }
    } catch (apiError) {
      // Handle API-specific errors
      logger.error('Ollama API error:', apiError);
      
      const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
      
      return {
        code: `// Error calling Ollama API\n// ${errorMessage}`,
        explanation: 'There was an error connecting to the Ollama API. Please check if Ollama is running.',
        complexity: {
          time: 'N/A',
          space: 'N/A'
        }
      };
    }
  } catch (error: unknown) {
    logger.error('Error generating solution with Ollama:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Simple fallback when API fails
    return {
      code: `// Error generating solution for ${language} with Ollama\n// ${errorMessage}`,
      explanation: 'There was an unexpected error with Ollama. Please try again or check if Ollama is running properly.',
      complexity: {
        time: 'N/A',
        space: 'N/A'
      }
    };
  }
}

/**
 * Helper function to extract code from a string response
 * @param content The content to extract code from
 * @returns The extracted code or undefined
 */
function extractCodeSection(content: string): string | undefined {
  // Look for code blocks marked with ```
  const codeBlockMatch = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }
  
  // If no code blocks, try to find something that looks like code
  const lines = content.split('\n');
  const potentialCodeLines = lines.filter(line => 
    line.includes('=') || 
    line.includes('function') || 
    line.includes('class') || 
    line.includes('import') || 
    line.includes('return') ||
    line.match(/^\s*for\s*\(/) ||
    line.match(/^\s*if\s*\(/) ||
    line.match(/^\s*\{|\}/) ||
    line.includes(';')
  );
  
  if (potentialCodeLines.length > 0) {
    return potentialCodeLines.join('\n');
  }
  
  return undefined;
}

// End of file
