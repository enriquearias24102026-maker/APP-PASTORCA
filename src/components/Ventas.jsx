import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';
import VentasForm from './VentasForm';
import PrintPreview from './PrintPreview';

/* ── Badge de estado ── */
const EstadoBadge = ({ estado }) => {
  const MAP = {
    pagado:    { label:'PAGADO',    bg:'rgba(16,185,129,0.15)', color:'#059669', dot:'#10b981' },
    pendiente: { label:'PENDIENTE', bg:'rgba(245,158,11,0.15)', color:'#b45309', dot:'#f59e0b' },
    vencido:   { label:'VENCIDO',   bg:'rgba(239,68,68,0.15)',  color:'#dc2626', dot:'#ef4444' },
  };
  const m = MAP[String(estado).toLowerCase()] || MAP['pendiente'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:800,
      background:m.bg, color:m.color, border:`1px solid ${m.color}40`,
      textTransform:'uppercase', letterSpacing:'0.6px', whiteSpace:'nowrap',
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:m.dot, flexShrink:0 }} />
      {m.label}
    </span>
  );
};

const Ventas = () => {
  const { data, addItem, removeItem, updateItem, triggerPrint, tasaBCV, setCurrentView } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editVenta,   setEditVenta]   = useState(null);  // null = crear, objeto = editar
  const [previewData, setPreviewData] = useState(null);

  const generateNumeroPreFactura = (fecha) => {
    const mes = (fecha || U.today()).substring(5, 7);
    const prefix = `PF-${mes}-`;
    const existingThisMonth = data.ventas.filter(v => v.numeroPreFactura && v.numeroPreFactura.startsWith(prefix));
    let maxNum = 0;
    existingThisMonth.forEach(v => { const n = parseInt((v.numeroPreFactura.split('-'))[2])||0; if(n>maxNum) maxNum=n; });
    return `PF-${mes}-${String(maxNum+1).padStart(5,'0')}`;
  };

  const handleSaveVenta = async (nuevaVenta) => {
    try {
      const ventaConNumero = { ...nuevaVenta, numeroPreFactura: generateNumeroPreFactura(nuevaVenta.fecha) };
      const saved = await addItem('ventas', ventaConNumero);
      setIsModalOpen(false);
      // Only show preview if saved has items
      if (saved && saved.items && saved.items.length > 0) {
        setPreviewData(saved);
      }
    } catch (err) {
      console.error('Error al guardar pre-factura:', err);
      alert('Error al guardar la pre-factura. Intente de nuevo.');
    }
  };

  const handleDelete   = async (id) => { if (!window.confirm('¿Eliminar esta pre-factura?')) return; await removeItem('ventas', id); };
  const handleMarkPaid = async (id) => { const v = data.ventas.find(v => String(v.id)===String(id)); if(!v) return; await updateItem('ventas', {...v, estadoPago:'pagado'}); };
  const handleEdit     = (venta)    => setEditVenta(venta);
  const handleSaveEdit = async (formData) => {
    const original = data.ventas.find(v => String(v.id) === String(formData.id || editVenta?.id));
    if (!original) return;
    await updateItem('ventas', { ...original, ...formData, id: original.id });
    setEditVenta(null);
  };
  const handlePreview  = (venta)   => setPreviewData(venta);
  const handlePrintFromPreview = () => { if (previewData) triggerPrint(previewData); };
  const handleClosePreview = ()    => setPreviewData(null);

  const totalUSD     = data.ventas.reduce((s,v) => s+(v.total||0), 0);
  const pendienteUSD = data.ventas.filter(v => v.estadoPago!=='pagado').reduce((s,v) => s+(v.total||0), 0);
  const cobradoUSD   = data.ventas.filter(v => v.estadoPago==='pagado').reduce((s,v) => s+(v.total||0), 0);
  const pendienteCnt = data.ventas.filter(v => v.estadoPago!=='pagado').length;
  const vencidoCnt   = data.ventas.filter(v => v.estadoPago==='vencido').length;

  const thSt = {
    padding:'11px 16px', textAlign:'left', fontSize:'10px', fontWeight:800,
    textTransform:'uppercase', letterSpacing:'0.9px', color:'#0f172a',
    background:'rgba(5,150,105,0.08)', borderBottom:'2px solid rgba(5,150,105,0.3)',
    whiteSpace:'nowrap',
  };
  const tdSt = { padding:'12px 16px', fontSize:'13px', color:'#1e293b', borderBottom:'1px solid #e2e8f0', verticalAlign:'middle' };

  return (
    <div className="view-container">
      {previewData && (
        <PrintPreview data={previewData} onPrint={handlePrintFromPreview} onClose={handleClosePreview} />
      )}

      {/* ── HERO HEADER ── */}
      <div style={{
        background:'linear-gradient(135deg,#064e3b,#065f46,#059669)',
        borderRadius:18, padding:'24px 28px', marginBottom:24,
        boxShadow:'0 8px 28px rgba(5,150,105,0.4)',
        border:'1px solid rgba(16,185,129,0.4)',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14,
      }}>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>
            PASTORCA · Ventas a Clientes
          </div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'white' }}>📋 Pre-Facturas de Venta</h2>
          <div style={{ display:'flex', gap:10, marginTop:10, flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700 }}>
              📄 {data.ventas.length} registradas
            </span>
            <span style={{ background:'rgba(16,185,129,0.3)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700, border:'1px solid rgba(16,185,129,0.5)' }}>
              💵 Total: $ {U.fmt(totalUSD)}
            </span>
            <span style={{ background: pendienteUSD>0 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.25)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700, border: pendienteUSD>0 ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(16,185,129,0.4)' }}>
              {pendienteUSD>0 ? `⏳ Pendiente: $ ${U.fmt(pendienteUSD)}` : '✅ Todo cobrado'}
            </span>
            {tasaBCV>0 && pendienteUSD>0 && (
              <span style={{ background:'rgba(255,255,255,0.1)', borderRadius:20, padding:'4px 14px', fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:600 }}>
                💱 ≈ {U.fmtBs(pendienteUSD, tasaBCV)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setCurrentView('dashboard')} style={{
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)',
            color:'white', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer',
          }}>← Panel</button>
          <button onClick={() => setIsModalOpen(true)} style={{
            background:'linear-gradient(135deg,#1e40af,#2563eb)',
            border:'none', color:'white', borderRadius:10, padding:'10px 22px',
            fontSize:14, fontWeight:800, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(37,99,235,0.45)',
            display:'flex', alignItems:'center', gap:8,
          }}>＋ Nueva Pre-Factura</button>
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        {[
          { label:'Total Facturado', val:`$ ${U.fmt(totalUSD)}`, icon:'💰', bg:'linear-gradient(135deg,#059669,#10b981)', glow:'rgba(16,185,129,0.35)' },
          { label:'Pendiente de Cobro', val:`$ ${U.fmt(pendienteUSD)}`, icon:'⏳', bg: pendienteUSD>0?'linear-gradient(135deg,#b45309,#d97706)':'linear-gradient(135deg,#059669,#10b981)', glow:'rgba(217,119,6,0.35)' },
          { label:'Ya Cobrado', val:`$ ${U.fmt(cobradoUSD)}`, icon:'✅', bg:'linear-gradient(135deg,#0891b2,#06b6d4)', glow:'rgba(6,182,212,0.35)' },
          { label:'Facturas Vencidas', val:String(vencidoCnt), icon:'🔴', bg: vencidoCnt>0?'linear-gradient(135deg,#dc2626,#ef4444)':'linear-gradient(135deg,#059669,#10b981)', glow:'rgba(239,68,68,0.35)' },
        ].map(s => (
          <div key={s.label} style={{
            background:s.bg, borderRadius:16, padding:'18px 20px',
            boxShadow:`0 6px 20px ${s.glow}`,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:-14, right:-10, fontSize:60, opacity:0.1, lineHeight:1 }}>{s.icon}</div>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>{s.val}</div>
            {s.label==='Pendiente de Cobro' && tasaBCV>0 && pendienteUSD>0 && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:6, fontWeight:600 }}>{U.fmtBs(pendienteUSD,tasaBCV)}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(5,150,105,0.3)', boxShadow:'0 4px 20px rgba(5,150,105,0.1)' }}>
        {/* table bar */}
        <div style={{ background:'linear-gradient(135deg,#065f46,#059669)', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:8 }}>
            📋 Registro de Pre-Facturas
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, padding:'2px 10px', fontSize:11 }}>
              {data.ventas.length} registros
            </span>
            {pendienteCnt>0 && (
              <span style={{ background:'rgba(245,158,11,0.4)', borderRadius:12, padding:'2px 10px', fontSize:11, border:'1px solid rgba(245,158,11,0.6)' }}>
                ⏳ {pendienteCnt} pendiente{pendienteCnt!==1?'s':''}
              </span>
            )}
          </span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>Pago en Bs. · Tasa BCV del día del cobro</span>
        </div>

        <div style={{ background:'white', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['⚙️ Acciones','🔢 N° Pre-Factura','📅 Fecha','🚚 Entrega','👤 Cliente','💵 Total ($)','💱 Total Bs.','🔖 Estado'].map(h => (
                  <th key={h} style={{ ...thSt, textAlign: h.includes('Total')?'right':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.ventas.length===0 && (
                <tr><td colSpan={8} style={{ padding:60, textAlign:'center' }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>📋</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#334155', marginBottom:6 }}>Sin pre-facturas registradas</div>
                  <div style={{ fontSize:13, color:'#64748b' }}>Haz clic en <strong style={{ color:'#059669' }}>＋ Nueva Pre-Factura</strong> para comenzar</div>
                </td></tr>
              )}
              {[...data.ventas].reverse().map((v,i) => (
                <tr key={v.id}
                  style={{ background: i%2===0?'white':'#f8fffe', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(5,150,105,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?'white':'#f8fffe'}
                >
                  <td style={{ ...tdSt, whiteSpace:'nowrap', minWidth:220 }}>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>

                      {/* ✅ COBRADO */}
                      {v.estadoPago !== 'pagado' && (
                        <button onClick={() => handleMarkPaid(v.id)} title="Marcar como cobrado" style={{
                          background:'linear-gradient(135deg,#059669,#10b981)',
                          color:'white', border:'none', borderRadius:10,
                          padding:'9px 14px', fontSize:12, fontWeight:800, cursor:'pointer',
                          boxShadow:'0 3px 10px rgba(5,150,105,0.4)',
                          display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
                          transition:'transform 0.15s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
                          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                        >✅ Cobrado</button>
                      )}

                      {/* ✏️ MODIFICAR */}
                      <button onClick={() => handleEdit(v)} title="Modificar pre-factura" style={{
                        background:'linear-gradient(135deg,#d97706,#f59e0b)',
                        color:'white', border:'none', borderRadius:10,
                        padding:'9px 14px', fontSize:12, fontWeight:800, cursor:'pointer',
                        boxShadow:'0 3px 10px rgba(217,119,6,0.4)',
                        display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
                        transition:'transform 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      >✏️ Modificar</button>

                      {/* 👁 VER */}
                      <button onClick={() => handlePreview(v)} title="Ver pre-factura" style={{
                        background:'linear-gradient(135deg,#1e40af,#3b82f6)',
                        color:'white', border:'none', borderRadius:10,
                        padding:'9px 14px', fontSize:12, fontWeight:800, cursor:'pointer',
                        boxShadow:'0 3px 10px rgba(37,99,235,0.4)',
                        display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
                        transition:'transform 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      >👁 Ver</button>

                      {/* 🗑 BORRAR */}
                      <button onClick={() => handleDelete(v.id)} title="Eliminar pre-factura" style={{
                        background:'linear-gradient(135deg,#dc2626,#ef4444)',
                        color:'white', border:'none', borderRadius:10,
                        padding:'9px 14px', fontSize:12, fontWeight:800, cursor:'pointer',
                        boxShadow:'0 3px 10px rgba(239,68,68,0.4)',
                        display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap',
                        transition:'transform 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
                        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                      >🗑 Borrar</button>

                    </div>
                  </td>
                  <td style={{ ...tdSt, fontFamily:'monospace', fontWeight:800, color:'#1e40af', fontSize:12 }}>
                    {v.numeroPreFactura||'—'}
                  </td>
                  <td style={tdSt}>
                    <span style={{ background:'rgba(5,150,105,0.1)', color:'#065f46', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>
                      {U.fmtDate(v.fecha)}
                    </span>
                  </td>
                  <td style={{ ...tdSt, color: v.fechaEntrega?'#0891b2':'#94a3b8', fontSize:12, fontWeight: v.fechaEntrega?600:400 }}>
                    {v.fechaEntrega ? U.fmtDate(v.fechaEntrega) : '—'}
                  </td>
                  <td style={{ ...tdSt, fontWeight:700, color:'#0f172a' }}>{v.clienteNombre}</td>
                  <td style={{ ...tdSt, textAlign:'right', fontWeight:800, color:'#059669', fontSize:14 }}>
                    $ {U.fmt(v.total)}
                  </td>
                  <td style={{ ...tdSt, textAlign:'right', fontSize:11, color:'#64748b' }}>
                    {v.totalBs ? U.fmtBs(v.total, v.tasaBCVUsada||tasaBCV) : (tasaBCV>0 ? U.fmtBs(v.total,tasaBCV) : '—')}
                  </td>
                  <td style={tdSt}><EstadoBadge estado={v.estadoPago} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nueva pre-factura */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="📋 Nueva Pre-Factura de Venta" size="xl">
        <VentasForm onSave={handleSaveVenta} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* Modal: Modificar pre-factura */}
      <Modal isOpen={!!editVenta} onClose={() => setEditVenta(null)} title="✏️ Modificar Pre-Factura" size="xl">
        {editVenta && (
          <VentasForm
            venta={editVenta}
            onSave={handleSaveEdit}
            onCancel={() => setEditVenta(null)}
          />
        )}
      </Modal>
    </div>
  );
};

export default Ventas;
