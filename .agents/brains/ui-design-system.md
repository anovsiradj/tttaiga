# UI DESIGN SYSTEM: "Slate & Ember" (app.css rewrite 2026-09-23)

## Principle
- Professional + futuristic; NEVER pure white bg (light) / pitch black bg (dark).
- Dual theme via `[data-bs-theme]` (web-skit FAB widget is the ONLY active toggle; `assets/theme.js` = dead code, only referenced by unused `app/layouts/main.php`).

## Brand palette
- Brand red scale: `--brand-300..700` (#EB8A7E→#93282C). Ember accent: `--ember-400..500` (#F58A3C/#F0762B).
- `--app-brand`: light `#C9403B`, dark `#E05A50` (brighter for dark bg contrast). `--app-brand-rgb` CHANGES per theme — always use `rgba(var(--app-brand-rgb), a)`.
- Gradient signature: `--app-brand-gradient` (brand→ember 135deg). Used on: navbar-brand text, `.taiga-logo`, `.stat-number.*`, navbar hairline `::after`, card hover hairline `::before`, FAB `.btn-bd-primary`.

## Surfaces (per theme)
- Light: bg `#E9ECF2` + faint radial brand/blue glows (`--app-bg-accent`), surface `#F7F8FB`, raised `#FFF`, muted `#DEE2EB`, field `#FFF`.
- Dark: bg `#1B1F2A` + glows, surface `#242A38`, raised `#2A3142`, muted `#323A4E`, field `#2A3142`.
- Glass: `--app-glass-bg` (navbar, sticky-bulk-bar) + `backdrop-filter: blur`.
- Tokens: `--radius-sm/md/lg` (8/12/16px), `--shadow-card/-pop`, `--ring-brand`.

## Typography
- Google Fonts in main_head.php: Inter (body, `--font-sans`) + Space Grotesk (display, `--font-display` → h1-h3, .card-title, .modal-title, .navbar-brand, .taiga-logo, .stat-number).
- Bootstrap bridge: `--bs-body-font-family`, `--bs-primary(-rgb)`, `--bs-body-*`, `--bs-border-color`, link colors per theme.

## Bootstrap variable caveats (LEARNED)
- `.btn-primary` in BS5.3 has hardcoded hex in `--bs-btn-*` — overriding `--bs-primary` alone does NOTHING. MUST override `.btn-primary` full var set (done, bound to `--app-brand`). Same for `.btn-outline-primary`, `.btn-outline-secondary`.
- `.form-check-input:checked` hardcoded `#0d6efd` → overridden to brand.
- `.bg-light` does NOT theme → overridden to `--app-surface-muted` (fixes white boxes on Me page in dark).
- select2-bootstrap-5-theme@1.3.0 dark-mode breakers (hardcoded, MUST override with EQUAL specificity — app.css loads after CDN so same-specificity wins):
  - `.select2-dropdown` color `#212529` → override `color: var(--app-text)` (bg-only override = invisible text on dark surface).
  - `.select2-dropdown .select2-search .select2-search__field` (4 classes) `#212529`/`#fff`/border `#ced4da` → old 3-class app.css override LOSES specificity → use full 4-class selector + `:focus` variant.
  - message (`Searching…`/no results)/disabled option/group header/placeholder `#6c757d` → `var(--app-text-muted)`.
  - `.select2-selection--single .select2-selection__rendered` (single-select text) → already overridden in app.css.
  - `.select2-selection__choice` (multi-select choice pill text + border) → text `#212529` → `var(--app-text)`; border `#ced4da` → `var(--app-border)`; disabled state → `var(--app-text-muted)`.
  - highlighted + selected options: already overridden to brand vars (OK).
  - Verify pattern: probe getComputedStyle on open `.select2-dropdown` + options in BOTH themes (done 2026-10-20, tasks.php Project filter).
- `.pagination` themed via `--bs-pagination-*` CSS vars (works, no hardcode issue).

## Components
- Navbar (main_navbar.php): `sticky-top`, glass bg, 2px gradient hairline ::after, gradient brand text, nav-link pill hover/active; active state set PHP-side via `basename(PHP_SELF)` incl. detail→list map (`proyek.php`→`proyeks.php` etc).
- `.taiga-list-card`: radius-md, ::before 3px gradient hairline visible on hover only, hover translateY(-3px).
- `.item-header`: gradient `115deg brand-700→brand→ember` + radial white glow ::after.
- `.sticky-bulk-bar.has-selection`: 2px brand bottom border (kept) + brand shadow.
- Login (login.php inline `<style>`): SELF-CONTAINED dark slate #1B1F2A + radial glows + glass card — does NOT follow theme toggle by design; uses own hardcoded tokens (not app vars). Don't reintroduce old blue gradient (#4b6cb7).
- app.css cache-buster: `?v=filemtime` in main_head.php (same pattern as JS assets).

## Verification method (IMPORTANT)
- `chrome-devtools_take_screenshot` ERRORS (model has no image input) — NEVER rely on screenshots; verify via `evaluate_script` getComputedStyle probes + a11y snapshot.
