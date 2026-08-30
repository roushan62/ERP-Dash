'use strict';
VB.report.register({
  route: 'gstr1',
  title: 'GSTR-1',
  subtitle: 'Outward supplies (B2B, B2C and HSN summary).',
  columns: [
    { label: 'Type', render: (r) => r.b2b ? '<span class="badge badge-primary">B2B</span>' : '<span class="badge badge-success">B2C</span>' },
    { label: 'Invoice #', key: 'voucher_number' },
    { label: 'Date', render: (r) => VB.fmtDate(r.date) },
    { label: 'Party', key: 'party_name' },
    { label: 'GSTIN', key: 'gstin' },
    { label: 'Taxable', num: true, render: (r) => VB.fmt(r.taxable_amount) },
    { label: 'CGST', num: true, render: (r) => VB.fmt(r.cgst_amount) },
    { label: 'SGST', num: true, render: (r) => VB.fmt(r.sgst_amount) },
    { label: 'IGST', num: true, render: (r) => VB.fmt(r.igst_amount) },
    { label: 'Total', num: true, render: (r) => VB.fmt(r.grand_total) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('gst', 'gstr1', { from, to });
    const b2bRows = d.b2b.map((r) => ({ ...r, b2b: true }));
    const b2cRows = d.b2c.map((r) => ({ ...r, b2b: false, gstin: '' }));
    const rows = [...b2bRows, ...b2cRows];
    const taxable = rows.reduce((s, r) => s + r.taxable_amount, 0);
    const tax = rows.reduce((s, r) => s + r.cgst_amount + r.sgst_amount + r.igst_amount, 0);
    const hsnSummary = d.hsn.map((h) => ({ name: `HSN ${h.hsn || '—'} (${h.gst_rate}%)`, value: h.taxable }));
    return { rows, totals: [{ label: 'Total Taxable', amount: taxable }, { label: 'Total Tax', amount: tax }], summary: `B2B: ${d.b2b.length} &nbsp; B2C: ${d.b2c.length} &nbsp; HSN lines: ${d.hsn.length} &nbsp; Taxable: ${VB.fmt(taxable)}` };
  },
});
