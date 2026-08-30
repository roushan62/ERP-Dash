import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { Wrench, FolderOpen, IndianRupee, AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { inr, fmtDate, today, daysAhead } from '../../lib/utils.js'

const projectOptions = () => db.list('projects').map((p) => p.name)
const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)

export const AssetsPage = () => (
  <ResourcePage
    module="assets"
    singular="Asset"
    collection="assets"
    title="Assets & Equipment"
    desc="Tools, machinery and vehicles — where every asset is, and in what condition."
    searchKeys={['code', 'name', 'category', 'assignedTo', 'remarks']}
    statusField="status"
    filters={[
      { key: 'status', label: 'Status', options: ['In Use', 'Idle', 'Under Maintenance', 'Retired'] },
      { key: 'category', label: 'Category', options: ['Tools', 'Equipment', 'Vehicle', 'IT & Electronics', 'Furniture', 'Safety'] },
    ]}
    stats={(rows) => [
      { icon: Wrench, label: 'Total Assets', value: rows.length, tone: 'indigo' },
      { icon: IndianRupee, label: 'Asset Value', value: inr(rows.reduce((s, r) => s + (r.value || 0), 0)), tone: 'blue' },
      { icon: CheckCircle2, label: 'In Use', value: rows.filter((r) => r.status === 'In Use').length, tone: 'green' },
      { icon: AlertTriangle, label: 'Idle / Maintenance', value: rows.filter((r) => ['Idle', 'Under Maintenance'].includes(r.status)).length, tone: 'amber' },
    ]}
    columns={[
      { key: 'code', label: 'Code', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.code}</span> },
      { key: 'name', label: 'Asset', render: (r) => <span className="font-semibold text-slate-800">{r.name}</span> },
      { key: 'category', label: 'Category' },
      { key: 'projectId', label: 'At Site', render: (r) => (r.projectId ? db.find('projects', r.projectId)?.name || '—' : 'Head Office / Store') },
      { key: 'assignedTo', label: 'Custodian', render: (r) => r.assignedTo || '—' },
      { key: 'value', label: 'Value', render: (r) => inr(r.value) },
      { key: 'condition', label: 'Condition', render: (r) => <Badge tone={r.condition === 'New' ? 'green' : r.condition === 'Good' ? 'blue' : r.condition === 'Fair' ? 'amber' : 'red'}>{r.condition}</Badge> },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'code', label: 'Asset Code', required: true, placeholder: 'AST-XX-000' },
      { key: 'name', label: 'Asset Name', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Tools', 'Equipment', 'Vehicle', 'IT & Electronics', 'Furniture', 'Safety'] },
      { key: 'projectId', label: 'Deployed At', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { key: 'value', label: 'Value', type: 'money' },
      { key: 'assignedTo', label: 'Custodian', type: 'select', optionsFn: empOptions },
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Good', 'Fair', 'Poor'] },
      { key: 'status', label: 'Status', type: 'select', options: ['In Use', 'Idle', 'Under Maintenance', 'Retired'] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const DocumentsPage = () => (
  <ResourcePage
    module="documents"
    singular="Document"
    collection="documents"
    title="Documents & Compliance"
    desc="Contracts, NOCs, tax filings and certificates — with expiry alerts."
    searchKeys={['name', 'category', 'tags', 'uploadedBy']}
    filters={[{ key: 'category', label: 'Category', options: ['Contract', 'Agreement', 'Compliance', 'Certificate', 'Tax', 'Insurance', 'Other'] }]}
    stats={(rows) => [
      { icon: FolderOpen, label: 'Total Documents', value: rows.length, tone: 'indigo' },
      { icon: FileWarning, label: 'Expiring in 60 Days', value: rows.filter((r) => r.expiryDate && r.expiryDate >= today() && r.expiryDate <= daysAhead(60)).length, tone: 'amber' },
      { icon: AlertTriangle, label: 'Expired', value: rows.filter((r) => r.expiryDate && r.expiryDate < today()).length, tone: 'red' },
      { icon: FolderOpen, label: 'Contracts', value: rows.filter((r) => r.category === 'Contract').length, tone: 'blue' },
    ]}
    columns={[
      { key: 'name', label: 'Document', render: (r) => <span className="font-semibold text-slate-800">{r.name}</span> },
      { key: 'category', label: 'Category', render: (r) => <Badge tone="violet">{r.category}</Badge> },
      { key: 'projectId', label: 'Project', render: (r) => (r.projectId ? db.find('projects', r.projectId)?.name || '—' : 'Company Level') },
      { key: 'uploadedBy', label: 'Uploaded By' },
      { key: 'date', label: 'Uploaded', render: (r) => fmtDate(r.date) },
      { key: 'expiryDate', label: 'Expires', render: (r) => { if (!r.expiryDate) return '—'; const soon = r.expiryDate <= daysAhead(60); return <span className={soon ? 'font-semibold text-amber-600' : ''}>{fmtDate(r.expiryDate)}{soon ? ' ⚠' : ''}</span> } },
      { key: 'tags', label: 'Tags', render: (r) => <div className="max-w-[160px] truncate text-xs text-slate-400">{r.tags || '—'}</div>, sortable: false },
    ]}
    fields={[
      { key: 'name', label: 'Document Name', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Contract', 'Agreement', 'Compliance', 'Certificate', 'Tax', 'Insurance', 'Other'], required: true },
      { key: 'projectId', label: 'Related Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'uploadedBy', label: 'Uploaded By', type: 'select', optionsFn: empOptions },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'expiryDate', label: 'Expiry Date (if any)', type: 'date' },
      { key: 'tags', label: 'Tags', placeholder: 'comma, separated' },
    ]}
  />
)
