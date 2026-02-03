/**
 * Example 09 - Options Data
 *
 * This example demonstrates how to access options market data through
 * the Alpaca SDK. Options are derivatives contracts that give the holder
 * the right to buy (call) or sell (put) an underlying asset at a specific
 * price (strike) before a specific date (expiration).
 *
 * We'll fetch option chains, latest quotes, and snapshots with Greeks.
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

  // The unified client gives us access to all APIs, including market data.
  // Options data is under alpaca.marketData.options.
  const alpaca = createAlpacaClient({ keyId, secretKey, paper: true })

  // ---------------------------------------------------------------------------
  // Step 2: Get the option chain for AAPL
  // ---------------------------------------------------------------------------
  // An option chain is the full list of available option contracts for a
  // given underlying symbol. It includes all strikes, expirations, and both
  // calls and puts. The chain endpoint returns snapshots for each contract,
  // which include the latest trade, latest quote, daily bars, and Greeks.
  //
  // The getChain() method maps to the /v1beta1/options/snapshots/{underlying_symbol}
  // endpoint. Without filters, it returns all available contracts — which
  // can be a LOT of data. In production, you should filter by expiration
  // date, strike price range, or contract type.
  console.log('=== Option Chain for AAPL ===')
  console.log()

  const chain = await alpaca.marketData.options.getChain('AAPL', {
    // You can optionally filter the chain. Without filters, all available
    // contracts are returned. Common filters include:
    // - feed: 'indicative' or 'opra'
    // - limit: maximum number of contracts to return
    // The default feed depends on your subscription level.
  })

  // The chain response contains a 'snapshots' object where keys are the
  // OCC option contract symbols and values are snapshot objects.
  const chainSnapshots = chain.snapshots ?? {}
  const contractSymbols = Object.keys(chainSnapshots)

  console.log(`Found ${contractSymbols.length} option contracts for AAPL`)
  console.log()

  // Display the first 10 contracts from the chain as a sample.
  // Each contract symbol follows the OCC format: AAPL250117C00150000
  // which encodes the underlying, expiration, type (C/P), and strike.
  console.log('First 10 contracts:')
  console.log('-'.repeat(80))

  // We'll parse the OCC symbol to extract human-readable details.
  // OCC format: [Underlying 6 chars][YYMMDD][C/P][Strike * 1000, 8 digits]
  const sampleContracts = contractSymbols.slice(0, 10)

  for (const symbol of sampleContracts) {
    // Parse the OCC option symbol to extract its components.
    // The underlying symbol is everything before the date portion.
    // We need to find where the date starts — it's 15 characters from the end.
    const suffix = symbol.slice(-15) // e.g., '250117C00150000'
    const expDate = suffix.slice(0, 6) // e.g., '250117' (YYMMDD)
    const optType = suffix.slice(6, 7) // e.g., 'C' (Call) or 'P' (Put)
    const strikeRaw = suffix.slice(7) // e.g., '00150000'
    const strike = parseInt(strikeRaw) / 1000 // Convert to dollars

    // Format the expiration date for readability
    const expFormatted = `20${expDate.slice(0, 2)}-${expDate.slice(2, 4)}-${expDate.slice(4, 6)}`

    // Get the snapshot data for this contract to show market data
    const snapshot = chainSnapshots[symbol]
    const lastPrice = snapshot?.latestTrade?.p ?? 'N/A'

    console.log(
      `  ${symbol.padEnd(22)} | ` +
        `${optType === 'C' ? 'Call' : 'Put '.padEnd(4)} | ` +
        `Strike: $${strike.toFixed(2).padStart(8)} | ` +
        `Exp: ${expFormatted} | ` +
        `Last: ${typeof lastPrice === 'number' ? '$' + lastPrice.toFixed(2) : lastPrice}`
    )
  }

  console.log()

  // ---------------------------------------------------------------------------
  // Step 3: Get latest option quotes for specific contracts
  // ---------------------------------------------------------------------------
  // If you already know which contracts you're interested in, you can fetch
  // their latest quotes directly without loading the entire chain. This is
  // much more efficient when you only need data for a few contracts.
  //
  // Latest quotes give you the current best bid and ask prices, which is
  // essential for calculating the spread and fair value of an option.

  // Use the first few contracts from the chain as our sample
  if (sampleContracts.length >= 2) {
    const quotesSymbols = sampleContracts.slice(0, 3)

    console.log('=== Latest Option Quotes ===')
    console.log()
    console.log(`Fetching quotes for: ${quotesSymbols.join(', ')}`)
    console.log()

    const quotesResult = await alpaca.marketData.options.getLatestQuotes({
      // The symbols parameter accepts a comma-separated string of OCC symbols
      symbols: quotesSymbols.join(','),
    })

    // The response contains a 'quotes' object with contract symbols as keys
    const quotes = quotesResult.quotes ?? {}

    for (const [symbol, quote] of Object.entries(quotes)) {
      if (!quote) continue

      // The bid-ask spread is the difference between the lowest ask price
      // and the highest bid price. A tight spread indicates high liquidity.
      // A wide spread means it may be expensive to trade this contract.
      const spread = quote.ap - quote.bp

      console.log(`  ${symbol}:`)
      console.log(`    Bid:    $${quote.bp.toFixed(2)} x ${quote.bs}`) // Best bid price x size
      console.log(`    Ask:    $${quote.ap.toFixed(2)} x ${quote.as}`) // Best ask price x size
      console.log(`    Spread: $${spread.toFixed(2)}`)
      console.log(`    Time:   ${quote.t}`)
      console.log()
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4: Get option snapshots with Greeks
  // ---------------------------------------------------------------------------
  // Snapshots provide a comprehensive point-in-time view of an option contract.
  // They include the latest trade, latest quote, daily and minute bars, the
  // previous daily bar, and most importantly — the **Greeks**.
  //
  // The Greeks measure different aspects of option price sensitivity:
  // - Delta: How much the option price changes per $1 change in underlying
  // - Gamma: How much delta changes per $1 change in underlying
  // - Theta: How much the option loses per day from time decay
  // - Vega:  How much the option price changes per 1% change in volatility
  // - Rho:   How much the option price changes per 1% change in interest rates

  if (sampleContracts.length >= 1) {
    const snapshotSymbols = sampleContracts.slice(0, 3)

    console.log('=== Option Snapshots (with Greeks) ===')
    console.log()

    const snapshotsResult = await alpaca.marketData.options.getSnapshots({
      // Fetch snapshots for our sample contracts
      symbols: snapshotSymbols.join(','),
    })

    const snapshots = snapshotsResult.snapshots ?? {}

    for (const [symbol, snapshot] of Object.entries(snapshots)) {
      if (!snapshot) continue

      console.log(`  ${symbol}:`)

      // Latest trade information — the most recent executed trade for
      // this contract. Shows the actual market price.
      if (snapshot.latestTrade) {
        console.log(
          `    Last Trade:  $${snapshot.latestTrade.p.toFixed(2)} ` +
            `(${snapshot.latestTrade.s} contracts)`
        )
      }

      // Latest quote — current bid/ask. This tells you what the market
      // is currently willing to buy and sell at.
      if (snapshot.latestQuote) {
        console.log(
          `    Bid:         $${snapshot.latestQuote.bp.toFixed(2)} x ${snapshot.latestQuote.bs}`
        )
        console.log(
          `    Ask:         $${snapshot.latestQuote.ap.toFixed(2)} x ${snapshot.latestQuote.as}`
        )
      }

      // Daily bar — OHLCV data for the current trading day.
      // Useful for seeing the day's price range and volume.
      if (snapshot.dailyBar) {
        console.log(
          `    Daily O/H/L/C: $${snapshot.dailyBar.o.toFixed(2)} / ` +
            `$${snapshot.dailyBar.h.toFixed(2)} / ` +
            `$${snapshot.dailyBar.l.toFixed(2)} / ` +
            `$${snapshot.dailyBar.c.toFixed(2)}`
        )
        console.log(`    Volume:      ${snapshot.dailyBar.v}`)
      }

      // Implied volatility — calculated using the Black-Scholes model.
      // Higher IV means the market expects more price movement in the
      // underlying asset, making options more expensive.
      if (snapshot.impliedVolatility !== undefined) {
        console.log(`    Implied Vol: ${(snapshot.impliedVolatility * 100).toFixed(2)}%`)
      }

      // Greeks — option price sensitivities calculated using Black-Scholes.
      // These are essential for understanding option risk and behavior.
      if (snapshot.greeks) {
        console.log(`    Greeks:`)
        console.log(`      Delta: ${snapshot.greeks.delta.toFixed(4)}`) // Price sensitivity
        console.log(`      Gamma: ${snapshot.greeks.gamma.toFixed(4)}`) // Delta sensitivity
        console.log(`      Theta: ${snapshot.greeks.theta.toFixed(4)}`) // Time decay per day
        console.log(`      Vega:  ${snapshot.greeks.vega.toFixed(4)}`) // Volatility sensitivity
        console.log(`      Rho:   ${snapshot.greeks.rho.toFixed(4)}`) // Interest rate sensitivity
      }

      console.log()
    }
  }

  console.log('Options data demonstration complete!')
}

main().catch(console.error)
