'use strict';
// Indian date format DD/MM/YYYY
(function (root) {
  function pad(x) { return String(x).padStart(2, '0'); }
  function todayISO() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function toISO(dateStr) {
    if (!dateStr) return todayISO();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return m[3] + '-' + m[2] + '-' + m[1];
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    return todayISO();
  }
  function format(iso) {
    if (!iso) return '';
    const s = String(iso).slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    return m[3] + '/' + m[2] + '/' + m[1];
  }
  function monthName(iso) {
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const s = String(iso).slice(0, 10);
    const idx = parseInt(s.slice(5, 7), 10) - 1;
    return m[idx] || '';
  }
  function diffDays(a, b) {
    const da = new Date(toISO(a) + 'T00:00:00');
    const db = new Date(toISO(b) + 'T00:00:00');
    return Math.max(0, Math.floor((db - da) / 86400000));
  }
  root.VB = root.VB || {};
  root.VB.date = { todayISO, toISO, format, monthName, diffDays };
})(typeof window !== 'undefined' ? window : globalThis);
