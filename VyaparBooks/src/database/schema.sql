-- VyaparBooks - Complete SQLite schema (v1)
-- MIT License. Database created locally on first run in the user's AppData folder.

PRAGMA foreign_keys = ON;

-- Company Information
CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  logo BLOB,
  financial_year_start TEXT DEFAULT '04',
  currency TEXT DEFAULT 'INR',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Financial Years
CREATE TABLE IF NOT EXISTS financial_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fy_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 0,
  is_closed INTEGER DEFAULT 0
);

-- Account Groups (Pre-defined Chart of Accounts structure like Tally)
CREATE TABLE IF NOT EXISTS account_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  nature TEXT CHECK(nature IN ('Assets','Liabilities','Income','Expense')),
  is_system INTEGER DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES account_groups(id)
);

-- Ledger Accounts
CREATE TABLE IF NOT EXISTS ledgers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  group_id INTEGER NOT NULL,
  opening_balance REAL DEFAULT 0,
  opening_balance_type TEXT CHECK(opening_balance_type IN ('Dr','Cr')) DEFAULT 'Dr',
  is_active INTEGER DEFAULT 1,
  is_system INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES account_groups(id)
);

-- Parties (Customers & Vendors)
CREATE TABLE IF NOT EXISTS parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('Customer','Vendor','Both')) DEFAULT 'Customer',
  gstin TEXT,
  pan TEXT,
  phone TEXT,
  email TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  credit_limit REAL DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  opening_balance REAL DEFAULT 0,
  opening_balance_type TEXT CHECK(opening_balance_type IN ('Dr','Cr')) DEFAULT 'Dr',
  ledger_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ledger_id) REFERENCES ledgers(id)
);

-- Items/Products/Services
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('Goods','Service')) DEFAULT 'Goods',
  hsn_sac_code TEXT,
  unit TEXT DEFAULT 'Nos',
  purchase_price REAL DEFAULT 0,
  sale_price REAL DEFAULT 0,
  gst_rate REAL DEFAULT 0,
  cess_rate REAL DEFAULT 0,
  opening_stock REAL DEFAULT 0,
  current_stock REAL DEFAULT 0,
  low_stock_alert REAL DEFAULT 0,
  purchase_ledger_id INTEGER,
  sale_ledger_id INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_ledger_id) REFERENCES ledgers(id),
  FOREIGN KEY (sale_ledger_id) REFERENCES ledgers(id)
);

-- Tax Rates (GST)
CREATE TABLE IF NOT EXISTS tax_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rate REAL NOT NULL,
  cgst_rate REAL,
  sgst_rate REAL,
  igst_rate REAL,
  cess_rate REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- Banks
CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  ifsc_code TEXT,
  branch TEXT,
  account_type TEXT CHECK(account_type IN ('Savings','Current','OD','CC')) DEFAULT 'Current',
  opening_balance REAL DEFAULT 0,
  ledger_id INTEGER,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (ledger_id) REFERENCES ledgers(id)
);

-- Vouchers (Master table for ALL transaction types)
CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_number TEXT NOT NULL UNIQUE,
  voucher_type TEXT NOT NULL CHECK(voucher_type IN (
    'Sales','Purchase','Payment','Receipt',
    'Journal','Contra','Credit Note','Debit Note','Expense'
  )),
  date TEXT NOT NULL,
  party_id INTEGER,
  reference_number TEXT,
  narration TEXT,
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  total_tax REAL DEFAULT 0,
  round_off REAL DEFAULT 0,
  grand_total REAL DEFAULT 0,
  amount_in_words TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active','Cancelled','Draft')),
  financial_year_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (party_id) REFERENCES parties(id),
  FOREIGN KEY (financial_year_id) REFERENCES financial_years(id)
);

-- Voucher Items (Line items for Sales/Purchase invoices)
CREATE TABLE IF NOT EXISTS voucher_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER NOT NULL,
  item_id INTEGER,
  description TEXT,
  quantity REAL DEFAULT 1,
  unit TEXT DEFAULT 'Nos',
  rate REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  taxable_amount REAL DEFAULT 0,
  gst_rate REAL DEFAULT 0,
  cgst_amount REAL DEFAULT 0,
  sgst_amount REAL DEFAULT 0,
  igst_amount REAL DEFAULT 0,
  cess_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Accounting Entries (Double-Entry Bookkeeping - CORE TABLE)
CREATE TABLE IF NOT EXISTS accounting_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_id INTEGER NOT NULL,
  ledger_id INTEGER NOT NULL,
  debit_amount REAL DEFAULT 0,
  credit_amount REAL DEFAULT 0,
  narration TEXT,
  date TEXT NOT NULL,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE,
  FOREIGN KEY (ledger_id) REFERENCES ledgers(id)
);

-- Bank Transactions (for reconciliation)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bank_id INTEGER NOT NULL,
  voucher_id INTEGER,
  date TEXT NOT NULL,
  type TEXT CHECK(type IN ('Deposit','Withdrawal')),
  amount REAL NOT NULL,
  reference TEXT,
  is_reconciled INTEGER DEFAULT 0,
  reconciled_date TEXT,
  FOREIGN KEY (bank_id) REFERENCES banks(id),
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
);

