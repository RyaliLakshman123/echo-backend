import express from "express";
import { getChatResponseStream } from "../services/groq.js";
import { getLiveContextIfNeeded } from "../../utility/retrieval.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { messages, mode, isPro } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // 🔥 STREAMING HEADERS
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // 🔥 STEP 1 — Hybrid Retrieval
    const liveResult = await getLiveContextIfNeeded(messages);

    // ========================================
    // ✅ DIRECT DATA (Stocks / Crypto)
    // ========================================
    if (liveResult.type === "direct") {
      res.write(
        `data: ${JSON.stringify({
          content: liveResult.content,
          modelUsed: "Live Data"
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    // ========================================
    // ✅ INJECT DATA (News)
    // ========================================
    let enhancedMessages = [...messages];

    if (liveResult.type === "inject") {
      enhancedMessages = [
        {
          role: "system",
          content: liveResult.content, // ✅ STRING ONLY
        },
        ...messages,
      ];
    }

    console.log("📨 Final Messages Sent To Groq:", enhancedMessages);

    // 🔥 STEP 2 — Stream Groq
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
});

export default router;
