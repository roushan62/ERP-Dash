'use strict';
VB.registerPage('creditnote', {
  title: 'Credit Note',
  render() { return VB.voucherForm.render({ type: 'Credit Note', showItems: true, showParty: true, showBank: false }); },
  init(el) { VB.voucherForm.init(el, { type: 'Credit Note', showItems: true, showParty: true, showBank: false }); },
});
