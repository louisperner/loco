import { Solution } from '../store/interviewAssistantStore';
import { useOpenRouterStore } from '../store/useOpenRouterStore';
import { OPENROUTER_MODELS } from '../lib/openrouter-constants';
import { openRouterApi, MessageContent } from '../lib/openrouter';
import { useInterviewAssistantStore } from '../store/interviewAssistantStore';

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
  return OPENROUTER_MODELS;
};

/**
 * Generate a solution for a coding problem using OpenRouter API
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
    
    // Check if the selected model supports vision
    const isVisionCapableModel = selectedModel.toLowerCase().includes('gpt-4-vision') || 
                               selectedModel.toLowerCase().includes('claude-3') || 
                               selectedModel.toLowerCase().includes('gemini') ||
                               selectedModel.toLowerCase().includes('vision') ||
                               selectedModel.toLowerCase().includes('vl') || 
                               selectedModel.toLowerCase().includes('meta-llama') || 
                               selectedModel.toLowerCase().includes('qwen');
    
    logger.log(`Using model: ${selectedModel} (Vision capable: ${isVisionCapableModel ? 'YES' : 'NO'})`);
    
    // Prepare system message content - the instructions to the model
    const systemContent = isCode 
      ? `You are an expert programming coach. Generate an optimized solution in ${language} for the coding problem ${isVisionCapableModel && screenshots.length > 0 ? 'shown in the screenshot and' : ''} described in the text. 
    
Your response must include:
1. Clean, well-documented code solution
2. A brief explanation of the approach
3. Time complexity analysis
4. Space complexity analysis

Format your response as JSON with these fields:
{
  "code": "// Your solution code here",
  "explanation": "Brief explanation of your approach",
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(n)"
}`
      : `You are a helpful expert assistant. Answer the question ${isVisionCapableModel && screenshots.length > 0 ? 'shown in the screenshot and' : ''} described in the text.
    
Your response must include:
1. A clear, concise answer
2. A brief explanation of your reasoning

Format your response as JSON with these fields:
{
  "code": "Your answer goes here. This is not actual code but the main answer to the question.",
  "explanation": "Detailed explanation of your answer",
  "timeComplexity": "N/A",
  "spaceComplexity": "N/A"
}`;
    
    // Prepare user message content based on model capabilities
    let userContent: MessageContent;
    
    if (isVisionCapableModel && screenshots.length > 0) {
      try {
        // For vision models with screenshots, create a multimodal message
        const latestScreenshot = screenshots[screenshots.length - 1];
        
        // Check if we have valid image data
        if (!latestScreenshot.dataUrl || latestScreenshot.dataUrl.length < 100) {
          throw new Error('Screenshot data is invalid or empty');
        }
        
        // Ensure the image URL is properly formatted for OpenRouter API
        let imageUrl = latestScreenshot.dataUrl;
        
        // If it's already a data URL, use it as is
        if (!imageUrl.startsWith('data:')) {
          // Determine image format from data or default to png
          const format = 'png'; // Assume PNG format for screenshots
          imageUrl = `data:image/${format};base64,${imageUrl}`;
        }
        
        logger.log('Adding image to request:', 
          imageUrl.substring(0, 20) + '...' + imageUrl.substring(imageUrl.length - 10));
        
        // Create multimodal content array for vision-capable models
        userContent = [
          {
            type: "text",
            text: problemText || "Please analyze the coding problem in the screenshot and provide a solution."
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high" // Request high detail analysis for code
            }
          }
        ];
      } catch (imageError) {
        logger.error('Error processing image for AI request:', imageError);
        // Fallback to text-only if there's an image processing error
        userContent = `${problemText || "Please provide a solution for this problem."} (Note: There was an error processing the screenshot)`;
      }
    } else {
      // For text-only models or when no screenshots
      if (screenshots.length > 0 && !isVisionCapableModel) {
        // If screenshots exist but model doesn't support vision
        userContent = `[This is a coding problem. I've attached a screenshot but since you can't see it, I'll provide the text description]: \n\n${problemText}`;
        logger.log('Using text-only prompt with screenshot context');
      } else {
        // No screenshots, just use the problem text
        userContent = problemText;
        logger.log('Using text-only prompt');
      }
    }
    
    // Prepare the request messages
    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      {
        role: 'user',
        content: userContent
      }
    ];
    
    logger.log(`Using model: ${selectedModel} with ${screenshots.length} screenshots`);
    
    // Create request payload for OpenRouter API
    const requestPayload = {
      model: selectedModel,
      messages: messages,
      temperature: 0.3,
      max_tokens: 4000, // Increase token limit for complex solutions
      response_format: { type: 'json_object' }
    };
    
    // Log the request payload in development
    if (process.env.NODE_ENV === 'development') {
      logger.log('OpenRouter request payload:', {
        model: selectedModel,
        messageCount: messages.length,
        hasScreenshots: screenshots.length > 0,
        isVisionCapable: isVisionCapableModel,
        // Debug info for first message structure (without sensitive content)
        contentType: typeof messages[1].content === 'string' ? 'string' : 'array'
      });
    }
    
    // Site information for OpenRouter API
    const siteInfo = {
      url: store.siteUrl || window.location.origin,
      title: store.siteName || 'Loco Interview Assistant'
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
    } catch (apiError: unknown) {
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
 * Extract code section from unstructured text
 */
function extractCodeSection(text: string): string {
  // Try to find code blocks with markdown format
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return text; // Return the full text if no code block found
}

// End of file
