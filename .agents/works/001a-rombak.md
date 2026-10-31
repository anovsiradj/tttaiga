# Rencana Perombakan TTTaiga (Aggressive Refactoring Plan)

## Strategi Utama
Perombakan total struktur *frontend* menggunakan pola **Global Namespace** (`window.TTTaiga`) untuk sentralisasi modul. *Breaking changes* diperbolehkan demi efisiensi dan penghapusan *technical debt*. Aplikasi tetap menggunakan jQuery + Bootstrap 5 tanpa *build step*.

---

## Tahap 0: Safety Net (Mandatory) [Done]
- **Tujuan:** Menjamin stabilitas selama proses refactoring tanpa risiko data produksi.
- **Aksi:**
    - Membuat mock data JSON dari respon API produksi untuk endpoint CRUD utama (Tasks, Projects, UserStories, dsb) dan simpan di `tests/mocks/`.
    - Mengonfigurasi Playwright (`page.route()`) untuk mencegat semua *request* ke `api.php` dan mengembalikan respon dari `tests/mocks/`.
    - Membuat set pengujian Playwright untuk alur CRUD utama sebagai baseline stabilitas.

## Tahap 1: Arsitektur Global Namespace [Done]
- **Tujuan:** Menghilangkan *inline scripts* dan ketergantungan *global scope* yang berantakan.
- **Aksi:**
    - Membuat file `assets/taiga-core.js` yang mendefinisikan `window.TTTaiga = {}`.
    - Memecah fungsi ke dalam sub-namespace:
        - `TTTaiga.API`: Sentralisasi AJAX call.
        - `TTTaiga.UI`: Utilities Bootstrap (modal, badge, renderer).
        - `TTTaiga.Form`: Manajemen siklus hidup form CRUD (Create/Update/Delete).
        - `TTTaiga.Filter`: State management shared filters (LocalStorage-based).

## Tahap 2: Agresif Refactoring (Modul Pilot: Tasks) [Done]
- **Tujuan:** Menghapus logika lama secara radikal dan menerapkan arsitektur baru.
- **Aksi:**
    - Hapus seluruh *inline script* di `tasks.php` dan pindahkan ke `assets/app-tasks.js`.
    - Ganti `setTimeout` (race condition) dengan *promise chaining* yang diatur melalui `TTTaiga.API`.
    - Standardisasi submit form: semua form wajib menggunakan metode `.serializeArray()` yang diproses oleh `TTTaiga.Form`.

## Tahap 3: Standardisasi Bulk Actions [Done]
- **Tujuan:** Menyeragamkan perilaku CRUD di seluruh aplikasi.
- **Aksi:**
    - Buat *generic bulk action engine* di `TTTaiga.API` yang menerima `endpoint`, `items`, dan `method`.
    - Integrasikan *visual feedback* (progress bar/spinner per-item) secara langsung ke dalam *engine* tersebut.
    - Hapus semua `alert()` dan ganti dengan *centralized notification system* pada `TTTaiga.UI`.

## Tahap 4: Rollout & Cleanup [Done]
- **Tujuan:** Menyelesaikan migrasi ke semua modul dan menghapus *legacy code*.
- **Aksi:**
    - Terapkan pola `TTTaiga` namespace ke `usor.php`, `isu.php`, `epik.php`, `sprints.php`, `proyeks.php`.
    - Hapus semua *legacy code* atau fungsi `taigaLoad*` lama yang sudah tidak digunakan.
    - *Refactor* file PHP root untuk hanya memuat layout dan konfigurasi minimal.
    - Audit dependensi lokal (`wiet`, `php-skit`, `web-skit`).
