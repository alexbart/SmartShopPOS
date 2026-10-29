# Authentication API

Base path: `/api/v1/auth`

All auth endpoints return a standard envelope unless otherwise noted.

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials."
  }
}
```

## Endpoints

### Register

```http
POST /api/v1/auth/register
```

Request body:

```json
{
  "organizationName": "SmartShop Demo Ltd.",
  "ownerFirstName": "Alex",
  "ownerLastName": "Kiprop",
  "ownerEmail": "alex@smartshop.test",
  "ownerPhone": "+254700000001",
  "password": "StrongPassword123!"
}
```

Response: `201 Created`

```json
{
  "success": true,
  "message": "Organization registered successfully.",
  "data": {
    "organization": {
      "id": "org-uuid",
      "code": "SMARTSH-1234",
      "name": "SmartShop Demo Ltd."
    },
    "user": {
      "id": "user-uuid",
      "firstName": "Alex",
      "lastName": "Kiprop",
      "email": "alex@smartshop.test"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

---

### Login

```http
POST /api/v1/auth/login
```

Request body:

```json
{
  "organizationCode": "SMARTSH-1234",
  "email": "alex@smartshop.test",
  "password": "StrongPassword123!"
}
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "user-uuid",
      "firstName": "Alex",
      "lastName": "Kiprop",
      "email": "alex@smartshop.test"
    },
    "organization": {
      "id": "org-uuid",
      "name": "SmartShop Demo Ltd.",
      "code": "SMARTSH-1234"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG..."
    }
  }
}
```

Failure behavior:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials."
  }
}
```

---

### Refresh Token

```http
POST /api/v1/auth/refresh
```

Request body:

```json
{
  "refreshToken": "eyJhbG..."
}
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

Security rule: refresh tokens rotate on every use. The old refresh token is invalidated and a new one is issued.

---

### Current User

```http
GET /api/v1/auth/me
```

Headers:

```http
Authorization: Bearer <accessToken>
```

Response: `200 OK`

```json
{
  "success": true,
  "message": "Current user retrieved successfully.",
  "data": {
    "id": "user-uuid",
    "firstName": "Alex",
    "lastName": "Kiprop",
    "email": "alex@smartshop.test",
    "organization": {
      "id": "org-uuid",
      "name": "SmartShop Demo Ltd.",
      "code": "SMARTSH-1234"
    },
    "branch": {
      "id": "branch-uuid",
      "name": "Head Office",
      "code": "HO-001"
    },
    "roles": ["OWNER"]
  }
}
```

---

### Logout

```http
POST /api/v1/auth/logout
```

Request body:

```json
{
  "refreshToken": "eyJhbG..."
}
```

Response: `204 No Content`

Behavior: revokes the session tied to the refresh token. No tokens are returned.

---

## Authentication Flow

```text
Register
    │
    ▼
Login
    │
    ▼
Refresh Token
    │
    ▼
Current User (/me)
    │
    ▼
Logout
```

### Login Flow

```text
Receive Request
        │
        ▼
Find Organization
        │
        ▼
Find User
        │
        ▼
Check User Status
        │
        ▼
Verify Password
        │
        ▼
Generate Access Token
        │
        ▼
Generate Refresh Token
        │
        ▼
Hash Refresh Token
        │
        ▼
Create Session
        │
        ▼
Update Last Login
        │
        ▼
Create Audit Log
        │
        ▼
Return Tokens
```

### Refresh Flow

```text
Receive Refresh Token
        │
        ▼
Verify JWT Signature
        │
        ▼
Extract Session Id
        │
        ▼
Find Session
        │
        ▼
Verify Session Active
        │
        ▼
Compare Refresh Token Hash
        │
        ▼
Generate New Access Token
        │
        ▼
Generate New Refresh Token
        │
        ▼
Hash New Refresh Token
        │
        ▼
Update Session
        │
        ▼
Return Tokens
```

### Security Notes

- Passwords are hashed using bcrypt/Argon2.
- Refresh tokens are rotated on every use.
- Failed login attempts return a generic authentication error. Detailed failure reasons are logged internally only.
- Access tokens contain only necessary claims:

```json
{
  "sub": "user-uuid",
  "organizationId": "org-uuid",
  "branchId": "branch-uuid",
  "roles": ["OWNER"]
}
```

- Middleware attaches a request context to every authenticated request:

```typescript
interface RequestContext {
  userId: string;
  organizationId: string;
  branchId: string;
  roles: string[];
  permissions: string[];
  requestId: string;
}
```

---

## Rate Limiting

5 failed login attempts from the same source results in a 15-minute lockout.

---

## Error Codes

| Code                    | Meaning                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `INVALID_CREDENTIALS`   | Email/password mismatch, unknown email, or unknown organization. |
| `USER_NOT_ACTIVE`       | User status is PENDING, SUSPENDED, or INACTIVE.                  |
| `INVALID_REFRESH_TOKEN` | Refresh token is invalid, expired, or revoked.                   |
| `SESSION_NOT_FOUND`     | Session does not exist.                                          |
| `SESSION_NOT_ACTIVE`    | Session is not active.                                           |
| `SESSION_EXPIRED`       | Session expired.                                                 |
