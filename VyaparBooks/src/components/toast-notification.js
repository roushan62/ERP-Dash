'use strict';
// Toast notifications (top-right, slide-in)
(function (root) {
  function container() {
    let el = document.getElementById('vb-toast-container');
    if (!el) { el = document.createElement('div'); el.id = 'vb-toast-container'; el.className = 'toast-container'; document.body.appendChild(el); }
    return el;
  }
  function show(message, type, title) {
    const c = container();
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = `<div class="toast-title">${root.VB.esc(title || defaultTitle(type))}</div><div>${root.VB.esc(message)}</div>`;
    c.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
  }
  function defaultTitle(type) {
    if (type === 'success') return 'Success';
    if (type === 'error') return 'Error';
    if (type === 'warning') return 'Warning';
    return 'Info';
  }
  root.VB = root.VB || {};
  root.VB.toast = { show, info: (m, t) => show(m, '', t), success: (m) => show(m, 'success'), error: (m) => show(m, 'error'), warning: (m) => show(m, 'warning') };
})(typeof window !== 'undefined' ? window : globalThis);
