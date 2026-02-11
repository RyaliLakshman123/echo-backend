import fetch from "node-fetch";

export async function getChatResponse(message, mode, isPro) {
  try {
    // ✅ Supported Groq models
    const model = isPro
      ? "llama-3.1-70b-versatile"   // PRO
      : "llama-3.1-8b-instant";     // FREE

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    console.log("🧠 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

    // 🔴 Explicit error handling
    if (!response.ok || data.error) {
      return {
        content: data.error?.message || "Groq API error",
        modelUsed: isPro ? "Echo Pro" : "Echo",
      };
    }

    const content =
      data?.choices?.[0]?.message?.content ??
      "Groq returned no response";

    return {
      content,
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
