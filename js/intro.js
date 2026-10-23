/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CINEMATIC DEVELOPER INTRO & ENTRANCE ANIMATION CONTROLLER
 * Portfolio of Afaq Ahmad (Peshawar, Pakistan)
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    const introEl = document.getElementById('portfolio-intro');
    if (introEl) introEl.remove();
    return;
  }

  // Check URL override for previewing: e.g. index.html?intro=1 or index.html?replay=true
  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.has('intro') || urlParams.has('replay');

  // Check if intro was already seen in this session
  const introSeen = sessionStorage.getItem('afaq_portfolio_intro_seen');
  if (introSeen === 'true' && !forceIntro) {
    const introEl = document.getElementById('portfolio-intro');
    if (introEl) {
      introEl.classList.add('intro-dismissed');
      introEl.style.display = 'none';
    }
    return;
  }

  // Prevent background scrolling while intro is active
  document.body.classList.add('intro-active');

  // Audio synthesizer state
  let audioCtx = null;
  let soundEnabled = false;

  function initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    } catch (e) {
      // Audio not supported
    }
  }

  function playSynthSwoosh(freqStart = 150, freqEnd = 450, duration = 0.4, type = 'sine') {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playChime(freq = 520, duration = 0.6) {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', function () {
    const introEl = document.getElementById('portfolio-intro');
    if (!introEl) return;

    const canvas = document.getElementById('intro-canvas');
    const skipBtn = document.getElementById('intro-skip');
    const soundBtn = document.getElementById('intro-sound');
    const coreDot = document.getElementById('intro-core-dot');
    const nameWrap = document.getElementById('intro-name-wrap');
    const portfolioWrap = document.getElementById('intro-portfolio-wrap');
    const progressFill = document.getElementById('intro-progress-fill');
    const letters = nameWrap ? Array.from(nameWrap.querySelectorAll('.intro-letter')) : [];

    let isDismissed = false;
    let animFrameId = null;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. STARFIELD & PARTICLE CANVAS
    // ─────────────────────────────────────────────────────────────────────────
    const ctx = canvas ? canvas.getContext('2d') : null;
    let width = 0;
    let height = 0;
    const stars = [];
    const sparks = [];
    let shockwave = null;
    let warpSpeed = 1;

    function resizeCanvas() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize 130 3D drifting stars
    const STAR_COUNT = 130;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1600,
        z: Math.random() * 1000 + 1,
        size: Math.random() * 1.6 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        color: Math.random() > 0.6 ? '#5ca392' : Math.random() > 0.85 ? '#d5a65a' : '#f4f1e8'
      });
    }

    function triggerShockwave(x, y) {
      shockwave = {
        x: x || width / 2,
        y: y || height / 2,
        radius: 10,
        maxRadius: Math.max(width, height) * 0.85,
        opacity: 0.9,
        lineWidth: 6
      };

      // Spawn 60 bright particle sparks
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 3;
        sparks.push({
          x: shockwave.x,
          y: shockwave.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 1.2,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015,
          color: Math.random() > 0.5 ? '#f4f1e8' : Math.random() > 0.7 ? '#d5a65a' : '#5ca392'
        });
      }
    }

    function renderCanvas() {
      if (!ctx || isDismissed) return;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw and update stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.z -= 2.2 * warpSpeed;
        if (s.z <= 0) {
          s.z = 1000;
          s.x = (Math.random() - 0.5) * 1600;
          s.y = (Math.random() - 0.5) * 1600;
        }

        const k = 400 / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const depthAlpha = Math.min(1, (1 - s.z / 1000) * s.alpha);
          const size = Math.max(0.6, s.size * k);

          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = depthAlpha;
          ctx.fill();

          // Star streak on warp
          if (warpSpeed > 1.5) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - (s.x * k * 0.08), py - (s.y * k * 0.08));
            ctx.strokeStyle = s.color;
            ctx.lineWidth = size * 0.7;
            ctx.stroke();
          }
        }
      }

      // Draw shockwave
      if (shockwave) {
        ctx.beginPath();
        ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(92, 163, 146, ${shockwave.opacity})`;
        ctx.lineWidth = shockwave.lineWidth;
        ctx.stroke();

        shockwave.radius += 18;
        shockwave.opacity *= 0.95;
        shockwave.lineWidth = Math.max(1, shockwave.lineWidth * 0.96);

        if (shockwave.opacity <= 0.01 || shockwave.radius >= shockwave.maxRadius) {
          shockwave = null;
        }
      }

      // Draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vx *= 0.96;
        sp.vy *= 0.96;
        sp.alpha -= sp.decay;

        if (sp.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animFrameId = requestAnimationFrame(renderCanvas);
    }
    renderCanvas();

    // ─────────────────────────────────────────────────────────────────────────
    // 2. KINETIC LETTER POSITIONS (SCATTER -> SNAP)
    // ─────────────────────────────────────────────────────────────────────────
    // Store random scatter offsets for each letter
    letters.forEach((letter) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 260 + 140;
      const rx = Math.cos(angle) * distance;
      const ry = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 140;

      letter.dataset.scatterX = rx;
      letter.dataset.scatterY = ry;
      letter.dataset.scatterRot = rot;

      // Start scattered and invisible
      letter.style.transform = `translate(${rx}px, ${ry}px) rotate(${rot}deg) scale(0)`;
      letter.style.opacity = '0';
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. PHASE CHOREOGRAPHY TIMELINE
    // ─────────────────────────────────────────────────────────────────────────
    const startTime = performance.now();
    const TOTAL_DURATION = 4200; // ms

    // Progress bar update
    function updateProgress(now) {
      if (isDismissed) return;
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / TOTAL_DURATION) * 100);
      if (progressFill) progressFill.style.width = pct + '%';
      if (elapsed < TOTAL_DURATION) {
        requestAnimationFrame(updateProgress);
      }
    }
    requestAnimationFrame(updateProgress);

    // Timeline phases:
    // T = 700ms: Core explodes, sparks burst, letters snap into place
    const t1 = setTimeout(() => {
      if (isDismissed) return;
      if (coreDot) {
        coreDot.style.transform = 'scale(2.5)';
        coreDot.style.opacity = '0';
      }
      triggerShockwave();
      playSynthSwoosh(220, 640, 0.5, 'triangle');

      if (nameWrap) nameWrap.classList.add('is-visible');

      // Animate letters snapping inward magnetically
      letters.forEach((letter, idx) => {
        setTimeout(() => {
          if (isDismissed) return;
          letter.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
          letter.style.opacity = '1';
          if (idx === letters.length - 1) {
            playChime(660, 0.5);
          }
        }, idx * 45);
      });
    }, 700);

    // T = 2000ms: Name morphs / transitions into "PORTFOLIO" title
    const t2 = setTimeout(() => {
      if (isDismissed) return;
      warpSpeed = 2.2;
      playSynthSwoosh(350, 880, 0.45, 'sine');

      if (nameWrap) {
        nameWrap.classList.remove('is-visible');
        nameWrap.classList.add('is-hidden');
      }

      if (portfolioWrap) {
        portfolioWrap.classList.add('is-visible');
      }
      playChime(784, 0.6);
    }, 2000);

    // T = 3100ms: Second shockwave and warp acceleration
    const t3 = setTimeout(() => {
      if (isDismissed) return;
      warpSpeed = 4.5;
      triggerShockwave();
      playSynthSwoosh(200, 520, 0.6, 'sawtooth');
    }, 3100);

    // T = 3700ms: Trigger shutter curtain split
    const t4 = setTimeout(() => {
      dismissIntro(false);
    }, 3700);

    // ─────────────────────────────────────────────────────────────────────────
    // 4. DISMISS / EXIT CONTROLLER
    // ─────────────────────────────────────────────────────────────────────────
    function dismissIntro(instant = false) {
      if (isDismissed) return;
      isDismissed = true;

      // Mark session storage so intro doesn't trigger on internal page reloads
      sessionStorage.setItem('afaq_portfolio_intro_seen', 'true');

      // Clear timeouts
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);

      if (instant) {
        introEl.classList.add('intro-dismissed');
        document.body.classList.remove('intro-active');
        if (animFrameId) cancelAnimationFrame(animFrameId);
        setTimeout(() => {
          introEl.style.display = 'none';
        }, 300);
        return;
      }

      // Shutter opening animation
      introEl.classList.add('intro-opening');
      playSynthSwoosh(180, 720, 0.5, 'sine');

      setTimeout(() => {
        introEl.classList.add('intro-dismissed');
        document.body.classList.remove('intro-active');
        if (animFrameId) cancelAnimationFrame(animFrameId);
        setTimeout(() => {
          introEl.style.display = 'none';
        }, 500);
      }, 850);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. INTERACTIVE EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissIntro(false);
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        initAudio();
        soundEnabled = !soundEnabled;
        soundBtn.setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound');
        soundBtn.innerHTML = soundEnabled
          ? `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`
          : `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
        if (soundEnabled) {
          playChime(660, 0.4);
        }
      });
    }

    // Keyboard shortcuts (Escape or Space to skip)
    window.addEventListener('keydown', (e) => {
      if (isDismissed) return;
      if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        dismissIntro(false);
      }
    });

    // Expose replay function globally for navbar / testing
    window.replayIntro = function () {
      sessionStorage.removeItem('afaq_portfolio_intro_seen');
      window.location.href = window.location.pathname + '?intro=1';
    };
  });
})();
