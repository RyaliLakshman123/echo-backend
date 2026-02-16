const GNEWS_URL = "https://gnews.io/api/v4/search";
const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";
const YAHOO_FINANCE_URL = "https://query1.finance.yahoo.com/v7/finance/quote";
const TMDB_URL = "https://api.themoviedb.org/3/search/movie";

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
    // 🎬 MOVIES
    // =========================
    if (containsAny(lower, ["movie", "film", "release", "doom", "doomsday", "marvel", "trailer", "cinema"])) {

      console.log("🎬 Movie detection triggered");

      // Extract movie name from query
      let movieName = lastMessage
        .replace(/when|will|be|released|movie|film|release|date|about|the/gi, '')
        .trim();

      // Handle specific cases
      if (lower.includes("doom") || lower.includes("doomsday")) {
        movieName = "doom";
      }

      if (!movieName || movieName.length < 2) {
        console.log("❌ No movie name detected");
        return { type: "none" };
      }

      console.log("🎬 Searching for movie:", movieName);

      // Using TMDB API (Free - just needs API key)
      // Get your free API key from: https://www.themoviedb.org/settings/api
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

      console.log("🎬 TMDB Response:", JSON.stringify(data, null, 2));

      if (!data.results || data.results.length === 0) {
        return {
          type: "direct",
          content: `🎬 No movie found matching "${movieName}". Try being more specific with the movie title.`
        };
      }

      // Get top 3 results
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
        content: `🎬 **Movie Search Results**

${movies}

⏰ Last Updated: ${new Date().toLocaleString()}
*Data provided by The Movie Database (TMDB)*`
      };
    }

    // =========================
    // 📈 STOCKS
    // =========================
    if (containsAny(lower, ["stock", "share", "price", "ticker", "aapl", "tsla", "apple", "tesla", "microsoft", "nvidia", "google", "amazon", "meta", "msft", "nvda", "googl", "amzn", "nflx", "netflix"])) {

      console.log("📈 Stock detection triggered");

      let symbol = null;

      const tickerMatch = lastMessage.match(/\b[A-Z]{2,5}\b/);
      if (tickerMatch) symbol = tickerMatch[0];

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
            break;
          }
        }
      }

      if (!symbol) {
        console.log("❌ No stock symbol detected");
        return { type: "none" };
      }

      console.log("📊 Fetching stock for:", symbol);

      const res = await fetch(`${YAHOO_FINANCE_URL}?symbols=${symbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!res.ok) {
        console.log("❌ Yahoo Finance API error:", res.status);
        return { type: "none" };
      }

      const data = await res.json();
      
      console.log("📊 Yahoo Finance Response:", JSON.stringify(data, null, 2));

      const quote = data?.quoteResponse?.result?.[0];
      const price = quote?.regularMarketPrice;
      const change = quote?.regularMarketChange;
      const changePercent = quote?.regularMarketChangePercent;

      if (!price) {
        console.log("❌ No price found in response");
        return { type: "none" };
      }

      const changeSymbol = change >= 0 ? "+" : "";
      const changeEmoji = change >= 0 ? "📈" : "📉";
      
      return {
        type: "direct",
        content: `${changeEmoji} **${symbol} Live Stock Price**

💰 Current Price: **$${price.toFixed(2)}**
${changeEmoji} Change: ${changeSymbol}$${change?.toFixed(2)} (${changeSymbol}${changePercent?.toFixed(2)}%)

⏰ Last Updated: ${new Date().toLocaleString()}

*Data provided by Yahoo Finance*`
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
      
      console.log("₿ CoinGecko Response:", JSON.stringify(data, null, 2));

      const btc = data?.bitcoin?.usd;
      const eth = data?.ethereum?.usd;

      if (!btc && !eth) {
        console.log("❌ No crypto price found");
        return { type: "none" };
      }

      let content = "₿ **Live Cryptocurrency Prices**\n\n";
      if (btc) content += `🟠 **Bitcoin (BTC)**: $${btc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (eth) content += `🔷 **Ethereum (ETH)**: $${eth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      content += `\n⏰ Last Updated: ${new Date().toLocaleString()}\n\n*Data provided by CoinGecko*`;

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
        const errorText = await res.text();
        console.log("❌ Error details:", errorText);
        return { type: "none" };
      }

      const data = await res.json();
      
      console.log("📰 GNews Response:", JSON.stringify(data, null, 2));

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
*Data provided by GNews API*`
      };
    }

    console.log("ℹ️ No retrieval triggers matched");
    return { type: "none" };

  } catch (error) {
    console.error("🔥 Retrieval error:", error.message);
    console.error("🔥 Stack trace:", error.stack);
    return { type: "none" };
  }
}
