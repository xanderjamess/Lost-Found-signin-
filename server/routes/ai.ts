import { Router } from "express";
import { analyzeReportWithAI, chatWithAI, imageSearchKeywords } from "../services/ai.ts";

export const aiRouter = Router();

aiRouter.post("/ai/analyze", async (req, res) => {
  try {
    const { report, otherItems } = req.body;
    if (!report || !Array.isArray(otherItems)) {
      return res.status(400).json({ error: "report and otherItems are required" });
    }
    const result = await analyzeReportWithAI(report, otherItems);
    res.json(result);
  } catch (error) {
    console.error("POST /api/ai/analyze failed:", error);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

aiRouter.post("/ai/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }
    const reply = await chatWithAI(message, history ?? []);
    res.json({ reply });
  } catch (error) {
    console.error("POST /api/ai/chat failed:", error);
    res.status(500).json({ error: "AI chat failed" });
  }
});

aiRouter.post("/ai/image-search", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "image is required" });
    }
    const keywords = await imageSearchKeywords(image);
    res.json({ keywords });
  } catch (error) {
    console.error("POST /api/ai/image-search failed:", error);
    res.status(500).json({ error: "Image analysis failed" });
  }
});
