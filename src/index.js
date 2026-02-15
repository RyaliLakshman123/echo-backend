import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoute from "./routes/chat.js";
import newsRoute from "./routes/news.js";

dotenv.config();

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

// Enable CORS for all origins (you can restrict later)
app.use(cors());

// Parse JSON bodies (limit added for safety)
app.use(express.json({ limit: "2mb" }));

/* =========================================================
   ROUTES
========================================================= */

app.use("/api/chat", chatRoute);
app.use("/api/news", newsRoute);

/* =========================================================
   HEALTH CHECK (IMPORTANT FOR RENDER)
========================================================= */

app.get("/", (req, res) => {
  res.json({ status: "Echo backend running 🚀" });
});

/* =========================================================
   SERVER START
========================================================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Echo backend running on port ${PORT}`);
});
