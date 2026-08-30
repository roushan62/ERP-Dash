'use strict';
VB.registerPage('banks', {
  title: 'Banks',
  render() {
    return `<h1 class="page-title">Banks</h1>
      <p class="page-subtitle">Manage bank accounts. A ledger is created automatically for each bank.</p>
      <div class="toolbar">
        <button class="btn btn-primary" id="add-bank">+ Add Bank</button>
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="card"><div id="banks-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#banks-table');
    async function load() {
      const list = await VB.invoke('bank', 'list');
      VB.table.render(tableEl, {
        page: 1, page_size: 500, total: list.length,
        columns: [
          { label: 'Bank', key: 'bank_name', render: (r) => `<span class="font-bold">${VB.esc(r.bank_name)}</span>` },
          { label: 'A/c No.', key: 'account_number' },
          { label: 'IFSC', key: 'ifsc_code' },
          { label: 'Branch', key: 'branch' },
          { label: 'Type', key: 'account_type' },
          { label: 'Opening', num: true, render: (r) => VB.fmt(r.opening_balance) },
          { label: 'Actions', render: (r) => `<button class="btn btn-text btn-sm" data-action="edit" data-id="${r.id}">Edit</button><button class="btn btn-text btn-sm text-danger" data-action="del" data-id="${r.id}">Delete</button>` },
        ],
        rows: list,
        onAction(action, id) {
          if (action === 'edit') openForm(list.find((x) => x.id === Number(id)));
          if (action === 'del') VB.modal.confirm({ title: 'Delete bank?', message: 'Banks with transactions cannot be deleted.', danger: true }).then(async (ok) => {
            if (!ok) return;
            try { await VB.invoke('bank', 'delete', { id: Number(id) }); VB.toast.success('Deleted.'); load(); } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }
    function openForm(b) {
      VB.modal.open({
        title: b ? 'Edit Bank' : 'Add Bank',
        body: `<div class="form-row">
          <div class="form-group"><label>Bank Name <span class="req">*</span></label><input id="b-name" data-validate="required" value="${b ? VB.esc(b.bank_name) : ''}"/><div class="field-error"></div></div>
          <div class="form-group"><label>Account Number</label><input id="b-acc" value="${b ? VB.esc(b.account_number || '') : ''}"/></div>
          </div>
          <div class="form-row">
          <div class="form-group"><label>IFSC Code</label><input id="b-ifsc" value="${b ? VB.esc(b.ifsc_code || '') : ''}"/></div>
          <div class="form-group"><label>Branch</label><input id="b-branch" value="${b ? VB.esc(b.branch || '') : ''}"/></div>
          <div class="form-group"><label>Account Type</label><select id="b-type"><option value="Savings" ${b && b.account_type === 'Savings' ? 'selected' : ''}>Savings</option><option value="Current" ${!b || b.account_type === 'Current' ? 'selected' : ''}>Current</option><option value="OD" ${b && b.account_type === 'OD' ? 'selected' : ''}>OD</option><option value="CC" ${b && b.account_type === 'CC' ? 'selected' : ''}>CC</option></select></div>
          <div class="form-group"><label>Opening Balance</label><input id="b-ob" type="number" step="0.01" value="${b ? b.opening_balance : 0}"/></div>
          </div>`,
        footer: `<button class="btn btn-outline" id="b-cancel">Cancel</button><button class="btn btn-primary" id="b-save">Save</button>`,
        onOpen(ov) {
          ov.querySelector('#b-cancel').addEventListener('click', VB.modal.close);
          ov.querySelector('#b-save').addEventListener('click', async () => {
            const payload = {
              bank_name: ov.querySelector('#b-name').value.trim(),
              account_number: ov.querySelector('#b-acc').value.trim(),
              ifsc_code: ov.querySelector('#b-ifsc').value.trim(),
              branch: ov.querySelector('#b-branch').value.trim(),
              account_type: ov.querySelector('#b-type').value,
              opening_balance: Number(ov.querySelector('#b-ob').value || 0),
            };
            if (!payload.bank_name) { VB.toast.error('Bank name is required.'); return; }
            try {
              if (b) await VB.invoke('bank', 'update', { ...payload, id: b.id });
              else await VB.invoke('bank', 'create', payload);
              VB.modal.close(); VB.toast.success('Bank saved.'); load();
            } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }
    el.querySelector('#add-bank').addEventListener('click', () => openForm(null));
    el.querySelector('#refresh').addEventListener('click', load);
    load();
  },
});
