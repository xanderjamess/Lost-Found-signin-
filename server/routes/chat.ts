import { Router } from "express";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CHAT_HISTORY_FILE = path.join(DATA_DIR, "chat_history.json");

let chatHistoryStore: Record<string, unknown[]> = {};

export async function loadChatHistory(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // directory may already exist or be read-only
  }

  try {
    const data = await fs.readFile(CHAT_HISTORY_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      chatHistoryStore = parsed;
    }
  } catch {
    try {
      await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify({}, null, 2));
    } catch {
      console.warn("Chat history: running without disk persistence.");
    }
  }
}

export const chatRouter = Router();

chatRouter.get("/chat-history/:userId", (req, res) => {
  const { userId } = req.params;
  res.json(chatHistoryStore[userId] || []);
});

chatRouter.post("/chat-history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { history } = req.body;
    chatHistoryStore[userId] = history;

    fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(chatHistoryStore, null, 2)).catch(
      (err) => console.warn("Chat history persistence failed:", err.message)
    );

    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to save chat history" });
  }
});
