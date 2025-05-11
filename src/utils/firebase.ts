import { Auth, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
export const db = getFirestore(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

// Função dedicada para criar documento de usuário sem depender de streams
export const createUserDocument = async (userId: string, userData: Record<string, any>) => {
  try {
    // Dados básicos que todo usuário deve ter
    const baseUserData = {
      uid: userId,
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    console.log('Tentando criar documento para usuário:', userId);
    
    // Usar setDoc com merge para evitar substituir dados existentes
    await setDoc(doc(db, 'users', userId), baseUserData, { merge: true });
    
    console.log('Documento criado/atualizado com sucesso para usuário:', userId);
    return true;
  } catch (error) {
    console.error('Erro ao criar documento do usuário:', error);
    console.error(error instanceof Error ? error.message : 'Erro desconhecido');
    return false;
  }
}; 