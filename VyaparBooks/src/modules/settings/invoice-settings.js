'use strict';
VB.registerPage('invoice', {
  title: 'Invoice Settings',
  render() {
    return `<h1 class="page-title">Invoice Settings</h1>
      <p class="page-subtitle">Default terms, notes, bank details and voucher numbering.</p>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Invoice Defaults</h3>
        <div class="form-group"><label>Terms &amp; Conditions</label><textarea id="s-terms">Payment is due within 30 days.</textarea></div>
        <div class="form-group"><label>Notes</label><textarea id="s-notes">Thank you for your business!</textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Bank Name</label><input id="s-bank"/></div>
          <div class="form-group"><label>Account Number</label><input id="s-acc"/></div>
          <div class="form-group"><label>IFSC</label><input id="s-ifsc"/></div>
        </div>
        <div class="flex"><button class="btn btn-primary" id="save-inv">Save Invoice Settings</button></div>
      </div>
      <div class="card">
        <h3 class="section-title" style="margin-top:0">Voucher Numbering</h3>
        <div id="series-table"></div>
      </div>`;
  },
  async init(el) {
    const s = await VB.invoke('app', 'getInvoiceSettings');
    el.querySelector('#s-terms').value = s.terms;
    el.querySelector('#s-notes').value = s.notes;
    el.querySelector('#s-bank').value = s.bank_name;
    el.querySelector('#s-acc').value = s.account_number;
    el.querySelector('#s-ifsc').value = s.ifsc_code;
    const series = await VB.invoke('voucher', 'series');
    VB.table.render(el.querySelector('#series-table'), {
      page: 1, page_size: 50, total: series.length,
      columns: [
        { label: 'Voucher Type', key: 'voucher_type' },
        { label: 'Prefix', key: 'prefix' },
        { label: 'Next', num: true, key: 'next_number' },
        { label: 'Suffix', key: 'suffix' },
        { label: 'Example', render: (r) => `${r.prefix}${String(r.next_number).padStart(4, '0')}${r.suffix}` },
      ],
      rows: series,
    });
    el.querySelector('#save-inv').addEventListener('click', async () => {
      try {
        await VB.invoke('app', 'saveInvoiceSettings', {
          terms: el.querySelector('#s-terms').value,
          notes: el.querySelector('#s-notes').value,
          bank_name: el.querySelector('#s-bank').value,
          account_number: el.querySelector('#s-acc').value,
          ifsc_code: el.querySelector('#s-ifsc').value,
        });
        VB.toast.success('Invoice settings saved.');
      } catch (e) { VB.toast.error(e.message); }
    });
  },
});
