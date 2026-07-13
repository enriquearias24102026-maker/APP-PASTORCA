import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, doc, getDocs, addDoc, setDoc, deleteDoc,
  onSnapshot, serverTimestamp, writeBatch, getDoc,
  query, where, updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const AppDataContext = createContext();

export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};

const COLLECTIONS = ['proveedores', 'productos', 'clientes', 'compras', 'ventas', 'vendedores', 'aliados', 'archivosUpaca', 'archivosClientes'];

const userCol  = (uid, colName) => collection(db, 'users', uid, colName);
const userDoc  = (uid, colName, docId) => doc(db, 'users', uid, colName, docId);
const settingsDoc = (uid) => doc(db, 'users', uid, 'settings', 'main');

// ══════════════════════════════════════════════════════════════════════════
// SISTEMA DE CACHÉ LOCAL
// ══════════════════════════════════════════════════════════════════════════
const LS_KEY = (uid, col) => `ag_${uid}_${col}`;
const lsGet  = (uid, col) => {
  try { return JSON.parse(localStorage.getItem(LS_KEY(uid, col))) || []; } catch { return []; }
};
const lsSet  = (uid, col, items) => {
  try { localStorage.setItem(LS_KEY(uid, col), JSON.stringify(items)); } catch {}
};

// ══════════════════════════════════════════════════════════════════════════
// LISTA DE IDS BORRADOS — Persistente en localStorage
// Usa una sola clave global para evitar problemas de naming
// ══════════════════════════════════════════════════════════════════════════
const DELETED_KEY = 'ag_deleted_ids';

const getDeletedIds = () => {
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY)) || {};
  } catch {
    return {};
  }
};

const markAsDeleted = (colName, id) => {
  const deleted = getDeletedIds();
  if (!deleted[colName]) deleted[colName] = [];
  const strId = String(id);
  if (!deleted[colName].includes(strId)) {
    deleted[colName].push(strId);
  }
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
};

const unmarkAsDeleted = (colName, id) => {
  const deleted = getDeletedIds();
  if (deleted[colName]) {
    deleted[colName] = deleted[colName].filter(x => x !== String(id));
    if (deleted[colName].length === 0) delete deleted[colName];
  }
  localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
};

const isDeletedId = (colName, id) => {
  const deleted = getDeletedIds();
  return (deleted[colName] || []).includes(String(id));
};

const getDeletedIdsForCol = (colName) => {
  const deleted = getDeletedIds();
  return new Set(deleted[colName] || []);
};

