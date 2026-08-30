import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { ReceiptIndianRupee, Wallet, Banknote, IndianRupee, AlertTriangle, Clock, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { inr, fmtDate, today, monthOffset } from '../../lib/utils.js'

const PROJECT_TYPES = []
const projectOptions = () => db.list('projects').map((p) => p.name)

export const InvoicesPage = () => (
  <ResourcePage
    module="invoices"
    singular="Invoice"
    collection="invoices"
    title="Sales Invoices"
    desc="Client billing with GST, due-date tracking and receivable ageing."
    searchKeys={['invoiceNo', 'notes']}
    statusField="status"
    filters={[{ key: 'status', label: 'Status', options: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue'] }]}
    stats={(rows) => [
      { icon: ReceiptIndianRupee, label: 'Total Billed', value: inr(rows.reduce((s, r) => s + (r.amount || 0), 0)), tone: 'indigo' },
      { icon: CheckCircle2, label: 'Received', value: inr(rows.filter((r) => r.status === 'Paid').reduce((s, r) => s + (r.amount || 0), 0)), tone: 'green' },
      { icon: Clock, label: 'Outstanding', value: inr(rows.filter((r) => !['Paid', 'Draft'].includes(r.status)).reduce((s, r) => s + (r.amount || 0), 0)), tone: 'amber' },
      { icon: AlertTriangle, label: 'Overdue Invoices', value: rows.filter((r) => r.status === 'Overdue' || (['Sent', 'Partially Paid'].includes(r.status) && r.dueDate < today())).length, tone: 'red' },
    ]}
    columns={[
      { key: 'invoiceNo', label: 'Invoice No', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.invoiceNo}</span> },
      { key: 'clientId', label: 'Client', render: (r) => <span className="font-semibold text-slate-800">{db.find('clients', r.clientId)?.name || '—'}</span>, csvRaw: (r) => db.find('clients', r.clientId)?.name || '' },
      { key: 'projectId', label: 'Project', render: (r) => <span className="text-slate-600">{db.find('projects', r.projectId)?.name || '—'}</span>, csvRaw: (r) => db.find('projects', r.projectId)?.name || '' },
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'dueDate', label: 'Due', render: (r) => <span className={!['Paid', 'Draft'].includes(r.status) && r.dueDate < today() ? 'font-semibold text-rose-600' : ''}>{fmtDate(r.dueDate)}</span> },
      { key: 'amount', label: 'Amount', render: (r) => <div><div className="font-semibold">{inr(r.amount)}</div><div className="text-[11px] text-slate-400">+GST {inr(Math.round((r.amount || 0) * (r.gstPct || 0) / 100))}</div></div>, csvRaw: (r) => r.amount },
      { key: 'total', label: 'Total', render: (r) => <span className="font-bold">{inr(Math.round((r.amount || 0) * (1 + (r.gstPct || 0) / 100)))}</span>, sortable: false, csvRaw: (r) => Math.round((r.amount || 0) * (1 + (r.gstPct || 0) / 100)) },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'invoiceNo', label: 'Invoice Number', required: true, placeholder: 'AUR/26-27/0XX' },
      { key: 'clientId', label: 'Client', type: 'ref', ref: 'clients', required: true },
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'date', label: 'Invoice Date', type: 'date' },
      { key: 'dueDate', label: 'Due Date', type: 'date' },
      { key: 'amount', label: 'Amount (excl. GST)', type: 'money', required: true },
      { key: 'gstPct', label: 'GST %', type: 'number', default: 18 },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue'] },
      { key: 'notes', label: 'Notes / Milestone', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const ExpensesPage = () => (
  <ResourcePage
    module="expenses"
    singular="Expense"
    collection="expenses"
    title="Expenses"
    desc="Project-wise cost capture with approval before reimbursement."
    searchKeys={['category', 'billNo', 'submittedBy', 'remarks']}
    statusField="status"
    approve={{ from: ['Pending'], to: 'Approved' }}
    filters={[
      { key: 'status', label: 'Status', options: ['Pending', 'Approved', 'Reimbursed', 'Rejected'] },
      { key: 'category', label: 'Category', options: ['Material', 'Labour', 'Equipment Rental', 'Site Expense', 'Travel', 'Office', 'Professional Fees', 'Other'] },
    ]}
    stats={(rows) => [
      { icon: Wallet, label: 'This Month', value: inr(rows.filter((r) => r.date >= monthOffset(0).slice(0, 10)).reduce((s, r) => s + (r.amount || 0), 0)), tone: 'indigo' },
      { icon: Clock, label: 'Pending Approval', value: inr(rows.filter((r) => r.status === 'Pending').reduce((s, r) => s + (r.amount || 0), 0)), sub: rows.filter((r) => r.status === 'Pending').length + ' bills', tone: 'amber' },
      { icon: IndianRupee, label: 'Total (All)', value: inr(rows.reduce((s, r) => s + (r.amount || 0), 0)), tone: 'blue' },
      { icon: AlertTriangle, label: 'Rejected', value: rows.filter((r) => r.status === 'Rejected').length, tone: 'red' },
    ]}
    columns={[
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'projectId', label: 'Project', render: (r) => (r.projectId ? db.find('projects', r.projectId)?.name || '—' : 'Head Office') },
      { key: 'category', label: 'Category', render: (r) => <Badge tone="violet">{r.category}</Badge> },
      { key: 'vendorId', label: 'Vendor', render: (r) => (r.vendorId ? db.find('vendors', r.vendorId)?.name || '—' : '—') },
      { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{inr(r.amount)}</span> },
      { key: 'paymentMode', label: 'Mode' },
      { key: 'submittedBy', label: 'By' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'date', label: 'Expense Date', type: 'date', required: true },
      { key: 'projectId', label: 'Project (blank = Head Office)', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'category', label: 'Category', type: 'select', options: ['Material', 'Labour', 'Equipment Rental', 'Site Expense', 'Travel', 'Office', 'Professional Fees', 'Other'], required: true },
      { key: 'vendorId', label: 'Vendor / Payee', type: 'ref', ref: 'vendors' },
      { key: 'amount', label: 'Amount', type: 'money', required: true },
      { key: 'paymentMode', label: 'Payment Mode', type: 'select', options: ['Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque', 'Credit Card'] },
      { key: 'billNo', label: 'Bill / Voucher No' },
      { key: 'submittedBy', label: 'Submitted By', type: 'select', optionsFn: () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name) },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Reimbursed', 'Rejected'] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const PaymentsPage = () => (
  <ResourcePage
    module="payments"
    singular="Payment"
    collection="payments"
    title="Payments"
    desc="Money in, money out — single register for all treasury movements."
    searchKeys={['party', 'reference', 'mode']}
    statusField="status"
    filters={[
      { key: 'direction', label: 'Direction', options: ['Received', 'Made'] },
      { key: 'mode', label: 'Mode', options: ['NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash'] },
    ]}
    stats={(rows) => [
      { icon: TrendingUp, label: 'Received', value: inr(rows.filter((r) => r.direction === 'Received').reduce((s, r) => s + (r.amount || 0), 0)), tone: 'green' },
      { icon: Banknote, label: 'Paid Out', value: inr(rows.filter((r) => r.direction === 'Made').reduce((s, r) => s + (r.amount || 0), 0)), tone: 'red' },
      { icon: IndianRupee, label: 'Net Position', value: inr(rows.reduce((s, r) => s + (r.direction === 'Received' ? r.amount || 0 : -(r.amount || 0)), 0)), tone: 'indigo' },
      { icon: Clock, label: 'Pending Clearance', value: rows.filter((r) => r.status === 'Pending').length, tone: 'amber' },
    ]}
    columns={[
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'direction', label: 'Type', render: (r) => <Badge tone={r.direction === 'Received' ? 'green' : 'red'}>{r.direction === 'Received' ? '↓ Received' : '↑ Made'}</Badge> },
      { key: 'party', label: 'Party', render: (r) => <span className="font-medium text-slate-800">{r.party}</span> },
      { key: 'against', label: 'Against' },
      { key: 'reference', label: 'Reference' },
      { key: 'amount', label: 'Amount', render: (r) => <span className={r.direction === 'Received' ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{r.direction === 'Received' ? '+' : '−'}{inr(r.amount)}</span> },
      { key: 'mode', label: 'Mode' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'date', label: 'Payment Date', type: 'date', required: true },
      { key: 'direction', label: 'Direction', type: 'select', options: ['Received', 'Made'], required: true },
      { key: 'party', label: 'Party Name', required: true },
      { key: 'against', label: 'Against', type: 'select', options: ['Invoice', 'Purchase Order', 'Expense', 'Payroll', 'Advance', 'Other'] },
      { key: 'reference', label: 'Reference / Txn ID' },
      { key: 'amount', label: 'Amount', type: 'money', required: true },
      { key: 'mode', label: 'Mode', type: 'select', options: ['NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Cleared', 'Bounced'] },
    ]}
  />
)
