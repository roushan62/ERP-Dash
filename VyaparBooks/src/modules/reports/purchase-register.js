'use strict';
VB.report.register({
  route: 'purchaseregister',
  title: 'Purchase Register',
  subtitle: 'All active purchase invoices for the period.',
  columns: [
    { label: 'Date', render: (r) => VB.fmtDate(r.date) },
    { label: 'Invoice #', key: 'voucher_number' },
    { label: 'Vendor', key: 'party_name' },
    { label: 'Taxable', num: true, render: (r) => VB.fmt(r.taxable_amount) },
    { label: 'CGST', num: true, render: (r) => VB.fmt(r.cgst_amount) },
    { label: 'SGST', num: true, render: (r) => VB.fmt(r.sgst_amount) },
    { label: 'IGST', num: true, render: (r) => VB.fmt(r.igst_amount) },
    { label: 'Total Tax', num: true, render: (r) => VB.fmt(r.total_tax) },
    { label: 'Grand Total', num: true, render: (r) => VB.fmt(r.grand_total) },
  ],
  async load({ from, to }) {
    const rows = await VB.invoke('report', 'purchaseRegister', { from, to });
    const active = rows.filter((r) => r.status === 'Active');
    const total = active.reduce((s, r) => s + r.grand_total, 0);
    const taxable = active.reduce((s, r) => s + r.taxable_amount, 0);
    const tax = active.reduce((s, r) => s + r.total_tax, 0);
    return { rows: active, totals: [{ label: 'Total Taxable', amount: taxable }, { label: 'Total Tax', amount: tax }, { label: 'Grand Total', amount: total }], summary: `Invoices: ${active.length} &nbsp; Taxable: ${VB.fmt(taxable)} &nbsp; Tax: ${VB.fmt(tax)} &nbsp; Total: ${VB.fmt(total)}` };
  },
});
