'use strict';
VB.registerPage('sales', {
  title: 'Sales Invoice',
  render() { return VB.voucherForm.render({ type: 'Sales', showItems: true, showParty: true, showBank: false }); },
  init(el) { VB.voucherForm.init(el, { type: 'Sales', showItems: true, showParty: true, showBank: false }); },
});
