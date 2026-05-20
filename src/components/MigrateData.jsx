import React, { useState } from 'react';
import {
  collection, getDocs, addDoc, setDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * MigrateData — Se muestra UNA SOLA VEZ cuando un usuario inicia sesión
 * y no tiene datos en su espacio personal (users/{uid}/...).
 *
 * Opciones:
 *   A) Migrar data existente del espacio global al espacio personal del usuario
 *   B) Comenzar desde cero (nuevo usuario)
 */

const OLD_COLLECTIONS = ['proveedores', 'productos', 'clientes', 'compras', 'ventas', 'vendedores'];

const MigrateData = ({ uid, userEmail, onDone }) => {
  const [step,     setStep]     = useState('choose');  // 'choose' | 'migrating' | 'done' | 'fresh'
  const [progress, setProgress] = useState('');
  const [count,    setCount]    = useState({});
  const [error,    setError]    = useState('');

  /* ── Migrar datos del espacio compartido al espacio del usuario ── */
  const handleMigrate = async () => {
    setStep('migrating');
    setError('');

    try {
      const counts = {};

      for (const colName of OLD_COLLECTIONS) {
        setProgress(`Migrando ${colName}...`);
        const snap = await getDocs(collection(db, colName));
        counts[colName] = snap.docs.length;

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          // Escribir en users/{uid}/colName
          await addDoc(
            collection(db, 'users', uid, colName),
            { ...data, createdAt: data.createdAt || serverTimestamp(), updatedAt: serverTimestamp() }
          );
        }
      }

      // Migrar settings (tasa BCV + config)
      setProgress('Migrando configuración...');
      try {
        const settingsSnap = await getDocs(collection(db, 'settings'));
        for (const s of settingsSnap.docs) {
          await setDoc(
            doc(db, 'users', uid, 'settings', s.id),
            { ...s.data(), updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch {}

      // Marcar la migración como completada en el perfil del usuario
      await setDoc(
        doc(db, 'usuarios', uid),
        { migrated: true, migratedAt: serverTimestamp() },
        { merge: true }
      );

      setCount(counts);
      setStep('done');
    } catch (e) {
      console.error('Migration error:', e);
      setError('Error durante la migración: ' + e.message);
      setStep('choose');
    }
  };

  /* ── Comenzar desde cero ── */
  const handleFresh = async () => {
    setStep('fresh');
    try {
      // Marcar como "no requiere migración"
      await setDoc(
        doc(db, 'usuarios', uid),
        { migrated: true, freshStart: true, migratedAt: serverTimestamp() },
        { merge: true }
      );
    } catch {}
    setTimeout(onDone, 1200);
  };

  const totalMigrated = Object.values(count).reduce((a, b) => a + b, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: "'Inter', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decoración */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', top: -150, right: -150 }} />
      <div style={{ position: 'absolute', width: 350, height: 350, borderRadius: '50%', background: 'rgba(124,58,237,0.05)', bottom: -80, left: -80 }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🗄️</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>Configuración Inicial</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
            {userEmail}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: 20,
          padding: '32px 36px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}>

          {/* ══ PASO: ELEGIR ══ */}
          {step === 'choose' && (
            <>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                ¿Cómo deseas empezar?
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
                Detectamos que es tu primera vez en esta cuenta. Elige cómo manejar tus datos:
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              {/* Opción A — Migrar */}
              <div
                onClick={handleMigrate}
                style={{
                  background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
                  borderRadius: 14, padding: '20px 22px', marginBottom: 14,
                  cursor: 'pointer', transition: 'transform 0.2s',
                  boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>📦</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                      Traer mis datos existentes
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                      Copia todos mis clientes, productos, proveedores y facturas al espacio de esta cuenta. Ideal para el usuario original que ya tenía datos en la app.
                    </div>
                  </div>
                </div>
              </div>

              {/* Opción B — Desde cero */}
              <div
                onClick={handleFresh}
                style={{
                  background: '#f8fafc', border: '2px solid #e2e8f0',
                  borderRadius: 14, padding: '20px 22px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>✨</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                      Empezar desde cero
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                      Comenzar con una base de datos vacía y registrar mis propios clientes, productos y proveedores. Ideal para un nuevo usuario independiente.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 11, color: '#92400e' }}>
                ⚠️ Esta elección solo se hace <strong>una vez</strong>. No se puede cambiar después de confirmar.
              </div>
            </>
          )}

          {/* ══ PASO: MIGRANDO ══ */}
          {step === 'migrating' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1.5s linear infinite' }}>⚙️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Migrando datos...</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{progress}</div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: '100%',
                  background: 'linear-gradient(90deg,#1e40af,#3b82f6,#06b6d4)',
                  backgroundSize: '200% 100%',
                  borderRadius: 20,
                  animation: 'shimmer 1.5s infinite',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
                No cierres esta ventana...
              </div>
            </div>
          )}

          {/* ══ PASO: MIGRACIÓN COMPLETADA ══ */}
          {step === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#065f46', marginBottom: 8 }}>
                ¡Migración completada!
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.7 }}>
                Se copiaron <strong>{totalMigrated} registros</strong> a tu espacio personal:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {Object.entries(count).map(([col, n]) => (
                  <div key={col} style={{
                    background: '#f0fdf4', border: '1px solid #86efac',
                    borderRadius: 10, padding: '10px 14px', textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 11, color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#059669' }}>{n}</div>
                  </div>
                ))}
              </div>

              <button onClick={onDone} style={{
                width: '100%', background: 'linear-gradient(135deg,#059669,#10b981)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '14px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(5,150,105,0.4)',
              }}>
                🚀 Entrar al Sistema
              </button>
            </div>
          )}

          {/* ══ PASO: DESDE CERO ══ */}
          {step === 'fresh' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🌱</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
                ¡Listo! Empezando desde cero...
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                Preparando tu espacio personal...
              </div>
            </div>
          )}

        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 Sistema Administrativo · Cada usuario tiene su espacio independiente
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default MigrateData;
