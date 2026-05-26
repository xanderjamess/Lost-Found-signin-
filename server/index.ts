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
    app.use(express.static(clientDist));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
      }
      // Serve index.html for all non-API routes so the SPA handles routing (including /admin)
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
