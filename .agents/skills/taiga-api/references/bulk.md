# Bulk Operations Strategy

## Overview

Taiga provides dedicated bulk endpoints for certain operations. Use these instead of firing many single requests when possible - they are more efficient and atomic.

## Available Bulk Endpoints

### Epics
- `POST /api/v1/epics/bulk_create` - Create multiple epics at once

### User Stories (usor)
- `POST /api/v1/userstories/bulk_create` - Create multiple user stories
- `POST /api/v1/userstories/bulk_update_backlog_order` - Reorder in backlog
- `POST /api/v1/userstories/bulk_update_kanban_order` - Reorder in kanban
- `POST /api/v1/userstories/bulk_update_sprint_order` - Reorder in sprint
- `POST /api/v1/userstories/bulk_update_milestone` - Bulk assign to milestone

### Tasks
- `POST /api/v1/tasks/bulk_create` - Create multiple tasks

### Epics related user stories
- `POST /api/v1/epics/{epicId}/related_userstories/bulk_create` - Bulk create related user stories

### Memberships
- `POST /api/v1/memberships/bulk_create` - Bulk create memberships/invitations

### Projects
- `POST /api/v1/projects/bulk_update_order` - Update project order for logged-in user

### Statuses (all types)
- `POST /api/v1/epic-statuses/bulk_update_order`
- `POST /api/v1/user-story-statuses/bulk_update_order`
- `POST /api/v1/task-statuses/bulk_update_order`
- `POST /api/v1/issue-statuses/bulk_update_order`
- `POST /api/v1/priorities/bulk_update_order`
- `POST /api/v1/severities/bulk_update_order`
- `POST /api/v1/issue-types/bulk_update_order`

### Custom Attributes (all types)
- `POST /api/v1/epic-custom-attributes/bulk_update_order`
- `POST /api/v1/user-story-custom-attributes/bulk_update_order`
- `POST /api/v1/task-custom-attributes/bulk_update_order`
- `POST /api/v1/issue-custom-attributes/bulk_update_order`

## Bulk Create Request Format

### Epics bulk create
```json
POST /api/v1/epics/bulk_create
{
  "epics": [
    {
      "project": 1,
      "subject": "Epic 1",
      "description": "Description 1",
      "color": "#FF0000"
    },
    {
      "project": 1,
      "subject": "Epic 2",
      "description": "Description 2",
      "color": "#00FF00"
    }
  ]
}
```

### User Stories bulk create
```json
POST /api/v1/userstories/bulk_create
{
  "user_stories": [
    {
      "project": 1,
      "subject": "Story 1",
      "description": "Desc 1",
      "status": 1,
      "milestone": 1,
      "assigned_to": 2,
      "epic": 1,
      "points": 3,
      "tags": ["frontend"]
    },
    {
      "project": 1,
      "subject": "Story 2",
      "description": "Desc 2",
      "status": 1,
      "milestone": 1,
      "assigned_to": 2,
      "epic": 1,
      "points": 5,
      "tags": ["backend"]
    }
  ]
}
```

### Tasks bulk create
```json
POST /api/v1/tasks/bulk_create
{
  "tasks": [
    {
      "project": 1,
      "subject": "Task 1",
      "user_story": 1,
      "status": 1,
      "assigned_to": 2
    },
    {
      "project": 1,
      "subject": "Task 2",
      "user_story": 1,
      "status": 1,
      "assigned_to": 3
    }
  ]
}
```

### Memberships bulk create
```json
POST /api/v1/memberships/bulk_create
{
  "memberships": [
    {
      "project": 1,
      "user": 2,
      "role": 1
    },
    {
      "project": 1,
      "user": 3,
      "role": 2
    }
  ]
}
```

## Bulk Update Order Request Format

### User stories backlog order
```json
POST /api/v1/userstories/bulk_update_backlog_order
{
  "user_stories": [
    {"id": 1, "order": 1},
    {"id": 2, "order": 2},
    {"id": 3, "order": 3}
  ]
}
```

### User stories milestone bulk update
```json
POST /api/v1/userstories/bulk_update_milestone
{
  "user_stories": [1, 2, 3],
  "milestone": 5
}
```

## Response Format

Bulk endpoints typically return:
- `200 OK` or `201 Created` with array of created/updated objects
- Each object includes its new `version` (for creates, version=1)
- On partial failure: may return 207 Multi-Status or include error details per item

## Strategy for Bulk Operations

### When to use bulk endpoints
- Creating multiple items of the same type in one go
- Reordering many items (drag-and-drop bulk save)
- Bulk assigning to milestone/sprint
- Bulk inviting members

### When NOT to use bulk (use sequential instead)
- UI requires per-item progress indication
- Need granular retry/rollback per item
- Items have complex interdependencies
- Partial success handling is complex

### Version handling in bulk
- **Bulk create**: No version needed (new objects start at version 1)
- **Bulk update order/milestone**: Usually don't require version (server handles ordering)
- **Custom bulk actions** (if implemented): Must include version for each item

## Custom Bulk Actions (Application-level)

Since Taiga doesn't have a generic "bulk update arbitrary fields" endpoint, implement custom bulk actions in the application layer:

1. **Fetch all target items** with their current versions
2. **Validate** all items have compatible versions (or handle conflicts)
3. **Execute sequentially** with individual PATCH requests, each including its version
4. **Track results** per item (success/failed/conflict)
5. **Report** summary to user with option to retry failed items

### Example: Bulk add prefix to titles
```javascript
async function bulkAddPrefix(itemIds, prefix) {
  // 1. Fetch all items with versions
  const items = await Promise.all(
    itemIds.map(id => fetch(`/api/v1/userstories/${id}`).then(r => r.json()))
  );
  
  // 2. Update each with version
  const results = await Promise.allSettled(
    items.map(item => 
      fetch(`/api/v1/userstories/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: prefix + item.subject,
          version: item.version  // CRITICAL: include version
        })
      })
    )
  );
  
  // 3. Process results
  return results.map((r, i) => ({
    id: itemIds[i],
    success: r.status === 'fulfilled',
    error: r.status === 'rejected' ? r.reason : null
  }));
}
```

## Error Handling

- **409 Conflict**: Version mismatch - re-fetch that item and retry
- **400 Bad Request**: Invalid payload - check required fields
- **422 Unprocessable Entity**: Business logic validation failed
- **429 Too Many Requests**: Rate limited - back off and retry

Always implement retry logic with exponential backoff for version conflicts.