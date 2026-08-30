'use strict';
VB.registerPage('dashboard', {
  title: 'Dashboard',
  render() {
    return `<h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle" id="dash-subtitle">Loading...</p>
      <div class="grid grid-2" style="grid-template-columns:repeat(3,1fr)">
        <div class="card stat-card"><div class="stat-label">Total Sales (FY)</div><div class="stat-value text-success" id="d-sales">—</div></div>
        <div class="card stat-card"><div class="stat-label">Total Purchases (FY)</div><div class="stat-value text-danger" id="d-purchases">—</div></div>
        <div class="card stat-card"><div class="stat-label">Net Profit (FY)</div><div class="stat-value text-primary" id="d-profit">—</div></div>
        <div class="card stat-card"><div class="stat-label">Receivable</div><div class="stat-value" id="d-rec">—</div></div>
        <div class="card stat-card"><div class="stat-label">Payable</div><div class="stat-value" id="d-pay">—</div></div>
        <div class="card stat-card"><div class="stat-label">Cash &amp; Bank</div><div class="stat-value" id="d-cash">—</div></div>
      </div>
      <div class="card">
        <div class="flex-between"><h3 class="section-title" style="margin:0">Monthly Sales vs Purchases</h3><button class="btn btn-outline btn-sm" id="refresh-dash">Refresh</button></div>
        <canvas id="monthly-chart" height="90"></canvas>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h3 class="section-title" style="margin-top:0">Top Customers</h3>
          <div id="top-customers"></div>
        </div>
        <div class="card">
          <h3 class="section-title" style="margin-top:0">Expense Breakdown</h3>
          <canvas id="expense-chart" height="160"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Recent Transactions</h3>
        <div id="recent-table"></div>
      </div>`;
  },
  init(el) {
    let chart1, chart2;
    async function load() {
      const d = await VB.invoke('app', 'getCompany');
      const fy = await VB.invoke('app', 'getActiveFY');
      const data = await VB.invoke('report', 'dashboard').catch(() => null);
      if (!data) { el.querySelector('#dash-subtitle').textContent = 'Unable to load dashboard.'; return; }
      el.querySelector('#dash-subtitle').textContent = `${d ? d.name : 'Company'} · FY ${fy ? fy.fy_name : '—'}`;
      el.querySelector('#d-sales').textContent = VB.fmt(data.total_sales);
      el.querySelector('#d-purchases').textContent = VB.fmt(data.total_purchases);
      el.querySelector('#d-profit').textContent = VB.fmt(data.net_profit);
      el.querySelector('#d-rec').textContent = VB.fmt(data.total_receivable);
      el.querySelector('#d-pay').textContent = VB.fmt(data.total_payable);
      el.querySelector('#d-cash').textContent = VB.fmt(data.cash_bank);
      el.querySelector('#top-customers').innerHTML = data.top_customers.length ? data.top_customers.map((c, i) => `<div class="flex-between" style="padding:6px 0;border-bottom:1px solid #E2E8F0"><div>${i + 1}. ${VB.esc(c.name)}</div><div class="font-bold">${VB.fmt(c.amount)}</div></div>`).join('') : '<div class="empty">No sales yet.</div>';
      if (window.Chart) {
        if (chart1) chart1.destroy(); if (chart2) chart2.destroy();
        chart1 = new Chart(el.querySelector('#monthly-chart'), {
          type: 'bar',
          data: { labels: data.monthly.map((m) => m.month), datasets: [
            { label: 'Sales', data: data.monthly.map((m) => m.sales), backgroundColor: '#1E40AF' },
            { label: 'Purchases', data: data.monthly.map((m) => m.purchases), backgroundColor: '#3B82F6' },
          ] },
          options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } } } },
        });
        chart2 = new Chart(el.querySelector('#expense-chart'), {
          type: 'pie',
          data: { labels: data.expense_breakdown.map((x) => x.name), datasets: [{ data: data.expense_breakdown.map((x) => x.amount), backgroundColor: ['#1E40AF','#3B82F6','#059669','#D97706','#DC2626','#64748B'] }] },
          options: { responsive: true },
        });
      }
      VB.table.render(el.querySelector('#recent-table'), {
        page: 1, page_size: 10, total: data.recent.length,
        columns: [
          { label: 'Date', render: (r) => VB.fmtDate(r.date) },
          { label: 'Type', key: 'voucher_type' },
          { label: 'Voucher #', key: 'voucher_number' },
          { label: 'Party', key: 'party_name' },
          { label: 'Amount', num: true, render: (r) => VB.fmt(r.grand_total) },
        ],
        rows: data.recent,
      });
    }
    el.querySelector('#refresh-dash').addEventListener('click', load);
    load();
  },
});
