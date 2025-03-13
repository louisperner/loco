import React, { useState } from 'react';
import { useModelStore } from '../../store/useModelStore';
import ModelInScene from './ModelInScene';

function ModelManager() {
  const { models, updateModel, removeModel } = useModelStore();
  const [selectedModelId, setSelectedModelId] = useState(null);

  // Handle model selection
  const handleSelectModel = (id) => {
    setSelectedModelId(id === selectedModelId ? null : id);
  };

  // Handle model update
  const handleUpdateModel = (modelData) => {
    updateModel(modelData.id, modelData);
  };

  // Handle model removal
  const handleRemoveModel = (id) => {
    removeModel(id);
    if (selectedModelId === id) {
      setSelectedModelId(null);
    }
  };

  return (
    <>
      {models.map((model) => (
        <ModelInScene 
          key={model.id}
          modelData={model}
          onUpdate={handleUpdateModel}
          onRemove={handleRemoveModel}
          selected={model.id === selectedModelId}
          onSelect={handleSelectModel}
        />
      ))}
    </>
  );
}

export default ModelManager; 