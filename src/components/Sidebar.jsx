import React from 'react';
import { useAppData } from '../context/AppDataContext';

const Sidebar = () => {
  const { currentView, setCurrentView, data, config } = useAppData();

  const navItems = [
    { id: 'dashboard',       label: 'Dashboard',          icon: '📊', section: 'Principal' },
    { id: 'proveedores',     label: 'Proveedores',         icon: '🏭', section: 'Compras UPACA' },
    { id: 'productos',       label: 'Productos',           icon: '📦', section: 'Compras UPACA' },
    { id: 'compras',         label: 'Facturas Compra',     icon: '🧾', section: 'Compras UPACA' },
    { id: 'controlPagos',    label: 'Control de Pagos',    icon: '💳', section: 'Compras UPACA' },
    { id: 'clientes',        label: 'Clientes',            icon: '👥', section: 'Ventas' },
    { id: 'ventas',          label: 'Pre-Facturas',        icon: '📋', section: 'Ventas' },
    { id: 'aliados',         label: 'Mis Aliados',         icon: '🤝', section: 'Red de Aliados' },
    { id: 'archivoUpaca',    label: 'Archivo UPACA',       icon: '🏭', section: 'Archivos PDF' },
    { id: 'archivoClientes', label: 'Archivo Clientes',    icon: '📁', section: 'Archivos PDF' },
    { id: 'reportes',        label: 'Reportes Excel',      icon: '📈', section: 'Administración' },
    { id: 'corteFacturas',   label: 'Corte de Facturas',   icon: '🖨', section: 'Administración' },
    { id: 'contabilidad',    label: 'Contabilidad',        icon: '📒', section: 'Administración' },
    { id: 'admin',           label: 'Administrador',       icon: '⚙️', section: 'Administración' },
  ];

  const sections = [...new Set(navItems.map(item => item.section))];

  const getPendingBadge = () => {
    const pendientes = data.ventas.filter(v => v.estadoPago === 'pendiente' || v.estadoPago === 'vencido').length;
    return pendientes > 0 ? pendientes : null;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'white', borderRadius: '12px', padding: '4px 10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <img
              src={config.logoUrl || '/logo-marcosbarco.png'}
              alt={config.nombreEmpresa || 'MARCOS BARCO'}
              style={{ height: 40, objectFit: 'contain', borderRadius: '6px' }}
              onError={e => { e.target.src = '/logo-upaca.png'; }}
            />
          </div>
        </div>
        <div style={{ marginTop: '18px' }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '2px' }}>{config.nombreEmpresa || 'UPACA'}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>Sistema Administrativo</div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 800 }}>{config.adminCargo || 'Representante de Ventas'}</div>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#93c5fd' }}>{config.adminNombre || 'MARCOS MANUEL BARCO GUEVARA'}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontWeight: 600 }}>Distribuidor Autorizado UPACA</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section} className="nav-section">
            <div className="nav-section-title">{section}</div>
            {navItems.filter(item => item.section === section).map(item => (
              <div
                key={item.id}
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span> {item.label}
                {item.id === 'ventas' && getPendingBadge() && (
                  <span className="nav-badge">{getPendingBadge()}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          PASTORCA © 2026<br />v2.0.3
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
