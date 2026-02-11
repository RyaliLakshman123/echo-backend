import fetch from "node-fetch";

export async function getChatResponse(message, mode, isPro) {
  try {
    const model = "llama3-8b-8192"; // ✅ safest Groq model

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

    if (!response.ok) {
      return {
        content: data.error?.message || "Groq request failed",
        modelUsed: isPro ? "Echo Pro" : "Echo",
      };
    }

    const content =
      data?.choices?.[0]?.message?.content ??
      "Groq returned no message";

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
