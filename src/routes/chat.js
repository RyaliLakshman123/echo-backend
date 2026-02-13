import express from "express";
import { getChatResponse, getChatResponseStream } from "../services/groq.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, mode, isPro, stream = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔥 STREAMING MODE
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

      try {
        await getChatResponseStream(
          message,
          mode,
          isPro,
          (chunk) => {
            // Send each chunk as SSE
            res.write(`data: ${JSON.stringify({ 
              content: chunk, 
              modelUsed: isPro ? "Echo Pro" : "Echo" 
            })}\n\n`);
          }
        );

        // Signal completion
        res.write("data: [DONE]\n\n");
        res.end();
      } catch (error) {
        console.error("Streaming error:", error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    } 
    // ✅ NON-STREAMING MODE (backwards compatibility)
    else {
      const result = await getChatResponse(message, mode, isPro);
      res.json(result);
    }

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat service failed" });
  }
});

export default router;
