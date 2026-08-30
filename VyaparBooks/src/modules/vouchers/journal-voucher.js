'use strict';
VB.registerPage('journal', {
  title: 'Journal Voucher',
  render() { return VB.voucherForm.render({ type: 'Journal', showItems: false, showParty: false, showBank: false }); },
  init(el) { VB.voucherForm.init(el, { type: 'Journal', showItems: false, showParty: false, showBank: false }); },
});
