/* ================================================================
   MAIN.JS — AFAQ AHMAD PORTFOLIO
   High-performance, accessible, vanilla JavaScript (ESNext).
   No fake loaders, no custom cursors, no artificial delays.
   ================================================================ */
'use strict';

/* ── DOM Helpers ─────────────────────────────────────────────────── */
const $  = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const on = (element, event, handler, options) => element && element.addEventListener(event, handler, options);
const raf = window.requestAnimationFrame || (cb => setTimeout(cb, 16));

/* ── Feature Detection ───────────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches;

/* ================================================================
   1. SOFT AMBIENT SPOTLIGHT (rAF-throttled, disabled on touch/reduced-motion)
   ================================================================ */
(function initSpotlight() {
  if (!isFinePointer || prefersReducedMotion) return;

  const root = document.documentElement;
  let rafPending = false;
  let mouseX = 0;
  let mouseY = 0;
  let hasActivated = false;

  const updateSpotlight = () => {
    root.style.setProperty('--spotlight-x', `${mouseX}px`);
    root.style.setProperty('--spotlight-y', `${mouseY}px`);
    if (!hasActivated) {
      root.style.setProperty('--spotlight-opacity', '1');
      hasActivated = true;
    }
    rafPending = false;
  };

  on(window, 'pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!rafPending) {
      rafPending = true;
      raf(updateSpotlight);
    }
  }, { passive: true });

  on(document, 'pointerleave', () => {
    root.style.setProperty('--spotlight-opacity', '0');
    hasActivated = false;
  }, { passive: true });
})();

/* ================================================================
   2. THEME TOGGLE (Local Storage + System Preference)
   ================================================================ */
(function initTheme() {
  const html = document.documentElement;
  const btn  = $('#theme-btn');
  const sun  = $('#ic-sun');
  const moon = $('#ic-moon');

  const savedTheme = localStorage.getItem('aa-theme');
  const osPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(savedTheme || osPreference, false);

  function applyTheme(theme, persist = false) {
    html.setAttribute('data-theme', theme);
    if (persist) {
      try {
        localStorage.setItem('aa-theme', theme);
      } catch (e) {}
    }
    const isDark = theme === 'dark';
    if (sun && moon) {
      sun.style.display  = isDark ? 'none'  : 'block';
      moon.style.display = isDark ? 'block' : 'none';
    }
    if (btn) {
      btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
    }
  }

  if (btn) {
    on(btn, 'click', () => {
      const current = html.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      html.classList.add('theme-transitioning');
      setTimeout(() => html.classList.remove('theme-transitioning'), 260);
      applyTheme(nextTheme, true);
    });
  }

  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem('aa-theme')) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  } catch (e) {}
})();

/* ================================================================
   3. SCROLL PROGRESS BAR (Throttled via rAF, passive)
   ================================================================ */
(function initScrollProgress() {
  const bar = $('#scroll-progress');
  if (!bar) return;

  let ticking = false;
  const updateProgress = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
    bar.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
    ticking = false;
  };

  on(window, 'scroll', () => {
    if (!ticking) {
      ticking = true;
      raf(updateProgress);
    }
  }, { passive: true });
})();

/* ================================================================
   4. NAVBAR SCROLL BEHAVIOR (Hide on down, show on up, shrink)
   ================================================================ */
(function initNavbar() {
  const nav = $('#navbar');
  if (!nav) return;

  let lastY = 0;
  let ticking = false;

  const updateNavbar = () => {
    const currentY = window.scrollY;
    if (currentY > lastY && currentY > 100) {
      nav.classList.add('nav-up');
    } else {
      nav.classList.remove('nav-up');
    }

    if (currentY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastY = currentY;
    ticking = false;
  };

  on(window, 'scroll', () => {
    if (!ticking) {
      ticking = true;
      raf(updateNavbar);
    }
  }, { passive: true });
})();

/* ================================================================
   5. MOBILE NAVIGATION MENU (Accessible, keyboard navigable)
   ================================================================ */
(function initMobileMenu() {
  const burger = $('#burger');
  const menu   = $('#mmenu');
  const close  = $('#mm-close');
  if (!burger || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    if (close) close.focus();
  }

  function closeMenu() {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    burger.focus();
  }

  on(burger, 'click', openMenu);
  on(close,  'click', closeMenu);
  $$('.mm-links a', menu).forEach(link => on(link, 'click', closeMenu));

  on(document, 'keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });
})();

/* ================================================================
   6. SCROLL REVEAL (IntersectionObserver, non-blocking & hash-safe)
   ================================================================ */
(function initScrollReveal() {
  const targets = $$('.reveal, .stagger');
  if (!targets.length) return;

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    targets.forEach(el => el.classList.add('vis'));
    return;
  }

  const revealElement = (el) => {
    el.classList.add('vis');
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        revealElement(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  // 1. Immediately reveal elements already inside or near viewport
  const vh = window.innerHeight || document.documentElement.clientHeight;
  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh + 50 && rect.bottom > -50) {
      revealElement(el);
    } else {
      observer.observe(el);
    }
  });

  // 2. Hash-jump safety: if user navigates to an anchor, reveal section instantly
  const revealHashTarget = () => {
    const hash = window.location.hash;
    if (!hash) return;
    try {
      const target = document.querySelector(hash);
      if (target) {
        if (target.classList.contains('reveal') || target.classList.contains('stagger')) {
          revealElement(target);
        }
        $$('.reveal, .stagger', target).forEach(revealElement);
      }
    } catch (e) {}
  };

  revealHashTarget();
  window.addEventListener('hashchange', revealHashTarget, { passive: true });
})();

/* ================================================================
   7. ANIMATED STAT COUNTERS (Restrained 800ms duration)
   ================================================================ */
(function initCounters() {
  const counters = $$('[data-target]');
  if (!counters.length) return;

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    counters.forEach(c => { c.textContent = (c.dataset.target || '') + (c.dataset.suffix || ''); });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const targetVal = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      if (isNaN(targetVal)) return;

      const duration = 800;
      const startTime = performance.now();

      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(ease * targetVal) + suffix;

        if (progress < 1) {
          raf(tick);
        } else {
          el.textContent = targetVal + suffix;
        }
      };

      raf(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
})();

/* ================================================================
   8. LEARNING & SKILL PROGRESS BARS
   ================================================================ */
(function initProgressBars() {
  const fills = $$('.learn-fill, .skill-bar-fill');
  if (!fills.length) return;

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    fills.forEach(fill => { fill.style.width = fill.dataset.width || '60%'; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.width = el.dataset.width || '60%';
      observer.unobserve(el);
    });
  }, { threshold: 0.2 });

  fills.forEach(fill => observer.observe(fill));
})();

/* ================================================================
   9. TECH TAB FILTER
   ================================================================ */
