# Authentication & Session Management

## Standard Token Authentication (Bearer)

### Login
```bash
POST /api/v1/auth
Content-Type: application/json

{
  "type": "normal",
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIs...",
  "id": 1,
  "username": "john",
  "full_name": "John Doe",
  "email": "user@example.com",
  "gravatar_id": "...",
  "is_active": true,
  "is_superuser": false,
  "date_joined": "2026-01-01T00:00:00Z",
  "lang": "en",
  "timezone": "UTC",
  "projects": [ ... ]
}
```

### Using the Token
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Refresh Token
```bash
POST /api/v1/auth/refresh
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{}
```

**Response:** New `auth_token` with extended expiry.

### Token Expiry
- Tokens expire (typically 24-48 hours)
- Always handle `401 Unauthorized` by attempting refresh
- Store token securely (HttpOnly cookie or server-side session)

## Application Token Authentication

For external applications (OAuth-like flow):

### 1. Check existing token
```bash
GET /api/v1/applications/{applicationId}/token
Authorization: Bearer {user_auth_token}
```

### 2. Authorize (get auth_code)
```bash
POST /api/v1/application-tokens/authorize
Authorization: Bearer {user_auth_token}
Content-Type: application/json

{
  "application": "{applicationId}",
  "state": "random-csrf-state"
}
```

### 3. Validate (get cyphered_token)
```bash
POST /api/v1/application-tokens/validate
Authorization: Bearer {user_auth_token}
Content-Type: application/json

{
  "application": "{applicationId}",
  "auth_code": "{from_step_2}",
  "state": "{same_as_step_2}"
}
```

### 4. Decypher token (client-side)
Token is JWE encrypted with A128KW/A256GCM. Decrypt with application's secret key.

### 5. Use application token
```bash
Authorization: Application {decrypted_token}
```

## Session-Backed Proxy Pattern (Recommended for Web Apps)

### Architecture
```
Browser → Your Backend → Taiga API
    ↑           ↑
  Session    Server-side
  Cookie     Token Storage
```

### Implementation

1. **Login endpoint** (`POST /api/auth/login`):
   - Receive username/password
   - Call Taiga `/api/v1/auth`
   - Store `auth_token` in server session (Redis, DB, encrypted cookie)
   - Set HttpOnly session cookie
   - Return user info (no token)

2. **Proxy middleware** (all `/api/taiga/*`):
   - Read `auth_token` from session
   - Forward request to Taiga with `Authorization: Bearer {token}`
   - Preserve pagination headers (`x-pagination-*`)
   - On `401/403`: attempt refresh, update session, retry once
   - On refresh failure: clear session, return `401`

3. **Refresh endpoint** (`POST /api/auth/refresh`):
   - Call Taiga `/api/v1/auth/refresh` with stored token
   - Update session with new token
   - Return success

4. **Logout endpoint** (`POST /api/auth/logout`):
   - Clear session
   - Clear cookie
   - Return success

### Benefits
- Token never exposed to browser
- Automatic token refresh
- Centralized auth logic
- Can add rate limiting, logging, audit

## Public & Private Registry

### Public Registration
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "new@example.com",
  "password": "password123",
  "full_name": "New User"
}
```

Returns auth_token directly (auto-login).

### Private Registry (Invite-only)
Requires invitation token from admin. Not typically used in standard setups.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| `401` | Invalid/expired token | Refresh token, retry once |
| `403` | No permission | Show access denied, don't refresh |
| `429` | Rate limited | Back off, respect `Retry-After` |
| `5xx` | Server error | Retry with exponential backoff |

## Language & Timezone

- User's `lang` and `timezone` from login response
- Send `Accept-Language: {lang}` header for translated content
- Store user preference in session for proxy

## CSRF Protection

- Taiga API doesn't require CSRF tokens for Bearer auth
- But your proxy endpoints should have CSRF protection
- Use SameSite=Lax/Strict cookies + CSRF token in forms

## Multi-instance Support

If your app connects to multiple Taiga instances:
- Store `taiga_server_url` per user/project
- Include in session or derive from project context
- All API calls use `{taiga_server_url}/api/v1`

## PHP Session Integration (per AGENTS.md)

```php
// Login
session_start();
$taiga = new TaigaClient($taigaUrl);
$auth = $taiga->login($username, $password);
$_SESSION['taiga_token'] = $auth['auth_token'];
$_SESSION['taiga_user'] = $auth;

// Proxy request
function taigaRequest($method, $endpoint, $data = null) {
    $token = $_SESSION['taiga_token'] ?? null;
    if (!$token) throw new Exception('Not authenticated');
    
    $client = new TaigaClient($_SESSION['taiga_url']);
    $client->setAuthToken($token);
    
    try {
        return $client->request($method, $endpoint, $data);
    } catch (TaigaException $e) {
        if ($e->getCode() === 401) {
            // Try refresh
            $newAuth = $client->refreshToken();
            if ($newAuth) {
                $_SESSION['taiga_token'] = $newAuth['auth_token'];
                return $client->request($method, $endpoint, $data);
            }
            session_destroy();
            throw new Exception('Session expired');
        }
        throw $e;
    }
}
```