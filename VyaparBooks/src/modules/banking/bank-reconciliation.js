'use strict';
VB.registerPage('recon', {
  title: 'Bank Reconciliation',
  render() {
    return `<h1 class="page-title">Bank Reconciliation</h1>
      <p class="page-subtitle">Match bank statement entries with book entries.</p>
      <div class="toolbar">
        <select id="rec-bank"></select>
        <select id="rec-status"><option value="">All</option><option value="0">Unreconciled</option><option value="1">Reconciled</option></select>
        <button class="btn btn-primary" id="add-txn">+ Add Bank Entry</button>
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="card"><div id="rec-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#rec-table');
    async function load() {
      const bankId = Number(el.querySelector('#rec-bank').value || 0);
      const status = el.querySelector('#rec-status').value;
      const rows = await VB.invoke('banking', 'listTransactions', { bank_id: bankId, reconciled: status });
      VB.table.render(tableEl, {
        page: 1, page_size: 500, total: rows.length,
        columns: [
          { label: 'Date', render: (r) => VB.fmtDate(r.date) },
          { label: 'Bank', key: 'bank_name' },
          { label: 'Type', render: (r) => `<span class="badge ${r.type === 'Deposit' ? 'badge-success' : 'badge-warning'}">${r.type}</span>` },
          { label: 'Amount', num: true, render: (r) => VB.fmt(r.amount) },
          { label: 'Reference', key: 'reference' },
          { label: 'Reconciled', render: (r) => r.is_reconciled ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-warning">No</span>' },
          { label: 'Actions', render: (r) => r.is_reconciled ? `<button class="btn btn-text btn-sm" data-action="un" data-id="${r.id}">Unreconcile</button>` : `<button class="btn btn-text btn-sm" data-action="match" data-id="${r.id}">Match to Voucher</button>` },
        ],
        rows,
        onAction(action, id) {
          if (action === 'un') VB.invoke('banking', 'unreconcile', { id: Number(id) }).then(() => { VB.toast.success('Unreconciled.'); load(); });
          if (action === 'match') {
            VB.invoke('voucher', 'list', { page_size: 50, page: 1 }).then((data) => {
              const html = `<div class="form-group"><label>Select voucher</label><select id="m-voucher"><option value="">— Choose —</option>${data.rows.map((v) => `<option value="${v.id}">${v.voucher_number} · ${VB.fmtDate(v.date)} · ${VB.fmt(v.grand_total)}</option>`).join('')}</select></div>`;
              VB.modal.open({
                title: 'Match bank entry to voucher', body: html,
                footer: `<button class="btn btn-outline" id="m-cancel">Cancel</button><button class="btn btn-primary" id="m-ok">Match</button>`,
                onOpen(ov) {
                  ov.querySelector('#m-cancel').addEventListener('click', VB.modal.close);
                  ov.querySelector('#m-ok').addEventListener('click', async () => {
                    const vid = Number(ov.querySelector('#m-voucher').value || 0);
                    if (!vid) { VB.toast.error('Select a voucher.'); return; }
                    try { await VB.invoke('banking', 'reconcile', { id: Number(id), voucherId: vid }); VB.modal.close(); VB.toast.success('Reconciled.'); load(); } catch (e) { VB.toast.error(e.message); }
                  });
                },
              });
            });
          }
        },
      });
    }
    async function fillBank() {
      const banks = await VB.invoke('bank', 'list');
      el.querySelector('#rec-bank').innerHTML = banks.map((b) => `<option value="${b.id}">${VB.esc(b.bank_name)}</option>`).join('');
      banks[0] && el.querySelector('#rec-bank').addEventListener('change', load);
    }
    function openAdd() {
      VB.invoke('bank', 'list').then((banks) => {
        VB.modal.open({
          title: 'Add Bank Statement Entry', body: `<div class="form-row">
            <div class="form-group"><label>Bank</label><select id="t-bank">${banks.map((b) => `<option value="${b.id}">${VB.esc(b.bank_name)}</option>`).join('')}</select></div>
            <div class="form-group"><label>Date</label><input id="t-date" type="date" value="${VB.today()}"/></div>
            </div><div class="form-row">
            <div class="form-group"><label>Type</label><select id="t-type"><option value="Deposit">Deposit</option><option value="Withdrawal">Withdrawal</option></select></div>
            <div class="form-group"><label>Amount</label><input id="t-amount" type="number" step="0.01"/></div>
            <div class="form-group"><label>Reference</label><input id="t-ref"/></div>
            </div>`,
          footer: `<button class="btn btn-outline" id="t-cancel">Cancel</button><button class="btn btn-primary" id="t-save">Save</button>`,
          onOpen(ov) {
            ov.querySelector('#t-cancel').addEventListener('click', VB.modal.close);
            ov.querySelector('#t-save').addEventListener('click', async () => {
              try {
                await VB.invoke('banking', 'addTransaction', { bank_id: Number(ov.querySelector('#t-bank').value), date: ov.querySelector('#t-date').value, type: ov.querySelector('#t-type').value, amount: Number(ov.querySelector('#t-amount').value || 0), reference: ov.querySelector('#t-ref').value });
                VB.modal.close(); VB.toast.success('Bank entry saved.'); load();
              } catch (e) { VB.toast.error(e.message); }
            });
          },
        });
      });
    }
    el.querySelector('#add-txn').addEventListener('click', openAdd);
    el.querySelector('#refresh').addEventListener('click', load);
    el.querySelector('#rec-status').addEventListener('change', load);
    fillBank().then(load);
  },
});
