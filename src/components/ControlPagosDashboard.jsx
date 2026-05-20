import React, { useState, useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

const ControlPagosDashboard = () => {
  const { data, updateItem, tasaBCV, config } = useAppData();
  const [filterSupplier, setFilterSupplier] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  
  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipoPago: 'PAGO MOVIL',
    referencia: '',
    numeroControl: '', 
    banco: ''
  });

  const filteredInvoices = useMemo(() => {
    const search = filterSupplier.toLowerCase().trim();
    
    return data.compras
      .map(c => {
        // Enrich with provider name if missing
        let pName = c.proveedorNombre;
        
        // If name is missing or placeholder, look up by ID
        if (!pName || pName === '—' || pName === '') {
          const prov = data.proveedores.find(p => String(p.id) === String(c.proveedorId));
          if (prov) pName = prov.nombre;
        }
        
        // Fallback for UPACA system: if still empty, assume it's UPACA (since it's the Compras UPACA module)
        if (!pName || pName === '—' || pName === '') {
          pName = 'UPACA'; 
        }

        return { ...c, proveedorNombre: pName };
      })
      .filter(c => {
        if (!search) return true;
        const nameMatch = c.proveedorNombre.toLowerCase().includes(search);
        const invMatch  = (c.numeroFactura || '').toLowerCase().includes(search);
        // Special case: if user searches "UPACA", include records that were defaulted to UPACA
        return nameMatch || invMatch;
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [data.compras, data.proveedores, filterSupplier]);

  // Calculate stats
  const stats = useMemo(() => {
    let totalFacturado = 0;
    let totalPagado = 0;
    
    data.compras.forEach(c => {
      totalFacturado += (c.total || 0);
      const pagos = c.pagos || [];
      const abonado = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
      totalPagado += (abonado || (c.pagadaUpaca ? c.total : 0));
    });

    return {
      total: totalFacturado,
      pagado: totalPagado,
      pendiente: Math.max(0, totalFacturado - totalPagado)
    };
  }, [data.compras]);

  const handleAddPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setEditingPaymentId(null);
    const pagado = (invoice.pagos || []).reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
    setPaymentData({
      monto: U.r2(Math.max(0, invoice.total - pagado)),
      fecha: new Date().toISOString().split('T')[0],
      tipoPago: 'PAGO MOVIL',
      referencia: '',
      numeroControl: '',
      banco: ''
    });
    setShowPaymentModal(true);
  };

  const handleEditPayment = (invoice, payment) => {
    setSelectedInvoice(invoice);
    setEditingPaymentId(payment.id);
    setPaymentData({
      ...payment,
      monto: String(payment.monto)
    });
    setShowPaymentModal(true);
  };

  const handleDeletePayment = async (invoice, paymentId) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de pago?')) return;
    
    const updatedPagos = (invoice.pagos || []).filter(p => p.id !== paymentId);
    const totalPagado = updatedPagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
    
    const updatedInvoice = {
      ...invoice,
      pagos: updatedPagos,
      pagadaUpaca: totalPagado >= (invoice.total - 0.01)
    };

    await updateItem('compras', updatedInvoice);
    alert('Pago eliminado correctamente');
  };

  const savePayment = async () => {
    if (!paymentData.monto || parseFloat(paymentData.monto) <= 0) return alert('Ingrese un monto válido');
    
    let updatedPagos = [...(selectedInvoice.pagos || [])];
    const montoNum = parseFloat(paymentData.monto);

    if (editingPaymentId) {
      updatedPagos = updatedPagos.map(p => p.id === editingPaymentId ? { ...p, ...paymentData, monto: montoNum } : p);
    } else {
      const newPayment = {
        ...paymentData,
        id: String(Date.now()),
        monto: montoNum,
        correlativo: `REC-${String(updatedPagos.length + 1).padStart(3, '0')}` 
      };
      updatedPagos.push(newPayment);
    }

    const totalPagado = updatedPagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);

    const updatedInvoice = {
      ...selectedInvoice,
      pagos: updatedPagos,
      pagadaUpaca: totalPagado >= (selectedInvoice.total - 0.01)
    };

    await updateItem('compras', updatedInvoice);
    setShowPaymentModal(false);
    setEditingPaymentId(null);
    alert(editingPaymentId ? 'Pago rectificado correctamente' : 'Pago registrado correctamente');
  };

  const shareWhatsApp = (invoice, payment) => {
    const text = `*PASTORCA - Comprobante de Pago ${payment.correlativo || ''}*%0A%0A` +
      `*Proveedor:* ${invoice.proveedorNombre}%0A` +
      `*Factura Ref:* ${invoice.numeroFactura}%0A` +
      `*Monto:* $${U.fmt(payment.monto)}%0A` +
      `*Fecha:* ${U.fmtDate(payment.fecha)}%0A` +
      `*Método:* ${payment.tipoPago}%0A` +
      `*Ref:* ${payment.referencia || 'N/A'}%0A` +
      `*N° Control:* ${payment.numeroControl || 'N/A'}`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = (invoice, payment) => {
    const subject = `Comprobante de Pago ${payment.correlativo || ''} - Factura ${invoice.numeroFactura}`;
    const body = `PASTORCA - Comprobante de Pago\n\n` +
      `Recibo N°: ${payment.correlativo || 'N/A'}\n` +
      `Proveedor: ${invoice.proveedorNombre}\n` +
      `Factura de Referencia: ${invoice.numeroFactura}\n` +
      `Monto: $${U.fmt(payment.monto)}\n` +
      `Fecha: ${U.fmtDate(payment.fecha)}\n` +
      `Método: ${payment.tipoPago}\n` +
      `Referencia Bancaria: ${payment.referencia || 'N/A'}\n` +
      `N° Control: ${payment.numeroControl || 'N/A'}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const printReceipt = (invoice, payment) => {
    const printContent = `
      <div class="receipt-container">
        <div class="receipt-header">
          <div style="font-size: 12px; float: right; color: #666;">${payment.correlativo || ''}</div>
          <div class="receipt-title">Comprobante de Pago</div>
          <div style="font-size: 14px; margin-top: 5px;">PASTORCA — ${config.nombreEmpresa || 'UPACA'}</div>
        </div>
        <div class="receipt-grid">
          <div class="receipt-field"><span class="receipt-label">Proveedor</span><div class="receipt-value">${invoice.proveedorNombre}</div></div>
          <div class="receipt-field"><span class="receipt-label">Factura de Referencia</span><div class="receipt-value">${invoice.numeroFactura}</div></div>
          <div class="receipt-field"><span class="receipt-label">Fecha de Pago</span><div class="receipt-value">${U.fmtDate(payment.fecha)}</div></div>
          <div class="receipt-field"><span class="receipt-label">Monto Pagado</span><div class="receipt-value">$ ${U.fmt(payment.monto)}</div></div>
          <div class="receipt-field"><span class="receipt-label">Método de Pago</span><div class="receipt-value">${payment.tipoPago}</div></div>
          <div class="receipt-field"><span class="receipt-label">Referencia</span><div class="receipt-value">${payment.referencia || '—'}</div></div>
          <div class="receipt-field"><span class="receipt-label">N° de Control</span><div class="receipt-value">${payment.numeroControl || '—'}</div></div>
        </div>
        <div style="margin-top: 40px; text-align: center; border-top: 1px dashed #ccc; padding-top: 20px;">
          <p style="font-size: 12px; color: #666;">Este documento es un comprobante de abono a la factura indicada.</p>
        </div>
      </div>
    `;

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Recibo ${payment.correlativo || ''}</title>
          <style>
            body { font-family: 'Outfit', sans-serif; margin: 0; padding: 0; }
            .receipt-container { width: 100%; max-width: 600px; margin: 40px auto; padding: 30px; border: 2px solid #000; border-radius: 12px; position: relative; }
            .receipt-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 25px; }
            .receipt-title { font-size: 26px; font-weight: 900; text-transform: uppercase; }
            .receipt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .receipt-label { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; display: block; }
            .receipt-value { font-size: 18px; font-weight: 800; color: black; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="theme-pastel-green">
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '5px' }}>💳 Dashboard Control de Pagos</h1>
          <p style={{ fontSize: '18px', color: '#000' }}>Gestión administrativa y rectificación de pagos a proveedores.</p>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '15px' }}>
           <div className="card-pg" style={{ padding: '15px 25px', textAlign: 'center', borderBottom: '5px solid #ef4444' }}>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>POR PAGAR</div>
              <div style={{ fontSize: '28px', fontWeight: 900 }}>$ {U.fmt(stats.pendiente)}</div>
           </div>
           <div className="card-pg" style={{ padding: '15px 25px', textAlign: 'center', borderBottom: '5px solid #10b981' }}>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>TOTAL PAGADO</div>
              <div style={{ fontSize: '28px', fontWeight: 900 }}>$ {U.fmt(stats.pagado)}</div>
           </div>
        </div>
      </div>

      {/* FILTER BOX */}
      <div className="card-pg no-print">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px' }}>BUSCAR PROVEEDOR O FACTURA</label>
            <input 
              type="text" 
              placeholder="Ej: UPACA, FP-F000001..." 
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #a7f3d0', fontSize: '18px', fontWeight: 700 }}
            />
          </div>
          <button className="btn-pg btn-pg-secondary" onClick={() => window.print()} style={{ height: '58px', marginTop: '25px' }}>
            🖨️ Imprimir Listado
          </button>
        </div>
      </div>

      {/* INVOICE LIST */}
      <div className="card-pg" style={{ overflowX: 'auto' }}>
        <table className="table-pg">
          <thead>
            <tr>
              <th>Fecha Factura</th>
              <th>Proveedor</th>
              <th>Factura Ref.</th>
              <th>Monto Total</th>
              <th>Saldo Pendiente</th>
              <th>Estado</th>
              <th className="no-print">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '50px', fontSize: '20px', color: '#666' }}>
                  🔍 No se encontraron resultados para "<strong>{filterSupplier}</strong>"
                </td>
              </tr>
            ) : (
              filteredInvoices.map(invoice => {
                const pagos = invoice.pagos || [];
                const totalAbonado = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
                const totalPagado = totalAbonado || (invoice.pagadaUpaca ? invoice.total : 0);
                const pendiente = U.r2(Math.max(0, invoice.total - totalPagado));
                const isPaid = pendiente <= 0.01;

                return (
                  <React.Fragment key={invoice.id}>
                    <tr>
                      <td>{U.fmtDate(invoice.fecha)}</td>
                      <td style={{ fontSize: '18px', fontWeight: 900 }}>{invoice.proveedorNombre}</td>
                      <td><span style={{ background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>{invoice.numeroFactura}</span></td>
                      <td>$ {U.fmt(invoice.total)}</td>
                      <td style={{ color: pendiente > 0 ? '#dc2626' : '#10b981' }}>
                        $ {U.fmt(pendiente)}
                      </td>
                      <td>
                        <span style={{ 
                          padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
                          background: isPaid ? '#d1fae5' : '#fee2e2',
                          color: isPaid ? '#065f46' : '#991b1b'
                        }}>
                          {isPaid ? 'PAGADA' : 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="no-print">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-pg btn-pg-primary" onClick={() => handleAddPayment(invoice)}>
                            ➕ {isPaid ? 'Rectificar' : 'Abonar'}
                          </button>
                          <button className="btn-pg btn-pg-secondary" onClick={() => {
                            const last = (invoice.pagos || []).slice(-1)[0];
                            if (last) printReceipt(invoice, last);
                            else alert('No hay abonos detallados registrados para esta factura. Use "Rectificar" para añadirlos.');
                          }}>
                            🖨️ Recibo
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* DETALLE DE ABONOS SI EXISTEN O MENSAJE DE LEGACY */}
                    <tr>
                      <td colSpan="7" style={{ padding: '0 20px 15px 40px', background: '#f9fafb' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#666' }}>HISTORIAL DE ABONOS:</div>
                        {pagos.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {pagos.map(p => (
                              <div key={p.id} className="card-pg" style={{ margin: 0, padding: '12px 18px', borderStyle: 'dashed', flex: '1 1 280px', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 5, right: 10, fontSize: '10px', color: '#999', fontWeight: 900 }}>{p.correlativo}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <strong>{U.fmtDate(p.fecha)}</strong>
                                  <span style={{ color: '#10b981', fontWeight: 900 }}>$ {U.fmt(p.monto)}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#444' }}>
                                  Ref: <strong>{p.referencia}</strong> | Ctrl: <strong>{p.numeroControl || 'N/A'}</strong>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '10px' }} className="no-print">
                                  <button title="WhatsApp" onClick={() => shareWhatsApp(invoice, p)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>🟢</button>
                                  <button title="Email" onClick={() => shareEmail(invoice, p)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>📧</button>
                                  <button title="Imprimir" onClick={() => printReceipt(invoice, p)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>🖨️</button>
                                  <div style={{ flex: 1 }} />
                                  <button title="Editar" onClick={() => handleEditPayment(invoice, p)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>✏️</button>
                                  <button title="Eliminar" onClick={() => handleDeletePayment(invoice, p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '15px', background: '#fffbeb', border: '1px dashed #d97706', borderRadius: '12px', color: '#92400e', fontSize: '13px', fontWeight: 600 }}>
                            {invoice.pagadaUpaca 
                              ? 'ℹ️ Factura marcada como PAGADA TOTALMENTE, pero no se encontraron abonos detallados. Use "Rectificar" para registrar el historial de pagos.'
                              : 'ℹ️ No hay abonos registrados para esta factura.'}
                          </div>
                        )}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="modal-overlay active no-print">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingPaymentId ? 'RECTIFICAR PAGO' : 'REGISTRAR PAGO'}</h3>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '30px' }}>
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '12px', color: '#065f46', fontWeight: 800 }}>FACTURA REF: {selectedInvoice?.numeroFactura}</div>
                <div style={{ fontSize: '18px', fontWeight: 900 }}>PROVEEDOR: {selectedInvoice?.proveedorNombre}</div>
                {editingPaymentId && <div style={{ fontSize: '11px', color: '#d97706', marginTop: '5px' }}>Editando Recibo: {paymentData.correlativo}</div>}
              </div>
              
              <div className="form-group">
                <label className="form-label">MONTO A PAGAR ($)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={paymentData.monto} 
                  onChange={e => setPaymentData({...paymentData, monto: e.target.value})}
                  style={{ fontSize: '24px', fontWeight: 900, height: '60px' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">FECHA</label>
                  <input type="date" className="form-input" value={paymentData.fecha} onChange={e => setPaymentData({...paymentData, fecha: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">MÉTODO</label>
                  <select className="form-select" value={paymentData.tipoPago} onChange={e => setPaymentData({...paymentData, tipoPago: e.target.value})}>
                    <option value="PAGO MOVIL">PAGO MOVIL</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="ZELLE">ZELLE</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">NÚMERO DE REFERENCIA</label>
                <input type="text" className="form-input" value={paymentData.referencia} onChange={e => setPaymentData({...paymentData, referencia: e.target.value})} />
              </div>

              {paymentData.tipoPago === 'PAGO MOVIL' && (
                <div className="form-group" style={{ background: '#ecfdf5', padding: '15px', borderRadius: '12px', border: '1px solid #10b981' }}>
                  <label className="form-label" style={{ color: '#047857' }}>N° DE CONTROL (PAGO MOVIL)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ingrese el código de control..."
                    value={paymentData.numeroControl} 
                    onChange={e => setPaymentData({...paymentData, numeroControl: e.target.value})}
                    style={{ border: '2px solid #10b981' }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>CANCELAR</button>
              <button className="btn btn-success" onClick={savePayment} style={{ padding: '15px 30px', fontSize: '18px' }}>
                {editingPaymentId ? '✅ ACTUALIZAR DATOS' : '✅ GUARDAR PAGO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPagosDashboard;
