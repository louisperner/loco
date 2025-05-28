import { create } from 'zustand';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider, createUserDocument, isFirebaseConfigured } from '../utils/firebase';
import { syncAllLocalStorage } from '../utils/local-storage-sync';

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  authModalOpen: boolean;
  isFirebaseAvailable: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void; // returns unsubscribe function
  toggleAuthModal: (isOpen?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  loading: false,
  error: null,
  authModalOpen: false,
  isFirebaseAvailable: isFirebaseConfigured,

  signIn: async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      set({ error: 'Firebase authentication is not configured' });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // console.log.log('Tentando fazer login com email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // console.log.log('Login bem-sucedido:', userCredential.user.uid);

      // Update the last login time in Firestore
      await createUserDocument(userCredential.user.uid, {
        lastLogin: new Date().toISOString(),
      });

      // Sync all localStorage items using cloud-first approach
      await syncAllLocalStorage(userCredential.user.uid);

      set({ authModalOpen: false });
    } catch (err) {
      // console.log.error('Erro no login:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured || !auth) {
      set({ error: 'Firebase authentication is not configured' });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // Create the user account with Firebase Auth
      // console.log.log('Tentando criar conta com email:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // console.log.log('Conta criada com sucesso:', userCredential.user.uid);

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
      // console.log.error('Erro no cadastro:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      set({ error: 'Firebase authentication is not configured' });
      return;
    }
    
    set({ loading: true, error: null });
    try {
      // console.log.log('Tentando fazer login com Google');
      const result = await signInWithPopup(auth, googleProvider);
      // console.log.log('Login com Google bem-sucedido:', result.user.uid);

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
      // console.log.error('Erro no login com Google:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }
    
    try {
      // console.log.log('Tentando fazer logout');
      await firebaseSignOut(auth);
      // console.log.log('Logout bem-sucedido');
    } catch (err) {
      // console.log.error('Erro ao fazer logout:', err);
      set({ error: err instanceof Error ? err.message : 'An unknown error occurred' });
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    if (!isFirebaseConfigured || !auth) {
      // Return a no-op function if Firebase is not configured
      return () => {};
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ currentUser: user });
      
      // Sync all localStorage items when auth state changes (user logs in)
      if (user) {
        // syncAllLocalStorage(user.uid).catch(err => 
        //   // console.log.error('Error syncing localStorage on auth state change:', err)
        // );
      }
    });
    return unsubscribe;
  },

  toggleAuthModal: (isOpen) => set(state => ({ authModalOpen: isOpen !== undefined ? isOpen : !state.authModalOpen })),
}));
