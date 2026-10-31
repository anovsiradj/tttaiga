# Sprint Planning Module — Current State (post-fix)

## STATUS: FIXED & TESTED (2026-10-23)

All suites green: 13 PHP unit, 6 PHP integration, 12 browser (Playwright).
`node --check assets/app-sprint-planning.js` OK. `php -l sprint_plan_form.php` OK.

## Architecture (current)

- `sprint_plan_form.php` — shell + `<template id="usorCardTemplate">` (SSoT kartu USOR, no HTML string concat in JS)
- `assets/app-sprint-planning.js` — all logic; single buildUsorCard() renders both panels from template
- Bulk add via `POST api.php/userstories/bulk_update_milestone` `{project_id, milestone_id, bulk_stories:[{us_id, order}]}` (one call for N adds)
- Bulk remove = individual `PATCH /userstories/{id}` `{milestone: null, version}` (Taiga REJECTS `milestone_id: null` on bulk endpoint — verified live)
- Backlog filter = `milestone__isnull=true` (NOT `milestone: 0` — returns nothing, verified live)
- Points: `usor.points = {roleId: pointScaleId}`; sum computable roles via `GET /points` + `GET /roles`; capacity badge = target + pendingAdd − pendingRemove
- fetchAllPages(): loops pages by X-Pagination-Count; page_size 100
- Promise chains everywhere; zero setTimeout races
- Separate searchTimeout per input
- Select2 project change bound to `select2:select` (jQuery change from Select2 has originalEvent===undefined always → guarding change with originalEvent swallows user picks; verified from jQuery.Event ctor)
- destroySortable() guard: jQuery UI sortable('destroy') THROWS on never-init elements ("cannot call methods on sortable prior to initialization") → broke promise chain silently pre-fix

## Bugs fixed (all verified, several live-probed)

1. Syntax error line 160 `{(projectId) {` — file never parsed; whole module dead
2. receive handlers swapped source/target + wrong array lookups → both drag directions no-op + item vanished
3. setTimeout(500) races ×3 → promise chains
4. shared searchTimeout cross-cancel
5. milestone=0 → milestone__isnull=true
6. page_size 500 hardcoded → fetchAllPages loop
7. HTML string concat ×3 → <template>
8. Select2 change guard swallowed user picks
9. sortable destroy throw broke chain silently
10. Pending additions never shown in target panel → renderTargetUsors merges pendingAdditions
11. Queued-add usors stayed visible in source → renderSourceUsors filters pendingAdditions
12. isSaving guard: loadPlanningData/discardChanges blocked during save (pending maps can't mutate under save loop)

## Side-effect audit (2026-10-23, all verified green)

- navbar `isu.php` → `isus.php` fixed (detail page wrongly used as nav target; active-state still maps isu.php→isus.php via detailToList)
- All navbar active states verified across 7 list pages + 6 detail pages + sprint_plan_form
- vendor web-skit dark-mode-toggle FIXED: showActiveTheme null-guards (markup optional; setTheme still applies data-bs-theme). Login page no longer throws. Verified: theme/active/stored/icon/aria-label all sync on real interaction.
- web-skit repo: 1 file modified (v5-dark-mode-toggle.js +6 lines); tttaiga consumes via symlink vendor/anovsiradj/web-skit → /home/anoop/works/pkgs/web-skit
- composer validate: 0 errors (3 pre-existing style warnings re @dev/@stable constraints, untouched)
- spec .agents/works/002.md fully implemented except intentional deviations: parallel batches → sequential (OCC-safe), milestone=0 → milestone__isnull (live-verified), bulk PATCH → bulk endpoint + individual PATCH removes (Taiga constraint)

## Tests

- `tests/Browser/sprint-planning.spec.js` — 8 tests; full mock API (api.php + login.php session + real vendor JS from tests/mocks/vendor/); records mutating calls; asserts bulk endpoint format + OCC version on PATCH
- Session bootstrap pattern: `page.request.post('login.php', {form:{action:'login', taiga_token, taiga_user, taiga_api_url}})` (leading slash resolves to origin — use relative!)
- tests/mocks/vendor/: jquery (npm), bootstrap/jquery-ui/select2 (copied from /srv local projects; jquery-ui must include sortable widget)
- Pre-existing login tests updated: redirect now `login.php?redirect=...` → regex `\/login\.php(\?|$)`

## Live verification (project 107 only — AGENTS.md rule)

- Login flow OK; project select → milestones call fires; backlog 5 USORs w/ points payload
- 107 has NO sprints yet → sprint select empty is correct data state, not a bug
- Probe artifacts: usor 2905 (project 91) NOT mutated (milestone null, version 2 unchanged)
- dark-mode-toggle live: switch to dark verified end-to-end (theme attr, active btn, localStorage, icon, aria-label)

## Next improvements (backlog)

- Sprint goal field, drag-between-sprints (currently checkbox/bulk only), epic swimlanes, task preview
- Custom bulk action (prefix titles) per AGENTS.md vision
