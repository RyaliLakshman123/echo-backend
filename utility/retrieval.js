const GNEWS_URL = "https://gnews.io/api/v4/search";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const YAHOO_FINANCE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";

function containsAny(text, words) {
  return words.some(word => text.includes(word));
}

export async function getLiveContextIfNeeded(messages) {
  const lastMessage = messages[messages.length - 1]?.content;
  if (!lastMessage) return { type: "none" };

  const lower = lastMessage.toLowerCase();

  try {

    // ====================================================
    // 📈 STOCKS — Yahoo Finance (No API Key Needed)
    // ====================================================
    if (containsAny(lower, ["stock", "share price"])) {

      let symbol = null;

      // Try ticker detection
      const tickerMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) symbol = tickerMatch[0];

      // Company mapping
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
        `${YAHOO_FINANCE_URL}?symbols=${symbol}`
      );

      const data = await res.json();

      const price =
        data?.quoteResponse?.result?.[0]?.regularMarketPrice;

      if (!price) {
        console.log("Yahoo Finance response:", data);
        return { type: "none" };
      }

      return {
        type: "direct",
        content: `📈 Live stock price for ${symbol} is $${price}`
      };
    }

    // ====================================================
    // ₿ CRYPTO — CoinGecko
    // ====================================================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto"])) {

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd`
      );

      const data = await res.json();

      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;

      if (!btc && !eth) {
        console.log("CoinGecko response:", data);
        return { type: "none" };
      }

      return {
        type: "direct",
        content: `₿ Live crypto prices:
Bitcoin: $${btc ?? "N/A"}
Ethereum: $${eth ?? "N/A"}`
      };
    }

    // ====================================================
    // 📰 NEWS — Inject into LLM
    // ====================================================
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
        content: `Here are the latest verified news results:\n\n${formatted}`
      };
    }

    return { type: "none" };

  } catch (error) {
    console.error("Hybrid retrieval error:", error.message);
    return { type: "none" };
  }
}
