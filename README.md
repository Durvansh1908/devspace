# 🚀 DevSpace

The all-in-one collaborative IDE built for student dev teams.

DevSpace eliminates the context-switching problem — no more juggling VS Code, Zoom, Slack, and Jira in separate windows. Editor, voice, domains, and accountability, in one native desktop app.

## ✨ Features

- **Live Collaborative Editor** — real-time code sync across teammates via Socket.io, with live cursor presence per domain workspace
- **AI Code Assistant** — server-side Claude integration for code analysis, chat, and cross-domain architecture review
- **Built-in Voice & Video** — WebRTC calls embedded directly in the workspace, with screen sharing — no Zoom needed
- **Domain Workspaces** — frontend, backend, and database developers work in isolated spaces that merge cleanly
- **Real Filesystem & Terminal** — Tauri-powered file explorer and shell access scoped to a dedicated project folder on disk, not a sandbox simulation
- **Dark / Light Theme** — system-aware theme switching
- **Chill Zone** — Snake, 2048, Tic Tac Toe, and DevWordle for when the team needs a break
- **Project Management** — create projects, assign team members, define domains in minutes

## 🚧 Planned

- **Contribution Tracking** — see exactly who is doing what, addressing the one-man-show problem (not yet implemented)
- **Email-based team invites** — invite teammates by email with accept/decline flow
- **Shareable web meeting links** — join a call from a browser without installing the desktop app
- **CRDT-based editing (Yjs)** — upgrade from last-write-wins sync to proper conflict-free concurrent editing
- **OAuth login** — Google and GitHub sign-in

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri (Rust) |
| Frontend | React + TypeScript + Vite |
| Code Editor | Monaco Editor |
| Real-time Sync | Socket.io |
| Voice/Video | WebRTC (browser-native, STUN-based) |
| AI | Claude (Anthropic API, server-side) |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| 3D Elements | CSS 3D transforms |

*Yjs, PostgreSQL, and Three.js/Spline are under consideration for future iterations but are not yet part of the codebase.*

## 🏁 Getting Started

```bash
git clone https://github.com/Durvansh1908/devspace.git
cd devspace
npm install
cd server && npm install && cd ..
```

Run the backend and frontend in separate terminals:

```bash
# Terminal 1 — backend
cd server
npm run dev

# Terminal 2 — frontend (Tauri desktop app)
npm run tauri dev
```

You'll need an Anthropic API key for the AI assistant. Add it to `server/.env`:

```
ANTHROPIC_API_KEY=your_key_here
```

## 🗺️ Roadmap

- [x] Landing screen with 3D particle background
- [x] Login/Signup flow
- [x] Dashboard with Discord-style layout
- [x] Project creation with domain assignment
- [x] Backend server (Express + SQLite)
- [x] Real-time collaborative editing (Socket.io, last-write-wins)
- [x] Built-in WebRTC voice/video calls
- [x] Monaco editor integration
- [x] AI code assistant (server-side Claude)
- [x] Real OS filesystem + terminal access (Tauri)
- [x] Dark/light theme switching
- [x] Chill Zone games (Snake, 2048, Tic Tac Toe, Wordle)
- [ ] Contribution tracking
- [ ] Email invite system
- [ ] Shareable web meeting links (join without desktop app)
- [ ] CRDT-based editing (Yjs)
- [ ] OAuth (Google + GitHub)
- [ ] GitHub sync

## 👤 Built by

Durvansh — solving the group project problem every CS student faces.
