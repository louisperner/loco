# Ollama Integration

This integration adds Ollama AI capabilities to the Loco 3D environment, allowing you to interact with locally running AI models directly within the application.

## Features

- Connect to locally running Ollama models
- Use Ollama as an alternative to OpenRouter
- Stream responses for real-time feedback
- Configure with custom endpoint and model selection
- Save conversation history
- Automatic model detection

## How to Use

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Run Ollama locally on your machine
3. In Loco, go to Settings > Ollama
4. Enable Ollama integration and configure settings
5. Use the chat interface as usual, but now with local models

## Configuration

Before using, you'll need to:

1. Install Ollama on your machine
2. Run the Ollama service (it runs on http://localhost:11434 by default)
3. Pull models with commands like `ollama pull llama3` or `ollama pull mistral`
4. Open Loco Settings and navigate to the Ollama tab
5. Enable Ollama integration and configure your preferences

## Available Models

The integration provides access to various models including:

- Llama 3 (8B and 70B variants)
- Mistral and Mixtral
- Phi-3 (Small and Medium)
- Gemma (2B and 7B)
- CodeLlama
- And any other models you've pulled to your local Ollama installation

## Privacy and Security

Unlike cloud-based AI services, Ollama processes all prompts locally on your machine. No data is sent to external servers, providing enhanced privacy for sensitive or private information. Your conversation history is stored only in your browser's local storage.

## Troubleshooting

If you encounter issues with the Ollama integration:

1. Make sure Ollama is running (`ollama serve` command)
2. Confirm the endpoint is correct (default: http://localhost:11434)
3. Verify you've pulled the models you want to use
4. Check the console for error messages
5. Try restarting Ollama and refreshing the connection

## Requirements

- Ollama installed and running on your local machine
- Sufficient RAM for running local AI models (requirements vary by model size)
- Models pulled to your local Ollama installation 