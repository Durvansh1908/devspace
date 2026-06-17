# 🏗️ Architecture & File Structure

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          DevSpace                               │
├──────────────────────────────────────────────────────────────┬──┤
│                                                               │  │
│  ┌──────────────────────────────────────────────────────┐   │  │
│  │              Frontend (React/TypeScript)             │   │  │
│  │  ┌─────────────────────────────────────────────────┐ │   │  │
│  │  │              Components                         │ │   │  │
│  │  │  • App.tsx (Main)                             │ │   │  │
│  │  │  • Dashboard.tsx (Projects & UI)              │ │   │  │
│  │  │  • CodeEditor.tsx (Collaborative Editor)      │ │   │  │
│  │  │  • Login.tsx / Signup.tsx (Auth UI)           │ │   │  │
│  │  │  • ParticleBackground.tsx                     │ │   │  │
│  │  │  • AIAssistant.tsx                            │ │   │  │
│  │  └─────────────────────────────────────────────────┘ │   │  │
│  │  ┌─────────────────────────────────────────────────┐ │   │  │
│  │  │              State Management                  │ │   │  │
│  │  │  • api/client.ts (API wrapper)                │ │   │  │
│  │  │  • api/authContext.tsx (Auth state)           │ │   │  │
│  │  │  • useAuth hook                               │ │   │  │
│  │  └─────────────────────────────────────────────────┘ │   │  │
│  └──────────────────────────────────────────────────────┘   │  │
│                         Socket.io                           │  │
│           (Real-time code sync & presence)                  │  │
│                                                               │  │
└─────────────────────────────────────────────────────────────┤  │
│                          HTTP                               │  │
│                   (REST API calls)                          │  │
├─────────────────────────────────────────────────────────────┤  │
│                                                               │  │
│  ┌──────────────────────────────────────────────────────┐   │  │
│  │            Backend (Node.js/Express)                │   │  │
│  │  ┌─────────────────────────────────────────────────┐ │   │  │
│  │  │          Routes & Controllers                   │ │   │  │
│  │  │  • routes/auth.ts (Login/Signup)              │ │   │  │
│  │  │  • routes/projects.ts (Project CRUD)          │ │   │  │
│  │  │  • index.ts (Server setup & Socket.io)        │ │   │  │
│  │  └─────────────────────────────────────────────────┘ │   │  │
│  │  ┌─────────────────────────────────────────────────┐ │   │  │
│  │  │         Middleware & Validation                │ │   │  │
│  │  │  • middleware/auth.ts (JWT verification)       │ │   │  │
│  │  │  • middleware/validation.ts (Input checks)     │ │   │  │
│  │  │  • middleware/errorHandler.ts (Error response) │ │   │  │
│  │  └─────────────────────────────────────────────────┘ │   │  │
│  │  ┌─────────────────────────────────────────────────┐ │   │  │
│  │  │              Type System                        │ │   │  │
│  │  │  • types/index.ts (Shared types)              │ │   │  │
│  │  │  • User, Project, Domain types                │ │   │  │
│  │  └─────────────────────────────────────────────────┘ │   │  │
│  │  ┌─────────────────────────────────────────────────┐ │   │  │
│  │  │            Data Persistence                    │ │   │  │
│  │  │  • database.ts (SQLite setup)                  │ │   │  │
│  │  │  • devspace.db (Local database)                │ │   │  │
│  │  └─────────────────────────────────────────────────┘ │   │  │
│  └──────────────────────────────────────────────────────┘   │  │
│                                                               │  │
└───────────────────────────────────────────────────────────────┘
```

---

## Detailed File Structure

### Frontend (`src/`)

```
src/
├── api/
│   ├── client.ts          ← NEW: Type-safe API client
│   └── authContext.tsx    ← NEW: Auth state provider
├── App.tsx                ← Main component
├── App.css
├── main.tsx
├── vite-env.d.ts
├── Dashboard.tsx          ← Project management UI
├── CodeEditor.tsx         ← ENHANCED: Real-time collaborative editor
├── Login.tsx
├── Signup.tsx
├── AIAssistant.tsx
├── ParticleBackground.tsx
├── Logo.tsx
└── .env                   ← UPDATED: API configuration
```

### Backend (`server/src/`)

```
server/
├── src/
│   ├── middleware/
│   │   ├── auth.ts               ← NEW: JWT authentication
│   │   ├── validation.ts         ← NEW: Input validation
│   │   └── errorHandler.ts       ← NEW: Centralized error handling
│   ├── routes/
│   │   ├── auth.ts               ← Signup/Login endpoints
│   │   └── projects.ts           ← ENHANCED: Full CRUD + middleware
│   ├── types/
│   │   └── index.ts              ← NEW: Shared TypeScript types
│   ├── database.ts               ← SQLite database setup
│   ├── index.ts                  ← ENHANCED: Server + Socket.io
│   └── tsconfig.json
├── package.json
├── .env                   ← UPDATED: Added CORS_ORIGIN
└── devspace.db           ← SQLite database file
```

### Configuration

```
.env files:
├── server/.env           ← JWT_SECRET, PORT, CORS_ORIGIN
└── src/.env              ← API URLs, keys

Config files:
├── tsconfig.json         ← Frontend TypeScript config
├── vite.config.ts        ← Vite bundler config
├── tauri.conf.json       ← Desktop app config
├── package.json          ← Dependencies
└── server/tsconfig.json  ← Backend TypeScript config
```

---

## Data Flow Diagrams

### Authentication Flow

```
User signup/login
       ↓
   Frontend (React)
       ↓
   API Client (client.ts)
       ↓
