'use strict';
// Form validator (required, email, phone, PAN, GSTIN, numbers)
(function (root) {
  function setError(input, msg) {
    const group = input.closest('.form-group');
    if (!group) return false;
    group.classList.add('has-error');
    const err = group.querySelector('.field-error');
    if (err) err.textContent = msg;
    return false;
  }
  function clearError(input) {
    const group = input.closest('.form-group');
    if (group) group.classList.remove('has-error');
  }
  function validate(form, rules) {
    let ok = true;
    form.querySelectorAll('[data-validate]').forEach((el) => {
      clearError(el);
      const type = el.dataset.validate;
      if (type.includes('required') && !String(el.value || '').trim()) { setError(el, 'This field is required.'); ok = false; return; }
      if (type.includes('email') && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) { setError(el, 'Enter a valid email address.'); ok = false; }
      if (type.includes('phone') && el.value && !/^[0-9+\-\s]{10,15}$/.test(el.value)) { setError(el, 'Enter a valid phone number.'); ok = false; }
      if (type.includes('pan') && el.value && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(el.value.toUpperCase())) { setError(el, 'Enter a valid PAN (e.g. ABCDE1234F).'); ok = false; }
      if (type.includes('gstin') && el.value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/.test(el.value.toUpperCase())) { setError(el, 'Enter a valid GSTIN.'); ok = false; }
      if (type.includes('positive') && el.value && Number(el.value) < 0) { setError(el, 'Value cannot be negative.'); ok = false; }
    });
    if (rules) {
      for (const [id, fn] of Object.entries(rules)) {
        const el = form.querySelector('#' + id);
        if (el) { clearError(el); const r = fn(el.value, form); if (r !== true) { setError(el, r || 'Invalid value.'); ok = false; } }
      }
    }
    return ok;
  }
  function bindClear(form) {
    form.querySelectorAll('input,select,textarea').forEach((el) => el.addEventListener('input', () => clearError(el)));
  }
  root.VB = root.VB || {};
  root.VB.validator = { validate, setError, clearError, bindClear };
})(typeof window !== 'undefined' ? window : globalThis);
