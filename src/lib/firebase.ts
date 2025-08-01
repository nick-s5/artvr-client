// Client-specific Firebase configuration
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase modules will be properly bundled by Vite

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

// Initialize Firebase for client
let app: any;
let auth: any;
let db: any;
let storage: any;
let functions: any;

try {
  console.log('Initializing Firebase app...');
  
  // Check if Firebase app is already initialized
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized successfully');

  console.log('Initializing Firebase services...');
  auth = getAuth(app);
  console.log('Auth service initialized');
  
  // Initialize Firestore
  console.log('Attempting to initialize Firestore...');
  db = getFirestore(app);
  console.log('Firestore service initialized successfully');
  
  storage = getStorage(app);
  console.log('Storage service initialized');
  
  functions = getFunctions(app);
  console.log('Functions service initialized');
  
  console.log('All Firebase services initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase services:', error);
  console.error('Error details:', error);
  
  // More specific error handling
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  
  // Initialize with null values as fallback
  auth = null;
  db = null;
  storage = null;
  functions = null;
}

// Helper function to get storage URL
export async function getStorageUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  
  try {
    const imageRef = ref(storage, path);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error getting storage URL:', error);
    return null;
  }
}

export { auth, db, storage, functions };