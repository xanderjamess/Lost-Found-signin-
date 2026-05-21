import "dotenv/config";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { MOCK_ITEMS } from "./src/constants.ts";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");
const CHAT_HISTORY_FILE = path.join(DATA_DIR, "chat_history.json");

// In-Memory Database State Fallbacks for Read-Only Environments
let reportsStore = [...MOCK_ITEMS];
let commentsStore: any[] = [];
let chatHistoryStore: Record<string, any> = {};

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.warn("Soft warning: directory creation failed or already exists:", error);
  }

  // Load Reports
  try {
    const data = await fs.readFile(REPORTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      reportsStore = parsed;
    } else {
      await fs.writeFile(REPORTS_FILE, JSON.stringify(MOCK_ITEMS, null, 2));
    }
  } catch (err) {
    console.warn("Could not load reports from file, using template mock items. Attempting initial sync...");
    try {
      await fs.writeFile(REPORTS_FILE, JSON.stringify(MOCK_ITEMS, null, 2));
    } catch {
      console.warn("Web server running in READ-ONLY mode. Changes will persist in memory.");
    }
  }

  // Load Comments
  try {
    const data = await fs.readFile(COMMENTS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      commentsStore = parsed;
    }
  } catch (err) {
    try {
      await fs.writeFile(COMMENTS_FILE, JSON.stringify([], null, 2));
    } catch {
      // ignore
    }
  }

  // Load Chat History
  try {
    const data = await fs.readFile(CHAT_HISTORY_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      chatHistoryStore = parsed;
    }
  } catch (err) {
    try {
      await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify({}, null, 2));
    } catch {
      // ignore
    }
  }
}

async function startServer() {
  await ensureDataDir();
  const app = express();
  // Cloud Run sets PORT environment variable automatically
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API Routes
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image data provided" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        console.warn("Cloudinary configuration remains incomplete on the server.");
        return res.status(503).json({
          error: "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the environment variables."
        });
      }

      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
      });

      console.log("Uploading file to Cloudinary...");
      const uploadResult = await cloudinary.uploader.upload(image, {
        folder: "campus_lost_found"
      });

      console.log("Uploaded successfully to Cloudinary:", uploadResult.secure_url);
      res.json({
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      });
    } catch (e: any) {
      console.error("Cloudinary upload failed on backend handler:", e);
      res.status(500).json({ error: e.message || "Failed to upload image to Cloudinary" });
    }
  });

  app.get("/api/reports", (req, res) => {
    console.log(`GET /api/reports - serving ${reportsStore.length} items`);
    res.json(reportsStore);
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const newReport = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      reportsStore.push(newReport);
      
      // Graceful disk persistence
      fs.writeFile(REPORTS_FILE, JSON.stringify(reportsStore, null, 2))
        .catch(err => console.warn("Warm warning: File persistence failed (Read-only environment):", err.message));

      res.status(201).json(newReport);
    } catch (error) {
      res.status(500).json({ error: "Failed to save report" });
    }
  });

  app.patch("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const index = reportsStore.findIndex((r: any) => r.id === id);
      if (index === -1) return res.status(404).json({ error: "Report not found" });

      reportsStore[index] = { ...reportsStore[index], ...updates };
      
      // Graceful disk persistence
      fs.writeFile(REPORTS_FILE, JSON.stringify(reportsStore, null, 2))
        .catch(err => console.warn("Warm warning: File persistence failed (Read-only environment):", err.message));

      res.json(reportsStore[index]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  // Comment Routes
  app.get("/api/comments", (req, res) => {
    try {
      const { itemId, isAdmin } = req.query;
      let comments = [...commentsStore];
      
      if (itemId) {
        comments = comments.filter((c: any) => c.itemId === itemId && !c.isDeleted);
        // Only show hidden comments to admins
        if (isAdmin !== 'true') {
          comments = comments.filter((c: any) => !c.isHidden);
        }
      }
      
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to read comments" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const newComment = {
        id: Date.now().toString(),
        ...req.body,
        date: new Date().toISOString(),
        isDeleted: false,
        isFlagged: false,
        isHidden: false
      };
      commentsStore.push(newComment);

      // Graceful disk persistence
      fs.writeFile(COMMENTS_FILE, JSON.stringify(commentsStore, null, 2))
        .catch(err => console.warn("Warm warning: Comments file persistence failed:", err.message));

      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ error: "Failed to save comment" });
    }
  });

  // Chat History Routes
  app.get("/api/chat-history/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      res.json(chatHistoryStore[userId] || []);
    } catch (error) {
      res.status(500).json({ error: "Failed to read chat history" });
    }
  });

  app.post("/api/chat-history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { history } = req.body;
      chatHistoryStore[userId] = history;

      // Graceful disk persistence
      fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(chatHistoryStore, null, 2))
        .catch(err => console.warn("Warm warning: Chat history file persistence failed:", err.message));

      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save chat history" });
    }
  });

  app.patch("/api/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const index = commentsStore.findIndex((c: any) => c.id === id);
      if (index === -1) return res.status(404).json({ error: "Comment not found" });

      commentsStore[index] = { ...commentsStore[index], ...updates };

      // Graceful disk persistence
      fs.writeFile(COMMENTS_FILE, JSON.stringify(commentsStore, null, 2))
        .catch(err => console.warn("Warm warning: Comments update file persistence failed:", err.message));

      res.json(commentsStore[index]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const index = commentsStore.findIndex((c: any) => c.id === id);
      if (index === -1) return res.status(404).json({ error: "Comment not found" });

      commentsStore[index].isDeleted = true;

      // Graceful disk persistence
      fs.writeFile(COMMENTS_FILE, JSON.stringify(commentsStore, null, 2))
        .catch(err => console.warn("Warm warning: Comments soft-delete persistence failed:", err.message));

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Catch-all for API routes to return JSON instead of HTML
  app.use("/api/*", (req, res) => {
    console.log(`API 404: ${req.originalUrl}`);
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
