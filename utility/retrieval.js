const GNEWS_URL = "https://gnews.io/api/v4/search";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets";
const FINNHUB_URL = "https://finnhub.io/api/v1/quote";
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
    // 🎬 MOVIES
    // =========================
    if (containsAny(lower, ["movie", "film", "release", "doom", "doomsday", "marvel", "trailer", "cinema", "frankenstein"])) {

      console.log("🎬 MOVIE DETECTION TRIGGERED!");

      let movieName = lastMessage
 	 .replace(/when|will|be|released|movie|film|release|date|about|tell|me|is|the/gi, '')
 	 .replace(/[^\w\s:]/g, '')   // keep colon for titles like Avengers: Doomsday
 	 .replace(/\s+/g, ' ')
 	 .trim();


      if (!movieName || movieName.length < 2) {
        console.log("❌ No movie name detected");
        return { type: "none" };
      }

      const tmdbApiKey = process.env.TMDB_API_KEY;

      if (!tmdbApiKey) {
        console.log("❌ TMDB_API_KEY not configured");
        return { type: "none" };
      }

      const res = await fetch(
        `${TMDB_URL}?api_key=${tmdbApiKey}&query=${encodeURIComponent(movieName)}&include_adult=false`
      );

      if (!res.ok) {
        console.log("❌ TMDB API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        return {
          type: "direct",
          content: `🎬 No movie found matching "${movieName}". Try being more specific.`
        };
      }

      const movies = data.results.slice(0, 3).map(movie => {
        const releaseDate = movie.release_date 
          ? new Date(movie.release_date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : "Release date not announced";
        
        const status = movie.release_date 
          ? new Date(movie.release_date) > new Date() 
            ? "📅 Upcoming" 
            : "✅ Released"
          : "⏳ TBA";

        return `**${movie.title}** (${movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'})
${status}: ${releaseDate}
⭐ Rating: ${movie.vote_average}/10
📝 ${movie.overview || 'No description available'}`;
      }).join("\n\n---\n\n");

      return {
        type: "direct",
        content: `🎬 **Movie Search Results for "${movieName}"**

${movies}

⏰ Last Updated: ${new Date().toLocaleString()}
*Data from The Movie Database (TMDB)*`
      };
    }

    // =========================
    // 📈 STOCKS
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
        apple: "AAPL",
        tesla: "TSLA",
        microsoft: "MSFT",
        msft: "MSFT",
        nvidia: "NVDA",
        nvda: "NVDA",
        google: "GOOGL",
        alphabet: "GOOGL",
        googl: "GOOGL",
        amazon: "AMZN",
        amzn: "AMZN",
        meta: "META",
        facebook: "META",
        netflix: "NFLX",
        nflx: "NFLX"
      };

      if (!symbol) {
        for (const [name, ticker] of Object.entries(companyMap)) {
          if (lower.includes(name)) {
            symbol = ticker;
            console.log("📈 Found ticker from name:", ticker);
            break;
          }
        }
      }

      if (!symbol) {
        console.log("❌ No stock symbol detected");
        return { type: "none" };
      }

      const finnhubApiKey = process.env.FINNHUB_API_KEY;

      if (!finnhubApiKey) {
        console.log("❌ FINNHUB_API_KEY not configured");
        return { type: "none" };
      }

      console.log("📊 Fetching stock for:", symbol);

      const res = await fetch(`${FINNHUB_URL}?symbol=${symbol}&token=${finnhubApiKey}`);
      
      console.log("📊 Finnhub response status:", res.status);

      if (!res.ok) {
        console.log("❌ Finnhub API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();
      
      console.log("📊 Finnhub Response:", JSON.stringify(data, null, 2));

      const price = data.c;
      const change = data.d;
      const changePercent = data.dp;
      const high = data.h;
      const low = data.l;
      const open = data.o;
      const prevClose = data.pc;

      if (!price || price === 0) {
        console.log("❌ No price found in response");
        return { type: "none" };
      }

      console.log("✅ Stock price found:", price);

      const changeSymbol = change >= 0 ? "+" : "";
      const changeEmoji = change >= 0 ? "📈" : "📉";
      
      return {
        type: "direct",
        content: `${changeEmoji} **${symbol} Live Stock Price**

💰 **Current Price: $${price.toFixed(2)}**
${changeEmoji} Change: ${changeSymbol}$${change?.toFixed(2)} (${changeSymbol}${changePercent?.toFixed(2)}%)

📊 **Today's Stats:**
- Open: $${open?.toFixed(2)}
- High: $${high?.toFixed(2)}
- Low: $${low?.toFixed(2)}
- Previous Close: $${prevClose?.toFixed(2)}

⏰ Last Updated: ${new Date().toLocaleString()}

*Data from Finnhub (Real-time)*`
      };
    }

    // =========================
    // ₿ CRYPTO (Enhanced with detailed stats)
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto", "cryptocurrency"])) {

      console.log("₿ CRYPTO DETECTION TRIGGERED!");

      // Determine which coins to fetch
      const coins = [];
      if (lower.includes("bitcoin") || lower.includes("btc")) {
        coins.push("bitcoin");
      }
      if (lower.includes("ethereum") || lower.includes("eth")) {
        coins.push("ethereum");
      }
      // If neither specified, show both
      if (coins.length === 0) {
        coins.push("bitcoin", "ethereum");
      }

      const coinsParam = coins.join(",");

      const res = await fetch(
        `${COINGECKO_URL}?vs_currency=usd&ids=${coinsParam}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
      );

      console.log("₿ CoinGecko response status:", res.status);

      if (!res.ok) {
        console.log("❌ CoinGecko API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();
      
      console.log("₿ CoinGecko Response:", JSON.stringify(data, null, 2));

      if (!data || data.length === 0) {
        console.log("❌ No crypto data found");
        return { type: "none" };
      }

      console.log("✅ Crypto data found for", data.length, "coins");

      const cryptoDetails = data.map(coin => {
        const changeEmoji = coin.price_change_percentage_24h >= 0 ? "📈" : "📉";
        const changeSymbol = coin.price_change_percentage_24h >= 0 ? "+" : "";
        
        return `${changeEmoji} **${coin.name} (${coin.symbol.toUpperCase()}) Live Price**

💰 **Current Price: $${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**
${changeEmoji} 24h Change: ${changeSymbol}${coin.price_change_24h?.toFixed(2)} (${changeSymbol}${coin.price_change_percentage_24h?.toFixed(2)}%)

📊 **24h Stats:**
- High: $${coin.high_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Low: $${coin.low_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Market Cap: $${(coin.market_cap / 1e9).toFixed(2)}B
- Volume: $${(coin.total_volume / 1e9).toFixed(2)}B
- Rank: #${coin.market_cap_rank}`;
      }).join("\n\n---\n\n");

      return {
        type: "direct",
        content: `₿ **Live Cryptocurrency Prices**

${cryptoDetails}

⏰ Last Updated: ${new Date().toLocaleString()}

*Data from CoinGecko (Real-time)*`
      };
    }

    // =========================
    // 📰 NEWS
    // =========================
    if (containsAny(lower, ["news", "latest", "today", "headlines", "recent"])) {

      console.log("📰 NEWS DETECTION TRIGGERED!");

      if (!process.env.GNEWS_API_KEY) {
        console.log("❌ GNEWS_API_KEY not configured");
        return { type: "none" };
      }

      let searchQuery = lastMessage
        .replace(/news|latest|today|headlines|recent|about|on|what|are|the|give|me|show/gi, '')
        .trim();
      
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

      if (!data.articles || data.articles.length === 0) {
        console.log("❌ No articles found");
        return { type: "none" };
      }

      const formatted = data.articles.map((a, i) =>
        `**${i + 1}. ${a.title}**
📰 Source: ${a.source.name}
📅 Published: ${new Date(a.publishedAt).toLocaleDateString()}
📝 ${a.description || 'No description available'}`
      ).join("\n\n");

      return {
        type: "inject",
        content: `📰 LIVE NEWS RESULTS FOR "${searchQuery.toUpperCase()}"

${formatted}

⏰ Retrieved: ${new Date().toLocaleString()}
*Data from GNews API*`
      };
    }

    console.log("ℹ️ No retrieval triggers matched");
    return { type: "none" };

  } catch (error) {
    console.error("🔥 RETRIEVAL ERROR:", error.message);
    console.error("🔥 Stack:", error.stack);
    return { type: "none" };
  }
}
