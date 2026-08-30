'use strict';
// Reusable data table component with pagination
(function (root) {
  function render(el, opts) {
    if (typeof el === 'string') el = document.querySelector(el);
    const columns = opts.columns || [];
    const rows = opts.rows || [];
    const format = opts.format || ((v) => v);
    const total = opts.total !== undefined ? opts.total : rows.length;
    const page = opts.page || 1;
    const pageSize = opts.page_size || 50;
    const pages = opts.pages || Math.max(1, Math.ceil(total / pageSize));
    const empty = opts.empty || 'No records found.';
    let head = '<thead><tr>' + columns.map((c) => `<th class="${c.num ? 'num' : ''}">${c.label}</th>`).join('') + '</tr></thead>';
    let body;
    if (!rows.length) {
      body = `<tbody><tr><td colspan="${columns.length}"><div class="empty">${empty}</div></td></tr></tbody>`;
    } else {
      body = '<tbody>' + rows.map((r) => '<tr>' + columns.map((c) => `<td class="${c.num ? 'num' : ''}">${c.render ? c.render(r) : format(r[c.key])}</td>`).join('') + '</tr>').join('') + '</tbody>';
    }
    const pager = `<div class="table-footer">
      <div class="text-muted">Showing ${rows.length} of ${total}</div>
      <div class="pagination">${page > 1 ? `<button class="btn btn-outline btn-sm" data-pg="${page - 1}">Prev</button>` : ''}<span class="text-muted">Page ${page} / ${pages}</span>${page < pages ? `<button class="btn btn-outline btn-sm" data-pg="${page + 1}">Next</button>` : ''}</div>
    </div>`;
    el.innerHTML = `<div class="table-wrap"><table class="table">${head}${body}</table></div>${pager}`;
    if (opts.onPage) el.querySelectorAll('[data-pg]').forEach((b) => b.addEventListener('click', () => opts.onPage(Number(b.dataset.pg))));
    if (opts.onClick) {
      el.querySelectorAll('tbody tr[data-id]').forEach((tr) => tr.addEventListener('click', (e) => {
        if (e.target.closest('.actions')) return;
        opts.onClick(tr.dataset.id, tr);
      }));
    }
    el.querySelectorAll('[data-action]').forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opts.onAction) opts.onAction(b.dataset.action, b.dataset.id, b);
    }));
    return el;
  }
  root.VB = root.VB || {};
  root.VB.table = { render };
})(typeof window !== 'undefined' ? window : globalThis);
