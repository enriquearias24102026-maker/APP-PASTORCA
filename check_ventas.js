import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA2bUoTjLeqWLd3pDRM9ZEULXsg5OEx3bU",
  authDomain: "app-ventas-compras-3ab35.firebaseapp.com",
  projectId: "app-ventas-compras-3ab35",
  storageBucket: "app-ventas-compras-3ab35.firebasestorage.app",
  messagingSenderId: "783160666153",
  appId: "1:783160666153:web:b49f2472dc7c3aa4ae1438",
  measurementId: "G-C97RJXLKFJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectDb() {
  const uid = 'pE9vfFbK9fQxsHsTgF7WCDxZW0W2';
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'ventas'));
    console.log(`TOTAL SALES: ${snap.size}`);
    snap.docs.forEach(doc => {
      const v = doc.data();
      console.log(`SALE ID: ${doc.id} -> clienteNombre: "${v.clienteNombre}", fecha: "${v.fecha}", total: ${v.total}, tasaBCVUsada: ${v.tasaBCVUsada}, totalBs: ${v.totalBs}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

inspectDb().then(() => process.exit(0));
