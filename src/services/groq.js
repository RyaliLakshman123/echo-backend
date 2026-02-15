
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODEL_FREE = "llama-3.1-8b-instant";
const MODEL_PRO = "llama-3.3-70b-versatile";

/* =========================================================
   STREAMING VERSION (FULL MEMORY SUPPORT)
========================================================= */

export async function getChatResponseStream(
  messages,
  mode,
  isPro,
  onChunk
) {
  try {
    const model = isPro ? MODEL_PRO : MODEL_FREE;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: isPro ? 1024 : 256,
        temperature: isPro ? 0.7 : 0.4,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Groq API error");
    }

    let fullContent = "";

    for await (const chunk of response.body) {
      const lines = chunk
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.replace("data: ", "");

        if (jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const content =
            json.choices?.[0]?.delta?.content ?? "";

          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch (e) {}
      }
    }

    return {
      content: fullContent || "⚠️ No response",
      modelUsed: isPro ? "Echo Pro" : "Echo",
    };

  } catch (error) {
    console.error("🔥 Groq streaming error:", error);
    throw error;
  }
}
