# 🚀 Quick Start — Installation & Testing

## Step 1: Install Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd ..
npm install
```

## Step 2: Start the Development Servers

### Terminal 1 (Backend)
```bash
cd server
npm run dev
```
Expected output: `DevSpace server running on port 3001 (development)`

### Terminal 2 (Frontend)
```bash
npm run dev
```
Expected output: `VITE v7.0.4  ready in XXX ms`

### Terminal 3 (Optional - Tauri app)
```bash
npm start
```
Or manually in separate terminals:
```bash
npm run tauri dev
npm run server
```

## Step 3: Test Authentication

### Signup
1. Open frontend at `http://localhost:5173`
2. Click "Get Started Free"
3. Enter name, email, password
4. Should redirect to dashboard

### Login
1. Go back to landing
2. Click "Log In"
3. Enter email and password from signup
4. Should show dashboard with your name

### What's Happening Behind Scenes
- Password is hashed with bcryptjs
- JWT token is generated (7-day expiration)
- Token is stored in localStorage
- Token is sent with every API request

## Step 4: Test Project Management

### Create Project
1. Click "+ New Project" button
2. Fill in project name (required)
3. Add description (optional)
4. Add team members with domains
5. Click "Create"

### What's Validated
- ✅ Project name (required, max 100 chars)
- ✅ Description (max 500 chars)
- ✅ Member names (required if added)
- ✅ Member domains (must be: Frontend, Backend, Database, DevOps, UI/UX)

### What Gets Stored
- Project ID (auto-generated timestamp)
- Creator info (from JWT token)
- Creation timestamp
- All team members with domains

## Step 5: Test Real-Time Collaboration

### Open Multiple Editors
1. Create a project with a "Frontend" domain
2. Click on Frontend domain to open editor
3. In second browser/incognito, login and access same project
4. Open same domain in second editor
5. Type code in one editor → see it appear in other!

### What's Syncing
- Code changes (debounced 500ms to reduce network traffic)
- User presence (who's online)
- Cursor positions (ready to implement)
- Connection status indicator (🟢🔴)

## Step 6: Monitor the Backend

### Check Logs
Backend console should show:
```
DevSpace server running on port 3001 (development)
Socket user-123456 joined project abc789
[Error] Failed to fetch projects (if any errors)
```

### API Health Check
```bash
curl http://localhost:3001/api/health
```
Response:
```json
{ "status": "DevSpace server running", "timestamp": "2024-06-12T..." }
```

## Common Issues & Fixes

### "Cannot find module socket.io-client"
```bash
npm install
# Then restart frontend server
```

### "JWT_SECRET not found"
✅ Already in `.env` file. Check that `server/.env` exists with:
```
JWT_SECRET=devspace_super_secret_key_2024
```

### "CORS Error"
Backend isn't running. Make sure `npm run dev` is running in `server/` directory with port 3001.

### "Projects API failing"
Check backend has middleware:
- ✅ `server/src/middleware/auth.ts` exists
- ✅ `server/src/middleware/validation.ts` exists
- ✅ `server/src/routes/projects.ts` has authenticateToken on POST/PUT/DELETE

### Socket.io not connecting
1. Make sure backend is running on port 3001
2. Check `VITE_SOCKET_URL=http://localhost:3001` in `src/.env`
3. Look for errors in browser console (F12)

## Testing Checklist

- [ ] Backend starts on port 3001
- [ ] Frontend starts on port 5173
- [ ] Can signup and create account
- [ ] Can login with created account
- [ ] Can create new project
- [ ] Can add team members
- [ ] Can open code editor
- [ ] Can type code in editor
- [ ] Socket connection shows green indicator
- [ ] Can open multiple editors of same project
- [ ] Code syncs between multiple clients

## Performance Notes

- Code changes debounced 500ms (prevents 100s of messages per second)
- Connection status updates real-time
- All API calls include proper error handling
- Input validation prevents malformed data

## Next: Deploy & Scale

Once testing is complete:
1. Update `.env` with production API URL
2. Enable HTTPS for Socket.io
3. Setup database for code persistence
4. Configure proper JWT_SECRET (use strong random key)
5. Setup CI/CD pipeline

---

Happy coding! 🎉
