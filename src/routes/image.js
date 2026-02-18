// image.js or inside your main server file

import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // OpenAI returns base64 image
    const imageBase64 = data.data[0].b64_json;

    res.json({ image: imageBase64 });

  } catch (error) {
    console.error("🔥 Image generation error:", error);
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
