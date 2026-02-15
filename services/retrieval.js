const LANGSEARCH_URL = "https://api.langsearch.com/search"; 
// ⚠️ If endpoint differs, replace with correct one from their docs

function needsLiveData(query) {
  const triggers = [
    "latest",
    "today",
    "current",
    "news",
    "price",
    "2024",
    "2025",
    "2026",
    "recent",
  ];

  return triggers.some(word =>
    query.toLowerCase().includes(word)
  );
}

export async function getLiveContextIfNeeded(messages) {
  const lastMessage = messages[messages.length - 1]?.content;

  if (!lastMessage || !needsLiveData(lastMessage)) {
    return null;
  }

  try {
    const response = await fetch(LANGSEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: lastMessage,
        limit: 3
      })
    });

    if (!response.ok) {
      throw new Error("LangSearch failed");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const formatted = data.results
      .map(r =>
        `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`
      )
      .join("\n\n");

    return `Use this latest web information to answer accurately:\n\n${formatted}`;

  } catch (error) {
    console.error("LangSearch error:", error.message);
    return null;
  }
}
