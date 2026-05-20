import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';
import ClienteForm from './ClienteForm';
import ShareModal from './ShareModal';

const Clientes = () => {
  const { data, addItem, removeItem, updateItem, setCurrentView, triggerShare } = useAppData();
  const [modal, setModal] = useState({ open: false, cliente: null });
  const [search, setSearch] = useState('');

  const openNew    = ()        => setModal({ open: true, cliente: null });
  const openEdit   = (cliente) => setModal({ open: true, cliente });
  const closeModal = ()        => setModal({ open: false, cliente: null });

  // No local handlers needed for share

  const handleSave = async (formData) => {
    if (formData.id) await updateItem('clientes', formData);
    else             await addItem('clientes', formData);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este cliente? Esta accion no se puede deshacer.')) return;
    await removeItem('clientes', id);
  };

  const totalDeuda = data.clientes.reduce((sum, c) => {
    const vc = data.ventas.filter(v => String(v.clienteId) === String(c.id));
    return sum + vc.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s+(v.total||0), 0);
  }, 0);

  const clientesAlDia  = data.clientes.filter(c => {
    const vc = data.ventas.filter(v => String(v.clienteId) === String(c.id));
    return vc.filter(v => v.estadoPago !== 'pagado').length === 0;
  }).length;

  const clientesDeuda = data.clientes.length - clientesAlDia;

  const filtered = data.clientes.filter(c =>
    !search ||
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.rif?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search)
  );

  const thSt = {
    padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.9px', color: '#1e293b',
    background: 'linear-gradient(135deg,rgba(37,99,235,0.1),rgba(37,99,235,0.05))',
    borderBottom: '2px solid rgba(37,99,235,0.25)',
    whiteSpace: 'nowrap',
  };
  const tdSt = { padding: '13px 16px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' };

  const KPIS = [
    {
      label: 'Total Clientes',
      value: data.clientes.length,
      sub: 'registrados',
      icon: '🏪',
      bg: 'linear-gradient(135deg,#1e3a6e,#2563eb)',
      glow: 'rgba(37,99,235,0.45)',
    },
    {
      label: 'Al dia',
      value: clientesAlDia,
      sub: 'sin deuda',
      icon: '✅',
      bg: 'linear-gradient(135deg,#065f46,#059669)',
      glow: 'rgba(5,150,105,0.4)',
    },
    {
      label: 'Con Deuda',
      value: clientesDeuda,
      sub: 'pendientes',
      icon: '⚠️',
      bg: clientesDeuda > 0
        ? 'linear-gradient(135deg,#92400e,#d97706)'
        : 'linear-gradient(135deg,#065f46,#059669)',
      glow: clientesDeuda > 0 ? 'rgba(217,119,6,0.4)' : 'rgba(5,150,105,0.4)',
    },
    {
      label: 'Deuda Total',
      value: '$ ' + U.fmt(totalDeuda),
      sub: 'por cobrar',
      icon: '💳',
      bg: totalDeuda > 0
        ? 'linear-gradient(135deg,#7f1d1d,#dc2626)'
        : 'linear-gradient(135deg,#065f46,#059669)',
      glow: totalDeuda > 0 ? 'rgba(220,38,38,0.4)' : 'rgba(5,150,105,0.4)',
    },
  ];

  return (
    <div className="view-container" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* HERO HEADER */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e3a6e 50%,#1e40af 100%)',
        borderRadius: 20, padding: '26px 32px', marginBottom: 24,
        boxShadow: '0 10px 40px rgba(30,64,175,0.45)',
        border: '1px solid rgba(59,130,246,0.35)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
            {'PASTORCA · Gestion Comercial'}
          </div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
            {'Cartera de Clientes'}
          </h2>
          <div style={{ fontSize: 13, color: '#93c5fd', marginTop: 6 }}>
            {'Distribuidores, bodegas y puntos de venta autorizados'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setCurrentView('dashboard')} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
            color: 'white', borderRadius: 12, padding: '11px 20px',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>{'<- Panel'}</button>
          <button onClick={openNew} style={{
            background: 'linear-gradient(135deg,#059669,#10b981)',
            border: 'none', color: 'white', borderRadius: 12, padding: '11px 24px',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(16,185,129,0.5)',
          }}>{'+ Nuevo Cliente'}</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {KPIS.map(k => (
          <div key={k.label} style={{
            background: k.bg, borderRadius: 18, padding: '20px 22px',
            boxShadow: `0 8px 24px ${k.glow}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 64, opacity: 0.1, lineHeight: 1 }}>
              {k.icon}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 4 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 4 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE CARD */}
      <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(37,99,235,0.2)', boxShadow: '0 4px 24px rgba(37,99,235,0.1)' }}>

        {/* Table header */}
        <div style={{
          background: 'linear-gradient(135deg,#1e3a6e,#2563eb)',
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16, color: 'white' }}>{'👥'}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{'Directorio de Clientes'}</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 12px', fontSize: 11, color: 'white', fontWeight: 700 }}>
              {filtered.length} {filtered.length !== data.clientes.length ? `de ${data.clientes.length}` : 'registros'}
            </span>
          </div>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RIF o telefono..."
            style={{
              padding: '9px 16px', borderRadius: 20, border: '1.5px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 12,
              outline: 'none', width: 260, fontFamily: 'Inter,sans-serif',
            }}
          />
        </div>

        <div style={{ background: 'white', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thSt}>{'RIF / Cedula'}</th>
                <th style={thSt}>{'Nombre / Cliente'}</th>
                <th style={thSt}>{'Telefono'}</th>
                <th style={thSt}>{'Contacto'}</th>
                <th style={thSt}>{'Direccion'}</th>
                <th style={{ ...thSt, textAlign: 'right' }}>{'Deuda ($)'}</th>
                <th style={{ ...thSt, textAlign: 'center' }}>{'Acciones'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 52, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{'🏪'}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    {search ? 'Sin resultados para tu busqueda' : 'Sin clientes registrados'}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {search
                      ? 'Intenta con otro termino de busqueda'
                      : 'Haz clic en + Nuevo Cliente para comenzar'}
                  </div>
                </td></tr>
              )}
              {filtered.map((c, i) => {
                const vc    = data.ventas.filter(v => String(v.clienteId) === String(c.id));
                const deuda = vc.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s+(v.total||0), 0);
                const factCnt = vc.length;
                return (
                  <tr key={c.id}
                    style={{ background: i%2===0 ? 'white' : '#f8faff', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = i%2===0 ? 'white' : '#f8faff'; }}
                  >
                    <td style={{ ...tdSt, fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', fontSize: 12 }}>
                      {c.rif}
                    </td>
                    <td style={{ ...tdSt }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{c.nombre}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        {factCnt > 0 ? factCnt + ' pre-factura(s)' : 'Sin facturas'}
                      </div>
                    </td>
                    <td style={{ ...tdSt, color: '#475569' }}>{c.telefono || '--'}</td>
                    <td style={{ ...tdSt, color: '#64748b', fontSize: 12 }}>{c.contacto || '--'}</td>
                    <td style={{ ...tdSt, fontSize: 11, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.direccion || '--'}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'right' }}>
                      {deuda > 0 ? (
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#dc2626' }}>{'$ ' + U.fmt(deuda)}</div>
                          <div style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>{'pendiente'}</div>
                        </div>
                      ) : (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 800 }}>
                          {'Al dia'}
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdSt, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(c)} style={{
                          background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: 'white',
                          border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12,
                          fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                        }}>{'Editar'}</button>
                        <button onClick={() => triggerShare(c, 'cliente')} style={{
                          background: '#f8fafc', color: '#1e40af',
                          border: '1.5px solid #e2e8f0', borderRadius: 9,
                          padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>📤</button>
                        <button onClick={() => handleDelete(c.id)} style={{
                          background: 'rgba(239,68,68,0.08)', color: '#dc2626',
                          border: '1.5px solid rgba(239,68,68,0.3)',
                          borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>{'Borrar'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal.open} onClose={closeModal}
        title={modal.cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="md">
        <ClienteForm cliente={modal.cliente} onSave={handleSave} onCancel={closeModal} />
      </Modal>

    </div>
  );
};

export default Clientes;
