import { create } from 'zustand';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, createUserDocument, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { syncSettings, syncAllLocalStorage } from '../utils/local-storage-sync';
import { SETTINGS_STORAGE_KEY } from '@/components/Settings/utils';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  authModalOpen: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void; // returns unsubscribe function
  toggleAuthModal: (isOpen?: boolean) => void;
}

// Helper function to handle user document creation with retries
const createUserDocumentWithRetry = async (userId: string, userData: Record<string, any>, maxRetries = 3) => {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      return await createUserDocument(userId, userData);
    } catch (error) {
      retries++;
      console.warn(`Error creating user document, retry ${retries}/${maxRetries}:`, error);

      if (retries === maxRetries) {
        console.error('Max retries reached for user document creation');
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  loading: false,
  error: null,
  authModalOpen: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Tentando fazer login com email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login bem-sucedido:', userCredential.user.uid);

      // Update the last login time in Firestore
      await createUserDocument(userCredential.user.uid, {
        lastLogin: new Date().toISOString(),
      });

      // Sync all localStorage items using cloud-first approach
      await syncAllLocalStorage(userCredential.user.uid);

      set({ authModalOpen: false });
    } catch (err) {
      console.error('Erro no login:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null });
    try {
      // Create the user account with Firebase Auth
      console.log('Tentando criar conta com email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Conta criada com sucesso:', userCredential.user.uid);

      // Create a document in Firestore with user's ID and data
      await createUserDocument(userCredential.user.uid, {
        email: userCredential.user.email,
        name: name,
        lastLogin: new Date().toISOString(),
      });

      // Sync all localStorage items using cloud-first approach
      await syncAllLocalStorage(userCredential.user.uid);

      set({ authModalOpen: false });
    } catch (err) {
      console.error('Erro no cadastro:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Tentando fazer login com Google');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Login com Google bem-sucedido:', result.user.uid);

      await createUserDocument(result.user.uid, {
        email: result.user.email,
        name: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        lastLogin: new Date().toISOString(),
      });

      // Sync all localStorage items using cloud-first approach
      await syncAllLocalStorage(result.user.uid);

      set({ authModalOpen: false });
    } catch (err) {
      console.error('Erro no login com Google:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      console.log('Tentando fazer logout');
      await firebaseSignOut(auth);
      console.log('Logout bem-sucedido');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ currentUser: user });
      
      // Sync all localStorage items when auth state changes (user logs in)
      if (user) {
        syncAllLocalStorage(user.uid).catch(err => 
          console.error('Error syncing localStorage on auth state change:', err)
        );
      }
    });
    return unsubscribe;
  },

  toggleAuthModal: (isOpen) => set(state => ({ authModalOpen: isOpen !== undefined ? isOpen : !state.authModalOpen })),
}));
