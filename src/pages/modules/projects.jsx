import React from 'react'
import { useNavigate } from 'react-router-dom'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { Building2, ClipboardList, Handshake, IndianRupee, AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { Badge, Progress, Button } from '../../components/ui.jsx'
import { inr, today } from '../../lib/utils.js'

const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)
const projectOptions = () => db.list('projects').map((p) => p.name)
const PROJECT_TYPES = ['Office Fitout', 'Residential Interior', 'Retail Fitout', 'Hospitality Fitout', 'Civil Construction', 'Civil + Interior', 'Design Consultancy']

const projByName = (name) => db.list('projects').find((p) => p.name === name)

export const ProjectsPage = () => {
  const navigate = useNavigate()
  return (
    <ResourcePage
      module="projects"
      singular="Project"
      collection="projects"
      title="Projects"
      desc="All live, planned and completed projects — click a row to open the full project workspace."
      searchKeys={['code', 'name', 'client', 'type', 'location', 'manager']}
      statusField="status"
      filters={[
        { key: 'status', label: 'Status', options: ['Planning', 'Ongoing', 'On Hold', 'Completed'] },
        { key: 'type', label: 'Type', options: PROJECT_TYPES },
      ]}
      stats={(rows) => [
        { icon: Building2, label: 'Active Projects', value: rows.filter((r) => r.status === 'Ongoing').length, tone: 'indigo' },
        { icon: IndianRupee, label: 'Portfolio Value', value: inr(rows.filter((r) => r.status !== 'Completed').reduce((s, r) => s + (r.budget || 0), 0)), tone: 'blue' },
        { icon: AlertTriangle, label: 'Delayed / On Hold', value: rows.filter((r) => r.status === 'On Hold' || (r.status !== 'Completed' && r.endDate && r.endDate < today())).length, tone: 'red' },
        { icon: CheckCircle2, label: 'Completed', value: rows.filter((r) => r.status === 'Completed').length, tone: 'green' },
        { icon: ClipboardList, label: 'Avg Progress', value: rows.length ? Math.round(rows.reduce((s, r) => s + (r.progress || 0), 0) / rows.length) + '%' : '—', tone: 'violet' },
      ]}
      columns={[
        { key: 'code', label: 'Project', render: (r, api) => (
          <button onClick={() => navigate(`/projects/view/${r.id}`)} className="group text-left">
            <div className="flex items-center gap-1 font-semibold text-slate-800 group-hover:text-brand-600">{r.name}<ArrowUpRight size={13} className="opacity-0 group-hover:opacity-100" /></div>
            <div className="text-xs text-slate-400">{r.code} · {r.client}</div>
          </button>
        ), csvRaw: (r) => `${r.code} — ${r.name}` },
        { key: 'type', label: 'Type' },
        { key: 'location', label: 'Location' },
        { key: 'budget', label: 'Budget', render: (r) => (<div><div className="font-semibold">{inr(r.budget)}</div><div className="text-[11px] text-slate-400">Spent {inr(r.spent)}</div></div>), csvRaw: (r) => r.budget },
        { key: 'manager', label: 'Manager' },
        { key: 'progress', label: 'Progress', render: (r) => <Progress value={r.progress} /> },
        { key: 'endDate', label: 'Deadline', render: (r) => r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—' },
        { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      ]}
      fields={[
        { key: 'code', label: 'Project Code', required: true, placeholder: 'AUR-P-0XX' },
        { key: 'name', label: 'Project Name', required: true },
        { key: 'client', label: 'Client', type: 'select', optionsFn: () => [...db.list('clients').map((c) => c.name), ...db.list('leads').filter((l) => l.status === 'Won').map((l) => l.companyName)] },
        { key: 'type', label: 'Project Type', type: 'select', options: PROJECT_TYPES },
        { key: 'location', label: 'Location' },
        { key: 'area', label: 'Area (sqft)', type: 'number' },
        { key: 'budget', label: 'Project Budget', type: 'money' },
        { key: 'spent', label: 'Spent Till Date', type: 'money' },
        { key: 'manager', label: 'Project Manager', type: 'select', optionsFn: empOptions },
        { key: 'progress', label: 'Progress %', type: 'number' },
        { key: 'startDate', label: 'Start Date', type: 'date' },
        { key: 'endDate', label: 'Target End Date', type: 'date' },
        { key: 'billingType', label: 'Billing Type', type: 'select', options: ['Fixed Price', 'Milestone Based', 'Monthly RA Bills', 'Stage Payment', 'T+M'] },
        { key: 'status', label: 'Status', type: 'select', options: ['Planning', 'Ongoing', 'On Hold', 'Completed'] },
      ]}
    />
  )
}

export const TasksPage = () => (
  <ResourcePage
    module="tasks"
    singular="Task"
    collection="tasks"
    title="Tasks & Milestones"
    desc="Activity-level tracking across all projects with priorities and due dates."
    searchKeys={['title', 'assignedTo', 'remarks', 'priority']}
    statusField="status"
    filters={[
      { key: 'status', label: 'Status', options: ['Pending', 'In Progress', 'Completed', 'Blocked'] },
      { key: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
    ]}
    stats={(rows) => [
      { icon: ClipboardList, label: 'Open Tasks', value: rows.filter((r) => r.status !== 'Completed').length, tone: 'indigo' },
      { icon: AlertTriangle, label: 'Overdue', value: rows.filter((r) => r.status !== 'Completed' && r.dueDate && r.dueDate < today()).length, tone: 'red' },
      { icon: CheckCircle2, label: 'Completed', value: rows.filter((r) => r.status === 'Completed').length, tone: 'green' },
      { icon: ClipboardList, label: 'Critical Priority', value: rows.filter((r) => r.priority === 'Critical' && r.status !== 'Completed').length, tone: 'amber' },
    ]}
    columns={[
      { key: 'title', label: 'Task', render: (r) => <div className="max-w-[280px]"><div className="truncate font-medium text-slate-800" title={r.title}>{r.title}</div><div className="text-xs text-slate-400">{api_project(r.projectId)}</div></div>, csvRaw: (r) => r.title },
      { key: 'assignedTo', label: 'Assignee' },
      { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'High' ? 'amber' : r.priority === 'Medium' ? 'blue' : 'slate'}>{r.priority}</Badge> },
      { key: 'startDate', label: 'Start' },
      { key: 'dueDate', label: 'Due', render: (r) => (<span className={r.status !== 'Completed' && r.dueDate < today() ? 'font-semibold text-rose-600' : ''}>{r.dueDate}</span>) },
      { key: 'progress', label: 'Progress', render: (r) => <Progress value={r.progress} /> },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'title', label: 'Task Title', required: true, full: true },
      { key: 'assignedTo', label: 'Assigned To', type: 'select', optionsFn: empOptions },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'progress', label: 'Progress %', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Blocked'] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

const api_project = (id) => db.find('projects', id)?.name || '—'

export const SubcontractorsPage = () => (
  <ResourcePage
    module="subcontractors"
    singular="Subcontractor"
    collection="subcontractors"
    title="Subcontractors & Labour Agencies"
    desc="Agency contracts, trade-wise payments and outstanding balances."
    searchKeys={['name', 'trade', 'contactPerson', 'phone']}
    statusField="status"
    filters={[{ key: 'trade', label: 'Trade', options: ['Carpentry & Joinery', 'Ceiling & Drywall', 'Painting', 'Flooring & Marble', 'Electrical', 'Civil & RCC', 'Signage & AV', 'Manpower', 'Other'] }]}
    stats={(rows) => [
      { icon: Handshake, label: 'Active Agencies', value: rows.filter((r) => r.status === 'Active').length, tone: 'indigo' },
      { icon: IndianRupee, label: 'Contract Value', value: inr(rows.reduce((s, r) => s + (r.contractValue || 0), 0)), tone: 'blue' },
      { icon: IndianRupee, label: 'Paid', value: inr(rows.reduce((s, r) => s + (r.paid || 0), 0)), tone: 'green' },
      { icon: AlertTriangle, label: 'Outstanding', value: inr(rows.reduce((s, r) => s + ((r.contractValue || 0) - (r.paid || 0)), 0)), tone: 'red' },
    ]}
    columns={[
      { key: 'name', label: 'Agency', render: (r) => (<div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-400">{r.contactPerson} · {r.phone}</div></div>), csvRaw: (r) => r.name },
      { key: 'trade', label: 'Trade' },
      { key: 'projectId', label: 'Project', render: (r) => api_project(r.projectId) },
      { key: 'contractValue', label: 'Contract', render: (r) => <span className="font-semibold">{inr(r.contractValue)}</span> },
      { key: 'paid', label: 'Paid', render: (r) => inr(r.paid) },
      { key: 'balance', label: 'Balance', render: (r) => <span className="font-semibold text-rose-600">{inr((r.contractValue || 0) - (r.paid || 0))}</span>, sortable: false, csvRaw: (r) => (r.contractValue || 0) - (r.paid || 0) },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'name', label: 'Agency Name', required: true },
      { key: 'trade', label: 'Trade', type: 'select', options: ['Carpentry & Joinery', 'Ceiling & Drywall', 'Painting', 'Flooring & Marble', 'Electrical', 'Civil & RCC', 'Signage & AV', 'Manpower', 'Other'] },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'projectId', label: 'Deployed At Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'contractValue', label: 'Contract Value', type: 'money' },
      { key: 'paid', label: 'Paid Till Date', type: 'money' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Hold', 'Completed', 'Blacklisted'] },
    ]}
  />
)
