/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXACT REPLICA: DEVELOPER PORTFOLIO INTRO ANIMATION CONTROLLER
 * Reference: website intro video example/intro video.mp4
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Check reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const el = document.getElementById('portfolio-intro');
    if (el) el.remove();
    return;
  }

  // Check URL overrides: ?intro=1 or ?replay=true
  const urlParams = new URLSearchParams(window.location.search);
  const forceIntro = urlParams.has('intro') || urlParams.has('replay');

  // Check session storage
  const introSeen = sessionStorage.getItem('afaq_portfolio_intro_seen');
  if (introSeen === 'true' && !forceIntro) {
    const el = document.getElementById('portfolio-intro');
    if (el) {
      el.classList.add('intro-dismissed');
      el.style.display = 'none';
    }
    return;
  }

  // Lock body scroll while intro is playing
  document.body.classList.add('intro-active');

  document.addEventListener('DOMContentLoaded', function () {
    const introEl = document.getElementById('portfolio-intro');
    if (!introEl) return;

    const audioEl = document.getElementById('intro-bg-audio');
    const soundBtn = document.getElementById('intro-sound');
    const soundText = document.getElementById('intro-sound-text');
    const skipBtn = document.getElementById('intro-skip');
    const canvas = document.getElementById('intro-canvas');
    const ball = document.getElementById('intro-ball');
    const lettersBox = document.getElementById('intro-letters-box');
    const letters = lettersBox ? Array.from(lettersBox.querySelectorAll('.intro-bouncing-letter')) : [];
    const portfolioBox = document.getElementById('intro-portfolio-box');
    const portraitWrap = document.getElementById('intro-portrait-wrap');
    const header = document.getElementById('intro-header');
    const timelineFill = document.getElementById('intro-timeline-fill');
    const explorePrompt = document.getElementById('intro-explore-prompt');

    let isDismissed = false;
    let animFrameId = null;
    let soundActive = false;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. AUDIO CONTROLLER (Original audio track from reference video)
    // ─────────────────────────────────────────────────────────────────────────
    function toggleAudio() {
      if (!audioEl) return;
      if (soundActive) {
        audioEl.pause();
        soundActive = false;
        if (soundText) soundText.textContent = 'Sound Off';
        if (soundBtn) {
          soundBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg> <span>Sound</span>`;
        }
      } else {
        audioEl.currentTime = 0;
        audioEl.play().then(() => {
          soundActive = true;
          if (soundText) soundText.textContent = 'Sound On';
          if (soundBtn) {
            soundBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg> <span>Sound On</span>`;
          }
        }).catch(() => {
          // Browser prevented autoplay
        });
      }
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudio();
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. 3D PARTICLE STARFIELD (Video Frame 00:04)
    // ─────────────────────────────────────────────────────────────────────────
    const ctx = canvas ? canvas.getContext('2d') : null;
    let width = 0;
    let height = 0;
    const stars = [];

    function resizeCanvas() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize 200 twinkling space stars
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * (height || window.innerHeight),
        radius: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.85 + 0.15,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        color: Math.random() > 0.8 ? '#477568' : '#ffffff'
      });
    }

    function renderStarfield() {
      if (!ctx || isDismissed) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.alpha += s.twinkleSpeed;
        if (s.alpha > 1 || s.alpha < 0.15) {
          s.twinkleSpeed = -s.twinkleSpeed;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animFrameId = requestAnimationFrame(renderStarfield);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. LETTER CATAPULT & BOUNCE PHYSICS (Video Frame 00:01 - 00:02)
    // ─────────────────────────────────────────────────────────────────────────
    // Set initial catapult positions for letters A - F - A - Q
    const letterTrajectories = [
      { startX: -120, startY: -160, rot: -28 },
      { startX: -40,  startY: -210, rot: -12 },
      { startX: 40,   startY: -200, rot: 15 },
      { startX: 130,  startY: -150, rot: 25 }
    ];

    letters.forEach((letter, i) => {
      const traj = letterTrajectories[i] || { startX: 0, startY: -180, rot: 0 };
      letter.style.transform = `translate(${traj.startX}px, ${traj.startY}px) rotate(${traj.rot}deg) scale(0.6)`;
      letter.style.opacity = '0';
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CHOREOGRAPHED TIMELINE (Exact match to reference video)
    // ─────────────────────────────────────────────────────────────────────────
    const TOTAL_MS = 6200;
    const startStamp = performance.now();

    function updateTimeline(now) {
      if (isDismissed) return;
      const elapsed = now - startStamp;
      const pct = Math.min(100, (elapsed / TOTAL_MS) * 100);
      if (timelineFill) timelineFill.style.width = pct + '%';
      if (elapsed < TOTAL_MS) {
        requestAnimationFrame(updateTimeline);
      }
    }
    requestAnimationFrame(updateTimeline);

    // [0.0s - 0.8s]: White Ball pulses in center void
    // [0.8s]: Ball compresses, then catapults letters A F A Q
    const t1 = setTimeout(() => {
      if (isDismissed) return;
      if (ball) {
        ball.style.transform = 'translate(-50%, -40%) scale(1.4, 0.6)';
        setTimeout(() => {
          ball.style.transform = 'translate(-50%, -70%) scale(0.8, 1.3)';
          setTimeout(() => {
            ball.classList.add('is-hidden');
          }, 250);
        }, 150);
      }

      // Letters shoot out and snap into horizontal line
      letters.forEach((letter, index) => {
        setTimeout(() => {
          if (isDismissed) return;
          letter.style.opacity = '1';
          letter.style.transform = 'translate(0, 0) rotate(0deg) scale(1)';
        }, index * 90);
      });
    }, 800);

    // [2.1s]: Letters disappear -> "PORTFOLIO" with Subtitle & Contact appears!
    const t2 = setTimeout(() => {
      if (isDismissed) return;
      if (lettersBox) {
        lettersBox.style.opacity = '0';
        lettersBox.style.transform = 'translate(-50%, -50%) scale(1.1)';
        lettersBox.style.transition = 'all 0.3s ease';
      }

      if (portfolioBox) {
        portfolioBox.classList.add('is-visible');
      }
    }, 2100);

    // [3.2s]: Dense space particle field explodes into view
    const t3 = setTimeout(() => {
      if (isDismissed) return;
      if (canvas) {
        canvas.classList.add('stars-active');
        renderStarfield();
      }
    }, 3200);

    // [4.2s]: Digital particle portrait of Afaq Ahmad emerges behind PORTFOLIO
    const t4 = setTimeout(() => {
      if (isDismissed) return;
      if (portraitWrap) {
        portraitWrap.classList.add('is-visible');
      }
    }, 4200);

    // [4.8s]: Top navigation bar slides down (AFAQ AHMAD & links)
    const t5 = setTimeout(() => {
      if (isDismissed) return;
      if (header) {
        header.classList.add('is-visible');
      }
      if (explorePrompt) {
        explorePrompt.classList.add('is-visible');
      }
    }, 4800);

    // ─────────────────────────────────────────────────────────────────────────
    // 5. DISMISS / SHUTTER TRANSITION TO HOMEPAGE
    // ─────────────────────────────────────────────────────────────────────────
    function dismissIntro(instant = false) {
      if (isDismissed) return;
      isDismissed = true;

      sessionStorage.setItem('afaq_portfolio_intro_seen', 'true');

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);

      if (audioEl && soundActive) {
        // Smooth audio fade out
        let vol = 1;
        const fade = setInterval(() => {
          vol -= 0.15;
          if (vol <= 0.05) {
            audioEl.pause();
            clearInterval(fade);
          } else {
            audioEl.volume = vol;
          }
        }, 50);
      }

      if (instant) {
        introEl.classList.add('intro-dismissed');
        document.body.classList.remove('intro-active');
        if (animFrameId) cancelAnimationFrame(animFrameId);
        setTimeout(() => {
          introEl.style.display = 'none';
        }, 300);
        return;
      }

      // Shutter split transition
      introEl.classList.add('intro-opening');

      setTimeout(() => {
        introEl.classList.add('intro-dismissed');
        document.body.classList.remove('intro-active');
        if (animFrameId) cancelAnimationFrame(animFrameId);
        setTimeout(() => {
          introEl.style.display = 'none';
        }, 500);
      }, 850);
    }

    // Event listeners for skipping / exploring
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissIntro(false);
      });
    }

    if (explorePrompt) {
      explorePrompt.addEventListener('click', () => {
        dismissIntro(false);
      });
    }

    // Scroll to enter homepage
    window.addEventListener('wheel', (e) => {
      if (!isDismissed && e.deltaY > 15) {
        dismissIntro(false);
      }
    }, { passive: true });

    // Touch swipe up on mobile
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        const deltaY = touchStartY - e.changedTouches[0].clientY;
        if (!isDismissed && deltaY > 40) {
          dismissIntro(false);
        }
      }
    }, { passive: true });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (isDismissed) return;
      if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space' || e.key === 'ArrowDown') {
        e.preventDefault();
        dismissIntro(false);
      }
    });

    // Global Replay function
    window.replayIntro = function () {
      sessionStorage.removeItem('afaq_portfolio_intro_seen');
      window.location.href = window.location.pathname + '?intro=1';
    };
  });
})();
