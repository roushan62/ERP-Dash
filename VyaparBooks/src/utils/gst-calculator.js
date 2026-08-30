'use strict';
// GST calculator: CGST/SGST/IGST logic for Indian GST
(function (root) {
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  // Same state (state codes match) -> CGST + SGST each = rate/2
  // Different state -> IGST = full rate
  function split(rate, companyState, partyState) {
    const r = round2(rate || 0);
    const cs = String(companyState || '').trim().toUpperCase();
    const ps = String(partyState || '').trim().toUpperCase();
    if (r <= 0) return { cgst: 0, sgst: 0, igst: 0 };
    if (cs && ps && cs !== ps) {
      return { cgst: 0, sgst: 0, igst: round2(r) };
    }
    const half = round2(r / 2);
    return { cgst: half, sgst: round2(r - half), igst: 0 };
  }
  function line(rate, taxable) {
    const s = split(rate);
    const t = round2(taxable || 0);
    return {
      taxable: t,
      cgst: round2((t * s.cgst) / 100),
      sgst: round2((t * s.sgst) / 100),
      igst: round2((t * s.igst) / 100),
      total: round2(t + (t * (rate || 0)) / 100),
    };
  }
  root.VB = root.VB || {};
  root.VB.gst = { round2, split, line };
})(typeof window !== 'undefined' ? window : globalThis);
