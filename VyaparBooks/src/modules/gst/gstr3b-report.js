'use strict';
VB.report.register({
  route: 'gstr3b',
  title: 'GSTR-3B',
  subtitle: 'Summary of output tax, input tax and net payable.',
  columns: [
    { label: 'Section', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
    { label: 'Taxable Value', num: true, render: (r) => VB.fmt(r.taxable) },
    { label: 'CGST', num: true, render: (r) => VB.fmt(r.cgst) },
    { label: 'SGST', num: true, render: (r) => VB.fmt(r.sgst) },
    { label: 'IGST', num: true, render: (r) => VB.fmt(r.igst) },
    { label: 'Total Tax', num: true, render: (r) => VB.fmt(r.tax) },
  ],
  async load({ from, to }) {
    const d = await VB.invoke('gst', 'gstr3b', { from, to });
    const rows = [
      { name: '3.1(a) Outward taxable supplies', taxable: d.printable.output_taxable, cgst: d.printable.output_cgst || 0, sgst: d.printable.output_sgst || 0, igst: d.printable.output_igst || 0, tax: d.printable.output_tax },
      { name: '4(a) Eligible ITC', taxable: d.printable.input_taxable, cgst: d.printable.input_cgst || 0, sgst: d.printable.input_sgst || 0, igst: d.printable.input_igst || 0, tax: d.printable.input_tax },
      { name: 'Net Tax Payable', taxable: d.printable.output_taxable - d.printable.input_taxable, cgst: 0, sgst: 0, igst: 0, tax: d.printable.net_payable },
    ];
    const outTax = d.printable.output_tax, inTax = d.printable.input_tax;
    return { rows, totals: [{ label: 'Net Payable', amount: d.printable.net_payable }], summary: `Output Tax: ${VB.fmt(outTax)} &nbsp; Input Tax: ${VB.fmt(inTax)} &nbsp; Net Payable: ${VB.fmt(d.printable.net_payable)}` };
  },
});
