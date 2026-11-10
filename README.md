# 🕵️‍♂️ Imposter — The Secret Word Social Deduction Game

<div align="center">
  <img src="https://hey-imposter.vercel.app/opengraph-image.png" alt="Imposter Game Banner" width="850" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"/>

  <br/><br/>

  [![Live App](https://img.shields.io/badge/PLAY_NOW-hey--imposter.vercel.app-e8433a?style=for-the-badge&logo=vercel&logoColor=white)](https://hey-imposter.vercel.app/)
  [![Go Backend](https://img.shields.io/badge/Backend-Go_1.22+-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://golang.org/)
  [![Next.js Frontend](https://img.shields.io/badge/Frontend-Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
  [![WebSockets](https://img.shields.io/badge/Protocol-Gorilla_WebSockets-4A154B?style=for-the-badge)](https://github.com/gorilla/websocket)
  [![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](#-running-tests)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

  <p align="center">
    <strong>Eight suspects walk into a room. Seven hold the exact same secret word. One holds a clever decoy.</strong><br/>
    Give subtle clues, defend your innocence, and catch the liar before they guess the word!
  </p>
</div>

---

## 🎮 How the Game Works

Imposter is a fast-paced multiplayer deduction game designed for friends, parties, and remote game nights.

1. **Secret Assignment:** Everyone receives the same secret word (e.g., *Coffee*), except the Imposter who receives a plausible decoy word (e.g., *Tea*). The Imposter doesn't know they are the imposter!
2. **Give Clues:** Players take turns giving a one-word or short clue related to their word without being too obvious.
3. **Debate & Vote:** Discuss, deduce who gave an odd clue, and vote on who to eliminate.
4. **Reveal:** The truth is revealed! If the Imposter survives or guesses the secret word, they win; otherwise, the crew wins.

---

## 📱 Two Ways to Play

| Mode | How It Works | Best For |
| :--- | :--- | :--- |
| **Pass & Play (Single Device)** | Pass one phone or tablet around the circle. Each player taps and holds to privately inspect their secret word. | In-person parties, road trips, dining out. |
| **Online Multiplayer (Multi-Device)** | Create a room and share the invite link or 6-letter room code. Each player joins from their own phone or browser with synchronized real-time state. | Remote game nights, Discord hangouts, hybrid groups. |

---

## ✨ Features & Highlights

- **Interactive Turn Reordering:** The host can drag-and-drop or tap to rearrange player turn order in the lobby to customize the clue-giving circle before starting.
- **Host Game Controls:** Host can kick players at any phase, force-advance reveal to discussion, force-tally votes if players stall, or abort rounds back to lobby across both Single-Device and Multi-Device modes.
- **In-Room "Chat & Discuss":** Built-in floating chat drawer with an unread badge counter. Spectator muting is enforced automatically so eliminated players cannot spoil the game during active discussion or voting.
- **1-Tap Invite Links:** Copy invite links or share via native Web Share API. Anyone opening the link gets the room code auto-filled instantly.
- **19 Curated Word Packs:** Over 400+ words across themes like Food & Drink, Movies & TV, Gaming, Science & Tech, Indian Regional Words, Anime, and more.
- **Reconnection Protection:** 75-second automatic grace period keeps your spot if your mobile connection temporarily drops or your phone locks.
- **Mobile-First Design:** Responsive detective corkboard theme with 16px inputs to prevent iOS Safari auto-zoom and smooth 60 FPS animations.

---

## 🧪 Running Tests

### 1. Backend Tests & Concurrency Check
Run all backend unit tests along with Go's race detector to check for concurrency issues and race conditions:
```bash
cd backend && go test -v -race ./...
```

To run standard unit tests:
```bash
cd backend && go test ./... -v
```

### 2. Load & Performance Benchmarks
Run the benchmarks to test system throughput and memory allocations under load:
```bash
cd backend && go test -bench=. -benchmem ./...
```

### 3. Frontend Lint & Type Check
Verify TypeScript types and ESLint on the Next.js frontend:
```bash
cd frontend && npm run lint && npx tsc --noEmit
```

---

## 📊 Project Specifications

| Specification | Detail |
| :--- | :--- |
| **Player Count** | 3 to 10 players per room |
| **Word Categories** | 19 theme packs (400+ words) |
| **Chat Buffer** | 80 recent messages stored in-memory per room |
| **Chat Rate Limit** | Max 40 messages per 10 seconds per user |
| **Reconnect Grace Window** | 75 seconds on disconnect before forfeit |
| **Frontend Stack** | Next.js 14 (App Router), React, TypeScript, CSS Variables |
| **Backend Stack** | Go (Golang) 1.22+, Gorilla WebSockets, Gin router |
| **Database** | PostgreSQL (Neon / Supabase) with GORM |

---

## 📂 Project Structure

```
imposter/
├── backend/
│   ├── engine/             # Game room logic and state machine
│   │   ├── manager.go      # Room registry & background cleanup sweeper
│   │   ├── manager_test.go # Unit tests for cleanup & collision resilience
│   │   ├── models.go       # Room, Player, and Chat structs
│   │   ├── room.go         # Game phases, turn ordering & chat handler
│   │   ├── room_test.go    # Unit tests for room & chat logic
│   │   └── load_test.go    # Concurrency stress tests & throughput benchmarks
│   ├── handlers/           # HTTP and WebSocket route handlers
│   │   ├── auth.go         # HMAC token signing & verification
│   │   ├── auth_test.go    # Unit tests for token security & delimiter sanitization
│   │   ├── room.go         # Room creation & joining logic
│   │   ├── ws.go           # WebSocket real-time connection hub (thread-safe SafeConn)
│   │   └── ws_test.go      # Unit tests for role secrecy & state broadcasting
│   ├── models/             # Word categories and dictionary data
│   │   ├── categories.go   # 19 category definitions
│   │   └── categories_test.go # Unit tests for categories
│   ├── scripts/            # Database seeder scripts
│   └── main.go             # Backend server entrypoint
│
├── frontend/
│   ├── app/                # Next.js 14 App Router pages
│   │   ├── components/     # UI components (ChatDrawer, etc.)
│   │   ├── room/
│   │   │   ├── [id]/       # Main game room screen
│   │   │   ├── create/     # Room creation screen
│   │   │   └── join/       # Direct join screen (auto-fills from URL)
│   │   ├── globals.css     # Theme & layout styling
│   │   └── layout.tsx      # App shell
│   ├── hooks/
│   │   └── useGameSocket.ts# WebSocket connection & auto-reconnect hook
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Go 1.22+** installed
- **Node.js 18+** & `npm` installed
- **PostgreSQL** database (Local, Neon, or Supabase)

### 2. Backend Setup
1. Open the backend folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file:
   ```env
   PORT=9999
   FRONTEND_URL=http://localhost:3000
   JWT_SECRET=dev-secret-change-in-production
   DATABASE_URL=postgres://user:password@localhost:5432/imposter?sslmode=disable
   ```
3. Run tests and start the server:
   ```bash
   go test ./... -v
   go run main.go
   ```

### 3. Frontend Setup
1. Open the frontend folder in another terminal:
   ```bash
   cd frontend
   ```
2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:9999
   NEXT_PUBLIC_WS_URL=ws://localhost:9999
   ```
3. Install packages and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🖋️ Author

**Built with ❤️ by [Mohd Musaiyab](https://itsmusaiyab.in/)**  
- Portfolio: [itsmusaiyab.in](https://itsmusaiyab.in/)  
- GitHub: [@MohdMusaiyab](https://github.com/MohdMusaiyab)  
- Live Game: [hey-imposter.vercel.app](https://hey-imposter.vercel.app/)  
