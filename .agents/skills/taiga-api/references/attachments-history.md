# Attachments, History, Comments, Votes, Watchers

## Attachments

### General Rules
- Use `multipart/form-data` for uploads (NOT `application/json`)
- Each resource type has its own attachment endpoints
- Attachments are linked to objects via `object_id` query parameter

### Endpoints by Resource

#### Epics
- `GET /api/v1/epics/attachments?object_id={epicId}` - List
- `POST /api/v1/epics/attachments` - Upload
- `GET /api/v1/epics/attachments/{id}` - Get
- `PUT/PATCH /api/v1/epics/attachments/{id}` - Update (metadata only)
- `DELETE /api/v1/epics/attachments/{id}` - Delete

#### User Stories
- `GET /api/v1/userstories/attachments?object_id={usId}` - List
- `POST /api/v1/userstories/attachments` - Upload
- `GET /api/v1/userstories/attachments/{id}` - Get
- `PUT/PATCH /api/v1/userstories/attachments/{id}` - Update
- `DELETE /api/v1/userstories/attachments/{id}` - Delete

#### Tasks
- `GET /api/v1/tasks/attachments?object_id={taskId}` - List
- `POST /api/v1/tasks/attachments` - Upload
- `GET /api/v1/tasks/attachments/{id}` - Get
- `PUT/PATCH /api/v1/tasks/attachments/{id}` - Update
- `DELETE /api/v1/tasks/attachments/{id}` - Delete

#### Issues
- `GET /api/v1/issues/attachments?object_id={issueId}` - List
- `POST /api/v1/issues/attachments` - Upload
- `GET /api/v1/issues/attachments/{id}` - Get
- `PUT/PATCH /api/v1/issues/attachments/{id}` - Update
- `DELETE /api/v1/issues/attachments/{id}` - Delete

#### Wiki Pages
- `GET /api/v1/wiki/attachments?object_id={wikiId}` - List
- `POST /api/v1/wiki/attachments` - Upload
- `GET /api/v1/wiki/attachments/{id}` - Get
- `PUT/PATCH /api/v1/wiki/attachments/{id}` - Update
- `DELETE /api/v1/wiki/attachments/{id}` - Delete

### Upload Request (multipart/form-data)
```
POST /api/v1/userstories/attachments
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="object_id"

123
------WebKitFormBoundary
Content-Disposition: form-data; name="attached_file"; filename="screenshot.png"
Content-Type: image/png

<binary data>
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Screenshot of the bug
------WebKitFormBoundary--
```

### Upload Response
```json
{
  "id": 456,
  "filename": "screenshot.png",
  "filesize": 102400,
  "content_type": "image/png",
  "description": "Screenshot of the bug",
  "is_deprecated": false,
  "attached_to": "userstories",
  "object_id": 123,
  "project": 1,
  "uploader": 2,
  "uploader_extra_info": { ... },
  "created_date": "2026-01-15T10:30:00Z",
  "url": "https://taiga.example.com/media/attachments/.../screenshot.png",
  "thumbnail_url": "https://taiga.example.com/media/attachments/.../thumb_screenshot.png"
}
```

### Delete Attachment
Requires `version` in request body (OCC):
```json
DELETE /api/v1/userstories/attachments/456
Content-Type: application/json
{
  "version": 1
}
```

## History

### Get Object History
```bash
GET /api/v1/history/userstory/{userStoryId}
GET /api/v1/history/task/{taskId}
GET /api/v1/history/issue/{issueId}
GET /api/v1/history/wiki/{wikiId}
GET /api/v1/history/epic/{epicId}
```

**Response:** Array of history entries (paginated)

### History Entry Object
```json
{
  "id": 1,
  "type": "userstory",  // or task, issue, wiki, epic
  "field": "status",
  "old_value": "1",
  "new_value": "2",
  "old_value_extra_info": { "id": 1, "name": "New", "color": "#..." },
  "new_value_extra_info": { "id": 2, "name": "In Progress", "color": "#..." },
  "comment": "Moved to sprint",
  "user": 2,
  "user_extra_info": { ... },
  "created_date": "2026-01-15T10:30:00Z",
  "version": 5
}
```

### Comment History (separate endpoint)
```bash
GET /api/v1/history/comment/{commentId}/versions
```

### Edit Comment
```bash
PATCH /api/v1/history/comment/{commentId}
Content-Type: application/json
{
  "comment": "Updated comment text",
  "version": 3
}
```

### Delete Comment
```bash
DELETE /api/v1/history/comment/{commentId}
Content-Type: application/json
{
  "version": 3
}
```

