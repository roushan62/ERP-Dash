'use strict';
VB.report.register({
  route: 'receivable',
  title: 'Outstanding Receivable',
  subtitle: 'Pending amounts receivable from customers.',
  columns: [
    { label: 'Customer', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'GSTIN', key: 'gstin' },
    { label: 'Phone', key: 'phone' },
    { label: 'City', key: 'city' },
    { label: 'Balance', num: true, render: (r) => VB.fmt(r.amount) },
  ],
  async load({ to }) {
    const d = await VB.invoke('report', 'outstanding', { type: 'receivable', asOf: to });
    return { rows: d.rows, totals: [{ label: 'Total Receivable', amount: d.total }], summary: `Total Receivable: ${VB.fmt(d.total)}` };
  },
});
