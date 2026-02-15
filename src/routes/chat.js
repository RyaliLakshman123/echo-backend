import express from "express";
import { getChatResponseStream } from "../services/groq.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages, mode, isPro, stream = true } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // 🔥 STREAMING ONLY (production)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      await getChatResponseStream(
        messages,
        mode,
        isPro,
        (chunk) => {
          res.write(
            `data: ${JSON.stringify({
              content: chunk,
              modelUsed: isPro ? "Echo Pro" : "Echo",
            })}\n\n`
          );
        }
      );

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Streaming error:", error);
      res.write(
        `data: ${JSON.stringify({
          error: error.message,
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat service failed" });
  }
});

export default router;
