const GNEWS_URL = "https://gnews.io/api/v4/search";
const ALPHA_URL = "https://www.alphavantage.co/query";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const WIKI_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/";

function containsAny(text, words) {
  return words.some(word => text.toLowerCase().includes(word));
}

export async function getLiveContextIfNeeded(messages) {
  const lastMessage = messages[messages.length - 1]?.content;
  if (!lastMessage) return null;

  const lower = lastMessage.toLowerCase();

  try {

    // 📰 NEWS
    if (containsAny(lower, ["news", "latest", "today"])) {
      const res = await fetch(
        `${GNEWS_URL}?q=${encodeURIComponent(lastMessage)}&lang=en&max=3&apikey=${process.env.GNEWS_API_KEY}`
      );

      const data = await res.json();
      if (!data.articles) return null;

      const formatted = data.articles.map(a =>
        `Title: ${a.title}\nDate: ${a.publishedAt}\nSource: ${a.source.name}`
      ).join("\n\n");

      return `Here are the latest news results:\n\n${formatted}`;
    }

    // 📈 STOCKS
    if (containsAny(lower, ["stock", "share price"])) {
      const symbolMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (!symbolMatch) return null;

      const symbol = symbolMatch[0];

      const res = await fetch(
        `${ALPHA_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_KEY}`
      );

      const data = await res.json();
      const price = data["Global Quote"]?.["05. price"];

      if (!price) return null;

      return `Current stock price for ${symbol} is $${price}`;
    }

    // ₿ CRYPTO
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "crypto"])) {
      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd`
      );

      const data = await res.json();

      return `Live crypto prices:\nBitcoin: $${data.bitcoin.usd}\nEthereum: $${data.ethereum.usd}`;
    }

    // 🌍 WIKIPEDIA (General real-time factual info)
    const topic = lastMessage.split(" ").slice(-1)[0];
    const wikiRes = await fetch(WIKI_URL + encodeURIComponent(topic));
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData.extract) {
        return `Wikipedia summary:\n${wikiData.extract}`;
      }
    }

    return null;

  } catch (error) {
    console.error("Hybrid retrieval error:", error.message);
    return null;
  }
}
