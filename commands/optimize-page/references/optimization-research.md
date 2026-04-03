# Web Page Optimization Reference (2024-2026)

Compiled from deep research on responsive design, Core Web Vitals, performance, and SEO.

---

## 1. Breakpoints & Responsive Strategy

**Mobile-first = min-width queries.** Start with smallest layout, layer complexity upward.

| Breakpoint | px | Purpose |
|---|---|---|
| xs (base) | 0 | Mobile portrait — default |
| sm | 640px | Mobile landscape / large phones |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape, sidebars |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

**Key device viewports to verify:**
- 320px (small Android/old iPhone)
- 375px (iPhone SE/standard)
- 390px (iPhone 14/15)
- 428px (iPhone Plus/Max)
- 768px (iPad portrait)
- 1024px (iPad landscape)
- 1280px (standard desktop)
- 1440px (wide desktop)
- 1920px (Full HD)

**Rule of thumb:** If it works at 320px and 1920px with clamp()-driven scaling between breakpoints, most sizes will be fine.

---

## 2. Fluid Typography & Spacing

`clamp()` is the gold standard — eliminates breakpoints for type and spacing.

```css
/* Body: 16px at 320px → 18px at 1200px */
font-size: clamp(1rem, calc(0.909rem + 0.455vw), 1.125rem);

/* H1: 32px → 56px */
font-size: clamp(2rem, calc(1.5rem + 2.5vw), 3.5rem);

/* Fluid padding */
padding: clamp(1rem, 4vw, 3rem);

/* Fluid gap */
gap: clamp(0.75rem, 2vw, 2rem);
```

**WCAG rule:** If `max <= 2.5 x min`, text passes WCAG 1.4.4. Always use `rem` (not `px`).

---

## 3. Touch Target Sizing

| Standard | Minimum Size |
|---|---|
| WCAG 2.2 Level AA (2.5.8) | 24x24 CSS px (or 24px spacing) |
| WCAG 2.2 Level AAA (2.5.5) | 44x44 CSS px |
| Google / Material Design | 48x48 dp |
| Apple HIG | 44x44 points |

**Practical rule:** Target 48x48px for all interactive elements.

**Detection:** Look for `padding: 0` on `<a>`, `<button>`, `role="button"` with small `font-size`.

---

## 4. Viewport Meta Tag

**Correct:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

**Mistakes to flag:**
- `user-scalable=no` — blocks pinch zoom, fails WCAG, penalized by Google
- `maximum-scale=1` — same problem
- Missing viewport entirely — renders at 980px desktop width on mobile
- Fixed `width=1024` — never correct

---

## 5. Common Responsive Failures (Static Detection)

| Failure | What to Look For |
|---|---|
| Fixed pixel widths | `width: NNNpx` > 400 on non-container elements |
| Horizontal overflow | `overflow: visible` on body/html, wide elements without `max-width: 100%` |
| Non-responsive images | `<img>` without `max-width: 100%` |
| `width: 100vw` | Causes horizontal scroll equal to scrollbar width — use `100%` |
| Fixed-width tables | `<table>` without `overflow-x: auto` wrapper |
| Absolute positioning | Elements with large px offsets that overflow |
| Font size < 12px | Unreadable on mobile |
| Small tap targets | Interactive elements < 24px without spacing |

---

## 6. CSS Grid vs. Flexbox

**Flexbox** = one axis (nav bars, button groups, card internals, wrapping items).
**Grid** = two axes (page layouts, card grids, overlapping layouts).

**Self-reflowing grid (no media queries):**
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: clamp(1rem, 3vw, 2rem);
}
```

---

## 7. Container Queries

93.92% browser support (Dec 2025). Use for reusable components that appear in different containers.

```css
.card-wrapper { container-type: inline-size; container-name: card; }

@container card (min-width: 400px) {
  .card { display: grid; grid-template-columns: 200px 1fr; }
}
```

**Use media queries for:** Global layout, OS preferences, `srcset`/`sizes`.
**Use container queries for:** Components in varying containers, per-component responsive typography.

---

## 8. Performance / Page Weight

### Thresholds

| Context | Target |
|---|---|
| Aggressive mobile | 365KB total transferred |
| Good general target | 500KB-1MB |
| Acceptable maximum | 2MB |
| Initial JS budget | < 150KB |

### Critical Rendering Path

- Inline critical CSS (~10-15KB) in `<style>` in `<head>`
- Async-load remaining CSS via preload + onload trick
- All scripts: `defer` or `async` (never bare `<script>` in `<head>`)

```html
<style>/* critical above-fold CSS */</style>
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>
<script src="app.js" defer></script>
```

### Image Optimization

- **Formats:** AVIF > WebP > JPEG for photos. SVG for icons/logos.
- **Never** `loading="lazy"` on the LCP image (found on 16% of sites).
- **Always** set `width` and `height` attributes on `<img>` (prevents CLS).
- Add `fetchpriority="high"` on LCP image.
- Use `srcset` + `sizes` for images at different breakpoints.

### Font Loading

- WOFF2 only. Drop WOFF/TTF/EOT.
- `font-display: swap` (or `optional` for best CLS).
- Preload 1-2 critical font files.
- Subset fonts for 70% size reduction.

### Resource Hints

| Hint | Use |
|---|---|
| `preconnect` | 2-3 critical third-party origins |
| `dns-prefetch` | Less critical third parties |
| `preload` | LCP image, critical fonts |
| `fetchpriority="high"` | LCP image |
| `fetchpriority="low"` | Below-fold images |

---

## 9. Core Web Vitals

| Metric | Good | Needs Work | Poor |
|---|---|---|---|
| LCP | <= 2.5s | 2.5-4s | > 4s |
| INP | <= 200ms | 200-500ms | > 500ms |
| CLS | <= 0.1 | 0.1-0.25 | > 0.25 |
| FCP | <= 1.8s | 1.8-3s | > 3s |
| TBT | <= 200ms | 200-600ms | > 600ms |

**Lighthouse weights:** TBT 30%, LCP 25%, CLS 25%, FCP 10%, SI 10%.

### LCP Checklist
- LCP element in HTML (not CSS background-image)
- `fetchpriority="high"` on LCP image
- No `loading="lazy"` on LCP image
- Preload LCP image
- Same-origin serving (avoid extra DNS)
- TTFB < 800ms

### CLS Prevention
- `width`/`height` on all `<img>` (~60% of CLS issues)
- `font-display: optional` or fallback metrics tuning
- Reserve space for dynamic content (`min-height`, `aspect-ratio`)
- Animate with `transform`/`opacity` only

### Progressive & Lazy Rendering Techniques

**IntersectionObserver lazy rendering** — defer heavy widget initialization (charts, maps, embeds) until they're near the viewport:
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      initChart(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { rootMargin: '200px' });
document.querySelectorAll('.chart-container').forEach(el => observer.observe(el));
```

