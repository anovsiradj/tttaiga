# Shared Input: Autofill Form dari Shared Filter

## Masalah
Filter toolbar tidak sinkron dengan form create/update (single maupun bulk).
Ketika filter project/epic/usor di-set, form update/edit tetap kosong di semua dropdown.

## Akar Masalah

### 1. Pagination API — `api.php/projects` cuma return 30 project
`x-paginated-by: 30`, `x-pagination-count: 97`. Project yang dicari (misal id=145) belum tentu ada di halaman 1. `$select.val("145")` silent gagal karena `<option value="145">` tidak ada di DOM.

### 2. Remote select2 — `taigaInitRemoteSelect2` + async `setRemoteValue`
Untuk usor/sprint/epic, helper lama pakai remote select2 (ajax) + fetch-per-item async. select2 remote tidak menampilkan `<option>` yang di-append setelah init. Urutan salah: init select2 dulu → baru append option.

### 3. `TTTaiga.State` tidak pernah disync dari URL/shared filter
`taigaApplyFiltersFromUrl()` set `isInitializing=true`, menekan change handler. State cuma diupdate saat user interaksi, bukan saat load dari URL/sessionStorage.

### 4. Stale `getState().projectSelect` override
Bulk create modal override value pakai state dari localStorage yang bisa stale (bedanya localStorage vs sessionStorage lifetime).

### 5. `setTimeout` hack di single edit
`.val()` setelah 300ms — race condition, tidak reliable.

## Solusi

### S1: Append `<option>` fallback — root fix untuk pagination
DI MANA SAJA yang `selectedValue` tidak ada di list `<option>`, jangan cuma `.val()` tapi append `<option selected>` dengan label.

Diterapkan di:
- `taigaPopulateProjectSelect` (taiga.js:937-943)
- `_populateList` / `taiga-core.js:171-177` (usor/sprint/epic)

### S2: Static list + select2 after populate (ganti remote select2)
Untuk usor/sprint/epic di form create/edit, ganti `taigaInitRemoteSelect2` (remote ajax) dengan `_populateList` yang fetch list statis per project, append options, baru init select2.

### S3: `TTTaiga.Filter.syncState()`
Normalized filter keys (`project`, `status`, dll — bukan DOM id `projectSelect`) disimpan ke State.

### S4: Label resolution
- CREATE: label di-copy dari filter toolbar (`#projectSelect option:selected` dll)
- EDIT: label dari `project_extra_info.name`, `user_story_extra_info.ref + subject`, `milestone_extra_info.name`

### S5: `populateDropdowns(config, values)` — polymorphic helper
Satu fungsi untuk semua module & form type. Config = selectors, values = from filter (create) or from item (edit).

### S6: select2 destroy guard
Di `taigaPopulateProjectSelect`, `taigaPopulateBulkStatuses`, `taigaPopulateBulkMembers`, `_populateList`:
`if ($sel.data('select2')) $sel.select2('destroy')` — sebelum ganti options.

## Bulk create: config ≠ payload (WAJIB dua-duanya)
- `populateDropdowns(config)` cuma mengisi UI. Field baru di modal bulk HARUS:
  1. didaftarkan di `config` (`usorSel`, `epicChecklist`, dll) → populate + autofill dari shared filter;
  2. masuk eksplisit di payload `submitBulkCreate()` → kalau tidak, field murni kosmetik.
- Gejala kalau poin 1 hilang: dropdown kosong + nilai shared filter tidak terpakai (satu akar, dua bug).

## Prinsip (from user)
- "Gak usah aneh2, tinggal append `<option>`" — jangan remote select2, jangan fetch individual item, jangan `.val()` di remote select2.
- "It's just HTML, CSS, JS" — `<option selected>` dan select2 static sudah cukup.
