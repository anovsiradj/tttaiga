# Form ID Convention & saveModal (taiga-core)

## NAMING CONVENTION (hard rule, semua module)
- Modal form id: `single{Type}Form` — singleTaskForm, singleUsorForm, singleIsuForm, singleEpicForm, singleSprintForm
- Hidden inputs: `single{Type}Id`, `single{Type}Version`
- Field ids: `single{Type}{FieldPascal}` (singleTaskSubject, singleTaskAssignee, singleTaskBlocked)
- Submit btn: `#submitSingle{Type}`
- UI alias field (bukan API key): Usor=user_story, Sprint=milestone, Assignee=assigned_to

> Note: Proyek module uses bulk-only workflow; no single create/edit form.

## saveModal (taiga-core.js:127)
- `prefix = formId.replace('Form', '')` → id/version selector: `$('#' + prefix + 'Id')`
- `method = id && Number(id) > 0 ? 'PATCH' : 'POST'`; url `endpoint + '/' + id`; payload tambah `version: parseInt(version)`
- WHAT_NOT: DILARANG `$('#' + formId + 'Id')` → `#singleTaskFormId` tidak ada → id selalu '' → SELALU POST create (bug utama 2026-08-20: Edit→Save malah create duplikat). Fix: prefix.
- Guard id falsy: `if (!id || Number(id) <= 0)` — id="0" itu falsy.

## Field name mapping (Form helpers)
- `_toFieldName(key, aliases)`: snake_case→PascalCase (`user_story`→`UserStory`), alias override (`{user_story:'Usor'}`)
- `_fromFieldName(field, aliases)`: kebalikan (alias→API key, else lowerFirst)
- `_getFormData(formId, aliases)`: baca form→API keys, skip Id/Version/disabled. Fallback only — semua submit handler kirim `data:` eksplisit.
- `populate(formId, data, aliases)`: API keys→form (sebelumnya bug casing + dead code; dipakai untuk vision shared-input autofill)
- WHAT_NOT: populate tidak isi `<select>` tanpa option yang cocok; select2 butuh options di-load dulu → pakai `populateDropdowns`/`_populateList` + append `<option selected>` (lihat tech-shared-input).

## Konvensi bind
- Setiap module: `show.bs.modal` set `single{Type}Id` + `single{Type}Version` (create: kosongkan; edit: dari item)
- Submit handler kirim `data:` object eksplisit
- legacy `assets/taiga.js`: TIDAK ada binding submitSingle*/show.bs.modal/saveModal — aman, jangan tambah di sana
- `taigaExecuteBulk` (taiga.js:754): PATCH selalu sertakan version; URL `api.php/{endpoint}/{id}` — benar

## Validasi live (2026-08-20)
- Task: Edit→Save → `PATCH api.php/tasks/10926` 200, version:1→2, total tidak bertambah
- Isu: `PATCH api.php/issues/1605` 200 (dua kali)
- Login test: DEBUG_USERNAME/DEBUG_PASSWORD di .env, server "Jeemce"

## Struktur web/
- `web/assets/*` = symlink ke `assets/*` (taiga-core.js SAME inode, hash sama) → edit `assets/` saja, web auto-sync. JANGAN Copy-Item (error "overwrite with itself").
- `web/` = docroot terpisah (.htaccess, index.php sendiri); URL utama test pakai root project (localhost:8400/anoop/tttaiga/tasks.php)
- Cache bust: tasks.php pakai `&t=<?php echo time(); ?>`; halaman lain `?v=filemtime()` (cukup, file berubah → version berubah)