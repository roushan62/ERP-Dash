'use strict';
VB.registerPage('general', {
  title: 'General Settings',
  render() {
    return `<h1 class="page-title">General Settings</h1>
      <p class="page-subtitle">Application and company preferences.</p>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Company</h3>
        <div id="company-summary"></div>
        <h3 class="section-title">Preferences</h3>
        <div class="form-row">
          <div class="form-group"><label>Theme</label><select id="s-theme"><option value="light">Light</option><option value="dark">Dark</option></select></div>
          <div class="form-group"><label>Allow future dated vouchers</label><select id="s-future"><option value="1">Yes</option><option value="0">No</option></select></div>
          <div class="form-group"><label>Page size (reports)</label><select id="s-page"><option value="25">25</option><option value="50">50</option><option value="100">100</option><option value="200">200</option></select></div>
        </div>
        <div class="flex"><button class="btn btn-primary" id="save-general">Save Settings</button></div>
      </div>`;
  },
  async init(el) {
    const company = await VB.invoke('app', 'getCompany');
    el.querySelector('#company-summary').innerHTML = `<div class="grid grid-2">
      <div><span class="text-muted">Name</span><div class="font-bold">${VB.esc(company && company.name || '—')}</div></div>
      <div><span class="text-muted">GSTIN</span><div class="font-bold">${VB.esc(company && company.gstin || '—')}</div></div>
      <div><span class="text-muted">PAN</span><div class="font-bold">${VB.esc(company && company.pan || '—')}</div></div>
      <div><span class="text-muted">State</span><div class="font-bold">${VB.esc(company && company.state || '—')}</div></div>
    </div>`;
    const s = await VB.invoke('app', 'getGeneralSettings');
    el.querySelector('#s-theme').value = s.theme || 'light';
    el.querySelector('#s-future').value = s.allow_future_dates || '1';
    el.querySelector('#s-page').value = s.page_size || '50';
    el.querySelector('#save-general').addEventListener('click', async () => {
      try {
        await VB.invoke('app', 'saveGeneralSettings', { theme: el.querySelector('#s-theme').value, allow_future_dates: el.querySelector('#s-future').value, page_size: el.querySelector('#s-page').value });
        VB.toast.success('Settings saved.');
      } catch (e) { VB.toast.error(e.message); }
    });
  },
});
