/**
 * Example 12 - Broker API Basics
 *
 * The Broker API is designed for fintech applications that manage multiple
 * trading accounts on behalf of their end users. Unlike the Trading API
 * (which manages your own single account), the Broker API lets you create
 * sub-accounts, fund them, and trade on behalf of customers.
 *
 * IMPORTANT: The Broker API uses DIFFERENT credentials than the Trading API.
 * You need to sign up at https://broker-app.alpaca.markets and generate
 * Broker API keys from that dashboard.
 *
 * The SDK handles the authentication difference automatically:
 * - Trading API uses API key headers (APCA-API-KEY-ID / APCA-API-SECRET-KEY)
 * - Broker API uses HTTP Basic auth (base64-encoded key:secret)
 */

// We import createBrokerClient directly instead of using the unified
// createAlpacaClient. This is because broker applications typically use
// completely different credentials than trading applications, so they
// need a separate client instance.
import { createBrokerClient } from '@luisjpf/alpaca-sdk'

async function main() {
  // ---------------------------------------------------------------------------
  // Step 1: Read Broker API credentials from environment variables
  // ---------------------------------------------------------------------------
  // These are your BROKER API credentials, not your regular trading API keys.
  // Broker credentials are generated from https://broker-app.alpaca.markets.
  //
  // In this example, we use the same env var names for simplicity, but in
  // a real application you might use ALPACA_BROKER_KEY_ID and
  // ALPACA_BROKER_SECRET_KEY to distinguish them from trading keys.
  const keyId = process.env.ALPACA_KEY_ID
  const secretKey = process.env.ALPACA_SECRET_KEY

  if (!keyId || !secretKey) {
    console.error('Please set ALPACA_KEY_ID and ALPACA_SECRET_KEY environment variables')
    console.error(
      'These should be your BROKER API credentials from https://broker-app.alpaca.markets'
    )
    process.exit(1)
  }

  // ---------------------------------------------------------------------------
  // Step 2: Create the Broker API client
  // ---------------------------------------------------------------------------
  // createBrokerClient creates a client specifically for the Broker API.
  // Under the hood, it:
  // 1. Sets the base URL to broker-api.sandbox.alpaca.markets (for paper mode)
  // 2. Uses HTTP Basic authentication (base64-encoded key:secret) instead
  //    of API key headers used by the Trading API
  //
  // The paper: true flag routes to the sandbox environment. In production,
  // you would set paper: false to use the live Broker API.
  const broker = createBrokerClient({
    keyId,
    secretKey,
    paper: true, // Use sandbox environment (broker-api.sandbox.alpaca.markets)
  })

  // ---------------------------------------------------------------------------
  // Step 3: List all sub-accounts
  // ---------------------------------------------------------------------------
  // Sub-accounts represent your customers' brokerage accounts. As a broker,
  // you create and manage these accounts on behalf of your users. Each
  // sub-account has its own balance, positions, and order history.
  //
  // When your fintech app has a new user sign up, you would create a
  // sub-account for them through this API.
  console.log('=== Listing All Sub-Accounts ===')
  console.log()

  try {
    // The list() method returns all sub-accounts under your broker account.
    // You can optionally filter by query parameters like status.
    const accounts = await broker.accounts.list()

    if (accounts.length === 0) {
      console.log('No sub-accounts found.')
      console.log('This is normal for a new broker sandbox — you need to create accounts first.')
      console.log('See the commented code below for account creation examples.')
    } else {
      console.log(`Found ${accounts.length} sub-account(s):`)
      console.log()

      for (const account of accounts) {
        // Each account has a unique ID, status, and creation timestamp.
        // The status field indicates where the account is in the KYC/AML
        // approval process: SUBMITTED, APPROVED, ACTIVE, etc.
        console.log(`  Account ID: ${account.id}`)
        console.log(`    Status:     ${account.status}`)
        console.log(`    Created:    ${account.created_at}`)
        console.log()
      }
    }
  } catch (error) {
    // If this fails with a 401 or 403, your credentials are likely
    // Trading API keys, not Broker API keys. Make sure you're using
    // credentials from https://broker-app.alpaca.markets.
    console.error('Error listing accounts:', error instanceof Error ? error.message : String(error))
    console.log()
    console.log('If you see an authentication error, make sure you are using')
    console.log('BROKER API credentials from https://broker-app.alpaca.markets,')
    console.log('not regular Trading API credentials.')
    console.log()
  }

  // ---------------------------------------------------------------------------
  // Step 4: Get the market clock through the Broker API
  // ---------------------------------------------------------------------------
  // The Broker API provides its own clock endpoint, which returns the same
  // information as the Trading API clock: whether the market is currently
  // open, and the next open/close times.
  //
  // This is useful for broker applications that need to show market status
  // to their users or schedule operations around market hours.
  console.log('=== Market Clock (via Broker API) ===')
  console.log()

  try {
    const clock = await broker.clock.get()

    console.log(`  Market is: ${clock.is_open ? 'OPEN' : 'CLOSED'}`)
    console.log(`  Next open:  ${clock.next_open}`)
    console.log(`  Next close: ${clock.next_close}`)
    console.log(`  Timestamp:  ${clock.timestamp}`)
  } catch (error) {
    console.error('Error fetching clock:', error instanceof Error ? error.message : String(error))
  }

  console.log()

  // ---------------------------------------------------------------------------
  // Step 5: Understanding account creation (explained, not executed)
  // ---------------------------------------------------------------------------
  // Creating a sub-account requires extensive KYC (Know Your Customer) data.
  // This includes personal information, identity verification, disclosures,
  // and agreements. We show the structure here without executing it, because
  // account creation in the sandbox requires specific test data.
  //
  // In a real fintech application, your user onboarding flow would collect
  // this information and submit it through the Broker API.
  console.log('=== Account Creation (Structure Overview) ===')
  console.log()
  console.log('To create a sub-account, you would call:')
  console.log()
  console.log('  broker.accounts.create({')
  console.log('    contact: {')
  console.log('      email_address: "user@example.com",')
  console.log('      phone_number: "555-123-4567",')
  console.log('      street_address: ["123 Main St"],')
  console.log('      city: "San Francisco",')
  console.log('      state: "CA",')
  console.log('      postal_code: "94105"')
  console.log('    },')
  console.log('    identity: {')
  console.log('      given_name: "John",')
  console.log('      family_name: "Doe",')
  console.log('      date_of_birth: "1990-01-01",')
  console.log('      tax_id_type: "USA_SSN",')
  console.log('      tax_id: "xxx-xx-xxxx",  // NEVER log real SSN values')
  console.log('      country_of_citizenship: "USA",')
  console.log('      country_of_tax_residence: "USA",')
  console.log('      funding_source: ["employment_income"]')
  console.log('    },')
  console.log('    disclosures: {')
  console.log('      is_control_person: false,')
  console.log('      is_affiliated_exchange_or_finra: false,')
  console.log('      is_politically_exposed: false,')
  console.log('      immediate_family_exposed: false')
  console.log('    },')
  console.log('    agreements: [')
  console.log('      { agreement: "customer_agreement", ... },')
  console.log('      { agreement: "margin_agreement", ... }')
  console.log('    ]')
  console.log('  })')
  console.log()
  console.log('After creation, the account goes through KYC review.')
  console.log('Once approved (status: ACTIVE), you can fund it and trade.')

  console.log()

  // ---------------------------------------------------------------------------
  // Step 6: Other Broker API capabilities (summary)
  // ---------------------------------------------------------------------------
  console.log('=== Other Broker API Capabilities ===')
  console.log()
  console.log('The Broker API also supports:')
  console.log()
  console.log('  broker.transfers.create(accountId, { ... })')
  console.log('    -> Fund an account via ACH or wire transfer')
  console.log()
  console.log('  broker.achRelationships.create(accountId, { ... })')
  console.log('    -> Link a bank account for ACH transfers')
  console.log()
  console.log('  broker.trading.orders.create(accountId, { ... })')
  console.log('    -> Place orders on behalf of a sub-account')
  console.log()
  console.log('  broker.trading.positions.list(accountId)')
  console.log('    -> View positions for a sub-account')
  console.log()
  console.log('  broker.documents.list(accountId)')
  console.log('    -> Get account statements and tax documents')
  console.log()
  console.log('Broker API basics demonstration complete!')
}

main().catch(console.error)
