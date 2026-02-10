import express from "express";
import { fetchNews } from "../services/news.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { category = "general", page = 1 } = req.query;
    const data = await fetchNews(category, page);
    res.json(data);
  } catch (error) {
    console.error("News error:", error);
    res.status(500).json({ error: "News service failed" });
  }
});

export default router;
