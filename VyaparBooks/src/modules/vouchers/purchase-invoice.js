'use strict';
VB.registerPage('purchase', {
  title: 'Purchase Invoice',
  render() { return VB.voucherForm.render({ type: 'Purchase', showItems: true, showParty: true, showBank: false }); },
  init(el) { VB.voucherForm.init(el, { type: 'Purchase', showItems: true, showParty: true, showBank: false }); },
});
