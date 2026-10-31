# Projects, Members, Roles, Sprints (Milestones)

## Projects

### Endpoints
- `GET /api/v1/projects` - List projects (paginated, user's accessible projects)
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project detail
- `GET /api/v1/projects/by_slug?slug={slug}` - Get project by slug
- `PUT /api/v1/projects/{id}` - Full update project
- `PATCH /api/v1/projects/{id}` - Partial update project
- `DELETE /api/v1/projects/{id}` - Delete project (requires version)
- `POST /api/v1/projects/bulk_update_order` - Update project order for user

### Create Project Required Fields
- `name` (string)
- `description` (string, optional)

### Common Project Fields
- `name`, `description`, `logo`, `is_private`, `anon_permissions`, `public_permissions`
- `owner` (user ID, defaults to creator)
- `template` (project template ID)
- `version` (required for updates)

### Project Modules Configuration
- `GET /api/v1/projects/{id}/modules` - Get enabled modules
- `PATCH /api/v1/projects/{id}/modules` - Enable/disable modules

**Module config example:**
```json
{
  "wiki": true,
  "issues": true,
  "epics": true,
  "userstories": true,
  "tasks": true,
  "points": true,
  "files": true
}
```

### Project Stats
- `GET /api/v1/projects/{id}/stats` - General project stats
- `GET /api/v1/projects/{id}/issues_stats` - Issue-specific stats

### Project Tags
- `GET /api/v1/projects/{id}/tags_colors` - Get tag colors
- `POST /api/v1/projects/{id}/create_tag` - Create tag
- `POST /api/v1/projects/{id}/edit_tag` - Edit tag
- `POST /api/v1/projects/{id}/delete_tag` - Delete tag
- `POST /api/v1/projects/{id}/mix_tags` - Merge tags

### Project Social
- `POST /api/v1/projects/{id}/like` - Like project
- `POST /api/v1/projects/{id}/unlike` - Unlike project
- `GET /api/v1/projects/{id}/fans` - List fans
- `POST /api/v1/projects/{id}/watch` - Watch project
- `POST /api/v1/projects/{id}/unwatch` - Unwatch project
- `GET /api/v1/projects/{id}/watchers` - List watchers

### Project Templates & Transfer
- `POST /api/v1/projects/{id}/create_template` - Create template from project
- `POST /api/v1/projects/{id}/leave` - Leave project
- `POST /api/v1/projects/{id}/change_logo` - Change logo
- `POST /api/v1/projects/{id}/remove_logo` - Remove logo
- `POST /api/v1/projects/{id}/transfer_validate_token` - Validate transfer token
- `POST /api/v1/projects/{id}/transfer_request` - Request transfer
- `POST /api/v1/projects/{id}/transfer_start` - Start transfer
- `POST /api/v1/projects/{id}/transfer_accept` - Accept transfer
- `POST /api/v1/projects/{id}/transfer_reject` - Reject transfer
- `POST /api/v1/projects/{id}/duplicate` - Duplicate project

## Memberships (Members)

### Endpoints
- `GET /api/v1/memberships?project={projectId}` - List memberships
- `POST /api/v1/memberships` - Create membership (invite user)
- `POST /api/v1/memberships/bulk_create` - Bulk create memberships
- `GET /api/v1/memberships/{id}` - Get membership
- `PUT /api/v1/memberships/{id}` - Full update
- `PATCH /api/v1/memberships/{id}` - Partial update (e.g., change role)
- `DELETE /api/v1/memberships/{id}` - Remove member (requires version)
- `POST /api/v1/memberships/{id}/resend_invitation` - Resend invite
- `GET /api/v1/invitations/{invitationUuid}` - Get invitation by token (anonymous)

### Membership Fields
- `project` (integer, required)
- `user` (integer, user ID - required for create)
- `role` (integer, role ID - required)
- `is_owner` (boolean, read-only)
- `version` (required for updates)

### Invitation Flow
1. `POST /memberships` with `user` (by ID or email) and `role`
2. If user exists: direct membership created
3. If user doesn't exist: invitation created, email sent
4. Invitee accepts via link → membership activated

### Bulk Create Memberships
```json
POST /api/v1/memberships/bulk_create
{
  "memberships": [
    { "project": 1, "user": 2, "role": 3 },
    { "project": 1, "user": 5, "role": 3 },
    { "project": 1, "email": "new@example.com", "role": 2 }
  ]
}
```

## Roles

### Endpoints
- `GET /api/v1/roles?project={projectId}` - List project roles
- `POST /api/v1/roles` - Create role
- `GET /api/v1/roles/{id}` - Get role
- `PUT /api/v1/roles/{id}` - Full update
- `PATCH /api/v1/roles/{id}` - Partial update
- `DELETE /api/v1/roles/{id}` - Delete role (requires version)

### Role Fields
- `project` (integer)
- `name` (string)
- `permissions` (object/JSON - granular permissions)
- `is_default` (boolean)
- `version` (required for updates)

### Default Roles (per project template)
- Owner (full permissions)
- Admin (manage project, members, settings)
- Developer (create/edit work items)
- Viewer (read-only)

## Milestones (Sprints)

### Endpoints
- `GET /api/v1/milestones?project={projectId}` - List milestones
- `POST /api/v1/milestones` - Create milestone
- `GET /api/v1/milestones/{id}` - Get milestone
- `PUT /api/v1/milestones/{id}` - Full update
- `PATCH /api/v1/milestones/{id}` - Partial update
- `DELETE /api/v1/milestones/{id}` - Delete (requires version)
- `GET /api/v1/milestones/{id}/stats` - Milestone stats (burndown, velocity, etc.)
- `POST /api/v1/milestones/{id}/watch` - Watch milestone
- `POST /api/v1/milestones/{id}/unwatch` - Unwatch
- `GET /api/v1/milestones/{id}/watchers` - List watchers

### Milestone Fields
- `project` (integer, required)
- `name` (string, required)
- `estimated_start` (date, YYYY-MM-DD)
- `estimated_finish` (date, YYYY-MM-DD)
- `version` (required for updates)
- `completed` (boolean, read-only)
- `closed` (boolean, read-only)

### Milestone Stats Response
```json
{
  "total_points": 100,
  "completed_points": 45,
  "user_stories": {
    "total": 20,
    "completed": 9,
    "by_status": { ... }
  },
  "tasks": { ... },
  "issues": { ... },
  "burndown": [ ... ]
}
```

## Version/OCC for Projects & Related

All write operations (POST, PUT, PATCH, DELETE) on projects, memberships, roles, and milestones require the `version` field (except create/POST).

- GET returns `version`
- POST (create): no version sent
- PUT/PATCH/DELETE: must include current `version`
- Success: version increments

## Resolver (Cross-reference lookup)

Resolve references like "EP-1", "US-5", "TA-3", "IS-7" to object IDs.

- `GET /api/v1/resolver?project={projectId}&ref={ref}` - Single ref
- `GET /api/v1/resolver?project={projectId}&refs[]=EP-1&refs[]=US-2` - Multiple refs

**Response:**
```json
{
  "EP-1": { "id": 123, "type": "epic", "subject": "Epic Title" },
  "US-2": { "id": 456, "type": "userstory", "subject": "Story Title" }
}
```

Use this for:
- Converting user-entered refs to IDs in forms
- Validating refs exist before linking
- Displaying ref previews in UI

## Search

- `GET /api/v1/search?project={projectId}&q={query}` - Search within project
- Returns mixed results: epics, user stories, tasks, issues, wiki pages

## Project Templates

- `GET /api/v1/project-templates` - List templates
- `POST /api/v1/project-templates` - Create template
- `GET /api/v1/project-templates/{id}` - Get template
- `PUT/PATCH /api/v1/project-templates/{id}` - Update template
- `DELETE /api/v1/project-templates/{id}` - Delete template

Templates define default modules, roles, statuses, workflows for new projects.