# Taiga API — Stats/Analytics Endpoints (LIVE-VERIFIED 2026-11-11)

Instance: taiga.jmc.co.id (server 'default' di app/configs/taiga.php). Org: 18 proyek aktif+arsip, member sampai 25/proyek, user 19 = anovsiradj (PO proyek 107).

## Endpoint stats native (semua GET, verified live)

- `GET /projects/{id}/stats` → burnup proyek: `defined_points`, `closed_points`, `assigned_points` + `_per_role` (key=role id), `milestones[]` {name, optimal, evolution, team-increment, client-increment}, `speed`, `total_points`, `total_milestones`. Verified: p91 defined=270 closed=180 per-role 814/816/817.
- `GET /projects/{id}/issues_stats` → `total/opened/closed_issues`, `issues_per_{type,status,priority,severity,owner,assigned_to}` (dgn color/name), `last_four_weeks_days` {by_open_closed{open[],closed[]}, by_severity, by_priority, by_status} → KPI trend 4 minggu GRATIS dari server.
- `GET /milestones/{id}/stats` → burndown harian: `days[]` {day, open_points, optimal_points}, `completed_points[]`, `total/completed_{userstories,tasks}`, `iocaine_doses`.
- `GET /users/{id}/stats` → `roles[]`, `total_num_projects`, `total_num_contacts`, `total_num_closed_userstories`.
- NOTE p107: semua stats=0 (belum ada points/sprint di 107).

## Endpoint load/workload (verified live)

- `GET /tasks?assigned_to={id}` → cross-project, native filter works: 113 tasks utk user 19. Task fields: `due_date`, `finished_date`, `created_date`, `is_closed`, `milestone`, `user_story`, `status`, `project`. TASK PUNYA NO POINTS/ESTIMATE (points hanya di US).
- `GET /userstories?project={id}&assigned_to=&status__is_closed=&milestone__isnull=&watchers=&order_by=-modified_date` → SEMUA filter native OK (verified p91). US list fields: `points` {roleId: pointId}, `total_points`, `milestone(_name)`, `assigned_to`, `assigned_users`, `is_closed`, `due_date(_status)`, `finish_date`, `epics[]`, `tasks[]`, `tags`, `client/team_requirement`.
- `GET /issues?assigned_to=&status__is_closed=` → native ok.
- `GET /users?project={id}` → directory per proyek (full_name, photo).
- `GET /memberships?project={id}` → roster: `user`, `role(_name)`, `is_admin`, `is_owner`, `is_user_active`, `user_order`.
- `GET /points?project={id}` → scale `value` (null utk "?"); `GET /roles?project={id}` → `computable` flag (kunci sum per-role, dipakai sprint-planning).

## Timeline & History (verified)

- `GET /timeline/{user|profile|project}/{id}?limit=` → entry {event_type, created, data.user, data.values_diff{field:[old,new]}, data.project}. event_type e.g. "epics.epic.change".
- `GET /history/{userstory|task|issue|wiki}/{id}` → entries {created_at, user, type, values_diff, values, comment, is_hidden, is_snapshot} → lead/cycle-time + transisi status.

## Epics (verified p91/640)

- Detail: `status`, `color`, `tags`, `client/team_requirement`, `watchers`. `total_userstories/total_points/assigned_users` = null di list→ tidak reliable; hitung via `/epics/{id}/related_userstories` + US `total_points`.
- Taiga TIDAK punya object OKR/quarterly-goal native. Kandidat pemodelan: epics + tags + custom-attributes; atau storage lokal TTTaiga.
- custom-attributes (us/task/issue/epic): endpoint ada, p107 kosong (belum dipakai org).

## Gotcha env/creds

- `.env` DEBUG_PASSWORD berisi literal `"P@ssw0rd22"` (dgn tanda kutip) → parser env tidak strip; baca manual harus kutip-strip. Login: POST /auth {type:normal} (username ATAU email).
- `POST /api/v1` tanpa path → 400 (server up); `GET /api/v1` → 404 (normal).
- milestone p91 "test" = SATU-satunya sprint di org 2026 → sprint nyaris tak dipakai; modul exec jangan bergantung sprint.
