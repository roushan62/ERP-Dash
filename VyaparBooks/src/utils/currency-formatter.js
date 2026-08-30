'use strict';
// Indian numbering system formatter - ₹ 1,23,45,678.00
(function (root) {
  function formatINR(value, decimals) {
    const n = Number(value) || 0;
    const d = decimals === undefined ? 2 : decimals;
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    const fixed = abs.toFixed(d);
    const parts = fixed.split('.');
    let intPart = parts[0];
    const rest = parts[1] ? '.' + parts[1] : '';
    // Indian grouping: last 3 digits, then groups of 2
    const last3 = intPart.length > 3 ? intPart.slice(-3) : intPart;
    const front = intPart.length > 3 ? intPart.slice(0, -3) : '';
    const groupedFront = front ? front.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '';
    return sign + '₹ ' + groupedFront + last3 + rest;
  }
  function formatNumber(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }
  function formatQty(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  function parseAmount(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }
  root.VB = root.VB || {};
  root.VB.currency = {
    format: formatINR,
    formatNumber,
    formatQty,
    parse: parseAmount,
  };
})(typeof window !== 'undefined' ? window : globalThis);
