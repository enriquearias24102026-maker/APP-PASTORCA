import React, { useState, useMemo } from 'react';
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
  const [cur, setCur] = useState({ productoId:'', cantidad:1, tipoEmbalaje:'Cesta', margen:20, descuento:0, precioUnitario: 0 });
  const [localTasaBCV, setLocalTasaBCV] = useState(venta ? String(venta.tasaBCVUsada || tasaBCV || '') : String(tasaBCV || ''));
  const [tasaCalculo, setTasaCalculo] = useState(venta ? Number(venta.tasaBCVUsada || tasaBCV || 0) : Number(tasaBCV || 0));
  const [selCategoria, setSelCategoria] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editCur, setEditCur] = useState(null);
  const [tipoDocumento, setTipoDocumento] = useState(venta?.tipoDocumento || 'factura');
  const [porcentajeIva, setPorcentajeIva] = useState(venta ? Number(venta.porcentajeIva ?? 16) : 16);

  const handleTipoDocumentoChange = (newTipo) => {
    setTipoDocumento(newTipo);
    setItems(prevItems => prevItems.map(item => {
      const iva = (newTipo === 'factura' && item.gravable) ? U.r2up(item.subtotal * (porcentajeIva / 100)) : 0;
      const total = U.r2(item.subtotal + iva);
      return { ...item, iva, total };
    }));
  };

  const handlePorcentajeIvaChange = (newPct) => {
    setPorcentajeIva(newPct);
    setItems(prevItems => prevItems.map(item => {
      const iva = (tipoDocumento === 'factura' && item.gravable) ? U.r2up(item.subtotal * (newPct / 100)) : 0;
      const total = U.r2(item.subtotal + iva);
      return { ...item, iva, total };
    }));
  };

  const handleStartEdit = (idx) => {
    const item = items[idx];
    setEditingIndex(idx);
    setEditCur({
      productoId: item.productoId,
      cantidad: item.cantidad,
      tipoEmbalaje: item.tipoEmbalaje || 'Cesta',
      margen: item.margen,
      descuento: item.descuento,
      precioUnitario: item.precioUnitario,
    });
    const prod = data.productos.find(p => String(p.id) === String(item.productoId));
    if (prod?.categoria) {
      setSelCategoria(prod.categoria);
    }
  };

  const handleConfirmEdit = () => {
    if (editingIndex === null) return;
    if (!editCur.productoId) return;
    const cantidad = Number(editCur.cantidad);
    if (!cantidad || cantidad <= 0) return;

    const prod = data.productos.find(p => String(p.id) === String(editCur.productoId));
    if (!prod) return;

    const precioCosto    = Number(prod.precioCosto) || 0;
    const gravable       = Boolean(prod.gravable);
    const margenPct      = Number(editCur.margen) / 100;
    const descuentoPct   = Number(editCur.descuento) / 100;
    const precioUnitario = Number(editCur.precioUnitario) || U.r2(precioCosto * (1 + margenPct));
    const subtotalBruto  = U.r2(precioUnitario * cantidad);
    const montoDescuento = U.r2(subtotalBruto * descuentoPct);
    const subtotal       = U.r2(subtotalBruto - montoDescuento);
    const iva            = (tipoDocumento === 'factura' && gravable) ? U.r2up(subtotal * (porcentajeIva / 100)) : 0;
    const total          = U.r2(subtotal + iva);

    setItems(prev => prev.map((it, i) => i === editingIndex ? {
      productoId: String(prod.id), codigo: prod.codigo||'',
      descripcion: prod.descripcion||'', presentacion: prod.presentacion||'',
      categoria: prod.categoria||'', gravable,
      precioCosto, precioUnitario,
      margen: Number(editCur.margen), descuento: Number(editCur.descuento),
      tipoEmbalaje: editCur.tipoEmbalaje || 'Cesta',
      subtotalBruto, montoDescuento, cantidad, subtotal, iva, total,
    } : it));

    setEditingIndex(null);
    setEditCur(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditCur(null);
  };

  const categorias = useMemo(() => {
    return Array.from(new Set(data.productos.map(p => p.categoria).filter(Boolean))).sort();
  }, [data.productos]);

  const productosAgrupados = useMemo(() => {
    const groups = {};
    data.productos.forEach(p => {
      const cat = p.categoria || 'Otros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [data.productos]);

  const filteredProductos = useMemo(() => {
    return selCategoria
      ? data.productos.filter(p => p.categoria === selCategoria)
      : data.productos;
  }, [data.productos, selCategoria]);

  const handleCategoriaChange = (cat) => {
    setSelCategoria(cat);
    if (cat && cur.productoId) {
      const prod = data.productos.find(p => String(p.id) === String(cur.productoId));
      if (prod?.categoria !== cat) {
        setCur(prev => ({ ...prev, productoId: '', precioUnitario: 0 }));
      }
    }
  };

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
    const precioUnitario = Number(cur.precioUnitario) || U.r2(precioCosto * (1 + margenPct));
    const subtotalBruto  = U.r2(precioUnitario * cantidad);
    const montoDescuento = U.r2(subtotalBruto * descuentoPct);
    const subtotal       = U.r2(subtotalBruto - montoDescuento);
    const iva            = (tipoDocumento === 'factura' && gravable) ? U.r2up(subtotal * (porcentajeIva / 100)) : 0;
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
    setCur(p => ({ ...p, productoId:'', cantidad:1, tipoEmbalaje:'Cesta', precioUnitario: 0 }));
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
      estadoPago: isEdit ? venta.estadoPago : 'pendiente', tasaBCVUsada: Number(tasaCalculo) || 0,
      totalBs: tasaCalculo>0 ? totals.total*tasaCalculo : 0,
      subtotalBruto: totals.subtotalBruto, descuentoTotal: totals.descuentoTotal,
      tipoDocumento,
      porcentajeIva: tipoDocumento === 'nota' ? 0 : Number(porcentajeIva),
      ...totals,
    });
  };

  const previewProd   = data.productos.find(p => String(p.id)===String(cur.productoId));
  const previewCosto  = previewProd ? Number(previewProd.precioCosto)||0 : 0;
  const previewMargen = Number(cur.precioUnitario) || U.r2(previewCosto * (1 + Number(cur.margen)/100));
  const previewFinal  = previewMargen * (1 - Number(cur.descuento)/100);

  const editProd   = (editingIndex !== null && editCur) ? data.productos.find(p => String(p.id)===String(editCur.productoId)) : null;
  const editCosto  = editProd ? Number(editProd.precioCosto)||0 : 0;
  const editMargen = Number(editCur?.precioUnitario) || U.r2(editCosto * (1 + Number(editCur?.margen || 0)/100));
  const editFinal  = editMargen * (1 - Number(editCur?.descuento || 0)/100);

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, color:'#1e293b', outline:'none', background:'white', fontFamily:'inherit', boxSizing:'border-box' };
  const lbl = { fontSize:11, fontWeight:800, color:'#334155', textTransform:'uppercase', letterSpacing:'0.7px', display:'block', marginBottom:5 };
  const thC = { padding:'10px 12px', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.8px', color:'#0f172a', background:'rgba(5,150,105,0.08)', borderBottom:'2px solid rgba(5,150,105,0.3)', whiteSpace:'nowrap', textAlign:'left' };
  const tdS = { padding:'11px 12px', fontSize:13, color:'#1e293b', borderBottom:'1px solid #e2e8f0', verticalAlign:'middle' };

  const colCount = tasaCalculo>0 ? 11 : 10;

  return (
    <div style={{ fontFamily:'Inter,sans-serif' }}>

      {/* NOTICE */}
      <div style={{ background:'linear-gradient(135deg,rgba(5,150,105,0.1),rgba(16,185,129,0.04))', border:'1.5px solid rgba(5,150,105,0.3)', borderRadius:14, padding:'14px 20px', marginBottom:22, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ fontSize:28, lineHeight:1 }}>{'\u{1F4B5}'}</div>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'#065f46', marginBottom:2 }}>{'PAGO DEL CLIENTE: en Bolivares (Bs.) segun Tasa BCV'}</div>
          <div style={{ fontSize:12, color:'#047857' }}>
            {'Precios en USD convertidos a Bs. al cobro'}
            {tasaCalculo>0
              ? <strong style={{ color:'#059669' }}>{' | Tasa activa para esta factura: Bs. '+new Intl.NumberFormat('es-VE',{minimumFractionDigits:2}).format(tasaCalculo)}</strong>
              : <span style={{ color:'#dc2626' }}>{' | Ingresa la tasa del dólar'}</span>}
          </div>
        </div>
      </div>

      {/* DATOS GENERALES */}
      <div style={{ background:'white', borderRadius:14, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:18, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ background:'linear-gradient(135deg,#1e40af,#2563eb)', padding:'11px 20px' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{'Datos de la Pre-Factura'}</span>
        </div>
        <div style={{ padding:'18px 20px', display:'grid', gridTemplateColumns:'2.5fr 1.25fr 0.8fr 1.25fr 1.25fr 1.5fr', gap:14 }}>
          <div>
            <label style={lbl}>{'CLIENTE'}</label>
            <select value={clienteId} onChange={e=>setClienteId(e.target.value)}
              style={{ ...inp, cursor:'pointer' }}>
              <option value="">{'-- Seleccionar cliente --'}</option>
              {data.clientes.map(c=><option key={c.id} value={String(c.id)}>{c.nombre+' | '+c.rif}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>{'TIPO DOCUMENTO'}</label>
            <select value={tipoDocumento} onChange={e=>handleTipoDocumentoChange(e.target.value)}
              style={{ ...inp, cursor:'pointer', borderColor:'#2563eb', background:'rgba(37,99,235,0.02)', fontWeight:700 }}>
              <option value="factura">{'📄 Factura (con IVA)'}</option>
              <option value="nota">{'📝 Nota de Entrega (sin IVA)'}</option>
            </select>
          </div>
          <div>
            <label style={lbl}>{'IVA %'}</label>
            <input
              type="number"
              min="0"
              max="100"
              value={tipoDocumento === 'nota' ? 0 : porcentajeIva}
              onChange={e => {
                const val = Number(e.target.value);
                if (val >= 0 && val <= 100) {
                  handlePorcentajeIvaChange(val);
                }
              }}
              disabled={tipoDocumento === 'nota'}
              style={{
                ...inp,
                background: tipoDocumento === 'nota' ? '#f1f5f9' : 'white',
                color: tipoDocumento === 'nota' ? '#94a3b8' : '#1e293b'
              }}
            />
          </div>
          <div>
            <label style={lbl}>{'FECHA FACTURA'}</label>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>{'FECHA DE ENTREGA'}</label>
            <input type="date" value={fechaEntrega} onChange={e=>setFechaEntrega(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ ...lbl, color: '#059669' }}>{'TASA DÓLAR (Bs.)'}</label>
            <input
              type="text"
              inputMode="decimal"
              value={localTasaBCV}
              onChange={e => {
                const val = e.target.value;
                if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                  setLocalTasaBCV(val);
                  const num = parseFloat(String(val).replace(',', '.')) || 0;
                  setTasaCalculo(num);
                }
              }}
              style={{ ...inp, borderColor: '#059669' }}
              placeholder="Tasa BCV"
            />
          </div>
        </div>
      </div>

      {/* AGREGAR/MODIFICAR PRODUCTO */}
      {editingIndex === null ? (
        <div style={{ background:'white', borderRadius:14, border:'1.5px solid rgba(5,150,105,0.35)', overflow:'hidden', marginBottom:18, boxShadow:'0 2px 10px rgba(5,150,105,0.1)' }}>
          <div style={{ background:'linear-gradient(135deg,#047857,#059669)', padding:'11px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{'+ Agregar Producto'}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>{items.length+' producto(s) en la factura'}</span>
          </div>
          <div style={{ padding:'18px 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1.6fr 0.5fr 0.7fr 0.6fr 0.5fr 0.5fr auto', gap:12, alignItems:'flex-end' }}>

              {/* Categoría */}
              <div>
                <label style={{ ...lbl, color: '#059669' }}>{'CATEGORÍA'}</label>
                <select value={selCategoria} onChange={e => handleCategoriaChange(e.target.value)}
                  style={{ ...inp, cursor:'pointer', borderColor: 'rgba(5,150,105,0.4)', background: 'rgba(5,150,105,0.02)' }}>
                  <option value="">{'-- Todas --'}</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto */}
              <div>
                <label style={lbl}>{'PRODUCTO'}</label>
                <select value={cur.productoId} onChange={e=>{
                  const pId = e.target.value;
                  const prod = data.productos.find(p => String(p.id) === String(pId));
                  const costo = prod ? Number(prod.precioCosto) || 0 : 0;
                  const pUnit = U.r2(costo * (1 + Number(cur.margen)/100));
                  setCur(p=>({...p, productoId: pId, precioUnitario: pUnit}));
                }}
                  style={{ ...inp, cursor:'pointer' }}>
                  <option value="">{'-- Seleccionar --'}</option>
                  {selCategoria ? (
                    [...filteredProductos].sort((a,b) => (a.descripcion||'').localeCompare(b.descripcion||'')).map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.descripcion+' ('+p.presentacion+') -- $'+U.fmt(p.precioCosto)}
                      </option>
                    ))
                  ) : (
                    Object.keys(productosAgrupados).sort().map(cat => (
                      <optgroup key={cat} label={cat.toUpperCase()}>
                        {[...productosAgrupados[cat]].sort((a,b)=>(a.descripcion||'').localeCompare(b.descripcion||'')).map(p => (
                          <option key={p.id} value={String(p.id)}>
                            {p.descripcion+' ('+p.presentacion+') -- $'+U.fmt(p.precioCosto)}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
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

              {/* Precio Unitario */}
              <div>
                <label style={lbl}>{'P. UNIT ($)'}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cur.precioUnitario || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                      const numVal = parseFloat(String(val).replace(',', '.')) || 0;
                      const prod = data.productos.find(p => String(p.id) === String(cur.productoId));
                      const costo = prod ? Number(prod.precioCosto) || 0 : 0;
                      let newMargen = 0;
                      if (costo > 0) {
                        newMargen = U.r2(((numVal / costo) - 1) * 100);
                      }
                      setCur(p => ({ ...p, precioUnitario: val, margen: newMargen }));
                    }
                  }}
                  onBlur={e => {
                    const val = e.target.value;
                    const numVal = U.r2(parseFloat(String(val).replace(',', '.')) || 0);
                    setCur(p => ({ ...p, precioUnitario: numVal }));
                  }}
                  style={inp}
                />
              </div>

              {/* Margen */}
              <div>
                <label style={lbl} title="MARGEN DE GANANCIA: % que agregas al costo UPACA para obtener tu precio de venta">
                  {'MARGEN %'}
                  <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', background:'#059669', color:'white', fontSize:8, fontWeight:900, textAlign:'center', lineHeight:'14px', marginLeft:4, cursor:'help' }}>{'?'}</span>
                </label>
                <input type="number" min="0" max="200" value={cur.margen}
                  onChange={e=>{
                    const margVal = e.target.value;
                    const prod = data.productos.find(p => String(p.id) === String(cur.productoId));
                    const costo = prod ? Number(prod.precioCosto) || 0 : 0;
                    const pUnit = U.r2(costo * (1 + Number(margVal)/100));
                    setCur(p=>({...p, margen: margVal, precioUnitario: pUnit}));
                  }}
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
                  {(tipoDocumento === 'factura' && previewProd.gravable)
                    ? <span style={{ color:'#d97706', marginLeft:4 }}>{' + IVA ' + porcentajeIva + '%'}</span>
                    : <span style={{ color:'#059669', marginLeft:4 }}>{tipoDocumento === 'nota' ? ' (Nota de Entrega - Sin IVA)' : ' (Exento)'}</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:14, border:'2px solid rgba(124,58,237,0.45)', overflow:'hidden', marginBottom:18, boxShadow:'0 2px 10px rgba(124,58,237,0.15)' }}>
          <div style={{ background:'linear-gradient(135deg,#7c3aed,#8b5cf6)', padding:'11px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, fontWeight:800, color:'white' }}>{'✏️ Modificar Producto — Línea ' + (editingIndex + 1)}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.65)' }}>{'Editando producto agregado'}</span>
          </div>
          <div style={{ padding:'18px 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1.1fr 1.6fr 0.5fr 0.7fr 0.6fr 0.5fr 0.5fr auto auto', gap:12, alignItems:'flex-end' }}>

              {/* Categoría */}
              <div>
                <label style={{ ...lbl, color: '#7c3aed' }}>{'CATEGORÍA'}</label>
                <select value={selCategoria} onChange={e => handleCategoriaChange(e.target.value)}
                  style={{ ...inp, cursor:'pointer', borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.02)' }}>
                  <option value="">{'-- Todas --'}</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto */}
              <div>
                <label style={lbl}>{'PRODUCTO'}</label>
                <select value={editCur?.productoId || ''} onChange={e=>{
                  const pId = e.target.value;
                  const prod = data.productos.find(p => String(p.id) === String(pId));
                  const costo = prod ? Number(prod.precioCosto) || 0 : 0;
                  const pUnit = U.r2(costo * (1 + Number(editCur?.margen || 0)/100));
                  setEditCur(p=>({...p, productoId: pId, precioUnitario: pUnit}));
                }}
                  style={{ ...inp, cursor:'pointer' }}>
                  <option value="">{'-- Seleccionar --'}</option>
                  {selCategoria ? (
                    [...filteredProductos].sort((a,b) => (a.descripcion||'').localeCompare(b.descripcion||'')).map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.descripcion+' ('+p.presentacion+') -- $'+U.fmt(p.precioCosto)}
                      </option>
                    ))
                  ) : (
                    Object.keys(productosAgrupados).sort().map(cat => (
                      <optgroup key={cat} label={cat.toUpperCase()}>
                        {[...productosAgrupados[cat]].sort((a,b)=>(a.descripcion||'').localeCompare(b.descripcion||'')).map(p => (
                          <option key={p.id} value={String(p.id)}>
                            {p.descripcion+' ('+p.presentacion+') -- $'+U.fmt(p.precioCosto)}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label style={lbl}>{'CANTIDAD'}</label>
                <input type="number" min="1" value={editCur?.cantidad || 1}
                  onChange={e=>setEditCur(p=>({...p,cantidad:e.target.value}))} style={inp} />
              </div>

              {/* TIPO EMBALAJE */}
              <div>
                <label style={{ ...lbl, color:'#7c3aed' }}>{'TIPO EMBALAJE'}</label>
                <select
                  value={editCur?.tipoEmbalaje || 'Cesta'}
                  onChange={e=>setEditCur(p=>({...p,tipoEmbalaje:e.target.value}))}
                  style={{ ...inp, borderColor:'rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.03)', color:'#4c1d95', fontWeight:700, cursor:'pointer' }}>
                  {EMBALAJES.map(op=><option key={op} value={op}>{op}</option>)}
                </select>
              </div>

              {/* Precio Unitario */}
              <div>
                <label style={lbl}>{'P. UNIT ($)'}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editCur?.precioUnitario || ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
                      const numVal = parseFloat(String(val).replace(',', '.')) || 0;
                      const prod = data.productos.find(p => String(p.id) === String(editCur?.productoId));
                      const costo = prod ? Number(prod.precioCosto) || 0 : 0;
                      let newMargen = 0;
                      if (costo > 0) {
                        newMargen = U.r2(((numVal / costo) - 1) * 100);
                      }
                      setEditCur(p => ({ ...p, precioUnitario: val, margen: newMargen }));
                    }
                  }}
                  onBlur={e => {
                    const val = e.target.value;
                    const numVal = U.r2(parseFloat(String(val).replace(',', '.')) || 0);
                    setEditCur(p => ({ ...p, precioUnitario: numVal }));
                  }}
                  style={inp}
                />
              </div>

              {/* Margen */}
              <div>
                <label style={lbl} title="MARGEN DE GANANCIA: % que agregas al costo UPACA para obtener tu precio de venta">
                  {'MARGEN %'}
                  <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', background:'#7c3aed', color:'white', fontSize:8, fontWeight:900, textAlign:'center', lineHeight:'14px', marginLeft:4, cursor:'help' }}>{'?'}</span>
                </label>
                <input type="number" min="0" max="200" value={editCur?.margen || 0}
                  onChange={e=>{
                    const margVal = e.target.value;
                    const prod = data.productos.find(p => String(p.id) === String(editCur?.productoId));
                    const costo = prod ? Number(prod.precioCosto) || 0 : 0;
                    const pUnit = U.r2(costo * (1 + Number(margVal)/100));
                    setEditCur(p=>({...p, margen: margVal, precioUnitario: pUnit}));
                  }}
                  style={{ ...inp, borderColor:'rgba(124,58,237,0.4)', background:'rgba(124,58,237,0.03)' }} />
              </div>

              {/* Descuento */}
              <div>
                <label style={lbl} title="DESCUENTO AL CLIENTE: % que rebajas del precio con margen para ofrecerle al cliente">
                  {'DESC. %'}
                  <span style={{ display:'inline-block', width:14, height:14, borderRadius:'50%', background:'#d97706', color:'white', fontSize:8, fontWeight:900, textAlign:'center', lineHeight:'14px', marginLeft:4, cursor:'help' }}>{'?'}</span>
                </label>
                <input type="number" min="0" max="100" value={editCur?.descuento || 0}
                  onChange={e=>setEditCur(p=>({...p,descuento:e.target.value}))}
                  style={{ ...inp, borderColor:Number(editCur?.descuento || 0)>0?'#f59e0b':'#e2e8f0', background:Number(editCur?.descuento || 0)>0?'rgba(245,158,11,0.06)':'white' }} />
              </div>

              {/* Boton Aplicar */}
              <button onClick={handleConfirmEdit} style={{ background:'linear-gradient(135deg, #059669, #10b981)', color:'white', border:'none', borderRadius:10, padding:'11px 20px', fontSize:14, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(5,150,105,0.4)', height:44 }}>
                {'✅ Aplicar'}
              </button>

              {/* Boton Cancelar */}
              <button onClick={handleCancelEdit} style={{ background:'#f1f5f9', border:'1.5px solid #e2e8f0', color:'#475569', borderRadius:10, padding:'11px 20px', fontSize:14, fontWeight:800, cursor:'pointer', whiteSpace:'nowrap', height:44 }}>
                {'✖'}
              </button>
            </div>

            {/* Preview calculo */}
            {editProd && (
              <div style={{ marginTop:12, padding:'10px 16px', background:'rgba(124,58,237,0.05)', borderRadius:10, border:'1px dashed rgba(124,58,237,0.3)', display:'flex', gap:16, flexWrap:'wrap', alignItems:'center', fontSize:11, color:'#64748b' }}>
                <span>{'Costo: '}<strong style={{ color:'#0f172a' }}>{'$ '+U.fmt(editCosto)}</strong></span>
                <span style={{ color:'#94a3b8' }}>{'-->'}</span>
                <span>{'+ Margen '+editCur.margen+'%: '}<strong style={{ color:'#7c3aed' }}>{'$ '+U.fmt(editMargen)}</strong></span>
                {Number(editCur.descuento)>0 && (
                  <span>{'- Desc. '+editCur.descuento+'%: '}<strong style={{ color:'#d97706' }}>{'$ '+U.fmt(editFinal)}</strong></span>
                )}
                <span style={{ color:'#94a3b8' }}>{'-->'}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#1e40af' }}>
                  {'Precio cliente: $ '+U.fmt(editFinal)}
                  {(tipoDocumento === 'factura' && editProd.gravable)
                    ? <span style={{ color:'#d97706', marginLeft:4 }}>{' + IVA ' + porcentajeIva + '%'}</span>
                    : <span style={{ color:'#059669', marginLeft:4 }}>{tipoDocumento === 'nota' ? ' (Nota de Entrega - Sin IVA)' : ' (Exento)'}</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
                {tasaCalculo>0 && <th style={{ ...thC, textAlign:'right' }}>{'BS.'}</th>}
                <th style={{ ...thC, textAlign:'center' }}>{'⚙️'}</th>
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
                    {(tipoDocumento === 'factura' && it.gravable)
                      ? <span style={{ background:'rgba(245,158,11,0.1)', color:'#b45309', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{'$ '+U.fmt(it.iva)}</span>
                      : <span style={{ background:'rgba(5,150,105,0.1)', color:'#059669', borderRadius:8, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{tipoDocumento === 'nota' ? 'Nota' : 'Exento'}</span>}
                  </td>
                  <td style={{ ...tdS, textAlign:'right', fontWeight:800, color:'#059669', fontSize:14 }}>{'$ '+U.fmt(it.total)}</td>
                  {tasaCalculo>0 && <td style={{ ...tdS, textAlign:'right', fontSize:11, color:'#64748b' }}>{U.fmtBs(it.total,tasaCalculo)}</td>}
                  <td style={{ ...tdS, textAlign:'center', whiteSpace:'nowrap' }}>
                    <button type="button" onClick={() => handleStartEdit(idx)} title="Modificar producto" style={{ background: editingIndex === idx ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#7c3aed', borderRadius: '8px', cursor: 'pointer', padding: '6px 10px', fontSize: '14px', marginRight: '4px' }}>✏️</button>
                    <button type="button" onClick={()=>handleRemoveItem(idx)} style={{ background:'rgba(239,68,68,0.1)', color:'#dc2626', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, cursor:'pointer', padding:'6px 10px', fontSize:14 }}>🗑</button>
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
                <span>{`IVA (${tipoDocumento === 'nota' ? 0 : porcentajeIva}%):`}</span><strong>{'$ '+U.fmt(totals.iva)}</strong>
              </div>
              <div style={{ borderTop:'2px solid #e2e8f0', paddingTop:12, marginTop:4, display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:900, color:'#059669' }}>
                <span>{'TOTAL USD'}</span><span>{'$ '+U.fmt(totals.total)}</span>
              </div>
              {tasaCalculo>0 && (
                <div style={{ borderTop:'1px dashed #e2e8f0', paddingTop:10, marginTop:10, display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, color:'#0891b2' }}>
                  <span>{'Cliente paga (Bs.)'}</span><span>{U.fmtBs(totals.total,tasaCalculo)}</span>
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
