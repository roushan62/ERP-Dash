'use strict';
VB.registerPage('parties', {
  title: 'Parties (Customers / Vendors)',
  render() {
    return `<h1 class="page-title">Parties</h1>
      <p class="page-subtitle">Manage customers and vendors. A ledger is created automatically for each party.</p>
      <div class="toolbar">
        <button class="btn btn-primary" id="add-party">+ Add Party</button>
        <input id="search" class="search-input" type="text" placeholder="Search name / GSTIN / phone" />
        <select id="type"><option value="">All</option><option value="Customer">Customers</option><option value="Vendor">Vendors</option><option value="Both">Both</option></select>
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="card"><div id="parties-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#parties-table');
    let state = { search: '', type: '' };
    async function load() {
      const list = await VB.invoke('party', 'list', state);
      VB.table.render(tableEl, {
        page: 1, page_size: 500, total: list.length,
        columns: [
          { label: 'Name', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
          { label: 'Type', render: (r) => `<span class="badge ${r.type === 'Vendor' ? 'badge-warning' : r.type === 'Both' ? 'badge-primary' : 'badge-success'}">${VB.esc(r.type)}</span>` },
          { label: 'GSTIN', key: 'gstin' },
          { label: 'Phone', key: 'phone' },
          { label: 'City', key: 'city' },
          { label: 'Opening', num: true, render: (r) => VB.fmt(r.opening_balance) + ' ' + VB.esc(r.opening_balance_type) },
          { label: 'Credit Limit', num: true, render: (r) => VB.fmt(r.credit_limit) },
          { label: 'Actions', render: (r) => `<button class="btn btn-text btn-sm" data-action="edit" data-id="${r.id}">Edit</button><button class="btn btn-text btn-sm text-danger" data-action="del" data-id="${r.id}">Delete</button>` },
        ],
        rows: list,
        onAction(action, id) {
          if (action === 'edit') openForm(list.find((x) => x.id === Number(id)));
          if (action === 'del') VB.modal.confirm({ title: 'Delete party?', message: 'Parties with transactions cannot be deleted.', danger: true }).then(async (ok) => {
            if (!ok) return;
            try { await VB.invoke('party', 'delete', { id: Number(id) }); VB.toast.success('Deleted.'); load(); } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }
    function openForm(p) {
      const states = VB.states && VB.states.length ? VB.states : [{ code: '', name: '' }];
      const stateOptions = states.map((s) => `<option value="${s.code}" ${p && p.state_code === s.code ? 'selected' : ''}>${VB.esc(s.name || s.code)}</option>`).join('');
      VB.modal.open({
        title: p ? 'Edit Party' : 'Add Party',
        wide: true,
        body: `<div class="form-row">
          <div class="form-group"><label>Name <span class="req">*</span></label><input id="p-name" data-validate="required" value="${p ? VB.esc(p.name) : ''}"/><div class="field-error"></div></div>
          <div class="form-group"><label>Type</label><select id="p-type"><option value="Customer" ${p && p.type === 'Customer' ? 'selected' : ''}>Customer</option><option value="Vendor" ${p && p.type === 'Vendor' ? 'selected' : ''}>Vendor</option><option value="Both" ${p && p.type === 'Both' ? 'selected' : ''}>Both</option></select></div>
          <div class="form-group"><label>GSTIN</label><input id="p-gstin" data-validate="gstin" value="${p ? VB.esc(p.gstin || '') : ''}"/><div class="field-error"></div></div>
          </div>
          <div class="form-row">
          <div class="form-group"><label>PAN</label><input id="p-pan" data-validate="pan" value="${p ? VB.esc(p.pan || '') : ''}"/><div class="field-error"></div></div>
          <div class="form-group"><label>Phone</label><input id="p-phone" data-validate="phone" value="${p ? VB.esc(p.phone || '') : ''}"/><div class="field-error"></div></div>
          <div class="form-group"><label>Email</label><input id="p-email" data-validate="email" value="${p ? VB.esc(p.email || '') : ''}"/><div class="field-error"></div></div>
          </div>
          <div class="form-row">
          <div class="form-group"><label>Billing Address</label><textarea id="p-bill">${p ? VB.esc(p.billing_address || '') : ''}</textarea></div>
          <div class="form-group"><label>Shipping Address</label><textarea id="p-ship">${p ? VB.esc(p.shipping_address || '') : ''}</textarea></div>
          </div>
          <div class="form-row">
          <div class="form-group"><label>City</label><input id="p-city" value="${p ? VB.esc(p.city || '') : ''}"/></div>
          <div class="form-group"><label>State</label><select id="p-state">${stateOptions}</select></div>
          <div class="form-group"><label>PIN / Pincode</label><input id="p-pin" value="${p ? VB.esc(p.pincode || '') : ''}"/></div>
          </div>
          <div class="form-row">
          <div class="form-group"><label>Credit Limit</label><input id="p-cl" type="number" step="0.01" value="${p ? p.credit_limit : 0}"/></div>
          <div class="form-group"><label>Credit Days</label><input id="p-cd" type="number" step="1" value="${p ? p.credit_days : 30}"/></div>
          <div class="form-group"><label>Opening Balance</label><input id="p-ob" type="number" step="0.01" value="${p ? p.opening_balance : 0}"/></div>
          <div class="form-group"><label>Opening Type</label><select id="p-obt"><option value="Dr" ${(!p || p.opening_balance_type === 'Dr') ? 'selected' : ''}>Dr</option><option value="Cr" ${p && p.opening_balance_type === 'Cr' ? 'selected' : ''}>Cr</option></select></div>
          </div>`,
        footer: `<button class="btn btn-outline" id="p-cancel">Cancel</button><button class="btn btn-primary" id="p-save">Save</button>`,
        onOpen(ov) {
          ov.querySelector('#p-cancel').addEventListener('click', VB.modal.close);
          ov.querySelector('#p-save').addEventListener('click', async () => {
            const payload = {
              name: ov.querySelector('#p-name').value.trim(),
              type: ov.querySelector('#p-type').value,
              gstin: ov.querySelector('#p-gstin').value.trim().toUpperCase(),
              pan: ov.querySelector('#p-pan').value.trim().toUpperCase(),
              phone: ov.querySelector('#p-phone').value.trim(),
              email: ov.querySelector('#p-email').value.trim(),
              billing_address: ov.querySelector('#p-bill').value,
              shipping_address: ov.querySelector('#p-ship').value,
              city: ov.querySelector('#p-city').value,
              state: ov.querySelector('#p-state').selectedOptions[0] ? ov.querySelector('#p-state').selectedOptions[0].text : '',
              state_code: ov.querySelector('#p-state').value,
              pincode: ov.querySelector('#p-pin').value,
              credit_limit: Number(ov.querySelector('#p-cl').value || 0),
              credit_days: Number(ov.querySelector('#p-cd').value || 0),
              opening_balance: Number(ov.querySelector('#p-ob').value || 0),
              opening_balance_type: ov.querySelector('#p-obt').value,
            };
            if (!payload.name) { VB.toast.error('Name is required.'); return; }
            try {
              if (p) await VB.invoke('party', 'update', { ...payload, id: p.id });
              else await VB.invoke('party', 'create', payload);
              VB.modal.close(); VB.toast.success('Party saved.'); load();
            } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }
    el.querySelector('#add-party').addEventListener('click', () => openForm(null));
    el.querySelector('#refresh').addEventListener('click', load);
    let timer = null;
    el.querySelector('#search').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { state.search = e.target.value; load(); }, 300); });
    el.querySelector('#type').addEventListener('change', (e) => { state.type = e.target.value; load(); });
    load();
  },
});
