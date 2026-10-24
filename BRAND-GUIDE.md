# Afaq Ahmad — Personal Visual Identity & Brand System Guide
**Editorial, Human-Centered Technology Identity**
*Version 1.0 • Established October 2026*

---

## 1. Brand Philosophy & Direction

This visual identity establishes an enduring personal brand for **Afaq Ahmad** (Web Developer & Computer Science Student based in Peshawar, Pakistan).

### The Aesthetic Vision
- **Considered & Calm:** Replaces generic AI-template aesthetics (purple/indigo neon glows, floating particles, exaggerated blur glassmorphism) with an editorial, publication-grade atmosphere.
- **Human & Tangible:** Combines paper-like **Warm Ivory** with deep **Forest Teal** and rich **Deep Ink** to communicate thoughtful craftsmanship, patience, and technical precision.
- **Subtle & Disciplined:** Content hierarchy, disciplined whitespace, crisp typography, and authentic project screenshots are the primary design tools.

---

## 2. Approved Color Palette & Semantic System

### Core Themes

#### Dark Theme
- **Background (Main Canvas):** `#111318` (Deep Charcoal)
- **Elevated Surfaces (Cards & Containers):** `#1C2029` (Slate Surface)
- **Primary Text:** `#F2F0E9` (Warm Ivory)
- **Secondary Text:** `#9AA8B8` (Readable Cool Slate Gray)
- **Primary Accent:** `#7297B5` (Steel Blue)
- **Supporting Highlight:** `#D3AD72` (Soft Amber)

#### Light Theme
- **Background (Main Canvas):** `#F5F3ED` (Clean Warm Canvas)
- **Cards (Elevated Surfaces):** `#FFFFFF` (Crisp White)
- **Primary Text:** `#242934` (Deep Charcoal)
- **Secondary Text:** `#555D69` (Cool Gray)
- **Primary Accent:** `#345C7A` (Dark Steel Blue for AAA contrast)
- **Supporting Highlight:** `#A7793E` (Soft Amber) / `#875F2B` (Highlight Text)

---

### WCAG 2.1 Contrast Testing Matrix

Every color combination in the portfolio design tokens has been calibrated and verified against WCAG AA (4.5:1 for body text, 3:1 for large text/UI components) and WCAG AAA (7:1 for enhanced body contrast):

| Theme | Foreground | Background | Contrast Ratio | WCAG Compliance | Context of Use |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Light** | Primary Text (`#242934`) | Main Canvas (`#F5F3ED`) | **13.13 : 1** | **AAA Pass** | Primary headings, body copy, strong labels. |
| **Light** | Primary Text (`#242934`) | Card Surface (`#FFFFFF`) | **14.57 : 1** | **AAA Pass** | Headings & copy on elevated cards. |
| **Light** | Secondary Text (`#555D69`) | Main Canvas (`#F5F3ED`) | **6.00 : 1** | **AAA (Large) / AA** | Secondary body descriptions, captions. |
| **Light** | Secondary Text (`#555D69`) | Card Surface (`#FFFFFF`) | **6.65 : 1** | **AAA (Large) / AA** | Card secondary descriptions. |
| **Light** | Tertiary Text (`#626B79`) | Main Canvas (`#F5F3ED`) | **4.85 : 1** | **AA Pass** | Subtle metadata, dates, breadcrumbs. |
| **Light** | Primary Accent (`#345C7A`) | Main Canvas (`#F5F3ED`) | **6.40 : 1** | **AAA (Large) / AA** | Links, focus rings, tag outlines. |
| **Light** | Primary Accent (`#345C7A`) | Card Surface (`#FFFFFF`) | **7.10 : 1** | **AAA Pass** | Card action links, badges. |
| **Light** | Button Text (`#FFFFFF`) | Primary Button (`#345C7A`)| **7.10 : 1** | **AAA Pass** | White text on primary CTA buttons. |
| **Light** | Muted Teal (`#2C5847`) | Main Canvas (`#F5F3ED`) | **7.30 : 1** | **AAA Pass** | Secondary accents, tags. |
| **Light** | Highlight Text (`#875F2B`) | Main Canvas (`#F5F3ED`) | **5.11 : 1** | **AA Pass** | Amber highlight text labels. |
| **Dark** | Primary Text (`#F2F0E9`) | Main Canvas (`#111318`) | **16.29 : 1** | **AAA Pass** | Primary headings, body copy, strong labels. |
| **Dark** | Primary Text (`#F2F0E9`) | Slate Surface (`#1C2029`)| **14.30 : 1** | **AAA Pass** | Headings & copy on elevated cards. |
| **Dark** | Secondary Text (`#9AA8B8`) | Main Canvas (`#111318`) | **7.67 : 1** | **AAA Pass** | Secondary body descriptions, captions. |
| **Dark** | Secondary Text (`#9AA8B8`) | Slate Surface (`#1C2029`)| **6.73 : 1** | **AAA (Large) / AA** | Card secondary descriptions. |
| **Dark** | Tertiary Text (`#8190A3`) | Slate Surface (`#1C2029`)| **5.01 : 1** | **AA Pass** | Subtle metadata, dates, breadcrumbs. |
| **Dark** | Primary Accent (`#7297B5`) | Main Canvas (`#111318`) | **6.03 : 1** | **AA Pass** | Links, focus rings, active nav links. |
| **Dark** | Primary Accent (`#7297B5`) | Slate Surface (`#1C2029`)| **5.29 : 1** | **AA Pass** | Card action links, badges. |
| **Dark** | Button Text (`#111318`) | Primary Button (`#7297B5`)| **6.03 : 1** | **AA Pass** | Dark charcoal text on steel-blue CTAs. |
| **Dark** | Muted Teal (`#6D9C88`) | Main Canvas (`#111318`) | **5.98 : 1** | **AA Pass** | Secondary accents, tags. |
| **Dark** | Soft Amber (`#D3AD72`) | Main Canvas (`#111318`) | **8.84 : 1** | **AAA Pass** | Star ratings, highlight tags, milestones. |

