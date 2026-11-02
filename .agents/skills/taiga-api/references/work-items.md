# Work Items

Project aliases in this repo:
- `usor` = user story = `/userstories`
- `isu` = issue = `/issues`
- `sprint` = milestone = `/milestones`
- `member` = membership = `/memberships`

Keep aliases in UI text when the project already uses them, but use the official endpoint names in API code.

## Epics

### Endpoints
- `GET /api/v1/epics` - List epics (supports pagination, filtering)
- `POST /api/v1/epics` - Create epic
- `GET /api/v1/epics/{id}` - Get epic by ID
- `GET /api/v1/epics/by_ref?ref={ref}&project={projectId}` - Get epic by ref (e.g., "EP-1")
- `PUT /api/v1/epics/{id}` - Full update (replace entire object)
- `PATCH /api/v1/epics/{id}` - Partial update
- `DELETE /api/v1/epics/{id}` - Delete epic (requires `version` in body)
- `POST /api/v1/epics/bulk_create` - Bulk create epics
- `GET /api/v1/epics/filters_data?project={projectId}` - Get filter metadata for UI (statuses, priorities, etc.)

### Required create fields
- `project` (integer, project ID)
- `subject` (string, title)

### Common fields
- `description` (string, HTML allowed)
- `status` (integer, status ID)
- `assigned_to` (integer, user ID)
- `color` (string, hex color)
- `tags` (array of strings)
- `watchers` (array of user IDs)
- `owner` (integer, user ID - defaults to creator)
- `is_backlog` (boolean)
- `is_closed` (boolean)
- `version` (integer, required for updates)

### Related user stories
- `GET /api/v1/epics/{epicId}/related_userstories` - List related user stories
- `POST /api/v1/epics/{epicId}/related_userstories` - Create related user story
- `GET /api/v1/epics/{epicId}/related_userstories/{userStoryId}` - Get related user story
- `PUT/PATCH /api/v1/epics/{epicId}/related_userstories/{userStoryId}` - Update related user story
- `DELETE /api/v1/epics/{epicId}/related_userstories/{userStoryId}` - Delete related user story
- `POST /api/v1/epics/{epicId}/related_userstories/bulk_create` - Bulk create related user stories

### Voting & Watching
- `POST /api/v1/epics/{id}/upvote` - Vote (star) an epic
- `POST /api/v1/epics/{id}/downvote` - Remove vote
- `GET /api/v1/epics/{id}/voters` - List voters
- `POST /api/v1/epics/{id}/watch` - Watch epic
- `POST /api/v1/epics/{id}/unwatch` - Unwatch epic
- `GET /api/v1/epics/{id}/watchers` - List watchers

### Attachments
- `GET /api/v1/epics/attachments` - List attachments (filter by `object_id`)
- `POST /api/v1/epics/attachments` - Create attachment (multipart/form-data)
- `GET /api/v1/epics/attachments/{id}` - Get attachment
- `PUT/PATCH /api/v1/epics/attachments/{id}` - Update attachment
- `DELETE /api/v1/epics/attachments/{id}` - Delete attachment

## User Stories (usor)

### Endpoints
- `GET /api/v1/userstories` - List user stories
- `POST /api/v1/userstories` - Create user story
- `GET /api/v1/userstories/{id}` - Get user story by ID
- `GET /api/v1/userstories/by_ref?ref={ref}&project={projectId}` - Get by ref (e.g., "US-1")
- `PUT /api/v1/userstories/{id}` - Full update
- `PATCH /api/v1/userstories/{id}` - Partial update
- `DELETE /api/v1/userstories/{id}` - Delete (requires `version`)
- `POST /api/v1/userstories/bulk_create` - Bulk create
- `POST /api/v1/userstories/bulk_update_backlog_order` - Bulk update backlog order
- `POST /api/v1/userstories/bulk_update_kanban_order` - Bulk update kanban order
- `POST /api/v1/userstories/bulk_update_sprint_order` - Bulk update sprint order
- `POST /api/v1/userstories/bulk_update_milestone` - Bulk update milestone
- `GET /api/v1/userstories/filters_data?project={projectId}` - Get filter metadata

### Required create fields
- `project` (integer)
- `subject` (string)

### Common fields
- `description` (string)
- `status` (integer, status ID)
- `milestone` (integer, milestone/sprint ID)
- `assigned_to` (integer, user ID)
- `epic` (integer, epic ID)
- `points` (integer, story points ID from `/points`)
- `tags` (array of strings)
- `watchers` (array of user IDs)
- `owner` (integer, user ID)
- `is_blocked` (boolean)
- `blocked_note` (string)
- `version` (required for updates)

### Custom attributes values
- `GET /api/v1/userstories/custom-attributes-values/{userStoryId}` - Get custom attribute values
- `PUT/PATCH /api/v1/userstories/custom-attributes-values/{userStoryId}` - Set custom attribute values

### Voting, Watching, Attachments - same pattern as epics

## Tasks

