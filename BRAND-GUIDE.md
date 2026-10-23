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

### Primary Core Palette

| Swatch | Color Name | Hex Code | HSL | Core Role |
| :--- | :--- | :--- | :--- | :--- |
| ![#171C1B](https://via.placeholder.com/18/171C1B/000000?text=+) | **Deep Ink** | `#171C1B` | `170°, 10%, 10%` | Dark canvas, deep cards, high-contrast headline typography in light mode. |
| ![#F4F1E8](https://via.placeholder.com/18/F4F1E8/000000?text=+) | **Warm Ivory** | `#F4F1E8` | `45°, 29%, 93%` | Light canvas, editorial card surfaces, high-contrast headline typography in dark mode. |
| ![#477568](https://via.placeholder.com/18/477568/000000?text=+) | **Forest Teal** | `#477568` | `163°, 25%, 37%` | Primary signature accent, navigation active states, links, primary buttons, focal borders. |
| ![#D5A65A](https://via.placeholder.com/18/D5A65A/000000?text=+) | **Muted Amber** | `#D5A65A` | `37°, 60%, 59%` | Warm highlight, milestone badges, star ratings, subtle attention cues. |
| ![#89938D](https://via.placeholder.com/18/89938D/000000?text=+) | **Soft Sage** | `#89938D` | `144°, 4%, 56%` | Secondary typography, metadata, muted badges, subtle hairline borders. |

---

### WCAG 2.1 Contrast Testing Matrix

Every color combination in the portfolio design tokens has been calibrated and verified against WCAG AA (4.5:1 for body text, 3:1 for large text/UI components) and WCAG AAA (7:1 for enhanced body contrast):

| Foreground | Background | Contrast Ratio | WCAG Compliance | Context of Use |
| :--- | :--- | :--- | :--- | :--- |
| **Deep Ink** (`#171C1B`) | **Warm Ivory** (`#F4F1E8`) | **14.2 : 1** | **AAA Pass** | Light Theme: Primary headings, body copy, strong labels. |
| **Warm Ivory** (`#F4F1E8`) | **Deep Ink** (`#171C1B`) | **14.2 : 1** | **AAA Pass** | Dark Theme: Primary headings, dominant titles, inverted buttons. |
| **Forest Teal Deep** (`#33594F`) | **Warm Ivory** (`#F4F1E8`) | **5.6 : 1** | **AA Pass** | Light Theme: Primary brand accent, active nav links, CTAs. |
| **Forest Teal Light** (`#74A799`) | **Deep Ink** (`#171C1B`) | **6.8 : 1** | **AAA (Large) / AA** | Dark Theme: Brand accent, links, active indicators. |
| **Deep Sage** (`#4B5550`) | **Warm Ivory** (`#F4F1E8`) | **5.8 : 1** | **AA Pass** | Light Theme: Secondary body text, descriptions. |
| **Soft Sage Light** (`#A3ACA7`) | **Deep Ink** (`#171C1B`) | **6.8 : 1** | **AA Pass** | Dark Theme: Secondary descriptions, subheadings. |
| **Soft Sage** (`#89938D`) | **Deep Ink** (`#171C1B`) | **5.4 : 1** | **AA Pass** | Dark Theme: Technical metadata, dates, breadcrumbs. |
| **Deep Amber** (`#8C6524`) | **Warm Ivory** (`#F4F1E8`) | **4.8 : 1** | **AA Pass** | Light Theme: Warm tag labels and text highlights. |
| **Muted Amber** (`#D5A65A`) | **Deep Ink** (`#171C1B`) | **8.2 : 1** | **AAA Pass** | Dark Theme: Warm highlight text, milestone badges. |
| **Warm Ivory** (`#F4F1E8`) | **Forest Teal** (`#477568`) | **4.64 : 1** | **AA Pass** | Primary button text on Forest Teal background. |

---

## 3. Semantic CSS Design Tokens Reference (`css/tokens.css`)

All colors are abstracted into semantic tokens so components never use hardcoded color values:

```css
/* Light Theme Tokens */
[data-theme="light"] {
  --bg: #F4F1E8;            /* Warm Ivory Canvas */
  --bg2: #ECE7DA;           /* Toned Ivory Surface */
  --bg3: #E1DAC8;           /* Inset Pill / Chip */
  --sf: #FAF8F3;            /* Elevated Editorial Card Surface */
  --sf2: #FFFFFF;           /* Crisp White Layer */
  --fg: #171C1B;            /* Deep Ink Primary Text */
  --fg2: #4B5550;           /* Deepened Sage Secondary Text */
  --fg3: #64706A;           /* Medium Sage Caption Text */
  --brand: #33594F;         /* Forest Teal */
  --brandh: #26433B;        /* Forest Teal Hover */
  --brandbg: rgba(71, 117, 104, 0.10);
  --brand-border: rgba(71, 117, 104, 0.22);
  --acc: #8C6524;           /* Accessible Amber Text */
  --acc-display: #D5A65A;   /* Decorative Amber Stars/Icons */
  --accbg: rgba(213, 166, 90, 0.14);
  --acc-border: rgba(213, 166, 90, 0.30);
  --bd: rgba(23, 28, 27, 0.08);
  --bd2: rgba(23, 28, 27, 0.16);
  --shbr: 0 4px 16px rgba(51, 89, 79, 0.14);
}

/* Dark Theme Tokens */
[data-theme="dark"] {
  --bg: #171C1B;            /* Deep Ink Canvas */
  --bg2: #1E2523;           /* Elevated Ink Layer */
  --bg3: #27312E;           /* Tertiary Inset Layer */
  --sf: #1F2624;            /* Card Surface */
  --sf2: #283330;           /* Active / Raised Card */
  --fg: #F4F1E8;            /* Warm Ivory Primary Text */
  --fg2: #A3ACA7;           /* Soft Sage Secondary Text */
  --fg3: #89938D;           /* Soft Sage Metadata */
  --brand: #74A799;         /* Lighter Forest Teal */
  --brandh: #97C0B5;        /* Sage-Teal Hover */
  --brandbg: rgba(116, 167, 153, 0.14);
  --brand-border: rgba(116, 167, 153, 0.26);
  --acc: #D5A65A;           /* Muted Amber */
  --acc-display: #D5A65A;
  --accbg: rgba(213, 166, 90, 0.14);
  --acc-border: rgba(213, 166, 90, 0.28);
  --bd: rgba(244, 241, 232, 0.08);
  --bd2: rgba(244, 241, 232, 0.16);
  --shbr: 0 4px 18px rgba(116, 167, 153, 0.18);
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
