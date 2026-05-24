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
    try {
      let dt;
      if (typeof d.toDate === 'function') {
        dt = d.toDate();
      } else if (d instanceof Date) {
        dt = d;
      } else {
        const dStr = String(d);
        dt = new Date(dStr.includes('T') ? dStr : dStr + 'T12:00:00');
      }
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return String(d);
    }
  },
  today() {
    return new Date().toISOString().split('T')[0];
  },
  addDays(date, days) {
    try {
      let d;
      if (date && typeof date.toDate === 'function') {
        d = date.toDate();
      } else if (date instanceof Date) {
        d = new Date(date);
      } else {
        const dateStr = String(date);
        d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
      }
      if (isNaN(d.getTime())) return String(date);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return String(date);
    }
  },
  isToday(dateStr) {
    if (!dateStr) return false;
    return dateStr === new Date().toISOString().split('T')[0];
  },
  loadHtml2Pdf() {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }
};
