'use strict';
VB.registerPage('receipt', {
  title: 'Receipt Voucher',
  render() { return VB.voucherForm.render({ type: 'Receipt', showItems: false, showParty: true, showBank: true }); },
  init(el) { VB.voucherForm.init(el, { type: 'Receipt', showItems: false, showParty: true, showBank: true }); },
});
