# VyaparBooks — Free Accounting & Finance Software

**VyaparBooks** is a free, open-source, offline-first desktop accounting application for Indian MSMEs, vendors, contractors and small businesses.

- 100% Free Forever (MIT License)
- Offline desktop app — no internet required after download
- Windows (primary), macOS & Linux (secondary)
- Local SQLite database — you own your data
- Strict double-entry bookkeeping, GST-ready, professional invoices & reports

---

## ✨ Features

- **Company Setup Wizard** — company details, financial year, opening balances, post-setup dashboard.
- **Dashboard** — sales/purchases, receivables/payables, cash & bank, net profit, monthly chart, top customers, recent transactions.
- **Masters**
  - Chart of Accounts (Tally-style pre-loaded structure)
  - Ledgers (CRUD with group selection)
  - Parties (Customers/Vendors with auto-ledger)
  - Items/Services (with stock, HSN/SAC, GST rate)
  - Banks (with auto-ledger)
  - Tax (GST) rates
- **Transactions (all vouchers)**
  - Sales Invoice, Purchase Invoice
  - Payment, Receipt, Contra
  - Journal, Credit Note, Debit Note, Expense Entry
- **Banking** — statement, reconciliation, match entries.
- **GST** — dashboard, GSTR-1 (B2B/B2C/HSN), GSTR-3B, GST ledger.
- **Reports** — Trial Balance, Profit & Loss, Balance Sheet, Cash Flow, Day Book, Ledger Report, Receivable, Payable, Sales Register, Purchase Register, Stock Summary, Aging, Expense Report.
- **Settings** — company/general, invoice defaults & voucher numbering, backup/restore/reset.
- **Documents** — professional tax invoices with amount-in-words, PDF export, Excel export, print.

---

## 🧰 Tech Stack

- Electron (main/preload, context-isolated renderer)
- SQLite via `better-sqlite3`
- Native HTML/CSS/JS renderer (no build framework)
- Chart.js (dashboard charts)
- jsPDF + jspdf-autotable (PDF export)
- xlsx / SheetJS (Excel export)
- electron-builder (installers)

---

## 🚀 Run from source (developers / Mac / Linux)

Requires Node.js 18+ (LTS).

```bash
cd VyaparBooks
npm install
npm start      # or: npm run dev
```

On Windows, just double-click **`setup-and-run.bat`** — it checks Node.js, installs
dependencies and launches the app.

---

## 📦 Build installers

```bash
npm run dist        # Windows .exe (NSIS)
npm run dist:mac    # macOS .dmg
npm run dist:linux  # Linux AppImage
```

Output goes to `dist/`.

---

## 🗄️ Data & Backup

- Database is stored in the Electron user-data folder.
- Menu → Help → Open Data Folder shows the location.
- Settings → Backup & Restore creates/restores portable `.backup` files.
- Data is 100% local — never uploaded anywhere.

---

## 🏗️ Project Structure

```
VyaparBooks/
├── website/index.html         GitHub Pages landing page
├── src/
│   ├── main.js                Electron main process
│   ├── preload.js             Secure renderer bridge
│   ├── database/              schema, db init, migrations, core services
│   ├── modules/               company-setup, dashboard, masters, vouchers,
│   │                          banking, gst, reports, settings
│   ├── components/            sidebar, header, modal, table, validator, toast
│   ├── export/                pdf-generator, excel-generator, print-handler
│   ├── utils/                 number-to-words, date, currency, gst, FY
│   ├── styles/                design system CSS
│   └── renderer/              app shell/router, voucher/report frameworks
├── package.json
├── electron-builder.yml
├── LICENSE                   MIT
├── .gitignore
└── setup-and-run.bat
```

---

## 🔐 Security

- `contextIsolation: true`, `nodeIntegration: false`
- Renderer talks to the main process only through a small preload API
- All database operations run in main process with prepared statements
- Double-entry balance is validated before every save

---

## 📜 License

MIT — free forever for individuals and businesses.

---

## 🙏 Credits

Built for Indian MSMEs. Chart of Accounts structure inspired by Tally-style
accounting conventions. GST logic follows Indian GST rules (CGST/SGST for intra-state,
IGST for inter-state).
