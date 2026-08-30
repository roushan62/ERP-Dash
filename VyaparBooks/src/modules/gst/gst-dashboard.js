'use strict';
VB.registerPage('gstdashboard', {
  title: 'GST Dashboard',
  render() {
    return `<h1 class="page-title">GST Dashboard</h1>
      <p class="page-subtitle">Output tax, input tax and net GST payable.</p>
      <div class="toolbar">
        <input id="g-from" type="date" value="${VB.today()}"/>
        <input id="g-to" type="date" value="${VB.today()}"/>
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="grid grid-2" style="grid-template-columns:repeat(3,1fr)">
        <div class="card stat-card"><div class="stat-label">Output Tax</div><div class="stat-value text-danger" id="g-out">—</div></div>
        <div class="card stat-card"><div class="stat-label">Input Tax</div><div class="stat-value text-success" id="g-in">—</div></div>
        <div class="card stat-card"><div class="stat-label">Net Payable</div><div class="stat-value text-primary" id="g-net">—</div></div>
      </div>
      <div class="card"><div id="g-table"></div></div>`;
  },
  init(el) {
    const from = el.querySelector('#g-from'), to = el.querySelector('#g-to');
    const fy = VB.financialYear.fyRange(VB.financialYear.fyName());
    from.value = fy.start; to.value = VB.today();
    async function load() {
      const d = await VB.invoke('gst', 'dashboard', { from: from.value, to: to.value });
      el.querySelector('#g-out').textContent = VB.fmt(d.output_tax);
      el.querySelector('#g-in').textContent = VB.fmt(d.input_tax);
      el.querySelector('#g-net').textContent = VB.fmt(d.net_payable);
      VB.table.render(el.querySelector('#g-table'), {
        page: 1, page_size: 10, total: 4,
        columns: [
          { label: 'Description', key: 'name' }, { label: 'Value', num: true, render: (r) => VB.fmt(r.value) },
        ],
        rows: [
          { name: 'Output Taxable Value (Sales)', value: d.output_taxable },
          { name: 'Output Tax', value: d.output_tax },
          { name: 'Input Taxable Value (Purchases)', value: d.input_taxable },
          { name: 'Input Tax', value: d.input_tax },
          { name: 'Sales Vouchers', value: d.sales_count },
          { name: 'Purchase Vouchers', value: d.purchase_count },
        ],
      });
    }
    el.querySelector('#refresh').addEventListener('click', load);
    load();
  },
});
