// Minimal Firebase configuration for testing
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAwxp86lCQ3xGKis5qPD1aqDGvucX7K_k0",
  authDomain: "artvrllc-artvr.firebaseapp.com",
  databaseURL: "https://artvrllc-artvr-default-rtdb.firebaseio.com",
  projectId: "artvrllc-artvr",
  storageBucket: "artvrllc-artvr.appspot.com",
  messagingSenderId: "37430407811",
  appId: "1:37430407811:web:d0bd80310415aa41dfa1b6",
  measurementId: "G-E1THHKVGVW"
};

// Initialize Firebase app only
console.log('Initializing minimal Firebase app...');
const app = initializeApp(firebaseConfig);
console.log('Minimal Firebase app initialized successfully');

export { app };

// Lazy initialization of services
export async function getAuthService() {
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
}

export async function getFirestoreService() {
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(app);
}

export async function getStorageService() {
  const { getStorage } = await import('firebase/storage');
  return getStorage(app);
}

export async function getFunctionsService() {
  const { getFunctions } = await import('firebase/functions');
  return getFunctions(app);
}