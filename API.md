# 📡 API Documentation

Base URL: `http://localhost:3001/api`

---

## Authentication Endpoints

### POST /auth/signup
Create a new user account

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1718123456789",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400` — Missing fields or invalid email
- `400` — Email already in use
- `500` — Server error

---

### POST /auth/login
Authenticate and get JWT token

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1718123456789",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `400` — Invalid credentials
- `500` — Server error

---

### GET /auth/me
Get current user info

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "1718123456789",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Errors:**
- `401` — No token provided
- `403` — Invalid or expired token

---

## Project Endpoints

### GET /projects
List all projects (public)

**Response (200):**
```json
[
  {
    "id": "1718123456789",
    "name": "E-Commerce Platform",
    "description": "Full-stack e-commerce solution",
    "created_by": "john@example.com",
    "created_at": "2024-06-12T10:30:00.000Z",
    "members": [
      {
        "id": "member-1",
        "project_id": "1718123456789",
        "name": "Alice Smith",
        "domain": "Frontend"
      },
      {
        "id": "member-2",
        "project_id": "1718123456789",
        "name": "Bob Johnson",
        "domain": "Backend"
      }
    ]
  }
]
```

---

### POST /projects
Create a new project

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "E-Commerce Platform",
  "description": "Full-stack e-commerce solution",
  "members": [
    {
      "name": "Alice Smith",
      "domain": "Frontend"
    },
    {
      "name": "Bob Johnson",
      "domain": "Backend"
    }
  ]
}
```

**Validation:**
- `name` — Required, max 100 characters
- `description` — Optional, max 500 characters
- `members[].name` — Required if providing members
- `members[].domain` — Optional, must be one of: "Frontend", "Backend", "Database", "DevOps", "UI/UX"

**Response (201):**
```json
{
  "id": "1718123456789",
  "name": "E-Commerce Platform",
  "description": "Full-stack e-commerce solution",
  "created_by": "1718123456788",
  "created_at": "2024-06-12T10:30:00.000Z",
  "members": [
    {
      "id": "member-1",
      "project_id": "1718123456789",
      "name": "Alice Smith",
      "domain": "Frontend"
    },
    {
      "id": "member-2",
      "project_id": "1718123456789",
      "name": "Bob Johnson",
      "domain": "Backend"
    }
  ]
}
```

**Errors:**
- `400` — Validation failed
- `401` — No token
- `403` — Invalid token
- `500` — Server error

---

### GET /projects/:id
Get a specific project

**Headers:**
```
Authorization: Optional (will show more info if authenticated)
```

**Response (200):**
```json
{
  "id": "1718123456789",
  "name": "E-Commerce Platform",
  "description": "Full-stack e-commerce solution",
  "created_by": "john@example.com",
  "created_at": "2024-06-12T10:30:00.000Z",
  "members": [
    {
      "id": "member-1",
      "project_id": "1718123456789",
      "name": "Alice Smith",
      "domain": "Frontend"
    }
  ]
}
```

**Errors:**
- `404` — Project not found
- `500` — Server error

---

### PUT /projects/:id
Update a project

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "E-Commerce Platform v2",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "1718123456789",
  "name": "E-Commerce Platform v2",
  "description": "Updated description",
  "created_by": "john@example.com",
  "created_at": "2024-06-12T10:30:00.000Z",
  "members": [...]
}
```

**Errors:**
- `400` — Validation failed
- `401` — No token
- `403` — Invalid token
- `404` — Project not found
- `500` — Server error

---

### DELETE /projects/:id
Delete a project

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Project deleted successfully"
}
```

**Errors:**
- `401` — No token
- `403` — Invalid token
- `404` — Project not found
- `500` — Server error

---

## Health Check

### GET /health
Check if server is running

**Response (200):**
```json
{
  "status": "DevSpace server running",
  "timestamp": "2024-06-12T10:30:00.000Z"
}
```

---

## Real-Time Events (Socket.io)

### Connection
```javascript
const socket = io("http://localhost:3001", {
  reconnection: true,
  reconnectionDelay: 1000
});
```

### Emit Events

#### join-project
```javascript
socket.emit("join-project", "project-id-123");
```

#### leave-project
```javascript
socket.emit("leave-project", "project-id-123");
```

#### code-change
```javascript
socket.emit("code-change", {
  projectId: "project-id-123",
  code: "console.log('Hello');",
  domain: "Frontend",
  userId: "user-id"
});
```

#### cursor-move
```javascript
socket.emit("cursor-move", {
  projectId: "project-id-123",
  position: 42,
  userId: "user-id"
});
```

### Listen for Events

#### user-joined
```javascript
socket.on("user-joined", (data) => {
  console.log("User joined:", data.socketId);
  // { socketId: "socket-id", timestamp: 1718123456789 }
});
```

#### user-left
```javascript
socket.on("user-left", (data) => {
  console.log("User left:", data.socketId);
  // { socketId: "socket-id", timestamp: 1718123456789 }
});
```

#### code-update
```javascript
socket.on("code-update", (data) => {
  console.log("Code updated:", data.code);
  // { projectId, code, domain, userId, timestamp }
});
```

#### cursor-update
```javascript
socket.on("cursor-update", (data) => {
  console.log("Cursor moved:", data.position);
  // { projectId, userId, position, timestamp }
});
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Description of what went wrong",
  "timestamp": "2024-06-12T10:30:00.000Z"
}
```

HTTP Status Codes:
- `400` — Bad Request (validation error)
- `401` — Unauthorized (no token)
- `403` — Forbidden (invalid token)
- `404` — Not Found
- `500` — Internal Server Error

---

## Authentication

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

The token is obtained from `/auth/signup` or `/auth/login` and is valid for 7 days.

---

## Rate Limiting (Future)

Currently no rate limiting. Plan to implement:
- 100 requests/minute per IP for public endpoints
- 500 requests/minute per user for authenticated endpoints
- 1000 messages/minute per socket connection

---

## CORS

Allowed origins (configurable):
- `http://localhost:1420` (Tauri app)
- `http://localhost:5173` (Vite dev server)

Set via `CORS_ORIGIN` environment variable.
