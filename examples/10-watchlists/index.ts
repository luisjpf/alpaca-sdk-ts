/**
 * Example 10 - Watchlists
 *
 * This example demonstrates full CRUD (Create, Read, Update, Delete) operations
 * on Alpaca watchlists. Watchlists are named collections of stock symbols that
 * help you organize and track groups of assets you're interested in.
 *
 * We'll create a watchlist, modify it, and then clean up after ourselves.
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

  // The unified client gives us access to all APIs. Watchlists are part
  // of the Trading API, so they're under alpaca.trading.watchlists.
  const alpaca = createAlpacaClient({ keyId, secretKey, paper: true })

  // ---------------------------------------------------------------------------
  // Step 2: Create a new watchlist with initial symbols
  // ---------------------------------------------------------------------------
  // Watchlists need a unique name and can optionally include initial symbols.
  // Names can be up to 256 characters. Symbols must be valid US equity tickers.
  //
  // Use case: You might create watchlists like "Earnings This Week",
  // "High Momentum", or "Dividend Portfolio" to organize your research.
  console.log('=== Creating a New Watchlist ===')
  console.log()

  const watchlist = await alpaca.trading.watchlists.create({
    // The name must be unique across your account. If a watchlist with
    // this name already exists, the API will return an error.
    name: 'My Tech Stocks',
    // Initial symbols to include. These must be valid, tradeable US equity
    // symbols. Invalid symbols will cause the request to fail.
    symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
  })

  // The response includes the full watchlist object with an auto-generated
  // UUID that we'll need for all subsequent operations on this watchlist.
  console.log(`Created watchlist: "${watchlist.name}"`)
  console.log(`  ID:      ${watchlist.id}`)
  console.log(`  Symbols: ${(watchlist.assets ?? []).map((a) => a.symbol).join(', ')}`)
  console.log()

  // Store the watchlist ID — we'll need it for all operations below.
  // Alpaca uses UUIDs to identify watchlists, not names.
  const watchlistId = watchlist.id

  // ---------------------------------------------------------------------------
  // Step 3: List all watchlists
  // ---------------------------------------------------------------------------
  // This returns all watchlists in your account, including the one we just
  // created. Each watchlist in the list includes its name, ID, and the
  // count of symbols (but not the full asset details — use get() for that).
  console.log('=== Listing All Watchlists ===')
  console.log()

  const allWatchlists = await alpaca.trading.watchlists.list()

  console.log(`You have ${allWatchlists.length} watchlist(s):`)
  for (const wl of allWatchlists) {
    // The list endpoint returns watchlists WITHOUT the assets array for
    // efficiency. To get the full asset list, use get() with the watchlist ID.
    // Here we just show the name and ID.
    console.log(`  - "${wl.name}" [ID: ${wl.id}]`)
  }
  console.log()

  // ---------------------------------------------------------------------------
  // Step 4: Get the watchlist by ID to see full details
  // ---------------------------------------------------------------------------
  // The get() method returns the complete watchlist including all asset
  // details. This is more expensive than list() but gives you full info
  // about each symbol in the watchlist (name, exchange, class, etc.).
  console.log('=== Getting Watchlist Details ===')
  console.log()

  const fetchedWatchlist = await alpaca.trading.watchlists.get(watchlistId)

  console.log(`Watchlist: "${fetchedWatchlist.name}"`)
  console.log(`  ID:         ${fetchedWatchlist.id}`)
  console.log(`  Created:    ${fetchedWatchlist.created_at}`)
  console.log(`  Updated:    ${fetchedWatchlist.updated_at}`)
  console.log(`  Symbols:`)

  // The assets array contains full asset objects, not just symbol strings.
  // This gives you detailed info about each asset in the watchlist.
  for (const asset of fetchedWatchlist.assets ?? []) {
    console.log(`    - ${asset.symbol?.padEnd(6)} (${asset.name}) [${asset.exchange}]`)
  }
  console.log()

  // ---------------------------------------------------------------------------
  // Step 5: Add a new symbol to the watchlist
  // ---------------------------------------------------------------------------
  // You can add symbols one at a time using addSymbol(). This is useful
  // when a user wants to add a stock to their watchlist from a search
  // result or stock detail page.
  //
  // If the symbol already exists in the watchlist, the API will return
  // the watchlist unchanged (no duplicate entries).
  console.log('=== Adding a Symbol ===')
  console.log()

  // Add META (Meta Platforms) to our tech stocks watchlist
  const updatedAfterAdd = await alpaca.trading.watchlists.addSymbol(watchlistId, 'META')

  console.log(`Added META to "${updatedAfterAdd.name}"`)
  console.log(`  Symbols now: ${(updatedAfterAdd.assets ?? []).map((a) => a.symbol).join(', ')}`)
  console.log()

  // ---------------------------------------------------------------------------
  // Step 6: Remove a symbol from the watchlist
  // ---------------------------------------------------------------------------
  // removeSymbol() removes a single symbol from the watchlist. The symbol
  // must exist in the watchlist, otherwise you'll get a not-found error.
  //
  // This is useful for "unwatch" buttons in a trading UI where users
  // can remove stocks they're no longer interested in tracking.
  console.log('=== Removing a Symbol ===')
  console.log()

  // Remove AMZN from the watchlist
  const updatedAfterRemove = await alpaca.trading.watchlists.removeSymbol(watchlistId, 'AMZN')

  console.log(`Removed AMZN from "${updatedAfterRemove.name}"`)
  console.log(`  Symbols now: ${(updatedAfterRemove.assets ?? []).map((a) => a.symbol).join(', ')}`)
  console.log()

  // ---------------------------------------------------------------------------
  // Step 7: Delete the watchlist (cleanup)
  // ---------------------------------------------------------------------------
  // delete() permanently removes the watchlist. This is irreversible —
  // there's no trash or undo. The watchlist ID becomes invalid after deletion.
  //
  // In this example we clean up after ourselves so running the example
  // multiple times doesn't create duplicate watchlists.
  console.log('=== Deleting the Watchlist (Cleanup) ===')
  console.log()

  await alpaca.trading.watchlists.delete(watchlistId)

  console.log(`Deleted watchlist "${watchlist.name}" (ID: ${watchlistId})`)
  console.log()

  // Verify deletion by listing all watchlists again
  const remaining = await alpaca.trading.watchlists.list()
  console.log(`Remaining watchlists: ${remaining.length}`)

  console.log()
  console.log('Watchlist CRUD demonstration complete!')
}

main().catch(console.error)
