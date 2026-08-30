'use strict';
// Indian Financial Year logic: April to March
(function (root) {
  function fyName(dateISO) {
    const s = String(dateISO || '').slice(0, 10);
    const m = parseInt(s.slice(5, 7), 10);
    if (isNaN(m) || !s) {
      const d = new Date();
      const mm = d.getMonth() + 1;
      const yy = d.getFullYear();
      return mm >= 4 ? `${yy}-${String((yy + 1) % 100).padStart(2, '0')}` : `${yy - 1}-${String(yy % 100).padStart(2, '0')}`;
    }
    const y = parseInt(s.slice(0, 4), 10);
    return m >= 4 ? `${y}-${String((y + 1) % 100).padStart(2, '0')}` : `${y - 1}-${String(y % 100).padStart(2, '0')}`;
  }
  function fyRange(name) {
    const m = String(name).match(/^(\d{4})-(\d{2})$/);
    if (!m) {
      const n = fyName();
      return fyRange(n);
    }
    const startYear = parseInt(m[1], 10);
    const endYear = startYear + 1;
    return { name, start: `${startYear}-04-01`, end: `${endYear}-03-31` };
  }
  function isInFY(dateISO, name) {
    const r = fyRange(name);
    const s = String(dateISO).slice(0, 10);
    return s >= r.start && s <= r.end;
  }
  root.VB = root.VB || {};
  root.VB.financialYear = { fyName, fyRange, isInFY };
})(typeof window !== 'undefined' ? window : globalThis);
