import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { currentView, setCurrentView, tasaBCV, tasaBCVFecha, setTasaBCV } = useAppData();
  const { user, profile, logout } = useAuth();
  const [dateStr, setDateStr] = useState('');
  const [editingTasa, setEditingTasa] = useState(false);
  const [tasaInput, setTasaInput] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const updateDate = () => {
      const d = new Date();
      setDateStr(d.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);
    return () => clearInterval(timer);
  }, []);

  const titles = {
    dashboard: 'Dashboard',
    proveedores: 'Proveedores',
    productos: 'Catálogo de Productos',
    compras: 'Facturas de Compra — UPACA',
    controlPagos: 'Control de Pagos a Proveedores',
    clientes: 'Clientes',
    ventas: 'Pre-Facturas de Venta',
    archivoUpaca: 'Archivo PDF — Facturas UPACA',
    archivoClientes: 'Archivo PDF — Facturas Clientes',
    reportes: 'Reportes Excel',
    corteFacturas: 'Corte de Facturas',
    contabilidad: 'Contabilidad',
    aliados: 'Red de Aliados',
    admin: 'Administración',
  };

  const hoy = new Date().toISOString().split('T')[0];
  const tasaEsHoy = tasaBCVFecha === hoy;
  const tasaColor = tasaBCV > 0 ? (tasaEsHoy ? '#059669' : '#d97706') : '#dc2626';

  const handleTasaEdit = () => {
    setTasaInput(tasaBCV > 0 ? String(tasaBCV) : '');
    setEditingTasa(true);
  };

  const handleTasaSave = () => {
    const val = parseFloat(tasaInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      setTasaBCV(val);
    }
    setEditingTasa(false);
  };

  const handleTasaKeyDown = (e) => {
    if (e.key === 'Enter') handleTasaSave();
    if (e.key === 'Escape') setEditingTasa(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {currentView !== 'dashboard' && (
          <button
            onClick={() => setCurrentView('dashboard')}
            style={{
              padding: '8px 16px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              color: 'white', fontWeight: '900', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px',
              boxShadow: '0 4px 12px rgba(30,64,175,0.2)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🏠 INICIO
          </button>
        )}
        <div>
          <h2 id="page-title" style={{ margin: 0 }}>{titles[currentView] || 'Dashboard'}</h2>
          <span className="breadcrumb" id="page-breadcrumb">PASTORCA / {titles[currentView] || 'Dashboard'}</span>
        </div>
      </div>
      <div className="topbar-right">
        {/* BCV Rate Widget */}
        <div className="bcv-widget" title={tasaEsHoy ? 'Tasa BCV del día' : 'Tasa BCV de otro día — haz clic para actualizar'}>
          <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '6px' }}>💱 Tasa BCV:</span>
          {editingTasa ? (
            <input
              autoFocus
              type="number"
              step="0.01"
              value={tasaInput}
              onChange={e => setTasaInput(e.target.value)}
              onBlur={handleTasaSave}
              onKeyDown={handleTasaKeyDown}
              style={{
                width: '90px', padding: '3px 8px',
                background: '#f1f5f9', border: '1px solid #1e40af',
                borderRadius: '6px', color: '#0f172a',
                fontSize: '13px', fontWeight: '700',
              }}
            />
          ) : (
            <span
              onClick={handleTasaEdit}
              style={{
                cursor: 'pointer', color: tasaColor, fontWeight: '700', fontSize: '14px',
                padding: '3px 10px', background: `${tasaColor}10`,
                borderRadius: '6px', border: `1px solid ${tasaColor}30`,
                transition: 'all 0.2s',
              }}
              title="Clic para editar la tasa BCV"
            >
              {tasaBCV > 0
                ? `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(tasaBCV)}`
                : '⚠ Ingrese tasa'}
            </span>
          )}
          {!tasaEsHoy && tasaBCV > 0 && (
            <span style={{ fontSize: '10px', color: '#d97706', marginLeft: '4px' }}>⚠ Actualizar</span>
          )}
        </div>

        <div style={{ width: '1px', height: '30px', background: '#e2e8f0' }} />

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
            {profile?.nombreCompleto || user?.displayName || 'Usuario'}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
            @{profile?.nombreUsuario || 'admin'}
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{dateStr}</span>

        {/* Cerrar sesión — two-step confirmation */}
        {confirmLogout ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => { logout(); setConfirmLogout(false); }}
              style={{
                background: 'linear-gradient(135deg,#b91c1c,#dc2626)',
                color: 'white', border: '2px solid #fbbf24', borderRadius: 8,
                padding: '6px 14px', fontSize: 12, fontWeight: 900,
                cursor: 'pointer', animation: 'pulse 0.8s ease-in-out infinite',
                boxShadow: '0 0 12px rgba(220,38,38,0.5)',
              }}
            >⚠ ¿SEGURO?</button>
            <button
              onClick={() => setConfirmLogout(false)}
              style={{
                background: '#f1f5f9', color: '#64748b', border: '1px solid #94a3b8',
                borderRadius: 8, padding: '6px 8px', fontSize: 11, cursor: 'pointer',
              }}
            >✖</button>
          </div>
        ) : (
          <button
            onClick={() => {
              setConfirmLogout(true);
              setTimeout(() => setConfirmLogout(prev => prev ? false : prev), 4000);
            }}
            title="Cerrar sesión"
            style={{
              background: 'linear-gradient(135deg,#dc2626,#ef4444)',
              color: 'white', border: 'none', borderRadius: 8,
              padding: '6px 12px', fontSize: 11, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >🚪 Salir</button>
        )}

      </div>
    </header>
  );
};

export default Header;
