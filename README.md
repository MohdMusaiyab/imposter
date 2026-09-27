# 🕵️‍♂️ Imposter — The Secret Word Deduction Game

**Imposter** is a fast-paced, real-time multiplayer social deduction game. Eight suspects walk into a room. Seven are given the exact same secret word. One is given a fake word. Your goal? **Find the liar.**

Play live across multiple devices with your friends, or pass-and-play in "Hotseat" mode on a single device. Built around a beautiful, highly interactive "Detective Whiteboard" UI.

<div align="center">
  <img src="https://hey-imposter.vercel.app/opengraph-image.png" alt="Imposter Game Screenshot" width="800"/>
</div>

[![Website Badge](https://img.shields.io/badge/Play_Now-hey--imposter.vercel.app-e8433a?style=for-the-badge)](https://hey-imposter.vercel.app/)

---

## 🏗️ Architecture & Tech Stack

This project is decoupled into a lightning-fast React frontend and a powerful, low-latency Go backend.

- **Frontend:** Next.js 14+ (App Router), React, Vanilla CSS, TypeScript.
- **Backend:** Go (Golang), Gin-Gonic, Gorilla WebSockets.
- **Database:** PostgreSQL (with GORM).
- **Deployment:** Vercel (Frontend Edge) & Render (Backend Go).

---

## 🧠 Core Engineering Decisions

### 1. CSS-Governed Fluid Engine
Instead of flooding the main JavaScript thread with heavy animation libraries (like Framer Motion), almost all visual tracking and scaling behaviors (e.g., the suspect rendering, mobile tooltips, and the tracking coordinate eyes) are governed fluidly through pure CSS custom variables and media queries. This guarantees a locked 60FPS UI rendering, preventing the browser from stuttering on mobile hardware. 

### 2. Scalable Database Seeding
The backend dynamically processes a massive pool of over 200 interconnected word pairs (400 unique words). The database seed script handles injection collisions gracefully, tracking mapped IDs recursively so multiple backend instances boot up with zero memory overflows or duplicate primary key overrides.

### 3. Server-Client State Handshakes
Network instability is the enemy of multiplayer games. To circumvent typical websocket dropouts (like a phone going to sleep), the Next.js client mints an encrypted `imposter_session` key stored natively in `localStorage`. If the Gorilla WebSocket disconnects natively, the client aggressively attempts exponential backoff reconnection, silently restoring the player's real-time state back to the Go memory cache without resetting their game loop.

---

## 🛡️ Security & Resiliency 

To prevent network manipulation or concurrent data corruption during intense "Voting phases", the backend employs aggressive safeguards:

* **State Freezing (Mutex Locks):** The Go backend isolates active game memories using `sync.Mutex`. When 8 players vote sequentially on the exact same millisecond, the Go runtime completely locks the core state, processes them hierarchically without crashing or causing race condition desyncs, and dynamically unfreezes. 
* **Strict Room Privacy:** Hardcoded API routing logic forces `isPrivate: true` instantiation. Game identifiers are pseudo-random HEX UUIDs. Bad actors cannot write scripts to brute-force scrape active public game rooms.
* **Aggressive Heartbeat Architecture:** Because the Go engine runs on scaled architecture, inactivity triggers a sleep-mode. The backend features a unique `/health` heartbeat endpoint that does not mock execution; it forces a deep physical `sqlDB.Ping()` against the Postgres cluster, instantly validating both the connection pool and the container runtime, allowing cron jobs to safely enforce uptime SLA.

---

## 💻 Local Setup & Development

Want to run the codebase locally? Follow these steps:

### 1. PostgreSQL Databse
You must have a local PostgreSQL database running, or a connection string to a hosted database (e.g. Supabase, Neon).

### 2. Backend Boot (Go)
1. Navigate to `/backend`.
2. Create a `.env` file containing:
   ```env
   PORT=9999
   FRONTEND_URL=http://localhost:3000
   DATABASE_URL=postgres://user:pass@localhost:5432/imposter
   ```
3. Run `go mod tidy` to fetch dependencies.
4. (Optional) Run `go run scripts/seed_custom/main.go` to populate the word database.
5. Boot the server: `go run main.go`

### 3. Frontend Boot (Next.js)
1. Navigate to `/frontend`.
2. Create a `.env.local` file containing:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9999
   NEXT_PUBLIC_WS_URL=ws://localhost:9999
   ```
3. Run `npm install` to load dependencies.
4. Boot the Next.js server: `npm run dev`

Open `http://localhost:3000` in your browser. The connection will automatically upgrade to WebSockets and sync with the Go runtime!

---

### 🖋 Author
**Built by Mohd Musaiyab**  
🔗 [Portfolio](https://itsmusaiyab.in/) | 🔗 [GitHub](https://github.com/MohdMusaiyab)
