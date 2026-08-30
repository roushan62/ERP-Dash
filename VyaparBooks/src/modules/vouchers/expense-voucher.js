'use strict';
VB.registerPage('expense', {
  title: 'Expense Entry',
  render() { return VB.voucherForm.render({ type: 'Expense', showItems: false, showParty: true, showBank: true }); },
  init(el) { VB.voucherForm.init(el, { type: 'Expense', showItems: false, showParty: true, showBank: true }); },
});
