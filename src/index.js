import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoute from "./routes/chat.js";
import newsRoute from "./routes/news.js";
import imageRoute from "./routes/image.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/image", imageRoute);

// ✅ Health check endpoint (REQUIRED for Render)
app.get("/", (req, res) => {
  res.send("Echo backend is live 🚀");
});

app.use("/api/chat", chatRoute);
app.use("/api/news", newsRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Echo backend running on port ${PORT}`);
});
