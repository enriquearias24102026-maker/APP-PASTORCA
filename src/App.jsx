import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import AuthScreen from './components/AuthScreen';
import MigrateData from './components/MigrateData';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Proveedores from './components/Proveedores';
import Productos from './components/Productos';
import Compras from './components/Compras';
import Clientes from './components/Clientes';
import Ventas from './components/Ventas';
import InvoicePrint from './components/InvoicePrint';
import Archivo from './components/Archivo';
import Reportes from './components/Reportes';
import Contabilidad from './components/Contabilidad';
import CorteFacturas from './components/CorteFacturas';
import Admin from './components/Admin';
import Aliados from './components/Aliados';
import ControlPagosDashboard from './components/ControlPagosDashboard';
import ShareModal from './components/ShareModal';

/* ─── Pantalla de carga global ─── */
const LoadingScreen = ({ msg = 'Cargando sistema...' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
    flexDirection: 'column', gap: '16px',
  }}>
    <img src="/logo-marcosbarco.png" alt="Logo"
      style={{ height: 64, objectFit: 'contain', marginBottom: 8, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
      onError={e => { e.target.style.display = 'none'; }}
    />
    <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Sistema Administrativo</div>
    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{msg}</div>
    <div style={{ width: 140, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        width: '60%', height: '100%',
        background: 'linear-gradient(90deg,#3b82f6,#06b6d4)',
        borderRadius: 2,
      }} />
    </div>
  </div>
);

/* ─── Vistas de la app (dentro de AppDataProvider) ─── */
const AppViews = () => {
  const { currentView, loading, printData, shareData, closeShare } = useAppData();

  if (loading) return <LoadingScreen msg="Sincronizando tus datos..." />;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':       return <Dashboard />;
      case 'proveedores':     return <Proveedores />;
      case 'productos':       return <Productos />;
      case 'compras':         return <Compras />;
      case 'controlPagos':    return <ControlPagosDashboard />;
      case 'clientes':        return <Clientes />;
      case 'ventas':          return <Ventas />;
      case 'archivoUpaca':    return <Archivo type="UPACA" />;
      case 'archivoClientes': return <Archivo type="Clientes" />;
      case 'reportes':        return <Reportes />;
      case 'corteFacturas':   return <CorteFacturas />;
      case 'contabilidad':    return <Contabilidad />;
      case 'aliados':         return <Aliados />;
      case 'admin':           return <Admin />;
      default:                return <Dashboard />;
    }
  };

  return (
    <>
      {printData && <InvoicePrint data={printData} />}
      
      {shareData && (
        <ShareModal 
          isOpen={!!shareData} 
          onClose={closeShare} 
          item={shareData.item} 
          type={shareData.type}
          onPrint={shareData.onPrint} 
        />
      )}

      <div className="app-container">
        {currentView === 'dashboard' && <Sidebar />}
        <main 
          className="main-content" 
          style={{ 
            marginLeft: currentView === 'dashboard' ? '320px' : '0',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <Header />
          <div className="page-content">
            {renderView()}
          </div>
        </main>
      </div>
    </>
  );
};

/* ─── Gate de autenticación + migración ─── */
const AuthGate = () => {
  const { user, authLoading } = useAuth();

  // 'checking' | 'needs_migration' | 'ready'
  const [migrateState, setMigrateState] = useState('checking');

  useEffect(() => {
    if (!user) { setMigrateState('checking'); return; }

    const checkMigration = async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (snap.exists() && snap.data().migrated === true) {
          setMigrateState('ready');
        } else {
          setMigrateState('needs_migration');
        }
      } catch {
        setMigrateState('ready');
      }
    };

    checkMigration();
  }, [user]);

  /* Sin sesión */
  if (authLoading)            return <LoadingScreen msg="Verificando sesión..." />;
  if (!user)                  return <AuthScreen />;
  if (migrateState === 'checking') return <LoadingScreen msg="Preparando tu espacio..." />;

  /* Primera vez → configuración inicial */
  if (migrateState === 'needs_migration') {
    return (
      <MigrateData
        uid={user.uid}
        userEmail={user.email}
        onDone={() => setMigrateState('ready')}
      />
    );
  }

  /* App completa con datos propios del usuario */
  return (
    <AppDataProvider uid={user.uid}>
      <AppViews />
    </AppDataProvider>
  );
};

/* ─── Root ─── */
function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
