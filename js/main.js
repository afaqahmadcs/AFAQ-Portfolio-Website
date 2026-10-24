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
  applyTheme(savedTheme || osPreference);

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('aa-theme', theme);
    if (sun && moon) {
      sun.style.display  = theme === 'dark' ? 'none'  : 'block';
      moon.style.display = theme === 'dark' ? 'block' : 'none';
    }
    if (btn) {
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
  }

  on(btn, 'click', () => {
    const current = html.getAttribute('data-theme') || 'light';
    html.classList.add('theme-transitioning');
    setTimeout(() => html.classList.remove('theme-transitioning'), 300);
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('aa-theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
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
   6. SCROLL REVEAL (IntersectionObserver, non-blocking)
   ================================================================ */
(function initScrollReveal() {
  const targets = $$('.reveal, .stagger');
  if (!targets.length) return;

  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    targets.forEach(el => el.classList.add('vis'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('vis');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('vis');
    } else {
      observer.observe(el);
    }
  });
})();

/* ================================================================
   7. ANIMATED STAT COUNTERS
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

      const duration = 1200;
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
      const category = (card.dataset.cat || '').toLowerCase();
      const title    = (card.dataset.title || '').toLowerCase();
      const matchesCat   = currentCategory === 'all' || category === currentCategory;
      const matchesQuery = !searchQuery || title.includes(searchQuery);

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
    on(searchInput, 'input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim().toLowerCase();
        applyFilters();
      }, 120);
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
   13. CONTACT FORM VALIDATION & SUBMISSION (contact.html)
   ================================================================ */
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const fields = {
    name:    { el: $('#cf-name'),    err: $('#err-name'),    msg: 'Please enter your name.' },
    email:   { el: $('#cf-email'),   err: $('#err-email'),   msg: 'Valid email required.' },
    subject: { el: $('#cf-subject'), err: $('#err-subject'), msg: 'Subject required.' },
    message: { el: $('#cf-msg'),     err: $('#err-msg'),     msg: 'Message required.' }
  };
  const submitBtn = $('#form-submit');
  const formOk    = $('#form-ok');

  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate(key) {
    const field = fields[key];
    if (!field || !field.el) return true;
    const val = field.el.value.trim();
    const isValid = val.length > 0 && (key !== 'email' || isEmail(val));

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

  on(form, 'submit', async (e) => {
    e.preventDefault();
    const allValid = Object.keys(fields).map(validate).every(Boolean);
    if (!allValid) return;

    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    // EmailJS credentials configuration
    // To enable automatic browser sending via EmailJS, insert your keys below:
    const SERVICE_ID  = 'YOUR_SERVICE_ID';
    const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
    const PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

    const isEmailJSConfigured = Boolean(
      window.emailjs &&
      SERVICE_ID !== 'YOUR_SERVICE_ID' &&
      TEMPLATE_ID !== 'YOUR_TEMPLATE_ID' &&
      PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'
    );

    const nameVal    = fields.name.el?.value.trim() || '';
    const emailVal   = fields.email.el?.value.trim() || '';
    const subjectVal = fields.subject.el?.value.trim() || '';
    const messageVal = fields.message.el?.value.trim() || '';

    try {
      if (isEmailJSConfigured) {
        await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          from_name:  nameVal,
          from_email: emailVal,
          subject:    subjectVal,
          message:    messageVal
        }, PUBLIC_KEY);

        if (formOk) {
          formOk.textContent = "Thank you! Your message was delivered successfully. I'll get back to you within 24 hours.";
          formOk.classList.remove('err-msg');
          formOk.classList.add('show');
        }
        form.reset();
        Object.keys(fields).forEach(k => { if (fields[k].el) fields[k].el.style.borderColor = ''; });
      } else {
        // Honest fallback when EmailJS keys are not yet configured:
        // Construct mailto link with all field data prefilled so zero user input is lost!
        const mailtoSubject = encodeURIComponent(`[Website Inquiry] ${subjectVal}`);
        const mailtoBody = encodeURIComponent(
          `Hi Afaq,\n\nName: ${nameVal}\nEmail: ${emailVal}\n\nProject Details:\n${messageVal}\n\n---\nSent from Portfolio Contact Form`
        );
        const mailtoUrl = `mailto:afaqahmad.contact@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

        if (formOk) {
          formOk.innerHTML = `<strong>Opening your email client…</strong> If your email application does not open automatically, please send your message directly to <a href="${mailtoUrl}" style="text-decoration:underline;color:inherit;font-weight:bold;">afaqahmad.contact@gmail.com</a>.`;
          formOk.classList.remove('err-msg');
          formOk.classList.add('show');
        }

        window.location.href = mailtoUrl;
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      const mailtoSubject = encodeURIComponent(`[Website Inquiry] ${subjectVal}`);
      const mailtoBody = encodeURIComponent(
        `Hi Afaq,\n\nName: ${nameVal}\nEmail: ${emailVal}\n\nProject Details:\n${messageVal}\n\n---\nSent from Portfolio Contact Form`
      );
      const mailtoUrl = `mailto:afaqahmad.contact@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

      if (formOk) {
        formOk.innerHTML = `Unable to send via automated service. <a href="${mailtoUrl}" style="text-decoration:underline;color:inherit;font-weight:bold;">Click here to send directly via email (afaqahmad.contact@gmail.com)</a>.`;
        formOk.classList.add('err-msg');
        formOk.classList.add('show');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });
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
      description: "Blue Sapphire / Gemstone client website showcasing luxury gemstone collections.",
      language: "TypeScript",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-08-17T11:29:09Z",
      html_url: "https://github.com/afaqahmadcs/GemStone-Project",
      homepage: "https://www.bluesapphiregemstones.com/"
    },
    {
      name: "AFAQ-Portfolio-Website",
      description: "Personal developer portfolio website featuring a clean, responsive layout and dark mode.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-08-23T18:15:27Z",
      html_url: "https://github.com/afaqahmadcs/AFAQ-Portfolio-Website",
      homepage: "https://afaq-portfolio-blush.vercel.app"
    },
    {
      name: "AFAQ-AHMAD-REAL-ESTATE-",
      description: "Modern real estate platform with property listings, clean navigation, and responsive design.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-27T11:52:24Z",
      html_url: "https://github.com/afaqahmadcs/AFAQ-AHMAD-REAL-ESTATE-",
      homepage: "https://afaq-ahmad-real-estate.vercel.app"
    },
    {
      name: "Premium-Luxury-Car-Business-Website",
      description: "Premium automotive website with a sophisticated dark theme and responsive catalog.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-20T18:17:01Z",
      html_url: "https://github.com/afaqahmadcs/Premium-Luxury-Car-Business-Website",
      homepage: null
    },
    {
      name: "Luxury-Car-Business-Website",
      description: "Elegant automotive business website with a refined user interface.",
      language: "CSS",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-20T19:21:18Z",
      html_url: "https://github.com/afaqahmadcs/Luxury-Car-Business-Website",
      homepage: null
    },
    {
      name: "Business-Website",
      description: "Modern multi-section business website built with responsive layout principles.",
      language: "HTML",
      stargazers_count: 0,
      forks_count: 0,
      updated_at: "2026-07-20T12:55:20Z",
      html_url: "https://github.com/afaqahmadcs/Business-Website",
      homepage: null
    }
  ];

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

      card.innerHTML = `
        <div class="gh-card-head">
          <h3 class="gh-card-title">${repo.name}</h3>
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
        <p class="gh-card-desc">${repo.description || 'No description provided.'}</p>
        <div class="gh-card-footer">
          <span class="gh-card-lang">
            <span class="gh-lang-dot ${langClass}"></span>
            <span>${repo.language || 'HTML'}</span>
          </span>
          ${updatedDate ? `<span>Updated ${updatedDate}</span>` : ''}
        </div>
        <div class="gh-card-links">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn--secondary btn--sm">GitHub Code</a>
          ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="btn btn--primary btn--sm">Live Demo</a>` : ''}
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
   13. PROJECT CASE STUDY FILTER & SEARCH (projects.html)
   Handles category filtering (All / Client / Concept) and debounced search
   ================================================================ */
(function initProjectFilters() {
  const filterBtns = $$('.flt-btn');
  const searchInp = $('#proj-search-inp');
  const cards = $$('.case-study-card');
  const noResults = $('#no-results');

  if (!cards.length) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function applyFilters() {
    let visibleCount = 0;

    cards.forEach(card => {
      const cat = card.dataset.cat || 'concept';
      const title = (card.dataset.title || '').toLowerCase();
      const content = card.textContent.toLowerCase();

      const matchesCategory = (currentCategory === 'all') || (cat === currentCategory);
      const matchesSearch = !searchQuery || title.includes(searchQuery) || content.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
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

  filterBtns.forEach(btn => {
    on(btn, 'click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('on');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
      currentCategory = btn.dataset.filter || 'all';
      applyFilters();
    });
  });

  if (searchInp) {
    let debounceTimer;
    on(searchInp, 'input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchQuery = e.target.value.trim().toLowerCase();
        applyFilters();
      }, 150);
    });
  }
})();

/* ================================================================
   14. TECH STACK FILTER TABS (index.html)
   Filters technical skill badges by category: All / Comfortable / Backend / Tools / Exploration
   ================================================================ */
(function initTechStackTabs() {
  const tabs = $$('.tech-tab');
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

      const cat = tab.dataset.cat || 'all';
      badges.forEach(badge => {
        if (cat === 'all' || badge.dataset.cat === cat) {
          badge.classList.remove('hide');
        } else {
          badge.classList.add('hide');
        }
      });
    });
  });
})();

/* ================================================================
   15. PRE-FILL CONTACT SUBJECT FROM SERVICE QUERY PARAM
   ================================================================ */
(function initContactServiceParam() {
  const subjectInput = $('#cf-subject');
  if (!subjectInput) return;

  const params = new URLSearchParams(window.location.search);
  const service = params.get('service');
  if (!service) return;

  const map = {
    'responsive-website': 'Responsive Website Development',
    'design-to-code': 'Design-to-Code Implementation (Figma)',
    'layout-fixes': 'Layout Refactoring & Mobile Polish',
    'product-showcase': 'Business Product Showcase Catalog'
  };

  if (map[service]) {
    subjectInput.value = map[service];
  }
})();


