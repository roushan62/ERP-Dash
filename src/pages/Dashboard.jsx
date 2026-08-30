import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, useDbVersion, userCan, currentUser } from '../lib/db.js'
import { MODULES, moduleById } from '../lib/modules.js'
import { visibleModules } from '../lib/db.js'
import { useApp } from '../store/AppContext.jsx'
import { Card, StatCard, PageHeader, Badge, Progress } from '../components/ui.jsx'
import { inr, today, daysAhead, lastNMonths, CHART_COLORS } from '../lib/utils.js'
import { Building2, IndianRupee, Clock, AlertTriangle, Users, Package, TrendingUp, ArrowUpRight, Plus, ClipboardList, CalendarCheck, ReceiptIndianRupee, ShoppingCart } from 'lucide-react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'

const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,.08)' }

export default function Dashboard() {
  useDbVersion()
  const navigate = useNavigate()
  const { user } = useApp()
  const projects = db.list('projects')
  const invoices = db.list('invoices')
  const expenses = db.list('expenses')
  const leads = db.list('leads')
  const tasks = db.list('tasks')
  const materials = db.list('materials')
  const audit = db.list('audit')
  const mrs = db.list('materialRequests')
  const thisMonth = today().slice(0, 7)

  const active = projects.filter((p) => p.status === 'Ongoing')
  const revenue = invoices.filter((i) => i.date.slice(0, 7) === thisMonth && i.status !== 'Draft').reduce((s, i) => s + (i.amount || 0), 0)
  const outstanding = invoices.filter((i) => !['Paid', 'Draft'].includes(i.status)).reduce((s, i) => s + (i.amount || 0), 0)
  const pendingApprovals = mrs.filter((r) => r.status === 'Pending Approval').length + db.list('leaves').filter((l) => l.status === 'Pending').length + db.list('expenses').filter((e) => e.status === 'Pending').length
  const lowStock = materials.filter((m) => (m.currentStock || 0) <= (m.minStock || 0))

  const revExp = useMemo(() => lastNMonths(8).map(({ y, m, label }) => {
    const rev = invoices.filter((i) => { const d = new Date(i.date); return d.getFullYear() === y && d.getMonth() === m && i.status !== 'Draft' }).reduce((s, i) => s + (i.amount || 0), 0)
    const exp = expenses.filter((e) => { const d = new Date(e.date); return d.getFullYear() === y && d.getMonth() === m }).reduce((s, e) => s + (e.amount || 0), 0)
    return { name: label, Revenue: Math.round(rev / 1e5) / 10, Expense: Math.round(exp / 1e5) / 10 }
  }), [invoices, expenses])

  const projectStatus = useMemo(() => ['Ongoing', 'Planning', 'On Hold', 'Completed'].map((s) => ({ name: s, value: projects.filter((p) => p.status === s).length })).filter((x) => x.value), [projects])

  const funnel = useMemo(() => {
    const stages = ['New', 'Contacted', 'Qualified', 'Site Visit', 'Proposal Sent', 'Won']
    return stages.map((s) => ({ stage: s, count: leads.filter((l) => l.status === s).length }))
  }, [leads])

  const topProjects = [...projects].filter((p) => p.status !== 'Completed').sort((a, b) => (b.budget || 0) - (a.budget || 0)).slice(0, 5)

  const upcomingTasks = tasks.filter((t) => t.status !== 'Completed' && t.dueDate && t.dueDate <= daysAhead(10)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6)

  const allowed = visibleModules(MODULES)
  const quick = ['leads', 'materialRequests', 'dailyLogs', 'invoices', 'expenses', 'tasks'].filter((id) => userCan(id, 'create') && allowed.some((m) => m.id === id)).map((id) => moduleById(id))

  return (
    <div>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user?.name?.split(' ')[0]} 👋`}
        desc="Here's the pulse of your fitout & construction business today."
      />

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Building2} label="Active Projects" value={active.length} sub={inr(active.reduce((s, p) => s + (p.budget || 0), 0)) + ' WIP'} tone="indigo" onClick={() => userCan('projects', 'view') && navigate('/projects')} />
        <StatCard icon={IndianRupee} label="Revenue (MTD)" value={inr(revenue)} sub="Invoices raised" tone="green" onClick={() => userCan('invoices', 'view') && navigate('/finance/invoices')} />
        <StatCard icon={Clock} label="Receivables" value={inr(outstanding)} sub="Unpaid invoices" tone="amber" onClick={() => userCan('invoices', 'view') && navigate('/finance/invoices')} />
        <StatCard icon={ClipboardList} label="Pending Approvals" value={pendingApprovals} sub="MRs, leaves, expenses" tone="red" />
        <StatCard icon={Package} label="Low Stock Items" value={lowStock.length} sub="Below min level" tone="violet" onClick={() => userCan('materials', 'view') && navigate('/inventory/materials')} />
        <StatCard icon={Users} label="Team Size" value={db.list('employees').filter((e) => e.status === 'Active').length} sub="Active employees" tone="blue" onClick={() => userCan('employees', 'view') && navigate('/hr/employees')} />
      </div>

      {/* Charts row */}
      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Revenue vs Expense <span className="text-xs font-normal text-slate-400">(₹ Lakhs, last 8 months)</span></h3>
            <Badge tone="green">Live</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revExp} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => '₹' + v + ' L'} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Revenue" fill="var(--brand)" radius={[5, 5, 0, 0]} maxBarSize={26} />
                <Bar dataKey="Expense" fill="#fdba74" radius={[5, 5, 0, 0]} maxBarSize={26} />
                <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Project Portfolio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {projectStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Lists row */}
      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-800">Top Active Projects</h3>
          <div className="space-y-3.5">
            {topProjects.map((p) => (
              <button key={p.id} onClick={() => navigate(`/projects/view/${p.id}`)} className="group block w-full text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 font-medium text-slate-700 group-hover:text-brand-600">{p.name}</span>
                  <span className="shrink-0 font-semibold text-slate-500">{inr(p.budget)}</span>
                </div>
                <div className="mt-1.5"><Progress value={p.progress} /></div>
              </button>
            ))}
            {!topProjects.length && <p className="text-sm text-slate-400">No active projects.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-800">Deadlines Ahead <span className="text-xs font-normal text-slate-400">(next 10 days)</span></h3>
          <div className="space-y-2">
            {upcomingTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2">
                <div className={`h-8 w-1 rounded-full ${t.priority === 'Critical' ? 'bg-rose-500' : t.priority === 'High' ? 'bg-amber-500' : 'bg-sky-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-700">{t.title}</div>
                  <div className="text-[11px] text-slate-400">{db.find('projects', t.projectId)?.code} · {t.assignedTo}</div>
                </div>
                <Badge tone={t.dueDate < today() ? 'red' : 'amber'}>{t.dueDate < today() ? 'Overdue' : t.dueDate}</Badge>
              </div>
            ))}
            {!upcomingTasks.length && <p className="text-sm text-slate-400">Nothing due — clear runway ✈️</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-800">Live Activity</h3>
          <div className="space-y-2.5">
            {audit.slice(0, 7).map((a) => (
              <div key={a.id} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.action === 'Delete' ? 'bg-rose-500' : a.action === 'Create' ? 'bg-emerald-500' : a.action === 'Login' || a.action === 'Logout' ? 'bg-sky-500' : 'bg-amber-500'}`} />
                <p className="text-slate-600"><b className="text-slate-800">{a.user}</b> · {a.action} · {a.module}{a.title ? <span className="text-slate-400"> — {a.title}</span> : ''}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Leads funnel + quick actions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-800">Sales Pipeline</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnel} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="fun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" name="Leads" stroke="var(--brand)" strokeWidth={2.5} fill="url(#fun)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-800">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {quick.map((m) => (
              <button key={m.id} onClick={() => navigate(m.path)} className="flex flex-col items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-left transition hover:border-brand-200 hover:bg-brand-50/40">
                <m.icon size={18} className="text-brand-600" />
                <span className="text-xs font-semibold text-slate-700">{m.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">This Month Collections</div>
            <div className="mt-1 text-2xl font-bold">{inr(db.list('payments').filter((p) => p.direction === 'Received' && p.date.slice(0, 7) === thisMonth).reduce((s, p) => s + (p.amount || 0), 0))}</div>
            <button onClick={() => userCan('payments', 'view') && navigate('/finance/payments')} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200">View payments <ArrowUpRight size={13} /></button>
          </div>
        </Card>
      </div>
    </div>
  )
}
