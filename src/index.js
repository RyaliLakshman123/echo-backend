import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoute from "./routes/chat.js";
import newsRoute from "./routes/news.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 🚨 THESE MUST RECEIVE FUNCTIONS
app.use("/api/chat", chatRoute);
app.use("/api/news", newsRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Echo backend running on port ${PORT}`);
});
