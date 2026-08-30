'use strict';
// Shared voucher entry form used by Sales/Purchase/Payment/Receipt/Journal/Contra/Credit/Debit/Expense.
(function (root) {
  const TYPES = {
    'Sales': 'Sales Invoice', 'Purchase': 'Purchase Invoice', 'Payment': 'Payment Voucher',
    'Receipt': 'Receipt Voucher', 'Journal': 'Journal Voucher', 'Contra': 'Contra Voucher',
    'Credit Note': 'Credit Note', 'Debit Note': 'Debit Note', 'Expense': 'Expense Entry',
  };

  function render(opts) {
    const type = TYPES[opts.type];
    const kind = opts.type;
    const hasItems = opts.showItems;
    const hasParty = opts.showParty !== false;
    const hasBank = opts.showBank !== false;
    const isSimple = ['Payment', 'Receipt', 'Expense'].includes(kind);
    const isContra = kind === 'Contra';
    const isJournal = kind === 'Journal';

    return `<h1 class="page-title">${type}</h1>
      <p class="page-subtitle">Double-entry voucher. Debits always equal credits.</p>
      <div class="toolbar">
        <button class="btn btn-primary" id="v-new">New</button>
        <button class="btn btn-outline" id="v-list">List Vouchers</button>
        <input id="v-search" class="search-input" type="text" placeholder="Search voucher # / party" />
      </div>
      <div class="card" id="v-form-card">
        <div class="form-row">
          <div class="form-group"><label>Voucher No.</label><input id="v-number" readonly /></div>
          <div class="form-group"><label>Date <span class="req">*</span></label><input id="v-date" type="date" value="${VB.today()}"/><div class="field-error"></div></div>
          ${hasParty && !isJournal ? `<div class="form-group"><label>Party <span class="req">*</span></label><div class="autocomplete"><input id="v-party" autocomplete="off" placeholder="Search party..." /><div class="autocomplete-list" id="v-party-list"></div></div><div class="field-error"></div></div>` : ''}
          ${hasParty && !isJournal ? `<div class="form-group"><label>Reference No.</label><input id="v-ref" /></div>` : ''}
        </div>
        ${isSimple && hasBank ? `<div class="form-row">
          <div class="form-group"><label>Cash / Bank Account</label><select id="v-bank"></select></div>
          <div class="form-group"><label>Party / Ledger Account</label><div class="autocomplete"><input id="v-counter" autocomplete="off" placeholder="Search party or ledger..." /><div class="autocomplete-list" id="v-counter-list"></div></div></div>
          <div class="form-group"><label>Amount ₹ <span class="req">*</span></label><input id="v-amount" type="number" step="0.01" value="0"/><div class="field-error"></div></div>
        </div>` : ''}
        ${kind === 'Expense' ? `<div class="form-row">
          <div class="form-group"><label>GST Rate</label><select id="v-gst-rate"></select></div>
          <div class="form-group"><label>Interstate Purchase?</label><select id="v-interstate"><option value="0">No (CGST/SGST)</option><option value="1">Yes (IGST)</option></select></div>
        </div>` : ''}
        ${isContra ? `<div class="form-row">
          <div class="form-group"><label>From (Dr)</label><select id="v-from"></select></div>
          <div class="form-group"><label>To (Cr)</label><select id="v-to"></select></div>
          <div class="form-group"><label>Amount ₹</label><input id="v-amount" type="number" step="0.01" value="0"/></div>
        </div>` : ''}
        ${isJournal ? `<button class="btn btn-outline" id="j-add-line" style="margin-bottom:12px">+ Add Journal Line</button>
          <div class="card-sm" id="j-lines"></div>` : ''}
        ${hasItems ? `<div id="v-items-area">
          <div class="toolbar"><button class="btn btn-outline btn-sm" id="i-add-line">+ Add Item</button></div>
          <div class="table-wrap"><table class="table" id="v-items-table">
            <thead><tr>
              <th style="min-width:200px">Item</th><th>Qty</th><th>Rate</th><th>Disc %</th><th>GST %</th><th class="num">Amount</th><th></th>
            </tr></thead>
            <tbody id="v-items-body"></tbody>
          </table></div>
        </div>` : ''}
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="flex:2"><label>Narration</label><textarea id="v-narration"></textarea></div>
        </div>
        <div class="card-sm" id="v-totals" style="background:#F8FAFC"></div>
        <div class="flex" style="margin-top:16px">
          <button class="btn btn-primary" id="v-save">Save</button>
          <button class="btn btn-success" id="v-save-print">Save &amp; Print</button>
          <button class="btn btn-outline" id="v-save-new">Save &amp; New</button>
          <button class="btn btn-danger" id="v-delete" style="display:none">Delete</button>
          <div class="loader" id="v-loader"></div>
        </div>
      </div>
      <div class="card" id="v-list-card" style="display:none">
        <h3 class="section-title" style="margin-top:0">${type}s</h3>
        <div id="v-list-table"></div>
      </div>`;
  }

  async function init(el, opts) {
    const kind = opts.type;
    const hasItems = opts.showItems;
    const hasParty = opts.showParty !== false;
    const hasBank = opts.showBank !== false;
    const isSimple = ['Payment', 'Receipt', 'Expense'].includes(kind);
    const isContra = kind === 'Contra';
    const isJournal = kind === 'Journal';

    const comp = await VB.invoke('app', 'getCompany');
    const company = comp || { state_code: '' };
    const parties = await VB.invoke('party', 'list');
    const ledgers = await VB.invoke('ledger', 'list');
    const items = await VB.invoke('item', 'list');
    const rates = await VB.invoke('tax', 'list');
    const banks = await VB.invoke('bank', 'list');
    const invoiceItems = [];

    const $ = (id) => el.querySelector('#' + id);
    let currentId = null;

    async function fillNumber() {
      const n = await VB.invoke('voucher', 'nextNumber', { voucher_type: kind });
      $('v-number').value = n;
    }
    async function fillBankSelect() {
      const cash = ledgers.find((l) => l.name === 'Cash');
      $('v-bank').innerHTML = `<option value="${cash ? cash.id : ''}">Cash</option>` + banks.map((b) => `<option value="${b.ledger_id}">${VB.esc(b.bank_name)} (${VB.esc(b.account_number || '')})</option>`).join('');
    }
    async function fillContraSelects() {
      const cash = ledgers.filter((l) => l.name === 'Cash' || l.group_name === 'Bank Accounts');
      $('v-from').innerHTML = cash.map((l) => `<option value="${l.id}">${VB.esc(l.name)}</option>`).join('');
      $('v-to').innerHTML = cash.map((l) => `<option value="${l.id}">${VB.esc(l.name)}</option>`).join('');
    }
    function fillRateSelect() {
      $('v-gst-rate').innerHTML = rates.filter((r) => r.is_active).map((r) => `<option value="${r.rate}">${VB.esc(r.name)}</option>`).join('');
    }
    async function fillPartyAutocomplete() {
      const list = $('v-party-list');
      $('v-party').addEventListener('input', () => {
        const q = $('v-party').value.toLowerCase();
        const matches = parties.filter((p) => p.name.toLowerCase().includes(q));
        list.innerHTML = matches.map((p) => `<div class="autocomplete-item" data-id="${p.id}" data-name="${VB.esc(p.name)}" data-state="${VB.esc(p.state_code || '')}">${VB.esc(p.name)} · ${VB.esc(p.type)}</div>`).join('');
        list.classList.add('show');
      });
      $('v-party').addEventListener('blur', () => setTimeout(() => list.classList.remove('show'), 200));
      list.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        $('v-party').dataset.id = item.dataset.id;
        $('v-party').dataset.state = item.dataset.state;
        $('v-party').value = item.dataset.name;
        recompute(true);
      });
    }
    async function fillCounterAutocomplete() {
      const list = $('v-counter-list');
      $('v-counter').addEventListener('input', () => {
        const q = $('v-counter').value.toLowerCase();
        const matches = [...parties.map((p) => ({ id: p.ledger_id, name: p.name, kind: 'Party' })), ...ledgers.filter((l) => !l.is_system && !['Round Off', 'Sales Account', 'Purchase Account'].includes(l.name)).map((l) => ({ id: l.id, name: l.name, kind: 'Ledger' }))].filter((x) => x.name.toLowerCase().includes(q));
        list.innerHTML = matches.map((x) => `<div class="autocomplete-item" data-id="${x.id}">${VB.esc(x.name)} · ${x.kind}</div>`).join('');
        list.classList.add('show');
      });
      $('v-counter').addEventListener('blur', () => setTimeout(() => list.classList.remove('show'), 200));
      list.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        $('v-counter').dataset.id = item.dataset.id;
        $('v-counter').value = item.textContent.split(' · ')[0];
      });
    }

    // Item lines
    function addItemLine(line) {
      const body = $('v-items-body');
      const tr = document.createElement('tr');
      const row = { ...(line || {}) };
      if (row.item_id && !row.item_name) {
        const it = items.find((x) => x.id === row.item_id);
        if (it) { row.item_name = it.name; row.hsn = it.hsn_sac_code; row.unit = it.unit; }
        else row.item_name = row.description || '';
      }
      tr._row = row;
      invoiceItems.push(row);
      tr.innerHTML = `<td><div class="autocomplete"><input data-col="item" class="vi-item" value="${row.item_name ? VB.esc(row.item_name) : ''}" autocomplete="off"/><div class="autocomplete-list"></div></div></td>
        <td><input data-col="qty" type="number" step="0.01" value="${row.quantity || 1}" style="width:70px"/></td>
        <td><input data-col="rate" type="number" step="0.01" value="${row.rate || 0}" style="width:90px"/></td>
        <td><input data-col="disc" type="number" step="0.01" value="${row.discount_percent || 0}" style="width:60px"/></td>
        <td><select data-col="gst"><option value="${row.gst_rate || 0}">${row.gst_rate || 0}%</option>${rates.filter((r) => r.is_active).map((r) => `<option value="${r.rate}" ${row.gst_rate === r.rate ? 'selected' : ''}>${r.rate}%</option>`).join('')}</select></td>
        <td class="num vi-amount">0.00</td><td><button class="btn btn-text btn-sm text-danger" data-remove>X</button></td>`;
      body.appendChild(tr);
      const auto = tr.querySelector('.autocomplete');
      const listEl = auto.querySelector('.autocomplete-list');
      const input = tr.querySelector('.vi-item');
      input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        const matches = items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 30);
        listEl.innerHTML = matches.map((i) => `<div class="autocomplete-item" data-id="${i.id}">${VB.esc(i.name)}</div>`).join('');
        listEl.classList.add('show');
      });
      listEl.addEventListener('mousedown', (e) => {
        const item = e.target.closest('.autocomplete-item');
        if (!item) return;
        const it = items.find((x) => x.id === Number(item.dataset.id));
        row.item_id = it.id; row.item_name = it.name; row.hsn = it.hsn_sac_code; row.unit = it.unit;
        row.rate = it.sale_price !== undefined ? Number(it.sale_price) : 0;
        row.gst_rate = it.gst_rate;
        row.cess_rate = it.cess_rate || 0;
        input.value = it.name;
        tr.querySelector('[data-col=rate]').value = row.rate;
        tr.querySelector('[data-col=gst]').value = row.gst_rate;
        recompute(true);
      });
      tr.querySelector('[data-remove]').addEventListener('click', () => {
        const i = invoiceItems.indexOf(row);
        if (i >= 0) invoiceItems.splice(i, 1);
        tr.remove();
        recompute();
      });
      tr.querySelectorAll('[data-col]').forEach((inp) => inp.addEventListener('input', () => {
        const col = inp.dataset.col;
        if (col === 'qty') row.quantity = Number(inp.value || 0);
        if (col === 'rate') row.rate = Number(inp.value || 0);
        if (col === 'disc') row.discount_percent = Number(inp.value || 0);
        if (col === 'gst') row.gst_rate = Number(inp.value || 0);
        recompute();
      }));
    }
    function recompute(forceParty) {
      if (!hasItems) {
        const amount = Number($('v-amount') ? $('v-amount').value : 0) || 0;
        if ($('v-totals')) $('v-totals').innerHTML = totalsHtml(amount, 0, amount, 0, 0, 0, 0, 0, 0);
        if (kind === 'Expense') {
          const rate = Number($('v-gst-rate').value || 0);
          const taxable = rate > 0 ? amount / (1 + rate / 100) : amount;
          const gst = amount - taxable;
          $('v-totals').innerHTML = totalsHtml(taxable, 0, amount, gst, 0, 0, 0, 0, 0);
        }
        return;
      }
      let subtotal = 0, discount = 0, taxable = 0, cgst = 0, sgst = 0, igst = 0, cess = 0;
      el.querySelectorAll('#v-items-body tr').forEach((tr) => {
        const row = tr._row || {};
        const qty = Number(row.quantity || 0), rate = Number(row.rate || 0), discPct = Number(row.discount_percent || 0);
        const gross = qty * rate;
        const disc = gross * discPct / 100;
        const tx = gross - disc;
        const gstRate = Number(row.gst_rate || 0);
        const cessRate = Number(row.cess_rate || 0);
        const split = VB.gst.split(gstRate, company.state_code, $('v-party') ? $('v-party').dataset.state : '');
        const cgA = tx * split.cgst / 100, sgA = tx * split.sgst / 100, igA = tx * split.igst / 100;
        const ceA = tx * cessRate / 100;
        const total = tx + cgA + sgA + igA + ceA;
        tr.querySelector('.vi-amount').textContent = VB.currency.formatNumber(total);
        subtotal += gross; discount += disc; taxable += tx; cgst += cgA; sgst += sgA; igst += igA; cess += ceA;
      });
      const pretotal = taxable + cgst + sgst + igst + cess;
      const round = Math.round(pretotal) - pretotal;
      const grand = pretotal + round;
      $('v-totals').innerHTML = totalsHtml(subtotal, discount, taxable, cgst, sgst, igst, cess, round, grand);
    }
    function totalsHtml(subtotal, discount, taxable, cgst, sgst, igst, cess, round, grand) {
      return `<div style="margin-left:auto;max-width:320px;display:grid;grid-template-columns:1fr 130px;gap:4px">
        <div class="text-muted">Subtotal</div><div class="num">${VB.fmt(subtotal)}</div>
        <div class="text-muted">Discount</div><div class="num">− ${VB.fmt(discount)}</div>
        <div class="text-muted">Taxable</div><div class="num">${VB.fmt(taxable)}</div>
        <div class="text-muted">CGST</div><div class="num">${VB.fmt(cgst)}</div>
        <div class="text-muted">SGST</div><div class="num">${VB.fmt(sgst)}</div>
        <div class="text-muted">IGST</div><div class="num">${VB.fmt(igst)}</div>
        <div class="text-muted">Cess</div><div class="num">${VB.fmt(cess)}</div>
        <div class="text-muted">Round Off</div><div class="num">${VB.fmt(round)}</div>
        <div class="font-bold" style="border-top:2px solid #E2E8F0;padding-top:4px">GRAND TOTAL</div><div class="font-bold num" style="border-top:2px solid #E2E8F0;padding-top:4px">${VB.fmt(grand)}</div>
      </div>
      <div class="text-muted" style="margin-top:8px">Amount in words: <span class="font-bold">${VB.numberToWords(grand)}</span></div>`;
    }

    // Journal lines
    function addJournalLine() {
      const wrap = $('j-lines');
      const idx = wrap.children.length;
      const div = document.createElement('div');
      div.className = 'form-row';
      div.dataset.idx = idx;
      div.innerHTML = `<div class="form-group" style="flex:2"><select class="j-ledger"><option value="">Select ledger...</option>${ledgers.map((l) => `<option value="${l.id}">${VB.esc(l.name)} (${VB.esc(l.nature || '')})</option>`).join('')}</select></div>
        <div class="form-group"><label>Debit</label><input class="j-debit" type="number" step="0.01" value="0"/></div>
        <div class="form-group"><label>Credit</label><input class="j-credit" type="number" step="0.01" value="0"/></div>
        <div class="form-group"><label>Narration</label><input class="j-narr"/></div>
        <div class="form-group"><button class="btn btn-text text-danger" data-jremove>Remove</button></div>`;
      wrap.appendChild(div);
      const inputs = div.querySelectorAll('input');
      inputs.forEach((i) => i.addEventListener('input', () => {
        const dr = [...wrap.querySelectorAll('.j-debit')].reduce((s, x) => s + Number(x.value || 0), 0);
        const cr = [...wrap.querySelectorAll('.j-credit')].reduce((s, x) => s + Number(x.value || 0), 0);
        $('j-balance').textContent = `Dr ${VB.fmt(dr)} / Cr ${VB.fmt(cr)} ${Math.abs(dr - cr) < .01 ? '✓ Balanced' : '✗ Not balanced'}`;
      }));
      div.querySelector('[data-jremove]').addEventListener('click', () => div.remove());
      if (!$('j-balance')) {
        const b = document.createElement('div'); b.id = 'j-balance'; b.className = 'text-muted'; b.style.marginTop = '8px';
        wrap.parentNode.appendChild(b);
      }
    }

    // totals line & words display
    if ($('v-totals')) $('v-totals').innerHTML = totalsHtml(0, 0, 0, 0, 0, 0, 0, 0, 0);

    // buttons
    el.querySelector('#v-list').addEventListener('click', async () => {
      $('v-form-card').style.display = 'none'; $('v-list-card').style.display = '';
      await showList();
    });
    el.querySelector('#v-new').addEventListener('click', () => { $('v-list-card').style.display = 'none'; $('v-form-card').style.display = ''; currentId = null; fillNumber(); resetForm(); });
    el.querySelector('#v-search').addEventListener('input', debounce(() => showList(), 300));

    async function showList() {
      const search = $('v-search').value;
      const data = await VB.invoke('voucher', 'list', { voucher_type: kind, search, page_size: 100, page: 1 });
      VB.table.render($('v-list-table'), {
        page: 1, page_size: 100, total: data.total,
        columns: [
          { label: 'Voucher #', key: 'voucher_number' },
          { label: 'Date', render: (r) => VB.fmtDate(r.date) },
          { label: 'Party', key: 'party_name' },
          { label: 'Type', render: (r) => r.voucher_type },
          { label: 'Amount', num: true, render: (r) => VB.fmt(r.grand_total) },
          { label: 'Status', render: (r) => r.status === 'Active' ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-warning">Cancelled</span>' },
          { label: '', render: (r) => `<button class="btn btn-text btn-sm" data-action="edit" data-id="${r.id}">Edit</button><button class="btn btn-text btn-sm" data-action="del" data-id="${r.id}">Delete</button>` },
        ],
        rows: data.rows,
        onAction(action, id) {
          if (action === 'edit') loadVoucher(Number(id));
          if (action === 'del') VB.modal.confirm({ title: 'Delete voucher?', message: 'This will also reverse its accounting entries and stock.', danger: true }).then(async (ok) => {
            if (!ok) return;
            try { await VB.invoke('voucher', 'delete', { id: Number(id) }); VB.toast.success('Deleted.'); showList(); } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }

    async function loadVoucher(id) {
      const v = await VB.invoke('voucher', 'get', { id });
      currentId = id;
      $('v-list-card').style.display = 'none'; $('v-form-card').style.display = '';
      $('v-number').value = v.voucher_number;
      $('v-date').value = v.date;
      if ($('v-ref')) $('v-ref').value = v.reference_number || '';
      if ($('v-narration')) $('v-narration').value = v.narration || '';
      if ($('v-party') && v.party_id) {
        const p = parties.find((x) => x.id === v.party_id);
        $('v-party').value = p ? p.name : ''; $('v-party').dataset.id = v.party_id; $('v-party').dataset.state = p ? (p.state_code || '') : '';
      }
      if ($('v-items-body')) { $('v-items-body').innerHTML = ''; invoiceItems.length = 0; }
      if (v.items && v.items.length) v.items.forEach((it) => addItemLine(it));
      if (isJournal && v.entries) {
        $('j-lines').innerHTML = '';
        v.entries.forEach((e) => { addJournalLine(); const row = $('j-lines').lastElementChild; row.querySelector('.j-ledger').value = e.ledger_id; row.querySelector('.j-debit').value = e.debit_amount || 0; row.querySelector('.j-credit').value = e.credit_amount || 0; row.querySelector('.j-narr').value = e.narration || ''; });
      }
      if (isSimple) {
        $('v-amount').value = v.grand_total;
        if (v.entries && v.entries.length) {
          const bankEntry = v.entries.find((e) => e.group_name === 'Cash-in-Hand' || e.group_name === 'Bank Accounts');
          const counterEntry = v.entries.find((e) => e.id !== (bankEntry && bankEntry.id));
          if ($('v-bank') && bankEntry) $('v-bank').value = bankEntry.ledger_id;
          if ($('v-counter') && counterEntry) { $('v-counter').dataset.id = counterEntry.ledger_id; $('v-counter').value = counterEntry.ledger_name; }
        } else if (v.party_id) {
          $('v-counter').value = (parties.find((x) => x.id === v.party_id) || {}).name || '';
        }
      }
      if (isContra && v.entries && v.entries.length) {
        $('v-from').value = v.entries[0].ledger_id; $('v-to').value = v.entries[1].ledger_id; $('v-amount').value = v.grand_total;
      }
      recompute(true);
    }
    function resetForm() {
      if ($('v-items-body')) { $('v-items-body').innerHTML = ''; invoiceItems.length = 0; }
      if ($('v-amount')) $('v-amount').value = 0;
      if ($('v-date')) $('v-date').value = VB.today();
      if ($('v-narration')) $('v-narration').value = '';
      if ($('v-ref')) $('v-ref').value = '';
      if ($('v-party')) { $('v-party').value = ''; $('v-party').dataset.id = ''; $('v-party').dataset.state = ''; }
      if (isJournal && $('j-lines')) { $('j-lines').innerHTML = ''; }
      recompute(true);
    }

    async function save(printAfter) {
      const $btn = el.querySelector('#v-save');
      const loader = $('v-loader'); if (loader) loader.classList.add('show'); if ($btn) $btn.disabled = true;
      try {
        const partyId = $('v-party') ? Number($('v-party').dataset.id || 0) : null;
        if (['Sales', 'Purchase', 'Credit Note', 'Debit Note'].includes(kind) && !partyId) {
          throw new Error('Please select a party.');
        }
        if (hasItems && invoiceItems.filter((x) => x.item_name || x.description || Number(x.rate) > 0 || Number(x.quantity) > 0).length === 0) {
          throw new Error('Please add at least one line item.');
        }
        if (!$('v-number').value) await fillNumber();
        const base = {
          voucher_type: kind,
          voucher_number: $('v-number').value,
          date: $('v-date').value,
          party_id: partyId || null,
          reference_number: $('v-ref') ? $('v-ref').value : '',
          narration: $('v-narration') ? $('v-narration').value : '',
        };
        let payload;
        if (hasItems) {
          payload = { ...base, items: invoiceItems.filter((x) => x.item_name || x.description || x.rate) };
        } else if (isJournal) {
          const entries = [...el.querySelectorAll('#j-lines .form-row')].map((r) => ({ ledger_id: Number(r.querySelector('.j-ledger').value || 0), debit: Number(r.querySelector('.j-debit').value || 0), credit: Number(r.querySelector('.j-credit').value || 0), narration: r.querySelector('.j-narr').value || '' })).filter((e) => e.ledger_id);
          payload = { ...base, entries };
        } else if (isContra) {
          payload = { ...base, from_ledger_id: Number($('v-from').value), to_ledger_id: Number($('v-to').value), amount: Number($('v-amount').value || 0) };
        } else {
          payload = { ...base, bank_ledger_id: $('v-bank') ? Number($('v-bank').value) : 0, ledger_id: $('v-counter') ? Number($('v-counter').dataset.id || 0) : 0, amount: Number($('v-amount').value || 0) };
          if (kind === 'Expense') payload.gst_rate = Number($('v-gst-rate').value || 0), payload.is_interstate = $('v-interstate').value === '1';
        }
        let saved;
        if (currentId) saved = await VB.invoke('voucher', 'update', { ...payload, id: currentId });
        else saved = await VB.invoke('voucher', 'create', payload);
        VB.toast.success(`${kind} ${saved.voucher_number} saved.`);
        if (printAfter) await printInvoice(saved);
        if (!printAfter) {
          const saveNewBtn = $('v-save-new');
          if (saveNewBtn) { currentId = null; fillNumber(); resetForm(); }
          else loadVoucher(saved.id);
        } else {
          loadVoucher(saved.id);
        }
      } catch (e) {
        VB.toast.error(e.message);
      } finally {
        if (loader) loader.classList.remove('show'); if ($btn) $btn.disabled = false;
      }
    }
    async function printInvoice(v) {
      const company = await VB.invoke('app', 'getCompany');
      const rows = (v.items || []).map((it, i) => `<tr><td>${i + 1}</td><td>${VB.esc(it.description || '')}</td><td>${it.quantity}</td><td>${VB.fmt(it.rate)}</td><td>${VB.fmt(it.taxable_amount)}</td><td>${it.gst_rate}%</td><td>${VB.fmt(it.cess_amount)}</td><td>${VB.fmt(it.total_amount)}</td></tr>`).join('');
      const html = `<div class="doc-sheet">
        <div class="doc-header"><div><h1>${VB.esc(company && company.name || 'Company')}</h1><div>${VB.esc(company && company.address || '')}</div><div>GSTIN: ${VB.esc(company && company.gstin || '—')}</div></div>
        <div style="text-align:right"><h2>${VB.esc(kind)}</h2><div>${VB.esc(v.voucher_number)}</div><div>Date: ${VB.fmtDate(v.date)}</div></div></div>
        <table><thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Taxable</th><th>GST%</th><th>Cess</th><th>Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="8">—</td></tr>'}</tbody></table>
        <div class="totals"><div>Total: ${VB.fmt(v.grand_total)}</div><div class="grand">Grand Total: ${VB.fmt(v.grand_total)}</div></div>
        <div class="words">${VB.numberToWords(v.grand_total)}</div>
        <div class="sign">For ${VB.esc(company && company.name || 'Company')}<br/><br/>Authorized Signatory</div>
        <div class="text-muted" style="margin-top:24px">Generated by VyaparBooks</div></div>`;
      VB.print.printHtml(html);
    }

    // init bindings
    el.querySelector('#v-save').addEventListener('click', () => save(false));
    el.querySelector('#v-save-print').addEventListener('click', () => save(true));
    el.querySelector('#v-save-new').addEventListener('click', () => { currentId = null; fillNumber(); resetForm(); });
    window.addEventListener('vb:save', () => save(false));
    window.addEventListener('vb:print', () => { if (currentId) VB.invoke('voucher', 'get', { id: currentId }).then(printInvoice); });
    window.addEventListener('vb:new-voucher', () => { currentId = null; fillNumber(); resetForm(); });
    if ($('i-add-line')) $('i-add-line').addEventListener('click', () => addItemLine({}));
    if ($('j-add-line')) $('j-add-line').addEventListener('click', addJournalLine);

    // initial fill
    fillNumber();
    if ($('v-bank')) fillBankSelect();
    if ($('v-from')) fillContraSelects();
    if ($('v-gst-rate')) fillRateSelect();
    if ($('v-party')) fillPartyAutocomplete();
    if ($('v-counter')) fillCounterAutocomplete();
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  root.VB = root.VB || {};
  root.VB.voucherForm = { render, init };
})(typeof window !== 'undefined' ? window : globalThis);
