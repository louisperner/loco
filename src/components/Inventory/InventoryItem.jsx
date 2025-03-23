import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const InventoryItem = ({
  item,
  isSelected,
  isInHotbar,
  isAddingToHotbar,
  selectedHotbarSlot,
  handleItemSelect,
  handleAddToHotbar,
  handleDragStart,
  handleDragEnd
}) => {
  return (
    <div
      className={`group relative bg-black/40 rounded-lg cursor-pointer hover:bg-black/80 transition-all border-2 ${
        isSelected ? 'border-blue-500' : 'border-white/10'
      } ${isInHotbar ? 'ring-2 ring-yellow-400/50' : ''} w-[120px] h-[120px]`}
      onClick={() => handleItemSelect(item)}
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
    >
      {/* Square image container */}
      <div className="w-full h-[calc(100%-40px)] relative overflow-hidden rounded-t">
        {item.type === 'image' ? (
          <img 
            src={item.thumbnailUrl || item.url} 
            alt={item.fileName} 
            className="w-full h-full object-cover absolute inset-0"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 text-white/80">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 8.42-7 9.88-3.87-1.45-7-5.2-7-9.88V6.3l7-3.12z"/>
                <path d="M12 6.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação com posicionamento absoluto */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToHotbar(item, e);
          }}
          className="p-1 bg-green-600/80 hover:bg-green-500 rounded-md backdrop-blur-sm"
          title="Adicionar à hotbar"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Implementar lógica de exclusão
          }}
          className="p-1 bg-red-600/80 hover:bg-red-500 rounded-md backdrop-blur-sm"
          title="Remover item"
        >
          <Trash2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Nome do item */}
      <div className="absolute bottom-0 left-0 right-0 h-[40px] p-2 text-sm text-center text-white/90 truncate">
        {item.fileName}
      </div>
    </div>
  );
};

export default InventoryItem; 