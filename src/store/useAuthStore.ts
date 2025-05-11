import { create } from 'zustand';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider, createUserDocument } from '../utils/firebase';

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

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  loading: true,
  error: null,
  authModalOpen: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // Login com Firebase Auth
      console.log('Tentando fazer login com email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login bem-sucedido:', userCredential.user.uid);
      
      // Criar ou atualizar documento do usuário
      await createUserDocument(userCredential.user.uid, {
        email: userCredential.user.email,
        name: userCredential.user.displayName || email.split('@')[0],
        lastLogin: new Date().toISOString()
      });
      
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
        lastLogin: new Date().toISOString()
      });
      
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
      
      // Criar ou atualizar documento do usuário
      await createUserDocument(result.user.uid, {
        email: result.user.email,
        name: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        lastLogin: new Date().toISOString()
      });
      
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

  toggleAuthModal: (isOpen) => set(state => ({ 
    authModalOpen: isOpen !== undefined ? isOpen : !state.authModalOpen 
  })),

  initialize: () => {
    console.log('Inicializando listener de autenticação');
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Estado de autenticação alterado:', user?.uid || 'sem usuário');
      
      // Atualizar lastLogin para o usuário atual se estiver logado
      if (user) {
        createUserDocument(user.uid, {
          email: user.email,
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário'),
          photoURL: user.photoURL || '',
          lastLogin: new Date().toISOString()
        });
      }
      
      set({ currentUser: user, loading: false });
    });

    // Return the unsubscribe function
    return unsubscribe;
  }
})); 