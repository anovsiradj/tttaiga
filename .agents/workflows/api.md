---
description: Taiga API workflows (overview)
---

# Taiga API Workflows

This project integrates with the Taiga API to manage projects, epics, user stories, tasks, and issues.

## Official Documentation
Always refer to the official Taiga API documentation for endpoint details, request/response formats, and authentication:
<https://docs.taiga.io/api.html>

## Workflow Split
- Frontend usage (jQuery/Select2 helpers, pagination, bulk operations): see [frontend.md](./frontend.md)
- Backend proxy behavior (`api.php`, caching, auth fallback): see [backend.md](./backend.md)

## Integration Map
- Backend proxy: `api.php` (forwards requests to Taiga, handles caching and Authorization fallbacks)
- Frontend helpers: `assets/taiga.js` (AJAX/Select2/pagination/filter/bulk helpers) + `assets/taiga-core.js` (session init, shared-filter whitelist, form helpers)
- Frontend globals: `app/layouts/main_head.php` meng-inject `window.TTTaigaSession`; `assets/taiga-core.js` memetakannya ke `window.taigaToken`/`apiUrl`/`taigaModel` (berbasis PHP session, bukan localStorage)
- Default server config: `app/configs/taiga.php`

## Terminology (UI)
- Epic = Epik
- Issue = Isu
- User Story = Usor

## Best Practices
- **Use the proxy**: Prefer `api.php/<endpoint>` from the browser to avoid CORS and keep behavior consistent.
- **Filter on server**: Pass `q`, `project`, `status`, `assigned_to`, `order_by`, `page`, `page_size` to Taiga.
- **Fetch dynamic metadata**: Load statuses/members per project; avoid hardcoding IDs.
- **Standardize UI**: Use Select2 and the shared helpers in `assets/taiga.js` for consistent behavior.
