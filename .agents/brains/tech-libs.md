## php-skit

LOC: path dev-machine (composer path repo, environment-specific); di repo ini di-resolve ke `vendor/anovsiradj/php-skit`
SOURCE: `src/` — autoload `anovsiradj\skit\*`
STATUS: active development, minimal skeleton
CURRENT: `App.php` — abstract bootstrap placeholder (empty body)
ENTRIES: functs, helpers (Date/Intl/Letter/Number/Roman/Time), spreadsheet, tests
USAGE IN TTTaiga: `app/helpers/App.php` extends/follows pattern from php-skit's App.
GOAL: develop php-skit alongside tttaiga as PoC.

## web-skit

LOC: path dev-machine (composer path repo, environment-specific); di repo ini di-resolve ke `vendor/anovsiradj/web-skit`
SOURCE: `helpers/`, `widgets/`, `assets/`, `plugins/`
STATUS: early dev
CURRENT:
- `helpers/window.js` — empty
- `widgets/twbs/` — Bootstrap 5 dark mode toggle (css, html, js)
- `widgets/input-autoz.css` + `input-autoz.js`
USAGE IN TTTaiga: dark-mode toggle widget (`widgets/twbs/v5-dark-mode-toggle.*`) aktif di `app/layouts/main_head.php` + `main_navbar.php`; widget lain masih PoC.
GOAL: develop web-skit as JS/jQuery + Bootstrap 5 widget library alongside tttaiga.

## TTTaiga app namespace

`app\helpers\App` — custom config/env loader using php-skit pattern
`app\helpers\TaigaApiConfig` — Taiga API URL resolver

## Constraint

- wajib bootstrap 5
- wajib jQuery (3.6+)
- boleh rombak total
- `php84` untuk PHP CLI
- `php84c` untuk composer
- Apache local server, URL dari `APP_URL` di `.env`

## Debug & Test Data Boundary (AGENTS.md, non-negotiable)

- HANYA epic/sprint/usor/task/isu di proyek **TTTaiga (ID: 107)** yang boleh disentuh untuk debug/test.
- DILARANG menyentuh proyek lain (91, 146, dst.) — read-only pun untuk mutasi.
- DILARANG hapus data tanpa izin eksplisit user.
- Login live: `DEBUG_USERNAME`/`DEBUG_PASSWORD` di `.env`, proxy `api.php` (session PHP).

