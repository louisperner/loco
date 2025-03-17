import React from 'react';

const InventoryTabs = ({
  categories,
  activeTab,
  onTabChange
}) => {
  return (
    <div className="inventory-tabs">
      {categories.map(category => (
        <button 
          key={category}
          className={`inventory-tab ${activeTab === category ? 'active' : ''}`}
          onClick={() => onTabChange(category)}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default InventoryTabs; 