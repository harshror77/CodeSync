# CodeSync — Collaborative Code Editor

A real-time collaborative IDE where multiple developers can write code together in the same room, see each other's cursors live, chat, and execute code — all in the browser.

> Built with Yjs CRDTs for conflict-free real-time sync, the same algorithm used by Google Docs.

---

## Features

- **Live collaborative editing** — multiple users edit the same file simultaneously with zero conflicts, powered by Yjs CRDT (Conflict-free Replicated Data Type)
- **Live cursor presence** — see every collaborator's cursor and selection in real time, each user gets a unique persistent color
- **Multi-language code execution** — run JavaScript, Python, C, and C++ directly in the browser via an isolated execution API
- **Room-based sessions** — create a room and share the ID; anyone with the link can join instantly
- **Real-time chat** — per-room chat with typing indicators, persisted to database
- **Virtual file system** — create, rename, and delete files and folders inside a room; file content is persisted across sessions
- **JWT authentication** — secure login with access tokens and refresh token rotation via httpOnly cookies
- **Active user panel** — see who is currently in the room, color-coded to match their editor cursor

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| Tailwind CSS v4 | Styling |
| CodeMirror 6 | Code editor with syntax highlighting |
| Yjs + y-codemirror.next | CRDT-based real-time sync and cursor rendering |
| @hocuspocus/provider | WebSocket client for Yjs document sync |
| Socket.io client | Room events, chat, user presence |
| Redux Toolkit | Auth state management |
| React Router v7 | Client-side routing |

### Backend
| Tool | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database for users, rooms, files, chat |
| @hocuspocus/server | Yjs WebSocket server for document sync |
| Socket.io | Real-time room and chat events |
| JWT | Access token + refresh token auth |
| Bcrypt | Password hashing |
| Cloudinary | Avatar image storage |
| Multer | File upload middleware |

---

## Architecture

```
Browser (User A)                    Browser (User B)
      │                                   │
      ├── Socket.io ──────────────────────┤  (room events, chat, presence)
      │         │                         │
      │    Express Server (port 7000)      │
      │         │                         │
      │       MongoDB                     │
      │                                   │
      └── WebSocket ──────────────────────┘  (Yjs document sync)
                   │
          Hocuspocus Server (port 1234)
                   │
               MongoDB (file content persistence)
```

**How real-time sync works:**
Each file opened in a room creates a Yjs document identified by `roomId::filePath`. Hocuspocus broadcasts all document operations (inserts, deletes) to every connected client via WebSocket. Yjs resolves concurrent edits using CRDTs — no locking, no conflicts, no last-write-wins data loss. Cursor positions are broadcast through the Yjs awareness protocol separately from document content.

---

## Project Structure

```
CodeSync/
├── Backend/
│   └── src/
│       ├── controllers/     # Route handlers (user, room, file, chat)
│       ├── models/          # Mongoose schemas (User, Room, File, Chat)
│       ├── routes/          # Express routers
│       ├── services/        # Business logic (RoomService)
│       ├── middleware/       # JWT auth, Multer
│       ├── utils/           # ApiError, ApiResponse, asyncHandler, Cloudinary
│       ├── exec/            # Code execution via JDoodle (Socket.io namespace)
│       ├── socket.js        # Socket.io room and chat event handlers
│       ├── yjs-server.js    # Hocuspocus server for Yjs document sync
│       └── app.js           # Express app setup
│
└── Frontend/
    └── src/
        ├── components/
        │   ├── CodeEditor.jsx   # Main IDE view with Yjs sync and cursor presence
        │   ├── FileSidebar.jsx  # Virtual file explorer
        │   ├── Chat.jsx         # Real-time room chat
        │   ├── Room.jsx         # Create / join room screen
        │   ├── Home.jsx         # Landing page
        │   ├── Login.jsx        # Auth
        │   └── SignUp.jsx       # Auth
        └── store/
            ├── store.js         # Redux store
            └── authSlice.js     # Auth state slice
```

---

## Author

**Harsh Vardhan Chaudhary**  
B.Tech CSE, MNNIT Allahabad  
[GitHub](https://github.com/harshror77)
