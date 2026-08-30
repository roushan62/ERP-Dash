'use strict';

/**
 * VyaparBooks - core application services.
 *
 * This module owns every business rule in the application:
 *   - strict double-entry bookkeeping (debits MUST equal credits)
 *   - GST (CGST/SGST/IGST) calculation
 *   - auto voucher numbering
 *   - stock updates
 *   - masters CRUD
 *   - all reports / GST returns
 *
 * It runs inside the Electron main process and is exposed to the renderer
 * through the preload script (`window.vyapar.invoke`). It is deliberately
 * free of Electron APIs so it can be unit-tested under plain Node.js.
 */
const db = require('./db');

const conn = () => db.getDb();

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const nowIso = () => {
  const d = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const today = () => nowIso().slice(0, 10);
const cmp = (a, b) => (Number(a) < Number(b) ? -1 : Number(a) > Number(b) ? 1 : 0);

function getSetting(key, fallback = '') {
  const row = conn().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : fallback;
}
function setSetting(key, value) {
  conn()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(key, String(value), nowIso());
}

function audit(action, module, record_id, old_values, new_values) {
  conn()
    .prepare('INSERT INTO audit_log (action, module, record_id, old_values, new_values, timestamp) VALUES (?,?,?,?,?,?)')
    .run(action, module, record_id || null, old_values ? JSON.stringify(old_values) : null, new_values ? JSON.stringify(new_values) : null, nowIso());
}

function roundOff(n) {
  return r2(Number(n).toFixed(0) - Number(n));
}

// ---------------------------------------------------------------------------
// Company / Financial Year
// ---------------------------------------------------------------------------
function getCompany() {
  return conn().prepare('SELECT * FROM company ORDER BY id LIMIT 1').get() || null;
}

function isSetupNeeded() {
  return !getCompany();
}

function saveCompany(data) {
  const existing = getCompany();
  const fields = [
    'name', 'address', 'city', 'state', 'state_code', 'pincode', 'phone',
    'email', 'gstin', 'pan', 'cin', 'financial_year_start', 'currency',
  ];
  const vals = { ...data };
  for (const f of fields) vals[f] = vals[f] == null ? '' : vals[f];

  if (existing) {
    const old = { ...existing };
    conn()
      .prepare(
        `UPDATE company SET name=@name,address=@address,city=@city,state=@state,state_code=@state_code,
         pincode=@pincode,phone=@phone,email=@email,gstin=@gstin,pan=@pan,cin=@cin,
         financial_year_start=@financial_year_start,currency=@currency WHERE id=@id`
      )
      .run({ ...vals, id: existing.id });
    audit('update', 'company', existing.id, old, vals);
    return getCompany();
  }
  const info = conn()
    .prepare(
      `INSERT INTO company (name,address,city,state,state_code,pincode,phone,email,gstin,pan,cin,financial_year_start,currency)
       VALUES (@name,@address,@city,@state,@state_code,@pincode,@phone,@email,@gstin,@pan,@cin,@financial_year_start,@currency)`
    )
    .run(vals);
  audit('create', 'company', info.lastInsertRowid, null, vals);
  return getCompany();
}

function fyNameFromDate(d) {
  const year = parseInt(d.slice(0, 4), 10);
  const month = parseInt(d.slice(5, 7), 10);
  return month >= 4 ? `${year}-${String((year + 1) % 100).padStart(2, '0')}` : `${year - 1}-${String(year % 100).padStart(2, '0')}`;
}

function ensureCurrentFY() {
  const fy = getActiveFY();
  if (fy) return fy;
  const t = today();
  const y = fyNameFromDate(t);
  const start = `${parseInt(y.slice(0, 4), 10)}-04-01`;
  const end = `${parseInt(y.slice(5, 7), 10) + 2000}-03-31`;
  const info = conn()
    .prepare('INSERT INTO financial_years (fy_name,start_date,end_date,is_active) VALUES (?,?,?,1)')
    .run(y, start, end);
  return getFinancialYear(info.lastInsertRowid);
}

function listFinancialYears() {
  return conn().prepare('SELECT * FROM financial_years ORDER BY start_date DESC').all();
}
function getFinancialYear(id) {
  return conn().prepare('SELECT * FROM financial_years WHERE id = ?').get(id);
}
function getActiveFY() {
  const active = conn().prepare('SELECT * FROM financial_years WHERE is_active = 1 ORDER BY id DESC').get();
  if (active) return active;
  const byDate = conn()
    .prepare('SELECT * FROM financial_years WHERE ? BETWEEN start_date AND end_date ORDER BY id DESC')
    .get(today());
  return byDate || null;
}
function setActiveFY(id) {
  const fy = getFinancialYear(id);
  if (!fy) throw new Error('Financial year not found.');
  const tx = conn().transaction(() => {
    conn().prepare('UPDATE financial_years SET is_active = 0').run();
    conn().prepare('UPDATE financial_years SET is_active = 1 WHERE id = ?').run(id);
  });
  tx();
  return getActiveFY();
}
function createFinancialYear(name, start, end) {
  const info = conn()
    .prepare('INSERT INTO financial_years (fy_name,start_date,end_date,is_active) VALUES (?,?,?,0)')
    .run(name, start, end);
  return getFinancialYear(info.lastInsertRowid);
}

// ---------------------------------------------------------------------------
// Account groups & ledgers
// ---------------------------------------------------------------------------
function listGroups() {
  return conn()
    .prepare('SELECT g.*, p.name AS parent_name, g.nature FROM account_groups g LEFT JOIN account_groups p ON p.id = g.parent_id ORDER BY g.nature, g.name')
    .all();
}
function groupsTree() {
  const all = listGroups();
  const byParent = {};
  all.forEach((g) => {
    (byParent[g.parent_id || 0] = byParent[g.parent_id || 0] || []).push(g);
  });
  const build = (pid) =>
    (byParent[pid] || []).map((g) => ({ ...g, children: build(g.id) }));
  return build(0);
}
function createGroup(data) {
  const nature = ['Assets', 'Liabilities', 'Income', 'Expense'].includes(data.nature) ? data.nature : 'Assets';
  const info = conn()
    .prepare('INSERT INTO account_groups (name,parent_id,nature,is_system) VALUES (?,?,?,0)')
    .run(data.name.trim(), data.parent_id || null, nature);
  audit('create', 'chart-of-accounts', info.lastInsertRowid, null, data);
  return conn().prepare('SELECT * FROM account_groups WHERE id = ?').get(info.lastInsertRowid);
}
function updateGroup(id, data) {
  const old = conn().prepare('SELECT * FROM account_groups WHERE id = ?').get(id);
  if (!old) throw new Error('Group not found.');
  if (old.is_system) throw new Error('System groups cannot be edited.');
  conn().prepare('UPDATE account_groups SET name=?,parent_id=?,nature=? WHERE id=?').run(data.name.trim(), data.parent_id || null, data.nature, id);
  audit('update', 'chart-of-accounts', id, old, data);
  return conn().prepare('SELECT * FROM account_groups WHERE id = ?').get(id);
}
function deleteGroup(id) {
  const old = conn().prepare('SELECT * FROM account_groups WHERE id = ?').get(id);
  if (!old) throw new Error('Group not found.');
  if (old.is_system) throw new Error('System groups cannot be deleted.');
  const childCount = conn().prepare('SELECT COUNT(*) c FROM account_groups WHERE parent_id = ?').get(id).c;
  if (childCount > 0) throw new Error('Group has sub-groups. Delete them first.');
  const ledgerCount = conn().prepare('SELECT COUNT(*) c FROM ledgers WHERE group_id = ?').get(id).c;
  if (ledgerCount > 0) throw new Error('Group has ledgers. Move or delete them first.');
  conn().prepare('DELETE FROM account_groups WHERE id = ?').run(id);
  audit('delete', 'chart-of-accounts', id, old, null);
  return true;
}

function listLedgers(filter) {
  let sql =
    `SELECT l.*, g.name AS group_name, g.nature
     FROM ledgers l LEFT JOIN account_groups g ON g.id = l.group_id
     WHERE 1=1`;
  const params = [];
  if (filter && filter.group_id) { sql += ' AND l.group_id = ?'; param(params, filter.group_id); }
  if (filter && filter.search) {
    sql += ' AND (l.name LIKE ? OR g.name LIKE ?)';
    const s = `%${filter.search}%`;
    params.push(s, s);
  }
  sql += ' ORDER BY g.nature, g.name, l.name';
  return conn().prepare(sql).all(...params);
}
function param(arr, v) { arr.push(v); return v; }
function getLedger(id) {
  return conn()
    .prepare(`SELECT l.*, g.name AS group_name, g.parent_id AS group_parent_id, g.nature
              FROM ledgers l LEFT JOIN account_groups g ON g.id = l.group_id WHERE l.id = ?`)
    .get(id);
}
function createLedger(data) {
  const name = data.name.trim();
  if (!name) throw new Error('Ledger name is required.');
  if (conn().prepare('SELECT id FROM ledgers WHERE name = ?').get(name)) throw new Error('A ledger with this name already exists.');
  const info = conn()
    .prepare('INSERT INTO ledgers (name,group_id,opening_balance,opening_balance_type,is_active) VALUES (?,?,?,?,?)')
    .run(name, data.group_id, r2(data.opening_balance || 0), data.opening_balance_type === 'Cr' ? 'Cr' : 'Dr', data.is_active === 0 ? 0 : 1);
  audit('create', 'ledgers', info.lastInsertRowid, null, data);
  return getLedger(info.lastInsertRowid);
}
function updateLedger(id, data) {
  const old = getLedger(id);
  if (!old) throw new Error('Ledger not found.');
  if (old.is_system) throw new Error('System ledgers cannot be edited.');
  if (data.name && data.name.trim() !== old.name &&
      conn().prepare('SELECT id FROM ledgers WHERE name = ?').get(data.name.trim())) {
    throw new Error('A ledger with this name already exists.');
  }
  conn()
    .prepare('UPDATE ledgers SET name=?,group_id=?,opening_balance=?,opening_balance_type=?,is_active=? WHERE id=?')
    .run(data.name ? data.name.trim() : old.name, data.group_id || old.group_id, r2(data.opening_balance !== undefined ? data.opening_balance : old.opening_balance), data.opening_balance_type || old.opening_balance_type, data.is_active !== undefined ? (data.is_active === 0 ? 0 : 1) : old.is_active, id);
  audit('update', 'ledgers', id, old, data);
  return getLedger(id);
}
function deleteLedger(id) {
  const old = getLedger(id);
  if (!old) throw new Error('Ledger not found.');
  if (old.is_system) throw new Error('System ledgers cannot be deleted.');
  const used = conn().prepare('SELECT COUNT(*) c FROM accounting_entries WHERE ledger_id = ?').get(id).c;
  if (used > 0) throw new Error('Ledger has transactions and cannot be deleted.');
  const party = conn().prepare('SELECT id FROM parties WHERE ledger_id = ?').get(id);
  if (party) throw new Error('Ledger is linked to a party.');
  const bank = conn().prepare('SELECT id FROM banks WHERE ledger_id = ?').get(id);
  if (bank) throw new Error('Ledger is linked to a bank.');
  const item = conn().prepare('SELECT id FROM items WHERE purchase_ledger_id = ? OR sale_ledger_id = ?').get(id, id);
  if (item) throw new Error('Ledger is linked to an item.');
  conn().prepare('DELETE FROM ledgers WHERE id = ?').run(id);
  audit('delete', 'ledgers', id, old, null);
  return true;
}

// ---------------------------------------------------------------------------
// Parties
// ---------------------------------------------------------------------------
function listParties(filter) {
  let sql = `SELECT p.*, l.name AS ledger_name FROM parties p LEFT JOIN ledgers l ON l.id = p.ledger_id WHERE 1=1`;
  const params = [];
  if (filter && filter.type) { sql += ' AND p.type = ?'; params.push(filter.type); }
  if (filter && filter.search) { sql += ' AND (p.name LIKE ? OR p.gstin LIKE ? OR p.phone LIKE ?)'; const s = `%${filter.search}%`; params.push(s, s, s); }
  sql += ' ORDER BY p.name';
  return conn().prepare(sql).all(...params);
}
function getParty(id) {
  return conn().prepare('SELECT * FROM parties WHERE id = ?').get(id);
}
function createParty(data) {
  const name = data.name.trim();
  if (!name) throw new Error('Party name is required.');
  const type = ['Customer', 'Vendor', 'Both'].includes(data.type) ? data.type : 'Customer';
  const groupName = type === 'Vendor' ? 'Sundry Creditors' : type === 'Both' ? 'Sundry Debtors' : 'Sundry Debtors';
  const debtorGroup = conn().prepare("SELECT id FROM account_groups WHERE name = 'Sundry Debtors'").get();
  const creditorGroup = conn().prepare("SELECT id FROM account_groups WHERE name = 'Sundry Creditors'").get();
  // use debtor for Customer/Both, creditor for Vendor/Both party ledger used by vouchers on opposite side regardless

  // create the party ledger in the appropriate group
  let groupId = groupName === 'Sundry Creditors' ? creditorGroup.id : debtorGroup.id;
  const ledgerInfo = conn()
    .prepare('INSERT INTO ledgers (name,group_id,opening_balance,opening_balance_type) VALUES (?,?,?,?)')
    .run(name, groupId, r2(data.opening_balance || 0), data.opening_balance_type === 'Cr' ? 'Cr' : 'Dr');

  const info = conn()
    .prepare(
      `INSERT INTO parties (name,type,gstin,pan,phone,email,billing_address,shipping_address,city,state,state_code,pincode,credit_limit,credit_days,opening_balance,opening_balance_type,ledger_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(name, type, data.gstin || '', data.pan || '', data.phone || '', data.email || '', data.billing_address || '', data.shipping_address || '', data.city || '', data.state || '', data.state_code || '', data.pincode || '', r2(data.credit_limit || 0), data.credit_days || 30, r2(data.opening_balance || 0), data.opening_balance_type === 'Cr' ? 'Cr' : 'Dr', ledgerInfo.lastInsertRowid);
  audit('create', 'parties', info.lastInsertRowid, null, data);
  return getParty(info.lastInsertRowid);
}
function updateParty(id, data) {
  const old = getParty(id);
  if (!old) throw new Error('Party not found.');
  conn()
    .prepare(`UPDATE parties SET name=?,type=?,gstin=?,pan=?,phone=?,email=?,billing_address=?,shipping_address=?,city=?,state=?,state_code=?,pincode=?,credit_limit=?,credit_days=?,opening_balance=?,opening_balance_type=?,is_active=? WHERE id=?`)
    .run(data.name || old.name, data.type || old.type, data.gstin != null ? data.gstin : old.gstin, data.pan != null ? data.pan : old.pan, data.phone != null ? data.phone : old.phone, data.email != null ? data.email : old.email, data.billing_address != null ? data.billing_address : old.billing_address, data.shipping_address != null ? data.shipping_address : old.shipping_address, data.city != null ? data.city : old.city, data.state != null ? data.state : old.state, data.state_code != null ? data.state_code : old.state_code, data.pincode != null ? data.pincode : old.pincode, r2(data.credit_limit != null ? data.credit_limit : old.credit_limit), data.credit_days != null ? data.credit_days : old.credit_days, r2(data.opening_balance != null ? data.opening_balance : old.opening_balance), data.opening_balance_type || old.opening_balance_type, data.is_active !== undefined ? (data.is_active === 0 ? 0 : 1) : old.is_active, id);
  if (old.ledger_id) {
    conn().prepare('UPDATE ledgers SET name=?, opening_balance=?, opening_balance_type=? WHERE id=?').run(data.name || old.name, r2(data.opening_balance != null ? data.opening_balance : old.opening_balance), data.opening_balance_type || old.opening_balance_type, old.ledger_id);
  }
  audit('update', 'parties', id, old, data);
  return getParty(id);
}
function deleteParty(id) {
  const old = getParty(id);
  if (!old) throw new Error('Party not found.');
  const used = conn().prepare('SELECT COUNT(*) c FROM vouchers WHERE party_id = ?').get(id).c;
  if (used > 0) throw new Error('Party has transactions and cannot be deleted.');
  conn().prepare('DELETE FROM parties WHERE id = ?').run(id);
  if (old.ledger_id) {
    const lused = conn().prepare('SELECT COUNT(*) c FROM accounting_entries WHERE ledger_id = ?').get(old.ledger_id).c;
    if (!lused && !conn().prepare('SELECT name FROM ledgers WHERE name = ?').get(old.name)) {
      // party ledger name may now duplicate another ledger; only delete safe ones
    }
  }
  audit('delete', 'parties', id, old, null);
  return true;
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------
function listItems(filter) {
  let sql = `SELECT * FROM items WHERE 1=1`;
  const params = [];
  if (filter && filter.search) {
    sql += ' AND (name LIKE ? OR hsn_sac_code LIKE ?)';
    const s = `%${filter.search}%`; params.push(s, s);
  }
  sql += ' ORDER BY name';
  return conn().prepare(sql).all(...params);
}
function getItem(id) {
  return conn().prepare('SELECT * FROM items WHERE id = ?').get(id);
}
function createItem(data) {
  const name = data.name.trim();
  if (!name) throw new Error('Item name is required.');
  const info = conn()
    .prepare(
      `INSERT INTO items (name,type,hsn_sac_code,unit,purchase_price,sale_price,gst_rate,cess_rate,opening_stock,current_stock,low_stock_alert,purchase_ledger_id,sale_ledger_id,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(name, data.type === 'Service' ? 'Service' : 'Goods', data.hsn_sac_code || '', data.unit || 'Nos', r2(data.purchase_price || 0), r2(data.sale_price || 0), r2(data.gst_rate || 0), r2(data.cess_rate || 0), r2(data.opening_stock || 0), r2(data.opening_stock || 0), r2(data.low_stock_alert || 0), data.purchase_ledger_id || null, data.sale_ledger_id || null, data.is_active === 0 ? 0 : 1);
  audit('create', 'items', info.lastInsertRowid, null, data);
  return getItem(info.lastInsertRowid);
}
function updateItem(id, data) {
  const old = getItem(id);
  if (!old) throw new Error('Item not found.');
  conn()
    .prepare(`UPDATE items SET name=?,type=?,hsn_sac_code=?,unit=?,purchase_price=?,sale_price=?,gst_rate=?,cess_rate=?,low_stock_alert=?,purchase_ledger_id=?,sale_ledger_id=?,is_active=? WHERE id=?`)
    .run(data.name || old.name, data.type || old.type, data.hsn_sac_code != null ? data.hsn_sac_code : old.hsn_sac_code, data.unit || old.unit, r2(data.purchase_price != null ? data.purchase_price : old.purchase_price), r2(data.sale_price != null ? data.sale_price : old.sale_price), r2(data.gst_rate != null ? data.gst_rate : old.gst_rate), r2(data.cess_rate != null ? data.cess_rate : old.cess_rate), r2(data.low_stock_alert != null ? data.low_stock_alert : old.low_stock_alert), data.purchase_ledger_id !== undefined ? (data.purchase_ledger_id || null) : old.purchase_ledger_id, data.sale_ledger_id !== undefined ? (data.sale_ledger_id || null) : old.sale_ledger_id, data.is_active !== undefined ? (data.is_active === 0 ? 0 : 1) : old.is_active, id);
  // do not change current_stock here (only via opening value indirectly)
  audit('update', 'items', id, old, data);
  return getItem(id);
}
function deleteItem(id) {
  const old = getItem(id);
  if (!old) throw new Error('Item not found.');
  const used = conn().prepare('SELECT COUNT(*) c FROM voucher_items WHERE item_id = ?').get(id).c;
  if (used > 0) throw new Error('Item is used in transactions and cannot be deleted.');
  conn().prepare('DELETE FROM items WHERE id = ?').run(id);
  audit('delete', 'items', id, old, null);
  return true;
}
function adjustStock(itemId, qty) {
  if (!itemId) return;
  conn().prepare('UPDATE items SET current_stock = ROUND(COALESCE(current_stock,0) + ?, 2) WHERE id = ?').run(qty, itemId);
}

// ---------------------------------------------------------------------------
// Banks
// ---------------------------------------------------------------------------
function listBanks() {
  return conn()
    .prepare('SELECT b.*, l.name AS ledger_name FROM banks b LEFT JOIN ledgers l ON l.id = b.ledger_id ORDER BY b.bank_name')
    .all();
}
function getBank(id) {
  return conn().prepare('SELECT * FROM banks WHERE id = ?').get(id);
}
function createBank(data) {
  const bankName = data.bank_name.trim();
  if (!bankName) throw new Error('Bank name is required.');
  const group = conn().prepare("SELECT id FROM account_groups WHERE name = 'Bank Accounts'").get();
  const ledgerInfo = conn()
    .prepare('INSERT INTO ledgers (name,group_id,opening_balance,opening_balance_type) VALUES (?,?,?,?)')
    .run(`${bankName}${data.account_number ? ' ' + data.account_number : ''}`, group.id, r2(data.opening_balance || 0), 'Dr');
  const info = conn()
    .prepare('INSERT INTO banks (bank_name,account_number,ifsc_code,branch,account_type,opening_balance,ledger_id) VALUES (?,?,?,?,?,?,?)')
    .run(bankName, data.account_number || '', data.ifsc_code || '', data.branch || '', data.account_type || 'Current', r2(data.opening_balance || 0), ledgerInfo.lastInsertRowid);
  audit('create', 'banks', info.lastInsertRowid, null, data);
  return getBank(info.lastInsertRowid);
}
function updateBank(id, data) {
  const old = getBank(id);
  if (!old) throw new Error('Bank not found.');
  conn().prepare('UPDATE banks SET bank_name=?,account_number=?,ifsc_code=?,branch=?,account_type=?,opening_balance=?,is_active=? WHERE id=?')
    .run(data.bank_name || old.bank_name, data.account_number != null ? data.account_number : old.account_number, data.ifsc_code != null ? data.ifsc_code : old.ifsc_code, data.branch != null ? data.branch : old.branch, data.account_type || old.account_type, r2(data.opening_balance != null ? data.opening_balance : old.opening_balance), data.is_active !== undefined ? (data.is_active === 0 ? 0 : 1) : old.is_active, id);
  if (old.ledger_id) conn().prepare('UPDATE ledgers SET opening_balance=?,opening_balance_type=? WHERE id=?').run(r2(data.opening_balance != null ? data.opening_balance : old.opening_balance), 'Dr', old.ledger_id);
  audit('update', 'banks', id, old, data);
  return getBank(id);
}
function deleteBank(id) {
  const old = getBank(id);
  if (!old) throw new Error('Bank not found.');
  const used = conn().prepare('SELECT COUNT(*) c FROM bank_transactions WHERE bank_id = ?').get(id).c;
  if (used > 0) throw new Error('Bank has transactions and cannot be deleted.');
  conn().prepare('DELETE FROM banks WHERE id = ?').run(id);
  if (old.ledger_id) {
    const entries = conn().prepare('SELECT COUNT(*) c FROM accounting_entries WHERE ledger_id = ?').get(old.ledger_id).c;
    if (entries === 0) conn().prepare('DELETE FROM ledgers WHERE id = ?').run(old.ledger_id);
  }
  audit('delete', 'banks', id, old, null);
  return true;
}

// ---------------------------------------------------------------------------
// Tax rates
// ---------------------------------------------------------------------------
function listTaxRates() {
  return conn().prepare('SELECT * FROM tax_rates ORDER BY rate').all();
}
function updateTaxRate(id, data) {
  const old = conn().prepare('SELECT * FROM tax_rates WHERE id = ?').get(id);
  if (!old) throw new Error('Tax rate not found.');
  conn().prepare('UPDATE tax_rates SET name=?,rate=?,cgst_rate=?,sgst_rate=?,igst_rate=?,cess_rate=?,is_active=? WHERE id=?')
    .run(data.name || old.name, r2(data.rate != null ? data.rate : old.rate), r2(data.cgst_rate != null ? data.cgst_rate : old.cgst_rate), r2(data.sgst_rate != null ? data.sgst_rate : old.sgst_rate), r2(data.igst_rate != null ? data.igst_rate : old.igst_rate), r2(data.cess_rate != null ? data.cess_rate : old.cess_rate), data.is_active !== undefined ? (data.is_active === 0 ? 0 : 1) : old.is_active, id);
  audit('update', 'tax-rates', id, old, data);
  return conn().prepare('SELECT * FROM tax_rates WHERE id = ?').get(id);
}

// ---------------------------------------------------------------------------
// GST helpers
// ---------------------------------------------------------------------------
function getGstSplit(gstRate, companyStateCode, partyStateCode) {
  const rate = r2(gstRate || 0);
  const company = String(companyStateCode || '').trim().toUpperCase();
  const party = String(partyStateCode || '').trim().toUpperCase();
  let cgst = 0, sgst = 0, igst = 0;
  if (rate > 0) {
    if (company && party && company !== party) {
      igst = r2(rate);
    } else {
      cgst = r2(rate / 2);
      sgst = r2(rate - cgst);
    }
  }
  return { cgst, sgst, igst };
}

// ---------------------------------------------------------------------------
// Voucher numbering
// ---------------------------------------------------------------------------
function pad(n, len = 4) { return String(Math.max(1, n)).padStart(len, '0'); }
function nextVoucherNumber(type) {
  const rate = conn().prepare('SELECT * FROM number_series WHERE voucher_type = ? ORDER BY id LIMIT 1').get(type);
  const fy = ensureCurrentFY();
  let row = rate;
  if (!row) {
    conn().prepare('INSERT INTO number_series (voucher_type,prefix,next_number,suffix,financial_year_id) VALUES (?,?,1,?,?)').run(type, type.slice(0, 3).toUpperCase() + '-', fy.id);
    row = conn().prepare('SELECT * FROM number_series WHERE voucher_type = ? ORDER BY id LIMIT 1').get(type);
  }
  const number = `${row.prefix || ''}${pad(row.next_number)}${row.suffix || ''}`;
  conn().prepare('UPDATE number_series SET next_number = next_number + 1 WHERE id = ?').run(row.id);
  return number;
}
function setVoucherPrefix(type, prefix, suffix) {
  const row = conn().prepare('SELECT * FROM number_series WHERE voucher_type = ? ORDER BY id LIMIT 1').get(type);
  if (row) conn().prepare('UPDATE number_series SET prefix=?,suffix=? WHERE id=?').run(prefix || '', suffix || '', row.id);
  else conn().prepare('INSERT INTO number_series (voucher_type,prefix,next_number,suffix) VALUES (?,?,1,?)').run(type, prefix || '', suffix || '');
  return getSetting('voucher_series') + type; // keep API contract simple
}
function listNumberSeries() {
  return conn().prepare('SELECT * FROM number_series ORDER BY voucher_type').all();
}

// ---------------------------------------------------------------------------
// Generic voucher list / get
// ---------------------------------------------------------------------------
function listVouchers(filter) {
  filter = filter || {};
  let sql =
    `SELECT v.*, p.name AS party_name,
       (SELECT COUNT(*) FROM voucher_items vi WHERE vi.voucher_id = v.id) AS item_count
     FROM vouchers v LEFT JOIN parties p ON p.id = v.party_id WHERE 1=1`;
  const params = [];
  if (filter.voucher_type) { sql += ' AND v.voucher_type = ?'; params.push(filter.voucher_type); }
  if (filter.from) { sql += ' AND v.date >= ?'; params.push(filter.from); }
  if (filter.to) { sql += ' AND v.date <= ?'; params.push(filter.to); }
  if (filter.party_id) { sql += ' AND v.party_id = ?'; params.push(filter.party_id); }
  if (filter.status) { sql += ' AND v.status = ?'; params.push(filter.status); }
  if (filter.search) {
    sql += ' AND (v.voucher_number LIKE ? OR v.narration LIKE ? OR p.name LIKE ?)';
    const s = `%${filter.search}%`; params.push(s, s, s);
  }
  const total = conn().prepare(`SELECT COUNT(*) c FROM (${sql})`).get(...params).c;
  sql += ' ORDER BY v.date DESC, v.id DESC LIMIT ? OFFSET ?';
  const page = Math.max(1, Number(filter.page) || 1);
  const size = Math.min(200, Math.max(1, Number(filter.page_size) || 50));
  params.push(size, (page - 1) * size);
  const rows = conn().prepare(sql).all(...params);
  return { rows, total, page, page_size: size, pages: Math.max(1, Math.ceil(total / size)) };
}
function getVoucher(id) {
  const v = conn().prepare('SELECT * FROM vouchers WHERE id = ?').get(id);
  if (!v) return null;
  const items = conn().prepare('SELECT * FROM voucher_items WHERE voucher_id = ? ORDER BY id').all(id);
  const entries = conn()
    .prepare(`SELECT e.*, l.name AS ledger_name, g.name AS group_name, g.nature
              FROM accounting_entries e JOIN ledgers l ON l.id = e.ledger_id
              LEFT JOIN account_groups g ON g.id = l.group_id WHERE e.voucher_id = ? ORDER BY e.id`)
    .all(id);
  return { ...v, items, entries };
}

// ---------------------------------------------------------------------------
// Accounting core
// ---------------------------------------------------------------------------
function ensureBalanced(entries) {
  const dr = r2(entries.reduce((s, e) => s + Number(e.debit_amount || 0), 0));
  const cr = r2(entries.reduce((s, e) => s + Number(e.credit_amount || 0), 0));
  if (r2(dr - cr) !== 0) throw new Error(`Voucher is not balanced. Debit ${dr} must equal Credit ${cr}.`);
  return { dr, cr };
}
function saveEntries(voucherId, entries, date) {
  const stmt = conn().prepare('INSERT INTO accounting_entries (voucher_id,ledger_id,debit_amount,credit_amount,narration,date) VALUES (?,?,?,?,?,?)');
  for (const e of entries) {
    if (Number(e.debit_amount || 0) === 0 && Number(e.credit_amount || 0) === 0) continue;
    stmt.run(voucherId, e.ledger_id, r2(e.debit_amount || 0), r2(e.credit_amount || 0), e.narration || '', date);
  }
}
function partyLedger(party_id) {
  const p = getParty(party_id);
  if (!p) throw new Error('Party not found');
  if (!p.ledger_id) throw new Error('Party has no ledger.');
  return p.ledger_id;
}

/**
 * Builds voucher rows + line items + balanced accounting entries for any
 * transaction. Returns { voucherHeader, items, entries, stockEffects }.
 * This is the single accounting engine used by every voucher page.
 */
function buildVoucher(payload) {
  const type = payload.voucher_type;
  const isValid = ['Sales', 'Purchase', 'Payment', 'Receipt', 'Journal', 'Contra', 'Credit Note', 'Debit Note', 'Expense'].includes(type);
  if (!isValid) throw new Error('Invalid voucher type.');
  const company = getCompany();
  const fy = ensureCurrentFY();
  const date = payload.date || today();
  if (String(date).length < 10) throw new Error('Invalid date.');
  const party = payload.party_id ? getParty(payload.party_id) : null;

  let subtotal = 0, discount_amount = 0, taxable_amount = 0;
  let cgst = 0, sgst = 0, igst = 0, cess = 0;
  const items = [];
  let entries = [];
  const stockEffects = [];

  const pushLine = (line) => {
    const qty = r2(line.quantity || 0);
    const rate = r2(line.rate || 0);
    const discPct = r2(line.discount_percent || 0);
    const gross = r2(qty * rate);
    const disc = r2((gross * discPct) / 100);
    const taxable = r2(gross - disc);
    const gstRate = r2(line.gst_rate != null ? line.gst_rate : payload.gst_rate || 0);
    const split = getGstSplit(gstRate, company && company.state_code, party && party.state_code);
    const cgA = r2((taxable * split.cgst) / 100);
    const sgA = r2((taxable * split.sgst) / 100);
    const igA = r2((taxable * split.igst) / 100);
    const c = r2((taxable * r2(line.cess_rate || 0)) / 100);
    const total = r2(taxable + cgA + sgA + igA + c);
    subtotal = r2(subtotal + gross);
    discount_amount = r2(discount_amount + disc);
    taxable_amount = r2(taxable_amount + taxable);
    cgst = r2(cgst + cgA); sgst = r2(sgst + sgA); igst = r2(igst + igA); cess = r2(cess + c);
    items.push({
      item_id: line.item_id || null,
      description: line.description || line.item_name || '',
      quantity: qty,
      unit: line.unit || 'Nos',
      rate,
      discount_percent: discPct,
      discount_amount: disc,
      taxable_amount: taxable,
      gst_rate: gstRate,
      cgst_amount: cgA,
      sgst_amount: sgA,
      igst_amount: igA,
      cess_amount: c,
      total_amount: total,
    });
  };

  // --- Sales / Purchase / Credit / Debit ---
  if (['Sales', 'Purchase', 'Credit Note', 'Debit Note'].includes(type)) {
    const lines = (payload.items || []).map(pushLine.bind(null));
    const total_tax = r2(cgst + sgst + igst + cess);
    const beforeRound = r2(taxable_amount + total_tax);
    const round = r2((payload.round_off != null ? payload.round_off : roundOff(beforeRound)));
    const grand = r2(beforeRound + round);
    const partyL = partyLedger(payload.party_id);
    if (['Sales', 'Credit Note'].includes(type)) {
      // Credit Note: sales decrease -> Dr Sales, Dr Output GST, Cr Party
      const salesLedger = conn().prepare("SELECT id FROM ledgers WHERE name = 'Sales Account'").get().id;
      if (type === 'Sales') {
        entries.push({ ledger_id: partyL, debit_amount: grand, credit_amount: 0, narration: 'Amount receivable' });
        entries.push({ ledger_id: salesLedger, debit_amount: 0, credit_amount: taxable_amount, narration: 'Sales' });
      } else {
        // credit note postings
        const salesReturnLedger = conn().prepare("SELECT id FROM ledgers WHERE name = 'Sales Account'").get().id;
        entries.push({ ledger_id: salesReturnLedger, debit_amount: taxable_amount, credit_amount: 0, narration: 'Sales return' });
        entries.push({ ledger_id: partyL, debit_amount: 0, credit_amount: grand, narration: 'Amount receivable reduced' });
      }
      if (cgst > 0) entries.push({ ledger_id: ledgerByName('CGST Output'), debit_amount: type === 'Credit Note' ? cgst : 0, credit_amount: type === 'Sales' ? cgst : 0, narration: 'CGST' });
      if (sgst > 0) entries.push({ ledger_id: ledgerByName('SGST Output'), debit_amount: type === 'Credit Note' ? sgst : 0, credit_amount: type === 'Sales' ? sgst : 0, narration: 'SGST' });
      if (igst > 0) entries.push({ ledger_id: ledgerByName('IGST Output'), debit_amount: type === 'Credit Note' ? igst : 0, credit_amount: type === 'Sales' ? igst : 0, narration: 'IGST' });
      if (cess > 0) entries.push({ ledger_id: ledgerByName('GST Cess'), debit_amount: type === 'Credit Note' ? cess : 0, credit_amount: type === 'Sales' ? cess : 0, narration: 'GST Cess' });
      if (type === 'Sales') {
        if (r2(round) > 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: 0, credit_amount: round, narration: 'Round off' });
        if (r2(round) < 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: r2(Math.abs(round)), credit_amount: 0, narration: 'Round off' });
      } else {
        // Credit Note: sales decrease, so round-off direction is reversed
        if (r2(round) > 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: round, credit_amount: 0, narration: 'Round off' });
        if (r2(round) < 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: 0, credit_amount: r2(Math.abs(round)), narration: 'Round off' });
      }
    } else {
      const purchaseLedger = conn().prepare("SELECT id FROM ledgers WHERE name = 'Purchase Account'").get().id;
      if (type === 'Purchase') {
        entries.push({ ledger_id: purchaseLedger, debit_amount: taxable_amount, credit_amount: 0, narration: 'Purchase' });
      } else {
        const purchaseReturnLedger = ledgerByName('Purchase Account');
        entries.push({ ledger_id: purchaseReturnLedger, debit_amount: 0, credit_amount: taxable_amount, narration: 'Purchase return' });
        // for debit note entry below Cr is handled by purchase account; party is added below
      }
      if (cgst > 0) entries.push({ ledger_id: ledgerByName('CGST Input'), debit_amount: type === 'Purchase' ? cgst : 0, credit_amount: type === 'Debit Note' ? cgst : 0, narration: 'CGST' });
      if (sgst > 0) entries.push({ ledger_id: ledgerByName('SGST Input'), debit_amount: type === 'Purchase' ? sgst : 0, credit_amount: type === 'Debit Note' ? sgst : 0, narration: 'SGST' });
      if (igst > 0) entries.push({ ledger_id: ledgerByName('IGST Input'), debit_amount: type === 'Purchase' ? igst : 0, credit_amount: type === 'Debit Note' ? igst : 0, narration: 'IGST' });
      if (cess > 0) entries.push({ ledger_id: ledgerByName('GST Cess'), debit_amount: type === 'Purchase' ? cess : 0, credit_amount: type === 'Debit Note' ? cess : 0, narration: 'GST Cess' });
      if (type === 'Purchase') {
        if (r2(round) > 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: round, credit_amount: 0, narration: 'Round off' });
        if (r2(round) < 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: 0, credit_amount: r2(Math.abs(round)), narration: 'Round off' });
        entries.push({ ledger_id: partyL, debit_amount: 0, credit_amount: grand, narration: 'Amount payable' });
      } else {
        // Debit Note: purchase return, add round-off on the credit side when positive
        if (r2(round) > 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: 0, credit_amount: round, narration: 'Round off' });
        if (r2(round) < 0) entries.push({ ledger_id: ledgerByName('Round Off'), debit_amount: r2(Math.abs(round)), credit_amount: 0, narration: 'Round off' });
        entries.push({ ledger_id: partyL, debit_amount: grand, credit_amount: 0, narration: 'Amount payable reduced' });
      }
    }
    for (const l of items) {
      if (l.item_id) {
        if (type === 'Sales') stockEffects.push({ item_id: l.item_id, qty: r2(-l.quantity) });
        if (type === 'Purchase') stockEffects.push({ item_id: l.item_id, qty: r2(l.quantity) });
        if (type === 'Credit Note') stockEffects.push({ item_id: l.item_id, qty: r2(l.quantity) });
        if (type === 'Debit Note') stockEffects.push({ item_id: l.item_id, qty: r2(-l.quantity) });
      }
    }
    return { header: buildHeader(payload, { subtotal, discount_amount, taxable_amount, cgst, sgst, igst, cess, total_tax, round, grand }), items, entries, stockEffects, party, fy };
  }

  // --- Payment / Receipt / Contra ---
  if (['Payment', 'Receipt', 'Contra', 'Expense'].includes(type)) {
    const amount = r2(payload.amount || 0);
    if (amount <= 0) throw new Error('Amount must be greater than zero.');
    if (type === 'Contra') {
      const from = Number(payload.from_ledger_id);
      const to = Number(payload.to_ledger_id);
      if (!from || !to) throw new Error('Select both bank/cash accounts.');
      if (from === to) throw new Error('Source and destination accounts must differ.');
      entries.push({ ledger_id: from, debit_amount: amount, credit_amount: 0, narration: payload.narration || 'Contra' });
      entries.push({ ledger_id: to, debit_amount: 0, credit_amount: amount, narration: payload.narration || 'Contra' });
      return { header: buildHeader(payload, { subtotal: amount, discount_amount: 0, taxable_amount: amount, cgst: 0, sgst: 0, igst: 0, cess: 0, total_tax: 0, round: 0, grand: amount }), items, entries, stockEffects, party, fy };
    }
    const bankLedger = Number(payload.bank_ledger_id);
    const counterLedger = Number(payload.ledger_id) || (payload.party_id ? partyLedger(payload.party_id) : 0);
    if (!bankLedger || !counterLedger) throw new Error('Select the cash/bank account and the other account or party.');
    if (type === 'Payment') {
      entries.push({ ledger_id: counterLedger, debit_amount: amount, credit_amount: 0, narration: 'Payment to party/account' });
      entries.push({ ledger_id: bankLedger, debit_amount: 0, credit_amount: amount, narration: 'Payment' });
    } else if (type === 'Receipt') {
      entries.push({ ledger_id: bankLedger, debit_amount: amount, credit_amount: 0, narration: 'Receipt' });
      entries.push({ ledger_id: counterLedger, debit_amount: 0, credit_amount: amount, narration: 'Received from party/account' });
    } else if (type === 'Expense') {
      const gstRate = r2(payload.gst_rate || 0);
      let taxable = amount;
      let gst = 0;
      if (gstRate > 0) {
        taxable = r2(amount / (1 + gstRate / 100));
        gst = r2(amount - taxable);
      }
      const split = getGstSplit(gstRate, company && company.state_code, payload.is_interstate ? 'XX' : (company && company.state_code));
      const cgA = r2((taxable * split.cgst) / 100);
      const sgA = r2((taxable * split.sgst) / 100);
      const igA = r2((taxable * split.igst) / 100);
      entries.push({ ledger_id: counterLedger, debit_amount: taxable, credit_amount: 0, narration: 'Expense' });
      if (cgA > 0) entries.push({ ledger_id: ledgerByName('CGST Input'), debit_amount: cgA, credit_amount: 0, narration: 'CGST' });
      if (sgA > 0) entries.push({ ledger_id: ledgerByName('SGST Input'), debit_amount: sgA, credit_amount: 0, narration: 'SGST' });
      if (igA > 0) entries.push({ ledger_id: ledgerByName('IGST Input'), debit_amount: igA, credit_amount: 0, narration: 'IGST' });
      entries.push({ ledger_id: bankLedger, debit_amount: 0, credit_amount: amount, narration: payload.narration || 'Expense' });
      taxable_amount = taxable; cgst = cgA; sgst = sgA; igst = igA; cess = 0;
      return { header: buildHeader(payload, { subtotal: taxable, discount_amount: 0, taxable_amount: taxable, cgst, sgst, igst, cess, total_tax: r2(gst), round: r2(amount - taxable - gst), grand: amount }), items, entries, stockEffects, party, fy };
    }
    return { header: buildHeader(payload, { subtotal: amount, discount_amount: 0, taxable_amount: amount, cgst: 0, sgst: 0, igst: 0, cess: 0, total_tax: 0, round: 0, grand: amount }), items, entries, stockEffects, party, fy };
  }

  // --- Journal ---
  if (type === 'Journal') {
    const lines = (payload.entries || []).map((e) => ({
      ledger_id: Number(e.ledger_id),
      debit_amount: r2(e.debit || e.debit_amount || 0),
      credit_amount: r2(e.credit || e.credit_amount || 0),
      narration: e.narration || '',
    }));
    const clean = lines.filter((e) => e.ledger_id && (e.debit_amount || e.credit_amount));
    clean.forEach((e) => { if (e.debit_amount && e.credit_amount) throw new Error('A journal line cannot have both debit and credit.'); });
    const dr = r2(clean.reduce((s, e) => s + e.debit_amount, 0));
    const cr = r2(clean.reduce((s, e) => s + e.credit_amount, 0));
    if (dr !== cr) throw new Error(`Journal is not balanced (Dr ${dr} / Cr ${cr}).`);
    const total = dr;
    return { header: buildHeader(payload, { subtotal: total, discount_amount: 0, taxable_amount: total, cgst: 0, sgst: 0, igst: 0, cess: 0, total_tax: 0, round: 0, grand: total }), items, entries: clean, stockEffects, party, fy };
  }

  throw new Error('Unsupported voucher type: ' + type);
}

