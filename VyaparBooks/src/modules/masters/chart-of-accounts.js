'use strict';
VB.registerPage('coa', {
  title: 'Chart of Accounts',
  render() {
    return `<h1 class="page-title">Chart of Accounts</h1>
      <p class="page-subtitle">Pre-defined Tally-style account group hierarchy.</p>
      <div class="toolbar">
        <button class="btn btn-primary" id="add-group">+ Add Group</button>
        <button class="btn btn-outline" id="refresh">Refresh</button>
      </div>
      <div class="card"><div id="coa-tree" class="table-wrap"></div></div>`;
  },
  init(el) {
    const treeEl = el.querySelector('#coa-tree');
    async function load() {
      const tree = await VB.invoke('coa', 'tree');
      treeEl.innerHTML = tree.length ? renderTree(tree) : '<div class="empty">No account groups.</div>';
      el.querySelectorAll('.tree-toggle').forEach((b) => b.addEventListener('click', () => {
        const children = b.closest('.tree-node').querySelector('.tree-children');
        if (children) children.style.display = children.style.display === 'none' ? '' : 'none';
      }));
    }
    function renderTree(nodes, depth) {
      depth = depth || 0;
      if (!nodes || !nodes.length) return '';
      return nodes.map((n) => {
        const has = n.children && n.children.length;
        const badge = n.is_system ? '<span class="badge badge-primary">System</span>' : '';
        return `<div class="tree-node">
          <div class="flex" style="padding:8px 4px;margin-left:${depth * 18}px">
            <span class="tree-toggle">${has ? '▾' : ' '}</span>
            <div style="margin-left:6px"><span class="font-bold">${VB.esc(n.name)}</span>
              <span class="badge badge-success">${VB.esc(n.nature)}</span> ${badge}
              <span class="text-muted">${n.parent_name ? 'Parent: ' + VB.esc(n.parent_name) : ''}</span>
              ${!n.is_system ? `<button class="btn btn-text btn-sm" data-edit="${n.id}">Edit</button><button class="btn btn-text btn-sm text-danger" data-del="${n.id}">Delete</button>` : ''}
            </div>
          </div>
          ${has ? `<div class="tree-children" style="display:none">${renderTree(n.children, depth + 1)}</div>` : ''}
        </div>`;
      }).join('');
    }
    function openForm(g) {
      const groups = [];
      VB.invoke('coa', 'list').then((list) => {
        groups.push(...list.filter((x) => !x.is_system || x.id !== (g && g.id)));
        const options = groups.map((x) => `<option value="${x.id}" ${g && x.id === g.parent_id ? 'selected' : ''}>${VB.esc(x.name)}</option>`).join('');
        VB.modal.open({
          title: g ? 'Edit Account Group' : 'Add Account Group',
          body: `<div class="form-group"><label>Group Name <span class="req">*</span></label><input id="g-name" required value="${g ? VB.esc(g.name) : ''}"/><div class="field-error"></div></div>
            <div class="form-row">
              <div class="form-group"><label>Nature</label><select id="g-nature">
                <option value="Assets" ${g && g.nature === 'Assets' ? 'selected' : ''}>Assets</option>
                <option value="Liabilities" ${g && g.nature === 'Liabilities' ? 'selected' : ''}>Liabilities</option>
                <option value="Income" ${g && g.nature === 'Income' ? 'selected' : ''}>Income</option>
                <option value="Expense" ${g && g.nature === 'Expense' ? 'selected' : ''}>Expense</option>
              </select></div>
              <div class="form-group"><label>Parent Group</label><select id="g-parent"><option value="">— None —</option>${options}</select></div>
            </div>`,
          footer: `<button class="btn btn-outline" id="g-cancel">Cancel</button><button class="btn btn-primary" id="g-save">Save</button>`,
          onOpen(ov) {
            ov.querySelector('#g-cancel').addEventListener('click', VB.modal.close);
            ov.querySelector('#g-save').addEventListener('click', async () => {
              const name = ov.querySelector('#g-name').value.trim();
              if (!name) { VB.toast.error('Group name is required.'); return; }
              const payload = { name, nature: ov.querySelector('#g-nature').value, parent_id: ov.querySelector('#g-parent').value ? Number(ov.querySelector('#g-parent').value) : null };
              try {
                if (g) await VB.invoke('coa', 'update', { ...payload, id: g.id });
                else await VB.invoke('coa', 'create', payload);
                VB.modal.close(); VB.toast.success('Account group saved.'); load();
              } catch (e) { VB.toast.error(e.message); }
            });
          },
        });
      });
    }
    el.querySelector('#add-group').addEventListener('click', () => openForm(null));
    el.querySelector('#refresh').addEventListener('click', load);
    treeEl.addEventListener('click', (e) => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-del]');
      if (edit) {
        VB.invoke('coa', 'list').then((list) => openForm(list.find((x) => x.id === Number(edit.dataset.edit))));
      }
      if (del) {
        VB.modal.confirm({ title: 'Delete group?', message: 'This may fail if the group is in use.', danger: true }).then(async (ok) => {
          if (!ok) return;
          try { await VB.invoke('coa', 'delete', { id: Number(del.dataset.del) }); VB.toast.success('Deleted.'); load(); }
          catch (e) { VB.toast.error(e.message); }
        });
      }
    });
    load();
  },
});
