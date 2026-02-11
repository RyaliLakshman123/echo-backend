import fetch from "node-fetch";

export async function getChatResponse(message, mode, isPro) {
  try {
    const model = isPro
      ? "llama-3.3-70b-versatile"   // ✅ PRO MODEL
      : "llama-3.3-8b-instant";    // ✅ FREE MODEL

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
            { role: "system", content: "You are Echo AI, a helpful assistant." },
            { role: "user", content: message },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("🧠 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

    // 🔴 Handle Groq errors explicitly
    if (!response.ok || data.error) {
      return {
        content: data.error?.message || "Groq API error",
        modelUsed: isPro ? "Echo Pro" : "Echo",
      };
    }

    const content =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Empty response from Groq";

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
