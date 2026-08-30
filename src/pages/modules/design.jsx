import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { DraftingCompass, Calculator, IndianRupee, AlertTriangle, FileCheck } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { inr } from '../../lib/utils.js'

const projectOptions = () => db.list('projects').map((p) => p.name)
const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)
const pname = (id) => db.find('projects', id)?.name || '—'

export const DrawingsPage = () => (
  <ResourcePage
    module="drawings"
    singular="Drawing"
    collection="drawings"
    title="Drawings & Designs"
    desc="Central register of all layouts, GFCs, sections, MEP and 3D views with revision control."
    searchKeys={['title', 'number', 'type', 'revision', 'uploadedBy', 'notes']}
    statusField="status"
    approve={{ from: ['In Review'], to: 'Approved' }}
    filters={[
      { key: 'status', label: 'Status', options: ['Draft', 'In Review', 'Approved', 'Superseded'] },
      { key: 'type', label: 'Type', options: ['Layout', 'GFC', 'Section', 'Elevation', 'Detail', 'MEP', '3D'] },
    ]}
    stats={(rows) => [
      { icon: DraftingCompass, label: 'Total Drawings', value: rows.length, tone: 'indigo' },
      { icon: FileCheck, label: 'Approved (GFC)', value: rows.filter((r) => r.status === 'Approved').length, tone: 'green' },
      { icon: AlertTriangle, label: 'Awaiting Approval', value: rows.filter((r) => r.status === 'In Review').length, tone: 'amber' },
      { icon: DraftingCompass, label: 'Drafts', value: rows.filter((r) => r.status === 'Draft').length, tone: 'blue' },
    ]}
    columns={[
      { key: 'number', label: 'Drawing No', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.number}</span> },
      { key: 'title', label: 'Title', render: (r) => <div className="max-w-[240px] truncate font-medium text-slate-800" title={r.title}>{r.title}</div> },
      { key: 'projectId', label: 'Project', render: (r) => <span className="text-slate-600">{pname(r.projectId)}</span> },
      { key: 'type', label: 'Type' },
      { key: 'revision', label: 'Rev', render: (r) => <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600">{r.revision}</span> },
      { key: 'uploadedBy', label: 'By' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'title', label: 'Drawing Title', required: true },
      { key: 'number', label: 'Drawing Number', required: true, placeholder: 'AUR-P1-XXX-000' },
      { key: 'type', label: 'Drawing Type', type: 'select', options: ['Layout', 'GFC', 'Section', 'Elevation', 'Detail', 'MEP', '3D'] },
      { key: 'revision', label: 'Revision', placeholder: 'R0, R1…' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'uploadedBy', label: 'Uploaded By', type: 'select', optionsFn: empOptions },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Superseded'] },
      { key: 'notes', label: 'Notes / Change Log', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const BUDGET_HEADS = ['Civil Works', 'Ceiling & Drywall', 'Flooring', 'Electrical', 'HVAC', 'Firefighting', 'Furniture & Joinery', 'Painting & Finishes', 'Storefront & Branding', 'MEP', 'Contingency', 'Other']

export const BudgetPage = () => (
  <ResourcePage
    module="budgetHeads"
    singular="Budget Head"
    collection="budgetHeads"
    title="Budget / BOQ Heads"
    desc="Head-wise estimated vs actual cost per project — instant margin-leak visibility."
    searchKeys={['head', 'remarks']}
    filters={[{ key: 'head', label: 'Head', options: BUDGET_HEADS }]}
    stats={(rows) => {
      const est = rows.reduce((s, r) => s + (r.estimated || 0), 0)
      const act = rows.reduce((s, r) => s + (r.actual || 0), 0)
      const over = rows.filter((r) => (r.actual || 0) > (r.estimated || 0)).length
      return [
        { icon: Calculator, label: 'Total Estimated', value: inr(est), tone: 'indigo' },
        { icon: IndianRupee, label: 'Actual Spent', value: inr(act), sub: est ? Math.round((act / est) * 100) + '% utilised' : '', tone: 'blue' },
        { icon: IndianRupee, label: 'Balance', value: inr(est - act), tone: act > est ? 'red' : 'green' },
        { icon: AlertTriangle, label: 'Heads Over Budget', value: over, tone: over ? 'red' : 'green' },
      ]
    }}
    columns={[
      { key: 'projectId', label: 'Project', render: (r) => <span className="font-medium text-slate-700">{pname(r.projectId)}</span> },
      { key: 'head', label: 'Cost Head' },
      { key: 'estimated', label: 'Estimated', render: (r) => <span className="font-semibold">{inr(r.estimated)}</span> },
      { key: 'actual', label: 'Actual', render: (r) => <span className={(r.actual || 0) > (r.estimated || 0) ? 'font-semibold text-rose-600' : 'text-slate-700'}>{inr(r.actual)}</span> },
      { key: 'variance', label: 'Variance', render: (r) => { const v = (r.estimated || 0) - (r.actual || 0); return <span className={v >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>{v >= 0 ? '+' : ''}{inr(v)}</span> }, sortable: false, csvRaw: (r) => (r.estimated || 0) - (r.actual || 0) },
      { key: 'util', label: 'Utilisation', render: (r) => { const u = r.estimated ? Math.round(((r.actual || 0) / r.estimated) * 100) : 0; return <span className={u > 100 ? 'font-bold text-rose-600' : u > 85 ? 'font-bold text-amber-600' : 'text-slate-600'}>{u}%</span> }, sortable: false, csvRaw: (r) => (r.estimated ? Math.round(((r.actual || 0) / r.estimated) * 100) : 0) },
      { key: 'remarks', label: 'Remarks', render: (r) => <div className="max-w-[200px] truncate text-slate-400">{r.remarks || '—'}</div>, sortable: false },
    ]}
    fields={[
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'head', label: 'Cost Head', type: 'select', options: BUDGET_HEADS, required: true },
      { key: 'estimated', label: 'Estimated Cost', type: 'money', required: true },
      { key: 'actual', label: 'Actual Cost', type: 'money' },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)
