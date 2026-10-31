# Metadata Endpoints

Metadata endpoints provide select/options data for UI controls (dropdowns, filters, etc.). Always use these instead of hardcoding values.

## Project-level Metadata (require `project` query param)

### Filters Data (most comprehensive)
Returns all metadata needed for list filters in one call.

- `GET /api/v1/epics/filters_data?project={projectId}`
- `GET /api/v1/userstories/filters_data?project={projectId}`
- `GET /api/v1/tasks/filters_data?project={projectId}`
- `GET /api/v1/issues/filters_data?project={projectId}`

**Response includes:**
- `statuses` - Array of status objects (id, name, color, order, is_closed)
- `priorities` - Array of priority objects (id, name, order)
- `severities` - Array of severity objects (id, name, order)
- `issue_types` - Array of issue type objects (id, name, order)
- `roles` - Array of role objects (id, name, permissions)
- `milestones` - Array of milestone objects (id, name, estimated_start, estimated_finish)
- `points` - Array of story point objects (id, name, value)
- `users` / `members` - Project members (id, username, full_name, photo)
- `epics` - Project epics (for epic dropdown in user stories)
- `tags` - Available tags
- `watchers` - Available watchers

### Individual Metadata Endpoints

#### Statuses
- `GET /api/v1/epic-statuses?project={projectId}` - Epic statuses
- `GET /api/v1/user-story-statuses?project={projectId}` - User story statuses
- `GET /api/v1/task-statuses?project={projectId}` - Task statuses
- `GET /api/v1/issue-statuses?project={projectId}` - Issue statuses

**Status object:**
```json
{
  "id": 1,
  "name": "New",
  "color": "#87CEEB",
  "order": 1,
  "is_closed": false,
  "project": 1,
  "slug": "new",
  "wip_limit": null
}
```

#### Milestones (Sprints)
- `GET /api/v1/milestones?project={projectId}`

**Milestone object:**
```json
{
  "id": 1,
  "name": "Sprint 1",
  "estimated_start": "2026-01-01",
  "estimated_finish": "2026-01-14",
  "project": 1,
  "completed": false,
  "closed": false,
  "stats": { ... }
}
```

#### Points (Story Points)
- `GET /api/v1/points?project={projectId}`

**Point object:**
```json
{
  "id": 1,
  "name": "1",
  "value": 1,
  "project": 1
}
```

#### Roles
- `GET /api/v1/roles?project={projectId}`

#### Priorities (Issues)
- `GET /api/v1/priorities?project={projectId}`

#### Severities (Issues)
- `GET /api/v1/severities?project={projectId}`

#### Issue Types
- `GET /api/v1/issue-types?project={projectId}`

#### Custom Attributes
- `GET /api/v1/epic-custom-attributes?project={projectId}`
- `GET /api/v1/user-story-custom-attributes?project={projectId}`
- `GET /api/v1/task-custom-attributes?project={projectId}`
- `GET /api/v1/issue-custom-attributes?project={projectId}`

**Custom attribute object:**
```json
{
  "id": 1,
  "name": "Custom Field",
  "description": "Description",
  "attribute_type": "text",  // text, number, date, select, multi_select
  "project": 1,
  "order": 1,
  "options": ["Option 1", "Option 2"],  // for select types
  "required": false
}
```

#### Custom Attribute Values (per item)
- `GET /api/v1/epics/custom-attributes-values/{epicId}`
- `GET /api/v1/userstories/custom-attributes-values/{userStoryId}`
- `GET /api/v1/tasks/custom-attributes-values/{taskId}`
- `GET /api/v1/issues/custom-attributes-values/{issueId}`

**Values object:**
```json
{
  "attributes_values": {
    "1": "Value for attribute 1",
    "2": ["Option 1", "Option 2"]
  }
}
```

## Global Metadata (no project filter)

### Users
- `GET /api/v1/users` - List all users (paginated)
- `GET /api/v1/users/{userId}` - Get user detail
- `GET /api/v1/users/me` - Current authenticated user

### Projects
- `GET /api/v1/projects` - List projects user has access to

### Application-level
- `GET /api/v1/locales` - Available languages for Accept-Language header

## Caching Strategy

- **Project metadata**: Cache for 5-10 minutes, invalidate on project settings change
- **User list**: Cache for 10-15 minutes
- **Global metadata** (locales): Cache for 1 hour
- **Custom attributes**: Cache with project metadata

## UI Integration Patterns

### Shared Filters (per AGENTS.md vision)
When user switches between modules (epics, usor, tasks, isu):
1. Preserve current filter state (status, assignee, milestone, tags, etc.)
2. Apply same filters to new module's list
3. Use `filters_data` endpoint for each module to populate filter dropdowns
4. Filter values that don't exist in new module (e.g., "severity" for user stories) are simply ignored

### Shared Input (autofill forms)
When creating new item:
1. Read current shared filter state
2. Pre-fill form fields: project (required), milestone, assignee, status, epic (for usor), etc.
3. User can override before submit

## Example: Loading Filters Data for User Stories

```javascript
async function loadUserStoryFilters(projectId) {
  const response = await fetch(
    `/api/v1/userstories/filters_data?project=${projectId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  const data = await response.json();
  
  return {
    statuses: data.statuses || [],
    milestones: data.milestones || [],
    members: data.members || data.users || [],
    epics: data.epics || [],
    points: data.points || [],
    tags: data.tags || [],
    watchers: data.watchers || []
  };
}
```

## Version Note

Metadata endpoints are generally read-only and don't use OCC versioning. However, when you *modify* metadata (create/edit status, custom attribute, etc.), those write operations DO require version.