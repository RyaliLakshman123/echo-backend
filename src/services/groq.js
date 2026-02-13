import fetch from "node-fetch";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ✅ VERIFIED FROM YOUR API KEY
const MODEL_FREE = "llama-3.1-8b-instant";
const MODEL_PRO = "llama-3.3-70b-versatile";

// 🆕 STREAMING VERSION
export async function getChatResponseStream(message, mode, isPro, onChunk) {
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
        stream: true, // 🔥 Enable streaming
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Groq API error");
    }

    let fullContent = "";

    // 🔥 Read streaming response
    for await (const chunk of response.body) {
      const lines = chunk
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");

          if (jsonStr === "[DONE]") continue;

          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices?.[0]?.delta?.content || "";

            if (content) {
              fullContent += content;
              onChunk(content); // 🔥 Send chunk to client
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
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

// ✅ KEEP OLD NON-STREAMING VERSION (for backwards compatibility)
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
