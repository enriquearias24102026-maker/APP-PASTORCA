import React from 'react';
import { U } from '../utils';

const InvoicePrint = ({ data }) => {
  if (!data) return null;

  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;

  const subtotalBruto  = data.subtotalBruto  || items.reduce((s, it) => s + (parseFloat(it.subtotalBruto)  || parseFloat(it.subtotal) || 0), 0);
  const descuentoTotal  = data.descuentoTotal  || items.reduce((s, it) => s + (parseFloat(it.montoDescuento) || 0), 0);
  const hasDescuento    = descuentoTotal > 0;

  const isNota = data.tipoDocumento === 'nota';
  const porcentajeIva = Number(data.porcentajeIva ?? 16);
  const itemsGravados = isNota ? [] : items.filter(it => it.gravable);
  const itemsExentos  = isNota ? items : items.filter(it => !it.gravable);

  return (
    <div className="print-area print-invoice">
      <div className="print-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="/logo-upaca.png"
            alt="UPACA"
            style={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
          <div>
            <h1 style={{ color: '#c41e1e', margin: 0, fontSize: '22px', letterSpacing: '1px' }}>UPACA</h1>
            <p style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>Unión de Productores de Leche del Estado Monagas</p>
            <p style={{ margin: '3px 0', fontSize: '13px', fontWeight: 600, color: '#000' }}>Control de Facturación Láctea</p>
            <div style={{ fontSize: '11px', marginTop: '6px', color: '#333' }}>
              <strong>Representante:</strong> MARCOS MANUEL BARCO GUEVARA<br />
              <strong>RIF:</strong> V-132498396
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#1e40af' }}>
            {isNota ? 'NOTA DE ENTREGA' : 'PRE-FACTURA'}
          </h2>
          <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
            N° {data.numeroPreFactura || '—'}
          </p>
          <p style={{ margin: '5px 0', fontSize: '13px' }}>Fecha: {U.fmtDate(data.fecha)}</p>
          {data.fechaEntrega && (
            <p style={{ margin: '5px 0', fontSize: '12px', color: '#555' }}>Entrega: {U.fmtDate(data.fechaEntrega)}</p>
          )}
        </div>
      </div>

      {/* Client info */}
      <div style={{ marginBottom: '20px', padding: '10px 14px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
        <strong>CLIENTE:</strong> {data.clienteNombre}<br />
        {data.clienteRif && <><strong>RIF:</strong> {data.clienteRif}<br /></>}
        {data.clienteDireccion && <><strong>DIRECCIÓN:</strong> {data.clienteDireccion}<br /></>}
        {data.clienteTelefono && <><strong>TELÉFONO:</strong> {data.clienteTelefono}<br /></>}
      </div>

      {/* Products table */}
      <table className="print-table">
        <thead>
          <tr>
            <th>PRODUCTO</th>
            <th style={{ textAlign: 'center' }}>PRES.</th>
            <th style={{ textAlign: 'right' }}>CANT.</th>
            <th style={{ textAlign: 'right' }}>P. UNIT ($)</th>
            {hasDescuento && <th style={{ textAlign: 'right' }}>DESC.</th>}
            <th style={{ textAlign: 'right' }}>SUBTOTAL ($)</th>
            <th style={{ textAlign: 'center' }}>IVA</th>
            <th style={{ textAlign: 'right' }}>TOTAL ($)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.descripcion}</td>
              <td style={{ textAlign: 'center' }}>{item.presentacion}</td>
              <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
              <td style={{ textAlign: 'right' }}>$ {U.fmt(item.precioUnitario || item.costoUnitario)}</td>
              {hasDescuento && (
                <td style={{ textAlign: 'right', color: item.descuento > 0 ? '#d97706' : '#999' }}>
                  {item.descuento > 0 ? `${item.descuento}%` : '—'}
                </td>
              )}
              <td style={{ textAlign: 'right' }}>$ {U.fmt(item.subtotal)}</td>
              <td style={{ textAlign: 'center', fontSize: '11px' }}>
                {(!isNota && item.gravable) ? `${porcentajeIva}%` : 'EXENTO'}
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>$ {U.fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals section */}
      <div className="print-totals">
        {/* Subtotal before discount */}
        {hasDescuento && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Subtotal:</span>
              <span>$ {U.fmt(subtotalBruto)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: '#d97706' }}>
              <span>Descuento:</span>
              <span>- $ {U.fmt(descuentoTotal)}</span>
            </div>
          </>
        )}

        {/* Base imponible */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>{hasDescuento ? 'Base Imponible:' : 'Subtotal:'}</span>
          <span>$ {U.fmt(data.subtotal)}</span>
        </div>

        {/* IVA breakdown */}
        {!isNota && itemsExentos.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px', color: '#666' }}>
            <span style={{ paddingLeft: '10px' }}>— Exento de IVA:</span>
            <span>$ {U.fmt(itemsExentos.reduce((s, it) => s + (it.subtotal || 0), 0))}</span>
          </div>
        )}
        {!isNota && itemsGravados.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px', color: '#666' }}>
            <span style={{ paddingLeft: '10px' }}>— Gravado (Base para IVA):</span>
            <span>$ {U.fmt(itemsGravados.reduce((s, it) => s + (it.subtotal || 0), 0))}</span>
          </div>
        )}

        {/* IVA amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', marginTop: '5px' }}>
          <span>I.V.A. ({porcentajeIva}%):</span>
          <span>$ {U.fmt(data.iva)}</span>
        </div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '20px', borderTop: '2px solid #000', paddingTop: '10px', marginTop: '10px' }}>
          <span>TOTAL ($):</span>
          <span>$ {U.fmt(data.total)}</span>
        </div>

        {/* Equivalente Bs */}
        {data.tasaBCVUsada > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', color: '#1e40af', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #999' }}>
            <span>TOTAL Bs. (BCV {U.fmt(data.tasaBCVUsada)}):</span>
            <span>{U.fmtBs(data.total, data.tasaBCVUsada)}</span>
          </div>
        )}
      </div>

      {/* Observations */}
      {data.observaciones && (
        <div style={{ marginTop: '20px', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px' }}>
          <strong>Observaciones:</strong> {data.observaciones}
        </div>
      )}

      {/* Nota IVA */}
      {!isNota && (
        <div style={{ marginTop: '15px', fontSize: '10px', color: '#777', textAlign: 'center', fontStyle: 'italic' }}>
          * La Leche Pasteurizada está exenta del Impuesto al Valor Agregado (IVA) según la legislación venezolana vigente.
        </div>
      )}

      {/* Signatures */}
      <div style={{ marginTop: '80px', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>
          Entregado por
        </div>
        <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '200px', paddingTop: '5px' }}>
          Recibido por (Firma y Sello)
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
