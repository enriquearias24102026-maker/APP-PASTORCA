import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

const Reportes = () => {
  const { data, tasaBCV } = useAppData();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [downloading, setDownloading] = useState('');

  const hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const filterByDate = (items, campo = 'fecha') =>
    items.filter(item => {
      const f = item[campo];
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      return true;
    });

  const addHeader = (wb, ws, title) => {
    XLSX.utils.sheet_add_aoa(ws, [[title, '', `Generado: ${hoy}`, '', `Tasa BCV: Bs. ${tasaBCV}`]], { origin: 'A1' });
  };

  const downloadClientes = () => {
    setDownloading('clientes');
    const rows = data.clientes.map(c => {
      const vc = filterByDate(data.ventas.filter(v => String(v.clienteId) === String(c.id)));
      const totalFacturado = vc.reduce((s, v) => s + (v.total || 0), 0);
      const totalPendiente = vc.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s + (v.total || 0), 0);
      return {
        'Nombre / Razón Social': c.nombre, 'RIF / Cédula': c.rif,
        'Teléfono': c.telefono || '', 'Email': c.email || '', 'Dirección': c.direccion || '',
        'N° Facturas': vc.length,
        'Total Facturado ($)': +totalFacturado.toFixed(2),
        'Pendiente ($)': +totalPendiente.toFixed(2),
        'Pendiente (Bs.)': tasaBCV > 0 ? +(totalPendiente * tasaBCV).toFixed(2) : 'N/A',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 15 }, { wch: 28 }, { wch: 35 }, { wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    addHeader(wb, ws, `PASTORCA — Reporte de Clientes — ${hoy}`);
    XLSX.writeFile(wb, `PASTORCA_Clientes_${U.today()}.xlsx`);
    setDownloading('');
  };

  const downloadVentas = () => {
    setDownloading('ventas');
    const ventas = filterByDate(data.ventas);
    const rows = ventas.map(v => ({
      'Fecha': U.fmtDate(v.fecha), 'F. Entrega': v.fechaEntrega ? U.fmtDate(v.fechaEntrega) : '',
      'Cliente': v.clienteNombre, 'RIF': v.clienteRif || '', 'Teléfono': v.clienteTelefono || '',
      'Total ($)': +(v.total || 0).toFixed(2),
      'Tasa BCV': v.tasaBCVUsada || tasaBCV || '',
      'Total Bs.': tasaBCV > 0 ? +((v.total || 0) * (v.tasaBCVUsada || tasaBCV)).toFixed(2) : '',
      'Estado': v.estadoPago,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    addHeader(wb, ws, `PASTORCA — Reporte de Ventas — ${hoy}`);
    XLSX.writeFile(wb, `PASTORCA_Ventas_${U.today()}.xlsx`);
    setDownloading('');
  };

  const downloadCompras = () => {
    setDownloading('compras');
    const rows = filterByDate(data.compras).map(c => ({
      'Fecha': U.fmtDate(c.fecha), 'Factura N°': c.numeroFactura, 'Proveedor': c.proveedorNombre,
      'N° Productos': (c.items || []).length,
      'Subtotal ($)': +(c.subtotal || 0).toFixed(2),
      'IVA ($)': +(c.iva || 0).toFixed(2),
      'Desc. UPACA ($)': +(c.montoDescuento || 0).toFixed(2),
      'Total ($)': +(c.total || 0).toFixed(2),
      'Total Bs.': tasaBCV > 0 ? +((c.total || 0) * (c.tasaBCVUsada || tasaBCV)).toFixed(2) : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compras UPACA');
    addHeader(wb, ws, `PASTORCA — Compras a UPACA — ${hoy}`);
    XLSX.writeFile(wb, `PASTORCA_Compras_${U.today()}.xlsx`);
    setDownloading('');
  };

  const downloadCompleto = () => {
    setDownloading('completo');
    const wb = XLSX.utils.book_new();
    const clienteRows = data.clientes.map(c => {
      const vc = filterByDate(data.ventas.filter(v => String(v.clienteId) === String(c.id)));
      return { 'Nombre': c.nombre, 'RIF': c.rif, 'Teléfono': c.telefono || '', 'Facturas': vc.length,
        'Total ($)': +vc.reduce((s, v) => s + (v.total || 0), 0).toFixed(2),
        'Pendiente ($)': +vc.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s + (v.total || 0), 0).toFixed(2) };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clienteRows), 'Clientes');
    const ventaRows = filterByDate(data.ventas).map(v => ({
      'Fecha': U.fmtDate(v.fecha), 'Cliente': v.clienteNombre,
      'Total ($)': +(v.total || 0).toFixed(2), 'Estado': v.estadoPago,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventaRows), 'Pre-Facturas Ventas');
    const compraRows = filterByDate(data.compras).map(c => ({
      'Fecha': U.fmtDate(c.fecha), 'Factura': c.numeroFactura, 'Proveedor': c.proveedorNombre,
      'Total ($)': +(c.total || 0).toFixed(2),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compraRows), 'Compras UPACA');
    XLSX.writeFile(wb, `PASTORCA_ReporteCompleto_${U.today()}.xlsx`);
    setDownloading('');
  };

  const downloadPagosProveedores = () => {
    setDownloading('pagos');
    const rows = filterByDate(data.compras).map(c => {
      const pagos = c.pagos || [];
      const totalPagado = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
      const pendiente = U.r2(c.total - totalPagado);
      
      // Tomamos el último pago para mostrar en las columnas de "detalle" si existe
      const ultimoPago = pagos.length > 0 ? pagos[pagos.length - 1] : null;

      return {
        'Proveedor': c.proveedorNombre,
        'N° Factura del Proveedor': c.numeroFactura,
        'Fecha de Emision de Factura': U.fmtDate(c.fecha),
        'Fecha Recepcion': U.fmtDate(c.fecha), // Usamos la misma fecha si no hay campo separado
        'Monto Factura': +c.total.toFixed(2),
        'Monto por Cancelar / Saldo Pendiente': +pendiente.toFixed(2),
        'Pagos realizados / Acumulados': +totalPagado.toFixed(2),
        'Fecha de Abono o Pago al Proveedor': ultimoPago ? U.fmtDate(ultimoPago.fecha) : (c.pagadaUpaca ? U.fmtDate(c.fechaPagoUpaca || c.fecha) : '—'),
        'Tipo de pago': ultimoPago ? ultimoPago.tipoPago : (c.pagadaUpaca ? 'Pago Total' : '—'),
        'Numero de Referencia del Pago': ultimoPago ? ultimoPago.referencia : '—',
        'Detalle de Abonos': pagos.map(p => `$${p.monto} (${U.fmtDate(p.fecha)})`).join(' | ') || (c.pagadaUpaca ? 'PAGO TOTAL' : 'SIN ABONOS')
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Configuración de anchos de columna para que se vea ordenado (simulando tu tabla)
    ws['!cols'] = [
      { wch: 30 }, // Proveedor
      { wch: 22 }, // N° Factura
      { wch: 20 }, // Fecha Emisión
      { wch: 18 }, // Fecha Recepción
      { wch: 15 }, // Monto Factura
      { wch: 28 }, // Monto por Cancelar
      { wch: 28 }, // Pagos realizados
      { wch: 28 }, // Fecha de Abono
      { wch: 15 }, // Tipo de pago
      { wch: 25 }, // Referencia
      { wch: 45 }  // Detalle de Abonos
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Control de Pagos');
    addHeader(wb, ws, `PASTORCA — Control de Pagos a Proveedores — ${hoy}`);
    XLSX.writeFile(wb, `PASTORCA_ControlPagos_${U.today()}.xlsx`);
    setDownloading('');
  };

  const ventasFiltradas  = filterByDate(data.ventas);
  const comprasFiltradas = filterByDate(data.compras);
  const totalVentasUSD   = ventasFiltradas.reduce((s, v) => s + (v.total || 0), 0);
  const totalComprasUSD  = comprasFiltradas.reduce((s, c) => s + (c.total || 0), 0);
  const utilidad         = totalVentasUSD - totalComprasUSD;

  const stats = [
    {
      label: 'VENTAS EN PERÍODO', value: `$ ${U.fmt(totalVentasUSD)}`,
      sub: tasaBCV > 0 ? U.fmtBs(totalVentasUSD, tasaBCV) : '—',
      icon: '📤', bg: 'linear-gradient(135deg,#059669,#10b981)',
      glow: 'rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.5)',
    },
    {
      label: 'COMPRAS EN PERÍODO', value: `$ ${U.fmt(totalComprasUSD)}`,
      sub: tasaBCV > 0 ? U.fmtBs(totalComprasUSD, tasaBCV) : '—',
      icon: '📥', bg: 'linear-gradient(135deg,#0891b2,#06b6d4)',
      glow: 'rgba(6,182,212,0.35)', border: 'rgba(6,182,212,0.5)',
    },
    {
      label: 'UTILIDAD ESTIMADA', value: `$ ${U.fmt(utilidad)}`,
      sub: tasaBCV > 0 ? U.fmtBs(utilidad, tasaBCV) : '—',
      icon: utilidad >= 0 ? '📈' : '📉',
      bg: utilidad >= 0 ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'linear-gradient(135deg,#dc2626,#ef4444)',
      glow: utilidad >= 0 ? 'rgba(139,92,246,0.35)' : 'rgba(239,68,68,0.35)',
      border: utilidad >= 0 ? 'rgba(139,92,246,0.5)' : 'rgba(239,68,68,0.5)',
    },
    {
      label: 'CLIENTES REGISTRADOS', value: String(data.clientes.length),
      sub: `${ventasFiltradas.filter(v => v.estadoPago !== 'pagado').length} facturas pendientes`,
      icon: '👥', bg: 'linear-gradient(135deg,#d97706,#f59e0b)',
      glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.5)',
    },
  ];

  const reportCards = [
    {
      id: 'clientes', title: 'Reporte de Clientes', icon: '👥',
      count: `${data.clientes.length} clientes`,
      desc: 'Nombre, RIF, teléfono, email, total facturado y deuda pendiente por cliente.',
      bg: 'linear-gradient(135deg,#1e40af,#3b82f6)',
      lightBg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.35)',
      tag: '#3b82f6', action: downloadClientes,
    },
    {
      id: 'ventas', title: 'Informe de Ventas', icon: '📋',
      count: `${ventasFiltradas.length} pre-facturas`,
      desc: 'Fecha, cliente, RIF, monto USD, monto Bs., fecha de entrega y estado de pago.',
      bg: 'linear-gradient(135deg,#059669,#10b981)',
      lightBg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.35)',
      tag: '#10b981', action: downloadVentas,
    },
    {
      id: 'compras', title: 'Compras a UPACA', icon: '🧾',
      count: `${comprasFiltradas.length} facturas`,
      desc: 'Fecha, factura, proveedor, subtotal, IVA, descuento 3% UPACA y total en USD y Bs.',
      bg: 'linear-gradient(135deg,#0891b2,#06b6d4)',
      lightBg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.35)',
      tag: '#06b6d4', action: downloadCompras,
    },
    {
      id: 'completo', title: 'Informe Completo', icon: '📊',
      count: '3 hojas en 1 archivo',
      desc: 'Un solo Excel con hojas separadas: Clientes, Pre-Facturas de Ventas y Compras UPACA.',
      bg: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
      lightBg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.35)',
      tag: '#8b5cf6', action: downloadCompleto,
    },
    {
      id: 'pagos', title: 'Control de Pagos', icon: '💳',
      count: 'Abonos y Saldos',
      desc: 'Seguimiento detallado de abonos parciales, saldos pendientes y fechas de pago a proveedores.',
      bg: 'linear-gradient(135deg,#db2777,#f472b6)',
      lightBg: 'rgba(219,39,119,0.08)', border: 'rgba(219,39,119,0.35)',
      tag: '#db2777', action: downloadPagosProveedores,
    },
  ];

  const inputStyle = {
    padding: '9px 14px', borderRadius: '10px', fontSize: '13px',
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)',
    fontFamily: 'Inter, sans-serif', outline: 'none',
  };

  return (
    <div className="view-container">

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          📈 Informes de Excel
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Descarga reportes filtrados por período — Generado: {hoy}
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a6e, #0f172a)',
        borderRadius: '16px', padding: '18px 24px', marginBottom: '24px',
        border: '1px solid rgba(59,130,246,0.3)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 Filtrar por Período
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Desde</span>
          <input style={inputStyle} type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Hasta</span>
          <input style={inputStyle} type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
        </div>
        {(fechaDesde || fechaHasta) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            color: '#f87171', borderRadius: '8px', cursor: 'pointer',
            padding: '8px 14px', fontSize: '12px', fontWeight: 700,
          }}>✕ Limpiar</button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          {fechaDesde || fechaHasta
            ? `📊 ${ventasFiltradas.length} ventas · ${comprasFiltradas.length} compras en rango`
            : 'Mostrando todos los registros'}
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: '16px', padding: '20px',
            boxShadow: `0 8px 24px ${s.glow}`,
            border: `1px solid ${s.border}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -16, right: -16,
              fontSize: '72px', opacity: 0.12, lineHeight: 1,
            }}>{s.icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '8px', fontWeight: 500 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── REPORT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {reportCards.map(card => (
          <div key={card.id} style={{
            background: card.lightBg,
            border: `1px solid ${card.border}`,
            borderRadius: '18px', padding: '26px',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: card.bg, borderRadius: '18px 18px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                {/* icon badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 52, height: 52, borderRadius: '14px',
                  background: card.bg, fontSize: '24px',
                  boxShadow: `0 6px 16px ${card.border}`,
                  marginBottom: '12px',
                }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {card.title}
                </div>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700,
                  background: `${card.tag}20`, color: card.tag,
                  border: `1px solid ${card.tag}40`,
                }}>
                  {card.count}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '20px', minHeight: '38px' }}>
              {card.desc}
            </p>

            <button
              onClick={card.action}
              disabled={downloading === card.id}
              style={{
                background: downloading === card.id ? 'rgba(255,255,255,0.1)' : card.bg,
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '11px 22px', fontSize: '13px', fontWeight: 700,
                cursor: downloading === card.id ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: downloading === card.id ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: `0 4px 12px ${card.border}`,
                width: '100%', justifyContent: 'center',
              }}
            >
              {downloading === card.id ? '⏳ Generando archivo...' : '⬇️ Descargar Excel'}
            </button>
          </div>
        ))}
      </div>

      {/* ── INFO NOTE ── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.06))',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: '12px', padding: '14px 20px',
        fontSize: '12px', color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <span style={{ fontSize: '18px' }}>💡</span>
        <span>
          <strong style={{ color: '#60a5fa' }}>Nota:</strong> Los montos en Bolívares se calculan con la tasa BCV registrada en cada factura.
          Tasa BCV actual: <strong style={{ color: '#10b981' }}>{tasaBCV > 0 ? `Bs. ${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2 }).format(tasaBCV)}` : 'No configurada'}</strong>
        </span>
      </div>
    </div>
  );
};

export default Reportes;
