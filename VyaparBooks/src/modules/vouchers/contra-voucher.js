'use strict';
VB.registerPage('contra', {
  title: 'Contra Voucher',
  render() { return VB.voucherForm.render({ type: 'Contra', showItems: false, showParty: false, showBank: false }); },
  init(el) { VB.voucherForm.init(el, { type: 'Contra', showItems: false, showParty: false, showBank: false }); },
});
