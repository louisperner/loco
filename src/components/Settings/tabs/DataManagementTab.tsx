import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FaTrash, FaExclamationTriangle, FaSync } from 'react-icons/fa';

interface DataManagementTabProps {
  onCleanAllFiles?: () => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function DataManagementTab({ onCleanAllFiles }: DataManagementTabProps) {
  const [isConfirmingClean, setIsConfirmingClean] = useState(false);
  const [cleaningStatus, setCleaningStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showReload, setShowReload] = useState(false);

  const handleCleanAllFiles = async () => {
    try {
      setIsLoading(true);
      setCleaningStatus('Cleaning all files...');
      setShowReload(false);
      
      let result;
      
      // Use the provided onCleanAllFiles prop if available
      if (onCleanAllFiles) {
        result = await onCleanAllFiles();
      } else {
        // Fallback to direct electron API call
        // Check if we have access to the electron API
        // @ts-ignore
        if (!window.electron || typeof window.electron.cleanAllFiles !== 'function') {
          console.error('Electron API or cleanAllFiles function not available');
          throw new Error('Clean files function not available');
        }
        // @ts-ignore
        result = await window.electron.cleanAllFiles();
      }
      
      if (result.success) {
        setCleaningStatus(result.message || 'Files cleaned successfully');
        // Clear localStorage for inventory items
        localStorage.removeItem('loco-hotbar-items');
        
        // Show reload button
        setShowReload(true);
        
        // Show success message for 10 seconds (longer to give time to reload)
        setTimeout(() => {
          if (!showReload) { // Only clear if user hasn't clicked reload
            setCleaningStatus(null);
            setIsConfirmingClean(false);
          }
        }, 10000);
      } else {
        console.error('Error from cleanAllFiles:', result.error);
        setCleaningStatus(`Error: ${result.error || 'Unknown error'}`);
        // Hide error message after 5 seconds
        setTimeout(() => {
          setCleaningStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Exception in handleCleanAllFiles:', error);
      setCleaningStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Hide error message after 5 seconds
      setTimeout(() => {
        setCleaningStatus(null);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    // Reload the page to refresh the inventory
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">Data Management</h3>
        <p className="text-sm text-white/70">
          Manage your local data and storage
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-white">Clean All Files</h4>
              <p className="text-xs text-white/70 mt-1">
                Delete all images and models from your inventory and disk storage. This action cannot be undone.
              </p>
            </div>
            
            {!isConfirmingClean ? (
              <Button 
                variant="destructive" 
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => setIsConfirmingClean(true)}
              >
                <FaTrash size={12} />
                Clean All
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsConfirmingClean(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex items-center gap-1.5"
                    onClick={handleCleanAllFiles}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="animate-spin mr-1">⟳</span>
                    ) : (
                      <FaExclamationTriangle size={12} />
                    )}
                    Confirm Delete
                  </Button>
                </div>
                {cleaningStatus && (
                  <div className="flex flex-col items-end gap-2">
                    <p className={`text-xs ${cleaningStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                      {cleaningStatus}
                    </p>
                    {showReload && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1.5 text-green-400 border-green-400/30 hover:bg-green-400/10"
                        onClick={handleReload}
                      >
                        <FaSync size={12} />
                        Reload to see changes
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 