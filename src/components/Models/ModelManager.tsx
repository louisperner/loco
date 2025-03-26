import React, { useState, useEffect } from 'react';
import { useModelStore } from '../../store/useModelStore';
import ModelInScene from './ModelInScene';
import { ModelDataType, ModelManagerProps, RemoveObjectEvent } from './types';

const ModelManager: React.FC<ModelManagerProps> = ({ onSelect }) => {
  const { models, updateModel } = useModelStore();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Listen for removeObject events
  useEffect(() => {
    const handleRemoveObject = (event: Event) => {
      const customEvent = event as RemoveObjectEvent;
      if (customEvent.detail && customEvent.detail.type === 'model') {
        // Update model to mark it as not in scene instead of removing it
        updateModel(customEvent.detail.id, { isInScene: false });
        if (selectedModelId === customEvent.detail.id) {
          setSelectedModelId(null);
        } 
      }
    };

    window.addEventListener('removeObject', handleRemoveObject);
    return () => window.removeEventListener('removeObject', handleRemoveObject);
  }, [updateModel, selectedModelId]);

  // Handle model selection
  const handleSelectModel = (id: string, modelData: ModelDataType): void => {
    setSelectedModelId(id === selectedModelId ? null : id);
    if (onSelect && modelData) {
      onSelect({ ...modelData, type: 'model' });
    }
  };

  // Handle model update
  const handleUpdateModel = (modelData: ModelDataType): void => {
    updateModel(modelData.id, modelData);
  };

  // Handle model removal
  const handleRemoveModel = (id: string): void => {
    // Mark as not in scene instead of removing
    updateModel(id, { isInScene: false });
    if (selectedModelId === id) {
      setSelectedModelId(null);
    }
  };

  return (
    <>
      {models.filter(model => model.isInScene !== false).map((model) => (
        <ModelInScene 
          key={model.id}
          modelData={model as ModelDataType}
          onUpdate={handleUpdateModel}
          onRemove={handleRemoveModel}
          selected={model.id === selectedModelId}
          onSelect={(id) => handleSelectModel(id, model as ModelDataType)}
        />
      ))}
    </>
  );
};

export default ModelManager; 