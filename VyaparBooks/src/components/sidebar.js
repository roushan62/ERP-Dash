'use strict';
// Sidebar navigation component (collapsible groups, active state)
(function (root) {
  const ICONS = {
    dashboard: '📊', coa: '📂', ledgers: '📒', parties: '👥', items: '📦', banks: '🏦', tax: '💰',
    sales: '🧾', purchase: '🛒', payment: '💳', receipt: '📥', journal: '📝', contra: '🔄',
    creditnote: '📄', debitnote: '📄', expense: '💸',
    recon: '🏦', statement: '📊',
    gstdashboard: '📊', gstr1: '📋', gstr3b: '📋', gstledger: '📒',
    trial: '📊', pnl: '📈', balancesheet: '📋', cashflow: '💰', daybook: '📖',
    ledgerreport: '📒', receivable: '💳', payable: '💳', salesregister: '📊',
    purchaseregister: '📊', stock: '📦', aging: '⏰', expensereport: '💸',
    general: '⚙️', invoice: '🧾', backup: '💾',
  };
  const NAV = [
    { section: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard' }] },
    { section: 'Masters', items: [
      { id: 'coa', label: 'Chart of Accounts' },
      { id: 'ledgers', label: 'Ledgers' },
      { id: 'parties', label: 'Parties (Customers/Vendors)' },
      { id: 'items', label: 'Items / Services' },
      { id: 'banks', label: 'Banks' },
      { id: 'tax', label: 'Tax (GST) Setup' },
    ] },
    { section: 'Transactions', items: [
      { id: 'sales', label: 'Sales Invoice' },
      { id: 'purchase', label: 'Purchase Invoice' },
      { id: 'payment', label: 'Payment Voucher' },
      { id: 'receipt', label: 'Receipt Voucher' },
      { id: 'journal', label: 'Journal Voucher' },
      { id: 'contra', label: 'Contra Voucher' },
      { id: 'creditnote', label: 'Credit Note' },
      { id: 'debitnote', label: 'Debit Note' },
      { id: 'expense', label: 'Expense Entry' },
    ] },
    { section: 'Banking', items: [
      { id: 'recon', label: 'Bank Reconciliation' },
      { id: 'statement', label: 'Bank Statement' },
    ] },
    { section: 'GST', items: [
      { id: 'gstdashboard', label: 'GST Dashboard' },
      { id: 'gstr1', label: 'GSTR-1' },
      { id: 'gstr3b', label: 'GSTR-3B' },
      { id: 'gstledger', label: 'GST Ledger' },
    ] },
    { section: 'Reports', items: [
      { id: 'trial', label: 'Trial Balance' },
      { id: 'pnl', label: 'Profit & Loss' },
      { id: 'balancesheet', label: 'Balance Sheet' },
      { id: 'cashflow', label: 'Cash Flow Statement' },
      { id: 'daybook', label: 'Day Book' },
      { id: 'ledgerreport', label: 'Ledger Report' },
      { id: 'receivable', label: 'Outstanding Receivable' },
      { id: 'payable', label: 'Outstanding Payable' },
      { id: 'salesregister', label: 'Sales Register' },
      { id: 'purchaseregister', label: 'Purchase Register' },
      { id: 'stock', label: 'Stock Summary' },
      { id: 'aging', label: 'Aging Report' },
      { id: 'expensereport', label: 'Expense Report' },
    ] },
    { section: 'Settings', items: [
      { id: 'general', label: 'General Settings' },
      { id: 'invoice', label: 'Invoice Settings' },
      { id: 'backup', label: 'Backup & Restore' },
    ] },
  ];

  function html() {
    const current = (location.hash || '#dashboard').replace(/^#/, '') || 'dashboard';
    const nav = NAV.map((sec) => {
      const items = sec.items.map((i) => {
        const active = i.id === current ? ' active' : '';
        return `<a class="nav-item${active}" data-route="${i.id}" href="#${i.id}"><span class="icon">${ICONS[i.id] || '•'}</span><span class="label">${i.label}</span></a>`;
      }).join('');
      return `<div class="nav-section">${sec.section}</div>${items}`;
    }).join('');
    return `<div class="logo"><div class="logo-icon">₹</div><span>VyaparBooks</span></div>
      <nav>${nav}</nav>
      <div class="collapse-toggle" id="sidebar-toggle" title="Collapse / Expand sidebar">⟨⟨</div>`;
  }

  function init() {
    const el = document.getElementById('app-sidebar');
    if (!el) return;
    el.innerHTML = html();
    el.querySelectorAll('a.nav-item').forEach((a) => a.addEventListener('click', () => {
      el.querySelectorAll('a.nav-item').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
    }));
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) toggle.addEventListener('click', () => el.classList.toggle('collapsed'));
  }

  root.VB = root.VB || {};
  root.VB.sidebar = { html, init, NAV };
})(typeof window !== 'undefined' ? window : globalThis);
