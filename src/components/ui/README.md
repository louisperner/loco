# Minecraft-Style Hotbar Component

A React component that replicates the Minecraft hotbar/inventory selector UI for your application.

![Minecraft Hotbar Example](https://i.imgur.com/example.png)

## Features

- Displays a 9-slot hotbar similar to Minecraft
- Supports item icons and item counts
- Keyboard shortcuts (1-9 keys) for quick selection
- Customizable appearance
- Fully responsive
- Built with Tailwind CSS
- Can be integrated with canvas-based games

## Usage

### Basic Example

```jsx
import { MinecraftHotbar } from './components/ui/minecraft-hotbar';
import { useState } from 'react';

function MyApp() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = [
    { id: 'item1', name: 'Item 1', icon: '/path/to/icon.png', count: 1 },
    { id: 'item2', name: 'Item 2', icon: '/path/to/icon2.png', count: 5 },
    // Add more items as needed
  ];

  return (
    <div>
      {/* Your app content */}
      
      <MinecraftHotbar
        items={items}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />
    </div>
  );
}
```

### Canvas Integration

For canvas-based games or applications, you can use the `position="absolute"` prop to position the hotbar relative to your canvas container:

```jsx
import { MinecraftHotbar } from './components/ui/minecraft-hotbar';
import { useState, useRef } from 'react';

function CanvasGame() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);
  
  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Your canvas element */}
      <canvas className="w-full h-full" />
      
      {/* Hotbar positioned at the bottom of the canvas */}
      <MinecraftHotbar
        items={items}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        position="absolute"
        containerRef={containerRef}
      />
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `HotbarItem[]` | `[]` | Array of items to display in the hotbar |
| `selectedIndex` | `number` | `0` | Index of the currently selected item |
| `onSelect` | `(index: number) => void` | Required | Callback when an item is selected |
| `className` | `string` | `undefined` | Additional CSS classes to apply to the component |
| `enableKeyboardShortcuts` | `boolean` | `true` | Whether to enable keyboard shortcuts (1-9 keys) |
| `position` | `'fixed' \| 'absolute'` | `'fixed'` | Positioning strategy for the hotbar |
| `containerRef` | `React.RefObject<HTMLElement>` | `undefined` | Reference to the container element (useful for canvas integration) |

### HotbarItem Interface

```typescript
interface HotbarItem {
  id: string;       // Unique identifier for the item
  name: string;     // Display name of the item
  icon: string;     // URL or path to the item's icon
  count?: number;   // Optional count to display on the item
}
```

## Demo

To see the component in action, you can run the demos:

1. Start your development server
2. Navigate to `/?demo=minecraft-hotbar` for the basic demo
3. Navigate to `/?demo=minecraft-hotbar-canvas` for the canvas integration demo

Alternatively, you can click the demo buttons that appear in the bottom-right corner of the main application.

## Customization

### Styling

The component uses Tailwind CSS for styling. You can customize the appearance by passing a `className` prop or by modifying the component's source code.

### Keyboard Shortcuts

By default, the component enables keyboard shortcuts (1-9 keys) for selecting items. You can disable this feature by setting `enableKeyboardShortcuts={false}`.

## Integration

For detailed integration instructions, see [MinecraftHotbarIntegration.md](./MinecraftHotbarIntegration.md). 