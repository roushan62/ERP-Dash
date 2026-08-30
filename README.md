# AURA ERP — Interior Fitout & Construction Management Suite

A complete, production-style **frontend ERP** for interior fit-out and construction companies. Every department gets its own module, and the **Admin controls everything** — which modules exist, who sees what, who can create/edit/delete/approve, and how much data each person can view.

> **Backend is intentionally pluggable** — all data currently lives in a swappable local data layer (`src/lib/db.js`, localStorage-backed). Replace the CRUD functions inside `db.js` with API calls when the backend is built, and the entire UI keeps working unchanged.

## 🚀 Run

```bash
npm install
npm run dev      # http://localhost:5173
```

## 🔐 Demo Login (password: `123456`)

| User | Role | What they can do |
|---|---|---|
| admin@aura.in | **Admin** | Everything — modules, users, roles, permissions, settings |
| rajesh@aura.in | Management / Director | Full visibility + approvals |
| amit@aura.in | Project Manager | Projects, tasks, sites, procurement requests |
| neha@aura.in | Sales | CRM, quotations, clients only |
| kavita@aura.in | Accounts | Invoices, expenses, payments, payroll |
| rohit@aura.in | HR | Employees, attendance, leaves, payroll |
| sana@aura.in | Purchase / Store | Vendors, POs, GRN, materials, stock |
| vikas@aura.in | Site Engineer | DPR, QC, safety — **only assigned data** |
| anjali@aura.in | Lead Designer | Drawings & design workflow |

## 🧩 Modules (30+)

- **Overview** — Dashboard (KPIs, revenue vs expense, pipeline, deadlines, live activity), Reports & Analytics (P&L trend, budget vs actual by BOQ head, expense mix, vendor commitments, lead sources, CSV exports)
- **Sales / CRM** — Enquiries & Leads, Quotations (margin tracking), Clients
- **Projects & Execution** — Projects (workspace per project), Tasks & Milestones, Subcontractors, Site Progress DPR, Quality Control, Safety / HSE
- **Design & Estimation** — Drawings with revision control, Budget / BOQ heads (estimated vs actual, variance)
- **Procurement & Inventory** — Vendors (rating/blacklist), Material Requests (MRN approval flow), Purchase Orders, GRN (QC-gated), Materials with min-stock alerts, Stock movements
- **Finance** — Invoices (GST, ageing), Expenses (approval + reimbursement), Payments (in/out register)
- **People / HR** — Employees, Attendance, Leaves (approve flow), Payroll (net pay calc)
- **Assets & Documents** — Equipment register, Documents & compliance with expiry alerts
- **Administration (Admin only)** — Module Manager (switch any module off company-wide), Users (role + data scope + active), Roles & Permissions matrix (view/create/edit/delete/approve per module per role), Audit Log (every action), Settings (company profile, brand colour, JSON backup, reset)

## 🛡️ Admin Control Model

1. **Module Manager** — admin decides which modules exist for the company.
2. **Roles & Permissions** — per role × per module × 5 actions (view / create / edit / delete / approve).
3. **Users** — each person gets a role + a **data scope**: *Full company data* or *Only assigned to me*.
4. **Audit log** — every create/update/delete/login is recorded automatically.

## 🏗️ Tech

React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 (hash) · Recharts · lucide-react

```
src/
  lib/        db.js (data layer), seed.js (demo data), permissions.js, modules.js, utils.js
  store/      AppContext (auth, toasts, confirm dialogs)
  components/ Layout (sidebar/topbar), ResourcePage (generic CRUD engine), ui.jsx (design system)
  pages/      Dashboard, Reports, ProjectDetail, Login, modules/*, admin/*
```

**Config-driven modules:** every module page is a declarative config (columns, fields, filters, stats, approve-flow) rendered by `ResourcePage` — so adding new modules or hooking a backend is fast and consistent.
