import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────
   AuthScreen — Pantalla de acceso / registro
   Modos: 'login' | 'register'
───────────────────────────────────────────── */
const AuthScreen = () => {
  const { login, register } = useAuth();

  const [mode,    setMode]    = useState('login');   // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Campos
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [nombreUsuario,  setNombreUsuario]  = useState('');
  const [correo,         setCorreo]         = useState('');
  const [telefono,       setTelefono]       = useState('');
  const [clave,          setClave]          = useState('');
  const [claveConfirm,   setClaveConfirm]   = useState('');
  const [showPass,       setShowPass]       = useState(false);
  const [showDriveInfo,  setShowDriveInfo]  = useState(false);

  const reset = () => {
    setError(''); setSuccess('');
    setNombreCompleto(''); setNombreUsuario('');
    setCorreo(''); setTelefono('');
    setClave(''); setClaveConfirm('');
  };

  const switchMode = (m) => { reset(); setMode(m); };

  /* ── Mapa de errores Firebase → español ── */
  const fbError = (err) => {
    const code = err.code;
    const msg = {
      'auth/email-already-in-use':    '⚠️ Este correo ya está registrado.',
      'auth/invalid-email':           '⚠️ El correo electrónico no es válido.',
      'auth/weak-password':           '⚠️ La clave debe tener al menos 6 caracteres.',
      'auth/user-not-found':          '⚠️ No existe una cuenta con ese correo.',
      'auth/wrong-password':          '⚠️ La clave es incorrecta.',
      'auth/invalid-credential':      '⚠️ Correo o clave incorrectos.',
      'auth/too-many-requests':       '⚠️ Demasiados intentos. Espera unos minutos.',
      'auth/network-request-failed':  '⚠️ Sin conexión. Verifica tu internet.',
      'auth/operation-not-allowed':   '⚠️ El inicio de sesión con correo está desactivado en Firebase Console.',
    }[code];
    
    if (msg) return msg;
    console.error("Auth Error:", err);
    return `⚠️ Error: ${err.message || 'Ocurrió un problema desconocido.'}`;
  };

  /* ── Registro ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) return setError('⚠️ El nombre completo es requerido.');
    if (!nombreUsuario.trim())  return setError('⚠️ El nombre de usuario es requerido.');
    if (!correo.trim())         return setError('⚠️ El correo es requerido.');
    if (!telefono.trim())       return setError('⚠️ El teléfono de contacto es requerido.');
    if (clave.length < 6)       return setError('⚠️ La clave debe tener al menos 6 caracteres.');
    if (clave !== claveConfirm) return setError('⚠️ Las claves no coinciden.');

    setLoading(true); setError('');
    try {
      await register({ nombreCompleto, nombreUsuario, correo, telefono, clave });
      setSuccess('✅ Cuenta creada correctamente. Bienvenido/a.');
    } catch (err) {
      setError(fbError(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!correo.trim()) return setError('⚠️ Ingresa tu correo.');
    if (!clave)         return setError('⚠️ Ingresa tu clave.');

    setLoading(true); setError('');
    try {
      await login(correo, clave);
    } catch (err) {
      setError(fbError(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Estilos de Alta Visibilidad ── */
  const inputStyle = {
    width: '100%', padding: '15px 18px', borderRadius: 14,
    border: '2px solid #cbd5e1', fontSize: 16,
    fontFamily: "'Outfit', sans-serif", outline: 'none', background: '#f8fafc',
    color: '#0f172a', transition: 'all 0.2s',
    boxSizing: 'border-box', fontWeight: 500
  };
  const labelStyle = {
    fontSize: 13, fontWeight: 800, color: '#0f172a',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'block',
  };
  const btnPrimary = {
    width: '100%', padding: '18px',
    background: loading ? '#94a3b8' : 'linear-gradient(135deg,#1e40af,#2563eb)',
    color: 'white', border: 'none', borderRadius: 14,
    fontSize: 18, fontWeight: 800, cursor: loading ? 'default' : 'pointer',
    boxShadow: loading ? 'none' : '0 10px 25px rgba(37,99,235,0.3)',
    transition: 'all 0.2s', letterSpacing: 0.5,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden',
    }}>

      {/* Decoración de fondo */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', top: -200, right: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.06)', bottom: -100, left: -100, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/logo-marcosbarco.png" alt="Logo"
            style={{ height: 72, objectFit: 'contain', marginBottom: 14, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
            Sistema Administrativo
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            Gestión de Ventas, Compras y Facturación
          </div>
        </div>

        {/* ── CARD PRINCIPAL ── */}
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 20, padding: '32px 36px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 16, padding: 6, marginBottom: 32 }}>
            {[['login', '📂 Iniciar Sesión'], ['register', '✨ Crear Cuenta']].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? '#2563eb' : 'transparent',
                color: mode === m ? 'white' : '#64748b',
                boxShadow: mode === m ? '0 6px 15px rgba(37,99,235,0.3)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
              padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#dc2626', fontWeight: 600,
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10,
              padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#15803d', fontWeight: 600,
            }}>{success}</div>
          )}

          {/* ══════════ FORMULARIO REGISTRO ══════════ */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ display: 'grid', gap: 16 }}>

                {/* Nombre Completo */}
                <div>
                  <label style={labelStyle}>👤 Nombre Completo</label>
                  <input
                    type="text" value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)}
                    placeholder="Ej: Marcos Manuel Barco Guevara" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    autoComplete="name" required
                  />
                </div>

                {/* Nombre de Usuario */}
                <div>
                  <label style={labelStyle}>🏷️ Nombre de Usuario</label>
                  <input
                    type="text" value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="Ej: marcosbarco" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    autoComplete="username" required
                  />
                </div>

                {/* Correo + Teléfono en grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>📧 Correo Electrónico</label>
                    <input
                      type="email" value={correo} onChange={e => setCorreo(e.target.value)}
                      placeholder="correo@gmail.com" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      autoComplete="email" required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>📱 Teléfono</label>
                    <input
                      type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                      placeholder="+58 414 0000000" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Clave */}
                <div>
                  <label style={labelStyle}>🔐 Clave de Acceso</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} value={clave} onChange={e => setClave(e.target.value)}
                      placeholder="Mínimo 6 caracteres" style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      autoComplete="new-password" required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8',
                    }}>{showPass ? '🙈' : '👁'}</button>
                  </div>
                </div>

                {/* Confirmar Clave */}
                <div>
                  <label style={labelStyle}>🔐 Confirmar Clave</label>
                  <input
                    type={showPass ? 'text' : 'password'} value={claveConfirm} onChange={e => setClaveConfirm(e.target.value)}
                    placeholder="Repite la clave" style={{
                      ...inputStyle,
                      borderColor: claveConfirm && clave !== claveConfirm ? '#ef4444' : '#e2e8f0',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = claveConfirm && clave !== claveConfirm ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    autoComplete="new-password" required
                  />
                  {claveConfirm && clave !== claveConfirm && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, fontWeight: 600 }}>Las claves no coinciden</div>
                  )}
                </div>

                {/* Botón registrar */}
                <button type="submit" disabled={loading} style={btnPrimary}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? '⏳ Creando cuenta...' : '✨ Crear Mi Cuenta'}
                </button>

              </div>
            </form>
          )}

          {/* ══════════ FORMULARIO LOGIN ══════════ */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ display: 'grid', gap: 16 }}>

                <div>
                  <label style={labelStyle}>📧 Correo Electrónico</label>
                  <input
                    type="email" value={correo} onChange={e => setCorreo(e.target.value)}
                    placeholder="correo@gmail.com" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                    autoComplete="email" required
                  />
                </div>

                <div>
                  <label style={labelStyle}>🔐 Clave de Acceso</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'} value={clave} onChange={e => setClave(e.target.value)}
                      placeholder="Tu clave secreta" style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                      autoComplete="current-password" required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8',
                    }}>{showPass ? '🙈' : '👁'}</button>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={btnPrimary}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {loading ? '⏳ Verificando...' : '🔐 Ingresar al Sistema'}
                </button>

              </div>
            </form>
          )}

          {/* ══════════ AVISO GOOGLE DRIVE ══════════ */}
          <div style={{ marginTop: 22, borderTop: '1px solid #e2e8f0', paddingTop: 18 }}>
            <button
              onClick={() => setShowDriveInfo(!showDriveInfo)}
              style={{
                width: '100%', background: showDriveInfo ? '#fef9c3' : '#f0fdf4',
                border: `1px solid ${showDriveInfo ? '#fde68a' : '#86efac'}`,
                borderRadius: 10, padding: '10px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                color: showDriveInfo ? '#92400e' : '#15803d', transition: 'all 0.2s',
              }}
            >
              <span>☁️ Recomendación: Google Drive Personal</span>
              <span style={{ fontSize: 11 }}>{showDriveInfo ? '▲ Cerrar' : '▼ Ver más'}</span>
            </button>

            {showDriveInfo && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '0 0 10px 10px', padding: '16px 18px', fontSize: 12, color: '#78350f',
                lineHeight: 1.7,
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: '#92400e' }}>
                  📁 ¿Por qué crear un Google Drive personal?
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Tus datos de la app se guardan en la nube de Firebase automáticamente.</li>
                  <li>Pero <strong>facturas exportadas, imágenes y reportes en PDF</strong> los puedes guardar en tu Google Drive para acceder desde cualquier dispositivo.</li>
                  <li>Si ya usas Gmail, ve a <strong>drive.google.com</strong> y activa tu espacio gratuito de 15 GB.</li>
                  <li>Crea una carpeta llamada <strong>"PASTORCA — Facturación"</strong> y organiza tus documentos por mes.</li>
                </ul>
                <a
                  href="https://drive.google.com" target="_blank" rel="noreferrer"
                  style={{
                    display: 'inline-block', marginTop: 10,
                    background: 'linear-gradient(135deg,#1e40af,#3b82f6)',
                    color: 'white', borderRadius: 8, padding: '6px 14px',
                    fontSize: 12, fontWeight: 800, textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                  }}
                >
                  🌐 Abrir Google Drive →
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 Sistema Administrativo · Desarrollado con ❤️ para PASTORCA
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
