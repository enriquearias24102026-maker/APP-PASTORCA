import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';
import ProductoForm from './ProductoForm';

/* ── Metadatos por categoría ─────────────────────────────────────────── */
const CAT_META = {
  'Leche':     { color:'#2563eb', light:'#eff6ff', border:'#bfdbfe', icon:'🥛', group:'LÁCTEOS', grad:'linear-gradient(135deg,#1e40af,#2563eb)' },
  'Queso':     { color:'#b45309', light:'#fefce8', border:'#fef08a', icon:'🧀', group:'LÁCTEOS', grad:'linear-gradient(135deg,#92400e,#b45309)' },
  'Yogurt':    { color:'#0891b2', light:'#ecfeff', border:'#a5f3fc', icon:'🫙', group:'LÁCTEOS', grad:'linear-gradient(135deg,#0e7490,#0891b2)' },
  'Mantequilla': { color:'#d97706', light:'#fff7ed', border:'#fed7aa', icon:'🧈', group:'LÁCTEOS', grad:'linear-gradient(135deg,#b45309,#d97706)' },
  'Naranjada': { color:'#ea580c', light:'#fff7ed', border:'#fdba74', icon:'🍊', group:'JUGOS Y BEBIDAS', grad:'linear-gradient(135deg,#9a3412,#ea580c)' },
  'Néctar':    { color:'#059669', light:'#f0fdf4', border:'#bbf7d0', icon:'🍹', group:'JUGOS Y BEBIDAS', grad:'linear-gradient(135deg,#047857,#059669)' },
  'Gelatina':  { color:'#7c3aed', light:'#faf5ff', border:'#e9d5ff', icon:'🍮', group:'POSTRES', grad:'linear-gradient(135deg,#5b21b6,#7c3aed)' },
};

const getCatMeta = (cat) => {
  if (!cat) return { color:'#6366f1', light:'#f5f3ff', border:'#ddd6fe', icon:'📦', group:'OTROS', grad:'linear-gradient(135deg,#4338ca,#6366f1)' };
  const meta = CAT_META[cat];
  if (meta) return meta;
  const lower = cat.toLowerCase();
  if (lower.includes('leche') || lower.includes('queso')) return { ...CAT_META['Leche'], group:'LÁCTEOS' };
  if (lower.includes('jugo') || lower.includes('bebida')) return { ...CAT_META['Néctar'], group:'JUGOS Y BEBIDAS' };
  return { color:'#6366f1', light:'#f5f3ff', border:'#ddd6fe', icon:'📦', group:'OTROS', grad:'linear-gradient(135deg,#4338ca,#6366f1)' };
};

