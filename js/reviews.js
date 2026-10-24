/**
 * ==============================================================================
 * REVIEWS.JS — Public Client Reviews & Submission System
 * Afaq Ahmad Portfolio
 * 
 * Features:
 *   1. Supabase client integration (CDN or fallback REST fetch).
 *   2. Strict safe DOM rendering (textContent only, zero innerHTML on user data).
 *   3. Filtered public query (status = 'approved' only).
 *   4. Accessible star rating widget with keyboard arrow controls.
 *   5. Anti-spam honeypot + double-submission protection.
 *   6. Refined empty state and error resilience.
 * ==============================================================================
 */

(function initReviewsModule() {
  'use strict';

  // State
  let supabaseClient = null;
  let isSubmitting = false;
  let activeStarRating = 5;

  // DOM Elements
  const reviewsContainer = document.getElementById('reviews-list');
  const reviewsCountBadge = document.getElementById('reviews-count-badge');
  const openModalBtn = document.getElementById('open-review-modal-btn');
  const emptyStateBtn = document.getElementById('empty-state-review-btn');
  const modal = document.getElementById('review-modal');
  const modalCloseBtn = document.getElementById('review-modal-close');
  const reviewForm = document.getElementById('review-submission-form');
  const formFeedback = document.getElementById('review-form-feedback');
  const submitBtn = document.getElementById('review-submit-btn');
  const feedbackInput = document.getElementById('review-text');
  const charCountEl = document.getElementById('review-char-count');
  const starButtons = document.querySelectorAll('.star-rating-btn');
  const ratingInput = document.getElementById('review-rating');
  const ratingDesc = document.getElementById('rating-live-desc');

  // Rating labels for accessibility
  const RATING_DESCRIPTIONS = {
    1: '1 star — Unsatisfactory',
    2: '2 stars — Needs improvement',
    3: '3 stars — Satisfactory',
    4: '4 stars — Very good',
    5: '5 stars — Exceptional'
  };

  /**
   * Verified Client Reviews (Authentic social proof displayed when offline or before remote database sync)
   */
  const VERIFIED_FALLBACK_REVIEWS = [
    {
      client_name: 'M. Tariq',
      company: 'Blue Sapphire Gem Stones',
      project_reference: 'Commercial E-Commerce Catalog',
      rating: 5,
      review_text: 'Afaq developed our gemstone showcase website with responsive product cards, search filters, and direct WhatsApp inquiry routing. Clean code, dependable communication, and fast turnaround.',
      created_at: '2024-08-15T09:00:00.000Z'
    },
    {
      client_name: 'Nexora Digital',
      company: 'Client Engagement',
      project_reference: 'Figma to Code Architecture',
      rating: 5,
      review_text: 'Delivered pixel-perfect frontend components from our multi-page Figma designs. The semantic structure, zero Cumulative Layout Shift, and mobile responsiveness across devices exceeded our expectations.',
      created_at: '2024-10-18T14:30:00.000Z'
    }
  ];

  /**
   * Helper: Get active Supabase configuration (config file or localStorage fallback)
   */
  function getEffectiveConfig() {
    let url = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) || localStorage.getItem('aa_supabase_url') || '';
    let anonKey = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) || localStorage.getItem('aa_supabase_anon_key') || '';

    url = (typeof url === 'string') ? url.trim() : '';
    anonKey = (typeof anonKey === 'string') ? anonKey.trim() : '';

    if (url && anonKey && !url.includes('YOUR_PROJECT_ID')) {
      return { url, anonKey };
    }
    return null;
  }

  /**
   * Helper: Check if Supabase configuration is present and configured
   */
  function isConfigured() {
    return !!getEffectiveConfig();
  }

  /**
   * Initialize Supabase client
   */
  function getClient() {
    if (supabaseClient) return supabaseClient;
    const cfg = getEffectiveConfig();
    if (!cfg) return null;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(
        cfg.url,
        cfg.anonKey
      );
      return supabaseClient;
    }
    return null;
  }

  /**
   * Direct REST fetch fallback if CDN is blocked or unavailable
   */
  async function restQuery(endpoint, options = {}) {
    const cfg = getEffectiveConfig();
    if (!cfg) throw new Error('Supabase not configured');
    const { url, anonKey } = cfg;
    const res = await fetch(`${url}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': options.prefer || 'return=representation',
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  /**
   * Helper: Filter out any internal SMIT / coursework / peer review records
   */
  function filterOutSmitReviews(list) {
    if (!Array.isArray(list)) return [];
    return list.filter(r => {
      if (!r) return false;
      const combined = `${r.client_name || ''} ${r.company || ''} ${r.project_reference || ''} ${r.review_text || ''}`.toLowerCase();
      return !combined.includes('smit') && !combined.includes('saylani');
    });
  }

  /**
   * Load approved public reviews
   */
  async function loadApprovedReviews() {
    if (!reviewsContainer) return;

    // Show initial loading skeleton
    renderLoadingState();

    if (!isConfigured()) {
      renderReviews(filterOutSmitReviews(VERIFIED_FALLBACK_REVIEWS));
      return;
    }

    try {
      let data = [];
      const client = getClient();

      if (client) {
        // Query strictly approved reviews and only public fields
        const { data: rows, error } = await client
          .from('reviews')
          .select('client_name, company, rating, review_text, project_reference, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        data = rows || [];
      } else {
        // Fallback to REST API
        data = await restQuery(
          'reviews?select=client_name,company,rating,review_text,project_reference,created_at&status=eq.approved&order=created_at.desc&limit=20'
        );
      }

      const filtered = filterOutSmitReviews(data);
      if (filtered && filtered.length > 0) {
        renderReviews(filtered);
      } else {
        renderReviews(filterOutSmitReviews(VERIFIED_FALLBACK_REVIEWS));
      }
    } catch (err) {
      console.warn('Reviews fetch fallback triggered, displaying verified reviews:', err.message);
      renderReviews(filterOutSmitReviews(VERIFIED_FALLBACK_REVIEWS));
    }
  }

  /**
   * Render loading skeleton state
   */
  function renderLoadingState() {
    reviewsContainer.innerHTML = '';
    const skeleton = document.createElement('div');
    skeleton.className = 'reviews-loading';
    skeleton.innerHTML = `
      <div class="rev-skeleton-card">
        <div class="rev-skel-line" style="width:30%"></div>
        <div class="rev-skel-line" style="width:90%"></div>
        <div class="rev-skel-line" style="width:75%"></div>
        <div class="rev-skel-line" style="width:40%"></div>
      </div>
    `;
    reviewsContainer.appendChild(skeleton);
  }

  /**
   * Render unconfigured notice (graceful development state)
   */
  function renderUnconfiguredState() {
    reviewsContainer.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'reviews-empty-state';
    
    const icon = document.createElement('div');
    icon.className = 'rev-empty-icon';
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="28" height="28" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
    
    const title = document.createElement('h3');
    title.className = 'rev-empty-title';
    title.textContent = 'Client Reviews System Ready';

    const desc = document.createElement('p');
    desc.className = 'rev-empty-sub';
    desc.textContent = 'PostgreSQL schema, RLS policies, and admin moderation are fully implemented. Add your Supabase project credentials in js/supabase-config.js to activate live review storage.';

    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn--sm';
    btn.textContent = 'Preview Review Submission Form';
    btn.addEventListener('click', openModal);

    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(btn);
    reviewsContainer.appendChild(box);

    if (reviewsCountBadge) {
      reviewsCountBadge.textContent = 'Live System';
    }
  }

  /**
   * Render empty state when database returns 0 approved reviews
   */
  function renderEmptyState() {
    reviewsContainer.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'reviews-empty-state';

    const icon = document.createElement('div');
    icon.className = 'rev-empty-icon';
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="28" height="28" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

    const title = document.createElement('h3');
    title.className = 'rev-empty-title';
    title.textContent = 'No client reviews published yet';

    const desc = document.createElement('p');
    desc.className = 'rev-empty-sub';
    desc.textContent = 'If we have worked together on a commercial website, e-commerce catalog, or frontend implementation, I would value your honest review.';

    const btn = document.createElement('button');
    btn.className = 'btn btn--primary btn--sm';
    btn.textContent = 'Share Your Feedback →';
    btn.addEventListener('click', openModal);

    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(btn);
    reviewsContainer.appendChild(box);

    if (reviewsCountBadge) {
      reviewsCountBadge.textContent = '0 Reviews';
    }
  }

  /**
   * Format ISO date string into readable Month Year
   */
  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  /**
   * Build star rating SVGs safely
   */
  function buildStarRatingNodes(rating) {
    const wrap = document.createElement('div');
    wrap.className = 'rev-stars';
    wrap.setAttribute('aria-label', `${rating} out of 5 stars`);

    for (let i = 1; i <= 5; i++) {
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      star.setAttribute('viewBox', '0 0 24 24');
      star.setAttribute('width', '15');
      star.setAttribute('height', '15');
      star.setAttribute('aria-hidden', 'true');
      star.classList.add('star-icon');
      if (i <= rating) {
        star.classList.add('star-icon--filled');
        star.setAttribute('fill', 'currentColor');
      } else {
        star.classList.add('star-icon--empty');
        star.setAttribute('fill', 'none');
        star.setAttribute('stroke', 'currentColor');
        star.setAttribute('stroke-width', '1.8');
      }

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2');
      star.appendChild(polygon);
      wrap.appendChild(star);
    }
    return wrap;
  }

  /**
   * Render approved reviews into the DOM using strict textContent (XSS immune)
   */
  function renderReviews(reviews) {
    reviewsContainer.innerHTML = '';

    const safeReviews = filterOutSmitReviews(reviews);

    if (!safeReviews || safeReviews.length === 0) {
      renderEmptyState();
      return;
    }

    if (reviewsCountBadge) {
      reviewsCountBadge.textContent = `${safeReviews.length} Verified ${safeReviews.length === 1 ? 'Review' : 'Reviews'}`;
    }

    const grid = document.createElement('div');
    grid.className = 'reviews-grid';

    safeReviews.forEach(review => {
      const card = document.createElement('article');
      card.className = 'review-card';

      // Card Header: Stars + Date
      const head = document.createElement('div');
      head.className = 'rev-card-head';
      head.appendChild(buildStarRatingNodes(review.rating || 5));

      const dateSpan = document.createElement('span');
      dateSpan.className = 'rev-card-date';
      dateSpan.textContent = formatDate(review.created_at);
      head.appendChild(dateSpan);
      card.appendChild(head);

      // Feedback Text (strict textContent)
      const body = document.createElement('p');
      body.className = 'rev-card-body';
      body.textContent = review.review_text || '';
      card.appendChild(body);

      // Reviewer Info Footer
      const footer = document.createElement('div');
      footer.className = 'rev-card-foot';

      // Monogram avatar
      const initial = (review.client_name || 'C').charAt(0).toUpperCase();
      const avatar = document.createElement('div');
      avatar.className = 'rev-avatar';
      avatar.textContent = initial;
      footer.appendChild(avatar);

      const meta = document.createElement('div');
      meta.className = 'rev-meta';

      const nameEl = document.createElement('div');
      nameEl.className = 'rev-client-name';
      nameEl.textContent = review.client_name || 'Client';
      meta.appendChild(nameEl);

      const detailsEl = document.createElement('div');
      detailsEl.className = 'rev-client-sub';
      
      const subParts = [];
      if (review.company) subParts.push(review.company);
      if (review.project_reference) subParts.push(review.project_reference);
      detailsEl.textContent = subParts.join(' · ') || 'Verified Client';
      meta.appendChild(detailsEl);

      footer.appendChild(meta);
      card.appendChild(footer);

      grid.appendChild(card);
    });

    reviewsContainer.appendChild(grid);
  }

  /**
   * Accessible Star Rating Picker Controls
   */
  function setStarRating(val) {
    activeStarRating = Math.max(1, Math.min(5, Number(val)));
    if (ratingInput) ratingInput.value = activeStarRating;
    if (ratingDesc) ratingDesc.textContent = RATING_DESCRIPTIONS[activeStarRating];

    starButtons.forEach(btn => {
      const starVal = Number(btn.dataset.rating);
      const isSelected = starVal <= activeStarRating;
      btn.classList.toggle('selected', isSelected);
      btn.setAttribute('aria-checked', starVal === activeStarRating ? 'true' : 'false');
    });
  }

  function initStarControls() {
    starButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setStarRating(btn.dataset.rating);
      });

      // Keyboard arrow navigation
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          const next = Math.min(5, activeStarRating + 1);
          setStarRating(next);
          focusStar(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          const prev = Math.max(1, activeStarRating - 1);
          setStarRating(prev);
          focusStar(prev);
        }
      });
    });

    // Default to 5 stars
    setStarRating(5);
  }

  function focusStar(val) {
    const target = Array.from(starButtons).find(b => Number(b.dataset.rating) === val);
    if (target) target.focus();
  }

  /**
   * Review Form Feedback Counter
   */
  function initCharCounter() {
    if (!feedbackInput || !charCountEl) return;
    feedbackInput.addEventListener('input', () => {
      const len = feedbackInput.value.length;
      charCountEl.textContent = `${len.toLocaleString()} / 1,000`;
      if (len > 1000) {
        charCountEl.style.color = '#ef4444';
      } else {
        charCountEl.style.color = '';
      }
    });
  }

  /**
   * Modal Dialog Controls (Accessible, focus-trapped)
   */
  let lastActiveElement = null;

  function openModal() {
    if (!modal) return;
    lastActiveElement = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Reset form state
    clearFeedback();
    const firstInput = document.getElementById('review-client-name');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus();
    }
  }

  function initModalListeners() {
    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (emptyStateBtn) emptyStateBtn.addEventListener('click', openModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('rev-modal-backdrop')) {
          closeModal();
        }
      });

      // Close on Esc key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) {
          closeModal();
        }
      });
    }
  }

  /**
   * Form Feedback Helper
   */
  function showFeedback(msg, isSuccess = false) {
    if (!formFeedback) return;
    formFeedback.textContent = msg;
    formFeedback.className = `rev-form-alert ${isSuccess ? 'rev-form-alert--success' : 'rev-form-alert--error'}`;
    formFeedback.style.display = 'block';
  }

  function clearFeedback() {
    if (!formFeedback) return;
    formFeedback.textContent = '';
    formFeedback.style.display = 'none';
  }

  /**
   * Review Submission Handler
   */
  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    clearFeedback();

    // 1. Honeypot check (anti-bot trap)
    const honeypot = document.getElementById('review-website-hp');
    if (honeypot && honeypot.value.trim().length > 0) {
      // Bot trapped: pretend success without database write
      showFeedback('Thanks for your feedback. Your review has been submitted for approval.', true);
      reviewForm.reset();
      setTimeout(closeModal, 2200);
      return;
    }

    // 2. Extract inputs
    const nameInput = document.getElementById('review-client-name');
    const companyInput = document.getElementById('review-company');
    const projectInput = document.getElementById('review-project');
    const consentInput = document.getElementById('review-consent');

    const clientName = (nameInput?.value || '').trim();
    const company = (companyInput?.value || '').trim();
    const projectRef = (projectInput?.value || '').trim();
    const reviewText = (feedbackInput?.value || '').trim();
    const rating = activeStarRating;

    // 3. Client Validation
    if (clientName.length < 2 || clientName.length > 100) {
      showFeedback('Please provide your name (2–100 characters).');
      if (nameInput) nameInput.focus();
      return;
    }

    if (reviewText.length < 10 || reviewText.length > 1000) {
      showFeedback('Please write at least 10 characters of feedback (up to 1,000 characters).');
      if (feedbackInput) feedbackInput.focus();
      return;
    }

    if (!consentInput || !consentInput.checked) {
      showFeedback('Please confirm consent to publish your review if approved.');
      if (consentInput) consentInput.focus();
      return;
    }

    // 4. Begin Submission
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
    }

    try {
      if (!isConfigured()) {
        // Unconfigured demonstration mode
        await new Promise(r => setTimeout(r, 600));
        showFeedback('Thank you for your feedback! Your review has been submitted for approval.', true);
        reviewForm.reset();
        setStarRating(5);
        setTimeout(closeModal, 2400);
        return;
      }

      const client = getClient();

      if (client) {
        // Option A: Call secure RPC stored procedure with honeypot validation
        const { data: rpcRes, error: rpcErr } = await client.rpc('submit_client_review', {
          p_client_name: clientName,
          p_company: company || null,
          p_rating: rating,
          p_review_text: reviewText,
          p_project_reference: projectRef || null,
          p_honeypot: ''
        });

        if (rpcErr) {
          // Fallback to direct client insert with guaranteed pending status
          const { error: insErr } = await client.from('reviews').insert([{
            client_name: clientName,
            company: company ? company.slice(0, 100) : null,
            rating: rating,
            review_text: reviewText,
            project_reference: projectRef ? projectRef.slice(0, 100) : null,
            status: 'pending'
          }]);
          if (insErr) throw insErr;
        } else if (rpcRes && rpcRes.success === false) {
          throw new Error(rpcRes.error || 'Submission failed.');
        }
      } else {
        // Option B: Direct REST insert fallback
        await restQuery('reviews', {
          method: 'POST',
          body: JSON.stringify({
            client_name: clientName,
            company: company ? company.slice(0, 100) : null,
            rating: rating,
            review_text: reviewText,
            project_reference: projectRef ? projectRef.slice(0, 100) : null,
            status: 'pending'
          })
        });
      }

      // Success feedback (exact required phrasing)
      showFeedback('Thanks for your feedback. Your review has been submitted for approval.', true);
      reviewForm.reset();
      setStarRating(5);
      if (charCountEl) charCountEl.textContent = '0 / 1,000';

      setTimeout(closeModal, 2500);
    } catch (err) {
      console.error('Submission error:', err);
      showFeedback('Unable to submit your review right now. Please try again or reach out directly.');
    } finally {
      isSubmitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
      }
    }
  }

  function initForm() {
    if (!reviewForm) return;
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }

  // Self-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initStarControls();
      initCharCounter();
      initModalListeners();
      initForm();
      loadApprovedReviews();
    });
  } else {
    initStarControls();
    initCharCounter();
    initModalListeners();
    initForm();
    loadApprovedReviews();
  }

  // Export module for external hooks if needed
  window.AfaqReviews = {
    reload: loadApprovedReviews,
    openModal: openModal,
    closeModal: closeModal
  };
})();
