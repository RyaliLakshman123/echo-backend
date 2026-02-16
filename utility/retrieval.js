const GNEWS_URL = "https://gnews.io/api/v4/search";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const COINGECKO_STOCK_URL = "https://api.coingecko.com/api/v3/simple/price"; // ✅ REPLACED FINNHUB
const TMDB_URL = "https://api.themoviedb.org/3/search/movie";

function containsAny(text, words) {
  return words.some(word => text.toLowerCase().includes(word.toLowerCase()));
}

export async function getLiveContextIfNeeded(messages) {
  const lastMessage = messages[messages.length - 1]?.content;
  if (!lastMessage) return { type: "none" };

  const lower = lastMessage.toLowerCase();

  console.log("🔍 ========================================");
  console.log("🔍 RETRIEVAL FUNCTION CALLED!");
  console.log("🔍 User message:", lastMessage);
  console.log("🔍 ========================================");

  try {

    // =========================
    // 🎬 MOVIES (UNCHANGED)
    // =========================
    if (containsAny(lower, ["movie", "film", "release", "doom", "doomsday", "marvel", "trailer", "cinema", "frankenstein"])) {

      // ... MOVIE CODE UNCHANGED ...
    }

    // =========================
    // 📈 STOCKS (NOW USING COINGECKO)
    // =========================
    if (containsAny(lower, ["stock", "share", "price", "ticker", "aapl", "tsla", "apple", "tesla", "microsoft", "nvidia", "google", "amazon", "meta", "msft", "nvda", "googl", "amzn", "nflx", "netflix"])) {

      console.log("📈 STOCK DETECTION TRIGGERED!");

      let symbol = null;

      const tickerMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) {
        symbol = tickerMatch[0];
        console.log("📈 Found ticker:", symbol);
      }

      const companyMap = {
        apple: "apple",
        tesla: "tesla",
        microsoft: "microsoft",
        nvidia: "nvidia",
        google: "google",
        amazon: "amazon",
        meta: "meta-platforms",
        netflix: "netflix"
      };

      if (!symbol) {
        for (const [name, cgId] of Object.entries(companyMap)) {
          if (lower.includes(name)) {
            symbol = cgId;
            console.log("📈 Found CoinGecko ID:", cgId);
            break;
          }
        }
      }

      if (!symbol) {
        console.log("❌ No stock symbol detected");
        return { type: "none" };
      }

      console.log("📊 Fetching stock for (CoinGecko):", symbol);

      const res = await fetch(
        `${COINGECKO_STOCK_URL}?ids=${symbol}&vs_currencies=usd&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`
      );

      console.log("📊 CoinGecko Stock response status:", res.status);

      if (!res.ok) {
        console.log("❌ CoinGecko API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();
      
      console.log("📊 CoinGecko Stock Response:", JSON.stringify(data, null, 2));

      const price = data?.[symbol]?.usd;

      if (!price) {
        console.log("❌ No stock price found in response");
        return { type: "none" };
      }

      console.log("✅ Stock price found:", price);

      return {
        type: "direct",
        content: `📈 **${symbol.toUpperCase()} Live Stock Price**

💰 Current Price: $${price.toLocaleString()}

⏰ Last Updated: ${new Date().toLocaleString()}

*Data from CoinGecko*`
      };
    }

    // =========================
    // ₿ CRYPTO (UNCHANGED AS REQUESTED)
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto", "cryptocurrency"])) {

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}`
      );

      if (!res.ok) return { type: "none" };

      const data = await res.json();

      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;

      if (!btc && !eth) return { type: "none" };

      let content = "₿ **Live Cryptocurrency Prices**\n\n";

      if (btc) {
        content += `🟠 Bitcoin (BTC)\n💰 Price: $${btc.toLocaleString()}\n\n`;
      }

      if (eth) {
        content += `🔷 Ethereum (ETH)\n💰 Price: $${eth.toLocaleString()}\n\n`;
      }

      content += `⏰ Last Updated: ${new Date().toLocaleString()}\n\n*Data from CoinGecko*`;

      return { type: "direct", content };
    }

    // =========================
    // 📰 NEWS (UNCHANGED)
    // =========================
    if (containsAny(lower, ["news", "latest", "today", "headlines", "recent"])) {

      // ... NEWS CODE UNCHANGED ...
    }

    console.log("ℹ️ No retrieval triggers matched");
    return { type: "none" };

  } catch (error) {
    console.error("🔥 RETRIEVAL ERROR:", error.message);
    return { type: "none" };
  }
}
