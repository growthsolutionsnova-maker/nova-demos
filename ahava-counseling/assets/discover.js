/* Ahava · /discover/ "Find your path".
   Answers stay in this browser. Only first name, email, path, meeting preference and language are sent. */
(() => {
  const root = document.querySelector('[data-discover]');
  if (!root) return;
  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = s => (window.ahavaT ? window.ahavaT(s) : s);
  const track = n => { if (window.ahavaTrack) window.ahavaTrack(n); };

  const steps = $$('.dq'), segs = $$('.disc__bar span'), nav = $('[data-dnav]');
  const next = $('[data-next]'), prev = $('[data-prev]');
  const intro = $('[data-screen="intro"]'), result = $('[data-screen="result"]');
  const PATHS = ['career', 'relationships', 'growth', 'healing'];
  let i = -1, dir = 1;

  const answered = st => {
    const t = st.dataset.type;
    if (t === 'chips' || t === 'range') return true;
    return !!$('input:checked', st);
  };
  const progress = n => segs.forEach((s, k) => { s.classList.toggle('is-done', k < n); s.classList.toggle('is-now', k === n); });
  const setNext = () => {
    const st = steps[i]; if (!st) return;
    const t = st.dataset.type, ok = answered(st);
    next.disabled = !ok;
    next.firstChild.textContent = (t === 'chips' && !$('input:checked', st)) ? T('Skip') + ' ' : (i === steps.length - 1 ? T('See my path') + ' ' : T('Next') + ' ');
  };
  const show = n => {
    dir = n > i ? 1 : -1;
    steps.forEach(s => { s.hidden = true; s.classList.remove('is-in', 'is-back'); });
    intro.classList.add('is-collapsed'); result.hidden = true;
    i = n; const st = steps[n]; st.hidden = false; nav.hidden = false;
    if (!reduce) { void st.offsetWidth; st.classList.add(dir > 0 ? 'is-in' : 'is-back'); }
    progress(n); setNext();
    const lg = $('legend', st); if (lg) lg.focus({ preventScroll: true });
    root.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  };

  const scores = () => {
    const sc = { career: 0, relationships: 0, growth: 0, healing: 0 };
    $$('input:checked').forEach(inp => (inp.dataset.w || '').split(',').filter(Boolean).forEach(p => {
      const [k, v] = p.split(':'); sc[k] += Number(v);
    }));
    const impact = Number(($('#impact') || {}).value || 5);
    if (impact >= 7) sc.healing += 1;
    return sc;
  };

  const showResult = () => {
    const sc = scores();
    const first = ($('input[name="start"]:checked') || {}).value;
    const top = PATHS.slice().sort((a, b) => (sc[b] - sc[a]) || ((b === first) - (a === first)))[0];
    steps.forEach(s => s.hidden = true); nav.hidden = true; progress(steps.length);
    $$('[data-path]', result).forEach(el => el.hidden = el.dataset.path !== top);
    const max = Math.max(1, ...PATHS.map(k => sc[k]));
    $$('.dbar').forEach(b => {
      const k = b.dataset.bar, pct = Math.round(sc[k] / max * 100);
      b.classList.toggle('is-top', k === top);
      const fill = $('.dbar__fill', b); fill.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = Math.max(6, pct) + '%'; }));
    });
    const style = ($('input[name="style"]:checked') || {}).value;
    $$('[data-style]', result).forEach(el => el.hidden = el.dataset.style !== style);
    const f = $('[data-guide-form]');
    f.elements.path.value = top;
    f.elements.meet.value = ($('input[name="meet"]:checked') || {}).value || '';
    f.elements.lang.value = (document.documentElement.lang || 'en').startsWith('pt') ? 'pt' : 'en';
    result.hidden = false; result.focus({ preventScroll: true });
    root.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    track('discover_done_' + top);
  };

  // ---------- wiring ----------
  $('[data-start]').addEventListener('click', () => { show(0); track('discover_start'); });
  next.addEventListener('click', () => { if (next.disabled) return; i + 1 < steps.length ? show(i + 1) : showResult(); });
  prev.addEventListener('click', () => {
    if (i > 0) return show(i - 1);
    steps.forEach(s => s.hidden = true); nav.hidden = true; intro.classList.remove('is-collapsed'); progress(-1);
    $('[data-start]').focus();
  });
  steps.forEach(st => {
    const t = st.dataset.type;
    $$('input', st).forEach(inp => {
      inp.addEventListener('change', () => {
        setNext();
        if ((t === 'cards' || t === 'faces') && inp.checked) setTimeout(() => { if (steps[i] === st) next.click(); }, reduce ? 0 : 380);
      });
    });
  });
  const rng = $('#impact'), out = $('#impact-out');
  if (rng) {
    const paint = () => { out.textContent = rng.value; rng.style.setProperty('--p', ((rng.value - 1) / 9 * 100) + '%'); rng.setAttribute('aria-valuetext', rng.value + ' / 10'); };
    rng.addEventListener('input', paint); paint();
  }
  $('[data-restart]').addEventListener('click', () => {
    $('[data-dq-form]').reset(); if (rng) rng.dispatchEvent(new Event('input'));
    result.hidden = true; intro.classList.remove('is-collapsed'); progress(-1);
    $('[data-guide-done]').hidden = true; $('[data-guide-form-wrap]').hidden = false;
    $('[data-start]').focus(); root.scrollIntoView({ block: 'start' });
  });
  progress(-1);

  // ---------- guide form ----------
  const form = $('[data-guide-form]'), status = $('.form__status', form);
  const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const checks = {
    name: el => el.value.trim().length > 1,
    email: el => okEmail(el.value),
    consent: el => el.checked,
  };
  const errFor = el => document.getElementById(el.name === 'consent' ? 'g-consent-err' : el.id + '-err');
  const validate = el => { const ok = checks[el.name](el); el.setAttribute('aria-invalid', String(!ok)); const e = errFor(el); if (e) e.hidden = ok; return ok; };
  const fields = [form.elements.name, form.elements.email, form.elements.consent];
  fields.forEach(el => el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => { if (el.type === 'checkbox' || el.value) validate(el); }));
  const done = () => {
    $('[data-guide-form-wrap]').hidden = true; const d = $('[data-guide-done]'); d.hidden = false; d.focus();
    track('guide_signup');
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = fields.filter(el => !validate(el));
    if (bad.length) { bad[0].focus(); return; }
    if (root.dataset.demo === 'true') {
      done();
      const n = document.createElement('p'); n.className = 'dguide__demo';
      n.textContent = T('Demo: emails are not connected yet, so nothing was sent.');
      $('[data-guide-done]').appendChild(n);
      return;
    }
    const btn = $('[type=submit]', form); btn.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      done();
    } catch (err) {
      status.className = 'form__status is-err';
      status.textContent = T('We could not send your guide. Please try again, or call or send a WhatsApp message.');
    } finally { btn.removeAttribute('aria-busy'); }
  });
})();
