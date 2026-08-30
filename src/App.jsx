import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './store/AppContext.jsx'
import { sessionActive, db, useDbVersion, userCan } from './lib/db.js'
import { moduleById } from './lib/modules.js'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Reports from './pages/Reports.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import { AdminModulesPage, AdminUsersPage, AdminRolesPage, AdminAuditPage, AdminSettingsPage } from './pages/admin/AdminPages.jsx'
import { LeadsPage, QuotationsPage, ClientsPage } from './pages/modules/sales.jsx'
import { ProjectsPage, TasksPage, SubcontractorsPage } from './pages/modules/projects.jsx'
import { DrawingsPage, BudgetPage } from './pages/modules/design.jsx'
import { VendorsPage, MaterialRequestsPage, PurchaseOrdersPage, GrnPage } from './pages/modules/procurement.jsx'
import { MaterialsPage, StockTxnsPage } from './pages/modules/inventory.jsx'
import { InvoicesPage, ExpensesPage, PaymentsPage } from './pages/modules/finance.jsx'
import { EmployeesPage, AttendancePage, LeavesPage, PayrollPage } from './pages/modules/hr.jsx'
import { DailyLogsPage, QualityPage, SafetyPage } from './pages/modules/site.jsx'
import { AssetsPage, DocumentsPage } from './pages/modules/misc.jsx'
import { Button } from './components/ui.jsx'
import { ShieldX } from 'lucide-react'

function AccentSync({ children }) {
  useDbVersion()
  useEffect(() => {
    const accent = db.getState().meta?.accent || '#4f46e5'
    document.documentElement.style.setProperty('--brand', accent)
  })
  return children
}

function Guard({ children }) {
  const { user } = useApp()
  if (!sessionActive() || !user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function ModuleRoute({ moduleId, element }) {
  const enabled = db.list && (db.getState().meta.enabledModules || []).includes(moduleId)
  const allowed = userCan(moduleId, 'view')
  if (!enabled) return <NoAccess title="Module Disabled" message="The administrator has turned this module off for the entire organisation." />
  if (!allowed) return <NoAccess title="Access Restricted" message="Your role does not have view permission for this module. Contact your administrator if you need access." />
  return element
}

function NoAccess({ title, message }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-2xl bg-rose-50 p-4"><ShieldX className="text-rose-500" size={30} /></div>
      <h2 className="mt-4 text-lg font-bold text-slate-800">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
    </div>
  )
}

function Shell() {
  return (
    <AccentSync>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><ModuleRoute moduleId="dashboard" element={<Dashboard />} /></Guard>} />
        <Route path="/reports" element={<Guard><ModuleRoute moduleId="reports" element={<Reports />} /></Guard>} />
        <Route path="/projects/view/:id" element={<Guard><ProjectDetail /></Guard>} />
        <Route path="/crm/leads" element={<Guard><ModuleRoute moduleId="leads" element={<LeadsPage />} /></Guard>} />
        <Route path="/crm/quotations" element={<Guard><ModuleRoute moduleId="quotations" element={<QuotationsPage />} /></Guard>} />
        <Route path="/crm/clients" element={<Guard><ModuleRoute moduleId="clients" element={<ClientsPage />} /></Guard>} />
        <Route path="/projects" element={<Guard><ModuleRoute moduleId="projects" element={<ProjectsPage />} /></Guard>} />
        <Route path="/projects/tasks" element={<Guard><ModuleRoute moduleId="tasks" element={<TasksPage />} /></Guard>} />
        <Route path="/projects/subcontractors" element={<Guard><ModuleRoute moduleId="subcontractors" element={<SubcontractorsPage />} /></Guard>} />
        <Route path="/site/daily-logs" element={<Guard><ModuleRoute moduleId="dailyLogs" element={<DailyLogsPage />} /></Guard>} />
        <Route path="/site/quality" element={<Guard><ModuleRoute moduleId="qualityChecks" element={<QualityPage />} /></Guard>} />
        <Route path="/site/safety" element={<Guard><ModuleRoute moduleId="safetyIncidents" element={<SafetyPage />} /></Guard>} />
        <Route path="/design/drawings" element={<Guard><ModuleRoute moduleId="drawings" element={<DrawingsPage />} /></Guard>} />
        <Route path="/design/budget" element={<Guard><ModuleRoute moduleId="budgetHeads" element={<BudgetPage />} /></Guard>} />
        <Route path="/procurement/vendors" element={<Guard><ModuleRoute moduleId="vendors" element={<VendorsPage />} /></Guard>} />
        <Route path="/procurement/requests" element={<Guard><ModuleRoute moduleId="materialRequests" element={<MaterialRequestsPage />} /></Guard>} />
        <Route path="/procurement/purchase-orders" element={<Guard><ModuleRoute moduleId="purchaseOrders" element={<PurchaseOrdersPage />} /></Guard>} />
        <Route path="/procurement/grn" element={<Guard><ModuleRoute moduleId="grns" element={<GrnPage />} /></Guard>} />
        <Route path="/inventory/materials" element={<Guard><ModuleRoute moduleId="materials" element={<MaterialsPage />} /></Guard>} />
        <Route path="/inventory/stock" element={<Guard><ModuleRoute moduleId="stockTxns" element={<StockTxnsPage />} /></Guard>} />
        <Route path="/finance/invoices" element={<Guard><ModuleRoute moduleId="invoices" element={<InvoicesPage />} /></Guard>} />
        <Route path="/finance/expenses" element={<Guard><ModuleRoute moduleId="expenses" element={<ExpensesPage />} /></Guard>} />
        <Route path="/finance/payments" element={<Guard><ModuleRoute moduleId="payments" element={<PaymentsPage />} /></Guard>} />
        <Route path="/hr/employees" element={<Guard><ModuleRoute moduleId="employees" element={<EmployeesPage />} /></Guard>} />
        <Route path="/hr/attendance" element={<Guard><ModuleRoute moduleId="attendance" element={<AttendancePage />} /></Guard>} />
        <Route path="/hr/leaves" element={<Guard><ModuleRoute moduleId="leaves" element={<LeavesPage />} /></Guard>} />
        <Route path="/hr/payroll" element={<Guard><ModuleRoute moduleId="payrolls" element={<PayrollPage />} /></Guard>} />
        <Route path="/assets" element={<Guard><ModuleRoute moduleId="assets" element={<AssetsPage />} /></Guard>} />
        <Route path="/documents" element={<Guard><ModuleRoute moduleId="documents" element={<DocumentsPage />} /></Guard>} />
        <Route path="/admin/modules" element={<Guard><ModuleRoute moduleId="adminModules" element={<AdminModulesPage />} /></Guard>} />
        <Route path="/admin/users" element={<Guard><ModuleRoute moduleId="adminUsers" element={<AdminUsersPage />} /></Guard>} />
        <Route path="/admin/roles" element={<Guard><ModuleRoute moduleId="adminRoles" element={<AdminRolesPage />} /></Guard>} />
        <Route path="/admin/audit" element={<Guard><ModuleRoute moduleId="adminAudit" element={<AdminAuditPage />} /></Guard>} />
        <Route path="/admin/settings" element={<Guard><ModuleRoute moduleId="adminSettings" element={<AdminSettingsPage />} /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AccentSync>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppProvider>
  )
}
