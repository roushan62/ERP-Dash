'use strict';
VB.report.register({
  route: 'ledgerreport',
  title: 'Ledger Report',
  subtitle: 'Ledger account with running balance.',
  filters: 'ledger',
  columns: [
    { label: 'Date', render: (r) => VB.fmtDate(r.date) },
    { label: 'Voucher', key: 'voucher_number' },
    { label: 'Type', key: 'voucher_type' },
    { label: 'Debit', num: true, render: (r) => VB.fmt(r.debit_amount) },
    { label: 'Credit', num: true, render: (r) => VB.fmt(r.credit_amount) },
    { label: 'Balance', num: true, render: (r) => VB.fmt(r.running_balance) + '<span class="text-muted"> ' + r.running_type + '</span>' },
    { label: 'Narration', key: 'narration' },
  ],
  async load({ from, to, filter }) {
    if (!filter) { VB.toast.warning('Select a ledger first.'); return { rows: [] }; }
    const d = await VB.invoke('report', 'ledgerReport', { ledger_id: Number(filter), from, to });
    return {
      rows: d.rows,
      summary: `<strong>${VB.esc(d.ledger.name)}</strong> &nbsp; Opening: ${VB.fmt(d.opening_balance.amount)} ${d.opening_balance.type} &nbsp; Closing: ${VB.fmt(d.closing_balance.amount)} ${d.closing_balance.type}`,
    };
  },
});
