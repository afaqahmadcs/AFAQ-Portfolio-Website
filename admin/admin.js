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
  let allInquiries = [];
  let currentInquiryFilter = 'all';
  let inquirySearchQuery = '';
  let pendingDeleteInquiry = null;

  /* ── 1. THEME SUPPORT ─────────────────────────────────────────── */
  function initTheme() {
    const html = document.documentElement;
    const btn = $('#theme-btn');
    const sun = $('#ic-sun');
    const moon = $('#ic-moon');

    const savedTheme = localStorage.getItem('aa-theme');
    const osPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(savedTheme || osPref, false);

    function applyTheme(theme, persist = false) {
      html.setAttribute('data-theme', theme);
      if (persist) {
        try {
          localStorage.setItem('aa-theme', theme);
        } catch (e) {}
      }
      const isDark = theme === 'dark';
      if (sun && moon) {
        sun.style.display = isDark ? 'none' : 'block';
        moon.style.display = isDark ? 'block' : 'none';
      }
      if (btn) {
        btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        btn.setAttribute('title', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      }
    }

    if (btn) {
      btn.addEventListener('click', () => {
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

  function initSupabase() {
    const config = getEffectiveConfig();
    if (!config) {
      console.warn('[Admin] Supabase configuration not found.');
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
      await Promise.all([loadReviews(), loadInquiries()]);
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
          errEl.textContent = 'Supabase service is unreachable. Please refresh or check your internet connection.';
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

    // Confirm Delete Action (Handles both Reviews and Inquiries)
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (!supabaseClient) return;

        const btnText = confirmBtn.querySelector('.btn-text');
        const btnSpinner = confirmBtn.querySelector('.btn-spinner');

        confirmBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnSpinner) btnSpinner.style.display = 'inline-block';

        try {
          if (pendingDeleteInquiry) {
            const inqId = pendingDeleteInquiry.id;
            const inqName = pendingDeleteInquiry.client_name;

            const { error } = await supabaseClient
              .from('contact_inquiries')
              .delete()
              .eq('id', inqId);

            if (error) {
              console.error('[Admin] Delete inquiry error:', error);
              showNotification(`Failed to delete inquiry: ${error.message}`, 'error');
              return;
            }

            allInquiries = allInquiries.filter(i => i.id !== inqId);
            updateInquiryMetrics();
            renderFilteredInquiries();
            closeModal();
            showNotification(`Inquiry from "${inqName}" deleted successfully.`, 'success');
          } else if (pendingDeleteReview) {
            const idToDelete = pendingDeleteReview.id;
            const nameToDelete = pendingDeleteReview.client_name;

            const { error } = await supabaseClient
              .from('reviews')
              .delete()
              .eq('id', idToDelete);

            if (error) {
              console.error('[Admin] Delete error:', error);
              showNotification(`Failed to delete review: ${error.message}`, 'error');
              return;
            }

            allReviews = allReviews.filter(r => r.id !== idToDelete);
            updateMetrics();
            renderFilteredQueue();
            closeModal();
            showNotification(`Review from "${nameToDelete}" was permanently deleted.`, 'success');
          }
        } catch (err) {
          console.error('[Admin] Delete exception:', err);
          showNotification('Network error while processing deletion.', 'error');
        } finally {
          confirmBtn.disabled = false;
          if (btnText) btnText.style.display = '';
          if (btnSpinner) btnSpinner.style.display = 'none';
          pendingDeleteReview = null;
          pendingDeleteInquiry = null;
        }
      });
    }
  }

  function openDeleteModal(review) {
    pendingDeleteReview = review;
    pendingDeleteInquiry = null;
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

  function confirmDeleteInquiry(inquiry) {
    pendingDeleteInquiry = inquiry;
    pendingDeleteReview = null;
    const modal = $('#delete-modal');
    const targetName = $('#delete-target-name');
    const cancelBtn = $('#delete-cancel-btn');

    if (targetName) {
      targetName.textContent = `inquiry #${inquiry.reference_id || ''} from ${inquiry.client_name || 'this client'}`;
    }

    if (modal) {
      modal.style.display = 'flex';
      if (cancelBtn) cancelBtn.focus();
    }
  }

  /* ── 12. LOAD & MANAGE CONTACT INQUIRIES ───────────────────────── */
  async function loadInquiries() {
    if (!supabaseClient) return;

    const inqLoading = $('#inquiries-loading');
    const inqEmpty = $('#inquiries-empty');
    const inqList = $('#inquiries-list');

    if (inqLoading) inqLoading.style.display = 'flex';
    if (inqEmpty) inqEmpty.style.display = 'none';
    if (inqList) inqList.innerHTML = '';

    try {
      const { data, error } = await supabaseClient
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[Admin] Note fetching contact_inquiries:', error.message);
        allInquiries = [];
      } else {
        allInquiries = data || [];
      }

      updateInquiryMetrics();
      renderFilteredInquiries();
    } catch (err) {
      console.warn('[Admin] Inquiries fetch exception:', err);
    } finally {
      if (inqLoading) inqLoading.style.display = 'none';
    }
  }

  function updateInquiryMetrics() {
    const unreadCount = allInquiries.filter(i => i.status === 'unread').length;
    const repliedCount = allInquiries.filter(i => i.status === 'replied').length;
    const progressCount = allInquiries.filter(i => i.status === 'in_progress').length;
    const archivedCount = allInquiries.filter(i => i.status === 'archived').length;
    const totalCount = allInquiries.length;

    const elUnread = $('#metric-inq-unread');
    const elReplied = $('#metric-inq-replied');
    const elArchived = $('#metric-inq-archived');
    const elTotal = $('#metric-inq-total');

    if (elUnread) elUnread.textContent = unreadCount;
    if (elReplied) elReplied.textContent = repliedCount;
    if (elArchived) elArchived.textContent = archivedCount;
    if (elTotal) elTotal.textContent = totalCount;

    // Badges
    const badgeNavInq = $('#badge-nav-inquiries');
    if (badgeNavInq) {
      badgeNavInq.textContent = unreadCount;
      badgeNavInq.style.display = unreadCount > 0 ? '' : 'none';
    }

    const badgeAll = $('#badge-inq-all');
    const badgeUnread = $('#badge-inq-unread');
    const badgeProgress = $('#badge-inq-progress');
    const badgeReplied = $('#badge-inq-replied');
    const badgeArchived = $('#badge-inq-archived');

    if (badgeAll) badgeAll.textContent = totalCount;
    if (badgeUnread) badgeUnread.textContent = unreadCount;
    if (badgeProgress) badgeProgress.textContent = progressCount;
    if (badgeReplied) badgeReplied.textContent = repliedCount;
    if (badgeArchived) badgeArchived.textContent = archivedCount;
  }

  function renderFilteredInquiries() {
    const inqList = $('#inquiries-list');
    const inqEmpty = $('#inquiries-empty');
    if (!inqList) return;

    let filtered = allInquiries.filter(i => {
      if (currentInquiryFilter === 'all') return true;
      return i.status === currentInquiryFilter;
    });

    if (inquirySearchQuery) {
      const q = inquirySearchQuery.toLowerCase();
      filtered = filtered.filter(i => {
        const nameMatch = (i.client_name || '').toLowerCase().includes(q);
        const emailMatch = (i.email || '').toLowerCase().includes(q);
        const subjectMatch = (i.subject || '').toLowerCase().includes(q);
        const msgMatch = (i.message || '').toLowerCase().includes(q);
        const refMatch = (i.reference_id || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || subjectMatch || msgMatch || refMatch;
      });
    }

    inqList.innerHTML = '';

    if (filtered.length === 0) {
      if (inqEmpty) {
        inqEmpty.style.display = 'flex';
        const emptyTitle = $('#inquiries-empty-title');
        const emptyDesc = $('#inquiries-empty-desc');
        if (emptyTitle && emptyDesc) {
          if (inquirySearchQuery) {
            emptyTitle.textContent = 'No matching inquiries found';
            emptyDesc.textContent = `No messages match "${inquirySearchQuery}". Try a different keyword.`;
          } else if (currentInquiryFilter === 'unread') {
            emptyTitle.textContent = 'Inbox Zero! No unread inquiries';
            emptyDesc.textContent = 'Great job! You have addressed all incoming client messages.';
          } else {
            emptyTitle.textContent = 'No inquiries found';
            emptyDesc.textContent = `There are currently no records under the "${currentInquiryFilter}" filter.`;
          }
        }
      }
      return;
    }

    if (inqEmpty) inqEmpty.style.display = 'none';

    filtered.forEach(inquiry => {
      const card = buildInquiryCard(inquiry);
      inqList.appendChild(card);
    });
  }

  function buildInquiryCard(inquiry) {
    const card = document.createElement('article');
    card.className = `inquiry-card ${inquiry.status === 'unread' ? 'inquiry-card--unread' : ''}`;
    card.dataset.id = inquiry.id;

    // 1. Header
    const header = document.createElement('div');
    header.className = 'inquiry-card-header';

    const left = document.createElement('div');
    left.className = 'inquiry-header-left';

    const refPill = document.createElement('span');
    refPill.className = 'inquiry-ref';
    refPill.textContent = `#${inquiry.reference_id || 'INQ'}`;
    left.appendChild(refPill);

    const statusBadge = document.createElement('span');
    const statusMap = {
      unread: 'inquiry-status--unread',
      in_progress: 'inquiry-status--progress',
      replied: 'inquiry-status--replied',
      archived: 'inquiry-status--archived'
    };
    statusBadge.className = `inquiry-status-badge ${statusMap[inquiry.status] || 'inquiry-status--unread'}`;
    const statusLabels = {
      unread: 'Unread',
      in_progress: 'In Progress',
      replied: 'Replied',
      archived: 'Archived'
    };
    statusBadge.textContent = statusLabels[inquiry.status] || inquiry.status;
    left.appendChild(statusBadge);

    if (inquiry.service_tag) {
      const tag = document.createElement('span');
      tag.className = 'inquiry-service-tag';
      tag.textContent = inquiry.service_tag;
      left.appendChild(tag);
    }
    header.appendChild(left);

    const time = document.createElement('span');
    time.className = 'inquiry-timestamp';
    try {
      const d = new Date(inquiry.created_at || Date.now());
      time.textContent = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      time.textContent = inquiry.created_at || '';
    }
    header.appendChild(time);
    card.appendChild(header);

    // 2. Client Info
    const clientInfo = document.createElement('div');
    clientInfo.className = 'inquiry-client-info';

    const avatar = document.createElement('div');
    avatar.className = 'inquiry-avatar';
    avatar.textContent = (inquiry.client_name || 'C').charAt(0).toUpperCase();
    clientInfo.appendChild(avatar);

    const meta = document.createElement('div');
    meta.className = 'inquiry-client-meta';

    const name = document.createElement('h4');
    name.className = 'inquiry-client-name';
    name.textContent = inquiry.client_name || 'Anonymous Client';
    meta.appendChild(name);

    const emailLink = document.createElement('a');
    emailLink.className = 'inquiry-client-email';
    emailLink.href = `mailto:${encodeURIComponent(inquiry.email || '')}`;
    emailLink.textContent = inquiry.email || 'No email provided';
    emailLink.title = 'Click to email directly';
    meta.appendChild(emailLink);

    clientInfo.appendChild(meta);
    card.appendChild(clientInfo);

    // 3. Subject & Message Body
    const content = document.createElement('div');
    content.className = 'inquiry-content';

    const subj = document.createElement('h5');
    subj.className = 'inquiry-subject';
    subj.textContent = inquiry.subject || 'No Subject';
    content.appendChild(subj);

    const msg = document.createElement('p');
    msg.className = 'inquiry-message';
    msg.textContent = inquiry.message || '';
    content.appendChild(msg);

    card.appendChild(content);

    // 4. Action Buttons (Email, WhatsApp, Status, Archive, Delete)
    const actions = document.createElement('div');
    actions.className = 'inquiry-actions';

    // Button A: Direct 1-Click Email Reply
    const emailReplyBtn = document.createElement('a');
    emailReplyBtn.className = 'admin-btn admin-btn-primary admin-btn-sm';
    const emailSubject = `Re: [Ref: ${inquiry.reference_id || 'INQ'}] ${inquiry.subject || 'Portfolio Inquiry'}`;
    const emailBody = `Hi ${inquiry.client_name || 'there'},\n\nThank you for reaching out through my portfolio regarding "${inquiry.subject || 'your project'}".\n\nI have reviewed your message and would love to discuss your requirements.\n\nLooking forward to speaking with you!\n\n---\nBest regards,\nAfaq Ahmad\nWeb Developer & CS Student\nhttps://afaqahmadcs.vercel.app`;
    emailReplyBtn.href = `mailto:${encodeURIComponent(inquiry.email || '')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    emailReplyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Reply via Email`;
    emailReplyBtn.addEventListener('click', () => {
      if (inquiry.status === 'unread') {
        setTimeout(() => {
          updateInquiryStatus(inquiry.id, 'replied');
        }, 1200);
      }
    });
    actions.appendChild(emailReplyBtn);

    // Button B: Direct WhatsApp Action
    const waBtn = document.createElement('a');
    waBtn.className = 'admin-btn admin-btn-success admin-btn-sm';
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    const waText = `Hi ${inquiry.client_name || ''}, this is Afaq Ahmad (Web Developer). I received your inquiry regarding "${inquiry.subject || 'your project'}" on my portfolio.`;
    waBtn.href = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    waBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg> WhatsApp`;
    actions.appendChild(waBtn);

    // Button C: Status Toggle
    if (inquiry.status !== 'replied') {
      const repliedBtn = document.createElement('button');
      repliedBtn.type = 'button';
      repliedBtn.className = 'admin-btn admin-btn-secondary admin-btn-sm';
      repliedBtn.textContent = 'Mark as Replied';
      repliedBtn.addEventListener('click', () => updateInquiryStatus(inquiry.id, 'replied'));
      actions.appendChild(repliedBtn);
    } else {
      const unreadBtn = document.createElement('button');
      unreadBtn.type = 'button';
      unreadBtn.className = 'admin-btn admin-btn-secondary admin-btn-sm';
      unreadBtn.textContent = 'Mark as Unread';
      unreadBtn.addEventListener('click', () => updateInquiryStatus(inquiry.id, 'unread'));
      actions.appendChild(unreadBtn);
    }

    if (inquiry.status !== 'archived') {
      const archiveBtn = document.createElement('button');
      archiveBtn.type = 'button';
      archiveBtn.className = 'admin-btn admin-btn-secondary admin-btn-sm';
      archiveBtn.textContent = 'Archive';
      archiveBtn.addEventListener('click', () => updateInquiryStatus(inquiry.id, 'archived'));
      actions.appendChild(archiveBtn);
    }

    // Button D: Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'admin-btn admin-btn-danger admin-btn-sm';
    deleteBtn.title = 'Delete permanently';
    deleteBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
    deleteBtn.addEventListener('click', () => {
      confirmDeleteInquiry(inquiry);
    });
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    return card;
  }

  async function updateInquiryStatus(inquiryId, newStatus) {
    if (!supabaseClient) return;

    try {
      const { error } = await supabaseClient
        .from('contact_inquiries')
        .update({ status: newStatus })
        .eq('id', inquiryId);

      if (error) {
        showNotification(`Could not update inquiry: ${error.message}`, 'error');
        return;
      }

      const item = allInquiries.find(i => i.id === inquiryId);
      if (item) item.status = newStatus;

      updateInquiryMetrics();
      renderFilteredInquiries();
      showNotification(`Inquiry updated to "${newStatus}".`, 'success');
    } catch (err) {
      console.error('[Admin] Update status exception:', err);
      showNotification('Network error updating inquiry status.', 'error');
    }
  }

  /* ── 13. SECTION SWITCHER (INQUIRIES vs REVIEWS) ───────────────── */
  function initSectionSwitcher() {
    const btnInquiries = $('#nav-btn-inquiries');
    const btnReviews = $('#nav-btn-reviews');
    const panelInquiries = $('#panel-inquiries');
    const panelReviews = $('#panel-reviews');

    if (!btnInquiries || !btnReviews) return;

    btnInquiries.addEventListener('click', () => {
      btnInquiries.classList.add('is-active');
      btnInquiries.setAttribute('aria-selected', 'true');
      btnReviews.classList.remove('is-active');
      btnReviews.setAttribute('aria-selected', 'false');

      if (panelInquiries) panelInquiries.style.display = '';
      if (panelReviews) panelReviews.style.display = 'none';
    });

    btnReviews.addEventListener('click', () => {
      btnReviews.classList.add('is-active');
      btnReviews.setAttribute('aria-selected', 'true');
      btnInquiries.classList.remove('is-active');
      btnInquiries.setAttribute('aria-selected', 'false');

      if (panelReviews) panelReviews.style.display = '';
      if (panelInquiries) panelInquiries.style.display = 'none';
    });
  }

  function initInquiriesToolbar() {
    const tabs = $$('[data-inq-filter]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        currentInquiryFilter = tab.dataset.inqFilter || 'all';
        renderFilteredInquiries();
      });
    });

    const searchInput = $('#inquiries-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        inquirySearchQuery = e.target.value.trim();
        renderFilteredInquiries();
      });
    }

    const refreshBtn = $('#inquiries-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadInquiries();
        showNotification('Refreshing client inquiries...', 'info');
      });
    }
  }

  /* ── 14. TOOLBAR, TABS & SEARCH (REVIEWS) ──────────────────────── */
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

  /* ── 15. DOM READY INITIALIZATION ─────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuthForms();
    initDeleteModal();
    initSectionSwitcher();
    initInquiriesToolbar();
    initToolbar();

    supabaseClient = initSupabase();
    if (supabaseClient) {
      // Listen to Auth State Changes
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          currentUser = null;
          allReviews = [];
          allInquiries = [];
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
