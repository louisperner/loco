import React, { useState, useContext } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, Upload, Download, Check, AlertCircle, Info } from 'lucide-react';
import { syncSettingsToFirestore, loadSettingsFromFirestore, syncSettings, syncAllLocalStorage } from '@/utils/local-storage-sync';
import { SyncContext } from '@/main';

interface UserProfileProps {
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { currentUser, signOut } = useAuthStore();
  const [syncStatus, setSyncStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | null;
  }>({ message: '', type: null });

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    if (onClose) {
      onClose();
    }
  };

  // New function to sync all localStorage items (cloud-first approach)
  const handleSyncAllStorage = async (): Promise<void> => {
    if (!currentUser) return;
    
    setSyncStatus({ message: 'Syncing all data...', type: 'info' });
    const { setSyncing } = useContext(SyncContext);

    try {
      const success = await syncAllLocalStorage(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus({ message: 'All data synced successfully', type: 'success' });
        // Clear message after 3 seconds
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      } else {
        setSyncStatus({ message: 'No data found to sync', type: 'info' });
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      }
    } catch (error) {
      console.error('Error syncing all data:', error);
      setSyncStatus({ message: 'Error syncing data', type: 'error' });
      setTimeout(() => {
        setSyncStatus({ message: '', type: null });
      }, 3000);
    }
  };

  // New function to sync settings (cloud-first approach)
  const handleSyncSettings = async (): Promise<void> => {
    if (!currentUser) return;
    
    setSyncStatus({ message: 'Syncing settings...', type: 'info' });
    const { setSyncing } = useContext(SyncContext);
    
    try {
      const success = await syncSettings(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus({ message: 'Settings synced successfully', type: 'success' });
        // Clear message after 3 seconds
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      } else {
        setSyncStatus({ message: 'No settings found', type: 'info' });
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      }
    } catch (error) {
      console.error('Error syncing settings:', error);
      setSyncStatus({ message: 'Error syncing settings', type: 'error' });
      setTimeout(() => {
        setSyncStatus({ message: '', type: null });
      }, 3000);
    }
  };

  const handleSyncToFirestore = async (): Promise<void> => {
    if (!currentUser) return;
    
    setSyncStatus({ message: 'Saving settings...', type: 'info' });
    const { setSyncing } = useContext(SyncContext);
    
    try {
      const success = await syncSettingsToFirestore(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus({ message: 'Settings saved to cloud', type: 'success' });
        // Clear message after 3 seconds
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      } else {
        setSyncStatus({ message: 'No settings to save', type: 'info' });
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      }
    } catch (error) {
      console.error('Error syncing settings:', error);
      setSyncStatus({ message: 'Error saving settings', type: 'error' });
      setTimeout(() => {
        setSyncStatus({ message: '', type: null });
      }, 3000);
    }
  };

  const handleLoadFromFirestore = async (): Promise<void> => {
    if (!currentUser) return;
    
    setSyncStatus({ message: 'Loading settings...', type: 'info' });
    const { setSyncing } = useContext(SyncContext);
    
    try {
      const success = await loadSettingsFromFirestore(currentUser.uid, setSyncing);
      
      if (success) {
        setSyncStatus({ 
          message: 'Settings loaded from cloud. Page will reload to apply changes.', 
          type: 'success' 
        });
      } else {
        setSyncStatus({ message: 'No settings found in cloud', type: 'info' });
        setTimeout(() => {
          setSyncStatus({ message: '', type: null });
        }, 3000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSyncStatus({ message: 'Error loading settings', type: 'error' });
      setTimeout(() => {
        setSyncStatus({ message: '', type: null });
      }, 3000);
    }
  };

  if (!currentUser) {
    return null;
  }

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-[#222222] text-white p-4 rounded-lg w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">User Profile</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        )}
      </div>

      <div className="flex items-center mb-6">
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt="Profile" 
            className="w-16 h-16 rounded-full mr-4"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#7d3296] flex items-center justify-center mr-4">
            <span className="text-xl font-semibold">{userInitial}</span>
          </div>
        )}
        <div>
          <p className="font-medium text-lg">{displayName}</p>
          <p className="text-gray-400 text-sm">{currentUser.email}</p>
        </div>
      </div>

      {/* Settings Sync Section */}
      <div className="mb-4 border-t border-gray-700 pt-4">
        <h3 className="text-md font-medium mb-3">Data Sync</h3>
        
        {syncStatus.message && (
          <div className={`mb-3 p-2 rounded text-sm flex items-center ${
            syncStatus.type === 'success' ? 'bg-green-900/30 text-green-400' : 
            syncStatus.type === 'error' ? 'bg-red-900/30 text-red-400' : 
            'bg-blue-900/30 text-blue-400'
          }`}>
            {syncStatus.type === 'success' && <Check className="w-4 h-4 mr-2" />}
            {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
            {syncStatus.type === 'info' && <Info className="w-4 h-4 mr-2" />}
            {syncStatus.message}
          </div>
        )}
        
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleSyncAllStorage}
            className="w-full flex items-center justify-center bg-[#7d3296] hover:bg-[#9149a8] text-white py-2 px-3 rounded transition-colors"
          >
            <Info className="w-4 h-4 mr-2" />
            Sync All Data
          </button>
        </div>
        
      </div>

      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full bg-[#7d3296] hover:bg-[#9149a8] text-white py-2 px-4 rounded transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 