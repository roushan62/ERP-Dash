'use strict';
VB.registerPage('items', {
  title: 'Items / Services',
  render() {
    return `<h1 class="page-title">Items / Services</h1>
      <p class="page-subtitle">Products and services with GST rate and stock tracking.</p>
      <div class="toolbar">
        <button class="btn btn-primary" id="add-item">+ New Item</button>
        <input id="search" class="search-input" type="text" placeholder="Search item / HSN" />
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="card"><div id="items-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#items-table');
    async function load() {
      const list = await VB.invoke('item', 'list', { search: el.querySelector('#search').value });
      VB.table.render(tableEl, {
        page: 1, page_size: 500, total: list.length,
        columns: [
          { label: 'Name', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
          { label: 'Type', render: (r) => `<span class="badge ${r.type === 'Service' ? 'badge-primary' : 'badge-success'}">${VB.esc(r.type)}</span>` },
          { label: 'HSN/SAC', key: 'hsn_sac_code' },
          { label: 'Unit', key: 'unit' },
          { label: 'GST %', num: true, render: (r) => VB.fmtR(r.gst_rate) },
          { label: 'Purchase', num: true, render: (r) => VB.fmt(r.purchase_price) },
          { label: 'Sale', num: true, render: (r) => VB.fmt(r.sale_price) },
          { label: 'Stock', num: true, render: (r) => VB.fmtR(r.current_stock) },
          { label: 'Actions', render: (r) => `<button class="btn btn-text btn-sm" data-action="edit" data-id="${r.id}">Edit</button><button class="btn btn-text btn-sm text-danger" data-action="del" data-id="${r.id}">Delete</button>` },
        ],
        rows: list,
        onAction(action, id) {
          if (action === 'edit') openForm(list.find((x) => x.id === Number(id)));
          if (action === 'del') VB.modal.confirm({ title: 'Delete item?', message: 'Items used in transactions cannot be deleted.', danger: true }).then(async (ok) => {
            if (!ok) return;
            try { await VB.invoke('item', 'delete', { id: Number(id) }); VB.toast.success('Deleted.'); load(); } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }
    function openForm(it) {
      VB.invoke('tax', 'list').then(async (rates) => {
        const ledgers = await VB.invoke('ledger', 'list');
        const rateOptions = rates.filter((r) => r.is_active).map((r) => `<option value="${r.rate}" ${it && it.gst_rate === r.rate ? 'selected' : ''}>${VB.esc(r.name)} (${r.rate}%)</option>`).join('');
        let ledOptions = '';
        ['Sales Account', 'Purchase Account'].forEach((name) => { const l = ledgers.find((x) => x.name === name); ledOptions += l ? `<option value="${l.id}">${VB.esc(l.name)}</option>` : ''; });
        VB.modal.open({
          title: it ? 'Edit Item' : 'New Item',
          body: `<div class="form-row">
            <div class="form-group"><label>Name <span class="req">*</span></label><input id="i-name" data-validate="required" value="${it ? VB.esc(it.name) : ''}"/><div class="field-error"></div></div>
            <div class="form-group"><label>Type</label><select id="i-type"><option value="Goods" ${!it || it.type === 'Goods' ? 'selected' : ''}>Goods</option><option value="Service" ${it && it.type === 'Service' ? 'selected' : ''}>Service</option></select></div>
            <div class="form-group"><label>Unit</label><input id="i-unit" value="${it ? VB.esc(it.unit || 'Nos') : 'Nos'}"/></div>
            </div>
            <div class="form-row">
            <div class="form-group"><label>HSN / SAC</label><input id="i-hsn" value="${it ? VB.esc(it.hsn_sac_code || '') : ''}"/></div>
            <div class="form-group"><label>GST Rate</label><select id="i-gst">${rateOptions}</select></div>
            <div class="form-group"><label>Cess %</label><input id="i-cess" type="number" step="0.01" value="${it ? it.cess_rate : 0}"/></div>
            </div>
            <div class="form-row">
            <div class="form-group"><label>Purchase Price</label><input id="i-pp" type="number" step="0.01" value="${it ? it.purchase_price : 0}"/></div>
            <div class="form-group"><label>Sale Price</label><input id="i-sp" type="number" step="0.01" value="${it ? it.sale_price : 0}"/></div>
            <div class="form-group"><label>Opening Stock</label><input id="i-stock" type="number" step="0.01" value="${it ? it.opening_stock : 0}"/></div>
            <div class="form-group"><label>Low Stock Alert</label><input id="i-low" type="number" step="0.01" value="${it ? it.low_stock_alert : 0}"/></div>
            </div>
            <div class="form-row">
            <div class="form-group"><label>Purchase Ledger</label><select id="i-pl">${ledOptions}</select></div>
            <div class="form-group"><label>Sale Ledger</label><select id="i-sl">${ledOptions}</select></div>
            </div>`,
          footer: `<button class="btn btn-outline" id="i-cancel">Cancel</button><button class="btn btn-primary" id="i-save">Save</button>`,
          onOpen(ov) {
            ov.querySelector('#i-cancel').addEventListener('click', VB.modal.close);
            ov.querySelector('#i-save').addEventListener('click', async () => {
              const payload = {
                name: ov.querySelector('#i-name').value.trim(),
                type: ov.querySelector('#i-type').value,
                hsn_sac_code: ov.querySelector('#i-hsn').value.trim(),
                unit: ov.querySelector('#i-unit').value.trim(),
                gst_rate: Number(ov.querySelector('#i-gst').value || 0),
                cess_rate: Number(ov.querySelector('#i-cess').value || 0),
                purchase_price: Number(ov.querySelector('#i-pp').value || 0),
                sale_price: Number(ov.querySelector('#i-sp').value || 0),
                opening_stock: Number(ov.querySelector('#i-stock').value || 0),
                low_stock_alert: Number(ov.querySelector('#i-low').value || 0),
                purchase_ledger_id: Number(ov.querySelector('#i-pl').value || 0) || null,
                sale_ledger_id: Number(ov.querySelector('#i-sl').value || 0) || null,
              };
              if (!payload.name) { VB.toast.error('Name is required.'); return; }
              try {
                if (it) await VB.invoke('item', 'update', { ...payload, id: it.id });
                else await VB.invoke('item', 'create', payload);
                VB.modal.close(); VB.toast.success('Item saved.'); load();
              } catch (e) { VB.toast.error(e.message); }
            });
          },
        });
      });
    }
    el.querySelector('#add-item').addEventListener('click', () => openForm(null));
    el.querySelector('#refresh').addEventListener('click', load);
    let timer = null;
    el.querySelector('#search').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(load, 300); });
    load();
  },
});
