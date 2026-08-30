'use strict';
VB.report.register({
  route: 'balancesheet',
  title: 'Balance Sheet',
  subtitle: 'Liabilities and Assets as at the selected date.',
  columns: [
    { label: 'Head', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'Debit', num: true, render: (r) => VB.fmt(r.debit) },
    { label: 'Credit', num: true, render: (r) => VB.fmt(r.credit) },
  ],
  async load({ to }) {
    const d = await VB.invoke('report', 'balanceSheet', { asOf: to });
    const side = (rows) => rows.map((r) => ({ name: r.name, debit: r.debit, credit: r.credit }));
    const rows = [
      { name: '━━ LIABILITIES ━━', debit: '', credit: '', header: true },
      ...side(d.liabilities),
      { name: '━━ ASSETS ━━', debit: '', credit: '', header: true },
      ...side(d.assets),
    ];
    const summary = `Liabilities Total: ${VB.fmt(d.liabilities_total)} &nbsp; Assets Total: ${VB.fmt(d.assets_total)} &nbsp; ${d.balanced ? '<span class="badge badge-success">Balanced</span>' : '<span class="badge badge-danger">Not Balanced</span>'}`;
    return { rows, summary, totals: [{ label: 'Liabilities', amount: d.liabilities_total }, { label: 'Assets', amount: d.assets_total }] };
  },
});
