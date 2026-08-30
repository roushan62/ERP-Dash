'use strict';
VB.report.register({
  route: 'daybook',
  title: 'Day Book',
  subtitle: 'All vouchers in chronological order.',
  columns: [
    { label: 'Date', render: (r) => VB.fmtDate(r.date) },
    { label: 'Type', key: 'voucher_type' },
    { label: 'Voucher #', key: 'voucher_number' },
    { label: 'Party', key: 'party_name' },
    { label: 'Amount', num: true, render: (r) => VB.fmt(r.grand_total) },
    { label: 'Status', render: (r) => r.status === 'Active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-warning">Cancelled</span>' },
  ],
  async load({ from, to }) {
    const rows = await VB.invoke('report', 'dayBook', { from, to });
    const total = rows.reduce((s, r) => s + (r.status === 'Active' ? r.grand_total : 0), 0);
    return { rows, totals: [{ label: 'Total', amount: total }], summary: `Vouchers: ${rows.length} &nbsp; Total: ${VB.fmt(total)}` };
  },
});
