# Campus Lost & Found

Web app for reporting, searching, and claiming lost items on campus. Students use Firebase for auth and data; Express handles AI, image uploads, and chat history.

## Stack

| Layer | Tech |
|--------|------|
| Client | React 19, Vite, Tailwind CSS 4 |
| Server | Express (BFF for secrets) |
| Data | Firestore + Firebase Auth |
| AI | Google Gemini (server-only) |
| Images | Cloudinary (optional) |

## Project layout

```
client/     React app (index.html, admin.html, src/)
server/     API routes (AI, upload, chat history)
firestore.rules
.env        Server secrets (not committed)
```

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` and fill in:

   | Variable | Required | Notes |
   |----------|----------|--------|
   | `GEMINI_API_KEY` | For AI features | [Google AI Studio](https://aistudio.google.com/apikey) |
   | `CLOUDINARY_*` | For uploads | Optional; uploads return 503 if missing |
   | `PORT` | No | Default `3000` |

3. **Firebase** — set `client/firebase-applet-config.json` to your project. Deploy rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

## Run

```bash
npm run dev
```

| URL | App |
|-----|-----|
| http://localhost:3000 | Main site |
| http://localhost:3000/admin.html | Admin console |

**Production**

```bash
npm run build
set NODE_ENV=production
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Express + Vite dev server |
| `npm run build` | Build client and server |
| `npm run start` | Serve production build |
| `npm run lint` | Typecheck client and server |

## Features

- Report lost/found items (admin approval workflow)
- Search, filters, and AI image search
- Claims with admin review
- Comments, notifications, student dashboard
- Admin panel (reports, claims, users, analytics)
- Campus chatbot (Gemini)
- Light / dark theme (navbar toggle)

## API (server)

- `POST /api/upload-image` — Cloudinary proxy
- `POST /api/ai/chat` · `/analyze` · `/image-search`
- `GET|POST /api/chat-history/:userId` — chat persistence (`data/chat_history.json`)