export const AppDataProvider = ({ uid, children }) => {
  const [currentView, setCurrentView] = useState('dashboard');

  // ══════════════════════════════════════════════════════════════════════════
  // ESTADO INICIAL — Lee de localStorage Y filtra IDs borrados
  // ══════════════════════════════════════════════════════════════════════════
  const [data, setData] = useState(() => {
    const initial = {};
    for (const col of COLLECTIONS) {
      const raw = lsGet(uid, col);
      const deletedSet = getDeletedIdsForCol(col);
      initial[col] = deletedSet.size > 0 
        ? raw.filter(item => !deletedSet.has(String(item.id)))
        : raw;
    }
    return initial;
  });

  const [loading, setLoading] = useState(true);
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const [tasaBCV, setTasaBCVState] = useState(0);
  const [tasaBCVFecha, setTasaBCVFecha] = useState('');
  const [config, setConfigState] = useState({});
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // ── Global Dark Mode state & synchronization ──
  const [darkMode, setDarkModeState] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const toggleDarkMode = () => {
    setDarkModeState(prev => {
      const newVal = !prev;
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // ── Listener Settings ──
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(settingsDoc(uid), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.tasaBCV !== undefined) { setTasaBCVState(d.tasaBCV); setTasaBCVFecha(d.tasaBCVFecha || ''); }
      if (d.config !== undefined) setConfigState(d.config || {});
    });
  }, [uid]);

  const setTasaBCV = async (valor) => {
    const hoy = new Date().toISOString().split('T')[0];
    const val = parseFloat(valor) || 0;
    setTasaBCVState(val);
    setTasaBCVFecha(hoy);
    try { await setDoc(settingsDoc(uid), { tasaBCV: val, tasaBCVFecha: hoy, updatedAt: serverTimestamp() }, { merge: true }); } catch (e) { console.error(e); }
  };

  const setConfig = async (newConfig) => {
    const merged = { ...configRef.current, ...newConfig };
    setConfigState(merged);
    try { await setDoc(settingsDoc(uid), { config: merged, updatedAt: serverTimestamp() }, { merge: true }); } catch (e) { console.error(e); }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // AL MONTAR: Reintentar borrados pendientes
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!uid) return;
    const retryPendingDeletes = async () => {
      const deleted = getDeletedIds();
      for (const colName of Object.keys(deleted)) {
        for (const id of deleted[colName]) {
          try {
            const docRef = userDoc(uid, colName, id);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              await deleteDoc(docRef);
              console.log(`🔄 Borrado pendiente reintentado: ${colName}/${id} → OK`);
            } else {
              // El doc ya no existe, limpiar de la lista
              unmarkAsDeleted(colName, id);
              console.log(`🧹 ${colName}/${id} ya no existe en Firestore, limpiado de pendientes`);
            }
          } catch (e) {
            console.warn(`⚠️ Reintento fallido ${colName}/${id}:`, e.message);
          }
        }
      }
    };
    retryPendingDeletes();
  }, [uid]);

  // ══════════════════════════════════════════════════════════════════════════
  // LISTENERS PRINCIPALES — Filtran IDs borrados en cada snapshot
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!uid) return;

    const unsubs = COLLECTIONS.map(colName => {
      return onSnapshot(userCol(uid, colName), (snapshot) => {
        // Leer SIEMPRE la lista fresca de IDs borrados
        const deletedSet = getDeletedIdsForCol(colName);
        
        const items = [];
        let blocked = 0;

        for (const d of snapshot.docs) {
          const docId = d.id;
          
          // Filtrar por lista de borrados
          if (deletedSet.has(docId)) {
            blocked++;
            continue;
          }

          const item = { ...d.data(), id: docId };
          
          // Filtrar docs con flag deleted
          if (item.deleted === true) {
            blocked++;
            continue;
          }

          items.push(item);
        }

        // Ordenar
        items.sort((a, b) => {
          const valA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
          const valB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
          return valA - valB;
        });

        if (colName === 'productos') {
          console.log(`[SYNC productos] servidor: ${snapshot.docs.length}, bloqueados: ${blocked}, visibles: ${items.length}`);
        }

        lsSet(uid, colName, items);
        setData(prev => ({ ...prev, [colName]: items }));
        if (colName === 'productos') setLoading(false);
      });
    });
    return () => unsubs.forEach(u => u());
  }, [uid]);

  const clearLocalCache = useCallback(() => {
    COLLECTIONS.forEach(col => {
      localStorage.removeItem(LS_KEY(uid, col));
    });
    // NO borramos la lista de IDs borrados
    window.location.reload();
  }, [uid]);

  // ── AGREGAR ──
  const addItem = useCallback(async (colName, item) => {
    const newDocRef = doc(collection(db, 'users', uid, colName));
    const docData = { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    delete docData.id;
    await setDoc(newDocRef, docData);
    return { ...item, id: newDocRef.id };
  }, [uid]);

  // ── ACTUALIZAR ──
  const updateItem = useCallback(async (colName, item) => {
    const { id, createdAt, ...rest } = item;
    await setDoc(userDoc(uid, colName, String(id)), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
  }, [uid]);

  // ══════════════════════════════════════════════════════════════════════════
  // ELIMINAR — Proceso robusto en 3 pasos
  // ══════════════════════════════════════════════════════════════════════════
  const removeItem = useCallback(async (colName, id) => {
    const strId = String(id);
    console.log(`🗑️ INICIO borrado: ${colName}/${strId}`);

    // PASO 1: Marcar como borrado en localStorage (persiste entre recargas)
    markAsDeleted(colName, strId);

    // PASO 2: Quitar inmediatamente del estado de React + localStorage de datos
    setData(prev => {
      const filtered = (prev[colName] || []).filter(item => String(item.id) !== strId);
      lsSet(uid, colName, filtered);
      return { ...prev, [colName]: filtered };
    });

    // PASO 3: Borrar de Firestore con reintentos
    const docRef = userDoc(uid, colName, strId);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await deleteDoc(docRef);
        console.log(`✅ ${colName}/${strId} eliminado de Firestore (intento ${attempt})`);
        // Éxito — limpiar de la lista de pendientes después de un breve delay
        // para dar tiempo al onSnapshot a procesarlo
        setTimeout(() => {
          unmarkAsDeleted(colName, strId);
          console.log(`🧹 ${colName}/${strId} limpiado de pendientes`);
        }, 5000);
        return;
      } catch (e) {
        console.warn(`⚠️ Intento ${attempt}/3 falló: ${e.message}`);
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }
      }
    }
    console.error(`❌ No se pudo eliminar ${colName}/${strId}. Queda marcado para reintento en próxima carga.`);
  }, [uid]);

  const saveToLS = (colName, items) => {
    lsSet(uid, colName, items);
    setData(prev => ({ ...prev, [colName]: items }));
  };

  const [shareData, setShareData] = useState(null);
  const triggerShare = (item, type, onPrint = null) => setShareData({ item, type, onPrint });
  const closeShare = () => setShareData(null);

  const [printData, setPrintData] = useState(null);
  const triggerPrint = useCallback((item) => {
    setPrintData(item);
  }, []);

  useEffect(() => {
    if (printData) {
      const timer = setTimeout(() => {
        window.print();
        setPrintData(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  const value = {
    currentView, setCurrentView,
    data, addItem, removeItem, updateItem, saveToLS, clearLocalCache,
    loading, tasaBCV, tasaBCVFecha, setTasaBCV,
    config, setConfig,
    shareData, triggerShare, closeShare,
    printData, triggerPrint,
    transfers: [], loadingTrans: false,
    darkMode, toggleDarkMode
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};