### Endpoints
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `GET /api/v1/tasks/{id}` - Get task by ID
- `GET /api/v1/tasks/by_ref?ref={ref}&project={projectId}` - Get by ref (e.g., "TA-1")
- `PUT /api/v1/tasks/{id}` - Full update
- `PATCH /api/v1/tasks/{id}` - Partial update
- `DELETE /api/v1/tasks/{id}` - Delete (requires `version`)
- `POST /api/v1/tasks/bulk_create` - Bulk create tasks
- `GET /api/v1/tasks/filters_data?project={projectId}` - Get filter metadata

### Epic filtering (app proxy)
- `/tasks` does **not** support `epic` (its `filters_data` exposes only statuses/assigned_to/owners/tags/roles).
- The app proxy (`api.php`) translates `GET /tasks?epic=` into user story membership; callers can keep sending `epic`.

### Required create fields
- `project` (integer)
- `subject` (string)

### Common fields
- `user_story` (integer, user story ID - required for tasks)
- `milestone` (integer, milestone ID)
- `status` (integer, task status ID)
- `assigned_to` (integer, user ID)
- `description` (string)
- `tags` (array of strings)
- `watchers` (array of user IDs)
- `owner` (integer, user ID)
- `is_blocked` (boolean)
- `blocked_note` (string)
- `version` (required for updates)

### Custom attributes values
- `GET /api/v1/tasks/custom-attributes-values/{taskId}` - Get custom attribute values
- `PUT/PATCH /api/v1/tasks/custom-attributes-values/{taskId}` - Set custom attribute values

## Issues (isu)

### Endpoints
- `GET /api/v1/issues` - List issues
- `POST /api/v1/issues` - Create issue
- `GET /api/v1/issues/{id}` - Get issue by ID
- `GET /api/v1/issues/by_ref?ref={ref}&project={projectId}` - Get by ref (e.g., "IS-1")
- `PUT /api/v1/issues/{id}` - Full update
- `PATCH /api/v1/issues/{id}` - Partial update
- `DELETE /api/v1/issues/{id}` - Delete (requires `version`)
- `GET /api/v1/issues/filters_data?project={projectId}` - Get filter metadata
- **Note**: No bulk create endpoint for issues

### Required create fields
- `project` (integer)
- `subject` (string)

### Common fields
- `status` (integer, issue status ID)
- `severity` (integer, severity ID)
- `priority` (integer, priority ID)
- `type` (integer, issue type ID)
- `milestone` (integer, milestone ID)
- `assigned_to` (integer, user ID)
- `description` (string)
- `tags` (array of strings)
- `watchers` (array of user IDs)
- `owner` (integer, user ID)
- `is_blocked` (boolean)
- `blocked_note` (string)
- `version` (required for updates)

### Custom attributes values
- `GET /api/v1/issues/custom-attributes-values/{issueId}` - Get custom attribute values
- `PUT/PATCH /api/v1/issues/custom-attributes-values/{issueId}` - Set custom attribute values

## Common List Filters (all work items)

Query parameters for list endpoints:
- `project` (integer, required for most lists)
- `status` (integer)
- `owner` (integer, user ID)
- `assigned_to` (integer, user ID)
- `milestone` (integer, milestone ID)
- `tags` (string, comma-separated)
- `watchers` (integer, user ID)
- `status__is_closed` (boolean)
- `exclude_status` (integer)
- `exclude_assigned_to` (integer)
- `order_by` (string, e.g., "created_date", "-created_date", "order", "ref")
- `x-disable-pagination` (header, set to "True" to disable)

### Ignored list params (verified live)
Some params are accepted with HTTP 200 but silently ignored:
- `/epics?order_by=` — **all** fields ignored (verified with subject/created_date/modified_date/status/ref).
- `/projects?order_by=` — only `total_fans`, `total_activity` honored; `name`, `created_date`, `modified_date` ignored.
- `/milestones?q=` (and `name`/`search`) — ignored; milestones have no text search. `closed=true|false` **does** work.
- `/milestones?order_by=modified_date` — ignored (`name`, `created_date`, `estimated_start`, `estimated_finish` work).
- `/projects?status=` — ignored (the UI disables the status filter there).
- `/epics?user_story=` — ignored (no page uses it).
- Tasks have no `task_order` field: the real fields are `taskboard_order` (not orderable) and `us_order` (orderable, used for the UI "Task Order" sort).
- Epic custom order field is `epics_order` (plural).

The app proxy (`api.php` + `app/helpers/TaigaProxyList.php`) compensates for these: it searches milestones by name and sorts the affected endpoints in PHP. Callers keep sending the normal params.

## Version/OCC for all work items

**ALL write operations (PUT, PATCH, DELETE) require the `version` field.**

- GET responses include `version` (integer)
- Create (POST): Do not send version (starts at 1)
- Update (PUT/PATCH): Must include current `version`
- Delete (DELETE): Must include current `version` in request body
- On success: version increments, new version returned in response
- On conflict: 409/400 error, re-fetch and retry

### Delete with version example
```json
DELETE /api/v1/userstories/123
Content-Type: application/json
{
  "version": 5
}
```