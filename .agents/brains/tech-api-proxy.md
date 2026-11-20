# Taiga API Proxy (`api.php`) — error transparency

- `api.php` = session-auth proxy ke Taiga (`https://taiga.jmc.co.id/api/v1`); semua request UI lewat sini.
- Auth: POST `/auth` + header `X-Taiga-Api-Url` → token → POST `login.php` (`action=login`, `taiga_token`, `taiga_user`, `taiga_api_url`) → session PHP.
- Web server: Apache vhost → PHP **8.5 FPM** socket (bukan `php84` CLI). Debug CLI saja beda perilaku (ini worker bisa stale).

## Transport error TIDAK dibungkus generic

- SEBELUMNYA: curl gagal → `{"error":"Proxy error"}` (HTTP 502), sebabnya tersembunyi.
- SEKARANG: `tttaigaProxyEmitTransportError()` (inline di api.php) → 502 + JSON `{error, curl_errno, curl_error, http_status, upstream_url}` — URL **as-is** (tanpa `redactUrl()`, sesuai request user). Dipanggil HANYA saat cURL tidak mengembalikan body sama sekali; response dengan body tetap di-echo apa adanya oleh jalur utama.
- Helper lain `tttaigaProxyEmitUpstreamError()` sudah forward raw body apa adanya — jangan diganti generic.

## Root cause insiden 2026-11-20 (sudah fix di sisi environment)

- `anovsiradj\skit\CURL` di-hardening: `VERIFYHOST=2`, `VERIFYPEER=true` (dulu 0/0). Merge default berubah: argumen pemanggil MENANG (`$defaults + static::$defaults`).
- FPM worker 8.5 punya `curl.cainfo`/`openssl.cafile` stale = `/home/anoop/wasp/cacert.pem` (file tidak ada) → **curl error 77** "error setting certificate file" → semua request gagal sebelum terkirim.
- Sumber: `/home/anoop/srvp/php.ini` (symlink `fpm/conf.d/99-srvp.ini`). User sudah perbaiki path + reload FPM; worker sekarang baca `/home/anoop/srvp/cacert.pem` yang ada.
- TIDAK ada fallback CA di kode aplikasi — ini murni konfigurasi environment.

## Debug cepat

- Reproduksi: POST auth via proxy → lihat `curl_errno`/`curl_error` di body.
- Cek env worker: `ini_get('curl.cainfo')` lewat script sementara di webroot (CLI `php84` bisa beda nilai).
- Verified: auth 200, `/users`, `/projects`, `/epics`, `/milestones?q=`, `/userstories?order_by=`, `/tasks?epic=` semua 200.
