# Merged Spotlight Component

This component combines the functionality of MacOSSpotlight and OpenRouterSpotlight into a single, unified interface with dual modes.

## Features

- **Dual-Mode Interface**: Switch between standard commands and AI assistant
- **Unified Keyboard Shortcuts**: Easy access to both modes with intuitive shortcuts
- **Context-Aware Commands**: Access 3D objects, media, and AI assistance in one interface
- **Modern UI**: Clean, backdrop-filtered design matching the Loco aesthetic
- **History System**: Quick access to recent AI conversations

## Keyboard Shortcuts

- **`F` key**: Open standard spotlight for commands (add cube, image, etc.)
- **`/` key**: Open AI assistant mode (OpenRouter)
- **Middle Mouse Button**: Alternative way to open standard spotlight
- **Alt + Click**: Alternative way to open AI assistant mode
- **`Esc`**: Close spotlight

## Standard Mode Features

- Add 3D primitives (cube, sphere, plane)
- Insert media (images, videos)
- Import 3D models
- Add code blocks
- Access drawing mode
- Switch to AI mode

## AI Assistant Mode (OpenRouter)

- Ask questions and get AI responses
- History of recent conversations
- Configure OpenRouter settings via the settings panel
- Select from multiple AI models

## Using the Component

```tsx
import MergedSpotlight from './components/ui/MergedSpotlight';

// In your component:
<MergedSpotlight onSearch={(query) => handleSearchQuery(query)} />
```

## Configuration

The AI assistant mode requires:

1. An OpenRouter API key (set in Settings panel)
2. Selection of preferred AI model (default: GPT-4o)

These settings are persisted using the OpenRouterStore.

## Switching Between Modes

When in standard mode, you can:
1. Type "ai" to switch to AI assistant mode
2. Press the `/` key to reopen in AI mode

When in AI mode:
- Simply query the AI by typing your question and pressing Enter
- View response directly in the interface

## Technical Notes

- Uses Zustand for state management
- Connects to the OpenRouter API for AI functionality
- Integrates with Loco's existing store system
- Uses React hooks for keyboard and mouse interactions 