import { create } from 'zustand';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../utils/firebase';

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

// Função auxiliar para criar documento de usuário
const createUserDocument = async (user: User, additionalData?: { name?: string }) => {
  if (!user) return;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    console.log('Verificando documento do usuário:', user.uid, userDoc.exists());
    
    if (!userDoc.exists()) {
      console.log('Criando documento para usuário:', user.uid);
      const userData = {
        uid: user.uid,
        email: user.email,
        name: additionalData?.name || user.displayName || (user.email ? user.email.split('@')[0] : ''),
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(userDocRef, userData);
      console.log('Documento de usuário criado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  loading: true,
  error: null,
  authModalOpen: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // Login com Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login bem-sucedido:', userCredential.user.uid);
      
      // Criar documento do usuário se não existir
      await createUserDocument(userCredential.user);
      
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Conta criada com sucesso:', userCredential.user.uid);
      
      // Create a document in Firestore with user's ID and data
      await createUserDocument(userCredential.user, { name });
      
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
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Login com Google bem-sucedido:', result.user.uid);
      
      // Criar documento do usuário se não existir
      await createUserDocument(result.user);
      
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
      await firebaseSignOut(auth);
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
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Estado de autenticação alterado:', user?.uid || 'sem usuário');
      set({ currentUser: user, loading: false });
    });

    // Return the unsubscribe function
    return unsubscribe;
  }
})); 