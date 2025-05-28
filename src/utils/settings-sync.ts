import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { SETTINGS_STORAGE_KEY } from '@/components/Settings/utils';
import { LocoSettings } from '@/components/Settings/types';

/**
 * Main function to sync all localStorage items with Firestore
 * 1. Try to get all items from Firestore first
 * 2. If not available, use localStorage items and sync them to Firestore
 * @param userId The current user's ID
 * @returns Promise resolving to boolean indicating success
 */
export const syncAllLocalStorage = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot sync local storage: No user ID provided');
    return false;
  }

  try {
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
            // console.log(`Loaded ${key} from cloud storage`);
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
  }
};

/**
 * Sync specific settings from localStorage to Firestore for the current user
 * @param userId The current user's ID
 * @returns Promise resolving to boolean indicating success
 */
export const syncSettings = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot sync settings: No user ID provided');
    return false;
  }

  try {
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
  }
};

/**
 * Sync settings from localStorage to Firestore for the current user
 * @param userId The current user's ID
 * @returns Promise resolving to boolean indicating success
 */
export const syncSettingsToFirestore = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot sync settings: No user ID provided');
    return false;
  }

  try {
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
  }
};

/**
 * Load settings from Firestore and save to localStorage
 * @param userId The current user's ID
 * @returns Promise resolving to boolean indicating success
 */
export const loadSettingsFromFirestore = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('Cannot load settings: No user ID provided');
    return false;
  }

  try {
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
  }
}; 