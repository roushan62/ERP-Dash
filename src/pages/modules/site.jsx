import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { CalendarCheck, ClipboardCheck, ShieldAlert, Users, AlertTriangle, CheckCircle2, Activity } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { fmtDate, today } from '../../lib/utils.js'

const projectOptions = () => db.list('projects').map((p) => p.name)
const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)
const pname = (id) => db.find('projects', id)?.name || '—'
const STAGES = ['Marking', 'Demolition', 'Civil Works', 'Plumbing', 'Electrical First Fix', 'HVAC', 'Ceiling & Drywall', 'Flooring', 'Painting', 'Joinery', 'Glass & Glazing', 'Final Cleaning', 'Handover']

export const DailyLogsPage = () => (
  <ResourcePage
    module="dailyLogs"
    singular="Daily Report"
    collection="dailyLogs"
    title="Site Progress — Daily Reports (DPR)"
    desc="Site diary: manpower, work done and hindrances — replaces WhatsApp chaos."
    searchKeys={['workSummary', 'hindrance', 'reportedBy', 'weather']}
    statusField="status"
    approve={{ from: ['Submitted'], to: 'Approved' }}
    filters={[{ key: 'status', label: 'Status', options: ['Submitted', 'Approved', 'Needs Attention'] }]}
    stats={(rows) => [
      { icon: CalendarCheck, label: 'Reports This Week', value: rows.filter((r) => r.date >= new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)).length, tone: 'indigo' },
      { icon: Users, label: 'Avg Manpower', value: rows.length ? Math.round(rows.reduce((s, r) => s + (r.manpower || 0), 0) / rows.length) : '—', tone: 'blue' },
      { icon: CheckCircle2, label: 'Approved', value: rows.filter((r) => r.status === 'Approved').length, tone: 'green' },
      { icon: AlertTriangle, label: 'Pending Review', value: rows.filter((r) => r.status === 'Submitted').length, tone: 'amber' },
    ]}
    columns={[
      { key: 'projectId', label: 'Project', render: (r) => <span className="font-medium text-slate-700">{pname(r.projectId)}</span> },
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'weather', label: 'Weather', render: (r) => <span>{r.weather === 'Rainy' ? '🌧' : r.weather === 'Cloudy' ? '⛅' : '☀️'} {r.weather}</span> },
      { key: 'manpower', label: 'Manpower', render: (r) => <span className="font-semibold">{r.manpower}</span> },
      { key: 'workSummary', label: 'Work Done', render: (r) => <div className="max-w-[300px] truncate text-slate-600" title={r.workSummary}>{r.workSummary}</div>, sortable: false },
      { key: 'hindrance', label: 'Hindrance', render: (r) => r.hindrance ? <span className="text-rose-600">⚠ {r.hindrance}</span> : <span className="text-slate-300">—</span>, sortable: false },
      { key: 'reportedBy', label: 'Reported By' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'weather', label: 'Weather', type: 'select', options: ['Sunny', 'Cloudy', 'Rainy'] },
      { key: 'manpower', label: 'Manpower Count', type: 'number', required: true },
      { key: 'reportedBy', label: 'Reported By', type: 'select', optionsFn: empOptions },
      { key: 'status', label: 'Status', type: 'select', options: ['Submitted', 'Approved', 'Needs Attention'] },
      { key: 'workSummary', label: 'Work Done Today', type: 'textarea', required: true, full: true },
      { key: 'hindrance', label: 'Hindrances / Blockers', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const QualityPage = () => (
  <ResourcePage
    module="qualityChecks"
    singular="QC Record"
    collection="qualityChecks"
    title="Quality Control"
    desc="Stage-wise inspections — pass, fail and rework tracking before handover."
    searchKeys={['stage', 'inspector', 'remarks']}
    statusField="result"
    filters={[
      { key: 'result', label: 'Result', options: ['Pass', 'Fail', 'Rework Needed'] },
      { key: 'stage', label: 'Stage', options: STAGES },
    ]}
    stats={(rows) => [
      { icon: ClipboardCheck, label: 'Total Checks', value: rows.length, tone: 'indigo' },
      { icon: CheckCircle2, label: 'Pass Rate', value: rows.length ? Math.round((rows.filter((r) => r.result === 'Pass').length / rows.length) * 100) + '%' : '—', tone: 'green' },
      { icon: AlertTriangle, label: 'Failures', value: rows.filter((r) => r.result === 'Fail').length, tone: 'red' },
      { icon: Activity, label: 'Rework Open', value: rows.filter((r) => r.result === 'Rework Needed').length, tone: 'amber' },
    ]}
    columns={[
      { key: 'projectId', label: 'Project', render: (r) => <span className="font-medium text-slate-700">{pname(r.projectId)}</span> },
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'stage', label: 'Stage', render: (r) => <Badge tone="violet">{r.stage}</Badge> },
      { key: 'inspector', label: 'Inspector' },
      { key: 'result', label: 'Result', render: (r) => <Badge tone={r.result === 'Pass' ? 'green' : r.result === 'Fail' ? 'red' : 'amber'}>{r.result}</Badge> },
      { key: 'remarks', label: 'Remarks', render: (r) => <div className="max-w-[280px] truncate text-slate-500" title={r.remarks}>{r.remarks}</div>, sortable: false },
    ]}
    fields={[
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'stage', label: 'Stage / Checkpoint', type: 'select', options: STAGES, required: true },
      { key: 'inspector', label: 'Inspector', type: 'select', optionsFn: empOptions },
      { key: 'result', label: 'Result', type: 'select', options: ['Pass', 'Fail', 'Rework Needed'], required: true },
      { key: 'remarks', label: 'Observations', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const SafetyPage = () => (
  <ResourcePage
    module="safetyIncidents"
    singular="Incident"
    collection="safetyIncidents"
    title="Safety / HSE"
    desc="Near misses, injuries and property damage — log, investigate, close."
    searchKeys={['type', 'severity', 'reportedBy', 'actionTaken']}
    statusField="status"
    filters={[
      { key: 'status', label: 'Status', options: ['Open', 'Investigating', 'Closed'] },
      { key: 'severity', label: 'Severity', options: ['Low', 'Medium', 'High', 'Critical'] },
    ]}
    stats={(rows) => [
      { icon: ShieldAlert, label: 'Open Incidents', value: rows.filter((r) => r.status !== 'Closed').length, tone: 'amber' },
      { icon: AlertTriangle, label: 'High / Critical', value: rows.filter((r) => ['High', 'Critical'].includes(r.severity)).length, tone: 'red' },
      { icon: CheckCircle2, label: 'Closed', value: rows.filter((r) => r.status === 'Closed').length, tone: 'green' },
      { icon: ShieldAlert, label: 'Total Logged', value: rows.length, tone: 'indigo' },
    ]}
    columns={[
      { key: 'projectId', label: 'Project', render: (r) => <span className="font-medium text-slate-700">{pname(r.projectId)}</span> },
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'type', label: 'Type', render: (r) => <Badge tone={r.type === 'Near Miss' ? 'blue' : r.type === 'First Aid' ? 'amber' : 'red'}>{r.type}</Badge> },
      { key: 'severity', label: 'Severity', render: (r) => <Badge tone={r.severity === 'Critical' || r.severity === 'High' ? 'red' : r.severity === 'Medium' ? 'amber' : 'slate'}>{r.severity}</Badge> },
      { key: 'reportedBy', label: 'Reported By' },
      { key: 'actionTaken', label: 'Action Taken', render: (r) => <div className="max-w-[260px] truncate text-slate-500" title={r.actionTaken}>{r.actionTaken}</div>, sortable: false },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'date', label: 'Incident Date', type: 'date', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['Near Miss', 'First Aid', 'Minor Injury', 'Major Injury', 'Property Damage'], required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'reportedBy', label: 'Reported By', type: 'select', optionsFn: empOptions },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Investigating', 'Closed'] },
      { key: 'actionTaken', label: 'Action Taken / Corrective Measure', type: 'textarea', full: true },
    ]}
  />
)