### Undelete Comment
```bash
POST /api/v1/history/comment/{commentId}/undelete
```

## Comments (via History)

Comments are stored as history entries with `field: "comment"`.

### Add Comment
Use the standard update endpoint (PATCH) on the resource with a `comment` field:
```bash
PATCH /api/v1/userstories/123
Content-Type: application/json
{
  "comment": "This is a comment",
  "version": 5
}
```

Response includes the new history entry with the comment.

## Votes (Upvotes/Stars)

### Epics
- `POST /api/v1/epics/{id}/upvote` - Vote
- `POST /api/v1/epics/{id}/downvote` - Remove vote
- `GET /api/v1/epics/{id}/voters` - List voters

### User Stories
- `POST /api/v1/userstories/{id}/upvote`
- `POST /api/v1/userstories/{id}/downvote`
- `GET /api/v1/userstories/{id}/voters`

### Tasks
- `POST /api/v1/tasks/{id}/upvote`
- `POST /api/v1/tasks/{id}/downvote`
- `GET /api/v1/tasks/{id}/voters`

### Issues
- `POST /api/v1/issues/{id}/upvote`
- `POST /api/v1/issues/{id}/downvote`
- `GET /api/v1/issues/{id}/voters`

### Projects
- `POST /api/v1/projects/{id}/like`
- `POST /api/v1/projects/{id}/unlike`
- `GET /api/v1/projects/{id}/fans`

### Vote Response
```json
{
  "voted": true,
  "voters_count": 5
}
```

## Watchers (Notifications)

### Epics
- `POST /api/v1/epics/{id}/watch` - Add watcher (current user)
- `POST /api/v1/epics/{id}/unwatch` - Remove watcher
- `GET /api/v1/epics/{id}/watchers` - List watchers

### User Stories
- `POST /api/v1/userstories/{id}/watch`
- `POST /api/v1/userstories/{id}/unwatch`
- `GET /api/v1/userstories/{id}/watchers`

### Tasks
- `POST /api/v1/tasks/{id}/watch`
- `POST /api/v1/tasks/{id}/unwatch`
- `GET /api/v1/tasks/{id}/watchers`

### Issues
- `POST /api/v1/issues/{id}/watch`
- `POST /api/v1/issues/{id}/unwatch`
- `GET /api/v1/issues/{id}/watchers`

### Milestones
- `POST /api/v1/milestones/{id}/watch`
- `POST /api/v1/milestones/{id}/unwatch`
- `GET /api/v1/milestones/{id}/watchers`

### Projects
- `POST /api/v1/projects/{id}/watch`
- `POST /api/v1/projects/{id}/unwatch`
- `GET /api/v1/projects/{id}/watchers`

### Wiki Pages
- `POST /api/v1/wiki/{id}/watch`
- `POST /api/v1/wiki/{id}/unwatch`
- `GET /api/v1/wiki/{id}/watchers`

### Watcher Response
```json
{
  "watching": true,
  "watchers": [
    { "id": 1, "username": "john", "full_name": "John Doe" },
    { "id": 2, "username": "jane", "full_name": "Jane Smith" }
  ]
}
```

### Add Specific User as Watcher
Currently API only supports watching/unwatching for the authenticated user.
To add another user as watcher, you'd need to impersonate or use a different approach (not directly supported in REST API).

## Version/OCC for These Resources

| Operation | Version Required? |
|-----------|-------------------|
| Attachment upload | No (new object) |
| Attachment metadata update | Yes |
| Attachment delete | Yes |
| History (read-only) | N/A |
| Comment edit/delete | Yes (comment version) |
| Vote/Unvote | No |
| Watch/Unwatch | No |

## Pagination for History & Attachments

Both support standard pagination headers:
- `x-paginated`, `x-paginated-by`, `x-pagination-count`, `x-pagination-current`, `x-pagination-next`, `x-pagination-prev`

Use `?page=2` query param for subsequent pages.

## Integration Notes

### For "Shared Filter" (AGENTS.md)
- Watchers list can be used as filter option
- Vote count can be displayed in list views
- Attachment count badge on list items

### For "Shared Input" (AGENTS.md)
- When creating new item, pre-fill watchers from current filter context
- Default description template from project settings

### For "Custom Bulk Action" (AGENTS.md)
- Bulk watch/unwatch: iterate and call watch endpoint per item
- Bulk vote: iterate per item
- Bulk comment: iterate with PATCH + comment + version per item
- Bulk attach: not directly supported, upload per item