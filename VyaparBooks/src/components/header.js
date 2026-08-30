'use strict';
// Top header bar: company name, FY selector, global search, profile
(function (root) {
  async function init() {
    const el = document.getElementById('app-header');
    if (!el) return;
    let company = { name: 'VyaparBooks' };
    let fy = null;
    try {
      company = (await window.vyapar.invoke('app', 'getCompany')) || company;
      fy = await window.vyapar.invoke('app', 'getActiveFY');
    } catch (e) { /* header should not break */ }
    const years = await window.vyapar.invoke('app', 'listFinancialYears').catch(() => []);
    const options = years.map((y) => `<option value="${y.id}" ${fy && fy.id === y.id ? 'selected' : ''}>FY ${y.fy_name}</option>`).join('');
    el.innerHTML = `
      <div class="flex" style="min-width:0">
        <button class="btn btn-text print-hide" id="menu-toggle" title="Menu">☰</button>
        <div class="company-name">${root.VB.esc(company.name || 'VyaparBooks')}</div>
      </div>
      <div class="global-search print-hide">
        <input id="global-search" type="text" placeholder="Search vouchers, parties, ledgers, items..." autocomplete="off" />
        <div class="search-results" id="global-search-results"></div>
      </div>
      <div class="flex print-hide">
        <label class="text-muted" style="white-space:nowrap">Financial Year:</label>
        <select id="fy-select" style="width:120px">${options || '<option>No FY</option>'}</select>
      </div>
      <div class="flex">
        <div class="avatar" style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600">A</div>
      </div>`;
    const search = document.getElementById('global-search');
    const results = document.getElementById('global-search-results');
    let timer = null;
    if (search) search.addEventListener('input', () => {
      clearTimeout(timer);
      const q = search.value.trim();
      if (q.length < 2) { results.classList.remove('show'); return; }
      timer = setTimeout(async () => {
        try {
          const data = await window.vyapar.invoke('app', 'globalSearch', q);
          let html = '';
          if (data.vouchers.length) html += '<div class="result-group">Vouchers</div>' + data.vouchers.map((v) => `<div class="result-item" data-go="daybook">${v.voucher_number} · ${v.date} · ${root.VB.currency.format(v.grand_total)}</div>`).join('');
          if (data.parties.length) html += '<div class="result-group">Parties</div>' + data.parties.map((p) => `<div class="result-item" data-go="parties">${p.name}</div>`).join('');
          if (data.ledgers.length) html += '<div class="result-group">Ledgers</div>' + data.ledgers.map((l) => `<div class="result-item" data-go="ledgers">${l.name}</div>`).join('');
          if (data.items.length) html += '<div class="result-group">Items</div>' + data.items.map((i) => `<div class="result-item" data-go="items">${i.name}</div>`).join('');
          results.innerHTML = html || '<div class="result-item text-muted">No results</div>';
          results.classList.add('show');
          results.querySelectorAll('.result-item[data-go]').forEach((r) => r.addEventListener('click', () => { location.hash = '#' + r.dataset.go; results.classList.remove('show'); }));
        } catch (e) { /* ignore */ }
      }, 300);
    });
    if (search) search.addEventListener('blur', () => setTimeout(() => results.classList.remove('show'), 200));
    const fySel = document.getElementById('fy-select');
    if (fySel) fySel.addEventListener('change', async () => {
      await window.vyapar.invoke('app', 'setActiveFY', { id: Number(fySel.value) }).catch(() => {});
      window.dispatchEvent(new CustomEvent('fychanged'));
    });
    const menu = document.getElementById('menu-toggle');
    if (menu) menu.addEventListener('click', () => document.getElementById('app-sidebar') && document.getElementById('app-sidebar').classList.toggle('collapsed'));
  }
  root.VB = root.VB || {};
  root.VB.header = { init };
})(typeof window !== 'undefined' ? window : globalThis);
