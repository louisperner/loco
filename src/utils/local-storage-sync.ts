import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { SETTINGS_STORAGE_KEY } from '@/components/Settings/utils';
import { LocoSettings } from '@/components/Settings/types';

// Position storage key
export const POSITION_STORAGE_KEY = 'loco-position';

// Type for the sync callback
type SyncCallback = (syncing: boolean) => void;

// /**
//  * Check if a localStorage key should be excluded from syncing
//  * @param key The localStorage key to check
//  * @returns True if the key should be excluded, false otherwise
//  */
// export const shouldExcludeFromSync = (key: string): boolean => {
//   // Exclude Firebase zombie keys
//   if (key.startsWith('firestore_zombie_')) {
//     return true;
//   }
  
//   // Add other exclusions if needed in the future
//   return false;
// };

/**
 * Save position data to localStorage
 * @param position The position object to save
 */
export const savePosition = (position: { x: number; y: number; z: number }): void => {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    console.error('Error saving position:', error);
  }
};

/**
 * Load position data from localStorage
 * @returns The position object or null if not found
 */
export const loadPosition = (): { x: number; y: number; z: number } | null => {
  try {
    const savedPosition = localStorage.getItem(POSITION_STORAGE_KEY);
    return savedPosition ? JSON.parse(savedPosition) : null;
  } catch (error) {
    console.error('Error loading position:', error);
    return null;
  }
};

/**
 * Save all localStorage data to Firestore before page unload
 * This function is specifically designed to be quick for beforeunload events
 * @param userId The current user's ID
 */
export const saveDataBeforeUnload = async (userId: string): Promise<void> => {
  if (!userId) {
    // console.log('No user ID provided for beforeunload sync');
    return;
  }

  try {
    // Collect only essential localStorage items quickly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quickSyncItems: Record<string, any> = {};
    
    // Only sync position data on page close to ensure it's quick
    const positionData = localStorage.getItem(POSITION_STORAGE_KEY);
    
    if (positionData) {
      try {
        quickSyncItems[POSITION_STORAGE_KEY] = JSON.parse(positionData);
      } catch (e) {
        // Continue even if parsing fails
      }
    }

    // Skip if no position data
    if (!quickSyncItems[POSITION_STORAGE_KEY]) {
      return;
    }

    // Using the synchronous navigator.sendBeacon API to ensure data gets sent
    // This is the most reliable way to send data during page unload
    if (navigator.sendBeacon) {
      const body = JSON.stringify({
        userId,
        path: `users/${userId}`,
        data: { position: quickSyncItems[POSITION_STORAGE_KEY] },
        timestamp: new Date().toISOString()
      });
      
      // Send to a dedicated endpoint that will handle the update
      // This is more reliable than a direct Firestore update during unload
      const beaconUrl = `https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
      
      navigator.sendBeacon(beaconUrl, body);
      // console.log('Position data sent via beacon API');
    } else {
      // Fallback to a quick fetch with keepalive
      fetch(`https://firestore.googleapis.com/v1/projects/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            position: {
              mapValue: {
                fields: {
                  x: { doubleValue: quickSyncItems[POSITION_STORAGE_KEY].x },
                  y: { doubleValue: quickSyncItems[POSITION_STORAGE_KEY].y },
                  z: { doubleValue: quickSyncItems[POSITION_STORAGE_KEY].z }
                }
              }
            }
          }
        }),
        keepalive: true
      }).catch(() => {
        // Silently ignore errors during page close
      });
    }
  } catch (error) {
    // Silent fail - we don't want to prevent page unload
  }
};

/**
 * Initialize the beforeunload event listener to save data when the page closes
 * @param userId The current user's ID
 * @returns Function to remove the event listener
 */
export const initBeforeUnloadSync = (userId: string): () => void => {
  if (!userId) return () => {};

  const handleBeforeUnload = () => {
    try {
      // Only store position data which is critical
      const positionData = localStorage.getItem(POSITION_STORAGE_KEY);
      if (positionData) {
        // Store the last position we had in localStorage
        // console.log('Position data saved locally before unload');
      }
    } catch (error) {
      // Silent fail to avoid blocking page close
    }
  };

  // Use capture to ensure our handler runs early
  window.addEventListener('beforeunload', handleBeforeUnload, { capture: true });
  
  // Return function to remove the event listener
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload, { capture: true });
  };
};

/**
 * Main function to sync all localStorage items with Firestore
 * @param userId The current user's ID
 * @param onSyncChange Optional callback to indicate syncing status
 * @returns Promise resolving to boolean indicating success
 */
