import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';
import Modal from './Modal';
import ComprasPagos from './ComprasPagos';

/* ── pequeño badge de estado ───────────────────────────────────────────── */
const EstadoBadge = ({ estado }) => {
  const MAP = {
    pagado:    { label:'PAGADO',    bg:'rgba(16,185,129,0.15)', color:'#059669', dot:'#10b981' },
    pendiente: { label:'PENDIENTE', bg:'rgba(245,158,11,0.15)', color:'#b45309', dot:'#f59e0b' },
    vencido:   { label:'VENCIDO',   bg:'rgba(239,68,68,0.15)',  color:'#dc2626', dot:'#ef4444' },
    'por pagar':{ label:'POR PAGAR',bg:'rgba(239,68,68,0.15)', color:'#dc2626', dot:'#ef4444' },
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

/* ── estilos de tabla ───────────────────────────────────────────────────── */
const mkTh = (accent) => ({
  padding:'11px 16px', textAlign:'left', fontSize:'11px', fontWeight:800,
  textTransform:'uppercase', letterSpacing:'0.9px', color:'#0f172a',
  background:`${accent}12`, borderBottom:`2px solid ${accent}40`,
  whiteSpace:'nowrap',
});
const TD = { padding:'12px 16px', fontSize:'12.5px', color:'#1e293b', borderBottom:'1px solid #e2e8f0', verticalAlign:'middle' };

/* ════════════════════════════════════════════════════════════════════════ */
const Contabilidad = () => {
  const { data, saveToLS, updateItem, tasaBCV } = useAppData();

  const cxcItems = data.ventas.filter(v => v.estadoPago !== 'pagado');
  const totalCxC = cxcItems.reduce((s,v) => s+(v.total||0), 0);

  const cxpItems = data.compras.filter(c => {
    const pagado = (Array.isArray(c.pagos) ? c.pagos : []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
    return (c.total - pagado) > 0.01;
  });
  const totalCxP = cxpItems.reduce((s,c) => {
    const pagado = (Array.isArray(c.pagos) ? c.pagos : []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
    return s + (c.total - pagado);
  }, 0);

  const totalIngresos = data.ventas.reduce((s,v) => s+(v.total||0), 0);
  const totalCostos   = data.compras.reduce((s,c) => s+(c.total||0), 0);
  const utilidad      = totalIngresos - totalCostos;
  const margen        = totalIngresos > 0 ? ((utilidad/totalIngresos)*100) : 0;
  const pagadasUpaca  = data.compras.filter(c => {
    const pagado = (Array.isArray(c.pagos) ? c.pagos : []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
    return (c.total - pagado) <= 0.01;
  });

  const [pagosCompra, setPagosCompra] = React.useState(null);

  const handleSavePagos = (updated) => {
    updateItem('compras', updated);
    setPagosCompra(null);
  };

  const handleMarkCobrada = async (venta) => {
    const nuevoEstado = venta.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    await updateItem('ventas', { ...venta, estadoPago: nuevoEstado });
  };

  /* ── KPI cards ── */
  const kpis = [
    {
      label:'Ingresos Totales', sub:'Pre-facturas de Ventas',
      value:`$ ${U.fmt(totalIngresos)}`,
      bs: tasaBCV>0 ? U.fmtBs(totalIngresos,tasaBCV) : null,
      icon:'💰', bg:'linear-gradient(135deg,#059669,#10b981)',
      glow:'rgba(16,185,129,0.4)', border:'rgba(16,185,129,0.5)',
    },
    {
      label:'Costos Totales', sub:'Compras a UPACA',
      value:`$ ${U.fmt(totalCostos)}`,
      bs: tasaBCV>0 ? U.fmtBs(totalCostos,tasaBCV) : null,
      icon:'📦', bg:'linear-gradient(135deg,#0891b2,#06b6d4)',
      glow:'rgba(6,182,212,0.4)', border:'rgba(6,182,212,0.5)',
    },
    {
      label: utilidad>=0 ? 'Utilidad Bruta' : 'Déficit Bruto',
      sub:'Ingresos − Costos',
      value:`$ ${U.fmt(utilidad)}`,
      bs: tasaBCV>0 ? U.fmtBs(utilidad,tasaBCV) : null,
      icon: utilidad>=0 ? '📈' : '📉',
      bg: utilidad>=0 ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'linear-gradient(135deg,#dc2626,#ef4444)',
      glow: utilidad>=0 ? 'rgba(139,92,246,0.4)' : 'rgba(239,68,68,0.4)',
      border: utilidad>=0 ? 'rgba(139,92,246,0.5)' : 'rgba(239,68,68,0.5)',
    },
    {
      label:'Margen Bruto', sub:'Rentabilidad %',
      value:`${margen.toFixed(1)}%`,
      bs: null,
      icon:'📊',
      bg: margen>=10 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : 'linear-gradient(135deg,#dc2626,#ef4444)',
      glow: margen>=10 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)',
      border: margen>=10 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)',
    },
  ];

  /* ── section wrapper ── */
  const Section = ({ accent, gradient, icon, title, badge, badgeColor='#0f172a', totalUSD, totalBs, children }) => (
    <div style={{
      borderRadius:18, overflow:'hidden', marginBottom:24,
      border:`1px solid ${accent}35`,
      boxShadow:`0 6px 24px ${accent}18`,
    }}>
      {/* header */}
      <div style={{
        background: gradient, padding:'14px 20px',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <span style={{ fontSize:15, fontWeight:800, color:'white' }}>{title}</span>
          <span style={{
            background:'rgba(255,255,255,0.2)', borderRadius:12,
            padding:'2px 10px', fontSize:11, color:'white', fontWeight:700,
          }}>{badge}</span>
        </div>
        {totalUSD !== undefined && (
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:900, color:'white' }}>$ {U.fmt(totalUSD)}</div>
            {totalBs && <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{totalBs}</div>}
          </div>
        )}
      </div>
      <div style={{ background:'white', overflowX:'auto' }}>{children}</div>
    </div>
  );

  return (
    <div className="view-container">

      {/* ── PAGE TITLE ── */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px' }}>
          🏦 Contabilidad
        </h2>
        <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>
          Estado financiero · Cuentas por cobrar y pagar · Historial de pagos
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background:k.bg, borderRadius:18, padding:'22px 20px',
            boxShadow:`0 8px 24px ${k.glow}`,
            border:`1px solid ${k.border}`,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:-16, right:-12, fontSize:72, opacity:0.1, lineHeight:1 }}>{k.icon}</div>
            <div style={{ fontSize:10, fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:4 }}>
              {k.label}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:10 }}>{k.sub}</div>
            <div style={{ fontSize:24, fontWeight:900, color:'white', letterSpacing:'-0.5px', lineHeight:1 }}>
              {k.value}
            </div>
            {k.bs && (
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:8, fontWeight:600 }}>{k.bs}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── QUICK STATS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
        {[
          { label:'Facturas pendientes de cobro', val:cxcItems.length, icon:'⏳', color:'#b45309', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.3)' },
          { label:'Compras pendientes de pago', val:cxpItems.length, icon:'💳', color:'#dc2626', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.3)' },
          { label:'Pagos realizados a UPACA', val:pagadasUpaca.length, icon:'✅', color:'#059669', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.3)' },
        ].map(s => (
          <div key={s.label} style={{
            background:s.bg, border:`1px solid ${s.border}`,
            borderRadius:14, padding:'16px 20px',
            display:'flex', alignItems:'center', gap:14,
          }}>
            <div style={{ fontSize:32 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:28, fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:12, color:'#334155', fontWeight:600, marginTop:4 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CUENTAS POR COBRAR ── */}
      <Section
        accent="#f59e0b" gradient="linear-gradient(135deg,#b45309,#d97706)"
        icon="⏳" title="Cuentas por Cobrar — Clientes"
        badge={`${cxcItems.length} pendiente${cxcItems.length!==1?'s':''}`}
        totalUSD={totalCxC} totalBs={tasaBCV>0 ? U.fmtBs(totalCxC,tasaBCV) : null}
      >
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['📅 Fecha','👤 Cliente','📞 Teléfono','💵 Total ($)','💱 Total Bs.','🔖 Estado','🚚 F. Entrega'].map(h => (
                <th key={h} style={mkTh('#f59e0b')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cxcItems.length===0 && (
              <tr><td colSpan={7} style={{ ...TD, textAlign:'center', padding:32 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🎉</div>
                <div style={{ fontWeight:700, color:'#059669', fontSize:15 }}>¡Sin cuentas pendientes de cobro!</div>
                <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>Todos los clientes están al día</div>
              </td></tr>
            )}
            {cxcItems.map((v,i) => (
              <tr key={v.id} style={{ background: i%2===0?'white':'#fefce8' }}>
                <td style={TD}><span style={{ background:'rgba(245,158,11,0.1)', color:'#92400e', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{U.fmtDate(v.fecha)}</span></td>
                <td style={{ ...TD, fontWeight:700, color:'#0f172a' }}>{v.clienteNombre}</td>
                <td style={{ ...TD, color:'#475569' }}>{v.clienteTelefono||'—'}</td>
                <td style={{ ...TD, textAlign:'right', fontWeight:800, color:'#b45309', fontSize:13 }}>$ {U.fmt(v.total)}</td>
                <td style={{ ...TD, textAlign:'right', fontSize:11, color:'#64748b' }}>{tasaBCV>0 ? U.fmtBs(v.total,v.tasaBCVUsada||tasaBCV) : '—'}</td>
                <td style={TD}>
                    <button
                      onClick={() => handleMarkCobrada(v)}
                      title={v.estadoPago === 'pagado' ? 'Clic para marcar PENDIENTE' : 'Clic para marcar PAGADO'}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}
                    >
                      <EstadoBadge estado={v.estadoPago} />
                      <div style={{ fontSize:9, color:'#94a3b8', marginTop:2, textAlign:'center' }}>
                        {v.estadoPago === 'pagado' ? '↩ revertir' : '✓ marcar pagado'}
                      </div>
                    </button>
                  </td>
                <td style={{ ...TD, color:'#0891b2', fontSize:12, fontWeight:600 }}>{v.fechaEntrega ? U.fmtDate(v.fechaEntrega) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── CUENTAS POR PAGAR ── */}
      <Section
        accent="#ef4444" gradient="linear-gradient(135deg,#b91c1c,#dc2626)"
        icon="💳" title="Cuentas por Pagar — UPACA"
        badge={`${cxpItems.length} pendiente${cxpItems.length!==1?'s':''}`}
        totalUSD={totalCxP} totalBs={tasaBCV>0 ? U.fmtBs(totalCxP,tasaBCV) : null}
      >
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['📅 Fecha','🧾 Factura #','🏭 Proveedor','💵 Total ($)','💳 Pagado','⏳ Pendiente','⚙️ Acción'].map(h => (
                <th key={h} style={mkTh('#ef4444')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cxpItems.length===0 && (
              <tr><td colSpan={7} style={{ ...TD, textAlign:'center', padding:32 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:700, color:'#059669', fontSize:15 }}>Todas las compras están pagadas a UPACA</div>
              </td></tr>
            )}
            {cxpItems.map((c,i) => {
              const pagado = (Array.isArray(c.pagos) ? c.pagos : []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
              const pendiente = c.total - pagado;
              return (
                <tr key={c.id} style={{ background: i%2===0?'white':'#fff5f5' }}>
                  <td style={TD}><span style={{ background:'rgba(239,68,68,0.08)', color:'#b91c1c', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{U.fmtDate(c.fecha)}</span></td>
                  <td style={{ ...TD, fontWeight:800, color:'#dc2626', fontFamily:'monospace', fontSize:13 }}>{c.numeroFactura}</td>
                  <td style={{ ...TD, fontWeight:700, color:'#0f172a' }}>{c.proveedorNombre}</td>
                  <td style={{ ...TD, textAlign:'right', fontWeight:700, color:'#64748b', fontSize:12 }}>$ {U.fmt(c.total)}</td>
                  <td style={{ ...TD, textAlign:'right', fontWeight:700, color:'#059669', fontSize:12 }}>$ {U.fmt(pagado)}</td>
                  <td style={{ ...TD, textAlign:'right', fontWeight:800, color:'#dc2626', fontSize:13 }}>$ {U.fmt(pendiente)}</td>
                  <td style={TD}>
                    <button
                      onClick={() => setPagosCompra(c)}
                      style={{
                        background:'linear-gradient(135deg,#1e40af,#3b82f6)',
                        color:'white', border:'none', borderRadius:10,
                        padding:'8px 16px', fontSize:12, fontWeight:800,
                        cursor:'pointer', boxShadow:'0 3px 10px rgba(59,130,246,0.3)',
                        display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
                      }}
                    >
                      💳 Gestionar Pagos
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      {/* ── HISTORIAL DE PAGOS ── */}
      <Section
        accent="#10b981" gradient="linear-gradient(135deg,#059669,#10b981)"
        icon="✅" title="Historial de Pagos a UPACA"
        badge={`${pagadasUpaca.length} pagada${pagadasUpaca.length!==1?'s':''}`}
      >
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['📅 Fecha Compra','🧾 Factura #','💰 Fecha de Pago','💵 Total ($)','💱 Total Bs.'].map(h => (
                <th key={h} style={mkTh('#10b981')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagadasUpaca.length===0 && (
              <tr><td colSpan={5} style={{ ...TD, textAlign:'center', padding:32 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                <div style={{ fontWeight:600, color:'#64748b' }}>No hay pagos registrados aún</div>
              </td></tr>
            )}
            {[...pagadasUpaca].reverse().map((c,i) => (
              <tr key={c.id} style={{ background: i%2===0?'white':'#f0fdf4' }}>
                <td style={TD}><span style={{ background:'rgba(16,185,129,0.1)', color:'#065f46', borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{U.fmtDate(c.fecha)}</span></td>
                <td style={{ ...TD, fontWeight:800, color:'#0891b2', fontFamily:'monospace', fontSize:13 }}>{c.numeroFactura}</td>
                <td style={{ ...TD, color:'#059669', fontWeight:700, fontSize:12 }}>🗓 {U.fmtDate(c.fechaPagoUpaca)}</td>
                <td style={{ ...TD, textAlign:'right', fontWeight:800, color:'#059669', fontSize:13 }}>$ {U.fmt(c.total)}</td>
                <td style={{ ...TD, textAlign:'right', fontSize:11, color:'#64748b' }}>{tasaBCV>0 ? U.fmtBs(c.total,c.tasaBCVUsada||tasaBCV) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

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
    </div>
  );
};

export default Contabilidad;
