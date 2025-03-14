import React, { useState } from 'react';
import { MinecraftHotbar, HotbarItem } from './minecraft-hotbar';

// Sample items using our generated SVG icons
const SAMPLE_ITEMS: HotbarItem[] = [
  {
    id: 'sword',
    name: 'Diamond Sword',
    icon: '/items/diamond_sword.svg',
    count: 1,
  },
  {
    id: 'pickaxe',
    name: 'Iron Pickaxe',
    icon: '/items/iron_pickaxe.svg',
    count: 1,
  },
  {
    id: 'axe',
    name: 'Stone Axe',
    icon: '/items/stone_axe.svg',
    count: 1,
  },
  {
    id: 'shovel',
    name: 'Wooden Shovel',
    icon: '/items/wooden_shovel.svg',
    count: 1,
  },
  {
    id: 'dirt',
    name: 'Dirt Block',
    icon: '/items/dirt.svg',
    count: 64,
  },
  {
    id: 'torch',
    name: 'Torch',
    icon: '/items/torch.svg',
    count: 32,
  },
];

export function MinecraftHotbarDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<HotbarItem[]>(SAMPLE_ITEMS);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    console.log(`Selected item: ${items[index]?.name || 'Empty slot'}`);
  };

  return (
    <div className="relative w-full h-full bg-gray-800 text-white">
      {/* Your main app content goes here */}
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Minecraft Hotbar Demo</h1>
        <p>Currently selected: {items[selectedIndex]?.name || 'Empty slot'}</p>
        <p className="mt-2 text-gray-300">Press keys 1-9 to select items in the hotbar</p>
        
        <div className="mt-8 p-4 bg-gray-700 rounded-md">
          <h2 className="text-xl font-bold mb-2">Instructions</h2>
          <ul className="list-disc pl-5">
            <li>Click on any slot in the hotbar to select it</li>
            <li>Press keys 1-9 to quickly select items</li>
            <li>The currently selected item is highlighted with a white border</li>
          </ul>
        </div>
      </div>

      {/* The hotbar will be positioned at the bottom of the screen */}
      <MinecraftHotbar
        items={items}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        enableKeyboardShortcuts={true}
      />
    </div>
  );
} 