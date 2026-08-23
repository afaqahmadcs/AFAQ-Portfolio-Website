/* ================================================================
   MAIN.JS — AFAQ AHMAD PORTFOLIO
   Premium animation system. 60fps. GPU-accelerated.
   Pure vanilla JS — no jQuery, no heavy libraries.
   ================================================================ */
'use strict';

/* ── Helpers ──────────────────────────────────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const raf = requestAnimationFrame;

/* ── Feature detection ────────────────────────────────────────────── */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* ================================================================
   1. AURORA BACKGROUND — premium ambient animation
   ================================================================ */
(function initAurora() {
  if (prefersReduced) return;
  const aurora = document.createElement('div');
  aurora.id = 'aurora';
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement('div');
    orb.className = 'aurora-orb';
    aurora.appendChild(orb);
  }
  document.body.prepend(aurora);
})();

/* ================================================================
   2. FLOATING PARTICLES — subtle ambient depth
   ================================================================ */
(function initParticles() {
  if (prefersReduced || isTouch) return;
  const container = document.createElement('div');
  container.id = 'particles';
  const count = 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 2.5 + 1;
    const dur  = Math.random() * 14 + 10;
    const delay = Math.random() * 12;
    const left = Math.random() * 100;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${left}%;
      bottom: -10px;
      animation-duration:${dur}s;
      animation-delay:-${delay}s;
      opacity: ${Math.random() * .4 + .1};
    `;
    container.appendChild(p);
  }
  document.body.prepend(container);
})();

/* ================================================================
   3. PAGE TRANSITION
   ================================================================ */
(function initPageTransition() {
  if (prefersReduced) return;
  const overlay = document.createElement('div');
  overlay.id = 'page-transition';
  document.body.prepend(overlay);

  // Animate page in on load
  overlay.classList.add('in');
  on(overlay, 'animationend', () => overlay.classList.remove('in', 'out'));

  // Fix bfcache black screen
  on(window, 'pageshow', e => {
    if (e.persisted) {
      overlay.classList.remove('in', 'out');
    }
  });

  const normalizePath = p => p.replace(/\/index\.html$/, '/').replace(/\/$/, '/');

  // Intercept internal link clicks for exit animation
  on(document, 'click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('http') ||
        a.target === '_blank') return;

    // Resolve absolute URL to check if it points to current page with a hash
    try {
      const targetUrl = new URL(a.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const p1 = normalizePath(targetUrl.pathname);
      const p2 = normalizePath(currentUrl.pathname);
      
      // If it's the same page and contains a hash, don't play transition (let smooth scroll handle it)
      if (targetUrl.origin === currentUrl.origin && p1 === p2 && targetUrl.hash) {
        return;
      }
    } catch (err) {}

    e.preventDefault();
    overlay.classList.add('out');
    on(overlay, 'animationend', () => {
      window.location.href = href;
    }, { once: true });
  });
})();

/* ================================================================
   4. THEME TOGGLE
   ================================================================ */
(function initTheme() {
  const html = document.documentElement;
  const btn  = $('#theme-btn');
  const sun  = $('#ic-sun');
  const moon = $('#ic-moon');

  const saved = localStorage.getItem('aa-theme');
  const osPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  apply(saved || osPref);

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('aa-theme', theme);
    if (sun && moon) {
      sun.style.display  = theme === 'dark' ? 'none'  : 'block';
      moon.style.display = theme === 'dark' ? 'block' : 'none';
    }
  }

  on(btn, 'click', () => {
    const current = html.getAttribute('data-theme');
    // Flash transition
    html.classList.add('theme-transitioning');
    setTimeout(() => html.classList.remove('theme-transitioning'), 400);
    apply(current === 'dark' ? 'light' : 'dark');
  });
})();

/* ================================================================
   5. PREMIUM LOADER
   ================================================================ */
(function initLoader() {
  const loader = $('#loader');
  const fill   = $('#ldr-fill');
  if (!loader) return;

  let pct = 0;
  const tick = () => {
    pct = Math.min(pct + Math.random() * 22 + 10, 95);
    if (fill) fill.style.width = pct + '%';
    if (pct < 95) setTimeout(tick, 90 + Math.random() * 80);
  };
  tick();

  function finish() {
    if (fill) fill.style.width = '100%';
    setTimeout(() => {
      loader.style.transition = 'opacity .5s ease, transform .5s ease';
      loader.style.opacity = '0';
      loader.style.transform = 'scale(1.04)';
      setTimeout(() => loader.classList.add('done'), 520);
    }, 280);
  }

  if (document.readyState === 'complete') finish();
  else {
    on(window, 'load', finish);
    setTimeout(finish, 1800);
  }
})();

/* ================================================================
   6. SCROLL PROGRESS BAR
   ================================================================ */
(function initScrollProgress() {
  const bar = $('#scroll-progress');
  if (!bar) return;
  const update = () => {
    const h   = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
    bar.style.width = pct + '%';
  };
  on(window, 'scroll', update, { passive: true });
})();

/* ================================================================
   7. SMOOTH SCROLL — momentum-based (Lenis-style)
   ================================================================ */
(function initSmoothScroll() {
  const normalizePath = p => p.replace(/\/index\.html$/, '/').replace(/\/$/, '/');

  on(document, 'click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;

    try {
      const targetUrl = new URL(a.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const p1 = normalizePath(targetUrl.pathname);
      const p2 = normalizePath(currentUrl.pathname);

      if (targetUrl.origin === currentUrl.origin && p1 === p2 && targetUrl.hash) {
        const id = targetUrl.hash.slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          const top = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    } catch (err) {}
  });
})();

/* ================================================================
   8. NAVBAR — hide/show + shrink on scroll
   ================================================================ */
(function initNavbar() {
  const nav = $('#navbar');
  if (!nav) return;
  let lastY = 0, ticking = false;

  const update = () => {
    const y = window.scrollY;
    if (y > lastY && y > 120) nav.classList.add('nav-up');
    else nav.classList.remove('nav-up');
    if (y > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
    lastY = y;
    ticking = false;
  };

  on(window, 'scroll', () => {
    if (!ticking) { raf(update); ticking = true; }
  }, { passive: true });
})();

/* ================================================================
   9. MOBILE MENU
   ================================================================ */
(function initMobileMenu() {
  const burger = $('#burger');
  const menu   = $('#mmenu');
  const close  = $('#mm-close');
  if (!burger || !menu) return;

  function open() {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    // Stagger links in
    $$('.mm-links a', menu).forEach((a, i) => {
      a.style.opacity = '0';
      a.style.transform = 'translateX(-20px)';
      setTimeout(() => {
        a.style.transition = 'opacity .35s ease, transform .35s ease';
        a.style.opacity = '1';
        a.style.transform = 'none';
      }, 80 + i * 60);
    });
  }

  function close_() {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  on(burger, 'click', open);
  on(close,  'click', close_);
  $$('.mm-links a', menu).forEach(a => on(a, 'click', close_));
  on(document, 'keydown', e => { if (e.key === 'Escape') close_(); });
})();

/* ================================================================
   10. HERO SCROLL INDICATOR — fade on scroll
   ================================================================ */
(function initHeroScroll() {
  const ind = $('#hero-scroll');
  if (!ind) return;
  on(window, 'scroll', () => {
    ind.classList.toggle('gone', window.scrollY > 100);
  }, { passive: true });
})();

/* ================================================================
   11. SCROLL REVEAL — IntersectionObserver
   ================================================================ */
(function initReveal() {
  if (prefersReduced) {
    $$('.reveal, .stagger, .mask-reveal, .timeline-full').forEach(el => {
      el.classList.add('vis');
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('vis');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  $$('.reveal, .stagger, .mask-reveal, .timeline-full, .char-reveal').forEach(el => {
    // Elements already in viewport on load → reveal immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay') || '0') * 1000;
      setTimeout(() => el.classList.add('vis'), delay + 100);
    } else {
      io.observe(el);
    }
  });
})();

/* ================================================================
   12. TEXT REVEAL — word by word for hero heading
   ================================================================ */
(function initTextReveal() {
  if (prefersReduced) return;

  $$('.text-reveal').forEach(el => {
    const text = el.textContent.trim();
    if (!text) return;
    const words = text.split(' ');
    el.innerHTML = words.map((w, i) =>
      `<span class="text-reveal-wrap"><span class="text-reveal-word" style="transition-delay:${.05 + i * .065}s">${w}</span></span>`
    ).join(' ');
    el.classList.add('text-reveal-ready');
  });

  // Hero text-reveals trigger immediately (they're in viewport on load)
  function revealNow(el) {
    $$('.text-reveal-word', el).forEach(w => w.classList.add('vis'));
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      revealNow(entry.target);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  $$('.text-reveal').forEach(el => {
    // If already in viewport, trigger right away
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => revealNow(el), 300);
    } else {
      io.observe(el);
    }
  });
})();

/* ================================================================
   13. ANIMATED STAT COUNTERS
   ================================================================ */
(function initCounters() {
  const els = $$('[data-target]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.target, 10);
      if (isNaN(end)) return;
      const dur = 1600;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        // ease out expo
        const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        el.textContent = Math.floor(ease * end);
        if (t < 1) raf(tick);
        else el.textContent = end;
      };
      raf(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });

  els.forEach(el => io.observe(el));
})();

/* ================================================================
   14. LEARNING / SKILL PROGRESS BARS
   ================================================================ */
(function initProgressBars() {
  const fills = $$('.learn-fill, .skill-bar-fill');
  if (!fills.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.width = el.dataset.width || '60%';
      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  fills.forEach(el => io.observe(el));
})();

/* ================================================================
   15. TECH TAB FILTER
   ================================================================ */
(function initTechTabs() {
  const tabs   = $$('.tech-tab');
  const badges = $$('.tech-badge');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    on(tab, 'click', () => {
      tabs.forEach(t => { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('on');
      tab.setAttribute('aria-selected', 'true');
      const filter = tab.dataset.tab || tab.dataset.cat || 'all';
      badges.forEach((badge, i) => {
        const show = filter === 'all' || badge.dataset.cat === filter;
        if (show) {
          badge.classList.remove('hide');
          badge.style.transitionDelay = (i % 8) * .04 + 's';
        } else {
          badge.classList.add('hide');
        }
      });
    });
  });
})();

/* ================================================================
   16. PROJECT FILTER + SEARCH
   ================================================================ */
(function initProjectFilter() {
  const btns  = $$('.flt-btn');
  const cards = $$('.proj-card');
  const inp   = $('#proj-search-inp');
  const noRes = $('#no-results');
  if (!btns.length && !inp) return;

  let filter = 'all', query = '';

  function apply() {
    let shown = 0;
    cards.forEach((card, i) => {
      const cat   = card.dataset.cat   || '';
      const title = card.dataset.title || '';
      const ok = (filter === 'all' || cat === filter) &&
                 (!query || title.includes(query));
      if (ok) {
        card.style.display = '';
        card.style.animationDelay = (shown * .06) + 's';
        shown++;
      } else {
        card.style.display = 'none';
      }
    });
    if (noRes) noRes.style.display = shown === 0 ? 'block' : 'none';
  }

  btns.forEach(b => on(b, 'click', () => {
    btns.forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    filter = b.dataset.filter || 'all';
    apply();
  }));

  if (inp) on(inp, 'input', () => { query = inp.value.trim().toLowerCase(); apply(); });
})();

/* ================================================================
   17. PREMIUM CURSOR — magnetic, label, lerp ring
   ================================================================ */
(function initCursor() {
  if (isTouch || prefersReduced) return;
  const dot   = $('#cur-dot');
  const ring  = $('#cur-ring');
  if (!dot || !ring) return;

  // Create label element
  const label = document.createElement('div');
  label.id = 'cur-label';
  document.body.appendChild(label);

  let mx = -200, my = -200;
  let rx = -200, ry = -200;
  let isVisible = false;

  // Instant dot follow
  on(document, 'mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    if (!isVisible) {
      dot.style.opacity = '1';
      ring.style.opacity = '.35';
      isVisible = true;
    }
  });

  // Lerp ring
  function lerpRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    label.style.left = mx + 'px';
    label.style.top  = (my - 36) + 'px';
    raf(lerpRing);
  }
  lerpRing();

  // Press effect
  on(document, 'mousedown', () => ring.classList.add('click'));
  on(document, 'mouseup',   () => ring.classList.remove('click'));

  // Hover states
  const hoverSel = 'a, button, .tech-badge, .svc-card, .proj-card, .pf-img, .pf-vis, .blog-card, .val-card, .why-card, .proc-step, .stat-card';
  const textSel  = 'p, h1, h2, h3, h4, li, span, input, textarea';
  const projSel  = '.proj-card, .pf-vis';

  on(document, 'mouseover', e => {
    const el = e.target;
    if (!el || typeof el.closest !== 'function') return;
    if (el.closest(projSel)) {
      ring.classList.add('on');
      label.textContent = 'View';
      label.classList.add('show');
    } else if (el.closest(hoverSel)) {
      ring.classList.add('on');
      ring.style.borderColor = 'var(--acc)';
    } else if (el.closest(textSel)) {
      ring.classList.add('text');
    }
  });

  on(document, 'mouseout', e => {
    const el = e.target;
    if (!el || typeof el.closest !== 'function') return;
    if (el.closest(projSel)) {
      label.classList.remove('show');
    }
    if (el.closest(hoverSel)) {
      ring.classList.remove('on');
      ring.style.borderColor = '';
    }
    if (el.closest(textSel)) {
      ring.classList.remove('text');
    }
  });
})();

/* ================================================================
   18. MAGNETIC BUTTONS
   ================================================================ */
(function initMagnetic() {
  if (isTouch || prefersReduced) return;

  $$('.btn--primary, .btn--white, .nav-cta').forEach(btn => {
    btn.classList.add('magnetic');
    // Wrap content in magnetic-inner if not already
    if (!btn.querySelector('.magnetic-inner')) {
      const inner = document.createElement('span');
      inner.className = 'magnetic-inner';
      inner.innerHTML = btn.innerHTML;
      btn.innerHTML = '';
      btn.appendChild(inner);
    }
    const inner = btn.querySelector('.magnetic-inner');

    on(btn, 'mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const x  = e.clientX - r.left - r.width  / 2;
      const y  = e.clientY - r.top  - r.height / 2;
      const mag = .28;
      btn.style.transform   = `translate(${x * mag}px, ${y * mag}px)`;
      if (inner) inner.style.transform = `translate(${x * .12}px, ${y * .12}px)`;
    });

    on(btn, 'mouseleave', () => {
      btn.style.transform   = '';
      if (inner) inner.style.transform = '';
    });
  });
})();

/* ================================================================
   19. BUTTON RIPPLE
   ================================================================ */
(function initRipple() {
  on(document, 'click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const rip  = document.createElement('span');
    rip.className = 'btn-ripple';
    rip.style.cssText = `
      width:${size}px; height:${size}px;
      left:${e.clientX - r.left - size/2}px;
      top:${e.clientY - r.top  - size/2}px;
    `;
    btn.appendChild(rip);
    on(rip, 'animationend', () => rip.remove());
  });
})();

/* ================================================================
   20. 3D CARD TILT
   ================================================================ */
(function initCardTilt() {
  if (isTouch || prefersReduced) return;

  const selectors = '.proj-card, .svc-card, .stat-card, .val-card, .blog-card, .why-card';
  $$('.proj-card, .svc-card, .stat-card, .val-card, .blog-card, .why-card').forEach(card => {
    card.classList.add('tilt-card');

    on(card, 'mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - .5;
      const y  = (e.clientY - r.top)  / r.height - .5;
      const rx = -y * 10;
      const ry =  x * 10;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });

    on(card, 'mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      // Spring back
      card.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();

/* ================================================================
   21. IMAGE PARALLAX on scroll
   ================================================================ */
(function initParallax() {
  if (prefersReduced) return;
  const imgs = $$('.pf-img-in img, .about-img img, .hero-photo img');
  if (!imgs.length) return;

  const update = () => {
    imgs.forEach(img => {
      const parent = img.closest('[class]') || img.parentElement || img;
      const r    = parent.getBoundingClientRect();
      const mid  = r.top + r.height / 2;
      const vh   = window.innerHeight;
      const pct  = (mid - vh / 2) / vh;
      const move = pct * 22;
      img.style.transform = `translateY(${move}px) scale(1.06)`;
    });
  };

  on(window, 'scroll', update, { passive: true });
})();

/* ================================================================
   22. FOOTER YEAR
   ================================================================ */
(function initYear() {
  $$('#yr').forEach(el => { el.textContent = new Date().getFullYear(); });
})();

/* ================================================================
   23. ACTIVE NAV LINK & SCROLL SPY
   ================================================================ */
(function initActiveNavAndScrollSpy() {
  const normalizePath = p => p.replace(/\/index\.html$/, '/').replace(/\/$/, '/');
  const currentPath = normalizePath(window.location.pathname);
  const page = currentPath.split('/').filter(Boolean).pop() || 'index.html';
  const isHome = currentPath === '/' || currentPath.endsWith('/AFAQ-Portfolio-Website/') || page === 'index.html';

  // 1. Initial Page Link Activation
  $$('#navbar .nav-links a, .mm-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;

    // Remove active class for anchor links if we're not using scroll spy on them
    if (href.startsWith('#')) {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
      return;
    }

    const hPage = href.split('/').pop().split('#')[0] || 'index.html';
    const isLinkHome = hPage === 'index.html' || hPage === '';
    const isMatch = (isHome && isLinkHome) || (!isHome && hPage === page);

    if (isMatch) {
      const hasHash = href.includes('#');
      if (hasHash) {
        const hashVal = href.split('#')[1];
        if (window.location.hash === '#' + hashVal) {
          a.classList.add('active');
          a.setAttribute('aria-current', 'page');
        } else {
          a.classList.remove('active');
          a.removeAttribute('aria-current');
        }
      } else {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    } else {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    }
  });

  // 2. Scroll Spy for Homepage Sections
  if (isHome && typeof IntersectionObserver !== 'undefined') {
    const sections = ['hero', 'services', 'blog'].map(id => document.getElementById(id)).filter(Boolean);
    
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
            } else {
              // Only clear active class on local section links or home link
              if (href === 'index.html' || href === '/' || href === '#services' || href === '#blog') {
                a.classList.remove('active');
                a.removeAttribute('aria-current');
              }
            }
          });
        }
      });
    }, { threshold: 0.35, rootMargin: '-20% 0px -50% 0px' });

    sections.forEach(s => spyObserver.observe(s));
  }
})();

/* ================================================================
   24. CONTACT FORM — validation + animated feedback
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
    const { el, err, msg } = fields[key];
    if (!el) return true;
    const val   = el.value.trim();
    const valid = val.length > 0 && (key !== 'email' || isEmail(val));
    if (err) err.textContent = valid ? '' : msg;
    el.style.borderColor = valid ? '' : '#ef4444';
    if (!valid) {
      // Shake animation
      el.style.animation = 'shake .35s ease';
      el.addEventListener('animationend', () => el.style.animation = '', { once: true });
    }
    return valid;
  }

  Object.keys(fields).forEach(k => {
    const { el } = fields[k];
    if (el) {
      on(el, 'blur',  () => validate(k));
      on(el, 'input', () => { if (el.style.borderColor) validate(k); });
    }
  });

  on(form, 'submit', async e => {
    e.preventDefault();
    const ok = Object.keys(fields).map(validate).every(Boolean);
    if (!ok) return;

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    const SERVICE_ID  = 'YOUR_SERVICE_ID';
    const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
    const PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

    try {
      if (window.emailjs && SERVICE_ID !== 'YOUR_SERVICE_ID') {
        await window.emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          from_name:  fields.name.el?.value.trim(),
          from_email: fields.email.el?.value.trim(),
          subject:    fields.subject.el?.value.trim(),
          message:    fields.message.el?.value.trim()
        }, PUBLIC_KEY);
      }
      if (formOk) {
        formOk.classList.add('show');
        formOk.style.animation = 'ldrLogoReveal .4s ease both';
      }
      form.reset();
      Object.keys(fields).forEach(k => { if (fields[k].el) fields[k].el.style.borderColor = ''; });
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Please reach out on LinkedIn.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Message`;
      }
    }
  });
})();

