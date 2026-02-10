import express from "express";
import { getChatResponse } from "../services/groq.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, mode, isPro } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const result = await getChatResponse(message, mode, isPro);
    res.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Chat service failed" });
  }
});

export default router;
