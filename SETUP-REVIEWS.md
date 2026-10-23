# Client Review & Moderation System — Setup & Security Guide
**Portfolio of Afaq Ahmad (Peshawar, Pakistan)**

This document details the configuration, security architecture, database deployment, and moderation workflow for the client review system.

---

## 1. System Architecture Overview

The system consists of three integrated components built using vanilla HTML5, CSS3, and ESNext JavaScript:

1. **Public Review Submission Form** (`index.html` + `js/reviews.js`)
   - Accessible modal dialog triggered from the homepage reviews section.
   - Captures: Client Name (required), Company (optional), Star Rating 1–5 (required), Review Feedback (required, min 10 chars), Project Reference (optional), and Consent Checkbox (required).
   - Anti-spam honeypot input field (`website_url_hp`) that immediately rejects automated bot submissions.
   - Submits records strictly with `status = 'pending'`.
   - Never exposes private contact details.

2. **Public Approved Reviews Display** (`index.html` + `css/main.css` + `js/reviews.js`)
   - Queries only records where `status = 'approved'`.
   - Renders review cards using safe DOM methods (`document.createElement`, `textContent`) to prevent Cross-Site Scripting (XSS).
   - Displays an honest, refined empty state when 0 approved reviews exist (never fabricates fake testimonials, fake ratings, or fake client counts).
   - Fully responsive and respects `prefers-reduced-motion` and light/dark theme toggle.

3. **Protected Admin Moderation Dashboard** (`admin/index.html` + `admin/admin.css` + `admin/admin.js`)
   - Accessible via `/admin/index.html`.
   - Authenticates using Supabase Auth (email/password).
   - Checks authorization against `public.admin_users` allowlist using PostgreSQL Row Level Security (RLS) and the `is_admin()` security definer function.
   - Non-admin authenticated accounts are denied access with an informative screen and cannot view reviews or perform moderation actions.
   - Moderation features:
     - Metrics grid (Pending, Approved, Rejected, Total).
     - Filter tabs (Pending Queue, Approved, Rejected, All Records).
     - Real-time client-side search across reviewer name, company, project reference, and feedback text.
     - Actions: Approve review, Reject review, and Permanent Deletion with confirmation modal.
     - Reusable feedback banner and toasts.

---

## 2. Supabase Database & Auth Setup

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com/) and sign in to your dashboard.
2. Click **New Project**, choose a name (e.g. `afaq-portfolio`), set a secure database password, and select your preferred region (e.g. `ap-south-1` or `eu-central-1`).
3. Once provisioned, navigate to **Project Settings** → **API**.
4. Note your:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **Project API Keys** → `anon` `public` key (e.g., `eyJhbGciOi...`)

> [!IMPORTANT]
> **Never** place the `service_role` secret key in frontend files or commit it to GitHub. The frontend client must **only** use the `anon` public key, relying entirely on PostgreSQL Row Level Security (RLS) for authorization.

---

