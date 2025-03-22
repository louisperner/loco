import React, { useState, useEffect } from 'react';
import { useModelStore } from '../../store/useModelStore';
import ModelInScene from './ModelInScene';

function ModelManager({ onSelect }) {
  const { models, updateModel, removeModel } = useModelStore();
  const [selectedModelId, setSelectedModelId] = useState(null);

  // Listen for removeObject events
  useEffect(() => {
    const handleRemoveObject = (event) => {
      if (event.detail.type === 'model') {
        removeModel(event.detail.id);
        if (selectedModelId === event.detail.id) {
          setSelectedModelId(null);
        }
      }
    };

    window.addEventListener('removeObject', handleRemoveObject);
    return () => window.removeEventListener('removeObject', handleRemoveObject);
  }, [removeModel, selectedModelId]);

  // Handle model selection
  const handleSelectModel = (id, modelData) => {
    setSelectedModelId(id === selectedModelId ? null : id);
    if (onSelect && modelData) {
      onSelect({ ...modelData, type: 'model' });
    }
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
          onRemove={() => handleRemoveModel(model.id)}
          selected={model.id === selectedModelId}
          onSelect={(id) => handleSelectModel(id, model)}
        />
      ))}
    </>
  );
}

export default ModelManager; 