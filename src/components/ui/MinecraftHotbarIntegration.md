# Minecraft Hotbar Integration Guide

This guide explains how to integrate the Minecraft-style hotbar into your main application.

## Basic Integration

1. Import the `MinecraftHotbar` component:

```jsx
import { MinecraftHotbar } from './components/ui/minecraft-hotbar';
```

2. Define your items with their icons and counts:

```jsx
const myItems = [
  {
    id: 'item1',
    name: 'Item 1',
    icon: '/path/to/icon1.png',
    count: 1,
  },
  {
    id: 'item2',
    name: 'Item 2',
    icon: '/path/to/icon2.png',
    count: 5,
  },
  // Add more items as needed
];
```

3. Add state to track the selected item:

```jsx
const [selectedIndex, setSelectedIndex] = useState(0);

const handleSelect = (index) => {
  setSelectedIndex(index);
  // Do something with the selected item
  console.log(`Selected: ${myItems[index]?.name}`);
};
```

4. Add the component to your layout:

```jsx
<MinecraftHotbar
  items={myItems}
  selectedIndex={selectedIndex}
  onSelect={handleSelect}
  enableKeyboardShortcuts={true}
/>
```

## Advanced Integration

### Handling Item Actions

When a user selects an item, you might want to perform different actions based on the selected item:

```jsx
const handleSelect = (index) => {
  setSelectedIndex(index);
  const selectedItem = myItems[index];
  
  if (!selectedItem) return;
  
  switch (selectedItem.id) {
    case 'sword':
      // Handle sword selection
      activateWeapon(selectedItem);
      break;
    case 'pickaxe':
      // Handle pickaxe selection
      activateTool(selectedItem);
      break;
    // Handle other items
    default:
      // Default action
      break;
  }
};
```

### Customizing Appearance

You can customize the appearance of the hotbar by passing a `className` prop:

```jsx
<MinecraftHotbar
  items={myItems}
  selectedIndex={selectedIndex}
  onSelect={handleSelect}
  className="my-custom-hotbar"
/>
```

### Disabling Keyboard Shortcuts

If you don't want to use keyboard shortcuts (1-9 keys), you can disable them:

```jsx
<MinecraftHotbar
  items={myItems}
  selectedIndex={selectedIndex}
  onSelect={handleSelect}
  enableKeyboardShortcuts={false}
/>
```

## Example: Integration with Game Controls

Here's an example of how to integrate the hotbar with game controls:

```jsx
import { useEffect, useState } from 'react';
import { MinecraftHotbar } from './components/ui/minecraft-hotbar';

function GameInterface() {
  const [items, setItems] = useState([/* your items */]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Handle item selection
  const handleSelect = (index) => {
    setSelectedIndex(index);
    // Apply the selected item's effect in the game
    applyItemEffect(items[index]);
  };
  
  // Example of how to update items dynamically
  const addItemToHotbar = (newItem) => {
    // Find an empty slot or replace an existing item
    const emptySlotIndex = items.findIndex(item => !item.id || item.id.startsWith('empty-'));
    
    if (emptySlotIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[emptySlotIndex] = newItem;
      setItems(updatedItems);
    }
  };
  
  return (
    <div className="game-interface">
      {/* Game content */}
      <div className="game-world">
        {/* Your game world rendering */}
      </div>
      
      {/* Hotbar at the bottom */}
      <MinecraftHotbar
        items={items}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
      />
    </div>
  );
}
```

## Troubleshooting

- **Icons not showing**: Make sure the paths to your icons are correct and the images are accessible.
- **Keyboard shortcuts not working**: Ensure `enableKeyboardShortcuts` is set to `true` and check if other keyboard event listeners might be interfering.
- **Styling issues**: The component uses Tailwind CSS. Make sure your Tailwind configuration includes the necessary colors and utilities. 