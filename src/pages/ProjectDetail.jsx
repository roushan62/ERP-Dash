import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db, useDbVersion, userCan } from '../lib/db.js'
import { Card, Badge, Progress, EmptyState, Button } from '../components/ui.jsx'
import { Tabs } from '../components/ui.jsx'
import ResourcePage from '../components/ResourcePage.jsx'
import { inr, fmtDate, today } from '../lib/utils.js'
import { ArrowLeft, MapPin, User, CalendarRange, IndianRupee, Layers } from 'lucide-react'
import { BUDGET_HEADS } from './modules/design.jsx'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  useDbVersion()
  const [tab, setTab] = useState('overview')
  const p = db.find('projects', id)

  if (!p) return <EmptyState title="Project not found" message="It may have been deleted." action={<Link to="/projects"><Button>Back to Projects</Button></Link>} />

  const client = db.list('clients').find((c) => c.name === p.client)
  const budget = db.list('budgetHeads').filter((b) => b.projectId === id)
  const tasks = db.list('tasks').filter((t) => t.projectId === id)
  const logs = db.list('dailyLogs').filter((l) => l.projectId === id)
  const invs = db.list('invoices').filter((i) => i.projectId === id)
  const drawings = db.list('drawings').filter((d) => d.projectId === id)
  const overdue = tasks.filter((t) => t.status !== 'Completed' && t.dueDate && t.dueDate < today()).length
  const billed = invs.reduce((s, i) => s + (i.amount || 0), 0)
  const est = budget.reduce((s, b) => s + (b.estimated || 0), 0)
  const act = budget.reduce((s, b) => s + (b.actual || 0), 0)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: `Tasks (${tasks.length})` },
    { id: 'budget', label: 'Budget Heads' },
    { id: 'logs', label: 'Daily Reports' },
    { id: 'drawings', label: `Drawings (${drawings.length})` },
    { id: 'billing', label: 'Billing' },
  ]

  return (
    <div>
      <button onClick={() => navigate('/projects')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600"><ArrowLeft size={15} /> All Projects</button>

      <Card className="mb-5 p-5 anim-fadeUp">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{p.name}</h1>
              <Badge>{p.status}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="font-mono text-xs font-semibold text-brand-700">{p.code}</span>
              <span className="flex items-center gap-1"><User size={13} /> {p.client}</span>
              <span className="flex items-center gap-1"><MapPin size={13} /> {p.location}</span>
              <span className="flex items-center gap-1"><CalendarRange size={13} /> {fmtDate(p.startDate)} → {fmtDate(p.endDate)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Overall Progress</div>
            <div className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{p.progress}%</div>
            <div className="text-xs text-slate-400">PM: {p.manager}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <MiniStat icon={IndianRupee} label="Budget" value={inr(p.budget)} sub={`Spent ${inr(p.spent)} (${p.budget ? Math.round(((p.spent || 0) / p.budget) * 100) : 0}%)`} warn={(p.spent || 0) > (p.budget || 1) * 0.9} />
          <MiniStat icon={Layers} label="BOQ Cost" value={inr(est)} sub={`Actual ${inr(act)}`} warn={act > est && est > 0} />
          <MiniStat icon={IndianRupee} label="Billed" value={inr(billed)} sub={`${invs.length} invoices`} />
          <MiniStat icon={CalendarRange} label="Open Tasks" value={tasks.filter((t) => t.status !== 'Completed').length} sub={overdue ? `${overdue} overdue ⚠` : 'on track'} warn={overdue > 0} />
        </div>
      </Card>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">Budget Heads</h3>
            {budget.length ? budget.map((b) => {
              const u = b.estimated ? Math.round(((b.actual || 0) / b.estimated) * 100) : 0
              return (
                <div key={b.id} className="mb-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{b.head}</span>
                    <span className="text-slate-500">{inr(b.actual)} / {inr(b.estimated)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${u > 100 ? 'bg-rose-500' : u > 85 ? 'bg-amber-500' : ''}`} style={{ width: `${Math.min(100, u)}%`, ...(u <= 85 ? { background: 'var(--brand)' } : {}) }} />
                  </div>
                </div>
              )
            }) : <p className="text-sm text-slate-400">No budget heads yet — add them from the Budget tab.</p>}
          </Card>
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-800">Recent Site Activity</h3>
            <div className="space-y-3">
              {logs.slice(0, 5).map((l) => (
                <div key={l.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-600">{fmtDate(l.date)}</span>
                    <span>{l.manpower} workers · {l.weather}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{l.workSummary}</p>
                  {l.hindrance && <p className="mt-1 text-xs text-rose-600">⚠ {l.hindrance}</p>}
                </div>
              ))}
              {!logs.length && <p className="text-sm text-slate-400">No daily reports yet.</p>}
            </div>
          </Card>
        </div>
      )}

      {tab === 'tasks' && userCan('tasks', 'view') && (
        <ResourcePage embedded config={{
          module: 'tasks', collection: 'tasks', title: 'Tasks', singular: 'Task', statusField: 'status',
          fixed: { projectId: id },
          approve: { from: [], to: 'Completed' },
          columns: [
            { key: 'title', label: 'Task' },
            { key: 'assignedTo', label: 'Assignee' },
            { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'High' ? 'amber' : 'slate'}>{r.priority}</Badge> },
            { key: 'dueDate', label: 'Due' },
            { key: 'progress', label: 'Progress', render: (r) => <Progress value={r.progress} /> },
            { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          ],
          fields: [
            { key: 'title', label: 'Task Title', required: true, full: true },
            { key: 'assignedTo', label: 'Assigned To', type: 'select', optionsFn: () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name) },
            { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'progress', label: 'Progress %', type: 'number' },
            { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Blocked'] },
            { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
          ],
        }} />
      )}

      {tab === 'budget' && userCan('budgetHeads', 'view') && (
        <ResourcePage embedded config={{
          module: 'budgetHeads', collection: 'budgetHeads', title: 'Budget', singular: 'Budget Head',
          fixed: { projectId: id },
          columns: [
            { key: 'head', label: 'Cost Head' },
            { key: 'estimated', label: 'Estimated', render: (r) => <span className="font-semibold">{inr(r.estimated)}</span> },
            { key: 'actual', label: 'Actual', render: (r) => inr(r.actual) },
            { key: 'remarks', label: 'Remarks', render: (r) => <div className="max-w-[260px] truncate text-slate-400">{r.remarks || '—'}</div>, sortable: false },
          ],
          fields: [
            { key: 'head', label: 'Cost Head', type: 'select', options: BUDGET_HEADS, required: true },
            { key: 'estimated', label: 'Estimated Cost', type: 'money', required: true },
            { key: 'actual', label: 'Actual Cost', type: 'money' },
            { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
          ],
        }} />
      )}

      {tab === 'logs' && userCan('dailyLogs', 'view') && (
        <ResourcePage embedded config={{
          module: 'dailyLogs', collection: 'dailyLogs', title: 'Daily Reports', singular: 'Daily Report', statusField: 'status',
          fixed: { projectId: id },
          approve: { from: ['Submitted'], to: 'Approved' },
          columns: [
            { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
            { key: 'weather', label: 'Weather' },
            { key: 'manpower', label: 'Manpower' },
            { key: 'workSummary', label: 'Work Done', render: (r) => <div className="max-w-[320px] truncate" title={r.workSummary}>{r.workSummary}</div>, sortable: false },
            { key: 'hindrance', label: 'Hindrance', render: (r) => r.hindrance ? <span className="text-rose-600">⚠</span> : '—', sortable: false },
            { key: 'reportedBy', label: 'By' },
            { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          ],
          fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'weather', label: 'Weather', type: 'select', options: ['Sunny', 'Cloudy', 'Rainy'] },
            { key: 'manpower', label: 'Manpower Count', type: 'number', required: true },
            { key: 'reportedBy', label: 'Reported By', type: 'select', optionsFn: () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name) },
            { key: 'status', label: 'Status', type: 'select', options: ['Submitted', 'Approved', 'Needs Attention'] },
            { key: 'workSummary', label: 'Work Done Today', type: 'textarea', required: true, full: true },
            { key: 'hindrance', label: 'Hindrances', type: 'textarea', full: true, rows: 2 },
          ],
        }} />
      )}

      {tab === 'drawings' && userCan('drawings', 'view') && (
        <ResourcePage embedded config={{
          module: 'drawings', collection: 'drawings', title: 'Drawings', singular: 'Drawing', statusField: 'status',
          fixed: { projectId: id },
          approve: { from: ['In Review'], to: 'Approved' },
          columns: [
            { key: 'number', label: 'Number', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.number}</span> },
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type' },
            { key: 'revision', label: 'Rev', render: (r) => <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold">{r.revision}</span> },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
          ],
          fields: [
            { key: 'title', label: 'Drawing Title', required: true },
            { key: 'number', label: 'Drawing Number', required: true },
            { key: 'type', label: 'Type', type: 'select', options: ['Layout', 'GFC', 'Section', 'Elevation', 'Detail', 'MEP', '3D'] },
            { key: 'revision', label: 'Revision', placeholder: 'R0, R1…' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'uploadedBy', label: 'Uploaded By', type: 'select', optionsFn: () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name) },
            { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Superseded'] },
            { key: 'notes', label: 'Notes', type: 'textarea', full: true, rows: 2 },
          ],
        }} />
      )}

      {tab === 'billing' && (
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-slate-800">Billing Summary</h3>
          {invs.length ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400"><th className="py-2">Invoice</th><th className="py-2">Date</th><th className="py-2">Amount</th><th className="py-2">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {invs.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 font-mono text-xs font-semibold text-brand-700">{i.invoiceNo}</td>
                    <td className="py-2 text-slate-500">{fmtDate(i.date)}</td>
                    <td className="py-2 font-semibold">{inr(i.amount)}</td>
                    <td className="py-2"><Badge>{i.status}</Badge></td>
                  </tr>
                ))}
                <tr className="font-bold"><td className="py-2">Total</td><td /><td className="py-2">{inr(billed)}</td><td /></tr>
              </tbody>
            </table>
          ) : <p className="text-sm text-slate-400">No invoices raised against this project yet.</p>}
          {client && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="font-semibold text-slate-700">Client: {client.name}</div>
              <div className="text-slate-500">{client.contactPerson} · {client.phone} · {client.email}</div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function MiniStat({ icon: Icon, label, value, sub, warn }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`rounded-lg p-2 ${warn ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}><Icon size={16} /></div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate text-sm font-bold text-slate-800">{value}</div>
        {sub && <div className={`truncate text-[11px] ${warn ? 'font-semibold text-rose-500' : 'text-slate-400'}`}>{sub}</div>}
      </div>
    </div>
  )
}
