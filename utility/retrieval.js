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

    // =========================
    // 📰 NEWS
    // =========================
    if (containsAny(lower, ["news", "latest", "today"])) {

      const res = await fetch(
        `${GNEWS_URL}?q=${encodeURIComponent(lastMessage)}&lang=en&max=3&apikey=${process.env.GNEWS_API_KEY}`
      );

      if (!res.ok) {
        console.error("GNews error:", res.status);
        return null;
      }

      const data = await res.json();
      if (!data.articles || data.articles.length === 0) return null;

      const formatted = data.articles.map(a =>
        `Title: ${a.title}
Date: ${a.publishedAt}
Source: ${a.source.name}`
      ).join("\n\n");

      return `Here are the latest news results:\n\n${formatted}`;
    }


    // =========================
    // 📈 STOCKS
    // =========================
    if (containsAny(lower, ["stock", "share price"])) {

      let symbol = null;

      // Try uppercase ticker first (AAPL, TSLA, etc.)
      const tickerMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) {
        symbol = tickerMatch[0];
      }

      // Company name mapping
      const companyMap = {
        apple: "AAPL",
        tesla: "TSLA",
        microsoft: "MSFT",
        nvidia: "NVDA",
        google: "GOOGL",
        alphabet: "GOOGL",
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

      if (!symbol) return null;

      const res = await fetch(
        `${ALPHA_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_KEY}`
      );

      if (!res.ok) {
        console.error("Alpha Vantage error:", res.status);
        return null;
      }

      const data = await res.json();
      const price = data["Global Quote"]?.["05. price"];

      if (!price) {
        console.error("Alpha returned no price:", data);
        return null;
      }

      return `Live stock price for ${symbol} is $${price}`;
    }


    // =========================
    // ₿ CRYPTO
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto"])) {

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd`
      );

      if (!res.ok) {
        console.error("CoinGecko error:", res.status);
        return null;
      }

      const data = await res.json();

      return `Live crypto prices:
Bitcoin: $${data.bitcoin?.usd}
Ethereum: $${data.ethereum?.usd}`;
    }


    // =========================
    // 🌍 WIKIPEDIA (fallback)
    // =========================
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
