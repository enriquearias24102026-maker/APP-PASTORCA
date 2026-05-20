import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';
import ComprasForm from './ComprasForm';
import ComprasPrint from './ComprasPrint';
import ComprasPagos from './ComprasPagos';

const Compras = () => {
  const { data, addItem, removeItem, updateItem, tasaBCV, setCurrentView } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState(null);
  const [previewCompra, setPreviewCompra] = useState(null);
  const [pagosCompra, setPagosCompra] = useState(null);

  // ── Detect duplicate invoice numbers ────────────────────────────────
  const duplicateFacturas = useMemo(() => {
    const countMap = {};
    data.compras.forEach(c => {
      const num = (c.numeroFactura || '').trim().toUpperCase();
      if (!num) return;
      if (!countMap[num]) countMap[num] = [];
      countMap[num].push(c);
    });
    // Return only entries that appear more than once
    const dupes = {};
    Object.entries(countMap).forEach(([num, items]) => {
      if (items.length > 1) dupes[num] = items;
    });
    return dupes;
  }, [data.compras]);

  const hasDuplicates = Object.keys(duplicateFacturas).length > 0;

  // Check if a specific compra has a duplicate
  const isDuplicate = (numeroFactura) => {
    const num = (numeroFactura || '').trim().toUpperCase();
    return !!duplicateFacturas[num];
  };

  const handleOpenNew = () => {
    setEditingCompra(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (compra) => {
    setEditingCompra(compra);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingCompra(null);
    setIsModalOpen(false);
  };

  const handleSaveCompra = (nuevaCompra) => {
    if (editingCompra) {
      const updated = { ...editingCompra, ...nuevaCompra, id: editingCompra.id };
      updateItem('compras', updated);
      handleCloseModal();
    } else {
      const saved = addItem('compras', nuevaCompra);
      handleCloseModal();
      // Show print preview after saving
      setTimeout(() => {
        const item = saved && saved.then ? null : saved;
        if (item) setPreviewCompra(item);
        else if (saved && saved.then) saved.then(it => setPreviewCompra(it));
      }, 300);
    }
  };

  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDeleteClick = (id) => {
    // First click: show confirmation state
    if (confirmDeleteId === id) {
      // Second click: execute delete
      executeDelete(id);
    } else {
      // Show confirmation — auto-cancel after 5 seconds
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 5000);
    }
  };

  const executeDelete = async (id) => {
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await removeItem('compras', id);
      console.log(`✅ Factura ${id} eliminada exitosamente`);
    } catch (err) {
      console.error('❌ Error al eliminar:', err);
      alert(`❌ Error al eliminar la factura:\n${err.message}\n\nIntente de nuevo.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSavePagos = (updated) => {
    updateItem('compras', updated);
    setPagosCompra(null);
  };

  const totalUSD = data.compras.reduce((s, c) => s + (c.total || 0), 0);
  const totalBs = data.compras.reduce((s, c) => {
    // Priority: stored totalBs > calculated using stored tasaBCVUsada > calculated using global tasaBCV
    if (c.totalBs) return s + c.totalBs;
    const rate = c.tasaBCVUsada || tasaBCV || 0;
    return s + (c.total * rate);
  }, 0);

  return (
    <div className="view-container">
      {/* ── HERO HEADER ── */}
      <div style={{
        background:'linear-gradient(135deg,#0f172a,#0c4a6e,#0891b2)',
        borderRadius:18, padding:'24px 28px', marginBottom:24,
        boxShadow:'0 8px 28px rgba(8,145,178,0.35)',
        border:'1px solid rgba(6,182,212,0.4)',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14,
      }}>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>PASTORCA · Compras a Proveedores</div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'white' }}>🧾 Facturas de Compra</h2>
          <div style={{ display:'flex', gap:12, marginTop:10, flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700 }}>
              📋 {data.compras.length} factura{data.compras.length!==1?'s':''}
            </span>
            <span style={{ background:'rgba(6,182,212,0.3)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700, border:'1px solid rgba(6,182,212,0.5)' }}>
              💵 Total: $ {U.fmt(totalUSD)}
            </span>
            {totalBs > 0 && (
              <span style={{ background:'rgba(16,185,129,0.25)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700, border:'1px solid rgba(16,185,129,0.4)' }}>
                💱 Total: Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(totalBs)}
              </span>
            )}
            <span style={{ background:'rgba(255,255,255,0.1)', borderRadius:20, padding:'4px 14px', fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
              💳 Pago en USD · Equivalente BCV del día
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setCurrentView('dashboard')} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)', color:'white', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}>← Panel</button>
          <button onClick={handleOpenNew} style={{ background:'linear-gradient(135deg,#059669,#10b981)', border:'none', color:'white', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 14px rgba(16,185,129,0.4)', display:'flex', alignItems:'center', gap:8 }}>＋ Registrar Factura</button>
        </div>
      </div>

      {/* ── Duplicate Invoice Alert ────────────────────────────────── */}
      {hasDuplicates && (
        <div style={{ background:'rgba(239,68,68,0.10)', border:'2px solid rgba(239,68,68,0.6)', borderRadius:14, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:14, animation:'pulse 1.5s ease-in-out infinite', boxShadow:'0 0 20px rgba(239,68,68,0.15)' }}>
          <span style={{ fontSize:28, lineHeight:1 }}>🚨</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#dc2626', marginBottom:8 }}>¡¡ ALERTA: FACTURAS DUPLICADAS DETECTADAS !!</div>
            <div style={{ fontSize:12, color:'#1e293b', lineHeight:1.6 }}>
              {Object.entries(duplicateFacturas).map(([num, items]) => (
                <div key={num} style={{ marginBottom:6, padding:'6px 10px', background:'rgba(239,68,68,0.06)', borderRadius:8, borderLeft:'4px solid #dc2626' }}>
                  <strong style={{ color:'#dc2626', fontSize:13 }}>Factura #{num}</strong>{' — '}aparece <strong style={{ color:'#dc2626' }}>{items.length} veces</strong>
                  {' — '}Proveedores: {items.map(i=>i.proveedorNombre||'—').join(', ')}
                  {' — '}Totales: {items.map(i=>`$${(i.total||0).toFixed(2)}`).join(', ')}
                </div>
              ))}
            </div>
            <div style={{ marginTop:8, fontSize:11, color:'#991b1b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              ⚠ Revise y elimine los registros duplicados para mantener la integridad de los datos.
            </div>
          </div>
        </div>
      )}

      <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(6,182,212,0.3)', boxShadow:'0 4px 20px rgba(6,182,212,0.1)' }}>
        {/* table header bar */}
        <div style={{ background:'linear-gradient(135deg,#0891b2,#06b6d4)', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:8 }}>
            🧾 Registro de Facturas de Compra
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, padding:'2px 10px', fontSize:11 }}>{data.compras.length} registros</span>
          </span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>Pago en USD · Equivalente BCV del día</span>
        </div>
        <div style={{ background:'white', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['⚙️ Acciones','📅 F. Emisión','⏳ F. Venc.','🧾 Factura #','📦 Pedido #','🏭 Proveedor','💵 Total ($)','💳 Pagado ($)','⏳ Pendiente ($)','💱 Total Bs.'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign: h.includes('($)') || h.includes('Bs.') ?'right':'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'#0f172a', background:'rgba(6,182,212,0.08)', borderBottom:'2px solid rgba(6,182,212,0.3)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.compras.length === 0 && (
                <tr><td colSpan={10} style={{ padding:52, textAlign:'center' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🧾</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#334155', marginBottom:6 }}>Sin facturas de compra</div>
                  <div style={{ fontSize:13, color:'#64748b' }}>Haz clic en <strong style={{ color:'#0891b2' }}>＋ Registrar Factura</strong> para comenzar</div>
                </td></tr>
              )}
              {[...data.compras].reverse().map((c,i) => {
                const hasDupe = isDuplicate(c.numeroFactura);
                const tdS = { padding:'12px 14px', fontSize:'12.5px', color:'#1e293b', borderBottom:'1px solid #e2e8f0', verticalAlign:'middle', background: hasDupe ? 'rgba(245,158,11,0.05)' : i%2===0?'white':'#f8fafc' };
                return (
                  <tr key={c.id}>
                    <td style={{ ...tdS, whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => handleOpenEdit(c)} style={{ background:'linear-gradient(135deg,#7c3aed,#8b5cf6)', color:'white', border:'none', borderRadius:8, padding:'7px 10px', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>✏️ Modificar</button>
                        <button onClick={() => setPagosCompra(c)} style={{ background:'linear-gradient(135deg,#1e40af,#3b82f6)', color:'white', border:'none', borderRadius:8, padding:'7px 10px', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>💳 Pagos</button>
                        <button onClick={() => setPreviewCompra(c)} style={{ background:'linear-gradient(135deg,#0891b2,#06b6d4)', color:'white', border:'none', borderRadius:8, padding:'7px 10px', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>🖨️ Imprimir</button>
                        <button
                          onClick={() => handleDeleteClick(c.id)}
                          disabled={deletingId === c.id}
                          style={{
                            background: deletingId === c.id
                              ? 'rgba(107,114,128,0.3)'
                              : confirmDeleteId === c.id
                                ? 'linear-gradient(135deg,#b91c1c,#dc2626)'
                                : 'linear-gradient(135deg,#dc2626,#ef4444)',
                            color: 'white',
                            border: confirmDeleteId === c.id ? '2px solid #fbbf24' : 'none',
                            borderRadius: 8,
                            padding: '7px 10px',
                            fontSize: confirmDeleteId === c.id ? 12 : 11,
                            fontWeight: 800,
                            cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                            whiteSpace: 'nowrap',
                            opacity: deletingId === c.id ? 0.6 : 1,
                            animation: confirmDeleteId === c.id ? 'pulse 0.8s ease-in-out infinite' : 'none',
                            boxShadow: confirmDeleteId === c.id ? '0 0 12px rgba(220,38,38,0.5)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >{deletingId === c.id ? '⏳ Borrando...' : confirmDeleteId === c.id ? '⚠ ¿SEGURO?' : '🗑 Borrar'}</button>
                        {confirmDeleteId === c.id && (
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ background:'rgba(107,114,128,0.2)', color:'#64748b', border:'1px solid #94a3b8', borderRadius:8, padding:'7px 8px', fontSize:10, fontWeight:600, cursor:'pointer' }}
                          >✖</button>
                        )}
                      </div>
                    </td>
                    <td style={tdS}><span style={{ background:'rgba(6,182,212,0.1)', color:'#0c4a6e', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{U.fmtDate(c.fechaEmision || c.fecha)}</span></td>
                    <td style={tdS}><span style={{ background:'rgba(245,158,11,0.1)', color:'#b45309', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{U.fmtDate(c.fechaVencimiento)}</span></td>
                    <td style={{ ...tdS, fontWeight:800, color:'#0891b2', fontFamily:'monospace', fontSize:13 }}>
                      {c.numeroFactura}
                      {hasDupe && <span style={{ marginLeft:6, background:'rgba(245,158,11,0.15)', color:'#d97706', borderRadius:6, padding:'1px 6px', fontSize:10, fontWeight:700, border:'1px solid rgba(245,158,11,0.4)' }}>⚠ DUP</span>}
                    </td>
                    <td style={{ ...tdS, color:'#64748b', fontSize:12, fontFamily:'monospace' }}>{c.numeroPedido||'—'}</td>
                    <td style={{ ...tdS, fontWeight:700, color:'#0f172a' }}>{c.proveedorNombre}</td>
                    <td style={{ ...tdS, textAlign:'right', fontWeight:800, color:'#0f172a', fontSize:13 }}>$ {U.fmt(c.total)}</td>
                    <td style={{ ...tdS, textAlign:'right', fontWeight:700, color:'#059669', fontSize:13 }}>
                      $ {U.fmt((c.pagos || []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0))}
                    </td>
                    <td style={{ ...tdS, textAlign:'right', fontWeight:800, color: (c.total - ((c.pagos || []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0))) > 0.01 ? '#dc2626' : '#059669', fontSize:13 }}>
                      $ {U.fmt(Math.max(0, c.total - ((c.pagos || []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0))))}
                    </td>
                    <td style={{ ...tdS, textAlign:'right', fontSize:11, color:'#64748b' }}>{c.totalBs ? U.fmtBs(c.total, c.tasaBCVUsada||tasaBCV) : (tasaBCV>0 ? U.fmtBs(c.total,tasaBCV) : '—')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCompra ? '✏️ Modificar Factura de Compra' : '🧾 Registrar Factura de Compra'}
        size="xl"
      >
        <ComprasForm
          compra={editingCompra}
          onSave={handleSaveCompra}
          onCancel={handleCloseModal}
        />
      </Modal>

      <Modal
        isOpen={!!pagosCompra}
        onClose={() => setPagosCompra(null)}
        title={`💳 Gestión de Pagos — Factura #${pagosCompra?.numeroFactura}`}
        size="lg"
      >
        {pagosCompra && (
          <ComprasPagos
            compra={pagosCompra}
            onSave={handleSavePagos}
            onCancel={() => setPagosCompra(null)}
          />
        )}
      </Modal>

      {/* Print preview modal */}
      {previewCompra && (
        <ComprasPrint
          data={previewCompra}
          onPrint={() => window.print()}
          onClose={() => setPreviewCompra(null)}
        />
      )}
    </div>
  );
};

export default Compras;