-- Number Series (Auto-numbering for vouchers)
CREATE TABLE IF NOT EXISTS number_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_type TEXT NOT NULL UNIQUE,
  prefix TEXT DEFAULT '',
  next_number INTEGER DEFAULT 1,
  suffix TEXT DEFAULT '',
  financial_year_id INTEGER,
  FOREIGN KEY (financial_year_id) REFERENCES financial_years(id)
);

-- App settings (invoice terms, theme, backup details etc.)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  module TEXT,
  record_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Schema migrations bookkeeping
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_acctgroups_name ON account_groups(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_taxrates_name ON tax_rates(name);
CREATE INDEX IF NOT EXISTS idx_ledgers_group ON ledgers(group_id);
CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(type);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_vouchers_party ON vouchers(party_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_fy ON vouchers(financial_year_id);
CREATE INDEX IF NOT EXISTS idx_items_voucher ON voucher_items(voucher_id);
CREATE INDEX IF NOT EXISTS idx_entries_voucher ON accounting_entries(voucher_id);
CREATE INDEX IF NOT EXISTS idx_entries_ledger ON accounting_entries(ledger_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON accounting_entries(date);
CREATE INDEX IF NOT EXISTS idx_banktxn_bank ON bank_transactions(bank_id);
CREATE INDEX IF NOT EXISTS idx_banktxn_recon ON bank_transactions(is_reconciled);

-- Pre-populate Account Groups (Tally-like structure)
INSERT OR IGNORE INTO account_groups (name, parent_id, nature, is_system) VALUES
('Capital Account', NULL, 'Liabilities', 1),
('Reserves & Surplus', 1, 'Liabilities', 1),
('Current Liabilities', NULL, 'Liabilities', 1),
('Sundry Creditors', 3, 'Liabilities', 1),
('Duties & Taxes', 3, 'Liabilities', 1),
('Provisions', 3, 'Liabilities', 1),
('Loans (Liability)', NULL, 'Liabilities', 1),
('Bank OD A/c', 7, 'Liabilities', 1),
('Secured Loans', 7, 'Liabilities', 1),
('Unsecured Loans', 7, 'Liabilities', 1),
('Fixed Assets', NULL, 'Assets', 1),
('Investments', NULL, 'Assets', 1),
('Current Assets', NULL, 'Assets', 1),
('Bank Accounts', 13, 'Assets', 1),
('Cash-in-Hand', 13, 'Assets', 1),
('Sundry Debtors', 13, 'Assets', 1),
('Stock-in-Hand', 13, 'Assets', 1),
('Deposits (Asset)', 13, 'Assets', 1),
('Loans & Advances (Asset)', 13, 'Assets', 1),
('Direct Incomes', NULL, 'Income', 1),
('Sales Accounts', 20, 'Income', 1),
('Indirect Incomes', NULL, 'Income', 1),
('Direct Expenses', NULL, 'Expense', 1),
('Purchase Accounts', 23, 'Expense', 1),
('Manufacturing Expenses', 23, 'Expense', 1),
('Indirect Expenses', NULL, 'Expense', 1),
('Administrative Expenses', 26, 'Expense', 1),
('Selling Expenses', 26, 'Expense', 1);

-- Pre-populate System Ledgers
INSERT OR IGNORE INTO ledgers (name, group_id, opening_balance, opening_balance_type, is_system) VALUES
('Cash', 15, 0, 'Dr', 1),
('Profit & Loss A/c', 2, 0, 'Cr', 1),
('CGST Input', 19, 0, 'Dr', 1),
('SGST Input', 19, 0, 'Dr', 1),
('IGST Input', 19, 0, 'Dr', 1),
('CGST Output', 5, 0, 'Cr', 1),
('SGST Output', 5, 0, 'Cr', 1),
('IGST Output', 5, 0, 'Cr', 1),
('GST Cess', 5, 0, 'Cr', 1),
('TDS Payable', 5, 0, 'Cr', 1),
('TCS Payable', 5, 0, 'Cr', 1),
('Round Off', 26, 0, 'Dr', 1),
('Discount Allowed', 26, 0, 'Dr', 1),
('Discount Received', 22, 0, 'Cr', 1),
('Sales Account', 21, 0, 'Cr', 1),
('Purchase Account', 24, 0, 'Dr', 1),
('Opening Stock', 17, 0, 'Dr', 1),
('Closing Stock', 17, 0, 'Dr', 1);

-- Pre-populate Tax Rates
INSERT OR IGNORE INTO tax_rates (name, rate, cgst_rate, sgst_rate, igst_rate) VALUES
('GST 0%', 0, 0, 0, 0),
('GST 5%', 5, 2.5, 2.5, 5),
('GST 12%', 12, 6, 6, 12),
('GST 18%', 18, 9, 9, 18),
('GST 28%', 28, 14, 14, 28);

-- Pre-populate Number Series
INSERT OR IGNORE INTO number_series (voucher_type, prefix, next_number) VALUES
('Sales', 'INV-', 1),
('Purchase', 'PUR-', 1),
('Payment', 'PAY-', 1),
('Receipt', 'REC-', 1),
('Journal', 'JV-', 1),
('Contra', 'CTR-', 1),
('Credit Note', 'CN-', 1),
('Debit Note', 'DN-', 1),
('Expense', 'EXP-', 1);
