# ERP Competitive Analysis → Feature Mapping for AURA ERP

Study of **RDash.ai, SAP Ariba, Odoo, Zoho, and NWAY ERP** and how their best ideas map into this build.

## 1. RDash.ai (construction & interior-fitout SaaS)
What it is known for: DPR & progress reports, site survey capture, activity scheduling, design version control, BOQ & change orders, procurement + finance on one platform, approval hierarchies, AI copilot for margin-leak detection.

**Adopted here:**
- DPR module (Site Progress — manpower, work done, hindrances, PM approval flow)
- Drawing register with revision control (Draft → In Review → Approved → Superseded)
- Budget / BOQ heads with estimated-vs-actual and variance → the "margin leak" visibility
- Material Request → Approval → PO → GRN chain (approval hierarchy)
- Milestone-based billing visible per project (Project workspace → Billing tab)

## 2. SAP Ariba (procurement & supplier management)
What it is known for: supplier lifecycle, PO discipline, spend under management, compliance.

**Adopted here:**
- Vendor master with categories, ratings, and **On Hold / Blacklisted** states
- Strict PO register with payment terms, delivery tracking (Sent → Confirmed → Partially Received → Received)
- Vendor-spend analytics on Reports page
- GRN with QC gate (nothing enters stock without inspection)

## 3. Odoo (modular open ERP)
What it is known for: modular apps that the admin switches on/off, clean role-based access, integrated CRM→Sales→Inventory→Accounting.

**Adopted here:**
- **Module Manager** — admin toggles any module off for the whole org (Odoo's apps model)
- **Roles & Permissions matrix** with 5 actions per module (view/create/edit/delete/approve)
- CRM → Quotation → Project → Procurement → Invoice chain mirroring Odoo's flows
- Audit trail on every record mutation

## 4. Zoho (suite breadth: Books/People/Recruit/Analytics)
What it is known for: accessible finance (GST-ready invoicing), HR suite, analytics.

**Adopted here:**
- GST-ready invoices (18% GST, totals auto-computed, due-date/overdue tracking)
- Expense claims with approve → reimburse flow
- HR suite: employees, attendance, leave approval, payroll with net-pay calculation
- Reports & Analytics page with exportable CSVs

## 5. NWAY ERP (construction-specific ERP, India)
What it is known for: job costing, subcontractor billing, labour management, equipment/machinery tracking, site & quality/safety modules, multi-site role-based dashboards.

**Adopted here:**
- Job costing via budget heads + project spend tracking
- Subcontractor & labour agency register with contract value / paid / outstanding
- Assets & equipment register with custodian, condition, idle/maintenance states
- Quality control stage checks + Safety (HSE) incident workflow
- Role-based dashboards and **"assigned-only" data scope** for site staff

## Gaps deliberately left for the backend phase
- Multi-company / multi-branch, GST e-invoice & e-way bill APIs
- Attendance biometric integration, actual payroll statutory filings (PF/ESI/TDS)
- File/image storage for drawings & documents (currently metadata-only)
- Notifications via email/WhatsApp, mobile app wrappers
- AI copilot (anomaly detection on cost/schedule) — data model is already structured for it
