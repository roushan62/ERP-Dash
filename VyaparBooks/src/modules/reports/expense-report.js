'use strict';
VB.report.register({
  route: 'expensereport',
  title: 'Expense Report',
  subtitle: 'All expense entries in the period.',
  columns: [
    { label: 'Date', render: (r) => VB.fmtDate(r.date) },
    { label: 'Voucher #', key: 'voucher_number' },
    { label: 'Ledger / Account', key: 'party_name' },
    { label: 'Taxable', num: true, render: (r) => VB.fmt(r.taxable_amount) },
    { label: 'Total Tax', num: true, render: (r) => VB.fmt(r.total_tax) },
    { label: 'Grand Total', num: true, render: (r) => VB.fmt(r.grand_total) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('report', 'expenseReport', { from, to });
    return { rows: d.rows, totals: [{ label: 'Total Expense', amount: d.total }], summary: `Expenses: ${d.rows.length} &nbsp; Total: ${VB.fmt(d.total)}` };
  },
});
