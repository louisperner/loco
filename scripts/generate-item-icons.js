const fs = require('fs');
const path = require('path');

// Create the items directory if it doesn't exist
const itemsDir = path.join(__dirname, '../public/items');
if (!fs.existsSync(itemsDir)) {
  fs.mkdirSync(itemsDir, { recursive: true });
}

// Define the items we want to create
const items = [
  { name: 'diamond_sword', color: '#3BACF0' },
  { name: 'iron_pickaxe', color: '#C0C0C0' },
  { name: 'stone_axe', color: '#808080' },
  { name: 'wooden_shovel', color: '#A0522D' },
  { name: 'dirt', color: '#8B4513' },
  { name: 'torch', color: '#FFA500' },
];

// Generate a simple SVG for each item
items.forEach(item => {
  const svgContent = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" fill="${item.color}" />
    <text x="16" y="20" font-family="Arial" font-size="8" text-anchor="middle" fill="white">${item.name}</text>
  </svg>`;
  
  fs.writeFileSync(path.join(itemsDir, `${item.name}.svg`), svgContent);
  console.log(`Created ${item.name}.svg`);
});

console.log('All item icons generated successfully!'); 