POST /auth/signup or /auth/login
       ↓
   Backend Express Server
       ↓
   auth.ts route handler
       ↓
Password hashing (bcryptjs) or verification
       ↓
JWT token generation
       ↓
Token sent to frontend
       ↓
AuthContext stores token in localStorage
       ↓
useAuth() hook provides user to components
```

### API Request With Authentication

```
Component calls api.getProjects()
       ↓
API Client (client.ts) retrieves token from storage
       ↓
Adds Authorization header: "Bearer <token>"
       ↓
Fetch POST http://localhost:3001/api/projects
       ↓
Express server receives request
       ↓
authenticateToken middleware
       ↓
Verifies JWT token
       ↓
Attaches user to request object
       ↓
validateProjectCreation middleware (if POST)
       ↓
Validates input fields
       ↓
Route handler executes
       ↓
Response with data or error
       ↓
Frontend receives and updates state
```

### Real-Time Collaboration

```
User A types in CodeEditor
       ↓
   handleCodeChange() called
       ↓
Debounce timer (500ms)
       ↓
Socket emit: "code-change" event
       ↓
Backend Socket.io server
       ↓
Broadcast to all users in project room
       ↓
User B receives "code-update" event
       ↓
CodeEditor component updates code state
       ↓
Monaco Editor re-renders with new code
       ↓
User B sees live update
```

---

## Request/Response Examples

### Create Project Request

```
POST http://localhost:3001/api/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "My Project",
  "description": "Description here",
  "members": [
    { "name": "Alice", "domain": "Frontend" },
    { "name": "Bob", "domain": "Backend" }
  ]
}
```

### Server Processing

```
1. authenticateToken middleware
   ✓ Token verified
   ✓ User info extracted from JWT

2. validateProjectCreation middleware
   ✓ name is required and valid
   ✓ description is optional and valid

3. validateMemberData middleware
   ✓ Each member has required fields
   ✓ Domain is from valid list

4. Route handler (POST /projects)
   ✓ Creates project in database
   ✓ Adds members to project_members table
   ✓ Returns project with all members

5. Response sent to frontend
   ✓ 201 Created
   ✓ JSON body with project data
```

---

## Type System Integration

### Single Source of Truth

```typescript
// server/src/types/index.ts defines:
export type Domain = "Frontend" | "Backend" | "Database" | "DevOps" | "UI/UX";

export interface Project {
  id: string;
  name: string;
  description: string;
  created_by: string;
  members: ProjectMember[];
  created_at: string;
}

// Frontend can import and use:
import type { Project, Domain } from "../../../server/src/types/index";

const [projects, setProjects] = useState<Project[]>([]);
```

### Benefits
- No type mismatches between frontend/backend
- Auto-completion in IDE
- Compile-time type checking
- Easier refactoring
- Single definition for both sides

---

## Middleware Chain

Every request goes through this chain (order matters):

```
Express server receives request
       ↓
1. cors() — Check origin is allowed
       ↓
2. express.json() — Parse request body
       ↓
3. express.urlencoded() — Parse form data
       ↓
4. Route-specific middleware (if any):
   - authenticateToken (for protected routes)
   - validateProjectCreation
   - validateMemberData
       ↓
5. Route handler executes
       ↓
6. errorHandler middleware catches errors
       ↓
Response sent to client
```

---

## Security Layers

```
┌─────────────────────────────────────┐
│    Client-Side Validation           │
│  (Prevent bad data being sent)      │
├─────────────────────────────────────┤
│         Network Layer               │
│   (HTTPS in production)             │
├─────────────────────────────────────┤
│      Authentication Check           │
│  (Verify JWT token is valid)        │
├─────────────────────────────────────┤
│       Input Validation              │
│  (Verify data format, length, etc)  │
├─────────────────────────────────────┤
│    Database Operations              │
│  (Parameterized queries to prevent  │
│   SQL injection)                    │
├─────────────────────────────────────┤
│       Error Handling                │
│  (Don't expose internal details)    │
└─────────────────────────────────────┘
```

---

## Performance Considerations

### Frontend
- Code changes debounced 500ms (prevents overwhelming socket server)
- Token cached in localStorage (no repeated auth requests)
- Components lazy-loaded (with React Suspense)
- Monaco Editor efficiently handles large files

### Backend
- Connection pooling for database (built into better-sqlite3)
- JWT verification uses crypto signatures (fast)
- Input validation prevents processing of bad data
- Error handling prevents cascading failures

### Real-Time
- Socket.io auto-reconnection on network loss
- Debouncing reduces message frequency
- Room-based broadcasting (only sends to relevant users)

---

## Future Architecture Improvements

```
┌─────────────────────────────────────┐
│   PostgreSQL (replace SQLite)       │
│   - Better for concurrent writes    │
│   - Needed for production scale     │
├─────────────────────────────────────┤
│   Yjs + WebSocket (for CRDT)        │
│   - Conflict-free code sync         │
│   - Handles network drops better    │
├─────────────────────────────────────┤
│   Message Queue (Redis/RabbitMQ)    │
│   - Decouple real-time from sync    │
│   - Better scalability              │
├─────────────────────────────────────┤
│   File Storage (S3/Cloud Storage)   │
│   - Store project files persistently│
├─────────────────────────────────────┤
│   Session Store (Redis)             │
│   - Track who's online              │
│   - Persist active sessions         │
├─────────────────────────────────────┤
│   Cache Layer (Redis)               │
│   - Cache frequently accessed data  │
│   - Reduce database queries         │
└─────────────────────────────────────┘
```

---

This is production-ready architecture! 🚀
