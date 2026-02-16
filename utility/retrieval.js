const GNEWS_URL = "https://gnews.io/api/v4/search";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const YAHOO_FINANCE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";

function containsAny(text, words) {
  return words.some(word => text.toLowerCase().includes(word.toLowerCase()));
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
    if (containsAny(lower, ["stock", "share", "price", "ticker"])) {

      console.log("📈 Stock detection triggered");

      let symbol = null;

      // Try to find ticker symbol (2-5 uppercase letters)
      const tickerMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) symbol = tickerMatch[0];

      // Company name mapping
      const companyMap = {
        apple: "AAPL",
        tesla: "TSLA",
        microsoft: "MSFT",
        nvidia: "NVDA",
        google: "GOOGL",
        amazon: "AMZN",
        meta: "META",
        netflix: "NFLX",
        facebook: "META",
        alphabet: "GOOGL"
      };

      // Try to find company name if no ticker found
      if (!symbol) {
        for (const [name, ticker] of Object.entries(companyMap)) {
          if (lower.includes(name)) {
            symbol = ticker;
            break;
          }
        }
      }

      if (!symbol) {
        console.log("❌ No stock symbol detected");
        return { type: "none" };
      }

      console.log("📊 Fetching stock for:", symbol);

      // FIXED: Proper fetch syntax with parentheses
      const res = await fetch(`${YAHOO_FINANCE_URL}?symbols=${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!res.ok) {
        console.log("❌ Yahoo Finance API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();

      console.log("📊 Yahoo response:", JSON.stringify(data, null, 2));

      const quote = data?.quoteResponse?.result?.[0];
      const price = quote?.regularMarketPrice;
      const change = quote?.regularMarketChange;
      const changePercent = quote?.regularMarketChangePercent;

      if (!price) {
        console.log("❌ No price found in response");
        return { type: "none" };
      }

      const changeSymbol = change >= 0 ? "+" : "";
      
      return {
        type: "direct",
        content: `📈 **${symbol} Stock Price**
Current: $${price.toFixed(2)}
Change: ${changeSymbol}$${change?.toFixed(2)} (${changeSymbol}${changePercent?.toFixed(2)}%)
Updated: ${new Date().toLocaleString()}`
      };
    }

    // =========================
    // ₿ CRYPTO
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto", "cryptocurrency"])) {

      console.log("₿ Crypto detection triggered");

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd`
      );

      if (!res.ok) {
        console.log("❌ CoinGecko API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();

      console.log("₿ CoinGecko response:", JSON.stringify(data, null, 2));

      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;

      if (!btc && !eth) {
        console.log("❌ No crypto price found");
        return { type: "none" };
      }

      let content = "₿ **Live Crypto Prices**\n";
      if (btc) content += `Bitcoin (BTC): $${btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (eth) content += `Ethereum (ETH): $${eth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      content += `Updated: ${new Date().toLocaleString()}`;

      return {
        type: "direct",
        content
      };
    }

    // =========================
    // 📰 NEWS
    // =========================
    if (containsAny(lower, ["news", "latest", "today", "headlines", "recent"])) {

      console.log("📰 News detection triggered");

      if (!process.env.GNEWS_API_KEY) {
        console.log("❌ GNEWS_API_KEY not configured");
        return { type: "none" };
      }

      // Extract search query - use original message but clean it up
      let searchQuery = lastMessage
        .replace(/news|latest|today|headlines|recent|about|on/gi, '')
        .trim();
      
      // If query is too short, use a default
      if (searchQuery.length < 3) {
        searchQuery = "technology";
      }

      console.log("📰 Searching for:", searchQuery);

      const res = await fetch(
        `${GNEWS_URL}?q=${encodeURIComponent(searchQuery)}&lang=en&max=5&apikey=${process.env.GNEWS_API_KEY}`
      );

      if (!res.ok) {
        console.log("❌ GNews API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();

      console.log("📰 GNews response:", JSON.stringify(data, null, 2));

      if (!data.articles || data.articles.length === 0) {
        console.log("❌ No articles found");
        return { type: "none" };
      }

      const formatted = data.articles.map((a, i) =>
        `**${i + 1}. ${a.title}**
Source: ${a.source.name}
Published: ${new Date(a.publishedAt).toLocaleDateString()}
${a.description || ''}`
      ).join("\n\n");

      return {
        type: "inject",
        content: `📰 **Latest News Results**\n\n${formatted}\n\n---\n*Retrieved: ${new Date().toLocaleString()}*`
      };
    }

    return { type: "none" };

  } catch (error) {
    console.error("🔥 Retrieval error:", error.message);
    console.error("🔥 Stack trace:", error.stack);
    return { type: "none" };
  }
}
