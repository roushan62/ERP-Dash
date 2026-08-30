'use strict';
VB.registerPage('ledgers', {
  title: 'Ledger Master',
  render() {
    return `<h1 class="page-title">Ledgers</h1>
      <p class="page-subtitle">Create and manage ledger accounts. Every ledger belongs to an account group.</p>
      <div class="toolbar">
        <button class="btn btn-primary" id="add-ledger">+ New Ledger</button>
        <input id="search" class="search-input" type="text" placeholder="Search ledger..." />
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="card"><div id="ledgers-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#ledgers-table');
    let state = { page: 1, search: '' };
    async function load() {
      const list = await VB.invoke('ledger', 'list', { search: state.search });
      VB.table.render(tableEl, {
        page: state.page,
        page_size: 200,
        total: list.length,
        columns: [
          { label: 'Ledger Name', key: 'name', render: (r) => `<span class="font-bold">${VB.esc(r.name)}</span>${r.is_system ? ' <span class="badge badge-primary">System</span>' : ''}` },
          { label: 'Group', key: 'group_name' },
          { label: 'Nature', key: 'nature', render: (r) => `<span class="badge badge-success">${VB.esc(r.nature)}</span>` },
          { label: 'Opening', num: true, render: (r) => VB.fmt(r.opening_balance) + ' ' + VB.esc(r.opening_balance_type) },
          { label: 'Status', render: (r) => r.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-warning">Inactive</span>' },
          { label: 'Actions', render: (r) => r.is_system ? '' : `<button class="btn btn-text btn-sm" data-action="edit" data-id="${r.id}">Edit</button><button class="btn btn-text btn-sm text-danger" data-action="del" data-id="${r.id}">Delete</button>` },
        ],
        rows: list,
        onAction(action, id) {
          if (action === 'edit') openForm(list.find((x) => x.id === Number(id)));
          if (action === 'del') {
            VB.modal.confirm({ title: 'Delete ledger?', message: 'System and used ledgers cannot be deleted.', danger: true }).then(async (ok) => {
              if (!ok) return;
              try { await VB.invoke('ledger', 'delete', { id: Number(id) }); VB.toast.success('Deleted.'); load(); } catch (e) { VB.toast.error(e.message); }
            });
          }
        },
      });
    }
    function openForm(l) {
      VB.invoke('coa', 'list').then((groups) => {
        const groupOptions = groups.map((g) => `<option value="${g.id}" ${l && l.group_id === g.id ? 'selected' : ''}>${VB.esc(g.name)} (${VB.esc(g.nature)})</option>`).join('');
        VB.modal.open({
          title: l ? 'Edit Ledger' : 'New Ledger',
          body: `<div class="form-row">
            <div class="form-group"><label>Ledger Name <span class="req">*</span></label><input id="l-name" data-validate="required" value="${l ? VB.esc(l.name) : ''}"/><div class="field-error"></div></div>
            <div class="form-group"><label>Account Group <span class="req">*</span></label><select id="l-group">${groupOptions}</select></div>
            </div>
            <div class="form-row">
            <div class="form-group"><label>Opening Balance</label><input id="l-ob" type="number" step="0.01" value="${l ? l.opening_balance : 0}"/></div>
            <div class="form-group"><label>Type</label><select id="l-obt"><option value="Dr" ${l && l.opening_balance_type === 'Dr' ? 'selected' : ''}>Dr</option><option value="Cr" ${l && l.opening_balance_type === 'Cr' ? 'selected' : ''}>Cr</option></select></div>
            <div class="form-group"><label>Active</label><select id="l-active"><option value="1" ${!l || l.is_active ? 'selected' : ''}>Yes</option><option value="0" ${l && !l.is_active ? 'selected' : ''}>No</option></select></div>
            </div>`,
          footer: `<button class="btn btn-outline" id="l-cancel">Cancel</button><button class="btn btn-primary" id="l-save">Save</button>`,
          onOpen(ov) {
            ov.querySelector('#l-cancel').addEventListener('click', VB.modal.close);
            ov.querySelector('#l-save').addEventListener('click', async () => {
              const payload = {
                name: ov.querySelector('#l-name').value.trim(),
                group_id: Number(ov.querySelector('#l-group').value),
                opening_balance: Number(ov.querySelector('#l-ob').value || 0),
                opening_balance_type: ov.querySelector('#l-obt').value,
                is_active: Number(ov.querySelector('#l-active').value),
              };
              if (!payload.name) { VB.toast.error('Ledger name is required.'); return; }
              try {
                if (l) await VB.invoke('ledger', 'update', { ...payload, id: l.id });
                else await VB.invoke('ledger', 'create', payload);
                VB.modal.close(); VB.toast.success('Ledger saved.'); load();
              } catch (e) { VB.toast.error(e.message); }
            });
          },
        });
      });
    }
    el.querySelector('#add-ledger').addEventListener('click', () => openForm(null));
    el.querySelector('#refresh').addEventListener('click', load);
    let timer = null;
    el.querySelector('#search').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { state.search = e.target.value; state.page = 1; load(); }, 300); });
    load();
  },
});
