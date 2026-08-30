'use strict';
VB.registerPage('tax', {
  title: 'Tax (GST) Setup',
  render() {
    return `<h1 class="page-title">Tax (GST) Setup</h1>
      <p class="page-subtitle">GST rates used across invoices. Editing a rate affects new transactions.</p>
      <div class="card"><div id="tax-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#tax-table');
    async function load() {
      const list = await VB.invoke('tax', 'list');
      VB.table.render(tableEl, {
        page: 1, page_size: 100, total: list.length,
        columns: [
          { label: 'Name', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>` },
          { label: 'Rate %', num: true, render: (r) => VB.fmtR(r.rate) },
          { label: 'CGST %', num: true, render: (r) => VB.fmtR(r.cgst_rate) },
          { label: 'SGST %', num: true, render: (r) => VB.fmtR(r.sgst_rate) },
          { label: 'IGST %', num: true, render: (r) => VB.fmtR(r.igst_rate) },
          { label: 'Cess %', num: true, render: (r) => VB.fmtR(r.cess_rate) },
          { label: 'Status', render: (r) => r.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-warning">Inactive</span>' },
          { label: 'Actions', render: (r) => `<button class="btn btn-text btn-sm" data-action="edit" data-id="${r.id}">Edit</button>` },
        ],
        rows: list,
        onAction(action, id) { if (action === 'edit') openForm(list.find((x) => x.id === Number(id))); },
      });
    }
    function openForm(t) {
      VB.modal.open({
        title: 'Edit Tax Rate',
        body: `<div class="form-row">
          <div class="form-group"><label>Name</label><input id="t-name" value="${VB.esc(t.name)}"/></div>
          <div class="form-group"><label>Total Rate</label><input id="t-rate" type="number" step="0.01" value="${t.rate}"/></div>
          </div>
          <div class="form-row">
          <div class="form-group"><label>CGST %</label><input id="t-cgst" type="number" step="0.01" value="${t.cgst_rate}"/></div>
          <div class="form-group"><label>SGST %</label><input id="t-sgst" type="number" step="0.01" value="${t.sgst_rate}"/></div>
          <div class="form-group"><label>IGST %</label><input id="t-igst" type="number" step="0.01" value="${t.igst_rate}"/></div>
          <div class="form-group"><label>Cess %</label><input id="t-cess" type="number" step="0.01" value="${t.cess_rate}"/></div>
          </div>
          <div class="form-group"><label>Active</label><select id="t-active"><option value="1" ${t.is_active ? 'selected' : ''}>Yes</option><option value="0" ${!t.is_active ? 'selected' : ''}>No</option></select></div>`,
        footer: `<button class="btn btn-outline" id="t-cancel">Cancel</button><button class="btn btn-primary" id="t-save">Save</button>`,
        onOpen(ov) {
          ov.querySelector('#t-cancel').addEventListener('click', VB.modal.close);
          ov.querySelector('#t-save').addEventListener('click', async () => {
            try {
              await VB.invoke('tax', 'update', {
                id: t.id,
                name: ov.querySelector('#t-name').value,
                rate: Number(ov.querySelector('#t-rate').value),
                cgst_rate: Number(ov.querySelector('#t-cgst').value),
                sgst_rate: Number(ov.querySelector('#t-sgst').value),
                igst_rate: Number(ov.querySelector('#t-igst').value),
                cess_rate: Number(ov.querySelector('#t-cess').value),
                is_active: Number(ov.querySelector('#t-active').value),
              });
              VB.modal.close(); VB.toast.success('Tax rate saved.'); load();
            } catch (e) { VB.toast.error(e.message); }
          });
        },
      });
    }
    load();
  },
});