const Productos = () => {
  const { data, addItem, removeItem, updateItem, setCurrentView, triggerShare, clearLocalCache } = useAppData();
  const [modal, setModal] = useState({ open: false, producto: null });
  const [filtro, setFiltro] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [notif, setNotif] = useState(null);

  const showNotif = (msg, type = 'info') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4000);
  };

  const openNew    = ()         => setModal({ open: true, producto: null });
  const openEdit   = (producto) => setModal({ open: true, producto });
  const closeModal = ()         => setModal({ open: false, producto: null });

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        await updateItem('productos', formData);
        showNotif('✅ Producto actualizado', 'success');
      } else {
        await addItem('productos', formData);
        showNotif('✅ Producto registrado', 'success');
      }
      closeModal();
    } catch (e) {
      showNotif('❌ Error: ' + e.message, 'error');
    }
  };

  // ══════════════════════════════════════════════════════════════════════
  // BORRADO CON MODAL DE CONFIRMACIÓN PROFESIONAL + RESTAURAR
  // Usa referencia al objeto completo, no solo el ID
  // ══════════════════════════════════════════════════════════════════════
  const [deleteTarget, setDeleteTarget] = useState(null); // producto completo
  const [lastDeleted, setLastDeleted] = useState(null);   // { descripcion, data, timer }

  const handleDeleteClick = (producto) => {
    setDeleteTarget(producto);
  };

  const cancelDelete = () => setDeleteTarget(null);

  const confirmAndDelete = async () => {
    if (!deleteTarget) return;
    const { id, descripcion } = deleteTarget;
    const productCopy = { ...deleteTarget };
    setDeleteTarget(null);
    setDeletingId(id);

    try {
      await removeItem('productos', id);

      // Show undo bar for 10 seconds
      if (lastDeleted?.timer) clearTimeout(lastDeleted.timer);
      const timer = setTimeout(() => setLastDeleted(null), 10000);
      setLastDeleted({ id, descripcion, data: productCopy, timer });

      showNotif(`🗑️ "${descripcion}" eliminado`, 'success');
    } catch (e) {
      showNotif('❌ Error al eliminar: ' + e.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = async () => {
    if (!lastDeleted?.data) return;
    try {
      const { id, ...restoreData } = lastDeleted.data;
      await addItem('productos', restoreData);
      showNotif(`✅ "${lastDeleted.descripcion}" restaurado exitosamente`, 'success');
      if (lastDeleted.timer) clearTimeout(lastDeleted.timer);
      setLastDeleted(null);
    } catch (e) {
      showNotif('❌ Error al restaurar: ' + e.message, 'error');
    }
  };

  const cleanDuplicates = async () => {
    const prods = data.productos || [];
    const seen = new Set();
    const toDelete = [];
    prods.forEach(p => {
      const desc = (p.descripcion || '').toLowerCase().trim();
      if (seen.has(desc)) toDelete.push(p); else seen.add(desc);
    });
    if (toDelete.length === 0) { showNotif('No hay duplicados', 'success'); return; }
    showNotif(`Eliminando ${toDelete.length} duplicados...`, 'info');
    for (const p of toDelete) {
      await removeItem('productos', p.id);
    }
    showNotif(`✅ ${toDelete.length} duplicados eliminados`, 'success');
  };

  const filtered = useMemo(() => {
    return (data.productos || []).filter(p => {
      const search = filtro.toLowerCase();
      const matchText = !search ||
        (p.descripcion || '').toLowerCase().includes(search) ||
        (p.codigo || '').toLowerCase().includes(search);
      const matchCat = !catFilter || p.categoria === catFilter;
      return matchText && matchCat;
    });
  }, [data.productos, filtro, catFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      const meta = getCatMeta(p.categoria);
      const gName = meta.group;
      if (!groups[gName]) groups[gName] = { name: gName, items: [], icon: meta.icon };
      groups[gName].items.push(p);
    });
    const order = ['LÁCTEOS', 'JUGOS Y BEBIDAS', 'POSTRES', 'OTROS'];
    return Object.values(groups).sort((a, b) => {
      const ia = order.indexOf(a.name);
      const ib = order.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [filtered]);

  const catCounts = (data.productos || []).reduce((acc, p) => {
    acc[p.categoria] = (acc[p.categoria] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="view-container">
      {/* ── Notificación ── */}
      {notif && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 10000,
          background: notif.type === 'error' ? '#dc2626' : notif.type === 'success' ? '#059669' : '#2563eb',
          color: 'white', padding: '14px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14,
          boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          animation: 'slideIn 0.3s ease',
        }}>
          {notif.msg}
          <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }`}</style>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
        borderRadius: 20, padding: '28px 36px', marginBottom: 28,
        boxShadow: '0 10px 40px rgba(67,56,202,0.45)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>PASTORCA · Catálogo</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: 'white' }}>📦 Catálogo de Productos</h2>
          <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {data.productos?.length || 0} productos · Agrupados por categoría
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={cleanDuplicates} className="btn" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.4)', fontSize: 12 }}>
            🧹 Limpiar Duplicados
          </button>
          <button onClick={() => setCurrentView('dashboard')} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>← Panel</button>
          <button onClick={openNew} className="btn" style={{ background: 'white', color: '#1e1b4b', fontWeight: 900, padding: '10px 20px' }}>＋ Nuevo Producto</button>
        </div>
      </div>

      {/* ── Búsqueda y filtros ── */}
      <div style={{ background: 'white', borderRadius: 18, padding: 20, marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, fontSize: 16 }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por descripción o código..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 42px', borderRadius: 12, border: '2px solid #f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', ...Object.keys(catCounts).sort()].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              background: catFilter === cat ? '#1e1b4b' : '#f1f5f9',
              color: catFilter === cat ? 'white' : '#64748b',
              border: 'none', transition: 'all 0.2s',
            }}>{cat === '' ? 'TODOS' : cat.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* ── Lista agrupada ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {grouped.map(group => (
          <div key={group.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{group.icon}</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b', letterSpacing: 1 }}>{group.name}</h3>
              <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #e2e8f0, transparent)' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', background: '#f8fafc', padding: '4px 12px', borderRadius: 20 }}>{group.items.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {group.items.map(p => {
                const m = getCatMeta(p.categoria);
                const isDeleting = deletingId === p.id;
                return (
                  <div key={p.id} style={{
                    background: 'white', borderRadius: 16, border: `1px solid ${m.border}`, padding: 20,
                    position: 'relative', overflow: 'hidden', transition: 'all 0.25s',
                    opacity: isDeleting ? 0.3 : 1,
                    transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: m.grad }} />

                    {/* Nombre + Categoría */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: m.color, marginBottom: 4 }}>{(p.categoria || '').toUpperCase()}</div>
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{p.descripcion}</h4>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                          Ref: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.codigo}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 24, background: m.light, width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{m.icon}</div>
                    </div>

                    {/* Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14, background: '#f8fafc', padding: 10, borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Presentación</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{p.presentacion}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Embalaje</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{p.unidadesEmbalaje} × {p.embalaje}</div>
                      </div>
                    </div>

                    {/* Precio + Acciones */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Costo USD</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>$ {U.fmt(p.precioCosto)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} title="Editar" style={{ border: 'none', background: '#f1f5f9', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>✏️</button>
                        <button onClick={() => triggerShare(p, 'producto')} title="Compartir" style={{ border: 'none', background: '#f1f5f9', width: 34, height: 34, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>📤</button>
                        <button
                          onClick={() => handleDeleteClick(p)}
                          disabled={isDeleting}
                          title="Eliminar"
                          style={{ border: 'none', background: isDeleting ? '#e5e7eb' : '#fee2e2', color: '#dc2626', width: 34, height: 34, borderRadius: 8, cursor: isDeleting ? 'wait' : 'pointer', fontSize: 14 }}
                        >
                          {isDeleting ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODAL DE CONFIRMACIÓN DE BORRADO — Profesional y centrado   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          onClick={cancelDelete}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10001, backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 20, padding: '32px 36px',
              maxWidth: 440, width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.25s ease',
            }}
          >
            {/* Icono de alerta */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>🗑️</div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f172a' }}>¿Eliminar este producto?</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>Esta acción no se puede deshacer (pero podrá restaurarlo por 10 segundos)</p>
            </div>

            {/* Detalles del producto */}
            <div style={{
              background: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 24,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                {deleteTarget.descripcion}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                <div><span style={{ color: '#94a3b8' }}>Código:</span> <strong>{deleteTarget.codigo || '—'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Categoría:</span> <strong>{deleteTarget.categoria || '—'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Presentación:</span> <strong>{deleteTarget.presentacion || '—'}</strong></div>
                <div><span style={{ color: '#94a3b8' }}>Costo:</span> <strong style={{ color: '#059669' }}>$ {U.fmt(deleteTarget.precioCosto)}</strong></div>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={cancelDelete}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: '2px solid #e2e8f0',
                  background: 'white', color: '#475569', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >Cancelar</button>
              <button
                onClick={confirmAndDelete}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)', color: 'white',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220,38,38,0.4)',
                  transition: 'all 0.15s',
                }}
              >🗑️ Sí, Eliminar</button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          `}</style>
        </div>
      )}

      {/* ── Barra de Restaurar Producto Borrado ── */}
      {lastDeleted && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white',
          padding: '16px 28px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)', zIndex: 10000, minWidth: 400,
          border: '1px solid rgba(255,255,255,0.15)', animation: 'slideIn 0.3s ease',
        }}>
          <span style={{ fontSize: 24 }}>🗑️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>"{lastDeleted.descripcion}" eliminado</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Puede restaurar este producto</div>
          </div>
          <button
            onClick={handleRestore}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none',
              borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
            }}
          >↩ RESTAURAR</button>
          <button
            onClick={() => { if (lastDeleted.timer) clearTimeout(lastDeleted.timer); setLastDeleted(null); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}
          >✕</button>
        </div>
      )}

      {/* ── Estado vacío ── */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 20, border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <h3 style={{ margin: 0, fontSize: 20, color: '#475569' }}>Sin resultados</h3>
          <button onClick={() => { setFiltro(''); setCatFilter(''); }} style={{ marginTop: 12, background: 'none', border: 'none', color: '#4338ca', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>Limpiar filtros</button>
        </div>
      )}

      <Modal isOpen={modal.open} onClose={closeModal} title={modal.producto ? '✏️ Editar Producto' : '＋ Nuevo Producto'} size="md">
        <ProductoForm producto={modal.producto} onSave={handleSave} onCancel={closeModal} />
      </Modal>
    </div>
  );
};

export default Productos;
