import express from "express";

const router = express.Router();

router.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    const encoded = encodeURIComponent(prompt);

    const url =
      `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${Math.floor(Math.random()*9999)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "EchoAI-Backend"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.log("Pollinations error:", text);
      return res.status(response.status).send(text);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    res.json({ image: base64 });

  } catch (error) {
    console.error("🔥 Pollinations backend error:", error);
    res.status(500).json({ error: "Image generation failed" });
  }
});

export default router;