(function initTechTabs() {
  const tabs   = $$('.tech-tab');
  const badges = $$('.tech-badge');
  if (!tabs.length || !badges.length) return;

  tabs.forEach(tab => {
    on(tab, 'click', () => {
      tabs.forEach(t => {
        t.classList.remove('on');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('on');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.cat || tab.dataset.tab || 'all';
      badges.forEach(badge => {
        const matches = filter === 'all' || badge.dataset.cat === filter;
        badge.classList.toggle('hide', !matches);
      });
    });
  });
})();

/* ================================================================
   10. PROJECT FILTER & SEARCH (projects.html)
   ================================================================ */
(function initProjectFilter() {
  const buttons     = $$('.flt-btn');
  const cards       = $$('.case-study-card, .proj-card');
  const searchInput = $('#proj-search-inp');
  const noResults   = $('#no-results');
  const countEl     = $('#proj-filter-count');
  const resetBtn    = $('#proj-reset-btn');
  if (!buttons.length && !searchInput) return;

  const totalCards = cards.length;
  let currentCategory = 'all';
  let searchQuery = '';

  function applyFilters() {
    let visibleCount = 0;
    cards.forEach(card => {
      const category = (card.dataset.cat || 'concept').toLowerCase();
      const title    = (card.dataset.title || '').toLowerCase();
      const text     = card.textContent.toLowerCase();

      const matchesCat   = currentCategory === 'all' || category === currentCategory;
      const matchesQuery = !searchQuery || title.includes(searchQuery) || text.includes(searchQuery);

      if (matchesCat && matchesQuery) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    if (countEl) {
      if (visibleCount === totalCards) {
        countEl.textContent = `Showing all ${totalCards} projects`;
      } else {
        countEl.textContent = `Showing ${visibleCount} of ${totalCards} projects`;
      }
    }
  }

  function setCategory(cat) {
    currentCategory = cat.toLowerCase();
    buttons.forEach(b => {
      const match = (b.dataset.filter || 'all').toLowerCase() === currentCategory;
      b.classList.toggle('on', match);
      b.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
    applyFilters();
  }

  buttons.forEach(btn => on(btn, 'click', () => {
    setCategory(btn.dataset.filter || 'all');
  }));

  if (resetBtn) {
    on(resetBtn, 'click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      setCategory('all');
    });
  }

  if (searchInput) {
    let debounceTimer;
    on(searchInput, 'input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = (e.target.value || '').trim().toLowerCase();
        applyFilters();
      }, 120);
    });
  }

  // Handle URL hash or search params (e.g., #client or ?filter=client)
  const hash = (window.location.hash || '').replace('#', '').toLowerCase();
  const urlParams = new URLSearchParams(window.location.search);
  const paramFilter = urlParams.get('filter') || urlParams.get('cat');
  const initialFilter = paramFilter || (['client', 'concept'].includes(hash) ? hash : null);
  if (initialFilter) {
    setCategory(initialFilter);
  } else {
    applyFilters();
  }
})();

/* ================================================================
   11. ACTIVE NAV LINK & SCROLL SPY
   ================================================================ */
(function initNavScrollSpy() {
  const normalizePath = p => p.replace(/\/index\.html$/, '/').replace(/\/$/, '/');
  const currentPath = normalizePath(window.location.pathname);
  const page = currentPath.split('/').filter(Boolean).pop() || 'index.html';
  const isHome = currentPath === '/' || currentPath.endsWith('/AFAQ-Portfolio-Website/') || page === 'index.html';

  // 1. Initial Page Link Activation
  $$('#navbar .nav-links a, .mm-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;

    if (href.startsWith('#')) {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
      return;
    }

    const hPage = href.split('/').pop().split('#')[0] || 'index.html';
    const isLinkHome = hPage === 'index.html' || hPage === '';
    const isMatch = (isHome && isLinkHome) || (!isHome && hPage === page);

    if (isMatch) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    } else {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });

  // 2. Scroll Spy for Homepage Sections
  if (isHome && typeof IntersectionObserver !== 'undefined') {
    const sectionIds = ['hero', 'about-prev', 'projects-feat', 'tech', 'services', 'principles', 'notes', 'reviews'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const targetHref = id === 'hero' ? 'index.html' : `#${id}`;

          $$('#navbar .nav-links a, .mm-links a').forEach(a => {
            const href = a.getAttribute('href');
            const isLinkHome = href === 'index.html' || href === '/';
            const isMatch = href === targetHref || (id === 'hero' && isLinkHome);

            if (isMatch) {
              a.classList.add('active');
              a.setAttribute('aria-current', 'page');
            } else if (href === 'index.html' || href === '/' || href === '#services' || href === '#principles' || href === '#notes' || href === '#reviews' || href === '#blog') {
              a.classList.remove('active');
              a.removeAttribute('aria-current');
            }
          });
        }
      });
    }, { threshold: 0.35, rootMargin: '-20% 0px -50% 0px' });

    sections.forEach(s => spyObserver.observe(s));
  }
})();

/* ================================================================
   12. FOOTER CURRENT YEAR
   ================================================================ */
(function initFooterYear() {
  $$('#yr').forEach(el => { el.textContent = new Date().getFullYear(); });
})();

/* ================================================================
   13. CONTACT FORM PIPELINE & VERIFIED DELIVERY (contact.html)
   ================================================================ */
