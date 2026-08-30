'use strict';
// Shared report page framework - filtering + table + PDF/Excel/print export.
(function (root) {
  const pages = {};

  function register(def) {
    pages[def.route] = def;
    root.VB.registerPage(def.route, {
      title: def.title,
      render() {
        return `<h1 class="page-title">${def.title}</h1>
          <p class="page-subtitle">${def.subtitle || ''}</p>
          <div class="toolbar">
            <label class="text-muted">From</label><input id="rp-from" type="date" value="${root.VB.today()}"/>
            <label class="text-muted">To</label><input id="rp-to" type="date" value="${root.VB.today()}"/>
            ${def.filters ? `<select id="rp-filter"></select>` : ''}
            <button class="btn btn-outline" id="rp-refresh">Refresh</button>
            <button class="btn btn-outline" id="rp-pdf">📥 PDF</button>
            <button class="btn btn-outline" id="rp-excel">📥 Excel</button>
            <button class="btn btn-outline" id="rp-print">🖨️ Print</button>
            <div class="loader" id="rp-loader"></div>
          </div>
          <div class="card"><div class="text-muted" id="rp-summary"></div><div id="rp-table"></div></div>`;
      },
      async init(el) {
        let state = { rows: [], totals: [], columns: def.columns, title: def.title, subtitle: '', filter: '' };
        const $ = (id) => el.querySelector('#' + id);
        $( 'rp-to').value = root.VB.today();
        $('#rp-from').value = root.VB.financialYear.fyRange(root.VB.financialYear.fyName()).start;
        async function loadFilterOptions() {
          if (!def.filters) return;
          const opts = def.filters === 'ledger' ? await root.VB.invoke('ledger', 'list') : def.filters === 'party' ? await root.VB.invoke('party', 'list') : [];
          $('#rp-filter').innerHTML = '<option value="">All</option>' + opts.map((o) => `<option value="${o.id}">${root.VB.esc(o.name)}</option>`).join('');
          $('#rp-filter').addEventListener('change', () => load());
        }
        async function load() {
          const loader = $('#rp-loader'); loader.classList.add('show');
          try {
            state.filter = $('#rp-filter') ? $('#rp-filter').value : '';
            const result = await def.load({ from: $('#rp-from').value, to: $('#rp-to').value, filter: state.filter }) || {};
            state.rows = result.rows || [];
            state.totals = result.totals || [];
            state.columns = result.columns || def.columns;
            state.summary = result.summary || '';
            $('#rp-summary').innerHTML = state.summary || '';
            root.VB.table.render($('#rp-table'), {
              page: 1, page_size: state.rows.length, total: state.rows.length,
              columns: state.columns, rows: state.rows, empty: 'No data in selected period.',
            });
          } catch (e) { root.VB.toast.error(e.message); }
          finally { loader.classList.remove('show'); }
        }
        async function company() { return await root.VB.invoke('app', 'getCompany'); }
        $('#rp-refresh').addEventListener('click', load);
        $('#rp-print').addEventListener('click', () => root.VB.print.printDocument('#rp-table'));
        $('#rp-pdf').addEventListener('click', async () => {
          const company = await company();
          const res = await root.VB.exportPdf({ payload: { title: state.title, company, subtitle: state.summary.replace(/<[^>]+>/g, ' '), columns: state.columns, rows: state.rows, totals: state.totals }, defaultName: state.title.replace(/\s+/g, '-') + '.pdf' });
          if (res && !res.canceled) root.VB.toast.success('PDF saved: ' + res.path);
        });
        $('#rp-excel').addEventListener('click', async () => {
          const company = await company();
          const res = await root.VB.exportExcel({ payload: { title: state.title, sheet: state.title, company, columns: state.columns, rows: state.rows, totals: state.totals }, defaultName: state.title.replace(/\s+/g, '-') + '.xlsx' });
          if (res && !res.canceled) root.VB.toast.success('Excel saved: ' + res.path);
        });
        await loadFilterOptions();
        await load();
      },
    });
  }

  root.VB = root.VB || {};
  root.VB.report = { register, pages };
})(typeof window !== 'undefined' ? window : globalThis);
