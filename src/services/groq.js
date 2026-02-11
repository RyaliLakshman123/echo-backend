import fetch from "node-fetch";

export async function getChatResponse(message, mode, isPro) {
  try {
    const model = isPro
      ? "llama-3.1-70b-versatile"
      : "llama-3.1-8b-instant";

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
        }),
      }
    );

    const data = await response.json();

    // 🔍 Debug raw Groq response (keep this for now)
    console.log("🧠 GROQ RAW RESPONSE:", JSON.stringify(data, null, 2));

    // ❌ Handle Groq API errors
    if (!response.ok || data.error) {
      return {
        content: data.error?.message || "Groq API error",
        modelUsed: isPro ? "Echo Pro" : "Echo",
      };
    }

    // ✅ SAFE content extraction (Groq response variants)
    const choice = data.choices?.[0];
    let content = "No response";

    if (choice?.message?.content) {
      if (Array.isArray(choice.message.content)) {
        // Some Groq models return [{ text: "..." }]
        content = choice.message.content[0]?.text ?? "No response";
      } else {
        content = choice.message.content;
      }
    }

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