**requestAnimationFrame progressive rendering** — when a page has multiple heavy sections, render them one at a time yielding to the browser between each so early sections paint while later ones build:
```js
function renderProgressively(sections) {
  let i = 0;
  function next() {
    if (i < sections.length) {
      sections[i].render();
      i++;
      requestAnimationFrame(next);
    }
  }
  requestAnimationFrame(next);
}
```

**Canvas DPR capping** — on 3x displays, cap `devicePixelRatio` at 2 to reduce GPU rendering cost by ~33% with minimal visual difference:
```js
Chart.defaults.devicePixelRatio = Math.min(window.devicePixelRatio, 2);
```

**Disable animations on mobile** — save CPU on constrained devices:
```js
if (window.innerWidth < 768) {
  Chart.defaults.animation = false;
}
```

---

## 10. SEO Performance Factors

- **Mobile-first indexing** (July 2024): Google indexes mobile version of every page
- Same content, meta tags, structured data, headings on mobile and desktop
- Semantic HTML: `<article>`, `<section>`, `<nav>`, `<main>`, `<header>`, `<footer>`
- One `<h1>` per page, sequential heading hierarchy
- `<link rel="canonical">` on pages with URL variations
- Open Graph tags for social sharing
- Structured data priority: Organization > WebSite > BreadcrumbList > Article > FAQPage

---

## 11. Tailwind-Specific

**Mobile-first is built in.** Unprefixed = all sizes. `md:`, `lg:` = at-and-above.

**Common antipatterns:**
- `sm:` to target mobile (wrong — use unprefixed)
- Dynamic class generation (`'bg-' + color + '-500'`) — gets purged by JIT
- `w-[960px]` fixed widths — use `max-w-5xl w-full`
- Tables without `overflow-x-auto` wrapper
- CDN in production (3.7MB raw)
- `w-screen` / `100vw` — causes horizontal scroll (use `w-full`)

---

## 12. Audit Checklist

### Critical (Breaks on Mobile)
- Missing `<meta name="viewport">`
- `user-scalable=no` or `maximum-scale=1`
- Fixed pixel widths on containers > 360px
- `width: 100vw` on any element
- Non-responsive images without `max-width: 100%`
- Tables without `overflow-x: auto`
- LCP image has `loading="lazy"`
- Synchronous `<script>` in `<head>`

### High (Poor UX / SEO Impact)
- Images missing `width`/`height` (CLS)
- LCP image not preloaded / no `fetchpriority="high"`
- CSS via `@import` (serialized requests)
- Fonts without `font-display`
- Touch targets < 24x24px without spacing
- Non-semantic heading structure
- Images without `alt`
- Below-fold images without `loading="lazy"`
- Missing `<link rel="canonical">`
- Render-blocking CSS
- JS bundle > 500KB

### Medium (Suboptimal)
- Fonts not WOFF2
- No font subsetting
- CSS transitions on layout properties (use `transform`)
- Missing `preconnect` for third parties
- Images not WebP/AVIF
- No `srcset`
- DOM > 1,500 nodes
- CSS specificity > 3 levels
- `!important` overrides > 3 instances

### Low (Nice-to-Have)
- No CSS custom properties
- No `content-visibility: auto`
- Font fallback metrics not tuned
- No container queries on reusable components
- `display: none` to hide mobile elements (still downloaded)

---

## 13. Two-Agent Conflict Resolution

### Always Safe (No Conflict)
- Adding `width`/`height` with correct values
- `loading="lazy"` on below-fold images
- `fetchpriority="high"` on LCP image
- `alt` text on images
- Fixing viewport meta
- `defer` on non-layout-critical scripts
- `@import` → `<link>`
- `font-display: swap` on `@font-face`
- `preconnect` for font origins

### Requires Coordination
- Inlining critical CSS (must cover all mobile states)
- Removing unused CSS (must keep breakpoint classes)
- Changing image sources (both agents agree on dimensions)
- Modifying script load order (no layout-init scripts deferred)

### Priority Hierarchy for Conflicts
1. Accessibility (WCAG) — always fix
2. Critical breaks (horizontal scroll, missing viewport) — always fix
3. Core Web Vitals (LCP, CLS) — fix unless it breaks the page visually
4. Performance optimization — apply unless it creates responsive regressions
5. Visual polish — defer to human when conflicting with #3 or #4
