import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ✅ VERIFIED FROM YOUR API KEY
const MODEL_FREE = "llama-3.1-8b-instant";
const MODEL_PRO  = "llama-3.3-70b-versatile";

export async function getChatResponse(message, mode, isPro) {
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
        messages: [{ role: "user", content: message }],
        max_tokens: isPro ? 1024 : 256,
        temperature: isPro ? 0.7 : 0.4,
      }),
    });

    const data = await response.json();

    console.log("🧠 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

    if (!response.ok || data.error) {
      return {
        content: data.error?.message || "Groq API error",
        modelUsed: isPro ? "Echo Pro" : "Echo",
      };
    }

    return {
      content: data.choices?.[0]?.message?.content ?? "⚠️ No response",
      modelUsed: isPro ? "Echo Pro" : "Echo",
    };

  } catch (error) {
    console.error("🔥 Groq crash:", error);
    return {
      content: "Backend error contacting Groq",
      modelUsed: isPro ? "Echo Pro" : "Echo",
    };
  }
}
