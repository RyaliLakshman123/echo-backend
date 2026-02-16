const GNEWS_URL = "https://gnews.io/api/v4/search";
const ALPHA_URL = "https://www.alphavantage.co/query";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";

function containsAny(text, words) {
  return words.some(word => text.toLowerCase().includes(word));
}

export async function getLiveContextIfNeeded(messages) {
  const lastMessage = messages[messages.length - 1]?.content;
  if (!lastMessage) return { type: "none" };

  const lower = lastMessage.toLowerCase();

  try {

    // =========================
    // 📈 STOCKS
    // =========================
    if (containsAny(lower, ["stock", "share price"])) {

      let symbol = null;

      const tickerMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) symbol = tickerMatch[0];

      const companyMap = {
        apple: "AAPL",
        tesla: "TSLA",
        microsoft: "MSFT",
        nvidia: "NVDA",
        google: "GOOGL",
        amazon: "AMZN",
        meta: "META",
        netflix: "NFLX"
      };

      if (!symbol) {
        for (const name in companyMap) {
          if (lower.includes(name)) {
            symbol = companyMap[name];
            break;
          }
        }
      }

      if (!symbol) return { type: "none" };

      const res = await fetch(
        `${ALPHA_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_KEY}`
      );

      const data = await res.json();
      const price = data["Global Quote"]?.["05. price"];

      if (!price) return { type: "none" };

      return {
        type: "direct",
        content: `📈 Live stock price for ${symbol} is $${price}`
      };
    }

    // =========================
    // ₿ CRYPTO
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto"])) {

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd`
      );

      const data = await res.json();

      return {
        type: "direct",
        content: `₿ Live crypto prices:
Bitcoin: $${data.bitcoin?.usd}
Ethereum: $${data.ethereum?.usd}`
      };
    }

    // =========================
    // 📰 NEWS
    // =========================
    if (containsAny(lower, ["news", "latest", "today"])) {

      const res = await fetch(
        `${GNEWS_URL}?q=${encodeURIComponent(lastMessage)}&lang=en&max=3&apikey=${process.env.GNEWS_API_KEY}`
      );

      const data = await res.json();
      if (!data.articles || data.articles.length === 0)
        return { type: "none" };

      const formatted = data.articles.map(a =>
        `Title: ${a.title}
Date: ${a.publishedAt}
Source: ${a.source.name}`
      ).join("\n\n");

      return {
        type: "inject",
        content: `Here are the latest news results:\n\n${formatted}`
      };
    }

    return { type: "none" };

  } catch (error) {
    console.error("Hybrid retrieval error:", error.message);
    return { type: "none" };
  }
}