---

## 3. Semantic CSS Design Tokens Reference (`css/tokens.css`)

```css
/* Light Theme Tokens */
:root,
[data-theme="light"] {
  --bg: #F5F3ED;            /* Main canvas */
  --bg2: #EBE8DF;           /* Subdued canvas / alternating sections */
  --bg3: #E2DDD1;           /* Recessed insets, pills, and dividers */
  --sf: #FFFFFF;            /* Pure white elevated cards */
  --sf2: #FAF8F5;           /* Raised layer / dropdown surface */
  --fg: #242934;            /* Primary Text (13.13:1 on Canvas) */
  --fg2: #555D69;           /* Secondary Cool Gray Text (6.00:1) */
  --fg3: #626B79;           /* Subtle Metadata / Captions (4.85:1) */
  --fgi: #FFFFFF;           /* Inverted Typography */
  --bd: rgba(36, 41, 52, 0.09);
  --bd2: rgba(36, 41, 52, 0.18);
  --brand: #345C7A;         /* Primary Accent (6.40:1 on Canvas) */
  --brandh: #26465E;        /* Accent Hover */
  --btn-primary-fg: #FFFFFF;/* Button Text on Accent (7.10:1) */
  --teal: #2C5847;          /* Secondary Accent */
  --acc: #A7793E;           /* Supporting Highlight */
  --acc-text: #875F2B;      /* Accessible Highlight Text */
}

/* Dark Theme Tokens */
[data-theme="dark"] {
  --bg: #111318;            /* Deep Charcoal Main Canvas */
  --bg2: #161922;           /* Subdued canvas */
  --bg3: #14171F;           /* Recessed insets / pills */
  --sf: #1C2029;            /* Slate Surface cards */
  --sf2: #242A36;           /* Raised card / hover state */
  --fg: #F2F0E9;            /* Warm Ivory Primary Text (16.29:1) */
  --fg2: #9AA8B8;           /* Readable Cool Slate Gray (7.67:1) */
  --fg3: #8190A3;           /* Subtle Metadata / Captions (5.01:1) */
  --fgi: #111318;           /* Inverted Typography */
  --bd: rgba(154, 168, 184, 0.11);
  --bd2: rgba(154, 168, 184, 0.20);
  --brand: #7297B5;         /* Steel Blue Primary Accent (6.03:1) */
  --brandh: #8CAECB;        /* Steel Blue Hover */
  --btn-primary-fg: #111318;/* Button Text on Accent (6.03:1) */
  --teal: #6D9C88;          /* Muted Teal Secondary Accent */
  --acc: #D3AD72;           /* Soft Amber Highlight (8.84:1) */
  --acc-text: #D3AD72;
}
```

---

## 4. Typography Hierarchy

| Style | Font Family | Size | Weight | Line Height | Tracking | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Heading 1** | `Plus Jakarta Sans` | `clamp(2.5rem, 5vw, 4rem)` | 800 (ExtraBold) | 1.12 | `-0.025em` | Hero titles, editorial page headers |
| **Section Heading 2** | `Plus Jakarta Sans` | `clamp(1.75rem, 3.5vw, 2.75rem)` | 800 (ExtraBold) | 1.15 | `-0.025em` | Section titles (`#about`, `#projects`) |
| **Card Heading 3** | `Plus Jakarta Sans` | `1.25rem – 1.5rem` | 700 (Bold) | 1.25 | `-0.015em` | Project titles, card headers |
| **Body Primary** | `Plus Jakarta Sans` / `Inter` | `1rem (16px)` | 400 (Regular) | 1.60 | `0em` | Editorial paragraphs, explanations |
| **Body Secondary** | `Plus Jakarta Sans` / `Inter` | `0.875rem (14px)` | 400 / 500 | 1.55 | `0em` | Card descriptions, feature notes |
| **Technical Label** | `JetBrains Mono` | `0.75rem (12px)` | 500 (Medium) | 1.40 | `0.05em` | Code metadata, dates, URL breadcrumbs |
| **Eyebrow Tag** | `Plus Jakarta Sans` | `0.6875rem (11px)` | 700 (Bold) | 1.20 | `0.08em` | Category tags, verification badges |

