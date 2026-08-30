'use strict';
VB.report.register({
  route: 'gstledger',
  title: 'GST Ledger',
  subtitle: 'Input and output GST balances by head.',
  columns: [
    { label: 'Ledger', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'Debit', num: true, render: (r) => VB.fmt(r.debit) },
    { label: 'Credit', num: true, render: (r) => VB.fmt(r.credit) },
    { label: 'Balance', num: true, render: (r) => VB.fmt(r.balance) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('gst', 'ledger', { from, to });
    const totalDebit = d.rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = d.rows.reduce((s, r) => s + r.credit, 0);
    return { rows: d.rows, totals: [{ label: 'Debit', amount: totalDebit }, { label: 'Credit', amount: totalCredit }], summary: `Debit: ${VB.fmt(totalDebit)} &nbsp; Credit: ${VB.fmt(totalCredit)}` };
  },
});