function ledgerByName(name) {
  const row = conn().prepare('SELECT id FROM ledgers WHERE name = ?').get(name);
  if (!row) throw new Error('System ledger missing: ' + name);
  return row.id;
}
function amountWords(value) {
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
  const three = (n) => {
    const h = Math.floor(n / 100), r = n % 100;
    let s = h ? ONES[h] + ' Hundred' : '';
    if (r) s += (s ? ' ' : '') + two(r);
    return s;
  };
  const words = (n) => {
    let s = '';
    const c = Math.floor(n / 10000000), l = Math.floor((n % 10000000) / 100000), t = Math.floor((n % 100000) / 1000), h = n % 1000;
    if (c) s += words(c) + ' Crore';
    if (l) s += (s ? ' ' : '') + two(l) + ' Lakh';
    if (t) s += (s ? ' ' : '') + two(t) + ' Thousand';
    if (h) s += (s ? ' ' : '') + three(h);
    return s;
  };
  const n = Number(value) || 0;
  const sign = n < 0 ? 'Minus ' : '';
  const abs = Math.abs(n);
  const rupees = Math.floor(abs);
  const paise = Math.round((abs - rupees) * 100);
  let out = sign + 'Rupees ' + (words(rupees) || 'Zero');
  if (paise > 0) out += ' and ' + two(paise) + ' Paise';
  return out + ' Only';
}
function buildHeader(payload, calc) {
  const party = payload.party_id ? getParty(payload.party_id) : null;
  return {
    voucher_number: payload.voucher_number || nextVoucherNumber(payload.voucher_type),
    voucher_type: payload.voucher_type,
    date: payload.date || today(),
    party_id: payload.party_id || null,
    reference_number: payload.reference_number || '',
    narration: payload.narration || '',
    subtotal: r2(calc.subtotal),
    discount_amount: r2(calc.discount_amount),
    taxable_amount: r2(calc.taxable_amount),
    cgst_amount: r2(calc.cgst),
    sgst_amount: r2(calc.sgst),
    igst_amount: r2(calc.igst),
    cess_amount: r2(calc.cess),
    total_tax: r2(calc.total_tax),
    round_off: r2(calc.round),
    grand_total: r2(calc.grand),
    amount_in_words: payload.amount_in_words || amountWords(calc.grand),
    status: payload.status === 'Draft' ? 'Draft' : 'Active',
    financial_year_id: calc.fy ? calc.fy.id : (ensureCurrentFY() || {}).id,
  };
}
function checkClosedFY(date) {
  const fy = getActiveFY();
  if (!fy) return;
  if (String(date) < String(fy.start_date) && fy.is_closed) throw new Error('Selected date is in a closed financial year.');
}

