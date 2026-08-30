'use strict';
// Print handler (renderer side). Uses the browser print dialog with clean print CSS.
(function (root) {
  function printHtml(html) {
    const hidden = document.createElement('div');
    hidden.id = 'vb-print-doc';
    hidden.style.cssText = 'position:absolute;left:-9999px;top:0;width:100%;';
    hidden.innerHTML = html;
    document.body.appendChild(hidden);
    setTimeout(() => {
      window.print();
      setTimeout(() => hidden.remove(), 500);
    }, 50);
  }
  function printDocument(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) { root.VB.toast.error('Nothing to print.'); return; }
    const clone = el.cloneNode(true);
    const hidden = document.createElement('div');
    hidden.id = 'vb-print-doc';
    hidden.style.cssText = 'position:absolute;left:-9999px;top:0;width:100%;';
    hidden.appendChild(clone);
    document.body.appendChild(hidden);
    setTimeout(() => {
      window.print();
      setTimeout(() => hidden.remove(), 500);
    }, 50);
  }
  function exportPdf(payload) {
    return window.vyapar.exportPdf(payload);
  }
  function exportExcel(payload) {
    return window.vyapar.exportExcel(payload);
  }
  root.VB = root.VB || {};
  root.VB.print = { printHtml, printDocument, exportPdf, exportExcel };
})(typeof window !== 'undefined' ? window : globalThis);
