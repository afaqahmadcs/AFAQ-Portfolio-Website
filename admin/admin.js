/* ================================================================
   ADMIN.JS — REVIEW MODERATION PORTAL CONTROLLER
   Afaq Ahmad Developer Portfolio
   Vanilla ESNext, Strict Security & PostgreSQL RLS Enforcement
   ================================================================ */
'use strict';

(function () {
  // DOM Cache
  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

  // Views
  const views = {
    loading: $('#view-loading'),
    signin: $('#view-signin'),
    unauthorized: $('#view-unauthorized'),
    dashboard: $('#view-dashboard')
  };

  // State
  let supabaseClient = null;
  let currentUser = null;
  let allReviews = [];
  let currentFilter = 'pending';
  let searchQuery = '';
  let pendingDeleteReview = null;

  /* ── 1. THEME SUPPORT ─────────────────────────────────────────── */
  function initTheme() {
    const html = document.documentElement;
    const btn = $('#theme-btn');
    const sun = $('#ic-sun');
    const moon = $('#ic-moon');

    const savedTheme = localStorage.getItem('aa-theme');
    const osPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(savedTheme || osPref);

    function applyTheme(theme) {
      html.setAttribute('data-theme', theme);
      localStorage.setItem('aa-theme', theme);
      if (sun && moon) {
        sun.style.display = theme === 'dark' ? 'none' : 'block';
        moon.style.display = theme === 'dark' ? 'block' : 'none';
      }
    }

    if (btn) {
      btn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  /* ── 2. VIEW SWITCHER ─────────────────────────────────────────── */
  function showView(viewKey) {
    Object.keys(views).forEach(k => {
      if (views[k]) {
        views[k].style.display = (k === viewKey) ? '' : 'none';
      }
    });

    const userMenu = $('#admin-user-menu');
    if (userMenu) {
      userMenu.style.display = (viewKey === 'dashboard') ? 'flex' : 'none';
    }
  }

  /* ── 3. NOTIFICATION TOAST ────────────────────────────────────── */
  let notifTimeout = null;
  function showNotification(message, type = 'info') {
    const notif = $('#admin-notification');
    const notifMsg = $('#admin-notif-message');
    if (!notif || !notifMsg) return;

    if (notifTimeout) clearTimeout(notifTimeout);

    notifMsg.textContent = message;
    notif.className = 'admin-notification';
    if (type === 'success') notif.classList.add('notif-success');
    if (type === 'error') notif.classList.add('notif-error');

    notif.style.display = 'flex';

    notifTimeout = setTimeout(() => {
      notif.style.display = 'none';
    }, 5000);
  }

  const notifClose = $('#admin-notif-dismiss');
  if (notifClose) {
    notifClose.addEventListener('click', () => {
      const notif = $('#admin-notification');
      if (notif) notif.style.display = 'none';
    });
  }

  /* ── 4. SUPABASE INITIALIZATION ───────────────────────────────── */
  function initSupabase() {
    const config = window.SUPABASE_CONFIG;
    if (!config || !config.url || !config.anonKey || config.url.includes('YOUR_PROJECT_ID')) {
      const alert = $('#admin-config-alert');
      if (alert) alert.style.display = 'flex';
      showView('signin');
      return null;
    }

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('[Admin] Supabase JS library failed to load.');
      showNotification('Supabase CDN library could not be loaded. Please check your network connection.', 'error');
      return null;
    }

    try {
      return window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (err) {
      console.error('[Admin] Failed to initialize Supabase client:', err);
      return null;
    }
  }

  /* ── 5. AUTHENTICATION & AUTHORIZATION ────────────────────────── */
  async function checkAuth() {
    if (!supabaseClient) {
      showView('signin');
      return;
    }

    showView('loading');

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error || !session || !session.user) {
        currentUser = null;
        showView('signin');
        return;
      }

      currentUser = session.user;
      $('#admin-user-email').textContent = currentUser.email || 'Admin';

      // Verify Admin Allowlist Status
      const isAuthorized = await verifyAdminStatus(currentUser.id);
      if (!isAuthorized) {
        // Authenticated non-admin
        $('#unauth-user-email').textContent = currentUser.email || 'Unknown';
        $('#unauth-user-id').textContent = currentUser.id || 'YOUR-USER-UUID';
        showView('unauthorized');
        return;
      }

      // Authorized Administrator
      showView('dashboard');
      await loadReviews();
    } catch (err) {
      console.error('[Admin] Auth check exception:', err);
      showView('signin');
    }
  }

  /**
   * Verify if the authenticated user has an entry in public.admin_users
   * Checks via RPC 'is_admin' or querying the admin_users table directly under RLS
   */
  async function verifyAdminStatus(userId) {
    if (!supabaseClient || !userId) return false;

    // Method 1: Check RPC function
    try {
      const { data, error } = await supabaseClient.rpc('is_admin');
      if (!error && typeof data === 'boolean') {
        return data;
      }
    } catch (_) {
      // Fallback to table query if RPC is not deployed yet
    }

    // Method 2: Direct table check under RLS
    try {
      const { data, error } = await supabaseClient
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data && data.user_id) {
        return true;
      }
    } catch (_) {}

    return false;
  }

  /* ── 6. SIGN IN / SIGN OUT FORMS ──────────────────────────────── */
  function initAuthForms() {
    // Sign In Form
    const signinForm = $('#admin-signin-form');
    if (signinForm) {
      signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = $('#signin-error');
        const submitBtn = $('#signin-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');

        errEl.style.display = 'none';
        errEl.textContent = '';

        if (!supabaseClient) {
          errEl.textContent = 'Supabase client is not configured. Update js/supabase-config.js first.';
          errEl.style.display = 'block';
          return;
        }

        const email = $('#signin-email').value.trim();
        const password = $('#signin-password').value;

        if (!email || !password) {
          errEl.textContent = 'Please enter both your email address and password.';
          errEl.style.display = 'block';
          return;
        }

        // Disable button & show spinner
        submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-block';

        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            errEl.textContent = error.message || 'Authentication failed. Please verify credentials.';
            errEl.style.display = 'block';
            return;
          }

          if (data && data.user) {
            currentUser = data.user;
            await checkAuth();
          }
        } catch (err) {
          errEl.textContent = 'An unexpected network error occurred. Please try again.';
          errEl.style.display = 'block';
        } finally {
          submitBtn.disabled = false;
          if (btnText) btnText.style.display = '';
          if (btnSpinner) btnSpinner.style.display = 'none';
        }
      });
    }

    // Sign Out Buttons
    const handleSignOut = async () => {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      currentUser = null;
      allReviews = [];
      showView('signin');
      showNotification('Signed out successfully.', 'info');
    };

    const signoutBtn = $('#admin-signout-btn');
    if (signoutBtn) signoutBtn.addEventListener('click', handleSignOut);

    const unauthSignoutBtn = $('#unauth-signout-btn');
    if (unauthSignoutBtn) unauthSignoutBtn.addEventListener('click', handleSignOut);

    const unauthRetryBtn = $('#unauth-retry-btn');
    if (unauthRetryBtn) {
      unauthRetryBtn.addEventListener('click', () => {
        checkAuth();
      });
    }
  }

  /* ── 7. LOAD REVIEWS FROM SUPABASE ────────────────────────────── */
  async function loadReviews() {
    if (!supabaseClient) return;

    const queueLoading = $('#queue-loading');
    const queueEmpty = $('#queue-empty');
    const queueList = $('#queue-list');

    if (queueLoading) queueLoading.style.display = 'flex';
    if (queueEmpty) queueEmpty.style.display = 'none';
    if (queueList) queueList.innerHTML = '';

    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Admin] Error fetching reviews:', error);
        showNotification(`Failed to load reviews: ${error.message}`, 'error');
        if (queueLoading) queueLoading.style.display = 'none';
        return;
      }

      allReviews = data || [];
      updateMetrics();
      renderFilteredQueue();
    } catch (err) {
      console.error('[Admin] Query exception:', err);
      showNotification('An error occurred while communicating with the database.', 'error');
    } finally {
      if (queueLoading) queueLoading.style.display = 'none';
    }
  }

  /* ── 8. UPDATE METRICS COUNTERS ───────────────────────────────── */
  function updateMetrics() {
    const pendingCount = allReviews.filter(r => r.status === 'pending').length;
    const approvedCount = allReviews.filter(r => r.status === 'approved').length;
    const rejectedCount = allReviews.filter(r => r.status === 'rejected').length;
    const totalCount = allReviews.length;

    // Metric cards
    const elPending = $('#metric-pending-count');
    const elApproved = $('#metric-approved-count');
    const elRejected = $('#metric-rejected-count');
    const elTotal = $('#metric-total-count');

    if (elPending) elPending.textContent = pendingCount;
    if (elApproved) elApproved.textContent = approvedCount;
    if (elRejected) elRejected.textContent = rejectedCount;
    if (elTotal) elTotal.textContent = totalCount;

    // Tab badges
    const tabPending = $('#badge-tab-pending');
    const tabApproved = $('#badge-tab-approved');
    const tabRejected = $('#badge-tab-rejected');
    const tabAll = $('#badge-tab-all');

    if (tabPending) tabPending.textContent = pendingCount;
    if (tabApproved) tabApproved.textContent = approvedCount;
    if (tabRejected) tabRejected.textContent = rejectedCount;
    if (tabAll) tabAll.textContent = totalCount;
  }

  /* ── 9. RENDER FILTERED QUEUE (SAFE DOM CONSTRUCTION) ─────────── */
  function renderFilteredQueue() {
    const queueList = $('#queue-list');
    const queueEmpty = $('#queue-empty');
    if (!queueList) return;

    // Filter by tab
    let filtered = allReviews.filter(r => {
      if (currentFilter === 'all') return true;
      return r.status === currentFilter;
    });

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const nameMatch = (r.client_name || '').toLowerCase().includes(q);
        const orgMatch = (r.company || '').toLowerCase().includes(q);
        const textMatch = (r.review_text || '').toLowerCase().includes(q);
        const projMatch = (r.project_reference || '').toLowerCase().includes(q);
        return nameMatch || orgMatch || textMatch || projMatch;
      });
    }

    queueList.innerHTML = '';

    if (filtered.length === 0) {
      if (queueEmpty) {
        queueEmpty.style.display = 'flex';
        const emptyTitle = $('#queue-empty-title');
        const emptyDesc = $('#queue-empty-desc');
        if (emptyTitle && emptyDesc) {
          if (searchQuery) {
            emptyTitle.textContent = 'No matching reviews found';
            emptyDesc.textContent = `No reviews match "${searchQuery}". Try a different search term.`;
          } else if (currentFilter === 'pending') {
            emptyTitle.textContent = 'No pending reviews';
            emptyDesc.textContent = 'The moderation queue is all caught up. All submitted reviews have been moderated.';
          } else if (currentFilter === 'approved') {
            emptyTitle.textContent = 'No approved reviews';
            emptyDesc.textContent = 'No reviews have been approved for public display yet.';
          } else if (currentFilter === 'rejected') {
            emptyTitle.textContent = 'No rejected reviews';
            emptyDesc.textContent = 'No reviews have been marked as rejected.';
          } else {
            emptyTitle.textContent = 'No reviews found';
            emptyDesc.textContent = 'The database currently contains no client reviews.';
          }
        }
      }
      return;
    }

    if (queueEmpty) queueEmpty.style.display = 'none';

    // Render cards safely via textContent
    filtered.forEach(review => {
      const card = buildReviewCard(review);
      queueList.appendChild(card);
    });
  }

  /**
   * Builds an individual review card with safe DOM methods.
   * Completely avoids innerHTML for user inputs to prevent XSS.
   */
  function buildReviewCard(review) {
    const card = document.createElement('article');
    card.className = `admin-rev-card card-${review.status}`;
    card.setAttribute('role', 'listitem');
    card.dataset.id = review.id;

    // ── Head section ──
    const head = document.createElement('div');
    head.className = 'admin-rev-head';

    const authorGroup = document.createElement('div');
    authorGroup.className = 'admin-rev-author-group';

    const nameEl = document.createElement('strong');
    nameEl.className = 'admin-rev-name';
    nameEl.textContent = review.client_name || 'Anonymous Reviewer';
    authorGroup.appendChild(nameEl);

    if (review.company) {
      const orgEl = document.createElement('span');
      orgEl.className = 'admin-rev-org';
      orgEl.textContent = review.company;
      authorGroup.appendChild(orgEl);
    }
    head.appendChild(authorGroup);

    const statusGroup = document.createElement('div');
    statusGroup.className = 'admin-rev-status-group';

    if (review.project_reference) {
      const projEl = document.createElement('span');
      projEl.className = 'admin-rev-project';
      projEl.textContent = `Ref: ${review.project_reference}`;
      statusGroup.appendChild(projEl);
    }

    const badge = document.createElement('span');
    badge.className = `badge-status badge-status-${review.status}`;
    badge.textContent = review.status;
    statusGroup.appendChild(badge);

    head.appendChild(statusGroup);
    card.appendChild(head);

    // ── Rating & Date section ──
    const ratingStrip = document.createElement('div');
    ratingStrip.className = 'admin-rev-rating';

    const starsBox = document.createElement('div');
    starsBox.className = 'admin-stars';
    starsBox.setAttribute('aria-label', `Rating: ${review.rating} of 5 stars`);

    const rCount = Math.max(1, Math.min(5, parseInt(review.rating, 10) || 5));
    for (let i = 1; i <= 5; i++) {
      const starSvg = createStarSvg(i <= rCount);
      starsBox.appendChild(starSvg);
    }
    ratingStrip.appendChild(starsBox);

    const score = document.createElement('span');
    score.className = 'admin-rating-score';
    score.textContent = `${rCount} / 5`;
    ratingStrip.appendChild(score);

    const dateEl = document.createElement('time');
    dateEl.className = 'admin-rev-date';
    dateEl.dateTime = review.created_at || '';
    dateEl.textContent = formatDate(review.created_at);
    ratingStrip.appendChild(dateEl);

    card.appendChild(ratingStrip);

    // ── Feedback Body ──
    const bodyText = document.createElement('div');
    bodyText.className = 'admin-rev-text';
    bodyText.textContent = review.review_text || '';
    card.appendChild(bodyText);

    // ── Action Buttons ──
    const actions = document.createElement('div');
    actions.className = 'admin-rev-actions';

    if (review.status === 'pending') {
      const approveBtn = document.createElement('button');
      approveBtn.className = 'admin-btn admin-btn-success admin-btn-sm';
      approveBtn.type = 'button';
      approveBtn.textContent = 'Approve Review';
      approveBtn.addEventListener('click', () => updateReviewStatus(review.id, 'approved', approveBtn));
      actions.appendChild(approveBtn);

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'admin-btn admin-btn-secondary admin-btn-sm';
      rejectBtn.type = 'button';
      rejectBtn.textContent = 'Reject Review';
      rejectBtn.addEventListener('click', () => updateReviewStatus(review.id, 'rejected', rejectBtn));
      actions.appendChild(rejectBtn);
    } else if (review.status === 'approved') {
      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'admin-btn admin-btn-secondary admin-btn-sm';
      rejectBtn.type = 'button';
      rejectBtn.textContent = 'Unpublish / Reject';
      rejectBtn.addEventListener('click', () => updateReviewStatus(review.id, 'rejected', rejectBtn));
      actions.appendChild(rejectBtn);
    } else if (review.status === 'rejected') {
      const approveBtn = document.createElement('button');
      approveBtn.className = 'admin-btn admin-btn-success admin-btn-sm';
      approveBtn.type = 'button';
      approveBtn.textContent = 'Approve / Publish';
      approveBtn.addEventListener('click', () => updateReviewStatus(review.id, 'approved', approveBtn));
      actions.appendChild(approveBtn);
    }

    // Delete Button (Always available with confirmation modal)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'admin-btn admin-btn-danger admin-btn-sm';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => openDeleteModal(review));
    actions.appendChild(deleteBtn);

    card.appendChild(actions);

    return card;
  }

  function createStarSvg(filled) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', filled ? 'currentColor' : 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('aria-hidden', 'true');

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2');
    svg.appendChild(polygon);

    return svg;
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (_) {
      return isoStr.substring(0, 10);
    }
  }

  /* ── 10. STATUS UPDATE (APPROVE / REJECT) ─────────────────────── */
  async function updateReviewStatus(reviewId, newStatus, triggerBtn) {
    if (!supabaseClient) return;

    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.dataset.origText = triggerBtn.textContent;
      triggerBtn.textContent = 'Updating...';
    }

    try {
      const { error } = await supabaseClient
        .from('reviews')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) {
        console.error('[Admin] Status update error:', error);
        showNotification(`Failed to update status: ${error.message}`, 'error');
        if (triggerBtn) {
          triggerBtn.disabled = false;
          triggerBtn.textContent = triggerBtn.dataset.origText;
        }
        return;
      }

      // Update in local cache
      const item = allReviews.find(r => r.id === reviewId);
      if (item) {
        item.status = newStatus;
        item.updated_at = new Date().toISOString();
      }

      updateMetrics();
      renderFilteredQueue();

      const label = newStatus === 'approved' ? 'approved and published' : 'marked as rejected';
      showNotification(`Review successfully ${label}.`, 'success');
    } catch (err) {
      console.error('[Admin] Update exception:', err);
      showNotification('An unexpected network error occurred while updating status.', 'error');
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.textContent = triggerBtn.dataset.origText;
      }
    }
  }

  /* ── 11. DELETE CONFIRMATION MODAL ────────────────────────────── */
  function initDeleteModal() {
    const modal = $('#delete-modal');
    const targetName = $('#delete-target-name');
    const cancelBtn = $('#delete-cancel-btn');
    const closeBtn = $('#delete-modal-close');
    const confirmBtn = $('#delete-confirm-btn');

    const closeModal = () => {
      if (modal) modal.style.display = 'none';
      pendingDeleteReview = null;
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Close on overlay click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        closeModal();
      }
    });

    // Confirm Delete Action
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!pendingDeleteReview || !supabaseClient) return;

        const btnText = confirmBtn.querySelector('.btn-text');
        const btnSpinner = confirmBtn.querySelector('.btn-spinner');

        confirmBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-block';

        const idToDelete = pendingDeleteReview.id;
        const nameToDelete = pendingDeleteReview.client_name;

        try {
          const { error } = await supabaseClient
            .from('reviews')
            .delete()
            .eq('id', idToDelete);

          if (error) {
            console.error('[Admin] Delete error:', error);
            showNotification(`Failed to delete review: ${error.message}`, 'error');
            return;
          }

          // Remove from local array
          allReviews = allReviews.filter(r => r.id !== idToDelete);
          updateMetrics();
          renderFilteredQueue();

          closeModal();
          showNotification(`Review from "${nameToDelete}" was permanently deleted.`, 'success');
        } catch (err) {
          console.error('[Admin] Delete exception:', err);
          showNotification('Network error while deleting review.', 'error');
        } finally {
          confirmBtn.disabled = false;
          if (btnText) btnText.style.display = '';
          if (btnSpinner) btnSpinner.style.display = 'none';
        }
      });
    }
  }

  function openDeleteModal(review) {
    pendingDeleteReview = review;
    const modal = $('#delete-modal');
    const targetName = $('#delete-target-name');
    const cancelBtn = $('#delete-cancel-btn');

    if (targetName) {
      targetName.textContent = review.client_name || 'this client';
    }

    if (modal) {
      modal.style.display = 'flex';
      if (cancelBtn) cancelBtn.focus();
    }
  }

  /* ── 12. TOOLBAR, TABS & SEARCH ───────────────────────────────── */
  function initToolbar() {
    const tabs = $$('.queue-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        currentFilter = tab.dataset.filter || 'pending';
        renderFilteredQueue();
      });
    });

    const searchInput = $('#queue-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        renderFilteredQueue();
      });
    }

    const refreshBtn = $('#admin-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadReviews();
        showNotification('Refreshing review queue...', 'info');
      });
    }
  }

  /* ── 13. DOM READY INITIALIZATION ─────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuthForms();
    initDeleteModal();
    initToolbar();

    supabaseClient = initSupabase();
    if (supabaseClient) {
      // Listen to Auth State Changes
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          currentUser = null;
          allReviews = [];
          showView('signin');
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session && session.user) {
            currentUser = session.user;
            checkAuth();
          }
        }
      });

      checkAuth();
    }
  });
})();
