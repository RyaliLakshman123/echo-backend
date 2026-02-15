const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODEL_FREE = "llama-3.1-8b-instant";
const MODEL_PRO = "llama-3.3-70b-versatile";

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
      throw new Error(errorText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullContent = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep incomplete chunk

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.replace("data: ", "").trim();

        if (jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const content = json.choices?.[0]?.delta?.content ?? "";

          if (content) {
            fullContent += content;
            onChunk(content);
          }
        } catch (err) {
          // ignore bad chunks
        }
      }
    }

    return {
      content: fullContent,
      modelUsed: isPro ? "Echo Pro" : "Echo",
    };

  } catch (error) {
    console.error("🔥 Groq streaming error:", error);
    throw error;
  }
}
