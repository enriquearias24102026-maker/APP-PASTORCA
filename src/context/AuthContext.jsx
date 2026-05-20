import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user,        setUser]        = useState(null);  // Firebase user
  const [profile,     setProfile]     = useState(null);  // Firestore profile
  const [authLoading, setAuthLoading] = useState(true);

  /* ── Observer: detectar sesión activa ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        // Cargar perfil extendido de Firestore
        try {
          const snap = await getDoc(doc(db, 'usuarios', fbUser.uid));
          if (snap.exists()) setProfile(snap.data());
        } catch (e) {
          console.warn('No se pudo cargar el perfil:', e);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  /* ── Registrar nuevo usuario ── */
  const register = async ({ nombreCompleto, nombreUsuario, correo, telefono, clave }) => {
    const cred = await createUserWithEmailAndPassword(auth, correo, clave);
    // Actualizar displayName en Auth
    await updateProfile(cred.user, { displayName: nombreCompleto });
    // Guardar perfil extendido en Firestore
    const perfil = {
      uid: cred.user.uid,
      nombreCompleto,
      nombreUsuario,
      correo,
      telefono,
      rol: 'admin',
      creadoEn: serverTimestamp(),
    };
    await setDoc(doc(db, 'usuarios', cred.user.uid), perfil);
    setProfile(perfil);
    return cred.user;
  };

  /* ── Iniciar sesión ── */
  const login = (correo, clave) => signInWithEmailAndPassword(auth, correo, clave);

  /* ── Cerrar sesión ── */
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, profile, authLoading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
