import React from 'react'
import ResourcePage from '../../components/ResourcePage.jsx'
import { db } from '../../lib/db.js'
import { Warehouse, Layers, Package, AlertTriangle, IndianRupee, TrendingDown, ArrowDownToLine } from 'lucide-react'
import { Badge } from '../../components/ui.jsx'
import { inr, fmtDate } from '../../lib/utils.js'

const projectOptions = () => db.list('projects').map((p) => p.name)
const empOptions = () => db.list('employees').filter((e) => e.status === 'Active').map((e) => e.name)
const WAREHOUSES = ['Central Warehouse — Bhiwandi', 'Site — TCS Powai', 'Site — Nykaa Bandra', 'Site — Alibaug Villa', 'Site — Amazon Bhiwandi']
const CATEGORIES = ['Ceiling & Drywall', 'Carpentry', 'Electrical', 'Flooring', 'Painting', 'Civil', 'Façade', 'IT / ELV', 'Glass', 'Plumbing', 'Hardware', 'Other']

export const MaterialsPage = () => (
  <ResourcePage
    module="materials"
    singular="Material"
    collection="materials"
    title="Materials & Stock"
    desc="Stock master with min-level alerts — never run a site short again."
    searchKeys={['sku', 'name', 'category', 'warehouse']}
    filters={[
      { key: 'category', label: 'Category', options: CATEGORIES },
      { key: 'warehouse', label: 'Location', options: WAREHOUSES },
    ]}
    stats={(rows) => [
      { icon: Package, label: 'Total SKUs', value: rows.length, tone: 'indigo' },
      { icon: IndianRupee, label: 'Stock Value', value: inr(rows.reduce((s, r) => s + (r.rate || 0) * (r.currentStock || 0), 0)), tone: 'blue' },
      { icon: AlertTriangle, label: 'Low Stock', value: rows.filter((r) => (r.currentStock || 0) <= (r.minStock || 0) && (r.currentStock || 0) > 0).length, tone: 'amber' },
      { icon: TrendingDown, label: 'Out of Stock', value: rows.filter((r) => (r.currentStock || 0) <= 0).length, tone: 'red' },
    ]}
    columns={[
      { key: 'sku', label: 'SKU', render: (r) => <span className="font-mono text-xs font-semibold text-brand-700">{r.sku}</span> },
      { key: 'name', label: 'Material', render: (r) => <span className="font-semibold text-slate-800">{r.name}</span> },
      { key: 'category', label: 'Category' },
      { key: 'unit', label: 'Unit' },
      { key: 'rate', label: 'Rate', render: (r) => inr(r.rate) },
      { key: 'currentStock', label: 'In Stock', render: (r) => { const low = (r.currentStock || 0) <= (r.minStock || 0); return <span className={low ? 'font-bold text-rose-600' : 'font-semibold text-slate-700'}>{r.currentStock} {low ? '⚠' : ''}</span> } },
      { key: 'minStock', label: 'Min Level' },
      { key: 'value', label: 'Stock Value', render: (r) => inr((r.rate || 0) * (r.currentStock || 0)), sortable: false, csvRaw: (r) => (r.rate || 0) * (r.currentStock || 0) },
      { key: 'warehouse', label: 'Location' },
    ]}
    fields={[
      { key: 'sku', label: 'SKU Code', required: true },
      { key: 'name', label: 'Material Name', required: true },
      { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
      { key: 'unit', label: 'Unit', type: 'select', options: ['nos', 'sqm', 'sqft', 'sheet', 'box', 'bag', 'ltr', 'kg', 'set', 'roll', 'brass'] },
      { key: 'rate', label: 'Rate (₹/unit)', type: 'money' },
      { key: 'currentStock', label: 'Current Stock', type: 'number' },
      { key: 'minStock', label: 'Minimum Stock Level', type: 'number' },
      { key: 'warehouse', label: 'Warehouse / Site Location', type: 'select', options: [...WAREHOUSES, 'Other'] },
    ]}
  />
)

export const StockTxnsPage = () => (
  <ResourcePage
    module="stockTxns"
    singular="Stock Entry"
    collection="stockTxns"
    title="Stock Movements"
    desc="Every inward, site issue, return and transfer — full material traceability."
    searchKeys={['type', 'remarks', 'handledBy']}
    filters={[{ key: 'type', label: 'Type', options: ['Inward', 'Issue to Site', 'Return', 'Transfer', 'Adjustment'] }]}
    stats={(rows) => [
      { icon: ArrowDownToLine, label: 'Inward (30d)', value: rows.filter((r) => r.type === 'Inward').reduce((s, r) => s + (r.qty || 0), 0), tone: 'green' },
      { icon: Package, label: 'Issued to Sites', value: rows.filter((r) => r.type === 'Issue to Site').reduce((s, r) => s + (r.qty || 0), 0), tone: 'indigo' },
      { icon: Layers, label: 'Total Entries', value: rows.length, tone: 'blue' },
      { icon: Warehouse, label: 'This Month', value: rows.filter((r) => r.date >= new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)).length, tone: 'amber' },
    ]}
    columns={[
      { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
      { key: 'type', label: 'Type', render: (r) => <Badge tone={r.type === 'Inward' ? 'green' : r.type === 'Issue to Site' ? 'indigo' : r.type === 'Return' ? 'amber' : r.type === 'Adjustment' ? 'red' : 'blue'}>{r.type}</Badge> },
      { key: 'materialId', label: 'Material', render: (r) => <span className="font-medium text-slate-700">{db.find('materials', r.materialId)?.name || '—'}</span>, csvRaw: (r) => db.find('materials', r.materialId)?.name || '' },
      { key: 'qty', label: 'Qty', render: (r) => <span className={r.qty < 0 ? 'font-bold text-rose-600' : 'font-semibold'}>{r.qty}</span> },
      { key: 'projectId', label: 'Project', render: (r) => (r.projectId ? db.find('projects', r.projectId)?.name || '—' : '—') },
      { key: 'warehouse', label: 'Location' },
      { key: 'handledBy', label: 'Handled By' },
      { key: 'remarks', label: 'Remarks', render: (r) => <div className="max-w-[200px] truncate text-slate-400">{r.remarks || '—'}</div>, sortable: false },
    ]}
    fields={[
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'type', label: 'Movement Type', type: 'select', options: ['Inward', 'Issue to Site', 'Return', 'Transfer', 'Adjustment'], required: true },
      { key: 'materialId', label: 'Material', type: 'ref', ref: 'materials', refDisplay: (m) => `${m.name} (${m.sku})`, required: true },
      { key: 'qty', label: 'Quantity (−ve for adjustment)', type: 'number', required: true },
      { key: 'projectId', label: 'Project / Site', type: 'ref', ref: 'projects', refDisplay: (p) => `${p.code} · ${p.name}` },
      { key: 'warehouse', label: 'Warehouse', type: 'select', options: [...WAREHOUSES, 'Other'] },
      { key: 'handledBy', label: 'Handled By', type: 'select', optionsFn: empOptions },
      { key: 'remarks', label: 'Remarks', type: 'textarea', full: true, rows: 2 },
    ]}
  />
)
