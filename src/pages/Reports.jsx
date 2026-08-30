import React, { useMemo } from 'react'
import { db, useDbVersion } from '../lib/db.js'
import { PageHeader, Card, Badge } from '../components/ui.jsx'
import { inr, lastNMonths, CHART_COLORS, exportCSV, today } from '../lib/utils.js'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, TrendingUp, Wallet, Target, Truck } from 'lucide-react'

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,.08)' }

export default function Reports() {
  useDbVersion()
  const projects = db.list('projects')
  const invoices = db.list('invoices')
  const expenses = db.list('expenses')
  const leads = db.list('leads')
  const pos = db.list('purchaseOrders')
  const payments = db.list('payments')

  const monthly = useMemo(() => lastNMonths(8).map(({ y, m, label }) => {
    const rev = invoices.filter((i) => { const d = new Date(i.date); return d.getFullYear() === y && d.getMonth() === m && i.status !== 'Draft' }).reduce((s, i) => s + (i.amount || 0), 0)
    const exp = expenses.filter((e) => { const d = new Date(e.date); return d.getFullYear() === y && d.getMonth() === m }).reduce((s, e) => s + (e.amount || 0), 0)
    return { name: label, Revenue: Math.round(rev / 1e5) / 10, Expense: Math.round(exp / 1e5) / 10, Profit: Math.round((rev - exp) / 1e5) / 10 }
  }), [invoices, expenses])

  const expenseByCat = useMemo(() => {
    const map = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + (e.amount || 0) })
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value / 1e5) / 10 })).sort((a, b) => b.value - a.value)
  }, [expenses])

  const budgetVsActual = useMemo(() => {
    const heads = {}
    db.list('budgetHeads').forEach((b) => {
      heads[b.head] = heads[b.head] || { name: b.head, Estimated: 0, Actual: 0 }
      heads[b.head].Estimated += (b.estimated || 0) / 1e5
      heads[b.head].Actual += (b.actual || 0) / 1e5
    })
    return Object.values(heads).map((h) => ({ ...h, Estimated: Math.round(h.Estimated) / 10, Actual: Math.round(h.Actual * 10) / 10 })).sort((a, b) => b.Estimated - a.Estimated)
  }, [])

  const leadSources = useMemo(() => {
    const map = {}
    leads.forEach((l) => { map[l.source] = (map[l.source] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [leads])

  const vendorSpend = useMemo(() => {
    const map = {}
    pos.forEach((p) => {
      const v = db.find('vendors', p.vendorId)?.name || '—'
      map[v] = (map[v] || 0) + (p.value || 0)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [pos])

  const received = payments.filter((p) => p.direction === 'Received').reduce((s, p) => s + (p.amount || 0), 0)
  const paid = payments.filter((p) => p.direction === 'Made').reduce((s, p) => s + (p.amount || 0), 0)

  return (
    <div>
      <PageHeader title="Reports & Analytics" desc="Business intelligence across projects, money, materials and sales." />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Received</div><div className="mt-1 text-xl font-bold text-emerald-600">{inr(received)}</div></Card>
        <Card className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total Paid Out</div><div className="mt-1 text-xl font-bold text-rose-600">{inr(paid)}</div></Card>
        <Card className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Billed (all time)</div><div className="mt-1 text-xl font-bold">{inr(invoices.reduce((s, i) => s + (i.amount || 0), 0))}</div></Card>
        <Card className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Expenses (all time)</div><div className="mt-1 text-xl font-bold">{inr(expenses.reduce((s, e) => s + (e.amount || 0), 0))}</div></Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Monthly P&L Trend <span className="text-xs font-normal text-slate-400">(₹ L)</span></h3>
            <Badge tone="indigo"><TrendingUp size={11} className="mr-1" />8 months</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => '₹' + v + ' L'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Expense" fill="#fdba74" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Budget vs Actual by Cost Head <span className="text-xs font-normal text-slate-400">(₹ L)</span></h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetVsActual} layout="vertical" margin={{ top: 4, right: 12, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => '₹' + v + ' L'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Estimated" fill="#c7d2fe" radius={[0, 4, 4, 0]} maxBarSize={12} />
                <Bar dataKey="Actual" fill="var(--brand)" radius={[0, 4, 4, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Expense Mix by Category <span className="text-xs font-normal text-slate-400">(₹ L)</span></h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2} strokeWidth={0}>
                  {expenseByCat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => '₹' + v + ' L'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Top Vendor Commitments</h3>
          <div className="space-y-3">
            {vendorSpend.map((v, i) => {
              const max = vendorSpend[0]?.value || 1
              return (
                <div key={v.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-2 font-medium text-slate-700">{i + 1}. {v.name}</span>
                    <span className="font-semibold text-slate-500">{inr(v.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${(v.value / max) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><Target size={16} className="text-brand-600" /> Lead Sources</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadSources} dataKey="value" nameKey="name" outerRadius={85} strokeWidth={0} label={{ fontSize: 11 }}>
                  {leadSources.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Project-wise Budget Snapshot</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400"><th className="py-2">Project</th><th className="py-2">Budget</th><th className="py-2">Spent</th><th className="py-2">Util %</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {projects.map((p) => {
                  const u = p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0
                  return (
                    <tr key={p.id}>
                      <td className="py-2 pr-2 font-medium text-slate-700"><div className="max-w-[220px] truncate">{p.name}</div></td>
                      <td className="py-2">{inr(p.budget)}</td>
                      <td className="py-2">{inr(p.spent)}</td>
                      <td className="py-2"><span className={u > 95 ? 'font-bold text-rose-600' : u > 80 ? 'font-bold text-amber-600' : 'text-slate-600'}>{u}%</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
            onClick={() => exportCSV(`project-budget-report-${today()}.csv`, [{ label: 'Project', key: 'name' }, { label: 'Budget', key: 'budget' }, { label: 'Spent', key: 'spent' }, { label: 'Status', key: 'status' }], projects)}
          ><Download size={13} /> Export project budget report</button>
        </Card>
      </div>
    </div>
  )
}
