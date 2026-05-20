import React, { useState, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAppData } from '../context/AppDataContext';
import { U } from '../utils';

/* ═══════════════════════════════════════════════════════════
   SVG CHARTS — Lightweight, no external dependencies
   ═══════════════════════════════════════════════════════════ */

const DonutChart = ({ segments, size = 180, strokeWidth = 28 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* background ring */}
      <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} />
      {total > 0 && segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const rot = (offset / total) * 360 - 90;
        offset += seg.value;
        return (
          <circle
            key={i} cx={center} cy={center} r={radius} fill="none"
            stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            transform={`rotate(${rot} ${center} ${center})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        );
      })}
      <text x={center} y={center - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="800">
        {total}
      </text>
      <text x={center} y={center + 12} textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="500">
        Total
      </text>
    </svg>
  );
};

const BarChart = ({ bars, maxVal }) => {
  const max = maxVal || Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {bars.map((bar, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{bar.label}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: bar.color || 'var(--accent-blue)' }}>$ {U.fmt(bar.value)}</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max((bar.value / max) * 100, 1)}%`, height: '100%',
              background: bar.gradient || bar.color || 'var(--gradient-blue)',
              borderRadius: '6px', transition: 'width 0.8s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const ProgressBar = ({ value, max, height = 8 }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '6px', height, overflow: 'hidden', minWidth: '80px' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: '6px',
        background: pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN REPORTES COMPONENT
   ═══════════════════════════════════════════════════════════ */

const safeDateStr = (d) => {
  if (!d) return '';
  if (typeof d === 'object') {
    if (typeof d.toMillis === 'function') {
      return new Date(d.toMillis()).toISOString().split('T')[0];
    }
    if (d.seconds !== undefined) {
      return new Date(d.seconds * 1000).toISOString().split('T')[0];
    }
    if (d instanceof Date) {
      return d.toISOString().split('T')[0];
    }
    try {
      const str = String(d);
      if (str.includes('[object')) return '';
      return str.split('T')[0];
    } catch {
      return '';
    }
  }
  return String(d).split('T')[0];
};

const Reportes = () => {
  const { data, tasaBCV } = useAppData();
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState('');
  const [downloading, setDownloading] = useState('');
  const [activeTab, setActiveTab] = useState('resumen');

  const hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* ── Filtrado por fecha ── */
  const filterByDate = useCallback((items, campo = 'fecha') => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      const f = safeDateStr(item[campo]);
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      return true;
    });
  }, [fechaDesde, fechaHasta]);

  const ventasFiltradas = useMemo(() => filterByDate(data?.ventas || []), [data.ventas, filterByDate]);
  const comprasFiltradas = useMemo(() => {
    const list = filterByDate(data?.compras || []);
    if (selectedProveedor) {
      return list.filter(c => String(c.proveedorNombre || '').trim().toLowerCase() === String(selectedProveedor).trim().toLowerCase());
    }
    return list;
  }, [data.compras, filterByDate, selectedProveedor]);

  const totalVentasUSD = ventasFiltradas.reduce((s, v) => s + (v.total || 0), 0);
  const totalComprasUSD = comprasFiltradas.reduce((s, c) => s + (c.total || 0), 0);
  const utilidad = totalVentasUSD - totalComprasUSD;

  /* ── Datos para gráficos ── */
  const monthlyData = useMemo(() => {
    const months = {};
    ventasFiltradas.forEach(v => {
      const m = safeDateStr(v.fecha).substring(0, 7); // YYYY-MM
      if (!m) return;
      months[m] = months[m] || { ventas: 0, compras: 0 };
      months[m].ventas += v.total || 0;
    });
    comprasFiltradas.forEach(c => {
      const m = safeDateStr(c.fecha).substring(0, 7);
      if (!m) return;
      months[m] = months[m] || { ventas: 0, compras: 0 };
      months[m].compras += c.total || 0;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => {
        const [y, m] = key.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthIdx = parseInt(m, 10) - 1;
        const monthLabel = monthIdx >= 0 && monthIdx < 12 ? monthNames[monthIdx] : 'Mes';
        const yearLabel = y ? y.slice(2) : '';
        return { label: `${monthLabel} ${yearLabel}`, ...val };
      });
  }, [ventasFiltradas, comprasFiltradas]);

  const paymentStatus = useMemo(() => {
    const pagado = ventasFiltradas.filter(v => v.estadoPago === 'pagado').length;
    const pendiente = ventasFiltradas.filter(v => v.estadoPago === 'pendiente' || !v.estadoPago).length;
    const parcial = ventasFiltradas.filter(v => v.estadoPago === 'parcial' || v.estadoPago === 'abonado').length;
    return { pagado, pendiente, parcial };
  }, [ventasFiltradas]);

  /* ── Datos de clientes para tabla visual ── */
  const clientesData = useMemo(() => {
    return (data?.clientes || []).map(c => {
      const vc = ventasFiltradas.filter(v => String(v.clienteId) === String(c.id));
      const totalFacturado = vc.reduce((s, v) => s + (v.total || 0), 0);
      const totalPendiente = vc.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s + (v.total || 0), 0);
      const totalPagado = totalFacturado - totalPendiente;
      return { ...c, facturas: vc.length, totalFacturado, totalPendiente, totalPagado };
    }).sort((a, b) => b.totalFacturado - a.totalFacturado);
  }, [data.clientes, ventasFiltradas]);

  /* ── Datos de pagos proveedores ── */
  const pagosData = useMemo(() => {
    return comprasFiltradas.map(c => {
      const pagos = c.pagos || [];
      const totalPagado = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
      const pendiente = U.r2(c.total - totalPagado);
      return { ...c, totalPagado, pendiente, cantPagos: pagos.length };
    });
  }, [comprasFiltradas]);

  /* ═══════════════════════════════════════
     EXCEL DOWNLOAD FUNCTIONS (unchanged)
     ═══════════════════════════════════════ */
  const addHeader = (wb, ws, title) => {
    XLSX.utils.sheet_add_aoa(ws, [[title, '', `Generado: ${hoy}`, '', `Tasa BCV: Bs. ${tasaBCV}`]], { origin: 'A1' });
  };

  const downloadClientes = () => {
    setDownloading('clientes');
    const rows = (data?.clientes || []).map(c => {
      const vc = filterByDate((data?.ventas || []).filter(v => String(v.clienteId) === String(c.id)));
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
    const ventas = filterByDate(data?.ventas || []);
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
    const rows = comprasFiltradas.map(c => ({
      'Fecha': U.fmtDate(c.fecha), 'Factura N°': c.numeroFactura, 'Proveedor': c.proveedorNombre,
      'N° Productos': (c.items || []).length,
      'Subtotal ($)': +(c.subtotal || 0).toFixed(2),
      'IVA ($)': +(c.iva || 0).toFixed(2),
      'Desc. Proveedor ($)': +(c.montoDescuento || 0).toFixed(2),
      'Total ($)': +(c.total || 0).toFixed(2),
      'Total Bs.': tasaBCV > 0 ? +((c.total || 0) * (c.tasaBCVUsada || tasaBCV)).toFixed(2) : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compras');
    const provName = selectedProveedor || 'Todos';
    addHeader(wb, ws, `PASTORCA — Compras (${provName}) — ${hoy}`);
    XLSX.writeFile(wb, `PASTORCA_Compras_${provName.replace(/\s+/g, '_')}_${U.today()}.xlsx`);
    setDownloading('');
  };

  const downloadCompleto = () => {
    setDownloading('completo');
    const wb = XLSX.utils.book_new();
    const clienteRows = (data?.clientes || []).map(c => {
      const vc = filterByDate((data?.ventas || []).filter(v => String(v.clienteId) === String(c.id)));
      return { 'Nombre': c.nombre, 'RIF': c.rif, 'Teléfono': c.telefono || '', 'Facturas': vc.length,
        'Total ($)': +vc.reduce((s, v) => s + (v.total || 0), 0).toFixed(2),
        'Pendiente ($)': +vc.filter(v => v.estadoPago !== 'pagado').reduce((s, v) => s + (v.total || 0), 0).toFixed(2) };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clienteRows), 'Clientes');
    const ventaRows = filterByDate(data?.ventas || []).map(v => ({
      'Fecha': U.fmtDate(v.fecha), 'Cliente': v.clienteNombre,
      'Total ($)': +(v.total || 0).toFixed(2), 'Estado': v.estadoPago,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventaRows), 'Pre-Facturas Ventas');
    const compraRows = comprasFiltradas.map(c => ({
      'Fecha': U.fmtDate(c.fecha), 'Factura': c.numeroFactura, 'Proveedor': c.proveedorNombre,
      'Total ($)': +(c.total || 0).toFixed(2),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compraRows), 'Compras');
    const provName = selectedProveedor ? `_${selectedProveedor.replace(/\s+/g, '_')}` : '';
    XLSX.writeFile(wb, `PASTORCA_ReporteCompleto${provName}_${U.today()}.xlsx`);
    setDownloading('');
  };

  const downloadPagosProveedores = () => {
    setDownloading('pagos');
    const rows = comprasFiltradas.map(c => {
      const pagos = c.pagos || [];
      const totalPagado = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0) || (c.pagadaUpaca ? c.total : 0);
      const pendiente = U.r2(c.total - totalPagado);
      const ultimoPago = pagos.length > 0 ? pagos[pagos.length - 1] : null;
      return {
        'Proveedor': c.proveedorNombre,
        'N° Factura del Proveedor': c.numeroFactura,
        'Fecha de Emision de Factura': U.fmtDate(c.fecha),
        'Fecha Recepcion': U.fmtDate(c.fecha),
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
    ws['!cols'] = [
      { wch: 30 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 15 },
      { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 15 }, { wch: 25 }, { wch: 45 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Control de Pagos');
    const provName = selectedProveedor || 'Todos';
    addHeader(wb, ws, `PASTORCA — Control de Pagos (${provName}) — ${hoy}`);
    XLSX.writeFile(wb, `PASTORCA_ControlPagos_${provName.replace(/\s+/g, '_')}_${U.today()}.xlsx`);
    setDownloading('');
  };

  /* ═══════════════════════════════════════
     STYLES
     ═══════════════════════════════════════ */
  const tabStyle = (id) => ({
    padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
    cursor: 'pointer', border: 'none', fontFamily: 'Outfit, sans-serif',
    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
    background: activeTab === id ? 'var(--gradient-blue)' : 'transparent',
    color: activeTab === id ? '#fff' : 'var(--text-secondary)',
    boxShadow: activeTab === id ? '0 4px 12px rgba(30,64,175,0.3)' : 'none',
  });

  const cardBox = {
    background: '#fff', borderRadius: '16px', border: '1px solid var(--border-color)',
    padding: '24px', boxShadow: 'var(--shadow-sm)',
  };

  const dlBtnStyle = (color, id) => ({
    background: downloading === id ? 'rgba(0,0,0,0.08)' : color,
    color: '#fff', border: 'none', borderRadius: '10px',
    padding: '10px 20px', fontSize: '13px', fontWeight: 700,
    cursor: downloading === id ? 'wait' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s',
    opacity: downloading === id ? 0.6 : 1,
  });

  const inputStyle = {
    padding: '9px 14px', borderRadius: '10px', fontSize: '13px',
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.08)', color: '#ffffff',
    fontFamily: 'Outfit, sans-serif', outline: 'none',
  };

  const badgeStyle = (type) => {
    const map = {
      pagado: { bg: '#0596691a', color: '#059669', label: '✅ Pagado' },
      pendiente: { bg: '#dc26261a', color: '#dc2626', label: '⏳ Pendiente' },
      parcial: { bg: '#d977061a', color: '#d97706', label: '🔄 Parcial' },
      abonado: { bg: '#d977061a', color: '#d97706', label: '🔄 Abonado' },
    };
    const s = map[type] || map.pendiente;
    return (
      <span style={{
        background: s.bg, color: s.color, padding: '3px 10px',
        borderRadius: '20px', fontSize: '11px', fontWeight: 700,
        whiteSpace: 'nowrap',
      }}>{s.label}</span>
    );
  };

  /* ═══════════════════════════════════════
     STATS CARDS (top metrics)
     ═══════════════════════════════════════ */
  const stats = [
    { label: 'VENTAS EN PERÍODO', value: `$ ${U.fmt(totalVentasUSD)}`, sub: tasaBCV > 0 ? U.fmtBs(totalVentasUSD, tasaBCV) : '—', icon: '📤', bg: 'linear-gradient(135deg,#059669,#10b981)', glow: 'rgba(16,185,129,0.35)', border: 'rgba(16,185,129,0.5)' },
    { label: 'COMPRAS EN PERÍODO', value: `$ ${U.fmt(totalComprasUSD)}`, sub: tasaBCV > 0 ? U.fmtBs(totalComprasUSD, tasaBCV) : '—', icon: '📥', bg: 'linear-gradient(135deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.35)', border: 'rgba(6,182,212,0.5)' },
    { label: 'UTILIDAD ESTIMADA', value: `$ ${U.fmt(utilidad)}`, sub: tasaBCV > 0 ? U.fmtBs(utilidad, tasaBCV) : '—', icon: utilidad >= 0 ? '📈' : '📉', bg: utilidad >= 0 ? 'linear-gradient(135deg,#7c3aed,#8b5cf6)' : 'linear-gradient(135deg,#dc2626,#ef4444)', glow: utilidad >= 0 ? 'rgba(139,92,246,0.35)' : 'rgba(239,68,68,0.35)', border: utilidad >= 0 ? 'rgba(139,92,246,0.5)' : 'rgba(239,68,68,0.5)' },
    { label: 'CLIENTES REGISTRADOS', value: String(data.clientes.length), sub: `${ventasFiltradas.filter(v => v.estadoPago !== 'pagado').length} facturas pendientes`, icon: '👥', bg: 'linear-gradient(135deg,#d97706,#f59e0b)', glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.5)' },
  ];

  /* ═══════════════════════════════════════
     TABS DEFINITION
     ═══════════════════════════════════════ */
  const tabs = [
    { id: 'resumen', label: 'Resumen General', icon: '📊' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'ventas', label: 'Ventas', icon: '📋' },
    { id: 'compras', label: 'Compras', icon: '🧾' },
    { id: 'pagos', label: 'Control de Pagos', icon: '💳' },
  ];

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="view-container">

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          📊 Dashboard de Reportes
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Visualiza y descarga reportes filtrados por período — Generado: {hoy}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Proveedor</span>
          <select
            style={{
              ...inputStyle,
              background: 'rgba(255,255,255,0.08)',
              color: '#ffffff',
              border: '1.5px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
            }}
            value={selectedProveedor}
            onChange={e => setSelectedProveedor(e.target.value)}
          >
            <option value="" style={{ background: '#0f172a', color: '#fff' }}>Todos los Proveedores</option>
            {(data?.proveedores || []).map(p => (
              <option key={p.id} value={p.nombre} style={{ background: '#0f172a', color: '#fff' }}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        {(fechaDesde || fechaHasta || selectedProveedor) && (
          <button onClick={() => { setFechaDesde(''); setFechaHasta(''); setSelectedProveedor(''); }} style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            color: '#f87171', borderRadius: '8px', cursor: 'pointer',
            padding: '8px 14px', fontSize: '12px', fontWeight: 700,
          }}>✕ Limpiar</button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          {fechaDesde || fechaHasta || selectedProveedor
            ? `📊 ${ventasFiltradas.length} ventas · ${comprasFiltradas.length} compras filtradas`
            : 'Mostrando todos los registros'}
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: '16px', padding: '20px',
            boxShadow: `0 8px 24px ${s.glow}`, border: `1px solid ${s.border}`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -16, right: -16, fontSize: '72px', opacity: 0.12, lineHeight: 1 }}>{s.icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '10px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '8px', fontWeight: 500 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '24px', background: '#f1f5f9',
        padding: '6px', borderRadius: '14px', flexWrap: 'wrap',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} style={tabStyle(tab.id)} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
        {/* Download all button */}
        <button
          onClick={downloadCompleto}
          disabled={downloading === 'completo'}
          style={{
            ...dlBtnStyle('linear-gradient(135deg,#7c3aed,#8b5cf6)', 'completo'),
            marginLeft: 'auto', padding: '8px 16px', borderRadius: '10px',
          }}
        >
          {downloading === 'completo' ? '⏳ Generando...' : '📥 Descargar Todo (Excel)'}
        </button>
      </div>

      {/* ═══════════════════════════════════
         TAB: RESUMEN GENERAL
         ═══════════════════════════════════ */}
      {activeTab === 'resumen' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.3s both' }}>

          {/* Ventas vs Compras por Mes */}
          <div style={cardBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>📊 Ventas vs Compras</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Comparativo últimos meses (USD)</p>
              </div>
            </div>
            {monthlyData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {monthlyData.map((m, i) => {
                  const max = Math.max(...monthlyData.map(d => Math.max(d.ventas, d.compras)), 1);
                  return (
                    <div key={i}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{m.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', width: '55px', color: '#059669', fontWeight: 700 }}>Ventas</span>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.05)', borderRadius: '4px', height: '14px', overflow: 'hidden' }}>
                          <div style={{ width: `${(m.ventas / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#059669,#10b981)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', width: '80px', textAlign: 'right' }}>$ {U.fmt(m.ventas)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', width: '55px', color: '#0891b2', fontWeight: 700 }}>Compras</span>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.05)', borderRadius: '4px', height: '14px', overflow: 'hidden' }}>
                          <div style={{ width: `${(m.compras / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#0891b2,#06b6d4)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0891b2', width: '80px', textAlign: 'right' }}>$ {U.fmt(m.compras)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '14px' }}>
                📭 No hay datos en el período seleccionado
              </div>
            )}
          </div>

          {/* Donut: Estado de Pagos */}
          <div style={cardBox}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>🎯 Estado de Pagos — Ventas</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Distribución de pre-facturas por estado</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
              <DonutChart segments={[
                { value: paymentStatus.pagado, color: '#10b981' },
                { value: paymentStatus.pendiente, color: '#ef4444' },
                { value: paymentStatus.parcial, color: '#f59e0b' },
              ]} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Pagado', value: paymentStatus.pagado, color: '#10b981', bg: '#0596691a' },
                  { label: 'Pendiente', value: paymentStatus.pendiente, color: '#ef4444', bg: '#dc26261a' },
                  { label: 'Parcial / Abonado', value: paymentStatus.parcial, color: '#f59e0b', bg: '#d977061a' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 Clientes */}
          <div style={{ ...cardBox, gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>🏆 Top Clientes por Facturación</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Los 5 clientes con mayor volumen en el período</p>
              </div>
            </div>
            <BarChart
              bars={clientesData.slice(0, 5).map((c, i) => ({
                label: `${c.nombre}`,
                value: c.totalFacturado,
                gradient: ['linear-gradient(90deg,#1e40af,#3b82f6)', 'linear-gradient(90deg,#059669,#10b981)', 'linear-gradient(90deg,#7c3aed,#8b5cf6)', 'linear-gradient(90deg,#d97706,#f59e0b)', 'linear-gradient(90deg,#0891b2,#06b6d4)'][i],
                color: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4'][i],
              }))}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
         TAB: CLIENTES
         ═══════════════════════════════════ */}
      {activeTab === 'clientes' && (
        <div style={{ animation: 'fadeIn 0.3s both' }}>
          <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>👥 Reporte de Clientes</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{clientesData.length} clientes registrados</p>
              </div>
              <button onClick={downloadClientes} disabled={downloading === 'clientes'} style={dlBtnStyle('linear-gradient(135deg,#1e40af,#3b82f6)', 'clientes')}>
                {downloading === 'clientes' ? '⏳ Generando...' : '⬇️ Descargar Excel'}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>RIF</th>
                    <th style={{ textAlign: 'center' }}>Facturas</th>
                    <th style={{ textAlign: 'right' }}>Facturado ($)</th>
                    <th style={{ textAlign: 'right' }}>Pagado ($)</th>
                    <th style={{ textAlign: 'right' }}>Pendiente ($)</th>
                    <th style={{ minWidth: '120px' }}>Progreso Cobro</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesData.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>📭 No hay clientes registrados</td></tr>
                  ) : clientesData.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.nombre}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.rif}</td>
                      <td style={{ textAlign: 'center' }}><span style={{ background: '#1e40af1a', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>{c.facturas}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>$ {U.fmt(c.totalFacturado)}</td>
                      <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>$ {U.fmt(c.totalPagado)}</td>
                      <td style={{ textAlign: 'right', color: c.totalPendiente > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>$ {U.fmt(c.totalPendiente)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProgressBar value={c.totalPagado} max={c.totalFacturado} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {c.totalFacturado > 0 ? Math.round((c.totalPagado / c.totalFacturado) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td>{c.totalPendiente <= 0 ? badgeStyle('pagado') : badgeStyle('pendiente')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {clientesData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', padding: '16px 24px', borderTop: '2px solid var(--border-color)', background: '#f8fafc' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Facturado: <span style={{ color: '#1e40af' }}>$ {U.fmt(clientesData.reduce((s, c) => s + c.totalFacturado, 0))}</span></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Pendiente: <span style={{ color: '#dc2626' }}>$ {U.fmt(clientesData.reduce((s, c) => s + c.totalPendiente, 0))}</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
         TAB: VENTAS
         ═══════════════════════════════════ */}
      {activeTab === 'ventas' && (
        <div style={{ animation: 'fadeIn 0.3s both' }}>
          <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>📋 Informe de Ventas</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{ventasFiltradas.length} pre-facturas en período</p>
              </div>
              <button onClick={downloadVentas} disabled={downloading === 'ventas'} style={dlBtnStyle('linear-gradient(135deg,#059669,#10b981)', 'ventas')}>
                {downloading === 'ventas' ? '⏳ Generando...' : '⬇️ Descargar Excel'}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>RIF</th>
                    <th style={{ textAlign: 'right' }}>Total ($)</th>
                    <th style={{ textAlign: 'right' }}>Total Bs.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>📭 No hay ventas en el período</td></tr>
                  ) : ventasFiltradas.map((v, i) => (
                    <tr key={v.id || i}>
                      <td style={{ color: 'var(--text-secondary)' }}>{U.fmtDate(v.fecha)}</td>
                      <td style={{ fontWeight: 700 }}>{v.clienteNombre}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{v.clienteRif || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>$ {U.fmt(v.total)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {tasaBCV > 0 ? U.fmtBs(v.total, v.tasaBCVUsada || tasaBCV) : '—'}
                      </td>
                      <td>{badgeStyle(v.estadoPago)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ventasFiltradas.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', padding: '16px 24px', borderTop: '2px solid var(--border-color)', background: '#f8fafc' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total: <span style={{ color: '#059669' }}>$ {U.fmt(totalVentasUSD)}</span></span>
                {tasaBCV > 0 && <span style={{ fontSize: '13px', fontWeight: 700 }}>En Bs: <span style={{ color: '#1e40af' }}>{U.fmtBs(totalVentasUSD, tasaBCV)}</span></span>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: COMPRAS ── */}
      {activeTab === 'compras' && (
        <div style={{ animation: 'fadeIn 0.3s both' }}>
          <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>🧾 Informe de Compras</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{comprasFiltradas.length} facturas en período</p>
              </div>
              <button onClick={downloadCompras} disabled={downloading === 'compras'} style={dlBtnStyle('linear-gradient(135deg,#0891b2,#06b6d4)', 'compras')}>
                {downloading === 'compras' ? '⏳ Generando...' : '⬇️ Descargar Excel'}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Factura N°</th>
                    <th>Proveedor</th>
                    <th style={{ textAlign: 'center' }}>Items</th>
                    <th style={{ textAlign: 'right' }}>Subtotal ($)</th>
                    <th style={{ textAlign: 'right' }}>IVA ($)</th>
                    <th style={{ textAlign: 'right' }}>Desc. ($)</th>
                    <th style={{ textAlign: 'right' }}>Total ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasFiltradas.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>📭 No hay compras en el período</td></tr>
                  ) : comprasFiltradas.map((c, i) => (
                    <tr key={c.id || i}>
                      <td style={{ color: 'var(--text-secondary)' }}>{U.fmtDate(c.fecha)}</td>
                      <td style={{ fontWeight: 700, color: '#1e40af' }}>{c.numeroFactura}</td>
                      <td style={{ fontWeight: 600 }}>{c.proveedorNombre}</td>
                      <td style={{ textAlign: 'center' }}><span style={{ background: '#0891b21a', color: '#0891b2', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '12px' }}>{(c.items || []).length}</span></td>
                      <td style={{ textAlign: 'right' }}>$ {U.fmt(c.subtotal)}</td>
                      <td style={{ textAlign: 'right', color: '#d97706' }}>$ {U.fmt(c.iva)}</td>
                      <td style={{ textAlign: 'right', color: '#7c3aed' }}>$ {U.fmt(c.montoDescuento)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0891b2' }}>$ {U.fmt(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {comprasFiltradas.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', padding: '16px 24px', borderTop: '2px solid var(--border-color)', background: '#f8fafc' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Subtotal: <span style={{ color: 'var(--text-secondary)' }}>$ {U.fmt(comprasFiltradas.reduce((s, c) => s + (c.subtotal || 0), 0))}</span></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>IVA: <span style={{ color: '#d97706' }}>$ {U.fmt(comprasFiltradas.reduce((s, c) => s + (c.iva || 0), 0))}</span></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total: <span style={{ color: '#0891b2' }}>$ {U.fmt(totalComprasUSD)}</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
         TAB: CONTROL DE PAGOS
         ═══════════════════════════════════ */}
      {activeTab === 'pagos' && (
        <div style={{ animation: 'fadeIn 0.3s both' }}>
          <div style={{ ...cardBox, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>💳 Control de Pagos a Proveedores</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{pagosData.length} facturas — seguimiento de abonos y saldos</p>
              </div>
              <button onClick={downloadPagosProveedores} disabled={downloading === 'pagos'} style={dlBtnStyle('linear-gradient(135deg,#db2777,#f472b6)', 'pagos')}>
                {downloading === 'pagos' ? '⏳ Generando...' : '⬇️ Descargar Excel'}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Factura N°</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Monto ($)</th>
                    <th style={{ textAlign: 'right' }}>Pagado ($)</th>
                    <th style={{ textAlign: 'right' }}>Pendiente ($)</th>
                    <th style={{ minWidth: '130px' }}>Progreso</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosData.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>📭 No hay compras en el período</td></tr>
                  ) : pagosData.map((c, i) => {
                    const pct = c.total > 0 ? Math.round((c.totalPagado / c.total) * 100) : 0;
                    const estado = pct >= 100 ? 'pagado' : pct > 0 ? 'parcial' : 'pendiente';
                    return (
                      <tr key={c.id || i}>
                        <td style={{ fontWeight: 700 }}>{c.proveedorNombre}</td>
                        <td style={{ fontWeight: 700, color: '#db2777' }}>{c.numeroFactura}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{U.fmtDate(c.fecha)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>$ {U.fmt(c.total)}</td>
                        <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>$ {U.fmt(c.totalPagado)}</td>
                        <td style={{ textAlign: 'right', color: c.pendiente > 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>$ {U.fmt(c.pendiente)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ProgressBar value={c.totalPagado} max={c.total} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: pct >= 100 ? '#059669' : pct > 0 ? '#d97706' : '#dc2626' }}>{pct}%</span>
                          </div>
                        </td>
                        <td>{badgeStyle(estado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pagosData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', padding: '16px 24px', borderTop: '2px solid var(--border-color)', background: '#f8fafc' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Facturas: <span style={{ color: 'var(--text-secondary)' }}>$ {U.fmt(pagosData.reduce((s, c) => s + c.total, 0))}</span></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Pagado: <span style={{ color: '#059669' }}>$ {U.fmt(pagosData.reduce((s, c) => s + c.totalPagado, 0))}</span></span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total Pendiente: <span style={{ color: '#dc2626' }}>$ {U.fmt(pagosData.reduce((s, c) => s + c.pendiente, 0))}</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INFO NOTE ── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.06))',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: '12px', padding: '14px 20px', marginTop: '24px',
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