/**
 * Persist a voucher, all line items, accounting entries and stock effects in
 * a single SQLite transaction. Existing voucher id triggers an update that
 * first reverses the previous entries/stock, then re-posts.
 */
function createOrUpdateVoucher(id, payload) {
  const connx = conn();
  const op = connx.transaction(() => {
    let oldHeader = null;
    if (id) {
      const old = getVoucher(id);
      if (!old) throw new Error('Voucher not found.');
      if (old.status === 'Cancelled') throw new Error('Cancelled vouchers cannot be edited. Create a new voucher.');
      oldHeader = old;
      // reverse previous stock
      const oldItems = connx.prepare('SELECT * FROM voucher_items WHERE voucher_id = ?').all(id);
      reverseStock(oldItems);
      connx.prepare('DELETE FROM voucher_items WHERE voucher_id = ?').run(id);
      connx.prepare('DELETE FROM accounting_entries WHERE voucher_id = ?').run(id);
    }
    const built = buildVoucher(payload);
    checkClosedFY(built.header.date);
    const header = built.header;
    let voucherId;
    if (id) {
      voucherId = id;
      connx.prepare(
        `UPDATE vouchers SET voucher_number=@voucher_number, voucher_type=@voucher_type, date=@date, party_id=@party_id,
         reference_number=@reference_number, narration=@narration, subtotal=@subtotal, discount_amount=@discount_amount,
         taxable_amount=@taxable_amount, cgst_amount=@cgst_amount, sgst_amount=@sgst_amount, igst_amount=@igst_amount,
         cess_amount=@cess_amount, total_tax=@total_tax, round_off=@round_off, grand_total=@grand_total,
         amount_in_words=@amount_in_words, status=@status, financial_year_id=@financial_year_id, updated_at=@updated_at
         WHERE id=@id`
      ).run({ ...header, id, updated_at: nowIso() });
    } else {
      const info = connx
        .prepare(
          `INSERT INTO vouchers (voucher_number, voucher_type, date, party_id, reference_number, narration,
           subtotal, discount_amount, taxable_amount, cgst_amount, sgst_amount, igst_amount, cess_amount,
           total_tax, round_off, grand_total, amount_in_words, status, financial_year_id)
           VALUES (@voucher_number,@voucher_type,@date,@party_id,@reference_number,@narration,@subtotal,@discount_amount,
           @taxable_amount,@cgst_amount,@sgst_amount,@igst_amount,@cess_amount,@total_tax,@round_off,@grand_total,
           @amount_in_words,@status,@financial_year_id)`
        )
        .run(header);
      voucherId = info.lastInsertRowid;
    }
    const itemStmt = connx.prepare(
      `INSERT INTO voucher_items (voucher_id,item_id,description,quantity,unit,rate,discount_percent,discount_amount,taxable_amount,gst_rate,cgst_amount,sgst_amount,igst_amount,cess_amount,total_amount)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    );
    for (const it of built.items) {
      itemStmt.run(voucherId, it.item_id, it.description, it.quantity, it.unit, it.rate, it.discount_percent, it.discount_amount, it.taxable_amount, it.gst_rate, it.cgst_amount, it.sgst_amount, it.igst_amount, it.cess_amount, it.total_amount);
    }
    ensureBalanced(built.entries);
    saveEntries(voucherId, built.entries, built.header.date);
    for (const s of built.stockEffects) adjustStock(s.item_id, s.qty);
    if (built.party) {
      const p = getParty(built.party.id);
      if (p.credit_limit > 0 && built.header.voucher_type === 'Sales') {
        const bal = ledgerBalance(p.ledger_id, built.header.date);
        if (Math.abs(bal.amount) > p.credit_limit) {
          audit('warn', 'credit-limit', built.party.id, null, { amount: Math.abs(bal.amount), limit: p.credit_limit });
        }
      }
    }
    audit(id ? 'update' : 'create', 'vouchers', voucherId, oldHeader, header);
    return getVoucher(voucherId);
  });
  return op();
}
function reverseStock(oldItems) {
  for (const it of oldItems) {
    if (!it.item_id) continue;
    const v = getVoucher(it.voucher_id);
    if (!v) continue;
    if (v.voucher_type === 'Sales') adjustStock(it.item_id, it.quantity);
    else if (v.voucher_type === 'Purchase') adjustStock(it.item_id, -it.quantity);
    else if (v.voucher_type === 'Credit Note') adjustStock(it.item_id, -it.quantity);
    else if (v.voucher_type === 'Debit Note') adjustStock(it.item_id, it.quantity);
  }
}
function cancelVoucher(id) {
  const old = getVoucher(id);
  if (!old) throw new Error('Voucher not found.');
  if (old.status === 'Cancelled') throw new Error('Voucher is already cancelled.');
  const tx = conn().transaction(() => {
    reverseStock(old.items);
    conn().prepare('UPDATE vouchers SET status = ?, updated_at = ? WHERE id = ?').run('Cancelled', nowIso(), id);
    conn().prepare('DELETE FROM accounting_entries WHERE voucher_id = ?').run(id);
    conn().prepare('DELETE FROM voucher_items WHERE voucher_id = ?').run(id);
  });
  tx();
  audit('cancel', 'vouchers', id, old, { status: 'Cancelled' });
  return getVoucher(id);
}
function deleteVoucher(id) {
  const old = getVoucher(id);
  if (!old) throw new Error('Voucher not found.');
  const tx = conn().transaction(() => {
    reverseStock(old.items);
    conn().prepare('DELETE FROM accounting_entries WHERE voucher_id = ?').run(id);
    conn().prepare('DELETE FROM voucher_items WHERE voucher_id = ?').run(id);
    conn().prepare('DELETE FROM vouchers WHERE id = ?').run(id);
  });
  tx();
  audit('delete', 'vouchers', id, old, null);
  return true;
}

// ---------------------------------------------------------------------------
// Balance / ledger helpers
// ---------------------------------------------------------------------------
function ledgerMovement(ledger_id, from, to) {
  const sql = 'SELECT COALESCE(SUM(debit_amount),0) dr, COALESCE(SUM(credit_amount),0) cr FROM accounting_entries WHERE ledger_id=? AND date>=? AND date<=?';
  return conn().prepare(sql).get(ledger_id, from || '0000-01-01', to || '9999-12-31');
}
function signedBalanceFor(ledger, dr, cr) {
  const od = Number(ledger.opening_balance || 0);
  const oc = ledger.opening_balance_type === 'Cr' ? od : 0;
  const odr = ledger.opening_balance_type === 'Dr' ? od : 0;
  const debit = odr + Number(dr || 0);
  const credit = oc + Number(cr || 0);
  if (ledger.nature === 'Liabilities' || ledger.nature === 'Income') {
    const sign = r2(credit - debit);
    return sign >= 0 ? { amount: sign, type: 'Cr' } : { amount: r2(-sign), type: 'Dr' };
  }
  const sign = r2(debit - credit);
  return sign >= 0 ? { amount: sign, type: 'Dr' } : { amount: r2(-sign), type: 'Cr' };
}
function ledgerBalance(ledger_id, asOf) {
  const l = getLedger(ledger_id);
  if (!l) throw new Error('Ledger not found: ' + ledger_id);
  const m = ledgerMovement(ledger_id, l.nature === 'Liabilities' || l.nature === 'Income' ? '0000-01-01' : '0000-01-01', asOf);
  return signedBalanceFor(l, m.dr, m.cr);
}
function accountBalance(groupRootId, asOf) {
  // returns { debit, credit } aggregate over ledgers in group and descendants
  const ids = [];
  const walk = (id) => {
    ids.push(id);
    const childs = conn().prepare('SELECT id FROM account_groups WHERE parent_id = ?').all(id).map((r) => r.id);
    childs.forEach(walk);
  };
  walk(groupRootId);
  const qs = ids.map(() => '?').join(',');
  const ledgers = conn().prepare(`SELECT l.*, g.nature FROM ledgers l JOIN account_groups g ON g.id=l.group_id WHERE l.group_id IN (${qs})`).all(...ids);
  let debit = 0, credit = 0;
  for (const l of ledgers) {
    const bal = ledgerBalance(l.id, asOf);
    if (bal.type === 'Dr') debit = r2(debit + bal.amount);
    else credit = r2(credit + bal.amount);
  }
  return { debit, credit };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
function trialBalance(from, to) {
  from = from || '0000-01-01'; to = to || '9999-12-31';
  const ledgers = conn()
    .prepare(`SELECT l.*, g.name AS group_name, g.nature FROM ledgers l LEFT JOIN account_groups g ON g.id=l.group_id WHERE l.is_active=1 ORDER BY g.nature, l.name`)
    .all();
  let debitTotal = 0, creditTotal = 0;
  const rows = ledgers.map((l) => {
    const m = ledgerMovement(l.id, from, to);
    const bal = signedBalanceFor(l, m.dr, m.cr);
    const isDebit = bal.type === 'Dr';
    if (isDebit) debitTotal = r2(debitTotal + bal.amount); else creditTotal = r2(creditTotal + bal.amount);
    return { ledger_id: l.id, name: l.name, group_name: l.group_name, nature: l.nature, debit: isDebit ? bal.amount : 0, credit: isDebit ? 0 : bal.amount };
  });
  return { rows, debit_total: debitTotal, credit_total: creditTotal, balanced: r2(debitTotal - creditTotal) === 0 };
}

function profitLoss(from, to) {
  const ledgers = conn()
    .prepare(`SELECT l.id, l.name, l.group_id, g.name AS group_name, g.parent_id AS group_parent_id, g.nature
              FROM ledgers l JOIN account_groups g ON g.id=l.group_id
              WHERE g.nature IN ('Income','Expense') AND l.is_active=1`)
    .all();
  const byGroup = {};
  for (const l of ledgers) {
    const m = ledgerMovement(l.id, from, to);
    const bal = signedBalanceFor({ ...l, opening_balance: 0, opening_balance_type: 'Dr' }, m.dr, m.cr);
    // using signed balance with zero opening & nature rules gives income as Cr, expense as Dr
    byGroup[l.id] = { ...l, balance: bal.amount, type: bal.type };
  }
  const incomeRows = ledgers.filter((l) => l.nature === 'Income').map((l) => ({ ...byGroup[l.id] }));
  const expenseRows = ledgers.filter((l) => l.nature === 'Expense').map((l) => ({ ...byGroup[l.id] }));

  const isDirectIncome = (g) => g.group_name && (g.group_name.includes('Sales') || g.group_parent_id === null && g.group_name === 'Direct Incomes');
  const isDirectExpense = (g) => g && (g.group_name === 'Purchase Accounts' || g.group_name === 'Manufacturing Expenses' || (g.group_parent_id === 23) || g.group_name === 'Direct Expenses');
  const isIndirectIncome = (g) => g.nature === 'Income' && !isDirectIncome(g);
  const isIndirectExpense = (g) => g.nature === 'Expense' && !isDirectExpense(g);

  const sumIncome = (pred) => r2(incomeRows.filter((r) => pred(r)).reduce((s, r) => s + amountForPnl(r), 0));
  const sumExpense = (pred) => r2(expenseRows.filter((r) => pred(r)).reduce((s, r) => s + amountForPnl(r), 0));
  function amountForPnl(r) { return r.balance || 0; }

  const sales = sumIncome((r) => isDirectIncome(r));
  const directExpenses = sumExpense((r) => isDirectExpense(r));
  const grossProfit = r2(sales - directExpenses);
  const indirectIncome = sumIncome((r) => isIndirectIncome(r));
  const indirectExpense = sumExpense((r) => isIndirectExpense(r));
  const netProfit = r2(grossProfit + indirectIncome - indirectExpense);
  return {
    from, to,
    income: incomeRows, expense: expenseRows,
    sales, purchasing: directExpenses, gross_profit: grossProfit,
    indirect_income: indirectIncome, indirect_expense: indirectExpense,
    net_profit: netProfit,
  };
}

function balanceSheet(asOf) {
  const company = getCompany();
  const p = profitLoss('0000-01-01', asOf);
  const netProfit = p.net_profit;
  const groupIds = {
    capital: groupIdByName('Capital Account'),
    reserves: groupIdByName('Reserves & Surplus'),
    currentLiab: groupIdByName('Current Liabilities'),
    loans: groupIdByName('Loans (Liability)'),
    fixedAssets: groupIdByName('Fixed Assets'),
    investments: groupIdByName('Investments'),
    currentAssets: groupIdByName('Current Assets'),
  };
  const gcap = accountBalance(groupIds.capital, asOf);
  const gres = accountBalance(groupIds.reserves, asOf);
  const gcl = accountBalance(groupIds.currentLiab, asOf);
  const gl = accountBalance(groupIds.loans, asOf);
  const gfa = accountBalance(groupIds.fixedAssets, asOf);
  const gi = accountBalance(groupIds.investments, asOf);
  const gca = accountBalance(groupIds.currentAssets, asOf);

  const liabilities = [
    { name: 'Capital Account', debit: gcap.debit, credit: gcap.credit },
    { name: 'Reserves & Surplus', debit: gres.debit, credit: gres.credit },
    { name: 'Net Profit / Loss', debit: netProfit < 0 ? r2(Math.abs(netProfit)) : 0, credit: netProfit > 0 ? netProfit : 0 },
    { name: 'Current Liabilities', debit: gcl.debit, credit: gcl.credit },
    { name: 'Loans (Liability)', debit: gl.debit, credit: gl.credit },
  ];
  const assets = [
    { name: 'Fixed Assets', debit: gfa.debit, credit: gfa.credit },
    { name: 'Investments', debit: gi.debit, credit: gi.credit },
    { name: 'Current Assets', debit: gca.debit, credit: gca.credit },
  ];
  const liabTotal = r2(liabilities.reduce((s, r) => s + r.credit - r.debit, 0));
  const assetTotal = r2(assets.reduce((s, r) => s + r.debit - r.credit, 0));
  return { as_of: asOf, liabilities, assets, liabilities_total: liabTotal, assets_total: assetTotal, balanced: r2(liabTotal - assetTotal) === 0, net_profit: netProfit };
}

function groupIdByName(name) {
  const r = conn().prepare('SELECT id FROM account_groups WHERE name = ?').get(name);
  if (!r) throw new Error('Group missing: ' + name);
  return r.id;
}

function isCashLike(ledger) {
  return ledger && (ledger.group_name === 'Cash-in-Hand' || ledger.group_name === 'Bank Accounts');
}

function cashFlow(from, to) {
  const ledgers = conn()
    .prepare(`SELECT l.*, g.name AS group_name FROM ledgers l LEFT JOIN account_groups g ON g.id=l.group_id WHERE l.is_active=1`)
    .all();
  const cashLedgers = ledgers.filter(isCashLike);
  const categories = { Operating: 0, Investing: 0, Financing: 0 };
  const allEntries = conn().prepare(`SELECT e.* FROM accounting_entries e WHERE e.date>=? AND e.date<=?`).all(from, to);
  for (const entry of allEntries) {
    const l = ledgers.find((x) => x.id === entry.ledger_id);
    if (!isCashLike(l)) continue;
    const v = conn().prepare('SELECT * FROM vouchers WHERE id = ?').get(entry.voucher_id);
    if (!v) continue;
    const partner = conn().prepare(`SELECT e2.ledger_id, l2.name, g.name AS group_name, g.nature FROM accounting_entries e2 JOIN ledgers l2 ON l2.id=e2.ledger_id LEFT JOIN account_groups g ON g.id=l2.group_id WHERE e2.voucher_id=? AND e2.ledger_id<>? LIMIT 1`).get(entry.voucher_id, entry.ledger_id);
    let cat = 'Operating';
    if (partner) {
      const pn = partner.group_name || '';
      if (/Fixed Assets|Investments/.test(pn)) cat = 'Investing';
      else if (/Loan|Capital Account/.test(pn)) cat = 'Financing';
    }
    const delta = r2((entry.debit_amount || 0) - (entry.credit_amount || 0));
    categories[cat] = r2(categories[cat] + delta);
  }
  const opening = r2(cashLedgers.reduce((s, l) => {
    const b = ledgerBalance(l.id, from);
    return s + (b.type === 'Cr' ? -b.amount : b.amount);
  }, 0));
  const closing = r2(cashLedgers.reduce((s, l) => {
    const b = ledgerBalance(l.id, to);
    return s + (b.type === 'Cr' ? -b.amount : b.amount);
  }, 0));
  categories.NetChange = r2(closing - opening);
  return { opening, closing, categories, ledgers: cashLedgers };
}

function dayBook(from, to) {
  const data = listVouchers({ from, to, page_size: 5000, page: 1 });
  return data.rows;
}

function ledgerReport(ledger_id, from, to) {
  const l = getLedger(ledger_id);
  if (!l) throw new Error('Ledger not found.');
  const openingBal = ledgerBalance(ledger_id, from ? addDays(from, -1) : '0000-01-01');
  const rows = conn()
    .prepare(`SELECT e.*, v.voucher_number, v.voucher_type, v.date AS vdate FROM accounting_entries e JOIN vouchers v ON v.id=e.voucher_id WHERE e.ledger_id=? AND e.date>=? AND e.date<=? ORDER BY e.date, e.id`)
    .all(ledger_id, from || '0000-01-01', to || '9999-12-31');
  let balance = openingBal.type === 'Cr' ? -openingBal.amount : openingBal.amount;
  const out = rows.map((e) => {
    const bet = Number(e.debit_amount || 0) - Number(e.credit_amount || 0);
    balance = r2(balance + bet);
    return { ...e, running_balance: r2(Math.abs(balance)), running_type: balance >= 0 ? 'Dr' : 'Cr' };
  });
  const closing = ledgerBalance(ledger_id, to || '9999-12-31');
  return { ledger: l, opening_balance: openingBal, rows: out, closing_balance: closing };
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function outstanding(type, asOf) {
  asOf = asOf || '9999-12-31';
  const partyType = type === 'payable' ? 'Vendor' : 'Customer';
  const parties = conn()
    .prepare(`SELECT p.*, l.name AS ledger_name, g.name AS group_name, g.nature FROM parties p
              LEFT JOIN ledgers l ON l.id=p.ledger_id LEFT JOIN account_groups g ON g.id=l.group_id
              WHERE p.is_active=1 AND (p.type=? OR p.type='Both') ORDER BY p.name`)
    .all(partyType);
  const rows = [];
  for (const p of parties) {
    if (!p.ledger_id) continue;
    const bal = ledgerBalance(p.ledger_id, asOf);
    const amount = type === 'payable' ? (bal.type === 'Cr' ? bal.amount : (bal.type === 'Dr' ? -bal.amount : 0)) : (bal.type === 'Dr' ? bal.amount : -bal.amount);
    if (Math.abs(amount) > 0.009) rows.push({ ...p, amount: r2(Math.abs(amount)), balance_type: amount >= 0 ? (type === 'payable' ? 'Cr' : 'Dr') : (type === 'payable' ? 'Dr' : 'Cr') });
  }
  const total = r2(rows.reduce((s, r) => s + r.amount, 0));
  return { rows, total };
}

function agingReport(asOf) {
  asOf = asOf || today();
  const rec = outstanding('receivable', asOf);
  const buckets = { '0-30': [], '31-60': [], '61-90': [], '90+': [] };
  for (const p of rec.rows) {
    const last = conn().prepare(`SELECT MAX(v.date) d FROM vouchers v WHERE v.party_id=? AND v.status='Active'`).get(p.id).d || asOf;
    const days = Math.max(0, Math.floor((new Date(asOf + 'T00:00:00') - new Date(last)) / 86400000));
    const key = days <= 30 ? '0-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+';
    buckets[key].push({ ...p, from_date: last, days });
  }
  const totals = {};
  for (const k of Object.keys(buckets)) totals[k] = r2(buckets[k].reduce((s, r) => s + r.amount, 0));
  return { buckets, totals, total: rec.total };
}

function salesRegister(from, to) {
  return listVouchers({ voucher_type: 'Sales', from, to, page_size: 5000, page: 1 }).rows;
}
function purchaseRegister(from, to) {
  return listVouchers({ voucher_type: 'Purchase', from, to, page_size: 5000, page: 1 }).rows;
}
function stockSummary() {
  const items = listItems();
  return items.map((i) => ({ ...i, value: r2(i.current_stock * i.sale_price) }));
}
function expenseReport(from, to) {
  const rows = listVouchers({ voucher_type: 'Expense', from, to, page_size: 5000, page: 1 }).rows;
  const total = r2(rows.reduce((s, r) => s + r.grand_total, 0));
  return { rows, total };
}

// ---------------------------------------------------------------------------
// GST reports
// ---------------------------------------------------------------------------
function gstDashboard(from, to) {
  const output = listVouchers({ voucher_type: 'Sales', from, to, page_size: 5000, page: 1 }).rows.filter((r) => r.status === 'Active');
  const input = listVouchers({ voucher_type: 'Purchase', from, to, page_size: 5000, page: 1 }).rows.filter((r) => r.status === 'Active');
  const creditNotes = listVouchers({ voucher_type: 'Credit Note', from, to, page_size: 5000, page: 1 }).rows.filter((r) => r.status === 'Active');
  const debitNotes = listVouchers({ voucher_type: 'Debit Note', from, to, page_size: 5000, page: 1 }).rows.filter((r) => r.status === 'Active');
  const sum = (arr, f) => r2(arr.reduce((s, r) => s + Number(f(r) || 0), 0));
  const tax = (r) => r.cgst_amount + r.sgst_amount + r.igst_amount + r.cess_amount;
  const outputTaxable = r2(sum(output, (r) => r.taxable_amount) - sum(creditNotes, (r) => r.taxable_amount));
  const inputTaxable = r2(sum(input, (r) => r.taxable_amount) - sum(debitNotes, (r) => r.taxable_amount));
  const outputTax = r2(sum(output, tax) - sum(creditNotes, tax));
  const inputTax = r2(sum(input, tax) - sum(debitNotes, tax));
  return {
    from, to,
    output_taxable: outputTaxable,
    output_tax: outputTax,
    input_taxable: inputTaxable,
    input_tax: inputTax,
    net_payable: r2(outputTax - inputTax),
    sales_count: output.length, purchase_count: input.length,
  };
}
function gstr1(from, to) {
  const sales = listVouchers({ voucher_type: 'Sales', from, to, page_size: 5000, page: 1 }).rows;
  const credits = listVouchers({ voucher_type: 'Credit Note', from, to, page_size: 5000, page: 1 }).rows;
  const b2b = [];
  const b2c = [];
  for (const v of sales) {
    const p = v.party_id ? getParty(v.party_id) : null;
    const gstType = v.igst_amount > 0 ? 'IGST' : 'INTRA';
    (p && p.gstin ? b2b : b2c).push({ ...v, place_of_supply: getParty(v.party_id) ? getParty(v.party_id).state_code : '', gst_type: gstType });
  }
  const hsn = {};
  for (const v of sales) {
    const items = conn().prepare('SELECT * FROM voucher_items WHERE voucher_id = ?').all(v.id);
    for (const it of items) {
      const key = `${it.item_id || 'NA'}|${it.hsn_sac_code || getHsn(it.item_id)}|${it.gst_rate}`;
      if (!hsn[key]) hsn[key] = { item: it.description, hsn: it.hsn_sac_code || getHsn(it.item_id), gst_rate: it.gst_rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 };
      hsn[key].taxable = r2(hsn[key].taxable + it.taxable_amount);
      hsn[key].cgst = r2(hsn[key].cgst + it.cgst_amount);
      hsn[key].sgst = r2(hsn[key].sgst + it.sgst_amount);
      hsn[key].igst = r2(hsn[key].igst + it.igst_amount);
      hsn[key].cess = r2(hsn[key].cess + it.cess_amount);
    }
  }
  return { from, to, b2b, b2c, credit_notes: credits, hsn: Object.values(hsn) };
}
function getHsn(itemId) {
  if (!itemId) return '';
  const i = getItem(itemId);
  return i ? i.hsn_sac_code : '';
}
function gstr3b(from, to) {
  const d = gstDashboard(from, to);
  const company = getCompany();
  const out = {
    taxable: d.output_taxable,
    cgst: r2(moveLedger('CGST Output', from, to)),
    sgst: r2(moveLedger('SGST Output', from, to)),
    igst: r2(moveLedger('IGST Output', from, to)),
    cess: r2(moveLedger('GST Cess', from, to)),
  };
  const inp = {
    taxable: d.input_taxable,
    cgst: r2(moveLedger('CGST Input', from, to)),
    sgst: r2(moveLedger('SGST Input', from, to)),
    igst: r2(moveLedger('IGST Input', from, to)),
    cess: 0,
  };
  out.tax = r2(out.cgst + out.sgst + out.igst + out.cess);
  inp.tax = r2(inp.cgst + inp.sgst + inp.igst + inp.cess);
  return {
    company, from, to,
    outward: out,
    input: inp,
    net_payable: d.net_payable,
    printable: { output_taxable: out.taxable, output_tax: out.tax, output_cgst: out.cgst, output_sgst: out.sgst, output_igst: out.igst, input_taxable: inp.taxable, input_tax: inp.tax, input_cgst: inp.cgst, input_sgst: inp.sgst, input_igst: inp.igst, net_payable: d.net_payable },
  };
}
function moveLedger(name, from, to) {
  const l = conn().prepare('SELECT * FROM ledgers WHERE name = ?').get(name);
  if (!l) return 0;
  const m = ledgerMovement(l.id, from, to);
  const bal = signedBalanceFor(l, m.dr, m.cr);
  return r2(Math.abs(bal.amount));
}
function gstLedger(from, to) {
  const names = ['CGST Input', 'SGST Input', 'IGST Input', 'CGST Output', 'SGST Output', 'IGST Output', 'GST Cess'];
  const rows = names.map((name) => {
    const l = conn().prepare('SELECT * FROM ledgers WHERE name = ?').get(name);
    if (!l) return { name, debit: 0, credit: 0, balance: 0 };
    const m = ledgerMovement(l.id, from, to);
    const bal = signedBalanceFor(l, m.dr, m.cr);
    return { name, debit: r2(m.dr), credit: r2(m.cr), balance: bal.type === 'Dr' ? bal.amount : -bal.amount };
  });
  return { from, to, rows };
}

// ---------------------------------------------------------------------------
// Bank transactions / reconciliation
// ---------------------------------------------------------------------------
function listBankTransactions(filter) {
  filter = filter || {};
  let sql = `SELECT bt.*, b.bank_name, v.voucher_number FROM bank_transactions bt
             LEFT JOIN banks b ON b.id=bt.bank_id LEFT JOIN vouchers v ON v.id=bt.voucher_id WHERE 1=1`;
  const params = [];
  if (filter.bank_id) { sql += ' AND bt.bank_id = ?'; params.push(filter.bank_id); }
  if (filter.reconciled !== undefined && filter.reconciled !== '') { sql += ' AND bt.is_reconciled = ?'; params.push(filter.reconciled === 1 || filter.reconciled === '1' ? 1 : 0); }
  sql += ' ORDER BY bt.date DESC, bt.id DESC';
  return conn().prepare(sql).all(...params);
}
function addBankTransaction(data) {
  const info = conn()
    .prepare('INSERT INTO bank_transactions (bank_id,voucher_id,date,type,amount,reference,is_reconciled) VALUES (?,?,?,?,?,?,0)')
    .run(data.bank_id, data.voucher_id || null, data.date, data.type === 'Withdrawal' ? 'Withdrawal' : 'Deposit', r2(data.amount), data.reference || '');
  audit('create', 'bank-transactions', info.lastInsertRowid, null, data);
  return conn().prepare('SELECT * FROM bank_transactions WHERE id = ?').get(info.lastInsertRowid);
}
function reconcileBankTransaction(id, voucherId) {
  const old = conn().prepare('SELECT * FROM bank_transactions WHERE id = ?').get(id);
  if (!old) throw new Error('Bank transaction not found.');
  conn().prepare('UPDATE bank_transactions SET voucher_id=?, is_reconciled=1, reconciled_date=? WHERE id=?').run(voucherId || old.voucher_id, today(), id);
  audit('update', 'bank-reconciliation', id, old, { voucher_id: voucherId });
  return conn().prepare('SELECT * FROM bank_transactions WHERE id = ?').get(id);
}
function unreconcileBankTransaction(id) {
  const old = conn().prepare('SELECT * FROM bank_transactions WHERE id = ?').get(id);
  if (!old) throw new Error('Bank transaction not found.');
  conn().prepare('UPDATE bank_transactions SET voucher_id=null, is_reconciled=0, reconciled_date=null WHERE id=?').run(id);
  audit('update', 'bank-reconciliation', id, { is_reconciled: 1 }, { is_reconciled: 0 });
  return true;
}
function bankStatement(bank_id, from, to) {
  const bank = getBank(bank_id);
  if (!bank) throw new Error('Bank not found.');
  const opening = ledgerBalance(bank.ledger_id, addDays(from || '0000-01-01', -1));
  let balance = opening.type === 'Cr' ? -opening.amount : opening.amount;
  const txns = listBankTransactions({ bank_id });
  const rows = txns
    .filter((t) => (!from || t.date >= from) && (!to || t.date <= to))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((t) => {
      balance = r2(balance + (t.type === 'Deposit' ? t.amount : -t.amount));
      const book = conn().prepare('SELECT * FROM accounting_entries WHERE voucher_id = ? AND ledger_id = ?').get(t.voucher_id, bank.ledger_id);
      return { ...t, running_balance: r2(balance), matched: !!book, book_debit: book ? book.debit_amount : 0, book_credit: book ? book.credit_amount : 0 };
    });
  return { bank, opening_balance: opening, rows, closing_balance: r2(balance) };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
function dashboard() {
  const fy = ensureCurrentFY();
  const from = fy.start_date;
  const to = today();
  const sales = listVouchers({ voucher_type: 'Sales', from, to, page_size: 5000, page: 1 }).rows;
  const purchases = listVouchers({ voucher_type: 'Purchase', from, to, page_size: 5000, page: 1 }).rows;
  const rec = outstanding('receivable', to);
  const pay = outstanding('payable', to);
  const pnl = profitLoss(from, to);
  const cash = accountBalance(groupIdByName('Cash-in-Hand'), to);
  const banks = accountBalance(groupIdByName('Bank Accounts'), to);
  const sumSales = r2(sales.reduce((s, v) => s + v.grand_total, 0));
  const sumPurchases = r2(purchases.reduce((s, v) => s + v.grand_total, 0));
  const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const salesByMonth = {}, purchaseByMonth = {};
  for (let i = 0; i < 12; i++) {
    const m = ((4 + i) % 12) + 1;
    const ky = `${String(m).padStart(2, '0')}`;
    salesByMonth[ky] = 0; purchaseByMonth[ky] = 0;
  }
  for (const v of sales) { const m = v.date.slice(5, 7); salesByMonth[m] = r2((salesByMonth[m] || 0) + v.grand_total); }
  for (const v of purchases) { const m = v.date.slice(5, 7); purchaseByMonth[m] = r2((purchaseByMonth[m] || 0) + v.grand_total); }
  const chartKeys = [];
  for (let i = 0; i < 12; i++) { const m = ((4 + i) % 12) + 1; chartKeys.push(String(m).padStart(2, '0')); }
  const monthly = chartKeys.map((m) => ({ month: labels[chartKeys.indexOf(m)], sales: salesByMonth[m] || 0, purchases: purchaseByMonth[m] || 0 }));
  const topCustomers = [];
  const byParty = {};
  for (const v of sales) { const key = v.party_id || 0; byParty[key] = byParty[key] || { name: v.party_name || 'Cash Sale', amount: 0, count: 0 }; byParty[key].amount = r2(byParty[key].amount + v.grand_total); byParty[key].count += 1; }
  topCustomers.push(...Object.values(byParty).sort((a, b) => b.amount - a.amount).slice(0, 5));
  const recent = listVouchers({ page_size: 10, page: 1 }).rows;
  const expenseByGroup = {};
  for (const v of purchases) { }
  const expenses = listVouchers({ voucher_type: 'Expense', from, to, page_size: 5000, page: 1 }).rows;
  for (const v of expenses) { const key = v.party_name || 'Unspecified'; expenseByGroup[key] = r2((expenseByGroup[key] || 0) + v.grand_total); }
  return {
    company: getCompany(), fy, from, to,
    total_sales: sumSales, total_purchases: sumPurchases,
    total_receivable: rec.total, total_payable: pay.total,
    cash_bank: r2(cash.debit + banks.debit),
    net_profit: pnl.net_profit,
    monthly, top_customers: topCustomers, recent, expense_breakdown: Object.entries(expenseByGroup).map(([name, amount]) => ({ name, amount })),
  };
}

// ---------------------------------------------------------------------------
// Invoices/settings
// ---------------------------------------------------------------------------
function getInvoiceSettings() {
  return {
    terms: getSetting('invoice_terms', 'Payment is due within 30 days.'),
    notes: getSetting('invoice_notes', 'Thank you for your business!'),
    bank_name: getSetting('invoice_bank_name', ''),
    account_number: getSetting('invoice_account_number', ''),
    ifsc_code: getSetting('invoice_ifsc', ''),
    number_width: getSetting('invoice_number_width', '4'),
  };
}
function saveInvoiceSettings(data) {
  Object.entries(data || {}).forEach(([k, v]) => setSetting('invoice_' + k, v));
  return getInvoiceSettings();
}
function getGeneralSettings() {
  return {
    theme: getSetting('theme', 'light'),
    allow_future_dates: getSetting('allow_future_dates', '1'),
    page_size: getSetting('page_size', '50'),
    backup_dir: getSetting('backup_dir', ''),
  };
}
function saveGeneralSettings(data) {
  Object.entries(data || {}).forEach(([k, v]) => setSetting(k, v));
  return getGeneralSettings();
}
function globalSearch(q) {
  q = `%${String(q || '').trim()}%`;
  const vouchers = conn().prepare(`SELECT v.voucher_number, v.voucher_type, v.date, v.grand_total, p.name AS party_name FROM vouchers v LEFT JOIN parties p ON p.id=v.party_id WHERE v.voucher_number LIKE ? OR v.narration LIKE ? LIMIT 10`).all(q, q);
  const parties = conn().prepare('SELECT id,name,type FROM parties WHERE name LIKE ? OR gstin LIKE ? LIMIT 10').all(q, q);
  const ledgers = conn().prepare('SELECT id,name FROM ledgers WHERE name LIKE ? LIMIT 10').all(q);
  const items = conn().prepare('SELECT id,name FROM items WHERE name LIKE ? OR hsn_sac_code LIKE ? LIMIT 10').all(q, q);
  return { vouchers, parties, ledgers, items };
}

// ---------------------------------------------------------------------------
// Backup / restore / reset
// ---------------------------------------------------------------------------
function backupTo(filePath) {
  if (!filePath) throw new Error('Backup path required.');
  const fs = require('fs');
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  const db = conn();
  db.exec("VACUUM INTO '" + filePath.replace(/'/g, "''") + "'");
  return filePath;
}
function restoreFrom(filePath) {
  if (!filePath) throw new Error('Restore path required.');
  const fs = require('fs');
  if (!fs.existsSync(filePath)) throw new Error('Backup file not found.');
  const target = db.resolveDbPath();
  db.close();
  fs.copyFileSync(filePath, target);
  db.open();
  return true;
}
function resetData() {
  const con = conn();
  const names = ['accounting_entries', 'voucher_items', 'vouchers', 'bank_transactions', 'banks', 'items', 'parties', 'tax_rates', 'ledgers', 'account_groups', 'number_series', 'financial_years', 'company', 'settings', 'audit_log'];
  const tx = con.transaction(() => {
    con.prepare('PRAGMA foreign_keys = OFF').run();
    for (const n of names) con.prepare(`DELETE FROM ${n}`).run();
    for (const n of names) con.prepare("DELETE FROM sqlite_sequence WHERE name = ?").run(n);
    con.prepare('PRAGMA foreign_keys = ON').run();
  });
  tx();
  // Reload defaults so system group/ledger IDs are stable (1..N).
  const fs = require('fs'); const path = require('path');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  con.exec(schema);
  return true;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------
function invoke(module, action, payload = {}) {
  const table = {
    app: {
      getCompany, isSetupNeeded, saveCompany, getDatabasePath: db.getPath,
      ensureCurrentFY, listFinancialYears, getActiveFY,
      setActiveFY: (p) => setActiveFY(p.id),
      createFinancialYear: (p) => createFinancialYear(p.name, p.start, p.end),
      getInvoiceSettings, saveInvoiceSettings, getGeneralSettings, saveGeneralSettings,
      globalSearch: (p) => globalSearch(p.q),
      backupTo: (p) => backupTo(p.filePath), restoreFrom: (p) => restoreFrom(p.filePath),
      resetData,
    },
    coa: {
      list: listGroups, tree: groupsTree, create: createGroup,
      update: (p) => updateGroup(p.id, p), delete: (p) => deleteGroup(p.id),
    },
    ledger: {
      list: listLedgers,
      get: (p) => getLedger(p.id),
      create: createLedger,
      update: (p) => updateLedger(p.id, p),
      delete: (p) => deleteLedger(p.id),
      balance: (p) => ledgerBalance(p.ledger_id, p.asOf),
    },
    party: {
      list: listParties,
      get: (p) => getParty(p.id),
      create: createParty,
      update: (p) => updateParty(p.id, p),
      delete: (p) => deleteParty(p.id),
    },
    item: {
      list: listItems,
      get: (p) => getItem(p.id),
      create: createItem,
      update: (p) => updateItem(p.id, p),
      delete: (p) => deleteItem(p.id),
    },
    bank: {
      list: listBanks,
      get: (p) => getBank(p.id),
      create: createBank,
      update: (p) => updateBank(p.id, p),
      delete: (p) => deleteBank(p.id),
    },
    tax: { list: listTaxRates, update: (p) => updateTaxRate(p.id, p) },
    voucher: {
      list: listVouchers,
      get: (p) => getVoucher(p.id),
      create: (p) => createOrUpdateVoucher(null, p),
      update: (p) => createOrUpdateVoucher(p.id, p.payload || p),
      cancel: (p) => cancelVoucher(p.id),
      delete: (p) => deleteVoucher(p.id),
      nextNumber: (p) => nextVoucherNumber(p.voucher_type),
      series: listNumberSeries,
    },
    banking: {
      listTransactions: listBankTransactions,
      addTransaction: addBankTransaction,
      reconcile: (p) => reconcileBankTransaction(p.id, p.voucherId),
      unreconcile: (p) => unreconcileBankTransaction(p.id),
      statement: (p) => bankStatement(p.bank_id, p.from, p.to),
    },
    gst: {
      dashboard: (p) => gstDashboard(p.from, p.to),
      gstr1: (p) => gstr1(p.from, p.to),
      gstr3b: (p) => gstr3b(p.from, p.to),
      ledger: (p) => gstLedger(p.from, p.to),
    },
    report: {
      dashboard,
      trialBalance: (p) => trialBalance(p.from, p.to),
      profitLoss: (p) => profitLoss(p.from, p.to),
      balanceSheet: (p) => balanceSheet(p.asOf),
      cashFlow: (p) => cashFlow(p.from, p.to),
      dayBook: (p) => dayBook(p.from, p.to),
      ledgerReport: (p) => ledgerReport(p.ledger_id, p.from, p.to),
      outstanding: (p) => outstanding(p.type, p.asOf),
      agingReport: (p) => agingReport(p.asOf),
      salesRegister: (p) => salesRegister(p.from, p.to),
      purchaseRegister: (p) => purchaseRegister(p.from, p.to),
      stockSummary: () => stockSummary(),
      expenseReport: (p) => expenseReport(p.from, p.to),
    },
  };
  if (!table[module]) throw new Error('Unknown module: ' + module);
  const fn = table[module][action];
  if (!fn) throw new Error(`Unknown action: ${module}.${action}`);
  return fn(payload);
}

module.exports = { invoke, getDb: db.getDb, getPath: db.getPath, backupTo, restoreFrom, resetData };
