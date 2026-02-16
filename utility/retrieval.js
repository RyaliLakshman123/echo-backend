const GNEWS_URL = "https://gnews.io/api/v4/search";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const FINNHUB_URL = "https://finnhub.io/api/v1/quote"; // FREE Stock API
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
        .replace(/when|will|be|released|movie|film|release|date|about|the|tell|me|it|is/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (lower.includes("doom's day") || lower.includes("doomsday")) {
        movieName = "doomsday";
      } else if (lower.includes("doom")) {
        movieName = "doom";
      }

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
    // 📈 STOCKS (Using Finnhub - FREE!)
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

      const price = data.c; // Current price
      const change = data.d; // Change
      const changePercent = data.dp; // Change percent
      const high = data.h; // High
      const low = data.l; // Low
      const open = data.o; // Open
      const prevClose = data.pc; // Previous close

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
    // ₿ CRYPTO (CoinGecko - FREE!)
    // =========================
    if (containsAny(lower, ["bitcoin", "btc", "ethereum", "eth", "crypto", "cryptocurrency"])) {

      console.log("₿ CRYPTO DETECTION TRIGGERED!");

      const res = await fetch(
        `${COINGECKO_URL}?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      console.log("₿ CoinGecko response status:", res.status);

      if (!res.ok) {
        console.log("❌ CoinGecko API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();
      
      console.log("₿ CoinGecko Response:", JSON.stringify(data, null, 2));

      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;

      if (!btc && !eth) {
        console.log("❌ No crypto price found");
        return { type: "none" };
      }

      console.log("✅ Crypto prices - BTC:", btc, "ETH:", eth);

      let content = "₿ **Live Cryptocurrency Prices**\n\n";
      
      if (btc) {
        content += `🟠 **Bitcoin (BTC)**\n`;
        content += `💰 Price: $${btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
      }
      
      if (eth) {
        content += `🔷 **Ethereum (ETH)**\n`;
        content += `💰 Price: $${eth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n`;
      }
      
      content += `⏰ Last Updated: ${new Date().toLocaleString()}\n\n*Data from CoinGecko (Real-time)*`;

      return {
        type: "direct",
        content
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
