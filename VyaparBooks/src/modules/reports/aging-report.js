'use strict';
VB.report.register({
  route: 'aging',
  title: 'Aging Report',
  subtitle: 'Receivables bucketed by age (0-30, 31-60, 61-90, 90+ days).',
  columns: [
    { label: 'Customer', key: 'name' },
    { label: 'Last Invoice', render: (r) => VB.fmtDate(r.from_date) },
    { label: 'Days', num: true, render: (r) => r.days },
    { label: '0-30', num: true, render: (r) => r.bucket === '0-30' ? VB.fmt(r.amount) : '' },
    { label: '31-60', num: true, render: (r) => r.bucket === '31-60' ? VB.fmt(r.amount) : '' },
    { label: '61-90', num: true, render: (r) => r.bucket === '61-90' ? VB.fmt(r.amount) : '' },
    { label: '90+', num: true, render: (r) => r.bucket === '90+' ? VB.fmt(r.amount) : '' },
    { label: 'Total', num: true, render: (r) => VB.fmt(r.amount) },
  ],
  async load({ to }) {
    const d = await VB.invoke('report', 'agingReport', { asOf: to });
    const rows = [];
    for (const k of Object.keys(d.buckets)) d.buckets[k].forEach((r) => rows.push({ ...r, bucket: k }));
    const summary = Object.keys(d.buckets).map((k) => `${k}: ${VB.fmt(d.totals[k])}`).join(' &nbsp; ') + ` &nbsp; <strong>Total: ${VB.fmt(d.total)}</strong>`;
    return { rows, totals: Object.keys(d.buckets).map((k) => ({ label: k + ' days', amount: d.totals[k] })), summary };
  },
});
