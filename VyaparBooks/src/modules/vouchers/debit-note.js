'use strict';
VB.registerPage('debitnote', {
  title: 'Debit Note',
  render() { return VB.voucherForm.render({ type: 'Debit Note', showItems: true, showParty: true, showBank: false }); },
  init(el) { VB.voucherForm.init(el, { type: 'Debit Note', showItems: true, showParty: true, showBank: false }); },
});
