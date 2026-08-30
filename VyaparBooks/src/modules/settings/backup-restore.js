'use strict';
VB.registerPage('backup', {
  title: 'Backup & Restore',
  render() {
    return `<h1 class="page-title">Backup &amp; Restore</h1>
      <p class="page-subtitle">Your data lives only on this computer. Download regular backups.</p>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Backup</h3>
        <p class="text-muted">Export the entire database as a portable <code>.backup</code> file.</p>
        <button class="btn btn-primary" id="backup">Backup Now</button>
      </div>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Restore</h3>
        <p class="text-muted">Import a .backup file. This replaces the current database.</p>
        <button class="btn btn-outline" id="restore">Restore from Backup</button>
      </div>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Danger Zone</h3>
        <p class="text-muted">Reset all company data and restore the pre-loaded Chart of Accounts.</p>
        <button class="btn btn-danger" id="reset">Reset All Data</button>
      </div>`;
  },
  async init(el) {
    const dir = await window.vyapar.getUserDataDir();
    el.insertAdjacentHTML('afterbegin', `<div class="card"><h3 class="section-title" style="margin-top:0">Data Location</h3><div class="text-muted">${VB.esc(dir)}</div></div>`);
    el.querySelector('#backup').addEventListener('click', async () => {
      const res = await window.vyapar.backup();
      if (res && !res.canceled) VB.toast.success('Backup saved: ' + res.path);
    });
    el.querySelector('#restore').addEventListener('click', async () => {
      const ok = await VB.modal.confirm({ title: 'Restore database?', message: 'Restoring will replace the current database with the selected backup. Continue?', okText: 'Restore', danger: true });
      if (!ok) return;
      const res = await window.vyapar.restore();
      if (res && !res.canceled) { VB.toast.success('Database restored.'); setTimeout(() => location.reload(), 700); }
    });
    el.querySelector('#reset').addEventListener('click', async () => {
      const ok = await VB.modal.confirm({ title: 'Reset all data?', message: 'This permanently deletes all transactions and masters. This cannot be undone.', okText: 'Reset', danger: true });
      if (!ok) return;
      try { await VB.invoke('app', 'resetData'); VB.toast.success('Data reset.'); setTimeout(() => location.reload(), 700); } catch (e) { VB.toast.error(e.message); }
    });
  },
});
