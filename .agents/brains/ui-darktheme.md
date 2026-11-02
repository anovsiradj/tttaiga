# ui-darktheme — Light/Dark Mode Toggle Troubleshooting

## Problem
Toggle light/dark mode disabled di beberapa modul (proyek, sprint, usor, epik, task, isu).

## Root Cause (3 code path)

### Path 1: Global `.btn, .dropdown-item` selector (DIPERBAIKI)
Setiap modul JS menambahkan class `.disabled` ke semua `.btn` dan `.dropdown-item` saat operasi bulk:
```
$('.filter-toolbar, .btn, .dropdown-item').addClass('disabled');
```
Menangkap tombol toggle tema (`#bd-theme`) dan item dropdown tema (`[data-bs-theme-value]`) di navbar.

### Path 2: `taigaUpdateBulkActionAvailability()` di taiga.js (DIPERBAIKI — SIDE EFFECT)
Fungsi dipanggil pada inisialisasi setiap halaman list (`taigaBindSelectionLogic` → `taigaUpdateBulkActionAvailability(0)`).
Selector `.dropdown-menu .dropdown-item` sangat luas — menangkap item dropdown tema juga.
Saat `selected=0`, item tema mendapat `toggleClass('disabled', true)` → toggle disabled saat halaman pertama dimuat.

### Path 3: Event delegation click handler (DIPERBAIKI)
`#bulkActionsDropdownContainer .dropdown-item.disabled` di line 1521 masih generik — diubah ke `.tttaiga-bulk-action.disabled`.

## Fix (Custom Class, tanpa :not())

### Path 1 Fix
```
$('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');
$('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
```

### Path 2 Fix (taiga.js line 1460)
```
const $items = $('#bulkActionsDropdownContainer .tttaiga-bulk-action, #bulkActionsDropdown .tttaiga-bulk-action, .bulk-actions-dropdown .tttaiga-bulk-action, [data-bulk-actions] .tttaiga-bulk-action');
```
Skip item dengan `data-bs-theme-value` di awal loop `.each()`.

### Path 3 Fix (taiga.js line 1521)
```
$(document).off('click.bulkAvailability', '#bulkActionsDropdownContainer .tttaiga-bulk-action.disabled').on(...)
```

## File yang Diubah

### JS (8 file)
- assets/app-proyeks.js (4)
- assets/app-sprints.js (6)
- assets/app-usors.js (4)
- assets/app-epiks.js (4)
- assets/app-isus.js (4)
- assets/app-tasks.js (5)
- assets/taiga.js (3: 2 selector + 1 click handler)

### PHP (6 file, 18 elemen dropdown-item)
- proyeks.php, sprints.php, epiks.php, usors.php, tasks.php, isus.php
- Setiap `<a class="dropdown-item">` di `$bulkActions` dapat `tttaiga-bulk-handle tttaiga-bulk-action`

## Class yang Digunakan
| Class | Tujuan | Elemen |
|-------|--------|--------|
| `tttaiga-bulk-handle` | Disable/enable semua tombol bulk op | Buttons di toolbar, bulk bar, modal |
| `tttaiga-bulk-action` | Disable/enable dropdown-item bulk | Hanya `<a class="dropdown-item">` di `$bulkActions` |

## Theme Toggle (aman, tidak diubah)
vendor/anovsiradj/web-skit/widgets/twbs/v5-dark-mode-toggle.html:
- #bd-theme: `class="btn btn-bd-primary py-2 dropdown-toggle"` — no bulk classes
- [data-bs-theme-value] items: `class="dropdown-item d-flex align-items-center"` — no bulk classes

## Side Effects yang Dipertimbangkan & Diantisipasi
| Risiko | Status | Penanganan |
|--------|--------|------------|
| Tema toggle kena `.disabled` dari selector JS global | ✅ Teratasi | Class khusus, tidak ada `.btn`/`.dropdown-item` generik |
| Tema toggle kena `.disabled` dari `taigaUpdateBulkActionAvailability()` | ✅ Teratasi | Skip `data-bs-theme-value` di loop |
| Click handler menangkap tema dropdown | ✅ Teratasi | Menggunakan `.tttaiga-bulk-action.disabled` |
| Bulk ops tidak berfungsi | ✅ Aman | Semua tombol bulk tetap punya class yang benar |
| Detail pages (proyek.php, sprint.php, dll) | ✅ Tidak ada bulk ops | Tidak perlu diubah |
| Login / Index / Sprint Planning | ✅ Tidak ada bulk ops global | Tidak perlu diubah |

## Theme System
- Aktif: vendor web-skit `v5-dark-mode-toggle.js` (id `#bd-theme`, attr `data-bs-theme-value`)
- Memuat via `main_head.php` (CSS + JS) dan `main_navbar.php` (HTML)
- `assets/theme.js` (code mati) sudah dihapus; theme toggle aktif hanya lewat web-skit FAB
- Semua halaman pakai `data-bs-theme="auto"` di `<html>`

---

# Selector Grouping — Organisasi Id/Class Selector

## Masalah
Selector id/class tersebar sebagai string literal di seluruh file JS, dengan pola:
- `$('#searchInput')` dipanggil berkali-kali di banyak fungsi
- `$('#projectSelect'), $('#statusSelect'), ...` diulang di `taigaBindFilters()`
- `$('#masterCheckbox'), $('#clearSelectionBtn')` diulang di `taigaUpdateSelectionUI()`
- Tidak ada caching jQuery object → setiap `$()` melakukan pencarian DOM ulang

## Solusi: TTTaiga.Selectors

### Struktur
Didefinisikan di `assets/taiga.js` sebagai objek dengan 3 grup:

```javascript
TTTaiga.Selectors = {
    strings: {          // Selector string constants
        filter: { search, project, status, epic, userStory, assignedTo, sort },
        bulkBar: { container, masterCheckbox, clearSelection, dropdown, dropdownContainer },
        common: { masterCheckbox, refreshBtn, logoutBtn }
    },
    cache: {},          // jQuery object cache
    $(selector),        // Ambil cached jQuery object
    resetCache()        — Bersihkan cache setelah DOM berubah
}
```

### Penggunaan
```javascript
// Sebelum (string literal terulang)
$('#searchInput').val()
$('#projectSelect').val()
$('#masterCheckbox').prop('checked', false)

// Sesudah (grouped + cached)
TTTaiga.Selectors.$(TTTaiga.Selectors.strings.filter.search).val()
TTTaiga.Selectors.$(TTTaiga.Selectors.strings.filter.project).val()
TTTaiga.Selectors.$(TTTaiga.Selectors.strings.bulkBar.masterCheckbox).prop('checked', false)
```

### Manfaat
1. **Satu sumber kebenaran** —ubah selector ID di satu tempat saja
2. **Caching DOM** —jQuery object disimpan, tidak perlu pencarian DOM berulang
3. **Mudah dibaca** —kelompokkan selector berdasarkan domain (filter, bulkBar, common)
4. **Mudah dirawat** —semua selector terkait lokasi di satu objek

### File yang Diubah untuk Selector Grouping
- `assets/taiga.js` — definisi `TTTaiga.Selectors`, update `taigaGetFilterParams()`, `taigaBindFilters()`, `taigaUpdateSelectionUI()`, `taigaBulkSelectionCallback()`
- `assets/app-tasks.js` — `$sel` object dengan cached selectors untuk content, pagination, checkbox, master, search, submit