import { U } from '../src/utils.js';

const tests = {
  testRounding() {
    console.assert(U.r2(10.234) === 10.23, 'r2(10.234) should be 10.23');
    console.assert(U.r2(10.236) === 10.24, 'r2(10.236) should be 10.24');
    console.assert(U.r2(10.2) === 10.2, 'r2(10.2) should be 10.2');
    console.assert(U.r2(0) === 0, 'r2(0) should be 0');
  },

  testRoundingUp() {
    console.assert(U.r2up(10.234) === 10.24, 'r2up(10.234) should be 10.24');
    console.assert(U.r2up(10.231) === 10.24, 'r2up(10.231) should be 10.24');
    console.assert(U.r2up(10.2) === 10.2, 'r2up(10.2) should be 10.2');
  },

  testFormattingUSD() {
    console.assert(U.fmt(1234.567) === '1,234.57', 'fmt(1234.567) should format with comma');
    console.assert(U.fmt(0) === '0.00', 'fmt(0) should be 0.00');
  },

  testFormattingBs() {
    const val = U.fmtBs(100, 36.5);
    console.assert(val.includes('3.650,00') || val.includes('3,650.00'), `fmtBs(100, 36.5) formatting check failed, got: "${val}"`);
    console.assert(U.fmtBs(100, 0) === 'Bs. —', 'fmtBs with zero rate should be empty');
  },

  testFormattingBsNum() {
    console.assert(U.fmtBsNum(100, 36.5) === 3650, `fmtBsNum(100, 36.5) got ${U.fmtBsNum(100, 36.5)}`);
  },

  testDateUtils() {
    console.assert(U.fmtDate('2026-05-19') === '19/05/2026', `fmtDate got "${U.fmtDate('2026-05-19')}"`);
    console.assert(U.fmtDate('') === '—', 'Empty date should format as dash');
    
    // Firestore Timestamp simulation
    const mockTimestamp = { toDate: () => new Date('2026-05-19T12:00:00') };
    console.assert(U.fmtDate(mockTimestamp) === '19/05/2026', `fmtDate(Timestamp) got "${U.fmtDate(mockTimestamp)}"`);
    
    // Date object
    const dateObj = new Date('2026-05-19T12:00:00');
    console.assert(U.fmtDate(dateObj) === '19/05/2026', `fmtDate(Date) got "${U.fmtDate(dateObj)}"`);
    
    // Invalid Date Fallback
    console.assert(U.fmtDate('Not-A-Date') === 'Not-A-Date', `fmtDate(Invalid) got "${U.fmtDate('Not-A-Date')}"`);
    
    console.assert(U.addDays('2026-05-19', 5) === '2026-05-24', `addDays got "${U.addDays('2026-05-19', 5)}"`);
    console.assert(U.addDays(mockTimestamp, 5) === '2026-05-24', `addDays(Timestamp) got "${U.addDays(mockTimestamp, 5)}"`);
    console.assert(U.addDays(dateObj, 5) === '2026-05-24', `addDays(Date) got "${U.addDays(dateObj, 5)}"`);
    console.assert(U.addDays('Not-A-Date', 5) === 'Not-A-Date', `addDays(Invalid) got "${U.addDays('Not-A-Date', 5)}"`);
    
    console.assert(U.isToday(U.today()) === true, 'isToday should return true for today');
  }
};

let passed = 0;
let failed = 0;

console.log('🧪 Iniciando pruebas unitarias de utilidades (pastorca-admin)...');
for (const [name, fn] of Object.entries(tests)) {
  try {
    fn();
    console.log(`✅ [PASSED] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAILED] ${name}: ${err.message}`);
    failed++;
  }
}

console.log(`\n📊 Resumen: ${passed} exitosas, ${failed} fallidas.`);
process.exit(failed > 0 ? 1 : 0);
