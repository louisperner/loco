import React, { useState, useRef, useEffect } from 'react';
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

export function MinecraftHotbarCanvasDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [items, setItems] = useState<HotbarItem[]>(SAMPLE_ITEMS);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    console.log(`Selected item: ${items[index]?.name || 'Empty slot'}`);
  };

  // Simple canvas animation to simulate a game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      if (canvas && containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simple animation
    let animationFrameId: number;
    let x = 50;
    let y = 50;
    let dx = 2;
    let dy = 2;

    const render = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background (grass-like)
      ctx.fillStyle = '#5c9c5c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines (like Minecraft blocks)
      ctx.strokeStyle = '#4a8c4a';
      ctx.lineWidth = 1;
      const gridSize = 32;
      
      for (let i = 0; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      
      for (let i = 0; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw the selected item as a cursor
      const selectedItem = items[selectedIndex];
      if (selectedItem && selectedItem.icon) {
        // Draw a square representing the selected item
        ctx.fillStyle = selectedIndex === 0 ? '#3BACF0' : // sword
                        selectedIndex === 1 ? '#C0C0C0' : // pickaxe
                        selectedIndex === 2 ? '#808080' : // axe
                        selectedIndex === 3 ? '#A0522D' : // shovel
                        selectedIndex === 4 ? '#8B4513' : // dirt
                        selectedIndex === 5 ? '#FFA500' : // torch
                        '#FFFFFF';
        
        ctx.fillRect(x, y, 32, 32);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 32, 32);
        
        // Draw item name
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(selectedItem.name, x, y - 5);
      }

      // Move the square
      x += dx;
      y += dy;
      
      // Bounce off walls
      if (x <= 0 || x >= canvas.width - 32) dx = -dx;
      if (y <= 0 || y >= canvas.height - 32) dy = -dy;

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [selectedIndex, items]);

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      {/* Canvas that represents your game world */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      
      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-4 rounded-md text-white">
        <h2 className="text-xl font-bold mb-2">Minecraft Hotbar with Canvas</h2>
        <p>Currently selected: {items[selectedIndex]?.name || 'Empty slot'}</p>
        <p className="mt-2 text-gray-300">Press keys 1-9 to select items</p>
      </div>

      {/* The hotbar positioned at the bottom of the canvas */}
      <MinecraftHotbar
        items={items}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        enableKeyboardShortcuts={true}
        position="absolute" // Use absolute positioning for canvas
        containerRef={containerRef}
      />
    </div>
  );
} 