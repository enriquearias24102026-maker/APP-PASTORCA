import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

const EMBALAJES = ['Cesta','Caja','Unidad','Paquete','Bolsa','Bandeja','Otros'];

const VentasForm = ({ onSave, onCancel, venta }) => {
  const { data, tasaBCV } = useAppData();
  const isEdit = Boolean(venta);

  const [clienteId,     setClienteId]     = useState(venta ? String(venta.clienteId||'') : '');
  const [fecha,         setFecha]         = useState(venta?.fecha         || U.today());
  const [fechaEntrega,  setFechaEntrega]  = useState(venta?.fechaEntrega  || '');
  const [observaciones, setObservaciones] = useState(venta?.observaciones || '');
  const [items,         setItems]         = useState(venta?.items         || []);
  const [cur, setCur] = useState({ productoId:'', cantidad:1, tipoEmbalaje:'Cesta', margen:20, descuento:0 });

  const totals = {
    subtotalBruto:  items.reduce((s,it) => s+(parseFloat(it.subtotalBruto)||0), 0),
    descuentoTotal: items.reduce((s,it) => s+(parseFloat(it.montoDescuento)||0), 0),
    subtotal: items.reduce((s,it) => s+(parseFloat(it.subtotal)||0), 0),
    iva:      items.reduce((s,it) => s+(parseFloat(it.iva)||0), 0),
    total:    items.reduce((s,it) => s+(parseFloat(it.total)||0), 0),
  };

  const handleAddItem = () => {
    if (!cur.productoId) return;
    const cantidad = Number(cur.cantidad);
    if (!cantidad || cantidad <= 0) return;
    const prod = data.productos.find(p => String(p.id) === String(cur.productoId));
    if (!prod) return;

    const precioCosto    = Number(prod.precioCosto) || 0;
    const gravable       = Boolean(prod.gravable);
    const margenPct      = Number(cur.margen) / 100;
    const descuentoPct   = Number(cur.descuento) / 100;
    const precioUnitario = U.r2(precioCosto * (1 + margenPct));
    const subtotalBruto  = U.r2(precioUnitario * cantidad);
    const montoDescuento = U.r2(subtotalBruto * descuentoPct);
    const subtotal       = U.r2(subtotalBruto - montoDescuento);
    const iva            = gravable ? U.r2up(subtotal * 0.16) : 0;
    const total          = U.r2(subtotal + iva);

    setItems(prev => [...prev, {
      productoId: String(prod.id), codigo: prod.codigo||'',
      descripcion: prod.descripcion||'', presentacion: prod.presentacion||'',
      categoria: prod.categoria||'', gravable,
      precioCosto, precioUnitario,
      margen: Number(cur.margen), descuento: Number(cur.descuento),
      tipoEmbalaje: cur.tipoEmbalaje || 'Cesta',
      subtotalBruto, montoDescuento, cantidad, subtotal, iva, total,
    }]);
    setCur(p => ({ ...p, productoId:'', cantidad:1, tipoEmbalaje:'Cesta' }));
  };

  const handleRemoveItem = idx => setItems(prev => prev.filter((_,i) => i !== idx));

  const handleSave = () => {
    if (!clienteId)       { alert('Por favor seleccione un cliente.'); return; }
    if (items.length===0) { alert('Por favor agregue al menos un producto.'); return; }
    const cliente = data.clientes.find(c => String(c.id)===String(clienteId));
    onSave({
      ...(isEdit ? { id: venta.id, numeroPreFactura: venta.numeroPreFactura } : {}),
      clienteId: String(clienteId),
      clienteNombre: cliente?.nombre||'--', clienteRif: cliente?.rif||'',
      clienteDireccion: cliente?.direccion||'', clienteTelefono: cliente?.telefono||'',
      clienteEmail: cliente?.email||'',
      fecha, fechaEntrega, observaciones, items,
      estadoPago: isEdit ? venta.estadoPago : 'pendiente', tasaBCVUsada: tasaBCV,
      totalBs: tasaBCV>0 ? totals.total*tasaBCV : 0,
      subtotalBruto: totals.subtotalBruto, descuentoTotal: totals.descuentoTotal,
      ...totals,
    });
  };

  const previewProd   = data.productos.find(p => String(p.id)===String(cur.productoId));
  const previewCosto  = previewProd ? Number(previewProd.precioCosto)||0 : 0;
  const previewMargen = previewCosto * (1 + Number(cur.margen)/100);
  const previewFinal  = previewMargen * (1 - Number(cur.descuento)/100);

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, color:'#1e293b', outline:'none', background:'white', fontFamily:'inherit', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:'0.7px', display:'block', marginBottom:5 };
  const thC = { padding:'10px 12px', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'#0f172a', background:'rgba(5,150,105,0.08)', borderBottom:'2px solid rgba(5,150,105,0.3)', whiteSpace:'nowrap', textAlign:'left' };
  const tdS = { padding:'11px 12px', fontSize:13, color:'#1e293b', borderBottom:'1px solid #e2e8f0', verticalAlign:'middle' };

  const colCount = tasaBCV>0 ? 11 : 10;

  return (
    <div style={{ fontFamily:'Inter,sans-serif' }}>

      {/* NOTICE */}
      <div style={{ background:'linear-gradient(135deg,rgba(5,150,105,0.1),rgba(16,185,129,0.04))', border:'1.5px solid rgba(5,150,105,0.3)', borderRadius:14, padding:'14px 20px', marginBottom:22, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ fontSize:28, lineHeight:1 }}>{'\u{1F4B5}'}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'#065f46', marginBottom:2 }}>{'PAGO DEL CLIENTE: en Bolivares (Bs.) segun Tasa BCV'}</div>
          <div style={{ fontSize:12, color:'#047857' }}>
            {'Precios en USD convertidos a Bs. al cobro'}
            {tasaBCV>0
              ? <strong style={{ color:'#059669' }}>{' | Tasa: Bs. '+new Intl.NumberFormat('es-VE',{minimumFractionDigits:2}).format(tasaBCV)}</strong>
              : <span style={{ color:'#dc2626' }}>{' | Ingresa la tasa BCV en el encabezado'}</span>}
          </div>
        </div>
      </div>

      {/* DATOS GENERALES */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:18, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ background:'linear-gradient(135deg,#1e40af,#2563eb)', padding:'11px 20px' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{'Datos de la Pre-Factura'}</span>
        </div>
        <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:14 }}>
          <div>
            <label style={lbl}>{'CLIENTE'}</label>
            <select value={clienteId} onChange={e=>setClienteId(e.target.value)}
              style={{ ...inp, cursor:'pointer' }}>
              <option value="">{'-- Seleccionar cliente --'}</option>
              {data.clientes.map(c=><option key={c.id} value={String(c.id)}>{c.nombre+' | '+c.rif}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{'FECHA FACTURA'}</label>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>{'FECHA DE ENTREGA'}</label>
            <input type="date" value={fechaEntrega} onChange={e=>setFechaEntrega(e.target.value)} style={inp} />
          </div>
        </div>
      </div>

      {/* AGREGAR PRODUCTO */}
      <div style={{ background:'white', borderRadius:14, border:'1.5px solid rgba(5,150,105,0.35)', overflow:'hidden', marginBottom:18, boxShadow:'0 2px 10px rgba(5,150,105,0.1)' }}>
        <div style={{ background:'linear-gradient(135deg,#047857,#059669)', padding:'11px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{'+ Agregar Producto'}</span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>{items.length+' producto(s) en la factura'}</span>
        </div>
        <div style={{ padding:'18px 20px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 0.4fr 0.75fr 0.45fr 0.45fr auto', gap:12, alignItems:'flex-end' }}>

            {/* Producto */}
            <div>
              <label style={lbl}>{'PRODUCTO'}</label>
              <select value={cur.productoId} onChange={e=>setCur(p=>({...p,productoId:e.target.value}))}
                style={{ ...inp, cursor:'pointer' }}>
                <option value="">{'-- Seleccionar --'}</option>
                {data.productos.map(p=>(
                  <option key={p.id} value={String(p.id)}>
                    {p.descripcion+' ('+p.presentacion+') -- $'+U.fmt(p.precioCosto)}
                  </option>
                ))}
              </select>
            </div>

            {/* Cantidad */}
            <div>
              <label style={lbl}>{'CANTIDAD'}</label>
              <input type="number" min="1" value={cur.cantidad}
                onChange={e=>setCur(p=>({...p,cantidad:e.target.value}))} style={inp} />
            </div>

            {/* TIPO EMBALAJE */}
            <div>
              <label style={{ ...lbl, color:'#7c3aed' }}>{'TIPO EMBALAJE'}</label>
              <select
                value={cur.tipoEmbalaje}
                onChange={e=>setCur(p=>({...p,tipoEmbalaje:e.target.value}))}
                style={{ ...inp, borderColor:'rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.03)', color:'#4c1d95', fontWeight:700, cursor:'pointer' }}>
                {EMBALAJES.map(op=><option key={op} value={op}>{op}</option>)}
              </select>
            </div>

            {/* Margen */}
            <div>
              <label style={lbl} title="MARGEN DE GANANCIA: % que agregas al costo UPACA para obtener tu precio de venta">
                {'MARGEN %'}
                <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', background:'#059669', color:'white', fontSize:8, fontWeight:900, textAlign:'center', lineHeight:'14px', marginLeft:4, cursor:'help' }}>{'?'}</span>
              </label>
              <input type="number" min="0" max="200" value={cur.margen}
                onChange={e=>setCur(p=>({...p,margen:e.target.value}))}
                style={{ ...inp, borderColor:'rgba(5,150,105,0.4)', background:'rgba(5,150,105,0.03)' }} />
            </div>

            {/* Descuento */}
            <div>
              <label style={lbl} title="DESCUENTO AL CLIENTE: % que rebajas del precio con margen para ofrecerle al cliente">
                {'DESC. %'}
                <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', background:'#d97706', color:'white', fontSize:8, fontWeight:900, textAlign:'center', lineHeight:'14px', marginLeft:4, cursor:'help' }}>{'?'}</span>
              </label>
              <input type="number" min="0" max="100" value={cur.descuento}
                onChange={e=>setCur(p=>({...p,descuento:e.target.value}))}
                style={{ ...inp, borderColor:Number(cur.descuento)>0?'#f59e0b':'#e2e8f0', background:Number(cur.descuento)>0?'rgba(245,158,11,0.06)':'white' }} />
            </div>

            {/* Boton */}
            <button onClick={handleAddItem} style={{ background:'linear-gradient(135deg,#047857,#059669)', color:'white', border:'none', borderRadius:10, padding:'11px 20px', fontSize:14, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(5,150,105,0.4)', height:44 }}>
              {'+ Agregar'}
            </button>
          </div>

          {/* Preview calculo */}
          {previewProd && (
            <div style={{ marginTop:12, padding:'10px 16px', background:'rgba(5,150,105,0.05)', borderRadius:10, border:'1px dashed rgba(5,150,105,0.3)', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', fontSize:11, color:'#64748b' }}>
              <span>{'Costo: '}<strong style={{ color:'#0f172a' }}>{'$ '+U.fmt(previewCosto)}</strong></span>
              <span style={{ color:'#94a3b8' }}>{'-->'}</span>
              <span>{'+ Margen '+cur.margen+'%: '}<strong style={{ color:'#059669' }}>{'$ '+U.fmt(previewMargen)}</strong></span>
              {Number(cur.descuento)>0 && (
                <span>{'- Desc. '+cur.descuento+'%: '}<strong style={{ color:'#d97706' }}>{'$ '+U.fmt(previewFinal)}</strong></span>
              )}
              <span style={{ color:'#94a3b8' }}>{'-->'}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#1e40af' }}>
                {'Precio cliente: $ '+U.fmt(previewFinal)}
                {previewProd.gravable
                  ? <span style={{ color:'#d97706', marginLeft:4 }}>{' + IVA 16%'}</span>
                  : <span style={{ color:'#059669', marginLeft:4 }}>{' (Exento)'}</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE ITEMS */}
      <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(5,150,105,0.25)', boxShadow:'0 2px 8px rgba(5,150,105,0.08)', marginBottom:18 }}>
        <div style={{ background:'linear-gradient(135deg,#065f46,#059669)', padding:'11px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{'Productos en la Pre-Factura'}</span>
          {items.length>0 && <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>{'Total: $ '+U.fmt(totals.total)}</span>}
        </div>
        <div style={{ background:'white', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={thC}>{'PRODUCTO'}</th>
                <th style={thC}>{'PRESENTACION'}</th>
                <th style={{ ...thC, textAlign:'right' }}>{'CANTIDAD'}</th>
                <th style={{ ...thC, textAlign:'center', color:'#7c3aed', background:'rgba(124,58,237,0.08)', borderBottom:'2px solid rgba(124,58,237,0.3)' }}>{'TIPO EMBALAJE'}</th>
                <th style={{ ...thC, textAlign:'right' }} title="Margen de ganancia sobre costo UPACA">{'MARGEN %'}</th>
                <th style={{ ...thC, textAlign:'right' }} title="Descuento que le das al cliente">{'DESC. %'}</th>
                <th style={{ ...thC, textAlign:'right' }}>{'P.UNIT ($)'}</th>
                <th style={{ ...thC, textAlign:'right' }}>{'IVA'}</th>
                <th style={{ ...thC, textAlign:'right' }}>{'TOTAL ($)'}</th>
                {tasaBCV>0 && <th style={{ ...thC, textAlign:'right' }}>{'BS.'}</th>}
                <th style={{ ...thC, textAlign:'center' }}>{'X'}</th>
              </tr>
            </thead>
            <tbody>
              {items.length===0 && (
                <tr><td colSpan={colCount} style={{ padding:'40px', textAlign:'center' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#334155', marginBottom:4 }}>{'Sin productos agregados'}</div>
                  <div style={{ fontSize:12, color:'#64748b' }}>{'Selecciona un producto y haz clic en + Agregar'}</div>
                </td></tr>
              )}
              {items.map((it,idx) => (
                <tr key={idx}
                  style={{ background:idx%2===0?'white':'#f0fdf4', transition:'background 0.15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(5,150,105,0.05)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background=idx%2===0?'white':'#f0fdf4';}}
                >
                  <td style={{ ...tdS, fontWeight:700, color:'#0f172a' }}>
                    <div>{it.descripcion}</div>
                    <div style={{ fontSize:10, fontFamily:'monospace', color:'#6366f1', marginTop:2 }}>{it.codigo}</div>
                  </td>
                  <td style={{ ...tdS, color:'#475569', fontSize:12 }}>{it.presentacion}</td>
                  <td style={{ ...tdS, textAlign:'right', fontWeight:700 }}>{it.cantidad}</td>
                  <td style={{ ...tdS, textAlign:'center' }}>
                    <span style={{ display:'inline-block', background:'rgba(124,58,237,0.1)', color:'#5b21b6', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:800, border:'1px solid rgba(124,58,237,0.3)' }}>
                      {it.tipoEmbalaje||'Cesta'}
                    </span>
                  </td>
                  <td style={{ ...tdS, textAlign:'right' }}>
                    <span style={{ background:'rgba(5,150,105,0.1)', color:'#047857', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{it.margen+'%'}</span>
                  </td>
                  <td style={{ ...tdS, textAlign:'right' }}>
                    {it.descuento>0
                      ? <span style={{ background:'rgba(245,158,11,0.12)', color:'#b45309', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{it.descuento+'%'}</span>
                      : <span style={{ color:'#94a3b8' }}>{'--'}</span>}
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontWeight:600, color:'#334155' }}>{'$ '+U.fmt(it.precioUnitario)}</td>
                  <td style={{ ...tdS, textAlign:'right' }}>
                    {it.gravable
                      ? <span style={{ background:'rgba(245,158,11,0.1)', color:'#b45309', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{'$ '+U.fmt(it.iva)}</span>
                      : <span style={{ background:'rgba(5,150,105,0.1)', color:'#059669', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{'Exento'}</span>}
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontWeight:800, color:'#059669', fontSize:14 }}>{'$ '+U.fmt(it.total)}</td>
                  {tasaBCV>0 && <td style={{ ...tdS, textAlign:'right', fontSize:11, color:'#64748b' }}>{U.fmtBs(it.total,tasaBCV)}</td>}
                  <td style={{ ...tdS, textAlign:'center' }}>
                    <button onClick={()=>handleRemoveItem(idx)} style={{ background:'rgba(239,68,68,0.1)', color:'#dc2626', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, cursor:'pointer', padding:'6px 10px', fontSize:14 }}>{'X'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALES */}
      {items.length>0 && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:18 }}>
          <div style={{ background:'white', border:'1px solid #e2e8f0', borderRadius:16, overflow:'hidden', minWidth:340, boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ background:'linear-gradient(135deg,#065f46,#059669)', padding:'11px 20px' }}>
              <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{'Resumen de Totales'}</span>
            </div>
            <div style={{ padding:'16px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'#334155' }}>
                <span>{'Subtotal (con margen):'}</span><strong>{'$ '+U.fmt(totals.subtotalBruto)}</strong>
              </div>
              {totals.descuentoTotal>0 && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'#d97706' }}>
                  <span>{'Descuento aplicado:'}</span><strong>{'- $ '+U.fmt(totals.descuentoTotal)}</strong>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'#475569' }}>
                <span>{'Base imponible:'}</span><strong>{'$ '+U.fmt(totals.subtotal)}</strong>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13, color:'#475569' }}>
                <span>{'IVA (16%):'}</span><strong>{'$ '+U.fmt(totals.iva)}</strong>
              </div>
              <div style={{ borderTop:'2px solid #e2e8f0', paddingTop:12, marginTop:4, display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:900, color:'#059669' }}>
                <span>{'TOTAL USD'}</span><span>{'$ '+U.fmt(totals.total)}</span>
              </div>
              {tasaBCV>0 && (
                <div style={{ borderTop:'1px dashed #e2e8f0', paddingTop:10, marginTop:10, display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, color:'#0891b2' }}>
                  <span>{'Cliente paga (Bs.)'}</span><span>{U.fmtBs(totals.total,tasaBCV)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OBSERVACIONES */}
      <div style={{ marginBottom:22 }}>
        <label style={{ ...lbl, marginBottom:8 }}>{'OBSERVACIONES (opcional)'}</label>
        <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} rows={2}
          placeholder="Instrucciones de entrega, condiciones especiales..."
          style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
      </div>

      {/* ACCIONES */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:12, paddingTop:16, borderTop:'2px solid #f1f5f9' }}>
        <button onClick={onCancel} style={{ background:'#f1f5f9', border:'1.5px solid #e2e8f0', color:'#475569', borderRadius:12, padding:'12px 28px', fontSize:14, fontWeight:700, cursor:'pointer' }}>
          {'Cancelar'}
        </button>
        <button onClick={handleSave} style={{ background:'linear-gradient(135deg,#047857,#059669)', color:'white', border:'none', borderRadius:12, padding:'12px 32px', fontSize:14, fontWeight:800, cursor:'pointer', boxShadow:'0 6px 20px rgba(5,150,105,0.45)' }}>
          {isEdit ? '💾 Guardar Cambios' : '✅ Guardar Pre-Factura'}
        </button>
      </div>
    </div>
  );
};

export default VentasForm;
