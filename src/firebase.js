// Firebase Configuration — PASTORCA Admin App
// Project: app-ventas-compras-3ab35 | App: pastorca-admin

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA2bUoTjLeqWLd3pDRM9ZEULXsg5OEx3bU",
  authDomain: "app-ventas-compras-3ab35.firebaseapp.com",
  projectId: "app-ventas-compras-3ab35",
  storageBucket: "app-ventas-compras-3ab35.firebasestorage.app",
  messagingSenderId: "783160666153",
  appId: "1:783160666153:web:b49f2472dc7c3aa4ae1438",
  measurementId: "G-C97RJXLKFJ"
};

const app    = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);
export default app;
