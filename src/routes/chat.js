import express from "express";
import { getChatResponseStream } from "../services/groq.js";
import { getLiveContextIfNeeded } from "../../utility/retrieval.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages, mode, isPro, stream = true } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // 🔥 STREAMING HEADERS
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      // 🔥 STEP 1 — Inject Live Retrieval (if needed)
      let enhancedMessages = [...messages];

      const liveContext = await getLiveContextIfNeeded(messages);

      if (liveContext) {
        enhancedMessages = [
          {
            role: "system",
            content: liveContext,
          },
          ...messages,
        ];
      }
console.log("📨 Final Messages Sent To Groq:", enhancedMessages);
      // 🔥 STEP 2 — Call Groq Streaming
      await getChatResponseStream(
        enhancedMessages,
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

      // 🔥 STEP 3 — End Stream
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
