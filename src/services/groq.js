import fetch from "node-fetch";

export async function getChatResponse(message, mode, isPro) {
  const model = isPro
    ? "llama-3.1-70b-versatile"
    : "llama-3.1-8b-instant";

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: message }]
      })
    }
  );

  const data = await response.json();

  return {
    content: data.choices?.[0]?.message?.content ?? "No response",
    modelUsed: isPro ? "Echo Pro" : "Echo"
  };
}