---

## 5. Visual Principles: What to Embrace & What to Avoid

### What to Embrace:
- **Calm, Disciplined Geometry:** Asymmetrical Bento compositions with purposeful card sizes.
- **Organic Editorial Textures:** Clean hairline grid lines (`hero-grid`) and subtle warm lighting rather than neon spotlights.
- **Authentic Verification:** Real website screenshots, GitHub commit timestamps, and live verified client projects.
- **Tactile Interactions:** Subtle `translateY(-2px)` card lift, restrained 4px focus rings with clear offsets for keyboard accessibility.
- **Monochrome & Semantic Icons:** Clean inline SVG icons colored via `currentColor` or `var(--brand)`.

### What to Avoid:
- ❌ **No Neon Gradients:** Zero high-saturation purple/blue or electric cyan gradients.
- ❌ **No Purple-Blue Glows:** Removed all legacy `rgba(99, 102, 241, ...)` box-shadows.
- ❌ **No Floating Particle Toys:** Zero canvas stars or distraction animations.
- ❌ **No Artificial Metrics:** No fake "99.9% uptime" or "100+ happy clients" badges.
- ❌ **No Unnecessary Glassmorphism:** Restrained, readable navbar blur only (`14px`); cards use solid, high-contrast surfaces.

---

## 6. Cross-Platform Brand Application Guidelines

This design system is engineered to extend across all personal developer communication channels:

```
                                  [ AFAQ AHMAD BRAND IDENTITY ]
                                                │
         ┌───────────────────────┬──────────────┴──────────────┬───────────────────────┐
         ▼                       ▼                             ▼                       ▼
 1. Portfolio & Case     2. YouTube Tech         3. LinkedIn & Social        4. PDF Documents &
        Studies                  Journey                      Headers                  Proposals
  (Ivory/Ink Canvas)     (Deep Ink + Teal)       (Teal Accent + Sage)        (Ivory White Paper)
```

### 1. Developer Portfolio & Case Studies
- **Light Theme:** Primary default for daylight reading. Warm Ivory canvas with crisp Deep Ink typography and Forest Teal anchors.
- **Dark Theme:** Deep Ink matte canvas with Warm Ivory typography. Eliminates harsh OLED blue light.
- **Project Cards:** Browser chrome with monochrome buttons and live URL breadcrumbs in `JetBrains Mono`.

### 2. YouTube Tech-Journey Graphics & Video Thumbnails
- **Canvas:** Matte **Deep Ink** (`#171C1B`) background with a soft **Forest Teal** (`#477568`) corner gradient.
- **Main Heading Text:** High-contrast **Warm Ivory** (`#F4F1E8`) set in `Plus Jakarta Sans ExtraBold`.
- **Accent Badges & Keywords:** **Muted Amber** (`#D5A65A`) pill containers with dark ink text for key milestone callouts (e.g. *"6 MONTHS", "VANILLA JS", "REAL CLIENT"*).
- **Code Highlights:** Syntax snippets boxed in `#1F2624` with `JetBrains Mono`.

### 3. LinkedIn & Twitter / X Social Media Assets
- **Profile Banner (1584 × 396 px):**
  - Left anchor: Deep Ink canvas transitioning to Forest Teal tone.
  - Center/Right: Clean editorial type hierarchy:
    - *"Afaq Ahmad — Web Developer & CS Student"* (Warm Ivory)
    - *"Vanilla HTML, CSS, JavaScript • Peshawar, Pakistan"* (Soft Sage)
  - Right focal point: Minimal monochrome geometric "AA" monogram logo mark.

### 4. Documents, Résumés, Proposals, and Pitch Decks
- **Print / PDF Canvas:** Crisp Ivory-White (`#FFFFFF` or `#FAF8F3`).
- **Section Headers:** Bold `Plus Jakarta Sans` in Deep Ink (`#171C1B`) with a 1.5px Forest Teal (`#477568`) baseline rule.
- **Job / Education Dates:** `JetBrains Mono` in Soft Sage (`#4B5550`).
- **Bullet Icons:** Restrained Forest Teal square or dash indicators.
- **Cover Page:** Deep Ink card with Warm Ivory title for client proposal front covers.

---

## 7. Maintenance & Code Standards
When adding new pages, widgets, or components to the portfolio:
1. Always reference `var(--bg)`, `var(--fg)`, `var(--brand)`, and `var(--acc)`.
2. Never write raw hex or RGB colors directly in component CSS files.
3. Verify every color combination against the WCAG AA minimum 4.5:1 ratio.
4. Keep motion instant or subtle (`var(--tf)` = 150ms, `var(--tn)` = 220ms) and honor `prefers-reduced-motion`.