### Step 2: Run Database Migration SQL
1. In your Supabase Dashboard, open the **SQL Editor** from the left navigation bar.
2. Click **New Query**.
3. Open [`supabase/migrations/20261023_reviews_system.sql`](file:///d:/SMIT%20Projects/AFAQ-Portfolio-Website-main/AFAQ-Portfolio-Website-main/supabase/migrations/20261023_reviews_system.sql) from this repository, copy its entire contents, and paste them into the SQL Editor.
4. Click **Run**.

**What this migration creates:**
- `public.reviews` table:
  - Columns: `id` (UUID pk), `client_name` (varchar 100), `company` (varchar 120), `rating` (int 1–5), `review_text` (text 10–2000 chars), `project_reference` (varchar 100), `status` ('pending', 'approved', 'rejected'), `created_at`, `updated_at`.
  - Database-level check constraints enforcing rating bounds (1–5) and valid status values.
- `public.admin_users` allowlist table:
  - Stores authorized administrator UUIDs linked to Supabase Auth (`auth.users(id)`).
- `public.is_admin()` Security Definer Function:
  - Queries `public.admin_users` to verify if the calling user (`auth.uid()`) is an authorized administrator.
- `public.submit_client_review()` RPC Stored Procedure:
  - Validates honeypot field, enforces pending status, and returns a sanitized confirmation.
- **Row Level Security (RLS) Policies:**
  - `public_read_approved_reviews`: Anonymous and non-admin users can **only** read reviews with `status = 'approved'`.
  - `public_insert_pending_reviews`: Anonymous visitors can **only** insert reviews with `status = 'pending'`. Any attempt to insert `status = 'approved'` is rejected by PostgreSQL.
  - `admin_select_all_reviews`: Only users in `admin_users` can view pending or rejected reviews.
  - `admin_update_reviews`: Only users in `admin_users` can update review status.
  - `admin_delete_reviews`: Only users in `admin_users` can delete review records.
  - `admin_users_admin_only`: Prevents non-admins from viewing or modifying the admin allowlist.

---

### Step 3: Create the Administrator Account
1. In the Supabase Dashboard, go to **Authentication** → **Users**.
2. Click **Add User** → **Create User**.
3. Enter your administrator email (e.g. `afaq@example.com`) and a strong, unique password.
4. Ensure "Auto Confirm User?" is checked so you can sign in immediately without email confirmation.
5. Click **Create User**.
6. Find the newly created user in the list and copy their **User UID** (a UUID like `f47ac10b-58cc-4372-a567-0e02b2c3d479`).

---

### Step 4: Grant Admin Authorization (Controlled Enrollment)
In the Supabase **SQL Editor**, run the following query, replacing `<COPIED-USER-UUID>` with the actual UUID copied from Step 3:

```sql
INSERT INTO public.admin_users (user_id, role)
VALUES ('<COPIED-USER-UUID>', 'admin')
ON CONFLICT (user_id) DO NOTHING;
```

Verify the insertion:
```sql
SELECT au.user_id, au.role, u.email, au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

> [!NOTE]
> Even if another user registers or acquires an authenticated token, they will have zero moderation permissions because their UID is not in `admin_users`.

---

### Step 5: Configure Frontend Credentials
Open [`js/supabase-config.js`](file:///d:/SMIT%20Projects/AFAQ-Portfolio-Website-main/AFAQ-Portfolio-Website-main/js/supabase-config.js) in your editor and enter your Supabase credentials:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_ID.supabase.co',
  anonKey: 'YOUR_SUPABASE_ANON_PUBLIC_KEY'
};
```

An example template is also preserved in [`js/supabase-config.example.js`](file:///d:/SMIT%20Projects/AFAQ-Portfolio-Website-main/AFAQ-Portfolio-Website-main/js/supabase-config.example.js).

---

## 3. Local Verification & Workflow Testing

A local HTTP server is running on port 8080:
- **Public Homepage:** `http://localhost:8080/index.html`
- **Admin Moderation:** `http://localhost:8080/admin/index.html`

### Testing Public Submission
1. Open `http://localhost:8080/index.html#reviews`.
2. Click **"Leave a Review"**.
3. Verify client-side validations:
   - Try submitting with empty fields → error indicators appear.
   - Click star ratings → accessible radio buttons update score.
   - Type feedback → character counter updates.
4. Fill in valid test details:
   - Name: `Tariq Khan`
   - Company: `Peshawar Tech Labs`
   - Rating: `5 Stars`
   - Feedback: `Excellent frontend craftsmanship and fast turnaround on our responsive landing page.`
   - Consent checkbox: Checked.
5. Click **"Submit Review for Approval"**.
6. The modal displays: *"Thanks for your feedback! Your review has been submitted for moderation and will appear publicly once approved."*
7. Verify that the new review does **not** appear on the homepage immediately (it is in `pending` status).

### Testing Admin Moderation
1. Open `http://localhost:8080/admin/index.html`.
2. Sign in with your admin email and password created in Step 3.
3. The dashboard opens showing:
   - Metric badge: 1 Pending review.
   - The card for `Tariq Khan` under the **Pending Queue** tab.
4. Click **"Approve Review"**:
   - The review moves to the **Approved** tab.
   - Notification toast displays: *"Review successfully approved and published."*
5. Return to `http://localhost:8080/index.html#reviews` and refresh:
   - The review now appears live with 5 stars, formatted date, client name, and company tag.
6. Return to `/admin/index.html`, select the **Approved** tab, and click **"Unpublish / Reject"**:
   - Refresh `index.html`: the review disappears from public display.
7. Click **"Delete"** on any card:
   - Accessible modal opens confirming permanent deletion.
   - Confirming permanently removes the record from the database.

---

## 4. Security Verification Matrix

| Security Requirement | Status | Verification Mechanism |
| :--- | :--- | :--- |
| **Strict RLS on `reviews` Table** | **Enforced in SQL** | Tested policy: `status = 'approved'` filter on public SELECT. |
| **Pending Status Enforcement on Insert** | **Enforced in SQL** | RLS check: `WITH CHECK (status = 'pending')` prevents setting `status = 'approved'` via REST API. |
| **Admin Authorization Boundary** | **Enforced in SQL** | Security definer function `is_admin()` verifies `auth.uid()` against `admin_users` allowlist. |
| **No Frontend Secrets Exposed** | **Verified** | Only public `anonKey` used in browser code; zero `service_role` keys committed. |
| **XSS Prevention on User Content** | **Verified in JS** | Both `js/reviews.js` and `admin/admin.js` strictly use `document.createElement` and `textContent`. No `innerHTML` used for user inputs. |
| **Anti-Spam Honeypot Field** | **Verified in JS & SQL** | Hidden field `#review-website-hp` traps bot submissions before database insertion. |
| **Non-Admin Auth Denial** | **Verified in JS & RLS** | Authenticated users not in `admin_users` receive a 403 / Access Denied view in the admin portal. |
| **Rating & Input Bounds** | **Enforced in SQL & JS** | PostgreSQL `CHECK (rating >= 1 AND rating <= 5)` and frontend validation. |
| **Theme & Reduced Motion Compliance** | **Verified** | `data-theme` integrated with portfolio tokens; animations disabled under `prefers-reduced-motion`. |

---

## 5. Production Deployment Notes

When deploying your static portfolio to GitHub Pages, Netlify, or Vercel:
1. Ensure `js/supabase-config.js` is committed with your public `url` and `anonKey` (the `anonKey` is designed by Supabase to be public, guarded by PostgreSQL RLS).
2. If using automated CI/CD environment variables, you can alternatively generate `js/supabase-config.js` during the build step using an environment template.
3. Keep `supabase/migrations/20261023_reviews_system.sql` in the repository for auditability and future migrations.
4. **Never push code to remote git without explicit authorization.**
