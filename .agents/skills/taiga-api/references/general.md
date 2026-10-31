# General Taiga API Rules

- Base URL: `{taiga_server}/api/v1`.
- Send JSON requests with `Content-Type: application/json`.
- Send auth with `Authorization: Bearer {AUTH_TOKEN}` (or `Authorization: Application {APP_TOKEN}` for app tokens).
- Use `PATCH` for partial edits; use `PUT` only for whole-object replacement.
- Treat `*_extra` and `*_extra_info` fields as read-only display data.
- Send `Accept-Language: {LanguageId}` when translated API content matters.
- Handle `429` with retry/backoff.

## Pagination

List responses are paginated by default. Preserve these headers through proxies:

- `x-paginated`
- `x-paginated-by`
- `x-pagination-count`
- `x-pagination-current`
- `x-pagination-next`
- `x-pagination-prev`

Disable pagination only when intentional: `x-disable-pagination: True`.

## OCC - Optimistic Concurrency Control

**Every modifying request (PUT, PATCH, DELETE) on editable resources MUST include a valid `version` parameter.**

### How it works

When multiple operations happen concurrently on the same element, Taiga uses the `version` field to prevent lost updates:

1. **Same attributes modified**: API accepts the first request and rejects subsequent ones with a `409 Conflict` (or `400 Bad Request`) because the version parameter becomes stale.

2. **Different attributes modified**: Taiga is smart enough to accept both requests if the changes don't conflict. The second request with a stale version can still succeed if it modifies different fields.

### Version handling

- **GET responses**: Always include the current `version` field for editable resources.
- **Create (POST)**: Do NOT send `version`; it starts at 1.
- **Update (PUT/PATCH)**: MUST include the current `version` from the latest GET.
- **Delete (DELETE)**: MUST include the current `version` (some endpoints require it in body, others as query param).
- **Successful write**: Taiga increments `version` automatically and returns the new version in the response.

### Example

```json
// GET /api/v1/userstories/123
{
  "id": 123,
  "subject": "Original title",
  "version": 5,
  ...
}

// PATCH /api/v1/userstories/123
{
  "subject": "Updated title",
  "version": 5
}

// Response: 200 OK with version incremented to 6
{
  "id": 123,
  "subject": "Updated title",
  "version": 6,
  ...
}
```

### Error responses

- `409 Conflict` or `400 Bad Request`: Version mismatch (stale version). Re-fetch the resource and retry.
- Response body typically includes the current server version for retry logic.

### Best practices

1. Always fetch the latest version before any write operation.
2. Implement retry logic with exponential backoff on version conflicts.
3. For bulk operations, fetch all versions first, then send updates sequentially or handle partial failures.
4. UI should show a "refresh" hint when a version conflict occurs.

## Internationalization

The API returns some content translated. Specify the language with header:

```
Accept-Language: {LanguageId}
```

Get available languages from the [Locales API](#locales).

## Throttling

If the API is configured with throttling, handle `429 Too Many Requests` with retry/backoff. Respect `Retry-After` header when present.

## Read-only fields

All fields ending in `_extra_info` (e.g., `assigned_to_extra_info`, `is_private_extra_info`, `owner_extra_info`, `project_extra_info`, `status_extra_info`, `user_story_extra_info`, etc.) are read-only display fields. Do not send them in write requests.

## Attachments

For attachment uploads, use `multipart/form-data` content type. Do NOT force `application/json`.