/* ================================================================
   25. SHAKE KEYFRAME (dynamically added)
   ================================================================ */
(function addShakeKeyframe() {
  const s = document.createElement('style');
  s.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`;
  document.head.appendChild(s);
})();

/* ================================================================
   26. FUTURISTIC ANTI-GRAVITY TIMELINE (particles & parallax)
   ================================================================ */
(function initAntiGravityTimeline() {
  const canvas = document.getElementById('gravity-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w = canvas.width = canvas.offsetWidth;
  let h = canvas.height = canvas.offsetHeight;

  const particles = [];
  const maxParticles = 50;

  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * h;
    }

    reset() {
      this.x = Math.random() * w;
      this.y = h + 10;
      this.r = Math.random() * 1.5 + 0.5;
      this.vy = -(Math.random() * 0.3 + 0.15);
      this.vx = Math.sin(Math.random() * Math.PI) * 0.12;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.pulseSpeed = Math.random() * 0.015 + 0.005;
      this.pulseDirection = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
      this.y += this.vy;
      this.x += this.vx;
      
      // Pulse alpha
      this.alpha += this.pulseDirection * this.pulseSpeed;
      if (this.alpha > 0.7) {
        this.pulseDirection = -1;
      } else if (this.alpha < 0.1) {
        this.pulseDirection = 1;
      }

      if (this.y < -10 || this.x < -10 || this.x > w + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  animate();

  // Resize handler
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  });

  // Interactive 3D Parallax camera movement
  const wrapper = document.querySelector('.timeline-gravity-section');
  const inner = document.querySelector('.gravity-timeline-wrapper');
  
  if (wrapper && inner && window.innerWidth > 768) {
    wrapper.addEventListener('mousemove', e => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const px = (x / rect.width) - 0.5;
      const py = (y / rect.height) - 0.5;
      
      inner.style.setProperty('--rx', `${py * -12}deg`);
      inner.style.setProperty('--ry', `${px * 12}deg`);
    });

    wrapper.addEventListener('mouseleave', () => {
      inner.style.setProperty('--rx', '0deg');
      inner.style.setProperty('--ry', '0deg');
    });
  }
})();
