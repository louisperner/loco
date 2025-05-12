import { Auth, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  doc, 
  setDoc,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from 'firebase/firestore';

// Your web app's Firebase configuration 
// This would normally contain all your Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

// Use the new recommended approach for persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({})
  })
});

export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const createUserDocument = async (userId: string, userData: Record<string, any>) => {
  if (!userId) {
    console.error('Attempted to create user document with undefined userId');
    return false;
  }
  
  try {
    const baseUserData = {
      uid: userId,
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    //console.log('Tentando criar documento para usuário:', userId);
    
    await setDoc(doc(db, 'users', userId), baseUserData, { merge: true });
    
    //console.log('Documento criado/atualizado com sucesso para usuário:', userId);
    return true;
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);
    console.error(error instanceof Error ? error.message : 'Erro desconhecido');
    return false;
  }
}; 