'use strict';
VB.report.register({
  route: 'trial',
  title: 'Trial Balance',
  subtitle: "Every ledger's debit/credit balance including opening balances.",
  columns: [
    { label: 'Ledger', key: 'name' },
    { label: 'Group', key: 'group_name' },
    { label: 'Nature', key: 'nature' },
    { label: 'Debit', num: true, render: (r) => VB.fmt(r.debit) },
    { label: 'Credit', num: true, render: (r) => VB.fmt(r.credit) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('report', 'trialBalance', { from, to });
    return {
      rows: d.rows,
      totals: [{ label: 'Total', amount: d.debit_total }, { label: 'Total Credit', amount: d.credit_total }],
      summary: `Debit Total: ${VB.fmt(d.debit_total)} &nbsp; Credit Total: ${VB.fmt(d.credit_total)} &nbsp; ${d.balanced ? '<span class="badge badge-success">Balanced</span>' : '<span class="badge badge-danger">Not Balanced</span>'}`,
    };
  },
});
