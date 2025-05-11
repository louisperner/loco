import { create } from 'zustand';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  authModalOpen: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void; // returns unsubscribe function
  toggleAuthModal: (isOpen?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  loading: true,
  error: null,
  authModalOpen: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      set({ authModalOpen: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      set({ authModalOpen: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await signInWithPopup(auth, googleProvider);
      set({ authModalOpen: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  },

  clearError: () => set({ error: null }),

  toggleAuthModal: (isOpen) => set(state => ({ 
    authModalOpen: isOpen !== undefined ? isOpen : !state.authModalOpen 
  })),

  initialize: () => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ currentUser: user, loading: false });
    });

    // Return the unsubscribe function
    return unsubscribe;
  }
})); 