'use strict';
/**
 * VyaparBooks renderer shell + router.
 *
 * Every module registers its route implementation into VB.registry. The
 * shell here builds the sidebar/header, watches the hash for navigation,
 * mounts the matching page, and listens for global keyboard shortcuts.
 */
(function (root) {
  const registry = {};

  function registerPage(route, def) {
    registry[route] = def;
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function invoke(module, action, payload) {
    return window.vyapar.invoke(module, action, payload);
  }
  function fmt(value) {
    return root.VB.currency ? root.VB.currency.format(value) : ('₹' + (value || 0));
  }
  function fmtR(value) {
    return root.VB.currency ? root.VB.currency.formatNumber(value) : (value || 0);
  }
  function fmtDate(s) {
    return root.VB.date ? root.VB.date.format(s) : s;
  }
  function today() {
    return root.VB.date ? root.VB.date.todayISO() : new Date().toISOString().slice(0, 10);
  }
  function currentRoute() {
    return (location.hash || '#dashboard').replace(/^#/, '') || 'dashboard';
  }
  async function setupCheck() {
    try {
      const needed = await invoke('app', 'isSetupNeeded');
      if (needed && currentRoute() !== 'company-setup') location.hash = '#company-setup';
    } catch (e) { /* ignore */ }
  }
  function navigate(route) { location.hash = '#' + route; }

  // Expose helpers immediately so module scripts loading after this file can
  // call VB.registerPage before DOM is ready.
  root.VB.esc = esc;
  root.VB.invoke = invoke;
  root.VB.states = [
    { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' }, { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' }, { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' }, { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' }, { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' }, { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' }, { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' }, { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' }, { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
    { code: '27', name: 'Maharashtra' }, { code: '29', name: 'Karnataka' }, { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' }, { code: '32', name: 'Kerala' }, { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' }, { code: '35', name: 'Andaman & Nicobar Islands' },
    { code: '36', name: 'Telangana' }, { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' }, { code: '97', name: 'Other Territory' },
  ];
  root.VB.fmt = fmt;
  root.VB.fmtR = fmtR;
  root.VB.fmtDate = fmtDate;
  root.VB.today = today;
  root.VB.exportPdf = (opts) => window.vyapar.exportPdf(opts || {});
  root.VB.exportExcel = (opts) => window.vyapar.exportExcel(opts || {});
  root.VB.navigate = navigate;
  root.VB.registerPage = registerPage;

  function mount() {
    const content = document.getElementById('app-content');
    const route = currentRoute();
    const page = registry[route] || registry.dashboard;
    if (!page) { content.innerHTML = '<div class="empty">Page not found.</div>'; return; }
    content.innerHTML = `<div class="content-inner">${typeof page.render === 'function' ? page.render() : ''}</div>`;
    content.querySelectorAll('.loader').forEach((l) => l.remove());
    if (page.init) page.init(content.querySelector('.content-inner'), content);
    root.VB.sidebar && root.VB.sidebar.init();
  }

  function setupGlobalSearchFocus() {
    document.addEventListener('keydown', async (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const route = currentRoute();
        const txn = ['sales', 'purchase', 'payment', 'receipt', 'journal', 'contra', 'creditnote', 'debitnote', 'expense'];
        if (!txn.includes(route)) navigate('sales');
        window.dispatchEvent(new CustomEvent('vb:new-voucher'));
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('vb:save'));
      }
      if (mod && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('vb:print'));
      }
      if (mod && e.key.toLowerCase() === 'f') {
        const el = document.getElementById('global-search');
        if (el) { e.preventDefault(); el.focus(); }
      }
      if (e.key === 'F5') { e.preventDefault(); mount(); }
      if (e.key === 'Escape') { root.VB.modal && root.VB.modal.close(); }
    });
    if (window.vyapar.onMenu) {
      window.vyapar.onMenu(({ action }) => {
        if (action === 'save') window.dispatchEvent(new CustomEvent('vb:save'));
        if (action === 'print') window.dispatchEvent(new CustomEvent('vb:print'));
        if (action === 'search') document.getElementById('global-search') && document.getElementById('global-search').focus();
        if (action === 'new') {
          const route = currentRoute();
          if (!['sales','purchase','payment','receipt','journal','contra','creditnote','debitnote','expense'].includes(route)) navigate('sales');
          window.dispatchEvent(new CustomEvent('vb:new-voucher'));
        }
      });
    }
  }

  async function boot() {
    await setupCheck();
    try { await root.VB.header.init(); } catch (e) { /* header failure should not block */ }
    mount();
    window.addEventListener('hashchange', async () => {
      await setupCheck();
      mount();
    });
    setupGlobalSearchFocus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  root.VB.registry = registry;
})(typeof window !== 'undefined' ? window : globalThis);
