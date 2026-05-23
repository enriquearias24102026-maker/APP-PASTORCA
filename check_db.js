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
  console.log("Iniciando inspección de la base de datos...");
  try {
    // 1. Obtener todos los usuarios de la colección 'usuarios'
    const usersSnap = await getDocs(collection(db, 'usuarios'));
    console.log(`Se encontraron ${usersSnap.size} usuarios.`);
    
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      console.log(`\nUsuario: ${uid} (${userDoc.data().email || 'sin email'})`);
      
      // 2. Obtener productos para este usuario
      const prodsSnap = await getDocs(collection(db, 'users', uid, 'productos'));
      console.log(`  Productos para este usuario (${prodsSnap.size}):`);
      
      prodsSnap.docs.forEach(doc => {
        const p = doc.data();
        console.log(`  - [${p.codigo || 'SIN_CODIGO'}] ${p.descripcion} | Categoría en DB: "${p.categoria}"`);
      });
    }
  } catch (err) {
    console.error("Error al consultar Firestore:", err);
  }
}

inspectDb().then(() => process.exit(0));