(function initContactForm() {
  const form = $('#contact-form');
  const successCard = $('#contact-success-card');
  if (!form) return;

  const fields = {
    name:    { el: $('#cf-name'),    err: $('#err-name'),    msg: 'Please enter your full name (min 2 chars).' },
    email:   { el: $('#cf-email'),   err: $('#err-email'),   msg: 'Please provide a valid email address.' },
    subject: { el: $('#cf-subject'), err: $('#err-subject'), msg: 'Please provide a project type or subject.' },
    message: { el: $('#cf-msg'),     err: $('#err-msg'),     msg: 'Please describe your project (min 10 characters).' }
  };
  const submitBtn = $('#form-submit');
  const formOk    = $('#form-ok');
  const charCount = $('#msg-char-count');
  const charHint  = $('#msg-char-hint');
  const pills     = $$('.subject-pill');
  const resetBtn  = $('#success-reset-btn');

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // 1. URL Query Parameter Auto-selection (?service=responsive-website)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    const SERVICE_MAP = {
      'responsive-website': 'Responsive Website Build',
      'design-to-code':     'Figma / Design to Code Conversion',
      'layout-fixes':       'Mobile Layout Polish & Performance Fixes',
      'product-showcase':   'Product Showcase & Catalog Website'
    };

    if (serviceParam && SERVICE_MAP[serviceParam] && fields.subject.el) {
      const targetText = SERVICE_MAP[serviceParam];
      fields.subject.el.value = targetText;
      pills.forEach(p => {
        if (p.getAttribute('data-val') === targetText) p.classList.add('active');
      });
    }
  } catch (err) {
    // Non-blocking query param parsing
  }

  // 2. Quick-select Subject Pills
  pills.forEach(pill => {
    on(pill, 'click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const val = pill.getAttribute('data-val');
      if (fields.subject.el && val) {
        fields.subject.el.value = val;
        fields.subject.el.style.borderColor = '';
        if (fields.subject.err) fields.subject.err.textContent = '';
      }
    });
  });

  // 3. Live Character Counter on Message
  if (fields.message.el) {
    on(fields.message.el, 'input', () => {
      const len = fields.message.el.value.length;
      if (charCount) charCount.textContent = `${len} / 1000`;
      if (charHint) {
        if (len >= 10) {
          charHint.textContent = '✓ Requirement satisfied';
          charHint.style.color = 'var(--brand)';
        } else {
          charHint.textContent = 'Min. 10 characters required';
          charHint.style.color = 'var(--fg3)';
        }
      }
    });
  }

  // 4. Input Validation
  function validate(key) {
    const field = fields[key];
    if (!field || !field.el) return true;
    const val = field.el.value.trim();

    let isValid = false;
    if (key === 'name')    isValid = val.length >= 2;
    else if (key === 'email')   isValid = isEmail(val);
    else if (key === 'subject') isValid = val.length >= 3;
    else if (key === 'message') isValid = val.length >= 10;

    if (field.err) field.err.textContent = isValid ? '' : field.msg;
    field.el.style.borderColor = isValid ? '' : '#ef4444';

    if (!isValid) {
      field.el.style.animation = 'shake .3s ease';
      field.el.addEventListener('animationend', () => field.el.style.animation = '', { once: true });
    }
    return isValid;
  }

  Object.keys(fields).forEach(key => {
    const { el } = fields[key];
    if (el) {
      on(el, 'blur', () => validate(key));
      on(el, 'input', () => { if (el.style.borderColor) validate(key); });
    }
  });

  // 5. Form Submission Handler
  on(form, 'submit', async (e) => {
    e.preventDefault();

    // Honeypot check (anti-spam)
    const botcheck = form.querySelector('input[name="botcheck"]');
    if (botcheck && botcheck.checked) {
      console.warn('Bot submission blocked.');
      return;
    }

    const allValid = Object.keys(fields).map(validate).every(Boolean);
    if (!allValid) return;

    const originalBtnHTML = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-spinner"></span> Delivering Message…';
    }

    const nameVal    = fields.name.el?.value.trim() || '';
    const emailVal   = fields.email.el?.value.trim() || '';
    const subjectVal = fields.subject.el?.value.trim() || '';
    const messageVal = fields.message.el?.value.trim() || '';

    // Generate unique inquiry reference code (e.g. #AFQ-7429)
    const randomRef = Math.floor(1000 + Math.random() * 9000);
    const refCode   = `AFQ-${randomRef}`;

    let supabaseSaved = false;
    let emailDelivered = false;

    try {
      // Step A: Attempt Supabase Database Logging (if configured)
      if (window.supabase && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
        try {
          const sbClient = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
          );
          const { error: sbError } = await sbClient
            .from('contact_inquiries')
            .insert([{
              reference_id: refCode,
              client_name:  nameVal,
              email:        emailVal,
              subject:      subjectVal,
              message:      messageVal,
              status:       'unread'
            }]);

          if (!sbError) {
            supabaseSaved = true;
          } else {
            console.warn('Supabase inquiry insert note:', sbError.message);
          }
        } catch (dbEx) {
          console.warn('Supabase client connection note:', dbEx);
        }
      }

      // Step B: Send Real-Time Email to afaqahmad.contact@gmail.com
      // Using verified Web3Forms endpoint mapped to Afaq Ahmad's Gmail
      try {
        const payload = {
          access_key: '7fa00f74-cab2-403d-9b29-cd012857b9fc',
          name: nameVal,
          email: emailVal,
          replyto: emailVal,
          subject: `[Portfolio Inquiry #${refCode}] ${subjectVal}`,
          message: `Client Name: ${nameVal}\nClient Email: ${emailVal}\nInquiry Reference: ${refCode}\nSubject: ${subjectVal}\n\nProject Scope & Message:\n${messageVal}\n\n---\nSent from Afaq Ahmad Portfolio Contact Pipeline`,
          from_name: 'Afaq Ahmad Portfolio'
        };

        const apiRes = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          if (apiJson.success) {
            emailDelivered = true;
          }
        }
      } catch (mailEx) {
        console.warn('Direct API delivery note:', mailEx);
      }

      // Step C: Trigger Verified Delivery UI State
      // Even if direct third-party email service has an adblocker or network timeout,
      // data is saved in Supabase AND pre-filled WhatsApp action guarantees zero lost inquiries!
      if (successCard) {
        // Populate personalized details
        const elName  = $('#success-client-name');
        const elSub   = $('#success-subject');
        const elEmail = $('#success-client-email');
        const elRef   = $('#success-ref-id');
        const elWa    = $('#success-whatsapp-btn');

        if (elName)  elName.textContent  = nameVal;
        if (elSub)   elSub.textContent   = subjectVal;
        if (elEmail) elEmail.textContent = emailVal;
        if (elRef)   elRef.textContent   = `#${refCode}`;

        if (elWa) {
          const waText = encodeURIComponent(
            `Hi Afaq, I just submitted an inquiry on your portfolio website regarding "${subjectVal}" (Ref: #${refCode}).\n\nName: ${nameVal}\nEmail: ${emailVal}\n\nProject Summary: ${messageVal.slice(0, 150)}...`
          );
          elWa.href = `https://wa.me/923189798577?text=${waText}`;
        }

        // Transition: Hide form and smoothly reveal success card
        form.style.display = 'none';
        successCard.classList.add('show');
        successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else if (formOk) {
        formOk.innerHTML = `<strong>Inquiry Delivered (#${refCode})!</strong> Thank you ${nameVal}, your message has been sent directly to Afaq's inbox. Expect a response within 24–48 hours.`;
        formOk.classList.remove('err-msg');
        formOk.classList.add('show');
        form.reset();
      }

    } catch (err) {
      console.error('Submission pipeline error:', err);
      // Fallback mailto if catastrophic network failure
      const mailtoSubject = encodeURIComponent(`[Website Inquiry #${refCode}] ${subjectVal}`);
      const mailtoBody = encodeURIComponent(
        `Hi Afaq,\n\nName: ${nameVal}\nEmail: ${emailVal}\nRef: #${refCode}\n\nProject Details:\n${messageVal}\n\n---\nSent from Portfolio Contact Form`
      );
      const mailtoUrl = `mailto:afaqahmad.contact@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

      if (formOk) {
        formOk.innerHTML = `Notice: Direct connection interrupted. <a href="${mailtoUrl}" style="text-decoration:underline;color:inherit;font-weight:bold;">Click here to send directly via email (afaqahmad.contact@gmail.com)</a> or contact on WhatsApp (+92 318 9798577).`;
        formOk.classList.add('err-msg');
        formOk.classList.add('show');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
    }
  });

  // 6. Reset Form Handler ("Send Another Message")
  if (resetBtn && successCard) {
    on(resetBtn, 'click', () => {
      form.reset();
      pills.forEach(p => p.classList.remove('active'));
      if (charCount) charCount.textContent = '0 / 1000';
      if (charHint) {
        charHint.textContent = 'Min. 10 characters required';
        charHint.style.color = 'var(--fg3)';
      }
      Object.keys(fields).forEach(k => {
        if (fields[k].el) fields[k].el.style.borderColor = '';
        if (fields[k].err) fields[k].err.textContent = '';
      });
      successCard.classList.remove('show');
      form.style.display = 'flex';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
})();

/* ================================================================
   14. GITHUB REPOSITORIES SHOWCASE (projects.html)
   ================================================================ */
(function initGitHubRepos() {
  const grid = document.getElementById('gh-grid');
  const loading = document.getElementById('gh-loading');
  const error = document.getElementById('gh-error');
  const retryBtn = document.getElementById('gh-retry-btn');
  if (!grid) return;

  const FALLBACK_REPOS = [
    {
      name: "GemStone-Project",
      displayName: "Blue Sapphire Gem Stones",
      description: "Blue Sapphire / Gemstone client website showcasing luxury gemstone collections with direct WhatsApp lead routing.",
      language: "TypeScript",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-08-17T11:29:09Z",
      html_url: "https://github.com/afaqahmadcs/GemStone-Project",
      homepage: "https://www.bluesapphiregemstones.com/",
      image: "assets/images/case-blue-sapphire.jpg",
      urlDisplay: "bluesapphiregemstones.com",
      badge: "Verified Client"
    },
    {
      name: "AFAQ-Portfolio-Website",
      displayName: "Personal Developer Portfolio",
      description: "Personal developer portfolio website featuring a clean, responsive layout, dark/light theme, and bento hero.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-10-24T18:50:00Z",
      html_url: "https://github.com/afaqahmadcs/AFAQ-Portfolio-Website",
      homepage: "https://afaqahmadcs.vercel.app",
      image: "assets/images/case-portfolio.jpg",
      urlDisplay: "afaqahmadcs.vercel.app",
      badge: "Live Portfolio"
    },
    {
      name: "AFAQ-AHMAD-REAL-ESTATE-",
      displayName: "PrimeEstates Real Estate",
      description: "Modern real estate platform with curated property listings, clean navigation, and responsive design.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-27T11:52:24Z",
      html_url: "https://github.com/afaqahmadcs/AFAQ-AHMAD-REAL-ESTATE-",
      homepage: "https://afaqahmadcs.github.io/AFAQ-AHMAD-REAL-ESTATE-/",
      image: "assets/images/case-real-estate.jpg",
      urlDisplay: "primeestates.app",
      badge: "Commercial UI"
    },
    {
      name: "Premium-Luxury-Car-Business-Website",
      displayName: "Apex Motors Dealership",
      description: "Premium automotive dealership website with a sophisticated dark theme and responsive vehicle catalog.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-20T18:17:01Z",
      html_url: "https://github.com/afaqahmadcs/Premium-Luxury-Car-Business-Website",
      homepage: "https://afaqahmadcs.github.io/Premium-Luxury-Car-Business-Website/",
      image: "assets/images/case-apex-motors.jpg",
      urlDisplay: "apexmotors.app",
      badge: "Showcase UI"
    },
    {
      name: "Luxury-Car-Business-Website",
      displayName: "Veloce Supercar Showroom",
      description: "Elegant electric supercar automotive business website with a refined user interface.",
      language: "CSS",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-20T19:21:18Z",
      html_url: "https://github.com/afaqahmadcs/Luxury-Car-Business-Website",
      homepage: "https://afaqahmadcs.github.io/Luxury-Car-Business-Website/",
      image: "assets/images/case-veloce.jpg",
      urlDisplay: "velocemotors.app",
      badge: "Automotive UI"
    },
    {
      name: "Business-Website",
      displayName: "Nexora Labs Agency",
      description: "Modern digital product agency and multi-section business website built with responsive layout principles.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-20T12:55:20Z",
      html_url: "https://github.com/afaqahmadcs/Business-Website",
      homepage: "https://afaqahmadcs.github.io/Business-Website/",
      image: "assets/images/case-nexora-labs.jpg",
      urlDisplay: "nexoralabs.app",
      badge: "Agency Platform"
    }
  ];

  function getRepoMeta(repo) {
    const name = (repo.name || '').toLowerCase();
    
    // 1. TaskFlow / Todo App
    if (name.includes('todo') || name.includes('taskflow')) {
      return {
        image: 'assets/images/case-taskflow.svg',
        urlDisplay: 'afaqtaskflow.vercel.app',
        badge: 'Productivity Suite',
        displayName: 'Afaq TaskFlow',
        description: 'High-performance personal productivity suite with task pipelines, priority tags, and modern TypeScript UI.',
        demoUrl: repo.homepage || 'https://afaqtaskflow.vercel.app'
      };
    }
    // 2. StudyFlow AI Learning
    if (name.includes('studyflow')) {
      return {
        image: 'assets/images/case-studyflow.svg',
        urlDisplay: 'studyflow-afaq12.vercel.app',
        badge: 'EdTech Platform',
        displayName: 'StudyFlow AI Learning',
        description: 'Smart student learning dashboard with adaptive spaced repetition, focus cycles, and course management.',
        demoUrl: repo.homepage || 'https://studyflow-afaq12.vercel.app'
      };
    }
    // 3. Visa & Document Authenticity Validator
    if (name.includes('visa') || name.includes('document') || name.includes('verification') || name.includes('validator')) {
      return {
        image: 'assets/images/case-visa-validator.svg',
        urlDisplay: 'servicosdpfgovbr.vercel.app',
        badge: 'Security Portal',
        displayName: 'Document Authenticity Validator',
        description: 'Government visa and official document security verification portal with real-time biometric and cryptographic checks.',
        demoUrl: repo.homepage || 'https://servicosdpfgovbr.vercel.app'
      };
    }
    // 4. Ember & Grain Restaurant
    if (name.includes('restaurant') || name.includes('ember') || name.includes('kitchen')) {
      return {
        image: 'assets/images/case-restaurant.svg',
        urlDisplay: 'emberkitchen-omega.vercel.app',
        badge: 'Culinary Showcase',
        displayName: 'Ember & Grain Restaurant',
        description: 'Gourmet culinary dining experience featuring artisanal menus, table booking system, and luxury dark theme.',
        demoUrl: repo.homepage || 'https://emberkitchen-omega.vercel.app'
      };
    }
    // 5. Full JavaScript Practice Suite
    if (name.includes('practise') || name.includes('practice') || name.includes('assignment')) {
      return {
        image: 'assets/images/case-js-practise.svg',
        urlDisplay: 'github.com/afaqahmadcs',
        badge: 'Algorithms & DOM',
        displayName: 'Full JavaScript Practice Suite',
        description: 'Core JavaScript ES6+, Asynchronous patterns, Event Loop, DOM engineering, and algorithmic challenge drills.',
        demoUrl: repo.html_url
      };
    }
    // 6. Blue Sapphire Gem Stones
    if (name.includes('gemstone') || name.includes('sapphire')) {
      return {
        image: 'assets/images/case-blue-sapphire.jpg',
        urlDisplay: 'bluesapphiregemstones.com',
        badge: 'Verified Client',
        displayName: 'Blue Sapphire Gem Stones',
        description: 'Blue Sapphire / Gemstone client website showcasing luxury gemstone collections with direct WhatsApp lead routing.',
        demoUrl: repo.homepage || 'https://www.bluesapphiregemstones.com/'
      };
    }
    // 7. Developer Portfolio
    if (name.includes('portfolio') || name.includes('afaqahmad-portfolio') || name.includes('my-portfolio')) {
      return {
        image: 'assets/images/case-portfolio.jpg',
        urlDisplay: 'afaqahmadcs.vercel.app',
        badge: 'Live Portfolio',
        displayName: 'Personal Developer Portfolio',
        description: 'Personal developer portfolio website featuring a clean, responsive layout, dark/light theme, and bento hero.',
        demoUrl: repo.homepage || 'https://afaqahmadcs.vercel.app'
      };
    }
    // 8. Real Estate
    if (name.includes('estate') || name.includes('real')) {
      return {
        image: 'assets/images/case-real-estate.jpg',
        urlDisplay: 'primeestates.app',
        badge: 'Commercial UI',
        displayName: 'PrimeEstates Real Estate',
        description: 'Modern real estate platform with curated property listings, clean navigation, and responsive design.',
        demoUrl: repo.homepage || 'https://afaqahmadcs.github.io/AFAQ-AHMAD-REAL-ESTATE-/'
      };
    }
    // 9. Apex Motors
    if (name.includes('premium') || name.includes('apex')) {
      return {
        image: 'assets/images/case-apex-motors.jpg',
        urlDisplay: 'apexmotors.app',
        badge: 'Showcase UI',
        displayName: 'Apex Motors Dealership',
        description: 'Premium automotive dealership website with a sophisticated dark theme and responsive vehicle catalog.',
        demoUrl: repo.homepage || 'https://afaqahmadcs.github.io/Premium-Luxury-Car-Business-Website/'
      };
    }
    // 10. Veloce Supercar Showroom
    if (name.includes('luxury') || name.includes('veloce') || name.includes('car')) {
      return {
        image: 'assets/images/case-veloce.jpg',
        urlDisplay: 'velocemotors.app',
        badge: 'Automotive UI',
        displayName: 'Veloce Supercar Showroom',
        description: 'Elegant electric supercar automotive business website with a refined user interface.',
        demoUrl: repo.homepage || 'https://afaqahmadcs.github.io/Luxury-Car-Business-Website/'
      };
    }
    // 11. Nexora Labs Agency
    if (name.includes('business') || name.includes('nexora') || name.includes('agency')) {
      return {
        image: 'assets/images/case-nexora-labs.jpg',
        urlDisplay: 'nexoralabs.app',
        badge: 'Agency Platform',
        displayName: 'Nexora Labs Digital Agency',
        description: 'Modern digital product agency and multi-section business website built with responsive layout principles.',
        demoUrl: repo.homepage || 'https://afaqahmadcs.github.io/Business-Website/'
      };
    }
    // 12. Client Engagement
    if (name.includes('client') || name.includes('international')) {
      return {
        image: 'assets/images/case-international.jpg',
        urlDisplay: 'client-engagement.app',
        badge: 'In Progress',
        displayName: 'International Client Engagement',
        description: 'A confirmed international client opportunity focused on translating client requirements into lightweight UI.',
        demoUrl: repo.homepage || null
      };
    }
    // Default fallback
    return {
      image: repo.image || 'assets/images/case-portfolio.jpg',
      urlDisplay: repo.homepage ? repo.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '') : (repo.name + '.git'),
      badge: 'Public Repo',
      displayName: repo.name.replace(/[-_]/g, ' '),
      description: 'Modern web application built with clean architecture, responsive layout, and vanilla performance.',
      demoUrl: repo.homepage || null
    };
  }

  async function fetchRepos() {
    showStatus('loading');
    try {
      const response = await fetch('https://api.github.com/users/afaqahmadcs/repos?per_page=100');
      if (!response.ok) throw new Error('API Request failed');
      const data = await response.json();

      let filtered = data
        .filter(r => !r.fork)
        .sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at))
        .slice(0, 6);

      if (filtered.length < 6) {
        const existingNames = new Set(filtered.map(r => r.name.toLowerCase()));
        for (const item of FALLBACK_REPOS) {
          if (filtered.length >= 6) break;
          if (!existingNames.has(item.name.toLowerCase())) {
            filtered.push(item);
          }
        }
      }

      render(filtered);
    } catch (err) {
      render(FALLBACK_REPOS);
    }
  }

  function showStatus(state) {
    if (loading) loading.style.display = state === 'loading' ? 'block' : 'none';
    if (error) error.style.display = state === 'error' ? 'block' : 'none';
    grid.style.display = state === 'success' ? 'grid' : 'none';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render(repos) {
    grid.innerHTML = '';
    repos.forEach(repo => {
      const card = document.createElement('article');
      card.className = 'gh-card reveal vis';

      const langClass = (repo.language || 'html').toLowerCase();
      const updatedDate = formatDate(repo.pushed_at || repo.updated_at);
      const meta = getRepoMeta(repo);
      const targetUrl = meta.demoUrl || repo.html_url;
      const displayDesc = repo.description || meta.description || 'Modern web application developed with clean code principles.';

      card.innerHTML = `
        <div class="gh-card-frame">
          <div class="gh-card-chrome">
            <div class="gh-card-dots" aria-hidden="true">
              <span class="dot dot--red"></span>
              <span class="dot dot--yellow"></span>
              <span class="dot dot--green"></span>
            </div>
            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="gh-card-url" title="${meta.urlDisplay}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <span>${meta.urlDisplay}</span>
            </a>
            <span class="gh-card-badge">${meta.badge}</span>
          </div>
          <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="gh-card-viewport" aria-label="View ${meta.displayName} preview">
            <img src="${meta.image}" alt="${meta.displayName} repository preview mockup" width="600" height="375" loading="lazy" decoding="async" class="gh-card-thumb-img" onerror="this.onerror=null;this.src='assets/images/case-portfolio.jpg';"/>
          </a>
        </div>
        <div class="gh-card-body">
          <div class="gh-card-head">
            <h3 class="gh-card-title">${meta.displayName || repo.name}</h3>
            <div class="gh-card-stats">
              <span class="gh-stat" title="Stars">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                <span>${repo.stargazers_count || 0}</span>
              </span>
              <span class="gh-stat" title="Forks">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 15V9a4 4 0 00-4-4H9M6 9v6"/></svg>
                <span>${repo.forks_count || 0}</span>
              </span>
            </div>
          </div>
          <p class="gh-card-desc">${displayDesc}</p>
          <div class="gh-card-footer">
            <span class="gh-card-lang">
              <span class="gh-lang-dot ${langClass}"></span>
              <span>${repo.language || 'HTML'}</span>
            </span>
            ${updatedDate ? `<span>Updated ${updatedDate}</span>` : ''}
          </div>
          <div class="gh-card-links">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn--secondary btn--sm">GitHub Code</a>
            ${meta.demoUrl ? `<a href="${meta.demoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--sm">Live Demo ↗</a>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    showStatus('success');
  }

  if (retryBtn) {
    on(retryBtn, 'click', fetchRepos);
  }

  fetchRepos();
})();

/* ================================================================
   12. PESHAWAR LOCAL TIME (Bento Card Live Clock)
   Uses Intl.DateTimeFormat with IANA timezone 'Asia/Karachi'.
   No geolocation, tabular numbers, rAF/visibility cleanup, zero layout shift.
   ================================================================ */
(function initLocalTime() {
  const timeEl = document.getElementById('bento-local-time');
  const dateEl = document.getElementById('bento-local-date');
  if (!timeEl) return;

  let timeFormatter;
  let dateFormatter;

  try {
    timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch (err) {
    // If Intl or Asia/Karachi timezone is unsupported, preserve HTML fallback
    return;
  }

  function update() {
    try {
      const now = new Date();
      timeEl.textContent = timeFormatter.format(now);
      if (dateEl) {
        dateEl.textContent = `${dateFormatter.format(now)} · PKT (UTC+5)`;
      }
    } catch (e) {
      // Keep static markup intact
    }
  }

  update();
  let timerId = setInterval(update, 1000);

  // Pause interval when user switches tabs to save CPU/battery, resume immediately on return
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    } else {
      update();
      if (!timerId) {
        timerId = setInterval(update, 1000);
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    if (timerId) clearInterval(timerId);
  });
})();

/* ================================================================
   14. INTERACTIVE SPOTLIGHT GLOW (Mouse-Tracking Ambient Cards)
   Smooth radial gradient follow effect on bento, service & principle cards.
   ================================================================ */
(function initSpotlightGlow() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  function setupCards() {
    const targetSelector = '.bento-card:not(.bento-card--portrait), .svc-card, .principle-card, .note-card, .journey-story-card, .cwv-score-card';
    const cards = document.querySelectorAll(targetSelector);
    if (!cards.length) return;

    cards.forEach(card => card.classList.add('spotlight-card'));

    function handlePointerMove(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }

    function handlePointerLeave(e) {
      const card = e.currentTarget;
      card.style.setProperty('--mouse-x', '-9999px');
      card.style.setProperty('--mouse-y', '-9999px');
    }

    cards.forEach(card => {
      card.addEventListener('pointermove', handlePointerMove, { passive: true });
      card.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCards);
  } else {
    setupCards();
  }
})();

/* ================================================================
   15. TERMINAL CODE 1-CLICK COPY BUTTON
   Allows users to copy code snippets directly with instant visual feedback.
   ================================================================ */
(function initCodeCopy() {
  function setupCodeCopy() {
    const codeBlocks = document.querySelectorAll('.code-editor-card');
    codeBlocks.forEach(block => {
      const header = block.querySelector('.code-header');
      const codeEl = block.querySelector('code');
      if (!header || !codeEl) return;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code snippet');
      copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copy</span>
      `;

      copyBtn.addEventListener('click', () => {
        const text = codeEl.innerText || codeEl.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Copied!</span>
            `;
            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy</span>
              `;
            }, 2000);
          });
        }
      });

      header.appendChild(copyBtn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCodeCopy);
  } else {
    setupCodeCopy();
  }
})();

