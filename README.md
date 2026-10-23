# Afaq Ahmad — Developer Portfolio Website
**Modern Personal Portfolio, Bento Architecture & Case Studies**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-afaqahmadcs.vercel.app-477568?style=for-the-badge&logo=vercel&logoColor=white)](https://afaqahmadcs.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-171C1B?style=for-the-badge)](LICENSE)
[![WCAG 2.1](https://img.shields.io/badge/Accessibility-WCAG%20AAA%2FAA-33594F?style=for-the-badge)](BRAND-GUIDE.md)

---

## 📌 Overview

This repository contains the personal portfolio website of **Afaq Ahmad**, a Computer Science student and web developer based in **Peshawar, Pakistan**.

Built with a commitment to **frontend craftsmanship, zero unnecessary dependencies, and high performance**, this project rejects generic SaaS templates in favor of an **editorial, human-centered technology identity**. It features an asymmetrical **Bento-grid composition**, authentic **project case studies**, and a custom **client review showcase**.

---

## 🎨 Visual Identity & Brand System

The design system is governed by a bespoke, publication-grade identity designed to communicate calm precision and technical discipline.

### The Approved Color Palette

| Swatch | Color Name | Hex Code | Semantic Role |
| :---: | :--- | :--- | :--- |
| ![#171C1B](https://via.placeholder.com/16/171C1B/000000?text=+) | **Deep Ink** | `#171C1B` | Primary dark canvas; high-contrast headline typography in light mode. |
| ![#F4F1E8](https://via.placeholder.com/16/F4F1E8/000000?text=+) | **Warm Ivory** | `#F4F1E8` | Primary light canvas; tactile editorial warmth; headline text in dark mode. |
| ![#477568](https://via.placeholder.com/16/477568/000000?text=+) | **Forest Teal** | `#477568` | Signature primary accent; navigation active indicators, buttons, brand anchors. |
| ![#D5A65A](https://via.placeholder.com/16/D5A65A/000000?text=+) | **Muted Amber** | `#D5A65A` | Warm secondary accent; milestone callouts, ratings, subtle attention cues. |
| ![#89938D](https://via.placeholder.com/16/89938D/000000?text=+) | **Soft Sage** | `#89938D` | Secondary body text, metadata timestamps, code chips, subtle hairline borders. |

*Full typography scale, contrast testing matrix, and cross-platform guidelines are documented in [`BRAND-GUIDE.md`](BRAND-GUIDE.md).*

---

## 🚀 Key Features

### 1. Asymmetrical Bento-Grid Composition
- **Hero & Identity Cards:** Custom 12-column grid organizing developer positioning, core technical stack, verified learning journey (SMIT & Superior College), local Peshawar time anchor, and engineering ethos.
- **Pure CSS Grid:** Zero external CSS libraries or frameworks. Fully responsive across mobile (<480px), tablet (768px), and wide desktop displays.

### 2. Verified Technical Case Studies
- Replaces abstract illustrations with authentic project case studies featuring browser window viewports, implementation decisions, performance trade-offs, and live verification links.
- Includes production work for **Blue Sapphire Gem Stones**, luxury automotive concepts, and real estate architectures.

### 3. Client Reviews Showcase & Submission
- **Accessible Review Submission:** Focus-trapped modal dialog allowing visitors and clients to share feedback with 1–5 star ratings and publication consent.
- **Anti-Spam Protection:** Off-screen honeypot field rejecting automated bot submissions.
- **Safe DOM Rendering:** User-submitted text is strictly rendered using safe DOM methods (`textContent`) to prevent XSS.

### 4. Production Readiness & Accessibility (WCAG AAA/AA)
- **High-Contrast Ratio:** Text combinations achieve up to 14.2:1 contrast ratios in both light and dark themes.
- **Reduced Motion Support:** Respects `prefers-reduced-motion` across all micro-interactions and transitions.
- **Print Optimization:** Dedicated `@media print` stylesheets for clean CV and case-study printing.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Rationale |
| :--- | :--- | :--- |
| **Structure** | Semantic HTML5 | Maximum accessibility, SEO metadata, microdata hierarchy. |
| **Styling** | Modern Vanilla CSS3 | Custom properties (CSS variables), CSS Grid, Flexbox, zero framework bloat. |
| **Logic** | Vanilla JavaScript (ESNext) | Modular, frameworkless, lightweight, event-driven DOM manipulation. |
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
├── css/
│   ├── tokens.css                 # Centralized semantic tokens (Light/Dark themes)
│   ├── main.css                   # Core architecture, layout, and component styles
│   └── animations.css             # Performance-tuned micro-interactions & a11y motion
├── js/
│   ├── main.js                    # Global controllers (theme toggle, nav, scroll-spy)
│   ├── reviews.js                 # Public review form & approved cards renderer
│   └── supabase-config.example.js # Template configuration file
└── assets/
    ├── favicon.svg                # Brand monogram SVG favicon
    ├── logo.svg                   # Brand identity vector mark
    ├── resume.pdf                 # Printable developer résumé
    └── images/                    # Verified screenshots & case study graphics
```

---

## 💻 Local Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge).
- Any local static HTTP server.

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
