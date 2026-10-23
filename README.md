# Afaq Ahmad — Developer Portfolio & Client Review System
**Production-Grade Personal Brand, Bento Architecture & Secure Moderation Engine**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-afaqahmadcs.vercel.app-477568?style=for-the-badge&logo=vercel&logoColor=white)](https://afaqahmadcs.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-171C1B?style=for-the-badge)](LICENSE)
[![WCAG 2.1](https://img.shields.io/badge/Accessibility-WCAG%20AAA%2FAA-33594F?style=for-the-badge)](BRAND-GUIDE.md)
[![Database: Supabase](https://img.shields.io/badge/Backend-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](SETUP-REVIEWS.md)

---

## 📌 Executive Overview

This repository houses the personal developer portfolio and web engineering showcase of **Afaq Ahmad**, a Computer Science student and web developer based in **Peshawar, Pakistan**.

Built with a commitment to **frontend craftsmanship, zero artificial dependencies, and uncompromising application security**, this project rejects generic AI SaaS templates in favor of an **editorial, human-centered technology identity**. It features a custom **Bento-grid interface**, authentic **production case studies**, and an end-to-end **secure client review and moderation system** backed by Supabase PostgreSQL and Row Level Security (RLS).

---

## 🎨 Visual Identity & Brand Philosophy

The design system is governed by a bespoke, publication-grade identity designed to communicate calm precision and technical discipline.

### The Approved Color Palette

| Swatch | Color Name | Hex Code | Semantic Role |
| :---: | :--- | :--- | :--- |
| ![#171C1B](https://via.placeholder.com/16/171C1B/000000?text=+) | **Deep Ink** | `#171C1B` | Primary dark canvas; high-contrast headline typography in light mode. |
| ![#F4F1E8](https://via.placeholder.com/16/F4F1E8/000000?text=+) | **Warm Ivory** | `#F4F1E8` | Primary light canvas; tactile editorial warmth; headline text in dark mode. |
| ![#477568](https://via.placeholder.com/16/477568/000000?text=+) | **Forest Teal** | `#477568` | Signature primary accent; navigation active indicators, buttons, brand anchors. |
| ![#D5A65A](https://via.placeholder.com/16/D5A65A/000000?text=+) | **Muted Amber** | `#D5A65A` | Warm secondary accent; milestone callouts, ratings, subtle attention cues. |
| ![#89938D](https://via.placeholder.com/16/89938D/000000?text=+) | **Soft Sage** | `#89938D` | Secondary body text, metadata timestamps, code chips, subtle hairline borders. |

*Comprehensive typography scales, contrast math, and cross-platform guidelines are documented in [`BRAND-GUIDE.md`](BRAND-GUIDE.md).*

---

## 🚀 Key Architectural Features

### 1. Asymmetrical Bento-Grid Composition
- **Hero & Identity Cards:** Custom 12-column grid organizing developer positioning, core technical stack, verified learning journey (SMIT & Superior College), local Peshawar time anchor, and engineering ethos.
- **Pure CSS Grid:** Zero external CSS libraries or frameworks. Fully responsive across mobile (<480px), tablet (768px), and wide desktop displays.

### 2. Verified Technical Case Studies
- Replaces abstract SVG illustrations with authentic project case studies featuring browser window viewports, implementation decisions, performance trade-offs, and live verification links.
- Includes production work for **Blue Sapphire Gem Stones**, luxury automotive concepts, and real estate architectures.

### 3. Secure Client Review & Moderation Engine
A production-conscious testimonial and moderation system built without client-side security shortcuts:
- **Public Submission Form:** Focus-trapped accessible modal dialog collecting reviewer name, company, keyboard-operable 1–5 star ratings, feedback, and publication consent.
- **Anti-Spam Defense:** Integrated off-screen honeypot field (`website_hp`) that immediately catches automated bot traffic prior to database writes.
- **PostgreSQL Row Level Security (RLS):** Database-enforced rule `WITH CHECK (status = 'pending')` prevents attackers from manipulating REST API payloads to self-publish reviews.
- **Strict Safe DOM Rendering:** All user-submitted feedback is inserted using `document.createElement` and `textContent`. **Zero `innerHTML`** is used, providing absolute protection against Cross-Site Scripting (XSS).
- **Public Reviews Display:** Queries strictly `status = 'approved'` records. Shows a clean, honest empty state when 0 reviews exist—never fabricates testimonials or ratings.

### 4. Protected Administrator Portal (`/admin/index.html`)
- **Supabase Authentication:** Encrypted email/password authentication with session persistence.
- **Allowlist Authorization Boundary:** Verifies user identity against a private `public.admin_users` table using a PostgreSQL `SECURITY DEFINER` function (`is_admin()`). Non-admin authenticated accounts receive a `403 Access Denied` screen with zero review exposure.
- **Moderation Console:** Real-time metrics grid (Pending, Approved, Rejected, Total), queue filter tabs, instant client-side search, and one-click *Approve* and *Reject* controls.
- **Delete Safeguards:** Accessible modal confirmation requiring explicit admin approval before executing permanent database deletions.

### 5. Production Readiness & Accessibility (WCAG AAA/AA)
- **High-Contrast Ratio:** Text combinations achieve up to 14.2:1 contrast ratios in both light and dark themes.
- **Reduced Motion Support:** Respects `prefers-reduced-motion` across all micro-interactions and transitions.
- **Print Optimization:** Custom `@media print` stylesheets cleanly format résumé and case-study content for physical documents and PDF export.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Rationale |
| :--- | :--- | :--- |
| **Structure** | Semantic HTML5 | Maximum accessibility, SEO metadata, microdata hierarchy. |
| **Styling** | Modern Vanilla CSS3 | Custom properties (CSS variables), CSS Grid, Flexbox, zero framework bloat. |
| **Logic** | Vanilla JavaScript (ESNext) | Modular, frameworkless, lightweight, event-driven DOM manipulation. |
| **Database** | PostgreSQL (Supabase) | Check constraints, triggers, indexes, and stored procedures (RPC). |
| **Security** | Supabase Auth + RLS | Engine-level Row Level Security, allowlist verification, honeypots. |
| **Typography** | Plus Jakarta Sans, Inter, JetBrains Mono | Editorial readability paired with monospace precision. |
| **Deployment** | Vercel / Static Web Hosting | Fast global CDN edge delivery with zero build latency. |

---

## 📂 Repository Structure

```
AFAQ-Portfolio-Website/
├── index.html                     # Main landing page & Bento-grid showcase
├── about.html                     # Background, education, and development journey
├── projects.html                  # In-depth technical project case studies
├── resume.html                    # Interactive & printable curriculum vitae
├── contact.html                   # Inquiries, FAQs, and contact form
├── 404.html                       # Accessible, brand-aligned error page
├── BRAND-GUIDE.md                 # Complete visual identity and cross-platform guide
├── SETUP-REVIEWS.md               # Supabase database setup & admin enrollment guide
├── admin/                         # Protected Review Moderation Portal
│   ├── index.html                 # Admin login & moderation dashboard
│   ├── admin.css                  # Dashboard theme & responsive layout
│   └── admin.js                   # Supabase Auth, authorization & queue controller
├── css/
│   ├── tokens.css                 # Centralized semantic tokens (Light/Dark themes)
│   ├── main.css                   # Core architecture, layout, and component styles
│   └── animations.css             # Performance-tuned micro-interactions & a11y motion
├── js/
│   ├── main.js                    # Global controllers (theme toggle, nav, scroll-spy)
│   ├── reviews.js                 # Public review form & approved cards renderer
│   ├── supabase-config.js         # Active public client configuration
│   └── supabase-config.example.js # Template configuration file
├── supabase/
│   ├── migrations/
│   │   └── 20261023_reviews_system.sql  # Complete PostgreSQL schema, RLS & RPC
│   └── functions/
│       └── submit-review/index.ts       # Standalone Deno Edge Function alternative
└── assets/
    ├── favicon.svg                # Brand monogram SVG favicon
    ├── logo.svg                   # Brand identity vector mark
    ├── resume.pdf                 # Printable developer résumé
    └── images/                    # Verified screenshots & case study graphics
```

---

## 🔒 Database Schema & Security Architecture

```
                    [ Anonymous Client ]
                             │
                             ▼ (Submits Review)
                  ┌──────────────────────┐
                  │ Honeypot Check (BOT) │ ──(Filled)──► [ Discard / Reject ]
                  └──────────────────────┘
                             │ (Legitimate)
                             ▼
              ┌──────────────────────────────┐
              │ INSERT INTO public.reviews   │
              │ WITH CHECK (status='pending')│
              └──────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ Storage: status = 'pending'  │
              └──────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         ▼                                       ▼
  [ Public SELECT ]                     [ Admin Dashboard ]
         │                                       │
  (status='approved' only)              (Requires Supabase Auth +
         │                               public.is_admin() Allowlist)
         ▼                                       │
  [ Review Hidden ]                     ┌────────┴────────┐
                                        ▼                 ▼
                                   [ Approve ]       [ Delete ]
                                        │
                                        ▼
                             (status='approved')
                                        │
                                        ▼
                               [ Visible on Site ]
```

---

## 💻 Local Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge).
- Any local static HTTP server (e.g., Python `http.server`, Node `serve`, or VS Code Live Server).

### 1. Clone the Repository
```bash
git clone https://github.com/afaqahmadcs/AFAQ-Portfolio-Website.git
cd AFAQ-Portfolio-Website
```

### 2. Launch Local Server
Using Python:
```bash
python -m http.server 8080
```
Using Node.js:
```bash
npx serve -l 8080 .
```

Open your browser to:
- **Portfolio Homepage:** `http://localhost:8080/index.html`
- **Admin Moderation Portal:** `http://localhost:8080/admin/index.html`

### 3. Connect Supabase (Optional for Local Database Testing)
Refer to [`SETUP-REVIEWS.md`](SETUP-REVIEWS.md) for full instructions on provisioning your Supabase project, executing the database migration, and enrolling your administrator user.

---

## 👤 Author & Connect

**Afaq Ahmad**
*Web Developer & Computer Science Student*
*Peshawar, Khyber Pakhtunkhwa, Pakistan*

- **Website:** [afaqahmadcs.vercel.app](https://afaqahmadcs.vercel.app/)
- **GitHub:** [@afaqahmadcs](https://github.com/afaqahmadcs)
- **LinkedIn:** [linkedin.com/in/afaqahmadcs](https://www.linkedin.com/in/afaqahmadcs/)
- **Email:** [afaqahmad.contact@gmail.com](mailto:afaqahmad.contact@gmail.com)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
Personal content, project case studies, and brand identity assets are copyright © Afaq Ahmad.
