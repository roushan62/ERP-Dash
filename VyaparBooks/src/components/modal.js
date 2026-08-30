'use strict';
// Modal component
(function (root) {
  function ensure() {
    let ov = document.getElementById('vb-modal-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'vb-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML = '';
      document.body.appendChild(ov);
    }
    return ov;
  }
  function open(opts) {
    const ov = ensure();
    ov.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''}" role="dialog">
      <div class="modal-header"><h3>${opts.title || ''}</h3><button class="modal-close" aria-label="Close">×</button></div>
      <div class="modal-body">${opts.body || ''}</div>
      ${opts.footer ? `<div class="modal-footer">${opts.footer}</div>` : ''}
    </div>`;
    ov.classList.add('show');
    ov.querySelector('.modal-close').addEventListener('click', () => close());
    ov.addEventListener('click', (e) => { if (e.target === ov && opts.dismiss !== false) close(); });
    if (opts.onOpen) opts.onOpen(ov);
    return ov;
  }
  function close() {
    const ov = document.getElementById('vb-modal-overlay');
    if (ov) {
      ov.classList.remove('show');
      ov.innerHTML = '';
    }
  }
  function confirm(opts) {
    return new Promise((resolve) => {
      const ov = ensure();
      const message = opts.message || 'Are you sure?';
      const title = opts.title || 'Confirm';
      const okText = opts.okText || 'Yes';
      ov.innerHTML = `<div class="modal confirm-modal"><div class="modal-header"><h3>${root.VB.esc(title)}</h3><button class="modal-close">×</button></div>
        <div class="modal-body">${message}</div>
        <div class="confirm-actions"><button class="btn btn-outline" data-cancel>Cancel</button><button class="btn ${opts.danger ? 'btn-danger' : 'btn-primary'}" data-ok>${okText}</button></div></div>`;
      ov.classList.add('show');
      const done = (val) => { ov.classList.remove('show'); ov.innerHTML = ''; resolve(val); };
      ov.querySelector('[data-cancel]').addEventListener('click', () => done(false));
      ov.querySelector('[data-ok]').addEventListener('click', () => done(true));
      ov.querySelector('.modal-close').addEventListener('click', () => done(false));
      ov.addEventListener('click', (e) => { if (e.target === ov) done(false); });
    });
  }
  root.VB = root.VB || {};
  root.VB.modal = { open, close, confirm };
})(typeof window !== 'undefined' ? window : globalThis);
