import React, { useState } from 'react';
import { U } from '../utils';
import { useAppData } from '../context/AppDataContext';

const PrintPreview = ({ data, onPrint, onClose }) => {
  const { config, triggerShare } = useAppData();
  // const [shareOpen, setShareOpen] = useState(false); // REMOVED
  const logoSrc = config?.logoUrl || '/logo-marcosbarco.png';

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-print-content');
    if (!element) return;

    const container = document.getElementById('print-preview-modal-container');
    const prevScroll = container ? container.scrollTop : 0;
    if (container) {
      container.scrollTop = 0;
    }

    try {
      const html2pdf = await U.loadHtml2Pdf();
      const numero = data.numeroPreFactura || 'factura';
      const opt = {
        margin:       [10, 10, 10, 10], // mm
        filename:     `PreFactura_${numero}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight + 150
        },
        jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      if (container) {
        container.scrollTop = prevScroll;
      }
    }
  };

  if (!data) return null;

  // Safety: ensure items is always an array
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;

  const subtotalBruto  = data.subtotalBruto  || items.reduce((s, it) => s + (parseFloat(it.subtotalBruto)  || parseFloat(it.subtotal) || 0), 0);
  const descuentoTotal  = data.descuentoTotal  || items.reduce((s, it) => s + (parseFloat(it.montoDescuento) || 0), 0);
  const hasDescuento    = descuentoTotal > 0;
  const isNota          = data.tipoDocumento === 'nota';
  const porcentajeIva   = Number(data.porcentajeIva ?? 16);
  const itemsGravados   = isNota ? [] : items.filter(it => it.gravable);
  const itemsExentos    = isNota ? items : items.filter(it => !it.gravable);

  const thStyle = {
    border: '1px solid #ccc', padding: '8px 10px', textAlign: 'left',
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    color: '#475569', background: '#f1f5f9', whiteSpace: 'nowrap',
  };
  const tdStyle = { border: '1px solid #ddd', padding: '8px 10px', fontSize: '12px' };

  return (
    <div
      id="print-preview-modal-container"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 9998,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '10px',
        overflowY: 'auto',
      }}
    >
      {/* ShareModal moved to global App.jsx */}

      {/* Top action bar - sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        width: '100%', maxWidth: '820px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'linear-gradient(135deg, #0f172a, #1e3a6e)',
        color: 'white', borderRadius: '14px 14px 0 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>📋</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Vista Previa — Pre-Factura</div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>Revise los datos antes de enviar</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              border: 'none', color: 'white', borderRadius: '10px',
              padding: '9px 18px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            📥 Descargar PDF
          </button>
          <button
            onClick={() => triggerShare(data, 'pre-factura', onPrint)}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              border: 'none', color: 'white', borderRadius: '10px',
              padding: '9px 18px', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
            }}
          >
            📤 Enviar / Imprimir
          </button>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)', color: 'white',
            borderRadius: '10px', padding: '9px 16px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>✕ Cerrar</button>
        </div>
      </div>

      {/* Invoice content - full page, scrollable */}
      <div
        id="invoice-print-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '820px',
          background: 'white', padding: '36px 40px',
          fontFamily: "'Inter', sans-serif", color: '#333',
          fontSize: '13px', lineHeight: 1.6,
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          borderRadius: '0 0 14px 14px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={logoSrc}
              alt="Logo Empresa"
              style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '10px' }}
              onError={e => { e.target.src = '/logo-marcosbarco.png'; }}
            />
            <div>
              <h1 style={{ color: '#1e3a8a', margin: 0, fontSize: '18px', letterSpacing: '0.5px', fontWeight: 900 }}>MARCOS MANUEL BARCO GUEVARA</h1>
              <p style={{ margin: '2px 0', fontSize: '10px', color: '#555' }}>Distribución de Productos Lácteos y Bebidas</p>
              <div style={{ fontSize: '10px', marginTop: '4px', color: '#333' }}>
                <strong>RIF:</strong> V-132498396<br />
                <strong>Maturín, Estado Monagas — Venezuela</strong>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '16px', color: '#1e40af' }}>
              {isNota ? 'NOTA DE ENTREGA' : 'PRE-FACTURA'}
            </h2>
            <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
              N° {data.numeroPreFactura || '—'}
            </p>
            <p style={{ margin: '3px 0', fontSize: '12px' }}>Fecha: {U.fmtDate(data.fecha)}</p>
            {data.fechaEntrega && <p style={{ margin: '3px 0', fontSize: '11px', color: '#555' }}>Entrega: {U.fmtDate(data.fechaEntrega)}</p>}
          </div>
        </div>

        {/* Client info */}
        <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px' }}>
          <div><strong>CLIENTE:</strong> {data.clienteNombre}</div>
          {data.clienteRif      && <div><strong>RIF:</strong> {data.clienteRif}</div>}
          {data.clienteDireccion && <div><strong>DIRECCIÓN:</strong> {data.clienteDireccion}</div>}
          {data.clienteTelefono  && <div><strong>TELÉFONO:</strong> {data.clienteTelefono}</div>}
          {data.clienteEmail     && <div><strong>EMAIL:</strong> {data.clienteEmail}</div>}
        </div>

        {/* Products table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Producto</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Presentación</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Embalaje</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Cant.</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>P. Unitario ($)</th>
              {hasDescuento && <th style={{ ...thStyle, textAlign: 'right', color: '#d97706' }}>Desc. %</th>}
              <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal ($)</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>IVA</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{item.descripcion}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.presentacion}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, color: '#1e40af' }}>{item.tipoEmbalaje || item.embalaje || 'Cesta'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.cantidad}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>$ {U.fmt(item.precioUnitario || item.costoUnitario)}</td>
                {hasDescuento && (
                  <td style={{ ...tdStyle, textAlign: 'right', color: item.descuento > 0 ? '#d97706' : '#999' }}>
                    {item.descuento > 0 ? `${item.descuento}%` : '—'}
                  </td>
                )}
                <td style={{ ...tdStyle, textAlign: 'right' }}>$ {U.fmt(item.subtotal)}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontSize: '11px', fontWeight: 600, color: (!isNota && item.gravable) ? '#1e40af' : '#059669' }}>
                  {(!isNota && item.gravable) ? `${porcentajeIva}%` : 'EXENTO'}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>$ {U.fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals section */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            {hasDescuento && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#475569' }}>
                  <span>Subtotal:</span><span>$ {U.fmt(subtotalBruto)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#d97706' }}>
                  <span>Descuento:</span><span>- $ {U.fmt(descuentoTotal)}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#475569' }}>
              <span>{hasDescuento ? 'Base Imponible:' : 'Subtotal:'}</span><span>$ {U.fmt(data.subtotal)}</span>
            </div>
            {!isNota && itemsExentos.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px', color: '#059669', paddingLeft: '8px' }}>
                <span>— Exento IVA (Leche):</span><span>$ {U.fmt(itemsExentos.reduce((s, it) => s + (it.subtotal || 0), 0))}</span>
              </div>
            )}
            {!isNota && itemsGravados.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '10px', color: '#1e40af', paddingLeft: '8px' }}>
                <span>— Base Gravada:</span><span>$ {U.fmt(itemsGravados.reduce((s, it) => s + (it.subtotal || 0), 0))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#475569', marginTop: '4px' }}>
              <span>{`I.V.A. (${porcentajeIva}%):`}</span><span>$ {U.fmt(data.iva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px', color: '#0f172a' }}>
              <span>TOTAL ($):</span><span>$ {U.fmt(data.total)}</span>
            </div>
            {data.tasaBCVUsada > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', color: '#1e40af', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #999' }}>
                <span>TOTAL Bs.:</span><span>{U.fmtBs(data.total, data.tasaBCVUsada)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Observations */}
        {data.observaciones && (
          <div style={{ marginTop: '16px', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '11px' }}>
            <strong>Observaciones:</strong> {data.observaciones}
          </div>
        )}

        {/* IVA note */}
        {!isNota && (
          <div style={{ marginTop: '12px', fontSize: '9px', color: '#999', textAlign: 'center', fontStyle: 'italic' }}>
            * La Leche Pasteurizada está exenta del Impuesto al Valor Agregado (IVA) según la legislación venezolana vigente.
          </div>
        )}

        {/* Signatures */}
        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '180px', paddingTop: '5px', fontSize: '11px' }}>Entregado por</div>
          <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '180px', paddingTop: '5px', fontSize: '11px' }}>Recibido por (Firma y Sello)</div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
