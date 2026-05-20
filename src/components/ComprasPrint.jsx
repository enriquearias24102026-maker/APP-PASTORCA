import React, { useState } from 'react';
import { U } from '../utils';

const ComprasPrint = ({ data, onClose }) => {
  if (!data) return null;

  const tasaBCV      = data.tasaBCVUsada || 0;
  const defaultPct   = data.descuentoUpacaPct ?? 3;

  // Per-item editable discount — each item carries its own descuentoPct
  const [itemOverrides, setItemOverrides] = useState({});
  const [editingDescIdx, setEditingDescIdx] = useState(null);

  // Recalculate items using per-item discount
  const items = (data.items || []).map((it, idx) => {
    const pct = itemOverrides[idx] !== undefined ? Number(itemOverrides[idx]) : (it.descuentoPct ?? defaultPct);
    const subtotalConIva = parseFloat(it.subtotalConIva) || 0;
    const descRate = pct / 100;
    const montoDescuento = descRate > 0 ? Math.round(subtotalConIva * descRate * 100) / 100 : 0;
    const total = Math.round((subtotalConIva - montoDescuento) * 100) / 100;
    return { ...it, descuentoPct: pct, montoDescuento, total };
  });

  const handleItemDescChange = (idx, newPct) => {
    setItemOverrides(prev => ({ ...prev, [idx]: newPct }));
  };

  // Totals
  const subtotal        = U.r2(items.reduce((s, it) => s + (parseFloat(it.subtotal)        || 0), 0));
  const iva             = U.r2(items.reduce((s, it) => s + (parseFloat(it.iva)             || 0), 0));
  const subtotalConIva  = U.r2(items.reduce((s, it) => s + (parseFloat(it.subtotalConIva)  || 0), 0));
  const montoDescuento  = U.r2(items.reduce((s, it) => s + (parseFloat(it.montoDescuento)  || 0), 0));
  const total           = U.r2(items.reduce((s, it) => s + (parseFloat(it.total)           || 0), 0));

  const itemsExentos  = items.filter(it => !it.gravable);
  const itemsGravados = items.filter(it =>  it.gravable);
  const montoExento   = U.r2(itemsExentos.reduce((s, it)  => s + (parseFloat(it.subtotal) || 0), 0));
  const baseImponible = U.r2(itemsGravados.reduce((s, it) => s + (parseFloat(it.subtotal) || 0), 0));
  const totalEmbalajes = items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);

  // ── Print in new window (reliable, no blank page) ──
  const handlePrint = () => {
    const el = document.getElementById('compras-print-body');
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>Factura de Compra UPACA</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #f3f4f6; font-size: 10px; text-transform: uppercase; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; }
        img { max-height: 60px; object-fit: contain; }
        h1 { color: #c41e1e; }
        .red-box { border: 2px solid #c41e1e; color: #c41e1e; display:inline-block; padding: 3px 10px; font-family: monospace; font-size:15px; font-weight:900; }
        .total-row { background:#0f172a; color:white; font-weight:800; }
        .desc-row { background:#1e3a6e; color:white; font-weight:700; }
        .disc { color:#d97706; }
        .exento { color:#059669; }
        .grav { color:#1e40af; }
        .legal { font-size:8px; color:#92400e; background:#fffbeb; border:1px solid #fde68a; padding:8px; margin-top:12px; }
        .sig { display:flex; justify-content:space-around; margin-top:40px; }
        .sig div { text-align:center; border-top:1px solid #000; width:180px; padding-top:4px; font-size:9px; }
      </style>
      </head><body>
      ${el.innerHTML}
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  const thStyle = {
    border: '1px solid #ccc', padding: '7px 9px', textAlign: 'left',
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    color: '#374151', background: '#f3f4f6', whiteSpace: 'nowrap',
  };
  const tdStyle = { border: '1px solid #ddd', padding: '7px 9px', fontSize: '11px' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        overflowY: 'auto',
      }}
    >
      {/* wrapper centres content and allows scroll */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100%', padding: '0 10px 40px' }}>

        {/* ── Top bar (sticky) ── */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          width: '100%', maxWidth: '900px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #0f172a, #1e3a6e)',
          color: 'white', borderRadius: '14px 14px 0 0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          marginTop: '10px',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🧾</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Vista Previa — Factura de Compra UPACA</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>Resguardo / Comprobante de Pago</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={handlePrint} style={{
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            border: 'none', color: 'white', borderRadius: '10px',
            padding: '9px 18px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(6,182,212,0.35)',
          }}>🖨️ Imprimir</button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)', color: 'white',
            borderRadius: '10px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>✕ Cerrar</button>
        </div>
        </div>

        {/* ── Invoice body ── */}
        <div
          id="compras-print-body"
          style={{
            width: '100%', maxWidth: '900px',
            background: 'white', padding: '28px 32px',
            fontFamily: "'Inter', sans-serif", color: '#111',
            fontSize: '12px', lineHeight: 1.55,
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            borderRadius: '0 0 14px 14px',
          }}
        >
        {/* ══ HEADER ══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          {/* Left: UPACA info */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
            <img src="/logo-upaca.png" alt="UPACA"
              style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }} />
            <div>
              <h1 style={{ color: '#c41e1e', margin: '0 0 2px', fontSize: '22px', letterSpacing: '1px', fontWeight: 900 }}>UPACA</h1>
              <div style={{ fontSize: '10px', color: '#555', lineHeight: 1.5 }}>
                Unión de Productores y Asociados del Campo A.<br />
                Control de Facturación Láctea<br />
                <strong>Código Distribuidor:</strong> 100806
              </div>
            </div>
          </div>

          {/* Right: Invoice number + type */}
          <div style={{ textAlign: 'right', minWidth: '220px' }}>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>
              FORMA LIBRE &nbsp;|&nbsp; N° DE CONTROL
            </div>
            <div style={{
              fontSize: '18px', fontWeight: 900, letterSpacing: '1px',
              color: '#c41e1e', fontFamily: 'monospace',
              border: '2px solid #c41e1e', padding: '4px 12px',
              borderRadius: '6px', display: 'inline-block', marginBottom: '8px',
            }}>
              {data.numeroControl || data.numeroFactura || '—'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e40af', marginBottom: '6px' }}>FACTURA</div>
            <div style={{ fontSize: '10px', color: '#555', lineHeight: 1.8 }}>
              <div><strong>Fecha de emisión:</strong> {U.fmtDate(data.fechaEmision || data.fecha)}</div>
              {data.fechaVencimiento && <div><strong>Fecha de vencimiento:</strong> {U.fmtDate(data.fechaVencimiento)}</div>}
              {data.numeroPedido && <div><strong>Pedido:</strong> {data.numeroPedido}</div>}
            </div>
          </div>
        </div>

        {/* ══ CLIENT INFO ══ */}
        <div style={{
          padding: '10px 14px', background: '#f8f9fa',
          border: '1px solid #e5e7eb', borderRadius: '6px',
          marginBottom: '14px', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: '11px',
        }}>
          <div><strong>Nombre:</strong> MARCOS MANUEL BARCO GUEVARA</div>
          <div><strong>RIF:</strong> V-132498396 &nbsp;&nbsp; <strong>Teléfono:</strong> {data.clienteTelefono || '0412'}</div>
          <div><strong>Dirección:</strong> CALLE CAICARA CON TRANSVERSAL 1 CASA N° 97 URB.<br />
            FUNDEMOS MATURIN MONAGAS MAT.MON.6201VEN, Maturín, Monagas.</div>
          <div style={{ alignSelf: 'center' }}>
            <strong>Proveedor:</strong> {data.proveedorNombre || 'UPACA'}
          </div>
        </div>

        {/* ══ PRODUCTS TABLE ══ */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Código</th>
              <th style={thStyle}>Descripción</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Embalajes</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Uni</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Precio ($)</th>
              <th style={{ ...thStyle, textAlign: 'right', color: '#059669' }}>Exento ($)</th>
              <th style={{ ...thStyle, textAlign: 'right', color: '#1e40af' }}>Grav. ($)</th>
              <th style={{ ...thStyle, textAlign: 'right', color: '#d97706' }}>Desc. %</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ ...tdStyle, fontSize: '10px', color: '#6b7280' }}>{item.codigo || '—'}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{item.descripcion} ({item.presentacion})</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.embalaje || '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.cantidad}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>$ {U.fmt(item.costoUnitario)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#059669', fontWeight: 600 }}>
                  {!item.gravable ? `$ ${U.fmt(item.subtotal)}` : '—'}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#1e40af', fontWeight: 600 }}>
                  {item.gravable ? `$ ${U.fmt(item.subtotal)}` : '—'}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', color: '#d97706', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => setEditingDescIdx(editingDescIdx === i ? null : i)}
                  title="Clic para modificar el % de descuento"
                >
                  {editingDescIdx === i ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <input
                        type="number" step="0.5" min="0" max="100"
                        value={item.descuentoPct}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleItemDescChange(i, e.target.value)}
                        onBlur={() => setEditingDescIdx(null)}
                        onKeyDown={e => e.key === 'Enter' && setEditingDescIdx(null)}
                        autoFocus
                        style={{
                          width: '42px', padding: '1px 3px', fontSize: '10px', fontWeight: 700,
                          textAlign: 'center', color: '#d97706', border: '1.5px solid #d97706',
                          borderRadius: '4px', outline: 'none', background: '#fffbeb',
                        }}
                      />
                      <span style={{ fontSize: '9px' }}>%</span>
                    </span>
                  ) : (
                    <span>
                      <span style={{ fontSize: '9px', opacity: 0.7 }}>{item.descuentoPct}% </span>
                      - $ {U.fmt(item.montoDescuento || 0)}
                      <span style={{ fontSize: '9px', opacity: 0.4 }}> ✏️</span>
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>$ {U.fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ══ BOTTOM: Totals + Summary box ══ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginTop: '8px' }}>

          {/* Left: Equivalencia en Bolívares */}
          <div style={{
            flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px',
            overflow: 'hidden', fontSize: '11px',
          }}>
            <div style={{
              background: '#1e3a6e', color: 'white',
              padding: '8px 14px', fontWeight: 700, fontSize: '12px',
            }}>
              Equivalencia en Bolívares {tasaBCV > 0 ? `(BCV: Bs. ${U.fmt(tasaBCV)})` : ''}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: 'Descripción', value: 'Lácteos UPACA' },
                  { label: 'Exento Bs.', value: tasaBCV > 0 ? U.fmtBs(montoExento, tasaBCV) : '—' },
                  { label: 'Base imponible Bs.', value: tasaBCV > 0 ? U.fmtBs(baseImponible, tasaBCV) : '—' },
                  { label: 'I.V.A. 16% Bs.', value: tasaBCV > 0 ? U.fmtBs(iva, tasaBCV) : '—' },
                  { label: 'Desc. UPACA Bs.', value: tasaBCV > 0 ? `- ${U.fmtBs(montoDescuento, tasaBCV)}` : '—', color: '#d97706' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '6px 12px', color: '#6b7280', fontWeight: 500 }}>{row.label}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: row.color || '#111' }}>{row.value}</td>
                  </tr>
                ))}
                <tr style={{ background: '#1e3a6e', color: 'white' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total Bs.</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>
                    {tasaBCV > 0 ? U.fmtBs(total, tasaBCV) : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right: USD Totals */}
          <div style={{ minWidth: '280px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', fontSize: '11px' }}>
            <div style={{ background: '#0891b2', color: 'white', padding: '8px 14px', fontWeight: 700, fontSize: '12px' }}>
              Resumen en USD
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  { label: `Embalajes: ${totalEmbalajes}`, value: '' , header: true },
                  { label: 'Sub. Total $', value: `$ ${U.fmt(subtotal)}` },
                  { label: 'Gravable $', value: `$ ${U.fmt(baseImponible)}` },
                  { label: 'Exento $', value: `$ ${U.fmt(montoExento)}` },
                  { label: 'I.V.A. (16%) $', value: `$ ${U.fmt(iva)}` },
                  { label: '🏷️ Desc. UPACA', value: `- $ ${U.fmt(montoDescuento)}`, color: '#d97706' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: row.header ? '#f3f4f6' : undefined }}>
                    <td style={{ padding: '6px 12px', color: row.header ? '#374151' : '#6b7280', fontWeight: row.header ? 700 : 500 }}>{row.label}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: row.color || '#111' }}>{row.value}</td>
                  </tr>
                ))}
                <tr style={{ background: '#0f172a', color: 'white' }}>
                  <td style={{ padding: '9px 12px', fontWeight: 700, fontSize: '13px' }}>Total $</td>
                  <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800, fontSize: '15px' }}>$ {U.fmt(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ LEGAL NOTE ══ */}
        <div style={{
          marginTop: '18px', padding: '10px 14px',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '6px', fontSize: '9px', color: '#92400e', lineHeight: 1.6,
        }}>
          * Cumpliendo con el Art.25 de la Ley del IVA, 38 del reglamento, Art. 13 numeral 1 de la P.A. 0071 y el convenio cambiario número 01,
          se establece que los cálculos se realizan en dólares americanos (USD) y se convierten a bolívares (Bs.) según la tasa BCV vigente al
          momento del pago. La Leche Pasteurizada está exenta del IVA según legislación venezolana vigente. El descuento es un
          beneficio otorgado por UPACA a sus distribuidores autorizados.
        </div>

        {/* ══ SIGNATURES ══ */}
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px', fontSize: '10px' }}>
            Entregado por (UPACA)
          </div>
          <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px', fontSize: '10px' }}>
            Recibido por — MARCOS BARCO<br />(Firma y Sello)
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ComprasPrint;
