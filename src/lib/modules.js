import {
  LayoutDashboard, BarChart3, Target, FileText, Users, Building2, ClipboardList, HardHat,
  Handshake, CalendarCheck, ClipboardCheck, ShieldAlert, DraftingCompass, Calculator,
  Truck, ShoppingCart, FileCheck, Package, Warehouse, Wallet, ReceiptIndianRupee, Banknote,
  UsersRound, CalendarDays, Plane, BadgeIndianRupee, Wrench, FolderOpen,
  Layers, UserCog, ShieldCheck, ScrollText, Settings, PieChart,
} from 'lucide-react'

// Every module in the system. Admin controls enable/disable + role permissions for each.
export const MODULES = [
  // Overview
  { id: 'dashboard', name: 'Dashboard', group: 'Overview', icon: LayoutDashboard, path: '/' },
  { id: 'reports', name: 'Reports & Analytics', group: 'Overview', icon: BarChart3, path: '/reports' },
  // Sales / CRM
  { id: 'leads', name: 'Enquiries & Leads', group: 'Sales / CRM', icon: Target, path: '/crm/leads' },
  { id: 'quotations', name: 'Quotations', group: 'Sales / CRM', icon: FileText, path: '/crm/quotations' },
  { id: 'clients', name: 'Clients', group: 'Sales / CRM', icon: Users, path: '/crm/clients' },
  // Projects
  { id: 'projects', name: 'Projects', group: 'Projects & Execution', icon: Building2, path: '/projects' },
  { id: 'tasks', name: 'Tasks & Milestones', group: 'Projects & Execution', icon: ClipboardList, path: '/projects/tasks' },
  { id: 'subcontractors', name: 'Subcontractors', group: 'Projects & Execution', icon: Handshake, path: '/projects/subcontractors' },
  { id: 'dailyLogs', name: 'Site Progress (DPR)', group: 'Projects & Execution', icon: CalendarCheck, path: '/site/daily-logs' },
  { id: 'qualityChecks', name: 'Quality Control', group: 'Projects & Execution', icon: ClipboardCheck, path: '/site/quality' },
  { id: 'safetyIncidents', name: 'Safety / HSE', group: 'Projects & Execution', icon: ShieldAlert, path: '/site/safety' },
  // Design & Estimation
  { id: 'drawings', name: 'Drawings & Designs', group: 'Design & Estimation', icon: DraftingCompass, path: '/design/drawings' },
  { id: 'budgetHeads', name: 'Budget / BOQ Heads', group: 'Design & Estimation', icon: Calculator, path: '/design/budget' },
  // Procurement & Inventory
  { id: 'vendors', name: 'Vendors', group: 'Procurement & Inventory', icon: Truck, path: '/procurement/vendors' },
  { id: 'materialRequests', name: 'Material Requests', group: 'Procurement & Inventory', icon: ShoppingCart, path: '/procurement/requests' },
  { id: 'purchaseOrders', name: 'Purchase Orders', group: 'Procurement & Inventory', icon: FileCheck, path: '/procurement/purchase-orders' },
  { id: 'grns', name: 'Goods Received (GRN)', group: 'Procurement & Inventory', icon: Package, path: '/procurement/grn' },
  { id: 'materials', name: 'Materials', group: 'Procurement & Inventory', icon: Warehouse, path: '/inventory/materials' },
  { id: 'stockTxns', name: 'Stock Movements', group: 'Procurement & Inventory', icon: Layers, path: '/inventory/stock' },
  // Finance
  { id: 'invoices', name: 'Invoices', group: 'Finance', icon: ReceiptIndianRupee, path: '/finance/invoices' },
  { id: 'expenses', name: 'Expenses', group: 'Finance', icon: Wallet, path: '/finance/expenses' },
  { id: 'payments', name: 'Payments', group: 'Finance', icon: Banknote, path: '/finance/payments' },
  // HR
  { id: 'employees', name: 'Employees', group: 'People / HR', icon: UsersRound, path: '/hr/employees' },
  { id: 'attendance', name: 'Attendance', group: 'People / HR', icon: CalendarDays, path: '/hr/attendance' },
  { id: 'leaves', name: 'Leave Requests', group: 'People / HR', icon: Plane, path: '/hr/leaves' },
  { id: 'payrolls', name: 'Payroll', group: 'People / HR', icon: BadgeIndianRupee, path: '/hr/payroll' },
  // Assets & Docs
  { id: 'assets', name: 'Assets & Equipment', group: 'Assets & Documents', icon: Wrench, path: '/assets' },
  { id: 'documents', name: 'Documents', group: 'Assets & Documents', icon: FolderOpen, path: '/documents' },
  // Admin (only visible to Admin role)
  { id: 'adminModules', name: 'Module Manager', group: 'Administration', icon: Layers, path: '/admin/modules', adminOnly: true },
  { id: 'adminUsers', name: 'Users', group: 'Administration', icon: UserCog, path: '/admin/users', adminOnly: true },
  { id: 'adminRoles', name: 'Roles & Permissions', group: 'Administration', icon: ShieldCheck, path: '/admin/roles', adminOnly: true },
  { id: 'adminAudit', name: 'Audit Log', group: 'Administration', icon: ScrollText, path: '/admin/audit', adminOnly: true },
  { id: 'adminSettings', name: 'Settings', group: 'Administration', icon: Settings, path: '/admin/settings', adminOnly: true },
]

export const MODULE_GROUPS = [...new Set(MODULES.map((m) => m.group))]

export const moduleById = (id) => MODULES.find((m) => m.id === id)

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve']

export const ACTION_LABELS = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete', approve: 'Approve' }