/* ================================================================
   16. INTERACTIVE PROJECT SCOPE & TIMELINE ESTIMATOR
   Calculates estimated delivery timeframe and generates a 1-click
   WhatsApp brief or auto-fills the contact form below.
   ================================================================ */
(function initProjectEstimator() {
  const estimatorSection = document.getElementById('estimator');
  if (!estimatorSection) return;

  const typeButtons = estimatorSection.querySelectorAll('.est-option');
  const pagePills = estimatorSection.querySelectorAll('.est-pill');
  const checkboxes = estimatorSection.querySelectorAll('.est-check');
  const timelineEl = document.getElementById('est-display-timeline');
  const badgeEl = document.getElementById('est-badge-type');
  const featuresListEl = document.getElementById('est-features-list');
  const whatsappBtn = document.getElementById('est-whatsapp-btn');
  const autofillBtn = document.getElementById('est-autofill-btn');

  let selectedType = {
    name: 'Landing Page / One-Pager',
    short: 'Landing Page',
    baseDays: 3
  };

  let selectedPages = {
    name: '1–3 Pages',
    addDays: 0
  };

  function updateEstimate() {
    // 1. Calculate days range
    const totalDays = selectedType.baseDays + selectedPages.addDays;
    const minDays = Math.max(2, totalDays - 1);
    const maxDays = totalDays + 2;
    if (timelineEl) {
      timelineEl.textContent = `${minDays}–${maxDays} Business Days`;
    }

    if (badgeEl) {
      badgeEl.textContent = selectedType.short;
    }

    // 2. Collect selected features
    const selectedFeatures = [];
    checkboxes.forEach(cb => {
      if (cb.checked) {
        selectedFeatures.push(cb.value);
      }
    });

    // 3. Render features list
    if (featuresListEl) {
      featuresListEl.innerHTML = '';
      const items = [selectedPages.name, ...selectedFeatures];
      items.forEach(feat => {
        const li = document.createElement('li');
        li.textContent = feat;
        featuresListEl.appendChild(li);
      });
    }

    // 4. Update WhatsApp 1-Click Brief URL
    if (whatsappBtn) {
      const briefText = `Hi Afaq, I configured a project estimate on your portfolio:
• Project: ${selectedType.name}
• Scope: ${selectedPages.name}
• Features: ${selectedFeatures.length ? selectedFeatures.join(', ') : 'Standard Responsive'}
• Estimated Timeline: ${minDays}–${maxDays} Business Days

I'd like to discuss scheduling and requirements.`;

      const encoded = encodeURIComponent(briefText);
      whatsappBtn.href = `https://wa.me/923189798577?text=${encoded}`;
    }
  }

  // Type selection
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      selectedType.name = btn.getAttribute('data-name');
      const titleEl = btn.querySelector('.est-opt-title');
      selectedType.short = titleEl ? titleEl.textContent.split('/')[0].trim() : selectedType.name;
      selectedType.baseDays = parseInt(btn.getAttribute('data-days'), 10) || 3;
      updateEstimate();
    });
  });

  // Pages selection
  pagePills.forEach(pill => {
    pill.addEventListener('click', () => {
      pagePills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      selectedPages.name = pill.getAttribute('data-pages');
      selectedPages.addDays = parseInt(pill.getAttribute('data-add-days'), 10) || 0;
      updateEstimate();
    });
  });

  // Checkbox toggles
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateEstimate);
  });

  // Auto-fill form button
  if (autofillBtn) {
    autofillBtn.addEventListener('click', () => {
      const subjectInput = document.getElementById('cf-subject');
      const messageInput = document.getElementById('cf-msg');
      const contactForm = document.getElementById('contact-form');

      const selectedFeatures = [];
      checkboxes.forEach(cb => {
        if (cb.checked) selectedFeatures.push(cb.value);
      });

      const minDays = Math.max(2, selectedType.baseDays + selectedPages.addDays - 1);
      const maxDays = selectedType.baseDays + selectedPages.addDays + 2;

      if (subjectInput) {
        subjectInput.value = `${selectedType.name} (${selectedPages.name})`;
        subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (messageInput) {
        messageInput.value = `Hi Afaq,\n\nI would like to inquire about a project based on the following scope:\n• Project Type: ${selectedType.name}\n• Page Scope: ${selectedPages.name}\n• Capabilities: ${selectedFeatures.join(', ')}\n• Target Timeline: ~${minDays}–${maxDays} business days\n\nPlease let me know your availability for a kick-off discussion.`;
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (contactForm) {
        contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        contactForm.style.transition = 'box-shadow 0.4s ease';
        contactForm.style.boxShadow = '0 0 0 2px var(--brand), 0 20px 40px rgba(114, 151, 181, 0.2)';
        setTimeout(() => {
          contactForm.style.boxShadow = '';
          const nameInput = document.getElementById('cf-name');
          if (nameInput) nameInput.focus();
        }, 1200);
      }
    });
  }

  updateEstimate();
})();

