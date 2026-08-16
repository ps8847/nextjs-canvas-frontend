# 🎨 Sketchbook — Realtime Collaborative Drawing Canvas

A Next.js drawing canvas where everyone in a room sees every stroke, shape, and message the instant it happens. Open a room, share the link, and draw together.

**Live:** [nextjs-canvas-frontend.vercel.app](https://nextjs-canvas-frontend.vercel.app)

> This is the frontend half of the app. It talks to a companion realtime relay server — see [`../backend`](../backend) — which must be running for anything collaborative to work. Both are independently deployed, independently versioned Node projects; see the root [`CLAUDE.md`](../CLAUDE.md) for the full architecture writeup.

---

## ✨ Features

### Drawing tools
| Tool | What it does |
|---|---|
| ✏️ Pencil | Freehand strokes, adjustable color & size |
| 🧹 Eraser | Freehand erase, with a live cursor-size preview ring |
| ➖ Line | Drag to draw a straight line |
| ▭ Rectangle | Drag to draw a rectangle — outline or filled |
| ⚪ Circle | Drag to draw an ellipse — outline or filled |
| 🔤 Text | Click to drop a text label at any size/color |
| 🪣 Fill | Flood-fill an enclosed region with a click |
| ↩️ / ↪️ | Undo / redo (per-client, snapshot-based) |
| 🗑️ | Clear the whole board for everyone |
| ⬇️ | Download the canvas as an image |

### Collaboration
- **Rooms** — every board lives at its own URL (`/<roomId>`). Create a fresh room from the home page, or type/paste an existing room ID (or link) to join one.
- **Live presence** — see everyone else's cursor moving in real time, labeled with their name and color, plus a live headcount.
- **Persistence for latecomers** — join a room mid-session and the full drawing history replays for you automatically (kept in-memory on the server for the life of the room).
- **Multi-user config sync** — brush color/size changes propagate so remote strokes render the way the person actually drawing them intended.
- **Room chat** — a per-room chat panel with message history for new joiners, unread-message badges, and native OS/Windows desktop notifications when a message arrives while you're looking elsewhere.
- **Custom display names** — pick a name on join (remembered for next time), rename anytime from the room info badge.

### Canvas navigation
- **Pan & zoom** — scroll to zoom toward your cursor, hold `Space` + drag (or middle-click drag) to pan, with on-screen zoom % and reset controls.
- The canvas is a fixed large "world" surface, so everyone's strokes line up in the same coordinate space no matter how zoomed in or out they are.

---

## 🛠️ Tech stack

- **[Next.js 13](https://nextjs.org/)** (pages router) — React framework, deployed on Vercel
- **[Redux Toolkit](https://redux-toolkit.js.org/)** — UI/tool state (active tool, colors, sizes, presence, one-shot actions like undo/download)
- **[Socket.IO client](https://socket.io/)** — realtime sync with the backend relay
- **HTML Canvas API** — all drawing, driven directly via refs (not React state) for performance
- **Tailwind CSS** (CSS Modules + `@apply`) — styling
- **Font Awesome** — icons

## 🧠 How it's built

Canvas drawing state lives entirely on the client, driven imperatively via refs — [`Board`](src/components/Board/index.js) owns the canvas element(s), an undo/redo history of raster snapshots, and all pointer-event handling. Redux only holds UI/tool configuration (active tool, per-tool color & size, presence), never drawing content. Committed operations (strokes, shapes, text, fills) are sent to the backend both live (for instant rendering on other clients) and as a stored op (so new joiners can replay the room's history). Full details in the root [`CLAUDE.md`](../CLAUDE.md).

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on a page to create or join a room — drawing itself only works once the [backend](../backend) is also running on `:5000`.

### Other commands

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # next lint
```

There are no automated tests in this project.

## 📁 Project layout

```
src/
├── components/
│   ├── Board/       # canvas + all drawing/pan/zoom/socket logic
│   ├── Menu/         # tool selector + undo/redo/clear/download/share
│   ├── Toolbox/      # color/size/fill controls for the active tool
│   ├── Chat/          # room chat panel + notifications
│   ├── JoinModal/     # display-name prompt on first visit to a room
│   └── RoomInfo/      # room ID badge, headcount, rename-yourself
├── pages/
│   ├── index.js       # create/join room landing page
│   └── [roomId].js    # the actual drawing room
├── slice/             # Redux Toolkit slices: menu, toolbox, presence
├── socket.js          # Socket.IO client singleton
├── store.js           # Redux store
└── constants.js        # menu items, colors, canvas world size, zoom limits
```

## 🌐 Deployment

Deployed to [Vercel](https://vercel.com). The Socket.IO backend URL is selected in [`socket.js`](src/socket.js) based on `NODE_ENV` (not `next.config.js` env vars) — `localhost:5000` in development, the deployed Render URL in production.

## 📄 License

This project is licensed under the [MIT License](LICENSE).
