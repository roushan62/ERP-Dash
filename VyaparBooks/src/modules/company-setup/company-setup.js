'use strict';
VB.registerPage('company-setup', {
  title: 'Company Setup',
  render() {
    const states = VB.states.map((s) => `<option value="${s.code}">${VB.esc(s.name)}</option>`).join('');
    return `<h1 class="page-title">Welcome to VyaparBooks</h1>
      <p class="page-subtitle">Set up your company in four simple steps. This only happens once.</p>
      <div class="stepper">
        <div class="step active" data-step="1"><div class="dot">1</div><div>Company</div></div>
        <div class="step" data-step="2"><div class="dot">2</div><div>Financial Year</div></div>
        <div class="step" data-step="3"><div class="dot">3</div><div>Opening Balances</div></div>
        <div class="step" data-step="4"><div class="dot">4</div><div>Finish</div></div>
      </div>
      <div class="card" id="step-1">
        <h3 class="section-title" style="margin-top:0">Company Details</h3>
        <div class="form-row">
          <div class="form-group"><label>Company Name <span class="req">*</span></label><input id="c-name" data-validate="required"/><div class="field-error"></div></div>
          <div class="form-group"><label>Email</label><input id="c-email" data-validate="email"/><div class="field-error"></div></div>
        </div>
        <div class="form-group"><label>Address</label><textarea id="c-address"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>City</label><input id="c-city"/></div>
          <div class="form-group"><label>State</label><select id="c-state">${states}</select></div>
          <div class="form-group"><label>Pincode</label><input id="c-pin"/></div>
          <div class="form-group"><label>Phone</label><input id="c-phone" data-validate="phone"/><div class="field-error"></div></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>GSTIN</label><input id="c-gstin" data-validate="gstin"/><div class="field-error"></div></div>
          <div class="form-group"><label>PAN</label><input id="c-pan" data-validate="pan"/><div class="field-error"></div></div>
          <div class="form-group"><label>CIN</label><input id="c-cin"/></div>
        </div>
        <div class="flex"><button class="btn btn-primary" id="next-1">Next</button></div>
      </div>
      <div class="card" id="step-2" style="display:none">
        <h3 class="section-title" style="margin-top:0">Financial Year</h3>
        <div class="form-group"><label>Financial Year</label><select id="fy-name"></select></div>
        <div class="flex"><button class="btn btn-outline" id="prev-2">Back</button><button class="btn btn-primary" id="next-2">Next</button></div>
      </div>
      <div class="card" id="step-3" style="display:none">
        <h3 class="section-title" style="margin-top:0">Opening Balances (optional)</h3>
        <p class="text-muted">You can add opening balances later from Ledger Master.</p>
        <div class="flex"><button class="btn btn-outline" id="prev-3">Back</button><button class="btn btn-primary" id="next-3">Next</button></div>
      </div>
      <div class="card" id="step-4" style="display:none">
        <h3 class="section-title" style="margin-top:0">Ready!</h3>
        <p>Review your details and finish. VyaparBooks will open the Dashboard with a Tally-style Chart of Accounts and GST rates.</p>
        <div id="summary"></div>
        <div class="flex"><button class="btn btn-outline" id="prev-4">Back</button><button class="btn btn-success" id="finish">Finish Setup</button><div class="loader" id="cs-loader"></div></div>
      </div>`;
  },
  init(el) {
    const states = {};
    VB.states.forEach((s) => states[s.code] = s.name);
    const $ = (id) => el.querySelector('#' + id);
    let current = 1;
    const fySel = $('fy-name');
    const year = new Date().getFullYear();
    const fyOptions = [];
    for (let i = -2; i <= 2; i++) fyOptions.push(`${year + i}-${String((year + i + 1) % 100).padStart(2, '0')}`);
    fySel.innerHTML = fyOptions.map((y) => `<option value="${y}">${y}</option>`).join('');
    const r = VB.financialYear.fyRange(fySel.value);

    function show(step) {
      current = step;
      el.querySelectorAll('.card[id^=step-]').forEach((c) => c.style.display = 'none');
      el.querySelector('#step-' + step).style.display = '';
      el.querySelectorAll('.step').forEach((s) => {
        s.classList.toggle('active', Number(s.dataset.step) === step);
        s.classList.toggle('done', Number(s.dataset.step) < step);
      });
      if (step === 4) {
        const c = {
          name: $('c-name').value, email: $('c-email').value, address: $('c-address').value,
          city: $('c-city').value, state: $('c-state').selectedOptions[0] ? $('c-state').selectedOptions[0].text : '',
          pincode: $('c-pin').value, phone: $('c-phone').value, gstin: $('c-gstin').value, pan: $('c-pan').value,
        };
        $('summary').innerHTML = `<div class="grid grid-2">
          <div><span class="text-muted">Name</span><div class="font-bold">${VB.esc(c.name)}</div></div>
          <div><span class="text-muted">FY</span><div class="font-bold">${VB.esc(fySel.value)}</div></div>
          <div><span class="text-muted">GSTIN</span><div class="font-bold">${VB.esc(c.gstin)}</div></div>
          <div><span class="text-muted">State</span><div class="font-bold">${VB.esc(c.state)}</div></div>
        </div>`;
      }
    }
    $('next-1').addEventListener('click', () => {
      if (!VB.validator.validate($('step-1'), {})) return;
      show(2);
    });
    $('prev-2').addEventListener('click', () => show(1));
    $('next-2').addEventListener('click', () => show(3));
    $('prev-3').addEventListener('click', () => show(2));
    $('next-3').addEventListener('click', async () => {
      const range = VB.financialYear.fyRange(fySel.value);
      show(4);
    });
    $('prev-4').addEventListener('click', () => show(3));
    $('finish').addEventListener('click', async () => {
      const loader = $('cs-loader'); loader.classList.add('show');
      try {
        const range = VB.financialYear.fyRange(fySel.value);
        await VB.invoke('app', 'saveCompany', {
          name: $('c-name').value.trim(),
          email: $('c-email').value.trim(),
          address: $('c-address').value,
          city: $('c-city').value,
          state_code: $('c-state').value,
          state: $('c-state').selectedOptions[0] ? $('c-state').selectedOptions[0].text : '',
          pincode: $('c-pin').value,
          phone: $('c-phone').value.trim(),
          gstin: $('c-gstin').value.trim().toUpperCase(),
          pan: $('c-pan').value.trim().toUpperCase(),
          cin: $('c-cin').value.trim(),
          financial_year_start: '04',
          currency: 'INR',
        });
        await VB.invoke('app', 'createFinancialYear', { name: fySel.value, start: range.start, end: range.end });
        const years = await VB.invoke('app', 'listFinancialYears');
        const created = years.find((y) => y.fy_name === fySel.value);
        if (created) await VB.invoke('app', 'setActiveFY', { id: created.id });
        VB.toast.success('Company setup complete.');
        location.hash = '#dashboard';
        location.reload();
      } catch (e) {
        VB.toast.error(e.message);
      } finally { loader.classList.remove('show'); }
    });
    show(1);
  },
});
