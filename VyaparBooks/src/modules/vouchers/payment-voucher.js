'use strict';
VB.registerPage('payment', {
  title: 'Payment Voucher',
  render() { return VB.voucherForm.render({ type: 'Payment', showItems: false, showParty: true, showBank: true }); },
  init(el) { VB.voucherForm.init(el, { type: 'Payment', showItems: false, showParty: true, showBank: true }); },
});
