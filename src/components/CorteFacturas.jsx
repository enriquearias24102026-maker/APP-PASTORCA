import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

const PERIODOS = [
  { label: '📅 Hoy',          value: 'hoy',          color: '#06b6d4' },
  { label: '📆 Esta Semana',  value: 'semana',        color: '#3b82f6' },
  { label: '🗓 Este Mes',     value: 'mes',           color: '#8b5cf6' },
  { label: '⬅ Mes Anterior',  value: 'mes_anterior',  color: '#f59e0b' },
  { label: '✏️ Personalizado', value: 'custom',        color: '#10b981' },
];

function getRange(periodo) {
  const now = new Date();
  const hoy = now.toISOString().split('T')[0];
  if (periodo === 'hoy') return { desde: hoy, hasta: hoy };
  if (periodo === 'semana') {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    return { desde: d.toISOString().split('T')[0], hasta: hoy };
  }
  if (periodo === 'mes') {
    return { desde: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, hasta: hoy };
  }
  if (periodo === 'mes_anterior') {
    const d  = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const d2 = new Date(now.getFullYear(), now.getMonth(), 0);
    return { desde: d.toISOString().split('T')[0], hasta: d2.toISOString().split('T')[0] };
  }
  return null;
}

const ESTADO_META = {
  pagado:    { label: 'PAGADO',    bg: 'rgba(16,185,129,0.15)',  color: '#10b981', dot: '#10b981' },
  pendiente: { label: 'PENDIENTE', bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b', dot: '#f59e0b' },
  vencido:   { label: 'VENCIDO',   bg: 'rgba(239,68,68,0.15)',   color: '#ef4444', dot: '#ef4444' },
};

const Badge = ({ estado }) => {
  const m = ESTADO_META[estado] || ESTADO_META['pendiente'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
      background: m.bg, color: m.color, border: `1px solid ${m.color}40`,
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />
      {m.label}
    </span>
  );
};

const CorteFacturas = () => {
  const { data, updateItem, tasaBCV } = useAppData();
  const [periodo, setPeriodo]       = useState('mes');
  const [customDesde, setCustomDesde] = useState('');
  const [customHasta, setCustomHasta] = useState('');
  const [tipoDoc, setTipoDoc]       = useState('ambos');

  const handleMarkCobrada = async (venta) => {
    const nuevoEstado = venta.estadoPago === 'pagado' ? 'pendiente' : 'pagado';
    await updateItem('ventas', { ...venta, estadoPago: nuevoEstado });
  };

  const range = periodo === 'custom'
    ? { desde: customDesde, hasta: customHasta }
    : getRange(periodo);

  const filterItems = (items) => items.filter(item => {
    const f = item.fecha;
    if (range?.desde && f < range.desde) return false;
    if (range?.hasta && f > range.hasta) return false;
    return true;
  });

  const comprasFiltradas = tipoDoc === 'ventas'  ? [] : filterItems(data.compras);
  const ventasFiltradas  = tipoDoc === 'compras' ? [] : filterItems(data.ventas);
  const totalCompras     = comprasFiltradas.reduce((s,c) => s+(c.total||0), 0);
  const totalVentas      = ventasFiltradas.reduce((s,v) => s+(v.total||0), 0);
  const utilidad         = totalVentas - totalCompras;

  const periodoLabel = () => {
    if (periodo === 'custom') return `${U.fmtDate(customDesde)} — ${U.fmtDate(customHasta)}`;
    return PERIODOS.find(p => p.value === periodo)?.label || '';
  };

  const hoyStr = new Date().toLocaleDateString('es-VE', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const handlePrint = () => {
    const el = document.getElementById('corte-print-area');
    if (!el) return;
    const win = window.open('', '_blank', 'width=950,height=720');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Corte de Facturas — PASTORCA</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:20px;background:white}
        h2{font-size:18px;color:#1e40af;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        th{background:#1e3a6e;color:white;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase}
        td{border-bottom:1px solid #e5e7eb;padding:7px 10px}
        .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700}
        .sum-row{background:#f0f9ff;font-weight:700}
      </style></head><body>
      ${el.innerHTML}
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  // ── styles ──
  const inputSt = {
    padding: '9px 13px', borderRadius: '10px', fontSize: '13px',
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'Inter,sans-serif',
  };

  const thSt = {
    padding: '11px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.8px', color: 'white', whiteSpace: 'nowrap',
  };
  const tdSt = { padding: '10px 14px', fontSize: '12px', borderBottom: '1px solid var(--border-color)' };

  return (
    <div className="view-container">

      {/* ══ HERO HEADER ══ */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e3a6e 60%,#1e40af 100%)',
        borderRadius: '20px', padding: '28px 32px', marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(30,64,175,0.4)',
        border: '1px solid rgba(59,130,246,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>
            PASTORCA · Sistema Administrativo
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
            🖨 Corte de Facturas
          </h1>
          <div style={{ fontSize: '13px', color: '#93c5fd', marginTop: '6px' }}>
            {periodoLabel()} · {hoyStr}
          </div>
          {tasaBCV > 0 && (
            <div style={{
              marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#34d399', fontWeight: 700,
            }}>
              💱 Tasa BCV: Bs. {new Intl.NumberFormat('es-VE',{minimumFractionDigits:2}).format(tasaBCV)}
            </div>
          )}
        </div>
        <button onClick={handlePrint} style={{
          background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
          border: 'none', color: 'white', borderRadius: '12px',
          padding: '13px 26px', fontSize: '14px', fontWeight: 800,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 16px rgba(6,182,212,0.4)',
        }}>
          🖨️ Imprimir Corte
        </button>
      </div>

      {/* ══ CONTROLS ══ */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: '16px', padding: '20px 24px', marginBottom: '24px',
      }}>
        {/* Period pills */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
            Período de Corte
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {PERIODOS.map(p => (
              <button key={p.value} onClick={() => setPeriodo(p.value)} style={{
                padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: periodo === p.value ? p.color : 'var(--bg-tertiary)',
                color: periodo === p.value ? 'white' : 'var(--text-secondary)',
                boxShadow: periodo === p.value ? `0 4px 12px ${p.color}50` : 'none',
                transform: periodo === p.value ? 'scale(1.05)' : 'scale(1)',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {periodo === 'custom' && (
            <>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Desde</div>
                <input style={inputSt} type="date" value={customDesde} onChange={e => setCustomDesde(e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Hasta</div>
                <input style={inputSt} type="date" value={customHasta} onChange={e => setCustomHasta(e.target.value)} />
              </div>
            </>
          )}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Tipo de Documentos</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['ambos','🔄 Ambos','#8b5cf6'],['compras','📥 Compras','#06b6d4'],['ventas','📤 Ventas','#10b981']].map(([v,l,c]) => (
                <button key={v} onClick={() => setTipoDoc(v)} style={{
                  padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: tipoDoc === v ? c : 'var(--bg-tertiary)',
                  color: tipoDoc === v ? 'white' : 'var(--text-secondary)',
                  boxShadow: tipoDoc === v ? `0 4px 12px ${c}50` : 'none',
                }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ PRINT AREA ══ */}
      <div id="corte-print-area">

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            tipoDoc !== 'ventas'  && { label:'📥 Total Compras UPACA', usd: totalCompras, bg:'linear-gradient(135deg,#0891b2,#06b6d4)', glow:'rgba(6,182,212,0.4)', count:`${comprasFiltradas.length} facturas` },
            tipoDoc !== 'compras' && { label:'📤 Total Ventas', usd: totalVentas, bg:'linear-gradient(135deg,#059669,#10b981)', glow:'rgba(16,185,129,0.4)', count:`${ventasFiltradas.length} pre-facturas` },
            tipoDoc === 'ambos'   && { label: utilidad>=0 ? '📈 Utilidad del Período' : '📉 Déficit del Período', usd: utilidad, bg: utilidad>=0 ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'linear-gradient(135deg,#dc2626,#ef4444)', glow: utilidad>=0 ? 'rgba(139,92,246,0.4)' : 'rgba(239,68,68,0.4)', count: utilidad>=0 ? '✅ Positivo' : '⚠️ Negativo' },
          ].filter(Boolean).map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: '16px', padding: '22px',
              boxShadow: `0 8px 24px ${s.glow}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position:'absolute', top:-20, right:-20, fontSize:'80px', opacity:0.08, lineHeight:1 }}>💰</div>
              <div style={{ fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:'8px' }}>
                {s.label}
              </div>
              <div style={{ fontSize:'26px', fontWeight:900, color:'white', letterSpacing:'-0.5px' }}>
                $ {U.fmt(s.usd)}
              </div>
              {tasaBCV > 0 && (
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginTop:'6px' }}>
                  {U.fmtBs(s.usd, tasaBCV)}
                </div>
              )}
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', marginTop:'8px', fontStyle:'italic' }}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* COMPRAS TABLE */}
        {tipoDoc !== 'ventas' && (
          <div style={{ borderRadius: '16px', overflow:'hidden', marginBottom:'20px', border:'1px solid rgba(6,182,212,0.3)', boxShadow:'0 4px 20px rgba(6,182,212,0.1)' }}>
            <div style={{ background:'linear-gradient(135deg,#0891b2,#06b6d4)', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'14px', fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:'8px' }}>
                📥 Facturas de Compra — UPACA
                <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:'12px', padding:'2px 10px', fontSize:'11px' }}>
                  {comprasFiltradas.length} registros
                </span>
              </div>
              <div style={{ fontSize:'15px', fontWeight:900, color:'white' }}>
                Total: $ {U.fmt(totalCompras)}
              </div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'rgba(6,182,212,0.08)' }}>
                    {['Fecha','Factura N°','Proveedor','Subtotal ($)','IVA ($)','Desc. 3% ($)','Total ($)', ...(tasaBCV>0?['Total Bs.']:[])].map(h => (
                      <th key={h} style={{ ...thSt, color:'var(--text-primary)', background:'rgba(6,182,212,0.08)', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comprasFiltradas.length === 0 && (
                    <tr><td colSpan={8} style={{ ...tdSt, textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>📭</div>
                      No hay facturas de compra en este período
                    </td></tr>
                  )}
                  {comprasFiltradas.map((c,i) => (
                    <tr key={c.id} style={{ background: i%2===0 ? 'transparent' : 'rgba(6,182,212,0.03)' }}>
                      <td style={tdSt}>{U.fmtDate(c.fecha)}</td>
                      <td style={{ ...tdSt, fontWeight:700, color:'#0891b2', fontFamily:'monospace' }}>{c.numeroFactura}</td>
                      <td style={{ ...tdSt, fontWeight:600 }}>{c.proveedorNombre}</td>
                      <td style={{ ...tdSt, textAlign:'right' }}>$ {U.fmt(c.subtotal)}</td>
                      <td style={{ ...tdSt, textAlign:'right', color:'#f59e0b' }}>$ {U.fmt(c.iva)}</td>
                      <td style={{ ...tdSt, textAlign:'right', color:'#d97706', fontWeight:700 }}>- $ {U.fmt(c.montoDescuento||0)}</td>
                      <td style={{ ...tdSt, textAlign:'right', fontWeight:800, color:'#0891b2', fontSize:'13px' }}>$ {U.fmt(c.total)}</td>
                      {tasaBCV>0 && <td style={{ ...tdSt, textAlign:'right', fontSize:'11px', color:'var(--text-muted)' }}>{U.fmtBs(c.total, c.tasaBCVUsada||tasaBCV)}</td>}
                    </tr>
                  ))}
                  {comprasFiltradas.length > 0 && (
                    <tr style={{ background:'rgba(6,182,212,0.08)', fontWeight:800 }}>
                      <td colSpan={6} style={{ ...tdSt, textAlign:'right', fontSize:'13px', color:'#0891b2' }}>SUBTOTAL COMPRAS →</td>
                      <td style={{ ...tdSt, textAlign:'right', fontSize:'14px', color:'#0891b2', fontWeight:900 }}>$ {U.fmt(totalCompras)}</td>
                      {tasaBCV>0 && <td style={{ ...tdSt, textAlign:'right', fontSize:'11px', color:'var(--text-muted)' }}>{U.fmtBs(totalCompras,tasaBCV)}</td>}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VENTAS TABLE */}
        {tipoDoc !== 'compras' && (
          <div style={{ borderRadius:'16px', overflow:'hidden', marginBottom:'20px', border:'1px solid rgba(16,185,129,0.3)', boxShadow:'0 4px 20px rgba(16,185,129,0.1)' }}>
            <div style={{ background:'linear-gradient(135deg,#059669,#10b981)', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:'14px', fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:'8px' }}>
                📤 Pre-Facturas de Venta
                <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:'12px', padding:'2px 10px', fontSize:'11px' }}>
                  {ventasFiltradas.length} registros
                </span>
              </div>
              <div style={{ fontSize:'15px', fontWeight:900, color:'white' }}>
                Total: $ {U.fmt(totalVentas)}
              </div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'rgba(16,185,129,0.06)' }}>
                    {['Fecha','F. Entrega','Cliente','Total ($)', ...(tasaBCV>0?['Total Bs.']:[]), 'Estado de Pago'].map(h => (
                      <th key={h} style={{ ...thSt, color:'var(--text-primary)', background:'rgba(16,185,129,0.06)', fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 && (
                    <tr><td colSpan={6} style={{ ...tdSt, textAlign:'center', padding:'32px', color:'var(--text-muted)' }}>
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>📭</div>
                      No hay pre-facturas de venta en este período
                    </td></tr>
                  )}
                  {ventasFiltradas.map((v,i) => (
                    <tr key={v.id} style={{ background: i%2===0 ? 'transparent' : 'rgba(16,185,129,0.03)' }}>
                      <td style={tdSt}>{U.fmtDate(v.fecha)}</td>
                      <td style={{ ...tdSt, fontSize:'12px', color:'#06b6d4' }}>{v.fechaEntrega ? U.fmtDate(v.fechaEntrega) : '—'}</td>
                      <td style={{ ...tdSt, fontWeight:700 }}>{v.clienteNombre}</td>
                      <td style={{ ...tdSt, textAlign:'right', fontWeight:800, color:'#059669', fontSize:'13px' }}>$ {U.fmt(v.total)}</td>
                      {tasaBCV>0 && <td style={{ ...tdSt, textAlign:'right', fontSize:'11px', color:'var(--text-muted)' }}>{U.fmtBs(v.total, v.tasaBCVUsada||tasaBCV)}</td>}
                      <td style={tdSt}>
                        <button
                          onClick={() => handleMarkCobrada(v)}
                          title={v.estadoPago === 'pagado' ? 'Clic para marcar PENDIENTE' : 'Clic para marcar PAGADO'}
                          style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}
                        >
                          <Badge estado={v.estadoPago} />
                          <div style={{ fontSize:9, color:'#94a3b8', marginTop:2, textAlign:'center' }}>
                            {v.estadoPago === 'pagado' ? '↩ revertir' : '✓ marcar pagado'}
                          </div>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ventasFiltradas.length > 0 && (
                    <tr style={{ background:'rgba(16,185,129,0.08)', fontWeight:800 }}>
                      <td colSpan={3} style={{ ...tdSt, textAlign:'right', fontSize:'13px', color:'#059669' }}>SUBTOTAL VENTAS →</td>
                      <td style={{ ...tdSt, textAlign:'right', fontSize:'14px', color:'#059669', fontWeight:900 }}>$ {U.fmt(totalVentas)}</td>
                      {tasaBCV>0 && <td style={{ ...tdSt, textAlign:'right', fontSize:'11px', color:'var(--text-muted)' }}>{U.fmtBs(totalVentas,tasaBCV)}</td>}
                      <td style={tdSt}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign:'center', padding:'14px', fontSize:'11px', color:'var(--text-muted)', borderTop:'1px solid var(--border-color)', marginTop:'8px' }}>
          🏢 PASTORCA · Representante: <strong style={{ color:'var(--accent-blue)' }}>MARCOS BARCO</strong> · Corte generado el {hoyStr}
        </div>
      </div>
    </div>
  );
};

export default CorteFacturas;
