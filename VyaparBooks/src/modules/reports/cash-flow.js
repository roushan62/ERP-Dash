'use strict';
VB.report.register({
  route: 'cashflow',
  title: 'Cash Flow Statement',
  subtitle: 'Operating, investing and financing cash movements.',
  columns: [
    { label: 'Category', key: 'name' },
    { label: 'Amount', num: true, render: (r) => VB.fmt(r.amount) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('report', 'cashFlow', { from, to });
    const rows = [
      { name: 'Opening Cash & Bank', amount: d.opening },
      { name: 'Operating Activities', amount: d.categories.Operating },
      { name: 'Investing Activities', amount: d.categories.Investing },
      { name: 'Financing Activities', amount: d.categories.Financing },
      { name: 'Net Change', amount: d.categories.NetChange },
      { name: 'Closing Cash & Bank', amount: d.closing },
    ];
    return { rows, totals: [{ label: 'Net Change', amount: d.categories.NetChange }, { label: 'Closing Balance', amount: d.closing }], summary: `Opening: ${VB.fmt(d.opening)} &nbsp; Closing: ${VB.fmt(d.closing)}` };
  },
});
