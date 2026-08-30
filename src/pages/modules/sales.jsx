import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { Target, FileText, Users, TrendingUp, Trophy, IndianRupee, Percent } from 'lucide-react'
import { Badge, Progress } from '../../components/ui.jsx'
import { inr } from '../../lib/utils.js'

const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)

// ---------------- LEADS ----------------
export const LeadsPage = () => (
  <ResourcePage
    module="leads"
    singular="Lead"
    collection="leads"
    title="Enquiries & Leads"
    desc="Track every incoming enquiry from first contact to win — the top of your sales funnel."
    searchKeys={['companyName', 'contactPerson', 'phone', 'email', 'location', 'requirement', 'assignedTo']}
    statusField="status"
    defaultSort={{ key: 'createdAt', dir: 'desc' }}
    approve={{ from: [], to: 'Won' }}
    filters={[
      { key: 'status', label: 'Status', options: ['New', 'Contacted', 'Qualified', 'Site Visit', 'Proposal Sent', 'Won', 'Lost'] },
      { key: 'source', label: 'Source', options: ['Referral', 'Website', 'IndiaMART', 'Exhibition', 'Walk-in', 'Houzz', 'Tender'] },
    ]}
    stats={(rows) => [
      { icon: Target, label: 'Total Leads', value: rows.length, tone: 'indigo' },
      { icon: IndianRupee, label: 'Pipeline Value', value: inr(rows.filter((r) => !['Won', 'Lost'].includes(r.status)).reduce((s, r) => s + (r.budget || 0), 0)), tone: 'blue' },
      { icon: Trophy, label: 'Won', value: rows.filter((r) => r.status === 'Won').length, sub: inr(rows.filter((r) => r.status === 'Won').reduce((s, r) => s + (r.budget || 0), 0)), tone: 'green' },
      { icon: Percent, label: 'Conversion Rate', value: rows.length ? Math.round((rows.filter((r) => r.status === 'Won').length / rows.length) * 100) + '%' : '0%', tone: 'amber' },
      { icon: TrendingUp, label: 'Follow-ups Due', value: rows.filter((r) => r.nextFollowUp && r.nextFollowUp <= new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10) && !['Won', 'Lost'].includes(r.status)).length, tone: 'red' },
    ]}
    columns={[
      { key: 'companyName', label: 'Company / Contact', render: (r) => (<div><div className="font-semibold text-slate-800">{r.companyName}</div><div className="text-xs text-slate-400">{r.contactPerson} · {r.phone}</div></div>), csvRaw: (r) => `${r.companyName} (${r.contactPerson})` },
      { key: 'source', label: 'Source' },
      { key: 'location', label: 'Location' },
      { key: 'budget', label: 'Est. Value', render: (r) => <span className="font-semibold">{inr(r.budget)}</span> },
      { key: 'requirement', label: 'Requirement', render: (r) => <div className="max-w-[240px] truncate text-slate-500" title={r.requirement}>{r.requirement || '—'}</div>, sortable: false },
      { key: 'assignedTo', label: 'Assigned To' },
      { key: 'nextFollowUp', label: 'Follow-up', render: (r) => r.nextFollowUp ? fmtShort(r.nextFollowUp) : '—' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'companyName', label: 'Company Name', required: true },
      { key: 'contactPerson', label: 'Contact Person', required: true },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'source', label: 'Lead Source', type: 'select', options: ['Referral', 'Website', 'IndiaMART', 'Exhibition', 'Walk-in', 'Houzz', 'Tender'] },
      { key: 'location', label: 'Location / City' },
      { key: 'budget', label: 'Estimated Budget', type: 'money' },
      { key: 'assignedTo', label: 'Assigned To', type: 'select', optionsFn: empOptions },
      { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Site Visit', 'Proposal Sent', 'Won', 'Lost'] },
      { key: 'nextFollowUp', label: 'Next Follow-up', type: 'date' },
      { key: 'requirement', label: 'Requirement Details', type: 'textarea', full: true },
      { key: 'notes', label: 'Internal Notes', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'

// ---------------- QUOTATIONS ----------------
export const QuotationsPage = () => (
  <ResourcePage
    module="quotations"
    singular="Quotation"
    collection="quotations"
    title="Quotations & Estimates"
    desc="Prepare, send and track quotations with margin visibility at every stage."
    searchKeys={['quoteNo', 'clientName', 'projectName', 'scope', 'createdBy']}
    statusField="status"
    defaultSort={{ key: 'createdAt', dir: 'desc' }}
    filters={[{ key: 'status', label: 'Status', options: ['Draft', 'Sent', 'Revised', 'Approved', 'Rejected'] }]}
    stats={(rows) => [
      { icon: FileText, label: 'Total Quotes', value: rows.length, tone: 'indigo' },
      { icon: IndianRupee, label: 'Quoted Value', value: inr(rows.reduce((s, r) => s + (r.value || 0), 0)), tone: 'blue' },
      { icon: Trophy, label: 'Approved', value: rows.filter((r) => r.status === 'Approved').length, sub: inr(rows.filter((r) => r.status === 'Approved').reduce((s, r) => s + (r.value || 0), 0)), tone: 'green' },
      { icon: Percent, label: 'Win Rate', value: rows.filter((r) => ['Approved', 'Rejected'].includes(r.status)).length ? Math.round((rows.filter((r) => r.status === 'Approved').length / rows.filter((r) => ['Approved', 'Rejected'].includes(r.status)).length) * 100) + '%' : '—', tone: 'amber' },
      { icon: TrendingUp, label: 'Avg Margin', value: rows.length ? Math.round(rows.reduce((s, r) => s + (r.marginPct || 0), 0) / rows.length) + '%' : '—', tone: 'violet' },
    ]}
    columns={[
      { key: 'quoteNo', label: 'Quote No', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.quoteNo}</span> },
      { key: 'clientName', label: 'Client / Project', render: (r) => (<div><div className="font-semibold text-slate-800">{r.clientName}</div><div className="text-xs text-slate-400">{r.projectName}</div></div>), csvRaw: (r) => `${r.clientName} — ${r.projectName}` },
      { key: 'area', label: 'Area', render: (r) => r.area ? r.area.toLocaleString('en-IN') + ' sqft' : '—' },
      { key: 'value', label: 'Value', render: (r) => <span className="font-semibold">{inr(r.value)}</span> },
      { key: 'marginPct', label: 'Margin', render: (r) => <span className={(r.marginPct || 0) >= 18 ? 'font-semibold text-emerald-600' : 'font-semibold text-amber-600'}>{r.marginPct || 0}%</span> },
      { key: 'validUntil', label: 'Valid Until', render: (r) => r.validUntil ? fmtShort(r.validUntil) : '—' },
      { key: 'createdBy', label: 'Owner' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'quoteNo', label: 'Quotation No', required: true, placeholder: 'AUR-Q-2026-0XX' },
      { key: 'clientName', label: 'Client Name', required: true },
      { key: 'projectName', label: 'Project / Scope Name', required: true },
      { key: 'area', label: 'Area (sqft)', type: 'number' },
      { key: 'value', label: 'Quoted Value', type: 'money', required: true },
      { key: 'marginPct', label: 'Margin %', type: 'number' },
      { key: 'validUntil', label: 'Valid Until', type: 'date' },
      { key: 'createdBy', label: 'Owned By', type: 'select', optionsFn: empOptions },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Revised', 'Approved', 'Rejected'] },
      { key: 'scope', label: 'Scope of Work', type: 'textarea', full: true },
    ]}
  />
)

// ---------------- CLIENTS ----------------
export const ClientsPage = () => (
  <ResourcePage
    module="clients"
    singular="Client"
    collection="clients"
    title="Clients"
    desc="Your client master — companies and individuals you serve."
    searchKeys={['name', 'contactPerson', 'phone', 'email', 'industry', 'city', 'gstin']}
    filters={[{ key: 'status', label: 'Status', options: ['Active', 'Inactive'] }]}
    stats={(rows) => [
      { icon: Users, label: 'Total Clients', value: rows.length, tone: 'indigo' },
      { icon: Users, label: 'Active', value: rows.filter((r) => r.status === 'Active').length, tone: 'green' },
      { icon: IndianRupee, label: 'Total Billed', value: inr(db.list('invoices').filter((i) => rows.some((c) => c.id === i.clientId)).reduce((s, i) => s + (i.amount || 0), 0)), tone: 'blue' },
      { icon: TrendingUp, label: 'Industries Served', value: new Set(rows.map((r) => r.industry).filter(Boolean)).size, tone: 'violet' },
    ]}
    columns={[
      { key: 'name', label: 'Client', render: (r) => <span className="font-semibold text-slate-800">{r.name}</span> },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'industry', label: 'Industry' },
      { key: 'city', label: 'City' },
      { key: 'gstin', label: 'GSTIN', render: (r) => <span className="font-mono text-xs">{r.gstin || '—'}</span> },
      { key: 'since', label: 'Client Since', render: (r) => r.since ? fmtShort(r.since) : '—' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'name', label: 'Client Name', required: true },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'industry', label: 'Industry', type: 'select', options: ['IT / ITES', 'Real Estate', 'Retail / E-commerce', 'Hospitality / F&B', 'Manufacturing', 'Logistics', 'Healthcare', 'Education', 'Individual / HNI', 'Other'] },
      { key: 'city', label: 'City' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ]}
  />
)
