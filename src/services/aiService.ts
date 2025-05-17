import { Solution } from '../store/interviewAssistantStore';
import { useOpenRouterStore } from '../store/useOpenRouterStore';
import { useOllamaStore } from '../store/useOllamaStore';
import { OPENROUTER_MODELS } from '../lib/openrouter-constants';
import { openRouterApi, MessageContent } from '../lib/openrouter';
import { ollamaApi } from '../lib/ollama';
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
    let messages: { role: string; content: MessageContent }[] = [
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
    
    // Check if we can connect to Ollama
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${endpoint}/api/version`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Ollama server responded with status: ${response.status}`);
      }
      
      // Try to parse the response
      const data = await response.json();
      if (!data || !data.version) {
        throw new Error("Invalid response from Ollama server (missing version info)");
      }
      
      logger.log("Connected to Ollama. Version:", data.version);
      
    } catch (error: unknown) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Unknown error connecting to Ollama';
        
      logger.error('Ollama connection error:', errorMsg);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          code: `// Error: Connection to Ollama timed out\n// Please make sure Ollama is running at ${endpoint}`,
          explanation: `Connection to Ollama timed out. Please make sure Ollama is running at ${endpoint}`,
          complexity: {
            time: 'N/A',
            space: 'N/A'
          }
        };
      }
      
      return {
        code: `// Error: Could not connect to Ollama\n// Please make sure Ollama is running at ${endpoint}\n// ${errorMsg}`,
        explanation: `Could not connect to Ollama. Please make sure Ollama is running at ${endpoint}`,
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
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: problemText }
    ];
    
    // Prepare the request payload
    const requestPayload = {
      model: selectedModel,
      messages,
      options: {
        temperature: 0.7 // Moderate creativity
      }
    };
    
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
      
      // First check if the entire content is valid JSON
      let parsedResponse = null;
      
      // Try with multiple approaches to extract valid JSON
      try {
        // Direct parsing of the entire content
        parsedResponse = JSON.parse(content);
        logger.log('Successfully parsed full content as JSON');
      } catch (fullContentError) {
        // Content is not directly parseable as JSON
        logger.log('Full content parsing failed, trying JSON extraction');
        
        // Try to extract JSON from the content using regex patterns
        const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}))*\}/g;
        const jsonMatches = content.match(jsonRegex);
        
        if (jsonMatches && jsonMatches.length > 0) {
          // Try each match until we find a valid one
          for (const jsonStr of jsonMatches) {
            try {
              const parsed = JSON.parse(jsonStr);
              
              // Check if this has the expected properties
              if (parsed.code !== undefined || parsed.explanation !== undefined) {
                parsedResponse = parsed;
                logger.log('Found valid JSON object in content');
                break;
              }
            } catch (err) {
              // Continue to next match
            }
          }
        }
        
        if (!parsedResponse) {
          // Try to extract individual fields with regex if all JSON parsing fails
          logger.log('JSON extraction failed, trying regex field extraction');
          
          const codeMatch = content.match(/"code"\s*:\s*"([^"]*)"/);
          const explanationMatch = content.match(/"explanation"\s*:\s*"([^"]*)"/);
          const timeMatch = content.match(/"timeComplexity"\s*:\s*"([^"]*)"/);
          const spaceMatch = content.match(/"spaceComplexity"\s*:\s*"([^"]*)"/);
          
          if (codeMatch || explanationMatch) {
            parsedResponse = {
              code: codeMatch ? codeMatch[1] : extractCodeSection(content) || 'No code extracted',
              explanation: explanationMatch ? explanationMatch[1] : 'No explanation extracted',
              timeComplexity: timeMatch ? timeMatch[1] : 'Unknown',
              spaceComplexity: spaceMatch ? spaceMatch[1] : 'Unknown'
            };
            logger.log('Created response object from regex extraction');
          } else {
            // Last resort: extract code and use the content as explanation
            const extractedCode = extractCodeSection(content);
            if (extractedCode) {
              parsedResponse = {
                code: extractedCode,
                explanation: 'Extracted from AI response',
                timeComplexity: 'Unknown',
                spaceComplexity: 'Unknown'
              };
              logger.log('Created response from code extraction');
            }
          }
        }
      }
      
      if (parsedResponse) {
        return {
          code: parsedResponse.code || 'Error: No code was generated',
          explanation: parsedResponse.explanation || 'No explanation provided',
          complexity: {
            time: parsedResponse.timeComplexity || parsedResponse.time_complexity || 'Unknown',
            space: parsedResponse.spaceComplexity || parsedResponse.space_complexity || 'Unknown'
          }
        };
      }
      
      // If all parsing attempts fail, return the raw content with an error message
      return {
        code: content || 'Error: Could not parse the response',
        explanation: 'The AI generated a response that could not be parsed. Using the raw response.',
        complexity: {
          time: 'Unknown',
          space: 'Unknown'
        }
      };
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
