export const U = {
  // Redondeo a 2 decimales (estándar)
  r2(n) { return Math.round((n || 0) * 100) / 100; },
  // Redondeo ARRIBA a 2 decimales (para IVA: 0.3648 → 0.37)
  r2up(n) { return Math.ceil((n || 0) * 100) / 100; },
  fmt(n) {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  },
  fmtBs(n, tasa) {
    if (!tasa || tasa <= 0) return 'Bs. —';
    const val = Math.round((n || 0) * tasa * 100) / 100;
    return 'Bs. ' + new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  },
  fmtBsNum(n, tasa) {
    if (!tasa || tasa <= 0) return 0;
    return Math.round((n || 0) * tasa * 100) / 100;
  },
  fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  today() {
    return new Date().toISOString().split('T')[0];
  },
  addDays(date, days) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },
  isToday(dateStr) {
    if (!dateStr) return false;
    return dateStr === new Date().toISOString().split('T')[0];
  }
};
