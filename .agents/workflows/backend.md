---
description: Taiga API workflow (backend)
---

# Taiga API Workflow (Backend)

Backend integration is a single PHP proxy entrypoint: `api.php`. Browser requests go to `api.php/<taiga-endpoint>`, and the proxy forwards them to the configured Taiga server.

## Configuration
- Default Taiga API base URL: `app/configs/taiga.php`
- Optional override per request: `X-Taiga-Api-Url` header

## Authorization Behavior
The proxy forwards `Authorization` when provided by the browser.

Fallbacks:
- If `$_SESSION['taiga_token']` exists and the request is missing `Authorization`, the proxy injects `Bearer <session token>`.
- If Apache strips the `Authorization` header, the proxy attempts to read it from `apache_request_headers()`.

## Request Forwarding
- Method: forwards `GET`, `POST`, `PATCH`, `PUT`, `DELETE`
- Body: forwards raw `php://input` as-is
- Query string: forwarded; for `GET /projects`, the proxy auto-adds `member=<user_id>` if missing and the user_id can be decoded from the bearer token payload
- Status code: forwards Taiga’s HTTP status code back to the client
- Headers: forwards response `X-*` headers back to the client

## Epic filter on tasks (`GET /tasks?epic=`)
Taiga's `/tasks` has no `epic` filter (its `filters_data` only exposes statuses/assigned_to/owners/tags/roles). When `GET /tasks` includes `epic`, `api.php` translates it instead of forwarding it:
1. `GET /userstories?project=&epic=&page_size=1000` → the epic's user story ids (`/userstories` *does* support `epic`).
2. `GET /tasks?project=&...&page_size=1000` with all other filters, **without** `epic` — Taiga returns the full, already-ordered list.
3. Keep only tasks whose `user_story` is in that id set (plus `user_story` if also given), then re-slice.
4. Emit its own `X-Paginated`, `X-Paginated-By`, `X-Pagination-Count`, `X-Pagination-Current` headers (Taiga's pagination headers are **not** forwarded in this branch) so `taigaRenderPagination()` keeps working.

Implementation: `tttaigaProxyTasksByEpic()` in `api.php` + `app/helpers/TaigaTaskEpicFilter.php` (pure, unit-tested). On upstream error it returns the error status — it never falls back to unfiltered tasks. An epic with no user stories returns `[]` + count 0.

## CORS
`api.php` responds with permissive CORS headers (including `Access-Control-Allow-Origin: *`) and handles `OPTIONS` preflight by exiting early.

## Caching
`GET` requests to selected endpoints are cached on disk under `storage/tmp`:
- `/epic-statuses`, `/userstory-statuses`, `/task-statuses`, `/issue-statuses`, `/memberships`, `/users`

Cache key:
- Includes API base URL + path + normalized query params
- For `/memberships` and `*-statuses`, cache is normalized to only include `project`

TTL:
- Most cached endpoints: 3600s
- `/memberships`: 300s
- `/users`: 300s

Proxy adds `X-Cache: HIT|MISS` to indicate cache behavior.
