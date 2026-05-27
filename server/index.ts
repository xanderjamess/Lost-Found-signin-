import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { uploadRouter } from "./routes/upload.ts";
import { chatRouter, loadChatHistory } from "./routes/chat.ts";
import { aiRouter } from "./routes/ai.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = path.join(repoRoot, "client");
const clientDist = path.join(clientRoot, "dist");

async function startServer() {
  await loadChatHistory();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const allowedOrigins = new Set<string>(
    [
      process.env.CLIENT_ORIGIN,        // production Netlify URL
      "http://localhost:3000",           // local dev
      "http://localhost:5173",           // Vite dev server
    ].filter(Boolean) as string[]
  );

  app.use((req, res, next) => {
    const origin = req.headers.origin ?? "";
    if (allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  // ──────────────────────────────────────────────────────────────────────────

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  app.use("/api", uploadRouter);
  app.use("/api", chatRouter);
  app.use("/api", aiRouter);

  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      root: clientRoot,
      configFile: path.join(clientRoot, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // On Render (API-only), we don't serve static files — Netlify handles that.
    // This branch is kept so the same binary works if you ever switch to
    // a single-service deploy.
    app.use(express.static(clientDist));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();