/**
 * Example 11 - News and Screener
 *
 * This example demonstrates three Market Data API features:
 *
 * 1. News — Get financial news articles filtered by symbol
 * 2. Most Actives — Discover the most traded stocks right now
 * 3. Market Movers — Find today's top gainers and losers
 *
 * These endpoints are commonly used to build trading dashboards,
 * news feeds, and market summary widgets.
 */

import { createAlpacaClient } from '@luisjpf/alpaca-sdk'

async function main() {
  // ---------------------------------------------------------------------------
  // Step 1: Create the Alpaca client
  // ---------------------------------------------------------------------------
  const keyId = process.env.ALPACA_KEY_ID
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!keyId || !secretKey) {
    console.error('Please set ALPACA_KEY_ID and ALPACA_SECRET_KEY environment variables')
    process.exit(1)
  }

  // The unified client gives us access to all APIs. News and screener data
  // are under alpaca.marketData.news and alpaca.marketData.screener.
  const alpaca = createAlpacaClient({ keyId, secretKey, paper: true })

  // ---------------------------------------------------------------------------
  // Step 2: Get latest news for AAPL
  // ---------------------------------------------------------------------------
  // The News API aggregates financial news from multiple sources (primarily
  // Benzinga). You can filter by symbols to get news relevant to specific
  // stocks. This is essential for staying informed about companies you're
  // trading or watching.
  //
  // The news endpoint supports pagination via next_page_token, so you can
  // fetch large amounts of historical news by making successive requests.
  console.log('=== Latest AAPL News ===')
  console.log()

  const newsResponse = await alpaca.marketData.news.get({
    // Filter to only show news that mentions AAPL. You can specify multiple
    // symbols as a comma-separated string (e.g., 'AAPL,TSLA,MSFT').
    // Without this filter, you get news for all symbols.
    symbols: 'AAPL',
    // Limit the number of articles returned. The maximum per request is 50.
    // For this demo, we'll fetch just 5 recent articles.
    limit: 5,
    // Articles are sorted newest-first by default, which is what we want
    // for a "latest news" feed.
  })

  // The response contains a 'news' array of article objects.
  // Each article has: id, headline, author, source, created_at, updated_at,
  // summary, content, url, images, and symbols.
  const articles = newsResponse.news ?? []

  console.log(`Found ${articles.length} recent articles for AAPL:`)
  console.log()

  for (const article of articles) {
    // Print the headline — the most important piece of news information.
    // Headlines are usually concise enough to display in a dashboard.
    console.log(`  "${article.headline}"`)

    // Author and source tell you who wrote the article and where it
    // was originally published. Source is typically "Benzinga" for
    // Alpaca's news feed.
    console.log(`    Author:  ${article.author}`)
    console.log(`    Source:  ${article.source}`)

    // The created_at timestamp tells you when the article was first
    // published. This is important for time-sensitive trading decisions.
    console.log(`    Date:    ${article.created_at}`)

    // The summary is a brief overview of the article content, often
    // the first sentence or two. It's useful for quick scanning.
    // We truncate it to 120 characters for display purposes.
    const truncatedSummary =
      article.summary.length > 120 ? article.summary.slice(0, 120) + '...' : article.summary
    console.log(`    Summary: ${truncatedSummary}`)

    // Related symbols — other stocks mentioned in the article.
    // Useful for discovering related trading opportunities.
    console.log(`    Symbols: ${article.symbols.join(', ')}`)

    console.log()
  }

  // ---------------------------------------------------------------------------
  // Step 3: Get the most active stocks
  // ---------------------------------------------------------------------------
  // The "Most Actives" screener returns stocks with the highest trading
  // volume or trade count for the current day. This is based on real-time
  // SIP (Securities Information Processor) data, so it reflects actual
  // market activity.
  //
  // This is the data behind the "Most Active" lists you see on financial
  // websites and trading platforms. High activity often signals news events,
  // earnings announcements, or unusual market interest.
  console.log('=== Most Active Stocks ===')
  console.log()

  const mostActives = await alpaca.marketData.screener.getMostActives({
    // By default, returns the top 10 most active stocks by volume.
    // You can adjust with 'top' parameter (e.g., top: 20 for top 20).
    // The 'by' parameter controls whether to rank by 'volume' or 'trades'.
  })

  // The response contains a most_actives array and a last_updated timestamp.
  // The last_updated timestamp tells you how recent the data is — it's
  // typically updated every few seconds during market hours.
  const actives = mostActives.most_actives ?? []

  console.log(`Top ${actives.length} most active stocks (updated: ${mostActives.last_updated}):`)
  console.log()
  console.log(`  ${'Symbol'.padEnd(8)} ${'Trade Count'.padStart(14)} ${'Volume'.padStart(16)}`)
  console.log(`  ${'-'.repeat(8)} ${'-'.repeat(14)} ${'-'.repeat(16)}`)

  for (const active of actives) {
    // Each entry shows the symbol, cumulative trade count, and
    // cumulative volume for the current trading day.
    // Trade count = number of individual trades executed.
    // Volume = total number of shares traded.
    console.log(
      `  ${active.symbol.padEnd(8)} ` +
        `${active.trade_count.toLocaleString().padStart(14)} ` +
        `${active.volume.toLocaleString().padStart(16)}`
    )
  }

  console.log()

  // ---------------------------------------------------------------------------
  // Step 4: Get market movers (top gainers and losers)
  // ---------------------------------------------------------------------------
  // Market movers show the stocks with the biggest price changes today,
  // split into gainers (price went up) and losers (price went down).
  //
  // This endpoint is useful for:
  // - Building "Top Gainers / Top Losers" dashboards
  // - Identifying momentum stocks for swing trading
  // - Screening for unusual price movement
  //
  // The first parameter specifies the market type: 'stocks' for equities
  // or 'crypto' for cryptocurrency markets.
  console.log('=== Market Movers (Stocks) ===')
  console.log()

  const movers = await alpaca.marketData.screener.getMovers('stocks', {
    // You can filter by top N results (default is 10 gainers + 10 losers).
    // Only tradable symbols on major exchanges are included.
    // The data uses split-adjusted prices.
  })

  // The response separates movers into two lists: gainers and losers.
  // Each mover includes symbol, price, change (absolute), and
  // percent_change (relative).

  // Display top gainers — stocks with the biggest positive price change
  const gainers = movers.gainers ?? []
  console.log(`Top ${gainers.length} Gainers (updated: ${movers.last_updated}):`)
  console.log()
  console.log(
    `  ${'Symbol'.padEnd(8)} ${'Price'.padStart(10)} ${'Change'.padStart(10)} ${'% Change'.padStart(10)}`
  )
  console.log(`  ${'-'.repeat(8)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(10)}`)

  for (const gainer of gainers) {
    // Positive change values indicate the stock price went up.
    // percent_change is the relative change as a decimal (e.g., 5.23 = +5.23%).
    console.log(
      `  ${gainer.symbol.padEnd(8)} ` +
        `${'$' + gainer.price.toFixed(2).padStart(9)} ` +
        `${'+$' + gainer.change.toFixed(2).padStart(8)} ` +
        `${'+' + gainer.percent_change.toFixed(2) + '%'.padStart(9)}`
    )
  }

  console.log()

  // Display top losers — stocks with the biggest negative price change
  const losers = movers.losers ?? []
  console.log(`Top ${losers.length} Losers:`)
  console.log()
  console.log(
    `  ${'Symbol'.padEnd(8)} ${'Price'.padStart(10)} ${'Change'.padStart(10)} ${'% Change'.padStart(10)}`
  )
  console.log(`  ${'-'.repeat(8)} ${'-'.repeat(10)} ${'-'.repeat(10)} ${'-'.repeat(10)}`)

  for (const loser of losers) {
    // Negative change values indicate the stock price went down.
    // The change and percent_change fields will naturally be negative.
    console.log(
      `  ${loser.symbol.padEnd(8)} ` +
        `${'$' + loser.price.toFixed(2).padStart(9)} ` +
        `${'$' + loser.change.toFixed(2).padStart(9)} ` +
        `${loser.percent_change.toFixed(2) + '%'.padStart(9)}`
    )
  }

  console.log()
  console.log('News and screener demonstration complete!')
}

main().catch(console.error)
