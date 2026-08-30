'use strict';
VB.report.register({
  route: 'pnl',
  title: 'Profit & Loss',
  subtitle: 'Trading and P&L account for the selected period.',
  columns: [
    { label: 'Particulars', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'Group', key: 'group_name' },
    { label: 'Nature', key: 'nature' },
    { label: 'Amount', num: true, render: (r) => VB.fmt(r.balance) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('report', 'profitLoss', { from, to });
    const rows = [...d.income.map((r) => ({ ...r, nature: 'Income' })), ...d.expense.map((r) => ({ ...r, nature: 'Expense' }))];
    const summary = `Sales: ${VB.fmt(d.sales)} &nbsp; Direct Expenses: ${VB.fmt(d.purchasing)} &nbsp; Gross Profit: ${VB.fmt(d.gross_profit)} &nbsp; Indirect Income: ${VB.fmt(d.indirect_income)} &nbsp; Indirect Expense: ${VB.fmt(d.indirect_expense)} &nbsp; <strong>Net Profit: ${VB.fmt(d.net_profit)}</strong>`;
    return { rows, summary, totals: [{ label: 'Gross Profit', amount: d.gross_profit }, { label: 'Net Profit', amount: d.net_profit }] };
  },
});
