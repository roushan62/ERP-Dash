import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { UsersRound, CalendarDays, Plane, BadgeIndianRupee, CheckCircle2, Clock, IndianRupee, UserCheck } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { inr, fmtDate, today } from '../../lib/utils.js'

const DEPARTMENTS = ['Management', 'Projects', 'Site Execution', 'Design', 'Sales', 'Finance', 'HR', 'Procurement', 'Store & Inventory', 'IT & Systems']
const empNames = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)

export const EmployeesPage = () => (
  <ResourcePage
    module="employees"
    singular="Employee"
    collection="employees"
    title="Employees"
    desc="Your people master — org-wide directory with department and status."
    searchKeys={['empCode', 'name', 'designation', 'department', 'phone', 'email']}
    statusField="status"
    filters={[{ key: 'department', label: 'Department', options: DEPARTMENTS }]}
    stats={(rows) => [
      { icon: UsersRound, label: 'Total Employees', value: rows.length, tone: 'indigo' },
      { icon: UserCheck, label: 'Active', value: rows.filter((r) => r.status === 'Active').length, tone: 'green' },
      { icon: UsersRound, label: 'On Site Roles', value: rows.filter((r) => r.department === 'Site Execution').length, tone: 'blue' },
      { icon: IndianRupee, label: 'Monthly Payroll', value: inr(rows.filter((r) => r.status === 'Active').reduce((s, r) => s + (r.ctc || 0) / 12, 0)), tone: 'violet' },
    ]}
    columns={[
      { key: 'empCode', label: 'Emp Code', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.empCode}</span> },
      { key: 'name', label: 'Name', render: (r) => (<div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-400">{r.email}</div></div>), csvRaw: (r) => r.name },
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department' },
      { key: 'phone', label: 'Phone' },
      { key: 'joinDate', label: 'Joined', render: (r) => fmtDate(r.joinDate) },
      { key: 'ctc', label: 'CTC / yr', render: (r) => inr(r.ctc) },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'empCode', label: 'Employee Code', required: true, placeholder: 'AUR-0XX' },
      { key: 'name', label: 'Full Name', required: true },
      { key: 'designation', label: 'Designation' },
      { key: 'department', label: 'Department', type: 'select', options: DEPARTMENTS },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'joinDate', label: 'Joining Date', type: 'date' },
      { key: 'ctc', label: 'Annual CTC', type: 'money' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Notice', 'Exited'] },
    ]}
  />
)

export const AttendancePage = () => (
  <ResourcePage
    module="attendance"
    singular="Attendance Entry"
    collection="attendance"
    title="Attendance"
    desc="Daily attendance for staff and site teams."
    searchKeys={['employeeName', 'remarks']}
    filters={[{ key: 'status', label: 'Status', options: ['Present', 'Absent', 'Half Day', 'Leave', 'Site Duty', 'Week Off'] }]}
    stats={(rows) => {
      const t = rows.filter((r) => r.date === today())
      return [
        { icon: CalendarDays, label: 'Marked Today', value: t.length, tone: 'indigo' },
        { icon: CheckCircle2, label: 'Present Today', value: t.filter((r) => ['Present', 'Site Duty'].includes(r.status)).length, tone: 'green' },
        { icon: Clock, label: 'On Leave', value: t.filter((r) => r.status === 'Leave').length, tone: 'amber' },
        { icon: UsersRound, label: 'Site Duty', value: t.filter((r) => r.status === 'Site Duty').length, tone: 'blue' },
      ]
    }}
    columns={[
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'employeeName', label: 'Employee', render: (r) => <span className="font-medium text-slate-800">{r.employeeName}</span> },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      { key: 'inTime', label: 'In', render: (r) => r.inTime || '—' },
      { key: 'outTime', label: 'Out', render: (r) => r.outTime || '—' },
      { key: 'remarks', label: 'Remarks', render: (r) => <div className="max-w-[220px] truncate text-slate-400">{r.remarks || '—'}</div>, sortable: false },
    ]}
    fields={[
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'employeeName', label: 'Employee', type: 'select', optionsFn: empNames, required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Present', 'Absent', 'Half Day', 'Leave', 'Site Duty', 'Week Off'], required: true },
      { key: 'inTime', label: 'In Time', type: 'text', placeholder: '09:00' },
      { key: 'outTime', label: 'Out Time', type: 'text', placeholder: '18:00' },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const LeavesPage = () => (
  <ResourcePage
    module="leaves"
    singular="Leave Request"
    collection="leaves"
    title="Leave Requests"
    desc="Apply, track and approve leaves with full history."
    searchKeys={['employeeName', 'type', 'reason']}
    statusField="status"
    approve={{ from: ['Pending'], to: 'Approved' }}
    filters={[
      { key: 'status', label: 'Status', options: ['Pending', 'Approved', 'Rejected'] },
      { key: 'type', label: 'Type', options: ['CL', 'SL', 'EL', 'Comp Off', 'LWP'] },
    ]}
    stats={(rows) => [
      { icon: Plane, label: 'Pending Requests', value: rows.filter((r) => r.status === 'Pending').length, tone: 'amber' },
      { icon: CheckCircle2, label: 'Approved (30d)', value: rows.filter((r) => r.status === 'Approved').length, tone: 'green' },
      { icon: CalendarDays, label: 'On Leave Today', value: rows.filter((r) => r.status === 'Approved' && r.from <= today() && r.to >= today()).length, tone: 'indigo' },
      { icon: Plane, label: 'Total Requests', value: rows.length, tone: 'blue' },
    ]}
    columns={[
      { key: 'employeeName', label: 'Employee', render: (r) => <span className="font-medium text-slate-800">{r.employeeName}</span> },
      { key: 'type', label: 'Type', render: (r) => <Badge tone="violet">{r.type}</Badge> },
      { key: 'from', label: 'From', render: (r) => fmtDate(r.from) },
      { key: 'to', label: 'To', render: (r) => fmtDate(r.to) },
      { key: 'days', label: 'Days', render: (r) => <span className="font-semibold">{r.days}</span> },
      { key: 'reason', label: 'Reason', render: (r) => <div className="max-w-[220px] truncate text-slate-500" title={r.reason}>{r.reason}</div>, sortable: false },
      { key: 'approvedBy', label: 'Approved By', render: (r) => r.approvedBy || '—' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'employeeName', label: 'Employee', type: 'select', optionsFn: empNames, required: true },
      { key: 'type', label: 'Leave Type', type: 'select', options: ['CL', 'SL', 'EL', 'Comp Off', 'LWP'], required: true },
      { key: 'from', label: 'From', type: 'date', required: true },
      { key: 'to', label: 'To', type: 'date', required: true },
      { key: 'days', label: 'Total Days', type: 'number', required: true },
      { key: 'reason', label: 'Reason', type: 'textarea', required: true },
      { key: 'approvedBy', label: 'Approved By', type: 'select', optionsFn: empNames },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] },
    ]}
  />
)

