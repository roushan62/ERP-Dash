import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { Truck, ShoppingCart, FileCheck, Package, IndianRupee, Clock, AlertTriangle, CheckCircle2, Star } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { inr, fmtDate } from '../../lib/utils.js'

const projectOptions = () => db.list('projects').map((p) => p.name)
const vendorOptions = () => db.list('vendors').filter((v) => v.status === 'Active').map((v) => v.name)
const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)
const pname = (id) => db.find('projects', id)?.name || '—'
const vname = (id) => db.find('vendors', id)?.name || '—'

export const VendorsPage = () => (
  <ResourcePage
    module="vendors"
    singular="Vendor"
    collection="vendors"
    title="Vendors & Suppliers"
    desc="Vendor master with category, rating and blacklist control."
    searchKeys={['name', 'category', 'contactPerson', 'phone', 'city', 'gstin']}
    statusField="status"
    filters={[{ key: 'category', label: 'Category', options: ['Plywood & Laminates', 'Ceiling & Drywall', 'HVAC', 'Electrical', 'Glass & Glazing', 'Furniture & Joinery', 'Firefighting', 'Painting & Finishes', 'Flooring', 'Manpower / Labour', 'Civil', 'Other'] }]}
    stats={(rows) => [
      { icon: Truck, label: 'Total Vendors', value: rows.length, tone: 'indigo' },
      { icon: CheckCircle2, label: 'Active', value: rows.filter((r) => r.status === 'Active').length, tone: 'green' },
      { icon: AlertTriangle, label: 'On Hold / Blacklisted', value: rows.filter((r) => r.status !== 'Active').length, tone: 'red' },
      { icon: Star, label: 'Avg Rating', value: rows.length ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1) + ' / 5' : '—', tone: 'amber' },
      { icon: IndianRupee, label: 'PO Value (All)', value: inr(db.list('purchaseOrders').reduce((s, p) => s + (p.value || 0), 0)), tone: 'blue' },
    ]}
    columns={[
      { key: 'name', label: 'Vendor', render: (r) => (<div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-400">{r.contactPerson} · {r.phone}</div></div>), csvRaw: (r) => r.name },
      { key: 'category', label: 'Category' },
      { key: 'city', label: 'City' },
      { key: 'gstin', label: 'GSTIN', render: (r) => <span className="font-mono text-xs">{r.gstin || '—'}</span> },
      { key: 'rating', label: 'Rating', render: (r) => (<span className="inline-flex items-center gap-1 font-semibold">{(r.rating || 0).toFixed(1)}<Star size={12} className="fill-amber-400 text-amber-400" /></span>) },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'name', label: 'Vendor Name', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Plywood & Laminates', 'Ceiling & Drywall', 'HVAC', 'Electrical', 'Glass & Glazing', 'Furniture & Joinery', 'Firefighting', 'Painting & Finishes', 'Flooring', 'Manpower / Labour', 'Civil', 'Other'] },
      { key: 'contactPerson', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'city', label: 'City' },
      { key: 'gstin', label: 'GSTIN' },
      { key: 'rating', label: 'Rating (0-5)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Hold', 'Blacklisted'] },
      { key: 'remarks', label: 'Notes', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const MaterialRequestsPage = () => (
  <ResourcePage
    module="materialRequests"
    singular="Material Request"
    collection="materialRequests"
    title="Material Requests (MRN)"
    desc="Site indents → approval → PO. Nothing gets purchased without a trail."
    searchKeys={['reqNo', 'items', 'requestedBy', 'remarks']}
    statusField="status"
    approve={{ from: ['Pending Approval'], to: 'Approved' }}
    filters={[
      { key: 'status', label: 'Status', options: ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Delivered', 'Rejected'] },
      { key: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Critical'] },
    ]}
    stats={(rows) => [
      { icon: ShoppingCart, label: 'Open Requests', value: rows.filter((r) => ['Pending Approval', 'Approved'].includes(r.status)).length, tone: 'indigo' },
      { icon: Clock, label: 'Pending My Approval', value: rows.filter((r) => r.status === 'Pending Approval').length, tone: 'amber' },
      { icon: AlertTriangle, label: 'Critical', value: rows.filter((r) => r.priority === 'Critical' && !['Delivered', 'Rejected'].includes(r.status)).length, tone: 'red' },
      { icon: CheckCircle2, label: 'Delivered', value: rows.filter((r) => r.status === 'Delivered').length, tone: 'green' },
    ]}
    columns={[
      { key: 'reqNo', label: 'Req No', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.reqNo}</span> },
      { key: 'projectId', label: 'Project', render: (r) => <span className="font-medium text-slate-700">{pname(r.projectId)}</span> },
      { key: 'items', label: 'Items Required', render: (r) => <div className="max-w-[260px] truncate text-slate-600" title={r.items}>{r.items}</div>, sortable: false },
      { key: 'priority', label: 'Priority', render: (r) => <Badge tone={r.priority === 'Critical' ? 'red' : r.priority === 'High' ? 'amber' : 'slate'}>{r.priority}</Badge> },
      { key: 'requiredBy', label: 'Required By', render: (r) => fmtDate(r.requiredBy) },
      { key: 'requestedBy', label: 'Requested By' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'reqNo', label: 'Request No', required: true, placeholder: 'MR-26-0XX' },
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}`, required: true },
      { key: 'items', label: 'Items & Quantities', type: 'textarea', required: true, placeholder: 'Item — qty; Item — qty' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'requiredBy', label: 'Required By Date', type: 'date' },
      { key: 'requestedBy', label: 'Requested By', type: 'select', optionsFn: empOptions },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Pending Approval', 'Approved', 'Ordered', 'Delivered', 'Rejected'] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)

export const PurchaseOrdersPage = () => (
  <ResourcePage
    module="purchaseOrders"
    singular="Purchase Order"
    collection="purchaseOrders"
    title="Purchase Orders"
    desc="Every rupee committed to vendors — with delivery tracking and payment terms."
    searchKeys={['poNo', 'remarks', 'paymentTerms']}
    statusField="status"
    approve={{ from: ['Draft'], to: 'Sent' }}
    filters={[{ key: 'status', label: 'Status', options: ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'] }]}
    stats={(rows) => [
      { icon: FileCheck, label: 'Total POs', value: rows.length, tone: 'indigo' },
      { icon: IndianRupee, label: 'Committed Value', value: inr(rows.filter((r) => r.status !== 'Cancelled').reduce((s, r) => s + (r.value || 0), 0)), tone: 'blue' },
      { icon: Package, label: 'In Transit', value: rows.filter((r) => ['Sent', 'Confirmed'].includes(r.status)).length, tone: 'amber' },
      { icon: CheckCircle2, label: 'Received', value: rows.filter((r) => r.status === 'Received').length, tone: 'green' },
    ]}
    columns={[
      { key: 'poNo', label: 'PO No', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.poNo}</span> },
      { key: 'vendorId', label: 'Vendor', render: (r) => <span className="font-medium text-slate-700">{vname(r.vendorId)}</span> },
      { key: 'projectId', label: 'Project', render: (r) => <span className="text-slate-600">{pname(r.projectId)}</span> },
      { key: 'orderDate', label: 'Order Date', render: (r) => fmtDate(r.orderDate) },
      { key: 'expectedDelivery', label: 'Expected', render: (r) => fmtDate(r.expectedDelivery) },
      { key: 'value', label: 'Value', render: (r) => <span className="font-semibold">{inr(r.value)}</span> },
      { key: 'paymentTerms', label: 'Terms' },
      { key: 'status', label: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'poNo', label: 'PO Number', required: true, placeholder: 'PO-26-0XX' },
      { key: 'vendorId', label: 'Vendor', type: 'ref', ref: 'vendors', required: true },
      { key: 'projectId', label: 'Project', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'orderDate', label: 'Order Date', type: 'date' },
      { key: 'expectedDelivery', label: 'Expected Delivery', type: 'date' },
      { key: 'value', label: 'PO Value', type: 'money', required: true },
      { key: 'paymentTerms', label: 'Payment Terms', type: 'select', options: ['Advance', '50% advance', '30 days credit', '45 days credit', '20% advance, 80% on delivery', '30% advance, 70% against delivery', 'On delivery', 'Weekly labour billing'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Confirmed', 'Partially Received', 'Received', 'Cancelled'] },
      { key: 'remarks', label: 'Item Details / Remarks', type: 'textarea', full: true },
    ]}
  />
)

export const GrnPage = () => (
  <ResourcePage
    module="grns"
    singular="GRN"
    collection="grns"
    title="Goods Received Notes (GRN)"
    desc="QC-gated material inward — nothing enters stock without inspection."
    searchKeys={['grnNo', 'poNo', 'items', 'inspectedBy', 'remarks']}
    statusField="status"
    filters={[{ key: 'qcStatus', label: 'QC Status', options: ['Pending', 'Passed', 'Failed', 'Rework'] }]}
    stats={(rows) => [
      { icon: Package, label: 'Total GRNs', value: rows.length, tone: 'indigo' },
      { icon: CheckCircle2, label: 'QC Passed', value: rows.filter((r) => r.qcStatus === 'Passed').length, tone: 'green' },
      { icon: Clock, label: 'QC Pending', value: rows.filter((r) => r.qcStatus === 'Pending').length, tone: 'amber' },
      { icon: AlertTriangle, label: 'Failed / Rework', value: rows.filter((r) => ['Failed', 'Rework'].includes(r.qcStatus)).length, tone: 'red' },
    ]}
    columns={[
      { key: 'grnNo', label: 'GRN No', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.grnNo}</span> },
      { key: 'poNo', label: 'Against PO', render: (r) => <span className="font-mono text-xs">{r.poNo}</span> },
      { key: 'vendorId', label: 'Vendor', render: (r) => vname(r.vendorId) },
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'items', label: 'Items', render: (r) => <div className="max-w-[240px] truncate" title={r.items}>{r.items}</div>, sortable: false },
      { key: 'qty', label: 'Qty' },
      { key: 'inspectedBy', label: 'Inspected By' },
      { key: 'qcStatus', label: 'QC', render: (r) => <Badge>{r.qcStatus}</Badge> },
      { key: 'status', label: 'Posted', render: (r) => <Badge tone={r.status === 'Posted' ? 'green' : 'amber'}>{r.status}</Badge> },
    ]}
    fields={[
      { key: 'grnNo', label: 'GRN Number', required: true, placeholder: 'GRN-26-0XX' },
      { key: 'poNo', label: 'Against PO No', type: 'select', optionsFn: () => db.list('purchaseOrders').map((p) => p.poNo) },
      { key: 'vendorId', label: 'Vendor', type: 'ref', ref: 'vendors', required: true },
      { key: 'date', label: 'Receipt Date', type: 'date' },
      { key: 'items', label: 'Items Received', type: 'textarea', required: true },
      { key: 'qty', label: 'Total Qty', type: 'number' },
      { key: 'inspectedBy', label: 'Inspected By', type: 'select', optionsFn: empOptions },
      { key: 'qcStatus', label: 'QC Result', type: 'select', options: ['Pending', 'Passed', 'Failed', 'Rework'] },
      { key: 'status', label: 'Stock Status', type: 'select', options: ['Draft', 'Posted'] },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)
