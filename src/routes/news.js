import express from "express";
import { fetchNews, fetchNewsByKeyword } from "../services/news.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { category = "general", page = 1, q, sortBy } = req.query;

    let data;

    if (q) {
      // Automobile, Movies etc — keyword search
      data = await fetchNewsByKeyword(q, sortBy || "publishedAt", page);
    } else {
      // Normal category search
      data = await fetchNews(category, page);
    }

    res.json(data);
  } catch (error) {
    console.error("News error:", error);
    res.status(500).json({ error: "News service failed" });
  }
});

export default router;
