# TTTaiga

proxy taiga API untuk mempermudah dan menyederhanakan CRUD,
salah satunya adalah dengan adanya fitur bulk form untuk create/update dan bulk delete.

dokumentasi resmi API <https://docs.taiga.io/api.html>.

## development

menjadikan proyek ini sebagai pilot proyek sekaligus menyempurnakan php-skit dan web-skit.

## Offers

### Kelebihan aplikasi TTTaiga

- **API Proxy yang terintegrasi**: Forward otomatis request ke Taiga API dengan handling CORS yang tepat
- **Bulk Operations untuk semua entitas**:
  - Bulk Create: Buat banyak Usor, Epik, Sprint, Task, Issue, Proyek sekaligus
  - Bulk Update: Update status, prioritas, assignee, dan field lain secara massal
  - Bulk Delete: Hapus entitas secara batch dengan konfirmasi
  - Custom Bulk Action: Tambahkan prefix ke nama proyek secara massal
- **Shared Filter & Shared Input**: Filter yang dipakai di satu modul otomatis diterapkan ke modul lainnya, memudahkan filtering konsisten di seluruh aplikasi
- **Transformasi Data yang Cerdas**:
  - Filtering/search yang tidak didukung Taiga native (misal: `/milestones?q=`)
  - Sorting kustom untuk field yang Taiga abaikan (name, date, modified_date)
  - Paginasi yang konsisten di semua endpoint
- **Caching yang Efisien**: Cache sementara untuk data yang jarang berubah (statuses, memberships, users) dengan TTL yang dioptimalkan
- **Filter Tasks by Epic**: Taiga native tidak support filter tasks by epic, namun TTTaiga mengatasi ini dengan menerjemahkan ke relationship user story

### Fitur khusus Taiga

- **Proxy Multi-Endpoint**: Dukungan bukaantaiga.com maupun instance Taiga self-hosted
- **Token-based Authentication**: Session PHP dengan token JWT yang otomatis diekstrak user_id
- **Error Handling yang Ringkas**: Response error yang jelas dari upstream Taiga API

### Teknologi

- **PHP 8.4** dengan skit (anovsiradj/php-skit) untuk request HTTP
- **Web Skit** (anovsiradj/web-skit) untuk rendering template
- **Bootstrap 5** + **Bootstrap Icons** untuk UI yang responsif

## assets

karena belum pakai `deno bundle` jadi untuk sekarang pakai symlink dulu.

(windows)

```sh
New-Item -ItemType Junction -Path "C:\projects\anoop\tttaiga\web\assets" -Value "C:\projects\anoop\tttaiga\assets"
```
