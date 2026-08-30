'use strict';
VB.report.register({
  route: 'stock',
  title: 'Stock Summary',
  subtitle: 'Current stock levels and valuation.',
  columns: [
    { label: 'Item', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'HSN/SAC', key: 'hsn_sac_code' },
    { label: 'Unit', key: 'unit' },
    { label: 'Stock', num: true, render: (r) => VB.fmtR(r.current_stock) },
    { label: 'Sale Price', num: true, render: (r) => VB.fmt(r.sale_price) },
    { label: 'Stock Value', num: true, render: (r) => VB.fmt(r.value) },
  ],
  async load() {
    const rows = await VB.invoke('report', 'stockSummary');
    const total = rows.reduce((s, r) => s + r.value, 0);
    return { rows, totals: [{ label: 'Total Stock Value', amount: total }], summary: `Items: ${rows.length} &nbsp; Stock Value: ${VB.fmt(total)}` };
  },
});
