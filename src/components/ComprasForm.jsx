import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

const ComprasForm = ({ compra, onSave, onCancel }) => {
  const { data, tasaBCV } = useAppData();

  // ── Initialize from existing compra (edit mode) or defaults ──────
  const isEditing = !!compra;

  const [form, setForm] = useState({
    proveedorId: compra ? String(compra.proveedorId) : (data.proveedores.length > 0 ? String(data.proveedores[0].id) : ''),
    fecha: compra ? compra.fecha : U.today(),
    numeroFactura: compra ? compra.numeroFactura : '',
    numeroControl: compra ? (compra.numeroControl || '') : '',
    numeroPedido: compra ? (compra.numeroPedido || '') : '',
    fechaEmision: compra ? (compra.fechaEmision || compra.fecha || U.today()) : U.today(),
    fechaVencimiento: compra ? (compra.fechaVencimiento || '') : '',
    tasaBCVUsada: compra ? (compra.tasaBCVUsada || tasaBCV) : tasaBCV,
  });
  const [items, setItems] = useState(compra ? (compra.items || []) : []);
  const [currentItem, setCurrentItem] = useState({ productoId: '', cantidad: 1, costoUnitario: 0 });
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editItem, setEditItem] = useState({ productoId: '', cantidad: 1, costoUnitario: 0 });
  const [descuentoDefault, setDescuentoDefault] = useState(compra?.descuentoUpacaPct ?? 3); // % default para nuevos items
  const [editingDescIdx, setEditingDescIdx] = useState(null); // índice del item cuyo descuento se edita inline

  // Live totals — always re-derived from items (never stale)
  const totals = {
    subtotal:        items.reduce((s, it) => s + (parseFloat(it.subtotal)        || 0), 0),
    iva:             items.reduce((s, it) => s + (parseFloat(it.iva)             || 0), 0),
    subtotalConIva:  items.reduce((s, it) => s + (parseFloat(it.subtotalConIva)  || 0), 0),
    montoDescuento:  items.reduce((s, it) => s + (parseFloat(it.montoDescuento)  || 0), 0),
    total:           items.reduce((s, it) => s + (parseFloat(it.total)           || 0), 0),
  };

  // ── Build item from product ID + quantity + manual cost + individual discount ──
  const buildItem = (productoId, cantidad, manualCost = null, itemDescPct = null) => {
    const prod = data.productos.find(p => String(p.id) === String(productoId));
    if (!prod) return null;
    
    const precioCosto    = manualCost !== null ? Number(manualCost) : (Number(prod.precioCosto) || 0);
    const gravable       = Boolean(prod.gravable);
    const descPct        = itemDescPct !== null ? Number(itemDescPct) : Number(descuentoDefault);
    const subtotal       = U.r2(precioCosto * cantidad);
    const iva            = gravable ? U.r2up(subtotal * 0.16) : 0;
    const subtotalConIva = U.r2(subtotal + iva);
    const descRate       = descPct / 100;
    const montoDescuento = U.r2(subtotalConIva * descRate);
    const total          = U.r2(subtotalConIva - montoDescuento);
    return {
      productoId: String(prod.id), codigo: prod.codigo || '',
      descripcion: prod.descripcion || '', presentacion: prod.presentacion || '',
      categoria: prod.categoria || '', embalaje: prod.embalaje || '',
      gravable, precioCosto, costoUnitario: precioCosto, cantidad,
      descuentoPct: descPct,
      subtotal, iva, subtotalConIva, montoDescuento, total,
    };
  };

  // Change discount for a single item by index
  const handleItemDescChange = (idx, newPct) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const rebuilt = buildItem(it.productoId, it.cantidad, it.costoUnitario, newPct);
      return rebuilt ? { ...rebuilt, descuentoPct: Number(newPct) } : it;
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.productoId) return;
    const cantidad = Number(currentItem.cantidad);
    const costo = Number(currentItem.costoUnitario);
    if (!cantidad || cantidad <= 0) return;
    const newItem = buildItem(currentItem.productoId, cantidad, costo);
    if (!newItem) return;
    setItems(prev => [...prev, newItem]);
    setCurrentItem({ productoId: '', cantidad: 1, costoUnitario: 0 });
  };

  const handleRemoveItem = idx => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleStartEdit = (idx) => {
    const item = items[idx];
    setEditingIndex(idx);
    setEditItem({ 
      productoId: item.productoId, 
      cantidad: item.cantidad,
      costoUnitario: item.costoUnitario 
    });
  };

  const handleConfirmEdit = () => {
    if (editingIndex === null) return;
    const cantidad = Number(editItem.cantidad);
    const costo = Number(editItem.costoUnitario);
    if (!editItem.productoId || !cantidad || cantidad <= 0) return;
    // Preserve the item's individual discount when editing
    const existingPct = items[editingIndex]?.descuentoPct ?? descuentoDefault;
    const updated = buildItem(editItem.productoId, cantidad, costo, existingPct);
    if (!updated) return;
    setItems(prev => prev.map((it, i) => i === editingIndex ? updated : it));
    setEditingIndex(null);
  };

  const handleCancelEdit = () => setEditingIndex(null);

  // ── Check for duplicate invoice number ─────────────────────────
  const checkDuplicate = (numFactura) => {
    const trimmed = (numFactura || '').trim().toUpperCase();
    if (!trimmed) return null;

    const matches = data.compras.filter(c => {
      // Skip the same compra being edited
      if (isEditing && String(c.id) === String(compra.id)) return false;
      return (c.numeroFactura || '').trim().toUpperCase() === trimmed;
    });

    return matches.length > 0 ? matches : null;
  };

  const handleNumeroFacturaChange = (value) => {
    setForm(p => ({ ...p, numeroFactura: value }));
    const dupes = checkDuplicate(value);
    if (dupes) {
      setDuplicateWarning(
        dupes.map(dupe => ({
          factura: dupe.numeroFactura,
          proveedor: dupe.proveedorNombre || '—',
          fecha: U.fmtDate(dupe.fechaEmision || dupe.fecha),
          total: dupe.total,
        }))
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSave = () => {
    if (!form.numeroFactura.trim()) {
      alert('Por favor ingrese el número de factura.');
      return;
    }
    if (items.length === 0) {
      alert('Por favor agregue al menos un producto.');
      return;
    }

    // ── Duplicate warning on save — BLOCKING ALERT ──
    const dupes = checkDuplicate(form.numeroFactura);
    if (dupes) {
      const dupeDetails = dupes.map((d, i) =>
        `  ${i + 1}. Proveedor: ${d.proveedorNombre || '—'} | Fecha: ${U.fmtDate(d.fechaEmision || d.fecha)} | Total: $ ${U.fmt(d.total)}`
      ).join('\n');
      const proceed = window.confirm(
        `🚨 ¡¡ ALERTA DE FACTURA DUPLICADA !!\n\n` +
        `El número de factura "${form.numeroFactura}" YA EXISTE en el sistema.\n\n` +
        `Factura(s) existente(s):\n${dupeDetails}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `¿Está SEGURO de que desea guardar esta factura duplicada?\n` +
        `Presione CANCELAR para revisar, o ACEPTAR para guardar de todos modos.`
      );
      if (!proceed) return;
    }

    const prov = data.proveedores.find(p => String(p.id) === String(form.proveedorId));
    onSave({
      ...form,
      fecha: form.fechaEmision, // Use emission date as primary date
      proveedorNombre: prov ? prov.nombre : '—',
      items,
      tasaBCVUsada: Number(form.tasaBCVUsada) || tasaBCV,
      descuentoUpacaPct: Number(descuentoDefault),
      totalBs: (Number(form.tasaBCVUsada) || tasaBCV) > 0 ? totals.total * (Number(form.tasaBCVUsada) || tasaBCV) : 0,
      ...totals,
    });
  };

  return (
    <div>
      {/* Payment notice */}
      <div style={{
        background: 'rgba(6,182,212,0.08)',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: '10px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <img
          src="/logo-upaca.png"
          alt="UPACA"
          style={{ width: 48, height: 48, objectFit: 'contain', background: 'white', borderRadius: '10px', padding: '4px', flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
            {isEditing ? '✏️ MODO EDICIÓN — Modificando Factura de Compra' : 'PAGO A UPACA: en Dólares Americanos (USD)'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {isEditing
              ? `Editando factura ${compra.numeroFactura} del ${U.fmtDate(compra.fecha)}`
              : <>
                  Equivalente en Bolívares según tasa BCV del día del pago
                  {tasaBCV > 0 ? ` · Tasa activa: Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(tasaBCV)}` : ' · ⚠ Ingrese la tasa BCV en el encabezado'}
                </>
            }
          </div>
        </div>
      </div>

      {/* Header fields — Row 1: Proveedor, Factura, Emisión, Vencimiento */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Proveedor</label>
          <select className="form-select" value={form.proveedorId} onChange={e => setForm(p => ({ ...p, proveedorId: e.target.value }))}>
            {data.proveedores.map(p => <option key={p.id} value={String(p.id)}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Factura N°</label>
          <input
            className="form-input"
            type="text"
            value={form.numeroFactura}
            onChange={e => handleNumeroFacturaChange(e.target.value)}
            placeholder="Ej: 0001234"
            style={duplicateWarning ? { borderColor: '#f59e0b', boxShadow: '0 0 0 2px rgba(245,158,11,0.25)' } : undefined}
          />
          {duplicateWarning && (
            <div style={{
              marginTop: '8px', padding: '12px 16px',
              background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.6)',
              borderRadius: '10px', fontSize: '12px', color: '#dc2626', lineHeight: '1.6',
              animation: 'pulse 1.5s ease-in-out infinite',
              boxShadow: '0 0 12px rgba(239,68,68,0.2)',
            }}>
              <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🚨 ¡FACTURA DUPLICADA DETECTADA!
              </div>
              {duplicateWarning.map((dw, i) => (
                <div key={i} style={{ marginBottom: '2px', paddingLeft: '8px', borderLeft: '3px solid rgba(239,68,68,0.4)' }}>
                  Factura <strong>#{dw.factura}</strong> registrada el {dw.fecha} para <strong>{dw.proveedor}</strong> por <strong>${U.fmt(dw.total)}</strong>
                </div>
              ))}
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>
                ⚠ Verifique antes de guardar para evitar registros duplicados.
              </div>
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">📅 Fecha Emisión</label>
          <input
            className="form-input"
            type="date"
            value={form.fechaEmision}
            onChange={e => setForm(p => ({ ...p, fechaEmision: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label className="form-label">⏳ F. Vencimiento</label>
          <input
            className="form-input"
            type="date"
            value={form.fechaVencimiento}
            onChange={e => setForm(p => ({ ...p, fechaVencimiento: e.target.value }))}
          />
        </div>
      </div>

      {/* Header fields — Row 2: Pedido y Tasa */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '16px', marginTop: '4px' }}>
        <div className="form-group">
          <label className="form-label">📦 N° de Pedido</label>
          <input
            className="form-input"
            type="text"
            value={form.numeroPedido}
            onChange={e => setForm(p => ({ ...p, numeroPedido: e.target.value }))}
            placeholder="Ej: PED-00123"
          />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>💵 Tasa del Dólar</label>
          <input
            className="form-input"
            type="number"
            step="0.01"
            value={form.tasaBCVUsada}
            onChange={e => setForm(p => ({ ...p, tasaBCVUsada: e.target.value }))}
            placeholder="Tasa BCV"
            style={{ borderColor: 'var(--accent-green)' }}
          />
        </div>
        <div /> {/* Spacer */}
        <div /> {/* Spacer */}
      </div>

      {/* ══ DESCUENTO UPACA — Default para nuevos productos ══ */}
      <div style={{
        margin: '12px 0',
        padding: '10px 16px',
        background: 'rgba(217,119,6,0.06)',
        border: '1px solid rgba(217,119,6,0.3)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12px',
      }}>
        <span style={{ fontSize: '18px' }}>🏷️</span>
        <span style={{ color: '#92400e' }}>Descuento por defecto para nuevos productos:</span>
        <input
          type="number"
          step="0.5"
          min="0"
          max="100"
          value={descuentoDefault}
          onChange={e => setDescuentoDefault(e.target.value)}
          style={{
            width: '60px', padding: '4px 8px', fontSize: '14px', fontWeight: 700,
            textAlign: 'center', color: '#d97706', background: 'rgba(255,255,255,0.9)',
            border: '2px solid #d97706', borderRadius: '8px', outline: 'none',
          }}
        />
        <span style={{ fontWeight: 700, color: '#d97706' }}>%</span>
        <span style={{ color: '#92400e', opacity: 0.7, fontSize: '11px' }}>
          (Haz clic en el % de cada producto en la tabla para cambiarlo individualmente)
        </span>
      </div>

      {/* Add product row — hidden when editing */}
      {editingIndex === null && (
        <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid var(--accent-cyan)', borderRadius: '10px', padding: '16px', margin: '20px 0' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--accent-cyan)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>➕ Agregar Producto a la Factura</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Producto</label>
              <select className="form-select" value={currentItem.productoId} onChange={e => {
                const prod = data.productos.find(p => String(p.id) === String(e.target.value));
                setCurrentItem(p => ({ 
                  ...p, 
                  productoId: e.target.value,
                  costoUnitario: prod ? prod.precioCosto : 0 
                }));
              }}>
                <option value="">— Seleccionar producto —</option>
                {data.productos.map(p => <option key={p.id} value={String(p.id)}>{p.descripcion} ({p.presentacion}) — ${U.fmt(p.precioCosto)}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cantidad</label>
              <input className="form-input" type="number" min="1" value={currentItem.cantidad} onChange={e => setCurrentItem(p => ({ ...p, cantidad: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Costo Unit. ($)</label>
              <input className="form-input" type="number" step="0.01" value={currentItem.costoUnitario} onChange={e => setCurrentItem(p => ({ ...p, costoUnitario: e.target.value }))} />
            </div>
            <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ background: 'var(--gradient-cyan)', color: 'white' }}>Agregar</button>
          </div>
        </div>
      )}

      {/* ── Edit product panel (replaces Add panel when editing) ── */}
      {editingIndex !== null && (
        <div style={{ background: 'rgba(139,92,246,0.06)', border: '2px solid rgba(139,92,246,0.4)', borderRadius: '10px', padding: '16px', margin: '20px 0' }}>
          <h4 style={{ fontSize: '13px', color: '#8b5cf6', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✏️ Modificar Producto — Línea {editingIndex + 1}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: '12px' }}>({items[editingIndex]?.descripcion})</span>
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.6fr 0.8fr auto auto', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nuevo Producto</label>
              <select className="form-select" value={editItem.productoId} onChange={e => {
                const prod = data.productos.find(p => String(p.id) === String(e.target.value));
                setEditItem(p => ({ 
                  ...p, 
                  productoId: e.target.value,
                  costoUnitario: prod ? prod.precioCosto : 0
                }));
              }}>
                <option value="">— Seleccionar producto —</option>
                {data.productos.map(p => <option key={p.id} value={String(p.id)}>{p.descripcion} ({p.presentacion}) — ${U.fmt(p.precioCosto)}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Cant.</label>
              <input className="form-input" type="number" min="1" value={editItem.cantidad} onChange={e => setEditItem(p => ({ ...p, cantidad: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Costo ($)</label>
              <input className="form-input" type="number" step="0.01" value={editItem.costoUnitario} onChange={e => setEditItem(p => ({ ...p, costoUnitario: e.target.value }))} />
            </div>
            <button type="button" className="btn" onClick={handleConfirmEdit} style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', fontWeight: 600 }}>✅ Aplicar</button>
            <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>✖ Cancelar</button>
          </div>
        </div>
      )}

      {/* Items table — simple rows, no inline editing */}
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Presentación</th>
            <th className="text-right">Cant.</th>
            <th className="text-right">Costo Unit. ($)</th>
            <th className="text-right">IVA</th>
            <th className="text-right">Subtotal + IVA</th>
            <th className="text-right" style={{ color: '#f59e0b' }}>Desc. %</th>
            <th className="text-right">Total ($)</th>
            {tasaBCV > 0 && <th className="text-right">Total Bs.</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No hay productos agregados</td></tr>
          )}
          {items.map((item, idx) => (
            <tr key={idx} style={{
              background: editingIndex === idx ? 'rgba(139,92,246,0.08)' : undefined,
              borderLeft: editingIndex === idx ? '3px solid #8b5cf6' : undefined,
            }}>
              <td style={{ fontWeight: 600 }}>{item.descripcion}</td>
              <td>{item.presentacion}</td>
              <td className="text-right">{item.cantidad}</td>
              <td className="text-right">$ {U.fmt(item.costoUnitario)}</td>
              <td className="text-right">{item.gravable ? `$ ${U.fmt(item.iva)}` : 'Exento'}</td>
              <td className="text-right">$ {U.fmt(item.subtotalConIva)}</td>
              <td className="text-right" style={{ color: '#f59e0b', fontWeight: 600, cursor: 'pointer', position: 'relative' }}
                onClick={() => setEditingDescIdx(editingDescIdx === idx ? null : idx)}
                title="Clic para modificar el % de descuento de este producto"
              >
                {editingDescIdx === idx ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={item.descuentoPct ?? descuentoDefault}
                      onClick={e => e.stopPropagation()}
                      onChange={e => handleItemDescChange(idx, e.target.value)}
                      onBlur={() => setEditingDescIdx(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingDescIdx(null)}
                      autoFocus
                      style={{
                        width: '50px', padding: '2px 4px', fontSize: '12px', fontWeight: 700,
                        textAlign: 'center', color: '#d97706', border: '2px solid #d97706',
                        borderRadius: '6px', outline: 'none', background: 'rgba(217,119,6,0.08)',
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 700 }}>%</span>
                  </div>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#92400e', opacity: 0.7 }}>{item.descuentoPct ?? descuentoDefault}%</span>
                    - $ {U.fmt(item.montoDescuento)}
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>✏️</span>
                  </span>
                )}
              </td>
              <td className="text-right" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>$ {U.fmt(item.total)}</td>
              {Number(form.tasaBCVUsada) > 0 && (
                <td className="text-right" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {U.fmtBs(item.total, Number(form.tasaBCVUsada))}
                </td>
              )}
              <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                <button type="button" onClick={() => handleStartEdit(idx)} title="Modificar producto" style={{ background: editingIndex === idx ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', fontSize: '14px', marginRight: '4px' }}>✏️</button>
                <button type="button" onClick={() => handleRemoveItem(idx)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', fontSize: '14px' }}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      {items.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span><span>$ {U.fmt(totals.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>IVA (16%):</span><span>$ {U.fmt(totals.iva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              <span>Subtotal + IVA:</span><span>$ {U.fmt(totals.subtotalConIva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
              <span>🏷️ Descuento UPACA:</span><span>- $ {U.fmt(totals.montoDescuento)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '20px', color: 'var(--accent-cyan)', borderTop: '2px solid var(--border-color)', paddingTop: '12px' }}>
              <span>TOTAL A PAGAR:</span><span>$ {U.fmt(totals.total)}</span>
            </div>
            {Number(form.tasaBCVUsada) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '15px', color: 'var(--accent-green)', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                <span>Equivalente Bs. ({isEditing ? 'Tasa Pactada' : 'Tasa Manual'}):</span>
                <span>{U.fmtBs(totals.total, Number(form.tasaBCVUsada))}</span>
              </div>
            )}
            {!Number(form.tasaBCVUsada) && (
              <div style={{ fontSize: '11px', color: 'var(--accent-yellow)', marginTop: '8px', textAlign: 'center' }}>
                ⚠ Ingrese la tasa del dólar para ver el equivalente en Bolívares
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} style={{ background: isEditing ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'var(--gradient-cyan)', color: 'white' }}>
          {isEditing ? '💾 Guardar Cambios' : '✅ Guardar Factura'}
        </button>
      </div>
    </div>
  );
};

export default ComprasForm;
