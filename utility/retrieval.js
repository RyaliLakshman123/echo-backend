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

  console.log("🔍 Retrieval triggered for:", lower);

  try {

    // =========================
    // 📈 STOCKS
    // =========================
    if (containsAny(lower, ["stock", "share"])) {

      console.log("📈 Stock detection triggered");

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

      if (!symbol) {
        console.log("❌ No stock symbol detected");
        return { type: "none" };
      }

      console.log("📊 Fetching stock for:", symbol);

      const res = await fetch(`${YAHOO_FINANCE_URL}?symbols=${symbol}`);
      const data = await res.json();

      console.log("📊 Yahoo response:", data);

      const price = data?.quoteResponse?.result?.[0]?.regularMarketPrice;

      if (!price) {
        console.log("❌ No price found");
        return { type: "none" };
      }

      return {
        type: "direct",
        content: `📈 Live stock price for ${symbol} is $${price}`
      };
    }

    // =========================
    // ₿ CRYPTO
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth"])) {

      console.log("₿ Crypto detection triggered");

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd`
      );

      const data = await res.json();

      console.log("₿ CoinGecko response:", data);

      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;

      if (!btc && !eth) {
        console.log("❌ No crypto price found");
        return { type: "none" };
      }

      return {
        type: "direct",
        content: `₿ Live crypto prices:
Bitcoin: $${btc ?? "N/A"}
Ethereum: $${eth ?? "N/A"}`
      };
    }

    // =========================
    // 📰 NEWS
    // =========================
    if (containsAny(lower, ["news", "latest", "today"])) {

      console.log("📰 News detection triggered");

      const res = await fetch(
        `${GNEWS_URL}?q=${encodeURIComponent(lastMessage)}&lang=en&max=3&apikey=${process.env.GNEWS_API_KEY}`
      );

      const data = await res.json();

      console.log("📰 GNews response:", data);

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
    console.error("🔥 Retrieval error:", error.message);
    return { type: "none" };
  }
}
