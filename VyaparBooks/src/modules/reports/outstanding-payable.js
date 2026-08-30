'use strict';
VB.report.register({
  route: 'payable',
  title: 'Outstanding Payable',
  subtitle: 'Pending amounts payable to vendors.',
  columns: [
    { label: 'Vendor', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'GSTIN', key: 'gstin' },
    { label: 'Phone', key: 'phone' },
    { label: 'City', key: 'city' },
    { label: 'Balance', num: true, render: (r) => VB.fmt(r.amount) },
  ],
  async load({ to }) {
    const d = await VB.invoke('report', 'outstanding', { type: 'payable', asOf: to });
    return { rows: d.rows, totals: [{ label: 'Total Payable', amount: d.total }], summary: `Total Payable: ${VB.fmt(d.total)}` };
  },
});