export const syncAllLocalStorage = async (
  userId: string, 
  onSyncChange?: SyncCallback
): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot sync local storage: No user ID provided');
    return false;
  }

  try {
    onSyncChange?.(true);
    
    // First try to get all items from Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    // Get all localStorage keys
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localStorageItems: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cloudItems: Record<string, any> = userDoc.exists() ? userDoc.data().localStorage || {} : {};
    // @ts-ignore
    let updated = false;

    // First load any cloud items that don't exist locally
    if (userDoc.exists() && cloudItems) {
      for (const key in cloudItems) {
        try {
          // Only overwrite if item doesn't exist locally
          if (localStorage.getItem(key) === null) {
            localStorage.setItem(key, JSON.stringify(cloudItems[key]));
            updated = true;
          }
        } catch (error) {
          console.error(`Error setting localStorage item ${key}:`, error);
        }
      }
    }

    // Then collect all local items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {

        // if(key.startsWith('firestore_zombie_')) {
        //   continue;
        // }

        try {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              // Try to parse as JSON, but if it fails, store as string
              localStorageItems[key] = JSON.parse(value);
            } catch (e) {
              localStorageItems[key] = value;
            }
          }
        } catch (error) {
          console.error(`Error reading localStorage item ${key}:`, error);
        }
      }
    }

    // Sync local items to cloud if they're different or missing
    if (Object.keys(localStorageItems).length > 0) {
      let needsUpdate = false;
      
      // Check if any items are different from cloud
      for (const key in localStorageItems) {
        if (!cloudItems[key] || JSON.stringify(cloudItems[key]) !== JSON.stringify(localStorageItems[key])) {
          needsUpdate = true;
          break;
        }
      }
      
      if (needsUpdate) {
        // Update the user document with all localStorage items
        const updateData = userDoc.exists() 
          ? { ...userDoc.data(), localStorage: localStorageItems } 
          : { localStorage: localStorageItems };
          
        await setDoc(userDocRef, updateData, { merge: true });
        // console.log('All localStorage items synced to Firestore');
      } else {
        // console.log('No changes needed, localStorage and cloud are in sync');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error synchronizing localStorage:', error);
    return false;
  } finally {
    onSyncChange?.(false);
  }
};

/**
 * Sync specific settings from localStorage to Firestore for the current user
 * @param userId The current user's ID
 * @param onSyncChange Optional callback to indicate syncing status
 * @returns Promise resolving to boolean indicating success
 */
export const syncSettings = async (
  userId: string,
  onSyncChange?: SyncCallback
): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot sync settings: No user ID provided');
    return false;
  }

  try {
    onSyncChange?.(true);
    
    // First try to get settings from Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    // If settings exist in Firestore, load them to localStorage
    if (userDoc.exists() && userDoc.data().settings) {
      // console.log('Found settings in Firestore, loading to localStorage');
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userDoc.data().settings));
      // console.log('Settings loaded from Firestore to localStorage', userDoc.data().settings);
      return true;
    }
    
    // If no settings in Firestore, check localStorage
    const settingsJSON = localStorage.getItem(SETTINGS_STORAGE_KEY);
    
    if (!settingsJSON) {
      // console.log('No settings found in either Firestore or localStorage');
      return false;
    }
    
    // If settings exist in localStorage but not in Firestore, sync them to Firestore
    // console.log('Local settings found, syncing to Firestore');
    const localSettings = JSON.parse(settingsJSON) as LocoSettings;
    
    if (!localSettings) {
      console.warn('Failed to parse settings from localStorage');
      return false;
    }

    // Update the user document with settings
    await setDoc(userDocRef, { settings: localSettings }, { merge: true });
    
    // console.log('Settings successfully synced to Firestore', localSettings);
    return true;
  } catch (error) {
    console.error('Error synchronizing settings:', error);
    return false;
  } finally {
    onSyncChange?.(false);
  }
};

/**
 * Sync settings from localStorage to Firestore for the current user
 * @param userId The current user's ID
 * @param onSyncChange Optional callback to indicate syncing status
 * @returns Promise resolving to boolean indicating success
 */
export const syncSettingsToFirestore = async (
  userId: string,
  onSyncChange?: SyncCallback
): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot sync settings: No user ID provided');
    return false;
  }

  try {
    onSyncChange?.(true);
    
    // Get settings from localStorage
    const settingsJSON = localStorage.getItem(SETTINGS_STORAGE_KEY);
    
    if (!settingsJSON) {
      console.warn('No settings found in localStorage to sync');
      return false;
    }
    
    // Parse settings directly from localStorage to avoid any potential issues with loadSettings()
    const localSettings = JSON.parse(settingsJSON) as LocoSettings;
    
    if (!localSettings) {
      console.warn('Failed to parse settings from localStorage');
      return false;
    }

    // Get existing user doc to avoid overwriting other data
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    // Prepare update data while preserving existing fields
    const updateData = userDoc.exists() 
      ? { ...userDoc.data(), settings: localSettings } 
      : { settings: localSettings };

    // Update the user document with settings
    await setDoc(userDocRef, updateData, { merge: true });
    
    // console.log('Settings successfully synced to Firestore', localSettings);
    return true;
  } catch (error) {
    console.error('Error syncing settings to Firestore:', error);
    return false;
  } finally {
    onSyncChange?.(false);
  }
};

/**
 * Load settings from Firestore and save to localStorage
 * @param userId The current user's ID
 * @param onSyncChange Optional callback to indicate syncing status
 * @returns Promise resolving to boolean indicating success
 */
export const loadSettingsFromFirestore = async (
  userId: string,
  onSyncChange?: SyncCallback
): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot load settings: No user ID provided');
    return false;
  }

  try {
    onSyncChange?.(true);
    
    // Get user document from Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.warn('User document not found in Firestore');
      return false;
    }

    const userData = userDoc.data();
    
    // Check if settings exist in the user document
    if (!userData.settings) {
      console.warn('No settings found in Firestore user document');
      return false;
    }

    // Save Firestore settings to localStorage
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userData.settings));
    // console.log('Settings loaded from Firestore to localStorage', userData.settings);
    
    // Force reload the page to apply settings immediately
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Error loading settings from Firestore:', error);
    return false;
  } finally {
    // Since we're reloading the page, this won't actually run,
    // but we include it for completeness
    onSyncChange?.(false);
  }
};

// For backward compatibility
export * from './settings-sync'; 