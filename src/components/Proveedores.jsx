import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import Modal from './Modal';
import ProveedorForm from './ProveedorForm';

const Proveedores = () => {
  const { data, addItem, removeItem, updateItem, setCurrentView } = useAppData();
  const [modal, setModal] = useState({ open: false, proveedor: null });

  const openNew    = ()          => setModal({ open: true, proveedor: null });
  const openEdit   = (proveedor) => setModal({ open: true, proveedor });
  const closeModal = ()          => setModal({ open: false, proveedor: null });

  const handleSave = async (formData) => {
    if (formData.id) await updateItem('proveedores', formData);
    else             await addItem('proveedores', formData);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;
    await removeItem('proveedores', id);
  };

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
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:2, marginBottom:6 }}>
            PASTORCA · Red de Proveedores
          </div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'white' }}>🏭 Proveedores</h2>
          <div style={{ marginTop:10, display:'flex', gap:12, flexWrap:'wrap' }}>
            <span style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700 }}>
              🏭 {data.proveedores.length} registrado{data.proveedores.length!==1?'s':''}
            </span>
            <span style={{ background:'rgba(6,182,212,0.3)', borderRadius:20, padding:'4px 14px', fontSize:12, color:'white', fontWeight:700, border:'1px solid rgba(6,182,212,0.5)' }}>
              ✅ UPACA — Proveedor principal
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setCurrentView('dashboard')} style={{
            background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.3)',
            color:'white', borderRadius:10, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer',
          }}>← Panel</button>
          <button onClick={openNew} style={{
            background:'linear-gradient(135deg,#0891b2,#06b6d4)',
            border:'none', color:'white', borderRadius:10, padding:'10px 22px',
            fontSize:14, fontWeight:800, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(6,182,212,0.4)',
            display:'flex', alignItems:'center', gap:8,
          }}>＋ Nuevo Proveedor</button>
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {data.proveedores.length === 0 && (
        <div style={{ textAlign:'center', padding:'64px 20px', background:'white', borderRadius:16, border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🏭</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#334155', marginBottom:6 }}>Sin proveedores registrados</div>
          <div style={{ fontSize:13, color:'#64748b' }}>Haz clic en <strong style={{ color:'#0891b2' }}>＋ Nuevo Proveedor</strong> para agregar el primero</div>
        </div>
      )}

      {/* ── PROVIDER CARDS ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {data.proveedores.map((p, i) => (
          <div key={p.id} style={{
            background:'white', borderRadius:16, overflow:'hidden',
            border:'1px solid #e2e8f0',
            boxShadow:'0 2px 12px rgba(15,23,42,0.08)',
            transition:'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#0891b2'; e.currentTarget.style.boxShadow='0 6px 24px rgba(8,145,178,0.18)'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='0 2px 12px rgba(15,23,42,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}
          >
            {/* top accent */}
            <div style={{ height:4, background:'linear-gradient(90deg,#0891b2,#06b6d4,#38bdf8)' }} />

            <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center' }}>
              {/* Logo / icon */}
              <div style={{
                width:68, height:68, borderRadius:14,
                background: p.nombre==='UPACA' ? '#fff' : 'linear-gradient(135deg,#0891b2,#06b6d4)',
                display:'flex', alignItems:'center', justifyContent:'center',
                overflow:'hidden', flexShrink:0,
                border:'2px solid rgba(6,182,212,0.3)',
                boxShadow:'0 4px 12px rgba(6,182,212,0.2)',
              }}>
                {p.nombre === 'UPACA'
                  ? <img src="/logo-upaca.png" alt="UPACA" style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }} />
                  : <span style={{ fontSize:30 }}>🏭</span>}
              </div>

              {/* Info grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px 24px', minWidth:0 }}>
                {[
                  { label:'🏢 Nombre', val: p.nombre, big:true, color:'#0f172a' },
                  { label:'🪪 RIF', val: p.rif, color:'#0891b2', mono:true },
                  { label:'📞 Teléfono', val: p.telefono||'—', color:'#475569' },
                  { label:'👤 Contacto', val: p.contacto||'—', color:'#475569' },
                  { label:'📍 Dirección', val: p.direccion||'—', color:'#475569', span:2 },
                ].map(f => (
                  <div key={f.label} style={f.span ? { gridColumn:`span ${f.span}` } : {}}>
                    <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.7px', fontWeight:700, marginBottom:3 }}>{f.label}</div>
                    <div style={{ fontSize: f.big?15:13, fontWeight: f.big?800:600, color:f.color, fontFamily:f.mono?'monospace':'inherit', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.val}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                <button onClick={() => openEdit(p)} style={{
                  background:'linear-gradient(135deg,#0891b2,#06b6d4)', color:'white',
                  border:'none', borderRadius:10, padding:'9px 18px',
                  fontSize:13, fontWeight:700, cursor:'pointer',
                  boxShadow:'0 3px 10px rgba(6,182,212,0.35)',
                  display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
                }}>✏️ Editar</button>
                <button onClick={() => handleDelete(p.id)} style={{
                  background:'rgba(239,68,68,0.08)', color:'#dc2626',
                  border:'1px solid rgba(239,68,68,0.3)',
                  borderRadius:10, padding:'9px 18px',
                  fontSize:13, fontWeight:700, cursor:'pointer',
                  display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
                }}>🗑 Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.proveedor ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'} size="md">
        <ProveedorForm proveedor={modal.proveedor} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default Proveedores;
