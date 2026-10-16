/* Ahava · site scripts. Progressive enhancement only:
   without JavaScript every link, page and form still works. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header shadow on scroll ---------- */
  const header = $('.site-header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Services dropdown (desktop) ---------- */
  $$('[data-menu-trigger]').forEach(link => {
    const menu = link.nextElementSibling;
    if (!menu) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = link.textContent;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', menu.id);
    btn.insertAdjacentHTML('beforeend', '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>');
    link.replaceWith(btn);
    const item = btn.parentElement;
    const set = (open) => { btn.setAttribute('aria-expanded', String(open)); menu.hidden = !open; };
    btn.addEventListener('click', () => set(menu.hidden));
    item.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
    item.addEventListener('focusout', e => { if (!item.contains(e.relatedTarget)) set(false); });
    document.addEventListener('click', e => { if (!item.contains(e.target)) set(false); });
  });

  /* ---------- Mobile menu (native <dialog>: focus trap + Esc built in) ---------- */
  const dlg = $('#mmenu');
  const opener = $('[data-mmenu-open]');
  if (dlg && opener && typeof dlg.showModal === 'function') {
    opener.setAttribute('role', 'button');
    opener.setAttribute('aria-haspopup', 'dialog');
    opener.addEventListener('click', e => { e.preventDefault(); dlg.showModal(); document.body.style.overflow = 'hidden'; });
    $('[data-mmenu-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('close', () => { document.body.style.overflow = ''; opener.focus(); });
    $$('a', dlg).forEach(a => a.addEventListener('click', () => dlg.close()));
  }


  /* ---------- mobile bar: appears after the hero ---------- */
  const mbar = $('.mbar'), hero = $('.hero');
  if (mbar) {
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => mbar.classList.toggle('is-on', !e.isIntersecting), { rootMargin: '-40% 0px 0px 0px' }).observe(hero);
    } else mbar.classList.add('is-on');
  }

  /* ---------- year ---------- */
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- forms: live validation + AJAX send (falls back to normal POST) ---------- */
  const T = (s) => (window.ahavaT ? window.ahavaT(s) : s);
  const isContact = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.replace(/\D/g, '').length >= 7;
  $$('form[data-form]').forEach(form => {
    const page = form.querySelector('input[name=page]'); if (page) page.value = location.pathname;
    const checks = {
      name: el => el.value.trim().length > 1,
      contact: el => isContact(el.value.trim()),
      email: el => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()),
      org: el => el.value.trim().length > 1,
    };
    const fields = $$('input[required],textarea[required]', form);
    const validate = (el) => {
      const ok = (checks[el.name] || (x => x.value.trim() !== ''))(el);
      el.setAttribute('aria-invalid', String(!ok));
      const err = form.querySelector('#' + el.id + '-err'); if (err) err.hidden = ok;
      return ok;
    };
    fields.forEach(el => {
      el.addEventListener('blur', () => { if (el.value) validate(el); });
      el.addEventListener('input', () => { if (el.getAttribute('aria-invalid') === 'true') validate(el); });
    });
    const status = $('.form__status', form), btn = $('[type=submit]', form);
    form.addEventListener('submit', async (e) => {
      const bad = fields.filter(el => !validate(el));
      if (bad.length) { e.preventDefault(); bad[0].focus(); return; }
      if (/X{6,}/.test(form.action)) {
        e.preventDefault();
        status.className = 'form__status is-err';
        status.textContent = T('This demo form is not connected yet. Please call or send a WhatsApp message.');
        return;
      }
      if (!window.fetch) return;
      e.preventDefault();
      btn.setAttribute('aria-busy', 'true'); const label = btn.textContent; btn.textContent = T('Sending…');
      try {
        const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error(r.status);
        form.reset();
        status.className = 'form__status is-ok';
        status.textContent = T('Thank you! Dr. Arnaud will contact you soon.');
        if (window.ahavaTrack) window.ahavaTrack('form_sent');
      } catch (err) {
        status.className = 'form__status is-err';
        status.textContent = T('We could not send your request. Please call or send a WhatsApp message.');
      } finally { btn.removeAttribute('aria-busy'); btn.textContent = label; }
    });
  });


  /* ---------- quiz: one question per screen, answers never leave the device ---------- */
  const quiz = $('[data-quiz]');
  if (quiz) {
    const MAP = JSON.parse(($('#quiz-map') || {}).textContent || '{}');
    const steps = $$('.quiz__step', quiz), bar = $('.quiz__bar span', quiz), nav = $('[data-nav]', quiz);
    const scr = k => $(`[data-screen="${k}"]`, quiz);
    const form = $('[data-quiz-form]', quiz);
    let i = -1;
    const intro = scr('intro');
    // The intro keeps the page's <h1> in the document (visually hidden) while the questions are on screen.
    const hideAll = () => { $$('[data-screen]', quiz).forEach(s => { if (s === intro) s.classList.add('is-collapsed'); else s.hidden = true; }); steps.forEach(s => s.hidden = true); };
    const showIntro = () => { hideAll(); intro.classList.remove('is-collapsed'); };
    const progress = (n) => { if (bar) bar.style.width = (n / steps.length * 100) + '%'; };
    const show = (n) => {
      hideAll(); i = n; steps[n].hidden = false; nav.hidden = false; progress(n);
      const lg = $('legend', steps[n]); lg && lg.focus({ preventScroll: true });
      quiz.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    };
    const val = k => { const c = $(`input[name="${k}"]:checked`, form); return c ? c.value : ''; };
    const result = () => {
      const who = val('who'), hard = val('hard');
      let key = 'individual';
      if (who === 'org') key = 'org';
      else if (hard === 'gaming') key = 'gaming';
      else if (hard === 'trauma') key = 'trauma';
      else if (['marriage', 'teen', 'family'].includes(who)) key = who;
      const [href, name, text] = MAP[key] || MAP.individual;
      hideAll(); nav.hidden = true; progress(steps.length);
      const r = scr('result');
      $('[data-r-title]', r).textContent = T(name);
      $('[data-r-text]', r).textContent = T(text);
      const extra = $('[data-r-extra]', r);
      extra.hidden = val('long') !== 'year';
      extra.textContent = T('You’ve carried this for a long time. You don’t have to keep carrying it alone.');
      const link = $('[data-r-link]', r); link.href = href; link.textContent = T(key === 'org' ? 'See workshop topics' : 'Learn how this works');
      const how = { inperson: 'In person', online: 'Online', unsure: 'Not sure yet' }[val('how')] || '';
      const lang = val('lang') === 'pt' ? 'Português' : 'English';
      const summary = `Recommended: ${name} · Meeting: ${how} · Language: ${lang}`;
      $$('[data-quiz-result]').forEach(h => h.value = summary);
      $$('select[name=topic]').forEach(sel => { [...sel.options].forEach(o => { if (o.text === name || o.value === name) sel.value = o.value || o.text; }); });
      const wa = $('[data-r-wa]', r);
      let tpl = T('WA_QUIZ'); if (tpl === 'WA_QUIZ') tpl = "Hi Dr. Arnaud, I'd like a free 15-minute call about {s} ({h}, {l}).";
      if (wa) wa.href = wa.href.split('?')[0] + '?text=' + encodeURIComponent(tpl.replace('{s}', T(name).toLowerCase()).replace('{h}', T(how).toLowerCase()).replace('{l}', lang));
      r.hidden = false; r.focus({ preventScroll: true });
      if (window.ahavaTrack) window.ahavaTrack('quiz_done');
    };
    const next = () => {
      if (i + 1 < steps.length) show(i + 1); else result();
    };
    form.addEventListener('submit', e => e.preventDefault());
    $('[data-start]', quiz).addEventListener('click', () => { show(0); if (window.ahavaTrack) window.ahavaTrack('quiz_start'); });
    steps.forEach(st => $$('input', st).forEach(inp => {
      inp.addEventListener('click', () => setTimeout(next, reduce ? 0 : 260));
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.checked = true; next(); } });
    }));
    $('[data-prev]', quiz).addEventListener('click', () => {
      if (i > 0) show(i - 1); else { showIntro(); nav.hidden = true; progress(0); }
    });
    $('[data-restart]', quiz).addEventListener('click', () => { form.reset(); showIntro(); nav.hidden = true; progress(0); $('[data-start]', quiz).focus(); });
    $('[data-r-book]', quiz).addEventListener('click', e => {
      const href = e.currentTarget.getAttribute('href');
      if (href.startsWith('#')) { e.preventDefault(); const n = $('#contact-name'); if (n) { n.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); n.focus({ preventScroll: true }); } }
    });
  }


  /* ---------- Phase 5: scroll reveals + icons that draw ---------- */
  if (!reduce) {
    const REVEAL = ['.section__head', '.help-grid', '.steps', '.faith__cols', '.meet__copy', '.topics', '.faq__list',
                    '.contact__ways', '.signs', '.hcards', '.mini-steps', '.details', '.related__list', '.footer__grid'];
    const groups = $$(REVEAL.join(',')).filter(el => !el.closest('.hero, .quiz'));
    groups.forEach(el => el.setAttribute('data-reveal', ''));
    const scrollDriven = CSS.supports && CSS.supports('animation-timeline: view()');
    if (!scrollDriven && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }),
        { rootMargin: '0px 0px -10% 0px' });
      groups.forEach(el => io.observe(el));
    } else if (!scrollDriven) groups.forEach(el => el.classList.add('is-in'));

    // Icons draw themselves once, when their group first comes into view (Web Animations API).
    const draw = (svg, delay) => $$('path, circle, rect', svg).forEach(sh => {
      if (!sh.getTotalLength || sh.getAttribute('fill') && sh.getAttribute('fill') !== 'none') return;
      const len = sh.getTotalLength(); if (!len) return;
      sh.style.strokeDasharray = len;
      sh.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 800, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' })
        .finished.then(() => { sh.style.strokeDasharray = ''; }).catch(() => {});
    });
    const iconGroups = $$('.help-grid, .contact__ways');
    if ('IntersectionObserver' in window && iconGroups.length) {
      const io2 = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return; io2.unobserve(e.target);
        $$('.help-card__ic svg, .way__ic svg', e.target).forEach((svg, k) => draw(svg, 120 + k * 90));
      }), { rootMargin: '0px 0px -15% 0px' });
      iconGroups.forEach(g => io2.observe(g));
    }
  }

  /* ---------- conversion events: call, whatsapp, book, quiz_start, quiz_done, form_sent ----------
     Cookieless GoatCounter when configured; does nothing otherwise. */
  window.ahavaTrack = window.ahavaTrack || function (name) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'event-' + name, title: name, event: true }); } catch (e) {}
  };
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-track]');
    if (el && window.ahavaTrack) window.ahavaTrack(el.dataset.track);
  });
})();
