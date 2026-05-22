import React, { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';
import LogoUploader from './LogoUploader';

/* ── Productos futuros sugeridos por defecto ── */
const DEFAULT_FUTURE_PRODUCTS = [
  { id: 'fp1',  nombre: 'Queso Pasteurizado',    icon: '🧀', cat: 'Lácteo',   status: 'pendiente' },
  { id: 'fp2',  nombre: 'Mantequilla',            icon: '🧈', cat: 'Lácteo',   status: 'pendiente' },
  { id: 'fp3',  nombre: 'Leche en Polvo',          icon: '🥛', cat: 'Lácteo',   status: 'pendiente' },
  { id: 'fp4',  nombre: 'Crema de Leche',          icon: '🍶', cat: 'Lácteo',   status: 'pendiente' },
  { id: 'fp5',  nombre: 'Chicha',                  icon: '🥤', cat: 'Bebida',   status: 'pendiente' },
  { id: 'fp6',  nombre: 'Choco (Bebida de Chocolate)', icon: '🍫', cat: 'Bebida', status: 'pendiente' },
  { id: 'fp7',  nombre: 'Fruit Punch',             icon: '🍹', cat: 'Bebida',   status: 'pendiente' },
  { id: 'fp8',  nombre: 'Yogurt Griego',           icon: '🫙', cat: 'Lácteo',   status: 'pendiente' },
  { id: 'fp9',  nombre: 'Jugo de Guayaba',         icon: '🍈', cat: 'Bebida',   status: 'pendiente' },
  { id: 'fp10', nombre: 'Natilla',                 icon: '🍮', cat: 'Lácteo',   status: 'pendiente' },
];

const Dashboard = () => {
  const { 
    data, tasaBCV, tasaBCVFecha, setCurrentView, config, setConfig,
    transfers, acceptTransfer, rejectTransfer 
  } = useAppData();

  /* ── Future products state ── */
  const [futureProducts, setFutureProducts] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat]   = useState('Lácteo');
  const [showLogoModal, setShowLogoModal] = useState(false);

  useEffect(() => {
    const saved = config.futureProducts;
    if (saved && saved.length > 0) {
      setFutureProducts(saved);
    } else {
      setFutureProducts(DEFAULT_FUTURE_PRODUCTS);
    }
  }, [config.futureProducts]);

  const saveFP = (list) => {
    setFutureProducts(list);
    setConfig({ futureProducts: list });
  };

  const addFutureProduct = () => {
    const name = newProdName.trim();
    if (!name) return;
    const exists = futureProducts.some(p => p.nombre.toLowerCase() === name.toLowerCase());
    if (exists) { alert('Este producto ya existe en la lista.'); return; }
    const icons = { 'Lácteo': '🧀', 'Bebida': '🥤', 'Otro': '📦' };
    const item = { id: 'fp_' + Date.now(), nombre: name, icon: icons[newProdCat] || '📦', cat: newProdCat, status: 'pendiente' };
    saveFP([...futureProducts, item]);
    setNewProdName('');
  };

  const toggleFPStatus = (id) => {
    saveFP(futureProducts.map(p => p.id === id
      ? { ...p, status: p.status === 'pendiente' ? 'aprobado' : 'pendiente' }
      : p
    ));
  };

  const removeFP = (id) => {
    saveFP(futureProducts.filter(p => p.id !== id));
  };

  const hoy = new Date().toISOString().split('T')[0];
  const tasaEsHoy = tasaBCVFecha === hoy;

  const totalComprasUSD = data.compras.reduce((s, c) => s + (c.total || 0), 0);
  const totalVentasUSD  = data.ventas.reduce((s, v) => s + (v.total || 0), 0);
  const pendCobroUSD    = data.ventas.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s + (v.total || 0), 0);
  const utilidadUSD     = totalVentasUSD - totalComprasUSD;
  const factPendientes  = data.ventas.filter(v => v.estadoPago !== 'pagado').length;

  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-VE', { month: 'short' });
      const compras = data.compras.filter(c => c.fecha && c.fecha.startsWith(key)).reduce((s, c) => s + (c.total || 0), 0);
      const ventas  = data.ventas.filter(v => v.fecha && v.fecha.startsWith(key)).reduce((s, v) => s + (v.total || 0), 0);
      months.push({ label, compras, ventas });
    }
    return months;
  };

  const months = getLast6Months();
  const maxVal = Math.max(...months.map(m => Math.max(m.compras, m.ventas)), 1);

  const C = {
    blue:   '#1e40af',
    green:  '#059669',
    orange: '#d97706',
    purple: '#7c3aed',
    red:    '#dc2626',
    cyan:   '#0891b2',
  };

  const kpis = [
    {
      label: 'Compras UPACA',
      usd: totalComprasUSD,
      icon: '📥',
      bg: 'linear-gradient(135deg, #ecfeff, #cffafe)',
      accent: '#06b6d4',
      color: '#164e63',
      subColor: '#0891b2',
      glow: 'rgba(6,182,212,0.12)',
      border: 'rgba(6,182,212,0.3)',
      note: 'Pago en USD',
      view: 'compras'
    },
    {
      label: 'Ventas Totales',
      usd: totalVentasUSD,
      icon: '📤',
      bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      accent: '#10b981',
      color: '#14532d',
      subColor: '#16a34a',
      glow: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.3)',
      note: 'Cliente paga Bs.',
      view: 'ventas'
    },
    {
      label: 'Por Cobrar',
      usd: pendCobroUSD,
      icon: '⏳',
      bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      accent: '#f59e0b',
      color: '#78350f',
      subColor: '#d97706',
      glow: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
      note: `${factPendientes} factura(s)`,
      view: 'ventas'
    },
    {
      label: 'Utilidad',
      usd: utilidadUSD,
      icon: '💰',
      bg: utilidadUSD >= 0
        ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)'
        : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
      accent: utilidadUSD >= 0 ? '#7c3aed' : '#ef4444',
      color: utilidadUSD >= 0 ? '#4c1d95' : '#7f1d1d',
      subColor: utilidadUSD >= 0 ? '#7c3aed' : '#dc2626',
      glow: utilidadUSD >= 0 ? 'rgba(139,92,246,0.12)' : 'rgba(239,68,68,0.12)',
      border: utilidadUSD >= 0 ? 'rgba(139,92,246,0.3)' : 'rgba(239,68,68,0.3)',
      note: utilidadUSD >= 0 ? 'Positiva ▲' : 'Negativa ▼',
      view: 'contabilidad'
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0f172a' }}>

      {/* ── BRAND HEADER ── */}
      <div style={{
        background: '#ffffff', borderRadius: '18px', padding: '24px 28px',
        marginBottom: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo-upaca.png" alt="UPACA" style={{ height: 48, objectFit: 'contain' }} />
            <div style={{ width: '2px', height: '36px', background: '#e2e8f0' }} />
            <img
              src={config?.logoUrl || '/logo-marcosbarco.png'}
              alt="Logo Empresa"
              style={{ height: 48, objectFit: 'contain', borderRadius: 6 }}
              onError={e => { e.target.src = '/logo-marcosbarco.png'; }}
            />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Administración Financiera</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e40af' }}>UPACA → PASTORCA</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Rep. Ventas: <strong style={{ color: '#1e40af' }}>MARCOS BARCO</strong></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {[
            { label: 'Clientes', val: data.clientes.length, color: C.blue },
            { label: 'Compras', val: data.compras.length, color: C.green },
            { label: 'Ventas', val: data.ventas.length, color: C.orange },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
            </div>
          ))}

          {/* Botón cambiar logo */}
          <button
            onClick={() => setShowLogoModal(true)}
            title="Cambiar logo de la pre-factura"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
              color: 'white', border: 'none', borderRadius: 12,
              padding: '9px 16px', fontSize: 12, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🖼️ Cambiar Logo
          </button>
        </div>
      </div>
      
      {/* ── BUZÓN DE TRANSFERENCIAS ── */}
      {transfers.length > 0 && (
        <div className="animate-pop" style={{
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderRadius: '18px', padding: '20px', marginBottom: '24px',
          border: '2px solid #3b82f6', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>🔔</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e40af', fontWeight: 800 }}>Transferencias Recibidas</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af', opacity: 0.8 }}>Tienes {transfers.length} elementos pendientes por revisar</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
            {transfers.map(t => (
              <div key={t.id} style={{
                background: 'white', padding: '16px', borderRadius: '14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #bfdbfe'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '4px' }}>
                    {t.type === 'producto' ? '📦 Producto' : '👥 Cliente'} de {t.fromName}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.type === 'producto' ? t.data.nombre : (t.data.nombreCompleto || t.data.razonSocial)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                  <button 
                    onClick={() => acceptTransfer(t)} 
                    style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}
                  >Aceptar</button>
                  <button 
                    onClick={() => rejectTransfer(t.id)} 
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '18px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <div key={k.label} onClick={() => setCurrentView(k.view)} style={{
            background: k.bg, borderRadius: '18px', padding: '22px 20px',
            boxShadow: `0 8px 24px ${k.glow}`,
            border: `1px solid ${k.border}`,
            transition: 'transform .2s, box-shadow .2s', cursor: 'pointer',
            position: 'relative', overflow: 'hidden',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 28px ${k.glow.replace('0.12', '0.22')}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 24px ${k.glow}`; }}
          >
            <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 80, opacity: 0.18, lineHeight: 1, pointerEvents: 'none' }}>{k.icon}</div>
            <div style={{ position: 'absolute', top: 14, right: 14, color: k.color, opacity: 0.5, fontSize: 14, fontWeight: 700 }}>→</div>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{k.icon}</div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: k.color, marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: k.color, letterSpacing: '-0.5px', lineHeight: 1 }}>$ {U.fmt(k.usd)}</div>
            {tasaBCV > 0 && <div style={{ fontSize: '13px', color: k.color, marginTop: '8px', fontWeight: 700 }}>{U.fmtBs(k.usd, tasaBCV)}</div>}
            <div style={{ fontSize: '11px', color: k.subColor, marginTop: '8px', fontWeight: 600 }}>{k.note}</div>
          </div>
        ))}
      </div>

      {/* ── CHART + BCV ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '22px' }}>

        {/* Bar Chart */}
        <div style={{ background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Resumen Financiero</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Últimos 6 meses — USD</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.blue, display: 'inline-block' }} /> Compras
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: C.green, display: 'inline-block' }} /> Ventas
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
            {months.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', flex: 1, width: '100%' }}>
                  <div title={`Compras: $${U.fmt(m.compras)}`} style={{
                    flex: 1, borderRadius: '6px 6px 0 0',
                    background: `linear-gradient(180deg,${C.blue},#60a5fa)`,
                    height: `${Math.max((m.compras / maxVal) * 100, m.compras > 0 ? 8 : 2)}%`,
                    minHeight: '3px', transition: 'height .5s ease',
                  }} />
                  <div title={`Ventas: $${U.fmt(m.ventas)}`} style={{
                    flex: 1, borderRadius: '6px 6px 0 0',
                    background: `linear-gradient(180deg,${C.green},#34d399)`,
                    height: `${Math.max((m.ventas / maxVal) * 100, m.ventas > 0 ? 8 : 2)}%`,
                    minHeight: '3px', transition: 'height .5s ease',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'capitalize' }}>{m.label}</div>
              </div>
            ))}
          </div>
          {data.compras.length === 0 && data.ventas.length === 0 && (
            <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '13px', marginTop: '-100px' }}>
              Registra compras y ventas para ver el gráfico
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* BCV Card */}
          <div style={{
            background: tasaEsHoy && tasaBCV > 0
              ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
              : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            borderRadius: '18px', padding: '22px 20px',
            boxShadow: tasaEsHoy && tasaBCV > 0
              ? '0 8px 24px rgba(16,185,129,0.12)'
              : '0 8px 24px rgba(245,158,11,0.12)',
            border: tasaEsHoy && tasaBCV > 0
              ? '1px solid rgba(16,185,129,0.3)'
              : '1px solid rgba(245,158,11,0.3)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', bottom: -10, right: -10, fontSize: 80, opacity: 0.18, lineHeight: 1, pointerEvents: 'none' }}>💱</div>
            <div style={{
              fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px',
              color: tasaEsHoy && tasaBCV > 0 ? '#14532d' : '#78350f', marginBottom: '8px'
            }}>
              💱 Tasa BCV Activa
            </div>
            {tasaBCV > 0 ? (
              <>
                <div style={{
                  fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1,
                  color: tasaEsHoy && tasaBCV > 0 ? '#14532d' : '#78350f'
                }}>
                  Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(tasaBCV)}
                </div>
                <div style={{
                  fontSize: '12px', fontWeight: 600, marginTop: '8px',
                  color: tasaEsHoy && tasaBCV > 0 ? '#16a34a' : '#d97706'
                }}>
                  1 USD = Bs. {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(tasaBCV)}
                </div>
                <div style={{
                  fontSize: '11px', fontWeight: 700, marginTop: '8px',
                  color: tasaEsHoy && tasaBCV > 0 ? '#14532d' : '#9a3412'
                }}>
                  {tasaEsHoy ? '✅ Tasa del día' : '⚠️ Actualizar en el encabezado'}
                </div>
              </>
            ) : (
              <div style={{
                fontSize: '15px', fontWeight: 800,
                color: '#78350f', lineHeight: '1.4'
              }}>
                ⚠️ Haz clic en el encabezado para ingresar la tasa BCV del día
              </div>
            )}
          </div>

          {/* Mini counters */}
          {[
            { label: 'Clientes', val: data.clientes.length, icon: '👥', color: C.blue, view: 'clientes' },
            { label: 'Facturas Compra', val: data.compras.length, icon: '🧾', color: C.cyan, view: 'compras' },
            { label: 'Pre-Facturas', val: data.ventas.length, icon: '📋', color: factPendientes > 0 ? C.orange : C.green, view: 'ventas' },
          ].map(m => (
            <div key={m.label} onClick={() => setCurrentView(m.view)} style={{
              background: '#fff', borderRadius: '14px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 2px 8px rgba(15,23,42,0.06)', cursor: 'pointer',
              border: '1px solid #e2e8f0', transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '12px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                background: `${m.color}12`,
              }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{m.label}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: m.color }}>{m.val}</div>
              </div>
              <div style={{ fontSize: '18px', color: '#cbd5e1' }}>›</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           ── ANALYTICS: TOP PRODUCTOS + CLIENTES ──
      ══════════════════════════════════════════════════════════════ */}
      {(() => {
        // ── Calcular Top Productos desde items de ventas ──
        const prodMap = {};
        data.ventas.forEach(v => {
          (v.items || []).forEach(it => {
            const key = it.descripcion || it.codigo || 'Sin nombre';
            if (!prodMap[key]) prodMap[key] = { nombre: key, codigo: it.codigo || '', cantidad: 0, total: 0 };
            prodMap[key].cantidad += Number(it.cantidad) || 0;
            prodMap[key].total    += Number(it.total)    || 0;
          });
        });
        const topProds = Object.values(prodMap).sort((a, b) => b.total - a.total);
        const maxProd  = topProds[0]?.total || 1;

        // ── Calcular Top Clientes ──
        const clientMap = {};
        data.ventas.forEach(v => {
          const key = v.clienteNombre || 'Desconocido';
          if (!clientMap[key]) clientMap[key] = { nombre: key, total: 0, facturas: 0 };
          clientMap[key].total    += Number(v.total) || 0;
          clientMap[key].facturas += 1;
        });
        const totalVentas = Object.values(clientMap).reduce((s, c) => s + c.total, 0) || 1;
        const topClients  = Object.values(clientMap).sort((a, b) => b.total - a.total);

        const COLORS = [
          '#2563eb','#059669','#d97706','#7c3aed','#dc2626',
          '#0891b2','#be185d','#15803d','#92400e','#1d4ed8',
        ];

        const cardStyle = {
          background: '#fff', borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(15,23,42,0.07)', border: '1px solid #e2e8f0',
        };
        const headerStyle = (bg) => ({
          background: bg, padding: '16px 22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        });

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>

            {/* ── PANEL 1: TOP PRODUCTOS ── */}
            <div style={cardStyle}>
              <div style={headerStyle('linear-gradient(135deg,#1e3a8a,#2563eb)')}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Estadísticas</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>📊 Productos — Más a Menos Vendido</div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                  {topProds.length} productos<br />en {data.ventas.length} facturas
                </div>
              </div>

              <div style={{ padding: '18px 22px' }}>
                {topProds.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
                    Sin datos de ventas aún
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                    {topProds.map((p, i) => {
                      const pct = Math.round((p.total / maxProd) * 100);
                      const color = COLORS[i % COLORS.length];
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                      return (
                        <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Rank */}
                          <div style={{
                            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                            background: i < 3 ? 'transparent' : `${color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: i < 3 ? 18 : 11, fontWeight: 800, color,
                          }}>{medal}</div>

                          {/* Name + bar */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                                {p.nombre}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 800, color, whiteSpace: 'nowrap' }}>
                                $ {U.fmt(p.total)} · {p.cantidad} uds
                              </span>
                            </div>
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: `linear-gradient(90deg,${color},${color}99)`,
                                borderRadius: 20, transition: 'width 0.6s ease',
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── PANEL 2: % POR CLIENTE ── */}
            <div style={cardStyle}>
              <div style={headerStyle('linear-gradient(135deg,#064e3b,#059669)')}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Estadísticas</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>👥 Participación por Cliente</div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
                  {topClients.length} clientes<br />$ {U.fmt(totalVentas)} total
                </div>
              </div>

              <div style={{ padding: '18px 22px' }}>
                {topClients.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                    Sin ventas registradas aún
                  </div>
                ) : (
                  <>
                    {/* Donut visual simple */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {topClients.map((c, i) => {
                        const pct = (c.total / totalVentas) * 100;
                        const color = COLORS[i % COLORS.length];
                        return (
                          <div key={c.nombre} title={`${c.nombre}: ${pct.toFixed(1)}%`}
                            style={{ height: 10, borderRadius: 20, background: color, width: `${Math.max(pct, 2)}%`, transition: 'width 0.6s ease' }}
                          />
                        );
                      })}
                    </div>

                    {/* Lista */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                      {topClients.map((c, i) => {
                        const pct = (c.total / totalVentas) * 100;
                        const color = COLORS[i % COLORS.length];
                        return (
                          <div key={c.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Color dot */}
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />

                            {/* Name + bar */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
                                  {c.nombre}
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                  <span style={{
                                    fontSize: 11, fontWeight: 900, color: 'white',
                                    background: color, borderRadius: 20, padding: '1px 8px',
                                  }}>
                                    {pct.toFixed(1)}%
                                  </span>
                                  <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                                    $ {U.fmt(c.total)} · {c.facturas} fact.
                                  </span>
                                </div>
                              </div>
                              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 20, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${pct}%`,
                                  background: `linear-gradient(90deg,${color},${color}88)`,
                                  borderRadius: 20, transition: 'width 0.6s ease',
                                }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        );
      })()}

      {/* ── CATÁLOGO DE PRODUCTOS FUTUROS ── */}
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 22,
        boxShadow: '0 4px 24px rgba(15,23,42,0.08)', border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4338ca)',
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>📋</div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Planificación</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Catálogo de Productos Futuros</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {futureProducts.filter(p => p.status === 'aprobado').length} aprobados · {futureProducts.filter(p => p.status === 'pendiente').length} pendientes
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span onClick={() => setCurrentView('productos')} style={{
              fontSize: 13, color: 'white', fontWeight: 700, cursor: 'pointer',
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 10, padding: '10px 18px', transition: 'all .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >📦 Ver Catálogo Actual</span>
            <button onClick={() => setShowCatalog(!showCatalog)} style={{
              background: showCatalog ? 'rgba(255,255,255,0.25)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              border: 'none', color: 'white', borderRadius: 10, padding: '10px 22px',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              boxShadow: showCatalog ? 'none' : '0 4px 16px rgba(124,58,237,0.5)',
              transition: 'all .2s',
            }}>{showCatalog ? '▲ Cerrar' : '▼ Gestionar Lista'}</button>
          </div>
        </div>

        {/* Expandable content */}
        {showCatalog && (
          <div style={{ padding: '24px 28px' }}>

            {/* Add new product row */}
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22,
              background: 'linear-gradient(135deg,#f8fafc,#eef2ff)', borderRadius: 14,
              padding: '16px 20px', border: '2px dashed #c7d2fe',
            }}>
              <div style={{ fontSize: 22 }}>➕</div>
              <input
                type="text" placeholder="Nombre del producto a agregar..."
                value={newProdName} onChange={e => setNewProdName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFutureProduct()}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 10, border: '2px solid #e2e8f0',
                  fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <select value={newProdCat} onChange={e => setNewProdCat(e.target.value)} style={{
                padding: '11px 14px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: 13,
                fontWeight: 700, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', outline: 'none',
                color: newProdCat === 'Lácteo' ? '#1e40af' : newProdCat === 'Bebida' ? '#059669' : '#64748b',
              }}>
                <option value="Lácteo">🧀 Lácteo</option>
                <option value="Bebida">🥤 Bebida</option>
                <option value="Otro">📦 Otro</option>
              </select>
              <button onClick={addFutureProduct} style={{
                background: 'linear-gradient(135deg,#4338ca,#6366f1)', color: 'white',
                border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 14,
                fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              }}>Agregar</button>
            </div>

            {/* Product list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {futureProducts.map(p => {
                const approved = p.status === 'aprobado';
                const catColor = p.cat === 'Lácteo' ? '#1e40af' : p.cat === 'Bebida' ? '#059669' : '#64748b';
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: approved ? 'linear-gradient(135deg,#f0fdf4,#ecfdf5)' : '#fff',
                    borderRadius: 14, padding: '14px 18px',
                    border: approved ? '2px solid #86efac' : '1px solid #e2e8f0',
                    boxShadow: approved ? '0 2px 10px rgba(5,150,105,0.1)' : '0 1px 6px rgba(0,0,0,0.04)',
                    transition: 'all .2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${catColor}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = approved ? '0 2px 10px rgba(5,150,105,0.1)' : '0 1px 6px rgba(0,0,0,0.04)'; }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                      background: `${catColor}10`, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 22,
                    }}>{p.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700, color: '#0f172a',
                        textDecoration: approved ? 'none' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{p.nombre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: catColor,
                          background: `${catColor}10`, padding: '2px 8px', borderRadius: 6,
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                        }}>{p.cat}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 800,
                          color: approved ? '#059669' : '#d97706',
                          background: approved ? '#dcfce7' : '#fef3c7',
                          padding: '2px 8px', borderRadius: 6,
                        }}>{approved ? '✓ APROBADO' : '⏳ PENDIENTE'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleFPStatus(p.id)} title={approved ? 'Marcar pendiente' : 'Aprobar'} style={{
                        width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: approved ? '#dcfce7' : '#eef2ff', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >{approved ? '↩️' : '✅'}</button>
                      <button onClick={() => removeFP(p.id)} title="Eliminar" style={{
                        width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: '#fef2f2', fontSize: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {futureProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Lista vacía</div>
                <div style={{ fontSize: 13 }}>Agrega productos usando el campo de arriba</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RECENT TABLES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Recent Purchases */}
        <div style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>📥 Compras Recientes</div>
            <span onClick={() => setCurrentView('compras')} style={{
              fontSize: '12px', color: C.blue, fontWeight: 700, cursor: 'pointer',
              background: `${C.blue}10`, padding: '4px 12px', borderRadius: '20px',
            }}>Ver todo →</span>
          </div>
          {data.compras.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#cbd5e1', fontSize: '13px' }}>Sin compras registradas</div>
          ) : (
            <div>
              {[...data.compras].reverse().slice(0, 5).map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', padding: '13px 22px',
                  borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', transition: 'background .15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${C.blue}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginRight: '12px', flexShrink: 0 }}>🧾</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Fact. {c.numeroFactura}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{U.fmtDate(c.fecha)} · {c.proveedorNombre}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: C.blue }}>$ {U.fmt(c.total)}</div>
                    {tasaBCV > 0 && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{U.fmtBs(c.total, tasaBCV)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>📤 Ventas Recientes</div>
            <span onClick={() => setCurrentView('ventas')} style={{
              fontSize: '12px', color: C.green, fontWeight: 700, cursor: 'pointer',
              background: `${C.green}10`, padding: '4px 12px', borderRadius: '20px',
            }}>Ver todo →</span>
          </div>
          {data.ventas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#cbd5e1', fontSize: '13px' }}>Sin ventas registradas</div>
          ) : (
            <div>
              {[...data.ventas].reverse().slice(0, 5).map((v, i) => {
                const estadoColor = v.estadoPago === 'pagado' ? C.green : v.estadoPago === 'vencido' ? C.red : C.orange;
                return (
                  <div key={v.id} style={{
                    display: 'flex', alignItems: 'center', padding: '13px 22px',
                    borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', transition: 'background .15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${C.green}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginRight: '12px', flexShrink: 0 }}>👤</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.clienteNombre}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{U.fmtDate(v.fecha)}{v.fechaEntrega ? ` · Entrega: ${U.fmtDate(v.fechaEntrega)}` : ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: C.green }}>$ {U.fmt(v.total)}</div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: estadoColor, background: `${estadoColor}12`, padding: '2px 8px', borderRadius: '20px' }}>{v.estadoPago}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: '22px', background: 'linear-gradient(135deg,#0f172a,#1e3a6e)',
        borderRadius: '18px', padding: '20px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 6px 20px rgba(15,23,42,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo-upaca.png" alt="UPACA" style={{ height: 36, objectFit: 'contain', filter: 'brightness(1.1)' }} />
          <img src="/logo-pastorca.png" alt="PASTORCA" style={{ height: 36, objectFit: 'contain', filter: 'brightness(1.1)' }} />
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Distribuidora de Productos Lácteos</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>PASTORCA <span style={{ color: '#93c5fd', fontWeight: 400, fontSize: '14px' }}>× UPACA</span></div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>© 2026 — Sistema Administrativo v2.0</div>
      </div>

      {/* ── MODAL: CAMBIAR LOGO ── */}
      <Modal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        title="🖼️ Cambiar Logo de la Pre-Factura"
        size="sm"
      >
        <LogoUploader onClose={() => setShowLogoModal(false)} />
      </Modal>

    </div>
  );
};

export default Dashboard;
