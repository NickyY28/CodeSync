# [CodeSync]

> Real-time collaborative code editing with zero friction.

CodeSync is a full-stack real-time collaborative coding environment. It allows multiple developers to join a room, write code together in real-time, see each other's cursors, and manage multiple files—exactly like Google Docs for code.

![CodeSync Demo](placeholder-for-demo-image.gif)

## Features

- **Real-Time Collaboration:** Instant code synchronization using WebSockets (`Socket.io`).
- **Live Cursor Tracking:** See exactly where other developers are typing with color-coded cursors.
- **VS Code Experience:** Powered by the `Monaco Editor` for professional syntax highlighting and keybindings.
- **Multi-File Architecture:** Create and switch between multiple files (JS, CSS, HTML, etc.) within a single room.
- **Secure Authentication:** JWT-based user authentication and protected routes.
- **Optimized Performance:** Uses an in-memory caching system (RAM) for ultra-fast, high-frequency keystroke syncing, while persisting final states to MongoDB.

## Tech Stack

### Frontend
- **React (v19)** with **Vite** for fast builds and optimized rendering.
- **React Router DOM** for protected routing and navigation.
- **Monaco Editor** (`@monaco-editor/react`) for the core editor interface.
- **Axios** for HTTP API communications.

### Backend
- **Node.js & Express.js** for the RESTful API architecture.
- **Socket.io** for bidirectional, real-time WebSocket communication.
- **MongoDB & Mongoose** for persistent data storage (Users, Rooms, Files).
- **JSON Web Tokens (JWT) & bcryptjs** for secure authentication and password hashing.

## System Architecture & Workflow

CodeSync implements a hybrid state-management approach to balance performance and persistence:

1. **The Handshake:** Users authenticate via REST APIs and receive a JWT.
2. **Room Entry:** Users join a room via a unique Share Code. The initial state (files, existing users) is fetched from MongoDB.
3. **The Hot State (RAM):** Once inside, the connection upgrades to WebSockets. All high-frequency events (keystrokes, cursor movements) bypass the database and are handled by a dedicated Node.js `Map()` in server memory (`roomState.js`) to prevent database throttling and ensure near-zero latency.
4. **Persistence:** The live code is periodically flushed to MongoDB when a user manually saves (`Ctrl+S`) or when the final user disconnects from the room.

## Installation & Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local instance or MongoDB Atlas)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/CodeSync.git
   cd CodeSync
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `/server` directory and add:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access the App:**
   Open `http://localhost:5173` in your browser.