export const PayrollPage = () => (
  <ResourcePage
    module="payrolls"
    singular="Payroll Entry"
    collection="payrolls"
    title="Payroll"
    desc="Month-wise salary processing with net pay calculation."
    searchKeys={['month', 'employeeName', 'remarks']}
    statusField="status"
    filters={[{ key: 'month', label: 'Month', options: ['Aug 2026', 'Jul 2026', 'Jun 2026', 'May 2026'] }, { key: 'status', label: 'Status', options: ['Draft', 'Processed', 'Paid'] }]}
    stats={(rows) => [
      { icon: BadgeIndianRupee, label: 'This Month Net', value: inr(rows.filter((r) => r.month === 'Aug 2026').reduce((s, r) => s + (r.basic || 0) + (r.allowances || 0) - (r.deductions || 0), 0)), tone: 'indigo' },
      { icon: CheckCircle2, label: 'Paid Entries', value: rows.filter((r) => r.status === 'Paid').length, tone: 'green' },
      { icon: Clock, label: 'Draft / Processing', value: rows.filter((r) => r.status !== 'Paid').length, tone: 'amber' },
      { icon: UsersRound, label: 'Employees on Payroll', value: db.list('employees').filter((e) => e.status === 'Active').length, tone: 'blue' },
    ]}
    columns={[
      { key: 'month', label: 'Month', render: (r) => <Badge tone="indigo">{r.month}</Badge> },
      { key: 'employeeName', label: 'Employee', render: (r) => <span className="font-medium text-slate-800">{r.employeeName}</span> },
      { key: 'basic', label: 'Basic', render: (r) => inr(r.basic) },
      { key: 'allowances', label: 'Allowances', render: (r) => inr(r.allowances) },
      { key: 'deductions', label: 'Deductions', render: (r) => <span className="text-rose-600">−{inr(r.deductions)}</span> },
      { key: 'net', label: 'Net Pay', render: (r) => <span className="font-bold text-slate-900">{inr((r.basic || 0) + (r.allowances || 0) - (r.deductions || 0))}</span>, sortable: false, csvRaw: (r) => (r.basic || 0) + (r.allowances || 0) - (r.deductions || 0) },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
      { key: 'remarks', label: 'Remarks', render: (r) => <div className="max-w-[180px] truncate text-slate-400">{r.remarks || '—'}</div>, sortable: false },
    ]}
    fields={[
      { key: 'month', label: 'Salary Month', type: 'select', options: ['Aug 2026', 'Jul 2026', 'Jun 2026', 'May 2026', 'Apr 2026'], required: true },
      { key: 'employeeName', label: 'Employee', type: 'select', optionsFn: empNames, required: true },
      { key: 'basic', label: 'Basic Salary', type: 'money', required: true },
      { key: 'allowances', label: 'HRA + Allowances', type: 'money' },
      { key: 'deductions', label: 'Deductions (PF/PT/TDS)', type: 'money' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Processed', 'Paid'] },
      { key: 'remarks', label: 'Remarks (overtime etc.)', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)
