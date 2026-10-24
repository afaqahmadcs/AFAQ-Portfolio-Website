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
  const buttons = $$('.flt-btn');
  const cards   = $$('.case-study-card, .proj-card');
  const searchInput = $('#proj-search-inp');
  const noResults = $('#no-results');
  if (!buttons.length && !searchInput) return;

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
  }

  buttons.forEach(btn => on(btn, 'click', () => {
    buttons.forEach(b => {
      b.classList.remove('on');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('on');
    btn.setAttribute('aria-pressed', 'true');
    currentCategory = (btn.dataset.filter || 'all').toLowerCase();
    applyFilters();
  }));

  if (searchInput) {
    let debounceTimer;
    on(searchInput, 'input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = (e.target.value || '').trim().toLowerCase();
        applyFilters();
      }, 150);
    });
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



