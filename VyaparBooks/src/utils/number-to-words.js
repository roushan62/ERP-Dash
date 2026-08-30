'use strict';
// Convert numbers to words in Indian English format:
// "Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and Seventy-Eight Paise Only"
(function (root) {
  const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function two(n) {
    if (n < 20) return ONES[n];
    const t = Math.floor(n / 10), o = n % 10;
    return TENS[t] + (o ? '-' + ONES[o] : '');
  }
  function three(n) {
    const h = Math.floor(n / 100), r = n % 100;
    let s = '';
    if (h) s += ONES[h] + ' Hundred';
    if (r) s += (s ? ' ' : '') + two(r);
    return s;
  }
  function inWords(num) {
    if (num === 0) return 'Zero';
    let s = '';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const hundred = num % 1000;
    if (crore) s += inWords(crore) + ' Crore';
    if (lakh) s += (s ? ' ' : '') + two(lakh) + ' Lakh';
    if (thousand) s += (s ? ' ' : '') + two(thousand) + ' Thousand';
    if (hundred) s += (s ? ' ' : '') + three(hundred);
    return s;
  }
  function amountInWords(value) {
    const n = Number(value) || 0;
    const isNeg = n < 0;
    const abs = Math.abs(n);
    const rupees = Math.floor(abs);
    const paise = Math.round((abs - rupees) * 100);
    let words = inWords(rupees) || 'Zero';
    let out = isNeg ? 'Minus ' : '';
    out += 'Rupees ' + words;
    if (paise > 0) out += ' and ' + two(paise) + ' Paise';
    out += ' Only';
    return out.replace(/\s+/g, ' ');
  }
  root.VB = root.VB || {};
  root.VB.numberToWords = amountInWords;
})(typeof window !== 'undefined' ? window : globalThis);
