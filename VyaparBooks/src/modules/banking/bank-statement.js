'use strict';
VB.registerPage('statement', {
  title: 'Bank Statement',
  render() {
    return `<h1 class="page-title">Bank Statement</h1>
      <p class="page-subtitle">Statement with running balance for a bank account.</p>
      <div class="toolbar">
        <select id="bs-bank"></select>
        <input id="bs-from" type="date" value="${VB.today()}"/>
        <input id="bs-to" type="date" value="${VB.today()}"/>
        <button class="btn btn-outline" id="refresh">Refresh</button>
        <button class="btn btn-outline" id="pdf">PDF</button>
      </div>
      <div class="card"><div id="bs-summary" class="text-muted"></div><div id="bs-table"></div></div>`;
  },
  init(el) {
    const tableEl = el.querySelector('#bs-table');
    let state = {};
    async function load() {
      const bankId = Number(el.querySelector('#bs-bank').value || 0);
      const from = el.querySelector('#bs-from').value;
      const to = el.querySelector('#bs-to').value;
      if (!bankId) return;
      const d = await VB.invoke('banking', 'statement', { bank_id: bankId, from, to });
      state = d;
      el.querySelector('#bs-summary').innerHTML = `<strong>${VB.esc(d.bank.bank_name)}</strong> &nbsp; Opening: ${VB.fmt(d.opening_balance.amount)} ${d.opening_balance.type} &nbsp; Closing: ${VB.fmt(d.closing_balance)}`;
      VB.table.render(tableEl, {
        page: 1, page_size: 500, total: d.rows.length,
        columns: [
          { label: 'Date', render: (r) => VB.fmtDate(r.date) },
          { label: 'Type', render: (r) => `<span class="badge ${r.type === 'Deposit' ? 'badge-success' : 'badge-warning'}">${r.type}</span>` },
          { label: 'Amount', num: true, render: (r) => VB.fmt(r.amount) },
          { label: 'Reference', key: 'reference' },
          { label: 'Book Debit', num: true, render: (r) => VB.fmt(r.book_debit) },
          { label: 'Book Credit', num: true, render: (r) => VB.fmt(r.book_credit) },
          { label: 'Matched', render: (r) => r.matched ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-warning">No</span>' },
          { label: 'Running Balance', num: true, render: (r) => VB.fmt(r.running_balance) },
        ],
        rows: d.rows,
      });
    }
    async function fill() {
      const banks = await VB.invoke('bank', 'list');
      el.querySelector('#bs-bank').innerHTML = banks.map((b) => `<option value="${b.id}">${VB.esc(b.bank_name)}</option>`).join('');
      banks[0] && el.querySelector('#bs-bank').addEventListener('change', load);
      el.querySelector('#bs-from').addEventListener('change', load);
      el.querySelector('#bs-to').addEventListener('change', load);
    }
    el.querySelector('#refresh').addEventListener('click', load);
    el.querySelector('#pdf').addEventListener('click', async () => {
      const company = await VB.invoke('app', 'getCompany');
      const rows = state.rows || [];
      VB.exportPdf({ payload: { title: 'Bank Statement', company, columns: [
        { label: 'Date', key: 'date' }, { label: 'Type', key: 'type' }, { label: 'Amount', key: 'amount', num: true }, { label: 'Ref', key: 'reference' }, { label: 'Balance', key: 'running_balance', num: true },
      ], rows: rows.map((r) => ({ date: VB.fmtDate(r.date), type: r.type, amount: Number(r.amount), reference: r.reference, running_balance: Number(r.running_balance) })) }, defaultName: 'Bank-Statement.pdf' }).then((res) => { if (res && !res.canceled) VB.toast.success('PDF saved.'); });
    });
    fill().then(load);
  },
});
