# Shared Filter: Whitelist per Modul

SSoT: `assets/taiga-core.js`. Tidak ada implementasi lain (`app.js` sudah dibersihkan).

## Rule
- Setiap modul list punya whitelist key sendiri → `TTTTAIGA_FILTER_WHITELIST`.
- Key di luar whitelist modul tujuan **wajib** dibuang saat filter dipersist ke URL/sessionStorage antar modul.
- Tidak ada fallback / "all keys" konstanta. Modul tanpa whitelist → `[]` (tidak membawa filter).

## Whitelist (harus cocok dengan filter toolbar `app/partials/list_header.php`)

| Modul | Keys |
|---|---|
| proyeks.php | q, order_by |
| sprints.php | q, project, order_by |
| sprint_plan_form.php | project |
| epiks.php | q, project, status, assigned_to, order_by |
| usors.php | q, project, status, epic, order_by |
| tasks.php | q, project, status, epic, user_story, assigned_to, order_by |
| isus.php | q, project, status, assigned_to, order_by |

- `milestone` tidak dipakai di toolbar mana pun → tidak masuk whitelist.
- `epic` context-specific: hanya usors + tasks. Ini fix bug "epic bocor ke modul lain".
- `user_story` hanya tasks.
- `sprint_plan_form.php` tidak punya toolbar (`list_header.php`); ia punya `#projectSelect` sendiri
  dan memakai `id` (bukan filter) untuk memilih sprint. `project` dipertahankan agar pilihan
  project di halaman planning ikut tersebar ke list page lain.

## Fungsi kunci (taiga-core.js)
- `tttaigaFilterKeysForPage(page)` → whitelist page.
- `tttaigaBuildSharedFilterParams(params, targetPage)` → filter params by target whitelist.
- `tttaigaReadStoredSharedFilters(targetPage)` / `tttaigaStoreSharedFilters(params)` → sessionStorage difilter whitelist (store pakai current page).
- `tttaigaSharedFilterParams(targetPage)` → current URL dulu (difilter target whitelist), fallback stored.
- `tttaigaUrlWithSharedFilters(href)` → rewrite link nav; target non-shared dibiarkan; buang `TTTTAIGA_ALL_FILTER_KEYS` lalu set hasil whitelist target.
- `tttaigaEnsureSharedFiltersInUrl()` → invariant whitelist saat halaman dibuka: buang semua
  `TTTTAIGA_ALL_FILTER_KEYS` yang tidak dipakai modul ini dari URL (mis. `epic` di `epiks.php`),
  lalu pakai filter URL yang valid atau inject dari sessionStorage.
- `TTTTAIGA_ALL_FILTER_KEYS` = union turunan whitelist (bukan daftar manual) untuk bersihkan query lama.

## Aturan menambah filter baru
1. Tambah select di `app/partials/list_header.php` (flag per halaman).
2. Tambah key ke `TTTTAIGA_FILTER_WHITELIST` HANYA pada modul yang memakai.
3. `taigaGetFilterParams()` (taiga.js) harus sudah emit key tsb.

## Test
`tests/Browser/shared-filter.spec.js` — verifikasi epic/user_story/project tidak bocor antar modul.
