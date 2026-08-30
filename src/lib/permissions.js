import { MODULES, PERMISSION_ACTIONS } from './modules.js'

// role helpers
export const ROLES = [
  { id: 'admin', name: 'Admin', locked: true, desc: 'Full control of everything — modules, users, permissions, data' },
  { id: 'management', name: 'Management / Director', desc: 'Sees everything, approves, but limited day-to-day data entry' },
  { id: 'pm', name: 'Project Manager', desc: 'Runs projects, tasks, sites, procurement requests' },
  { id: 'sales', name: 'Sales Manager', desc: 'CRM, quotations and client relationships' },
  { id: 'accounts', name: 'Accounts Head', desc: 'Invoices, expenses, payments, payroll processing' },
  { id: 'hr', name: 'HR Manager', desc: 'Employees, attendance, leaves, payroll' },
  { id: 'procurement', name: 'Purchase / Store Head', desc: 'Vendors, POs, GRN, materials and stock' },
  { id: 'site', name: 'Site Engineer', desc: 'Daily progress, quality, safety, material issue' },
  { id: 'designer', name: 'Lead Designer', desc: 'Drawings, design revisions, project visibility' },
]

const ALL = 'all'
const V = 'v'
const VCA = 'a' // view create approve
const VCE = 'e' // view create edit
const VCED = 'd' // view create edit delete
const NONE = ''

const f = (str) => {
  const p = {}
  p.view = str === ALL || str.includes('v')
  p.create = str === ALL || str.includes('c')
  p.edit = str === ALL || str.includes('e')
  p.delete = str === ALL || str.includes('d')
  p.approve = str === ALL || str.includes('a')
  return p
}

// Default permission template per role: { moduleId: flag }
const T = {
  admin: ALL,
  management: ALL,
  pm: {
    dashboard: ALL, reports: V, leads: V, quotations: V, clients: V,
    projects: VCED, tasks: VCED, subcontractors: VCE, dailyLogs: VCED, qualityChecks: VCED, safetyIncidents: VCED,
    drawings: VCE, budgetHeads: VCE, vendors: V, materialRequests: VCA, purchaseOrders: V, grns: V,
    materials: V, stockTxns: V, invoices: V, expenses: VCA, payments: NONE,
    employees: V, attendance: V, leaves: V, payrolls: NONE, assets: V, documents: V,
  },
  sales: {
    dashboard: ALL, reports: V, leads: VCED, quotations: VCED, clients: VCED,
    projects: V, tasks: V, drawings: V, dailyLogs: NONE,
  },
  accounts: {
    dashboard: ALL, reports: V, projects: V, clients: V, vendors: V,
    purchaseOrders: V, grns: V, materials: V, invoices: VCED, expenses: VCED, payments: VCED,
    employees: V, payrolls: VCE, attendance: V, leaves: V, documents: V, budgetHeads: V,
  },
  hr: {
    dashboard: ALL, reports: V, employees: VCED, attendance: VCED, leaves: VCA, payrolls: VCE,
    projects: V, assets: V, documents: V, invoices: NONE, expenses: NONE,
  },
  procurement: {
    dashboard: ALL, reports: V, vendors: VCED, materialRequests: VCE, purchaseOrders: VCED, grns: VCED,
    materials: VCED, stockTxns: VCED, projects: V, budgetHeads: V, expenses: VCA, assets: V, subcontractors: V,
  },
  site: {
    dashboard: ALL, projects: V, tasks: VCE, dailyLogs: VCE, qualityChecks: VCE, safetyIncidents: VCE,
    materialRequests: VCE, stockTxns: VCE, materials: V, drawings: V, assets: VCE, subcontractors: V,
  },
  designer: {
    dashboard: ALL, projects: V, tasks: V, drawings: VCED, leads: V, quotations: V, clients: V, documents: V,
  },
}

export function buildDefaultPermissions() {
  const perms = {}
  for (const role of ROLES) {
    perms[role.id] = {}
    const tmpl = typeof T[role.id] === 'string' ? null : T[role.id]
    for (const m of MODULES) {
      if (m.adminOnly) continue
      if (typeof T[role.id] === 'string') perms[role.id][m.id] = f(T[role.id])
      else perms[role.id][m.id] = f(tmpl[m.id] ?? NONE)
    }
  }
  return perms
}

export function makePerm(flags) {
  return {
    view: !!flags.view, create: !!flags.create, edit: !!flags.edit, delete: !!flags.delete, approve: !!flags.approve,
  }
}

export function can(perms, role, moduleId, action) {
  if (role === 'admin') return true
  const p = perms?.[role]?.[moduleId]
  if (!p) return false
  return !!p[action]
}

// Which owner-like fields we check for "assigned only" data scope
const OWNER_KEYS = ['assignedTo', 'manager', 'createdBy', 'requestedBy', 'reportedBy', 'inspectedBy', 'submittedBy', 'approvedBy', 'handledBy', 'uploadedBy', 'projectManager']

export function filterByScope(rows, user) {
  if (!user || user.role === 'admin' || user.scope !== 'assigned') return rows
  const name = user.name
  return rows.filter((r) => OWNER_KEYS.some((k) => r[k] === name) || r._owner === user.email)
}
