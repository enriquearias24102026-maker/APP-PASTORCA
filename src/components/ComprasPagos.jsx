import React, { useState } from 'react';
import { U } from '../utils';

const ComprasPagos = ({ compra, onSave, onCancel }) => {
  const [pagos, setPagos] = useState(compra.pagos || []);
  const [nuevoPago, setNuevoPago] = useState({
    monto: '',
    fecha: U.today(),
    tipoPago: 'Transferencia',
    referencia: ''
  });

  const totalFactura = compra.total || 0;
  const totalPagado = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0);
  const pendiente = U.r2(totalFactura - totalPagado);

  const handleAddPago = () => {
    const monto = parseFloat(nuevoPago.monto);
    if (!monto || monto <= 0) {
      alert('Por favor ingrese un monto válido.');
      return;
    }
    if (monto > pendiente + 0.01) {
      if (!window.confirm('El monto ingresado supera el saldo pendiente. ¿Desea registrarlo de todas formas?')) return;
    }

    const pago = {
      ...nuevoPago,
      id: String(Date.now()),
      monto: U.r2(monto)
    };

    const updatedPagos = [...pagos, pago];
    setPagos(updatedPagos);
    setNuevoPago({
      monto: '',
      fecha: U.today(),
      tipoPago: 'Transferencia',
      referencia: ''
    });
  };

  const handleRemovePago = (id) => {
    if (!window.confirm('¿Eliminar este registro de pago?')) return;
    setPagos(pagos.filter(p => p.id !== id));
  };

  const handleFinalSave = () => {
    const isFullPaid = totalPagado >= totalFactura - 0.01;
    onSave({
      ...compra,
      pagos,
      pagadaUpaca: isFullPaid,
      fechaPagoUpaca: isFullPaid ? (pagos[pagos.length - 1]?.fecha || U.today()) : null
    });
  };

  const inputStyle = {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div style={{ padding: '4px' }}>
      {/* Summary Box */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
        borderRadius: '16px', padding: '20px', marginBottom: '24px',
        border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Total Factura</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>$ {U.fmt(totalFactura)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '4px' }}>Total Pagado</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669' }}>$ {U.fmt(totalPagado)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: pendiente > 0 ? '#dc2626' : '#059669', textTransform: 'uppercase', marginBottom: '4px' }}>Monto Pendiente</div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: pendiente > 0 ? '#dc2626' : '#059669' }}>
            {pendiente > 0 ? `$ ${U.fmt(pendiente)}` : '✅ PAGADO'}
          </div>
        </div>
      </div>

      {/* Add Payment Form */}
      {pendiente > 0 && (
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px', padding: '20px', marginBottom: '24px',
          border: '1px dashed #3b82f6'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 800, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ➕ Registrar Nuevo Abono / Pago
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Monto USD</label>
              <input 
                style={inputStyle} type="number" step="0.01" value={nuevoPago.monto} 
                onChange={e => setNuevoPago(p => ({...p, monto: e.target.value}))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Fecha</label>
              <input style={inputStyle} type="date" value={nuevoPago.fecha} onChange={e => setNuevoPago(p => ({...p, fecha: e.target.value}))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Tipo</label>
              <select style={inputStyle} value={nuevoPago.tipoPago} onChange={e => setNuevoPago(p => ({...p, tipoPago: e.target.value}))}>
                <option value="Transferencia">Transferencia</option>
                <option value="Pago Movil">Pago Móvil</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Zelle">Zelle</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569' }}>Referencia</label>
              <input style={inputStyle} type="text" value={nuevoPago.referencia} onChange={e => setNuevoPago(p => ({...p, referencia: e.target.value}))} placeholder="Ej: #123456" />
            </div>
            <button 
              onClick={handleAddPago}
              style={{ 
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '10px 20px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              Registrar
            </button>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Tipo</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Referencia</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Monto ($)</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {pagos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  No se han registrado pagos para esta factura.
                </td>
              </tr>
            ) : (
              pagos.map(p => (
                <tr key={p.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>{U.fmtDate(p.fecha)}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700 }}>{p.tipoPago}</span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace' }}>{p.referencia || '—'}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: '#059669' }}>$ {U.fmt(p.monto)}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleRemovePago(p.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
        <button onClick={onCancel} style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button 
          onClick={handleFinalSave}
          style={{ 
            padding: '10px 32px', borderRadius: '10px', border: 'none', 
            background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', 
            fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)'
          }}
        >
          💾 Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default ComprasPagos;