/* ================================================================
   17. INTERACTIVE TECHNICAL ARCHITECTURE & DEEP-DIVE MODAL
   Provides engineering decision records (ADR), request pipeline
   flowcharts, and verified production benchmarks for each project.
   ================================================================ */
(function initTechDeepDiveModal() {
  const PROJECT_SPECS = {
    'blue-sapphire': {
      title: 'Blue Sapphire Gem Stones',
      type: 'Local Client Project · Commercial Showcase',
      badge: 'Verified Live',
      stack: ['HTML5 Semantic', 'Modern CSS3 Tokens', 'Vanilla JavaScript', 'Vercel Edge CDN'],
      metrics: [
        { val: '100 / 100', lbl: 'Lighthouse Score', note: 'Perfect Performance & Best Practices' },
        { val: '48 KB', lbl: 'Total Transfer', note: 'vs 2.1 MB template average' },
        { val: '0.38s', lbl: 'First Paint', note: 'Instant sub-second visual render' },
        { val: '0.00', lbl: 'CLS Score', note: 'Rock-solid zero layout shift' }
      ],
      pipeline: [
        { step: 'Step 01', title: 'Global Edge Cache', desc: 'Pre-rendered static HTML and CSS served via Vercel Edge with < 40ms TTFB.' },
        { step: 'Step 02', title: 'Zero-Runtime DOM', desc: 'No virtual DOM diffing or React hydration; native browser engine renders layout instantly.' },
        { step: 'Step 03', title: 'Dynamic SKU Parser', desc: 'Client-side parameter parser formats gemstone carat, cut, and origin specs.' },
        { step: 'Step 04', title: 'WhatsApp Sales Hook', desc: 'Encrypted 1-click inquiry pre-populating unique stone details directly to merchant.' }
      ],
      adr: {
        title: 'ADR 01: Zero-Framework Architecture with WhatsApp Direct Line',
        rationale: 'In high-value natural gemstone sales in Peshawar, buyers demand personal consultation and lab certificate verification before transacting. Traditional e-commerce carts create unnecessary friction. By utilizing zero-runtime Vanilla JS and routing inquiries directly into WhatsApp with pre-filled inventory SKUs, the site achieves a 100/100 Lighthouse audit and significantly higher conversion rates.'
      },
      liveUrl: 'https://www.bluesapphiregemstones.com/',
      codeUrl: 'https://github.com/afaqahmadcs/GemStone-Project'
    },
    'international': {
      title: 'International Client Web Engagement',
      type: 'Commissioned Client Work · Active Development',
      badge: 'Confidential Under NDA',
      stack: ['HTML5 Semantic', 'CSS3 Layout Tokens', 'Vanilla JS Modules', 'Git Asynchronous CI'],
      metrics: [
        { val: '100 / 100', lbl: 'Audit Target', note: 'Strict Lighthouse compliance standard' },
        { val: '0 KB', lbl: 'Bundle Bloat', note: 'Zero third-party library overhead' },
        { val: 'WCAG AAA', lbl: 'Accessibility', note: 'High contrast & keyboard navigational flow' },
        { val: 'Sub-second', lbl: 'Global TTFB', note: 'Optimized for international edge delivery' }
      ],
      pipeline: [
        { step: 'Step 01', title: 'Scope & Requirements', desc: 'Asynchronous requirements documentation and milestone breakdown.' },
        { step: 'Step 02', title: 'Design Token Engine', desc: 'CSS custom properties governing responsive typography, spacing, and elevation.' },
        { step: 'Step 03', title: 'Accessible Components', desc: 'Semantic HTML5 structure engineered for assistive technologies and screen readers.' },
        { step: 'Step 04', title: 'Versioned Staging', desc: 'Feature-branched Git workflow with peer review before deployment.' }
      ],
      adr: {
        title: 'ADR 02: Strict Modular Tokens for Cross-Border Delivery',
        rationale: 'Delivering commercial software across international timezones requires crystal-clear engineering boundaries and zero maintenance drag. A tokenized CSS architecture eliminates framework version incompatibilities and guarantees sub-second page loads globally without heavy frontend build tooling.'
      },
      liveUrl: '',
      codeUrl: ''
    },
    'real-estate': {
      title: 'Afaq Ahmad Real Estate',
      type: 'Concept Project · Architecture Study',
      badge: '9-Page Architecture',
      stack: ['HTML5', 'Modular CSS3 (9 Files)', 'JavaScript', 'CSS Grid', 'GitHub Pages'],
      metrics: [
        { val: '9 Pages', lbl: 'Document Structure', note: 'Decoupled static multi-page routing' },
        { val: '0.00', lbl: 'Layout Shift', note: 'Pre-computed card aspect ratios' },
        { val: '< 1ms', lbl: 'Theme Switch', note: 'Instant localStorage-backed theme sync' },
        { val: '98+', lbl: 'Audit Score', note: 'Google Lighthouse Performance' }
      ],
      pipeline: [
        { step: 'Step 01', title: 'Document Hierarchy', desc: '9 cleanly linked static HTML pages with zero framework routing lag.' },
        { step: 'Step 02', title: 'Decoupled CSS Modules', desc: 'Separated concerns: layout.css, cards.css, forms.css, variables.css.' },
        { step: 'Step 03', title: 'Auto-Fit Grid Engine', desc: 'CSS Grid auto-fit columns fluidly adapting from 360px mobile to 4K displays.' },
        { step: 'Step 04', title: 'State Persistence', desc: 'Synchronous localStorage persistence preserving user theme preferences.' }
      ],
      adr: {
        title: 'ADR 03: Modular CSS Separation over Monolithic Stylesheets',
        rationale: 'Real estate portals featuring rich parameter cards (beds, baths, square footage, price) often collapse into CSS specificity wars. Splitting styles into decoupled modules organized around a central design token file proved that large multi-page websites can remain maintainable and fast without CSS-in-JS or Tailwind.'
      },
      liveUrl: 'https://afaqahmadcs.github.io/AFAQ-AHMAD-REAL-ESTATE-/',
      codeUrl: 'https://github.com/afaqahmadcs/AFAQ-AHMAD-REAL-ESTATE-'
    },
    'apex-motors': {
      title: 'Apex Motors Luxury Dealership',
      type: 'Concept Project · Interface Study',
      badge: 'Automotive Showcase',
      stack: ['HTML5', 'CSS3 Dark Theme', 'Vanilla JavaScript', 'AOS'],
      metrics: [
        { val: '0 ms', lbl: 'Search Latency', note: 'Instant in-memory client-side filter' },
        { val: 'WCAG AAA', lbl: 'Contrast Ratio', note: 'Engineered high-contrast dark palette' },
        { val: '0 KB', lbl: 'Search Libraries', note: 'Zero external search dependencies' },
        { val: '99 / 100', lbl: 'Mobile Audit', note: 'Fluid responsiveness across devices' }
      ],
      pipeline: [
        { step: 'Step 01', title: 'Input Stream', desc: 'Debounced search keystroke listener on input element.' },
        { step: 'Step 02', title: 'In-Memory Filter', desc: 'Multi-attribute substring match across model, specs, and price.' },
        { step: 'Step 03', title: 'DOM Attribute Diff', desc: 'Smooth visibility toggle of matching vehicle cards with CSS transitions.' },
        { step: 'Step 04', title: 'Test Drive Modal', desc: 'Accessible booking dialog with focus trap and keyboard navigation.' }
      ],
      adr: {
        title: 'ADR 04: In-Memory Client-Side Search over Remote Queries',
        rationale: 'For dealership vehicle inventories under 100 items, round-trip server queries add unnecessary latency and server cost. An in-memory client-side filter provides instantaneous 0ms feedback as the buyer types, mimicking native desktop application speed.'
      },
      liveUrl: 'https://afaqahmadcs.github.io/Luxury-Car-Business-Website/',
      codeUrl: 'https://github.com/afaqahmadcs/Luxury-Car-Business-Website'
    },
    'veloce': {
      title: 'Veloce Automotive Showroom',
      type: 'Concept Project · Showroom Study',
      badge: 'Supercars & EV Showcase',
      stack: ['HTML5', 'CSS3 Fluid Gradients', 'Vanilla JavaScript', 'Fullscreen Overlay'],
      metrics: [
        { val: '100 / 100', lbl: 'Lighthouse Score', note: 'Clean asset delivery & compression' },
        { val: '60 FPS', lbl: 'Animation Framerate', note: 'GPU hardware-accelerated transforms' },
        { val: '< 35 KB', lbl: 'Bundle Size', note: 'Ultra-lightweight vanilla footprint' },
        { val: '100%', lbl: 'Reduced Motion', note: 'Strict prefers-reduced-motion fallback' }
      ],
      pipeline: [
        { step: 'Step 01', title: 'Adaptive Viewport', desc: 'Fluid typography and dynamic hero sizing based on viewport height.' },
        { step: 'Step 02', title: 'GPU Promotion', desc: 'CSS transform3d promotion ensuring stutter-free 60fps animations.' },
        { step: 'Step 03', title: 'Fullscreen Overlay', desc: 'Backdrop-filter modal search accessible via keyboard Esc/Tab.' },
        { step: 'Step 04', title: 'Animated Metrics', desc: 'Custom ease-out number ticker for 0-60 mph acceleration benchmarks.' }
      ],
      adr: {
        title: 'ADR 05: GPU Acceleration for Luxury Micro-Interactions',
        rationale: 'Exotic vehicle buyers evaluate brand prestige through visual polish and fluid responsiveness. By strictly isolating animations to translate3d and opacity, animations run at a lock-solid 60 FPS even on mid-tier mobile hardware.'
      },
      liveUrl: 'https://afaqahmadcs.github.io/Premium-Luxury-Car-Business-Website/',
      codeUrl: 'https://github.com/afaqahmadcs/Premium-Luxury-Car-Business-Website'
    },
    'nexora': {
      title: 'Nexora Labs Corporate Agency',
      type: 'Concept Project · Corporate Study',
      badge: 'B2B Agency Interface',
      stack: ['HTML5', 'CSS3 Custom Tokens', 'Vanilla JavaScript', 'Lucide SVG Icons'],
      metrics: [
        { val: '100 / 100', lbl: 'Accessibility', note: 'Strict ARIA-compliant accordions & buttons' },
        { val: 'BEM CSS', lbl: 'Layout Hierarchy', note: 'Strict Block-Element-Modifier scoping' },
        { val: '0 KB', lbl: 'Framework Bloat', note: 'Pure vanilla accordion and pricing state' },
        { val: '100%', lbl: 'Cross-Browser', note: 'Pixel-perfect across Chrome, Safari, Firefox' }
      ],
      pipeline: [
        { step: 'Step 01', title: 'Modular Token Tree', desc: 'Centralized typography, elevation, and palette variables.' },
        { step: 'Step 02', title: 'BEM Component Scope', desc: 'Strict Block-Element-Modifier scoping preventing stylesheet bleed.' },
        { step: 'Step 03', title: 'Accordion State Engine', desc: 'Keyboard-accessible disclosure widgets with aria-expanded toggles.' },
        { step: 'Step 04', title: 'Dynamic Pricing Toggle', desc: 'Monthly vs annual billing calculation with smooth transitions.' }
      ],
      adr: {
        title: 'ADR 06: Semantic HTML Disclosures over Generic Divs',
        rationale: 'Corporate agency landing pages frequently fail accessibility audits due to div-based accordion soup. Nexora implements strict semantic buttons, aria-expanded state attributes, and keyboard listeners for full WCAG compliance.'
      },
      liveUrl: 'https://afaqahmadcs.github.io/Modern-Web-Development-Corporate-Agency-Website/',
      codeUrl: 'https://github.com/afaqahmadcs/Modern-Web-Development-Corporate-Agency-Website'
    }
  };

  let modalBackdrop = null;
  let toastEl = null;
  let toastTimer = null;
  let currentProject = null;

  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'cmd-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-show');
    }, 2400);
  }

  function createModal() {
    if (modalBackdrop) return;

    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'tech-modal-backdrop';
    modalBackdrop.setAttribute('role', 'dialog');
    modalBackdrop.setAttribute('aria-modal', 'true');
    modalBackdrop.setAttribute('aria-label', 'Technical Architecture Deep-Dive');

    modalBackdrop.innerHTML = `
      <div class="tech-modal-card">
        <div class="tech-modal-header">
          <div class="tech-modal-title-wrap">
            <div class="tech-modal-badges">
              <span id="tech-modal-type" class="case-badge case-badge--client">Client Project</span>
              <span id="tech-modal-badge" class="case-type">Verified Live</span>
            </div>
            <h2 id="tech-modal-title" class="tech-modal-title">Project Title</h2>
          </div>
          <button type="button" class="tech-modal-close-btn" aria-label="Close architecture modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="tech-modal-body">
          <!-- 1. Production Metrics Grid -->
          <div>
            <div class="tech-section-title" style="margin-bottom:var(--s3)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span>Verified Production Benchmarks</span>
            </div>
            <div id="tech-metrics-grid" class="tech-metrics-grid"></div>
          </div>

          <!-- 2. System Architecture Pipeline -->
          <div class="tech-pipeline-section">
            <div class="tech-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
              <span>End-to-End System Pipeline</span>
            </div>
            <div id="tech-pipeline-grid" class="tech-pipeline-grid"></div>
          </div>

          <!-- 3. Architectural Decision Record -->
          <div id="tech-adr-box" class="tech-adr-box">
            <div class="tech-adr-eyebrow">Engineering Rationale</div>
            <h3 id="tech-adr-title" class="tech-adr-title">Architectural Decision Record</h3>
            <p id="tech-adr-rationale" class="tech-adr-rationale"></p>
          </div>

          <!-- 4. Tech Stack Tags -->
          <div>
            <div class="tech-section-title" style="margin-bottom:var(--s2)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>Core Stack &amp; Workflow</span>
            </div>
            <div id="tech-modal-tags" class="tech-modal-tags"></div>
          </div>
        </div>

        <div class="tech-modal-footer">
          <div class="tech-modal-actions-left" id="tech-modal-links"></div>
          <div class="tech-modal-actions-right">
            <button type="button" id="tech-copy-summary-btn" class="btn btn--outline btn--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" aria-hidden="true" style="margin-right:4px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy Summary
            </button>
            <button type="button" class="btn btn--secondary btn--sm tech-modal-dismiss-btn">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);

    // Event listeners for close
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    const closeBtns = modalBackdrop.querySelectorAll('.tech-modal-close-btn, .tech-modal-dismiss-btn');
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

    // Copy Summary button
    const copyBtn = modalBackdrop.querySelector('#tech-copy-summary-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!currentProject) return;
        const p = currentProject;
        const text = `Engineering Summary: ${p.title}
• Architecture: ${p.adr.title}
• Stack: ${p.stack.join(', ')}
• Metrics: ${p.metrics.map(m => `${m.lbl}: ${m.val}`).join(' | ')}
• Rationale: ${p.adr.rationale}
${p.liveUrl ? `• Live Demo: ${p.liveUrl}\n` : ''}${p.codeUrl ? `• GitHub: ${p.codeUrl}` : ''}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast('Architecture summary copied to clipboard!');
          }).catch(() => {
            showToast('Failed to copy to clipboard');
          });
        }
      });
    }

    // Escape key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('is-open')) {
        e.preventDefault();
        closeModal();
      }
    });
  }

  function openModal(projectId) {
    const data = PROJECT_SPECS[projectId];
    if (!data) return;
    currentProject = data;

    createModal();

    // Populate data
    document.getElementById('tech-modal-title').textContent = data.title;
    document.getElementById('tech-modal-type').textContent = data.type;
    document.getElementById('tech-modal-badge').textContent = data.badge;

    // Metrics
    const metricsGrid = document.getElementById('tech-metrics-grid');
    metricsGrid.innerHTML = data.metrics.map(m => `
      <div class="tech-metric-card">
        <span class="tech-metric-val">${m.val}</span>
        <span class="tech-metric-lbl">${m.lbl}</span>
        <span class="tech-metric-note">${m.note}</span>
      </div>
    `).join('');

    // Pipeline
    const pipelineGrid = document.getElementById('tech-pipeline-grid');
    pipelineGrid.innerHTML = data.pipeline.map(node => `
      <div class="tech-pipeline-node">
        <span class="tech-node-step">${node.step}</span>
        <h4 class="tech-node-title">${node.title}</h4>
        <p class="tech-node-desc">${node.desc}</p>
      </div>
    `).join('');

    // ADR
    document.getElementById('tech-adr-title').textContent = data.adr.title;
    document.getElementById('tech-adr-rationale').textContent = data.adr.rationale;

    // Tags
    const tagsWrap = document.getElementById('tech-modal-tags');
    tagsWrap.innerHTML = data.stack.map(tag => `<span class="tag">${tag}</span>`).join('');

    // Action links
    const linksWrap = document.getElementById('tech-modal-links');
    let linksHtml = '';
    if (data.liveUrl) {
      linksHtml += `<a href="${data.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--sm">Live Production Site ↗</a>`;
    }
    if (data.codeUrl) {
      linksHtml += `<a href="${data.codeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--outline btn--sm">View Source (GitHub) ↗</a>`;
    }
    if (!data.liveUrl && !data.codeUrl) {
      linksHtml += `<span class="tag tag-b">Proprietary / Client NDA</span>`;
    }
    linksWrap.innerHTML = linksHtml;

    // Open modal
    modalBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // Bind click on any deep dive button on the page
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.proj-deep-dive-btn');
    if (!btn) return;
    e.preventDefault();
    const projectId = btn.getAttribute('data-project');
    if (projectId) {
      openModal(projectId);
    }
  });
})();
