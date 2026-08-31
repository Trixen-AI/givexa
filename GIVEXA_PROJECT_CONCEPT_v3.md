# Givexa

**Domain:** givexa.xyz  
**Network:** Robinhood Chain  
**Category:** Stock Token gifting / programmable tokenized RWA distribution

> **Give someone a piece of the market.**

## Overview

Givexa is the gifting layer for tokenized markets, built on Robinhood Chain.

It lets someone turn a supported tokenized real-world asset such as a Robinhood Stock Token into a private, claimable gift link.

The sender chooses the asset and amount, funds an onchain Gift Vault, and shares the link. The recipient opens the gift, sees what was sent, connects an EVM wallet through Reown AppKit / WalletConnect, and claims the asset directly to that wallet.

The recipient uses an existing EVM wallet. The wallet that claims the gift pays the Robinhood Chain network fee in ETH.

Givexa is not another trading terminal. It is a consumer gifting experience built on top of programmable onchain settlement.

## Core Positioning

**The gifting layer for tokenized markets.**

Most market products begin with an account, wallet, deposit, search, and trade.

Givexa begins with a simpler moment:

> Someone sent you an asset.

The product puts the value and context of the gift before the blockchain mechanics.

## Core Product Loop

**Choose → Fund → Send → Reveal → Claim → Own**

### 1. Choose

The sender selects a supported tokenized asset and gift amount.

A gift can include:

- Asset
- Amount
- Personal message
- Expiration
- Optional claim protection
- Optional scheduled unlock

### 2. Fund

The sender funds a dedicated onchain Gift Vault.

The vault records the essential gift state, including the sender, asset, amount, creation time, claim status, and configured recovery rules.

### 3. Send

Givexa creates a private claim link that can be shared through messaging apps, email, SMS, social platforms, QR codes, or a physical card.

The link is the delivery experience. The blockchain remains underneath it.

### 4. Reveal

The recipient opens the gift before being asked to understand the underlying infrastructure.

The first screen should answer:

- Who sent this?
- What did they send?
- What is it worth?
- What does the asset represent?
- What happens next?

### 5. Claim

The recipient connects an existing EVM wallet through **Reown AppKit / WalletConnect**.

If needed, the interface asks the wallet to switch to Robinhood Chain. The recipient then submits the claim transaction from the connected wallet and pays the network gas fee in ETH.

The gift is transferred directly to the wallet that successfully calls the claim function.

For a standard gift, the valid private gift link acts as the bearer credential: **anyone who possesses the valid, unclaimed link can connect a wallet and claim the gift**.

No Givexa account is required. The recipient claims with an existing EVM wallet connected through Reown AppKit / WalletConnect.

### 6. Own

After a successful claim, the supported tokenized asset moves to the recipient's wallet or account.

What the recipient can do afterward depends on the rules and capabilities of the underlying asset.

## The Givexa Difference

Givexa does not treat gifting as a thin wrapper around a token transfer.

A Givexa gift is a programmable object with its own lifecycle.

### Gift Vaults

Every active gift is represented by a dedicated Gift Vault or equivalent isolated gift state.

Possible lifecycle:

**Created → Funded → Active → Claimed**

or

**Created → Funded → Active → Expired / Cancelled → Returned**

### Programmable Rules

Supported gift types may include:

- **Instant Gift** — claim as soon as it is funded.
- **Protected Gift** — requires an additional secret or verification step.
- **Scheduled Gift** — becomes claimable at a future time.
- **Expiring Gift** — becomes recoverable when the claim window ends.

V1 defaults are locked: gifts expire 30 days after they become claimable; senders can choose 7, 14, 30, or 90 days, with a 365-day maximum. Senders can cancel any unclaimed gift. After expiry, anyone may trigger recovery, but principal can only return to the original sender. Scheduled gifts are supported in V1 with an `unlockAt` timestamp.

## Recipient-First Design Principle

### Reveal first. Explain second. Connect third.

Givexa should never make a first-time recipient decode a crypto interface before they understand the gift.

The first screen leads with the sender, asset, value, message, and a plain-language explanation of what the recipient is receiving. Wallet connection comes after the gift has been revealed.

Blockchain terminology should appear only where it improves transparency or is necessary for an action.

## Supported Assets

Givexa should use a curated allowlist rather than exposing arbitrary token contracts in the primary consumer flow.

Potential categories include:

- Robinhood Stock Tokens tied to companies
- Stock Tokens tied to ETFs and exchange-traded products
- Additional tokenized real-world assets only after issuer/legal review

**Givexa V1 launch allowlist:** NVDA, AAPL, TSLA, MSFT, AMZN, GOOGL, META, SPY, QQQ, and GLD.

Canonical contract addresses are resolved from Robinhood's official Stock Token registry/API and re-verified before deployment. Givexa never trusts a ticker or token name alone.

Each asset should have a transparent asset profile covering:

- Asset name and symbol
- Issuer
- What it tracks or represents
- Whether it represents ownership or only economic exposure
- Voting/dividend rights, if any
- Transfer or redemption rules
- Geographic restrictions
- Risk disclosures

Givexa should never describe economic exposure as actual equity ownership unless the underlying instrument legally provides that ownership.

## V1 Technical Architecture

Givexa V1 uses a small non-upgradeable contract suite rather than deploying a separate contract for every gift.

### GivexaGiftVaultV1

The escrow and gift-state machine.

Each gift is an isolated record identified by `giftId` with:

- Sender
- Asset contract
- Principal amount
- 256-bit claim-secret hash
- Optional Claim Code hash
- Unlock timestamp
- Expiry timestamp
- Status
- Creation timestamp

Admin cannot withdraw gift principal.

### GivexaAssetRegistryV1

Maintains the consumer allowlist of canonical supported Stock Token contracts.

Registry updates must use canonical Robinhood deployment data, not token names or tickers alone.

### GivexaFeeControllerV1

Routes the 0.50% creation fee and enforces the V1 maximum fee of 1.00%.

Administrative changes use a 2-of-3 Safe multisig with a 48-hour timelock.

Emergency pause may stop new gift creation, but valid claims and sender recovery remain available.

## Claim Security

Every standard gift uses a cryptographically random 256-bit secret.

Only the hash of the secret is stored onchain. The secret is carried in the private gift URL fragment rather than the normal request path.

The gift is a **bearer gift**. Anyone with the complete valid gift link can attempt to claim it, so the sender must share the link only with the intended recipient.

The claim contract transfers the gift directly to the wallet that submits the valid claim transaction. The connected claimant wallet (`msg.sender`) is the destination.

Protected Gift adds a Givexa-generated 8-character alphanumeric Claim Code that the sender shares separately from the link.

Link previews must not reveal the claim secret, asset quantity, or gift value.

## Pricing and Asset Data

Givexa uses two data layers.

**Contract-side:** Robinhood Chain Chainlink price feeds are the source of truth for onchain price-dependent logic.

**Frontend:** Robinhood's RHJ asset and price APIs provide canonical asset metadata, deployment addresses, corporate-action multiplier data, and displayed market quotes.

If a price is stale, halted, or unavailable, Givexa displays **Price temporarily unavailable** instead of estimating.

## Payment Scope

Givexa V1 is **wallet-funded only**.

The sender must already hold the supported Stock Token they want to gift and ETH for Robinhood Chain gas. The recipient also needs an EVM wallet and enough ETH on Robinhood Chain to submit the claim transaction.

V1 does not include:

- Card payments
- Bank transfers
- Fiat custody
- Fiat on-ramp
- Built-in asset swaps

These can be evaluated after the core gifting product is proven.

## Wallet Connection

Givexa uses **Reown AppKit / WalletConnect** as the wallet connection layer.

The product does not create or custody wallets.

Supported claim flow:

**Open Gift → Reveal → Connect Wallet → Switch to Robinhood Chain if needed → Claim → Own**

The connected wallet is the claim destination.

If the connected wallet has insufficient ETH for network gas, Givexa should show a clear **Not enough ETH for network fee** state before the user submits the claim.

## Product Suite

### Givexa Send

The consumer experience for creating and funding an asset gift.

### Givexa Claim

The lightweight recipient experience for opening, understanding, and claiming a gift.

### Givexa Vault

The onchain contract layer that manages gift state, funding, claiming, expiration, cancellation, and recovery.

### Givexa Dashboard

A dashboard for tracking sent and received gifts, including status and onchain receipts.

### Givexa API

Future developer infrastructure for applications that want to create programmable asset gifts or claim campaigns programmatically.

### Givexa Protocol

The broader name for the smart-contract and infrastructure layer when Givexa is discussed as a protocol rather than only a consumer application.

## Dashboard States

A sender dashboard can organize gifts into:

- Active
- Claimed
- Scheduled
- Expired
- Cancelled
- Returned

Each gift can show:

- Asset
- Quantity
- Value at creation
- Current displayed value, when reliable pricing is available
- Creation date
- Expiration or unlock date
- Claim status
- Vault or gift identifier
- Transaction hash
- Explorer link

## Onchain Receipt

Every funded gift should have a verifiable record.

A receipt can show:

- Gift ID
- Asset
- Amount
- Sender
- Current state
- Creation time
- Claim or recovery transaction
- Network
- Relevant contract address

The goal is to make the experience simple without making the underlying transaction opaque.

## Safety Principles

Givexa should be built around predictable outcomes.

### Verifiable funding

A funded gift should be verifiable onchain.

### Recovery rules

Unclaimed gifts should follow explicit cancellation or expiration rules rather than remaining permanently inaccessible.

### Claim protection

Higher-value or publicly delivered gifts may support an additional protection mechanism.

### Minimal public preview data

Claim-link previews should avoid exposing unnecessary sensitive gift details.

### Verified asset allowlist

The primary interface should only present supported, verified contracts.

### Honest pricing

If reliable price data cannot be read, the interface should say the price is unavailable rather than inventing or silently estimating a live value.

## Consumer Use Cases

### Birthdays

Give an asset instead of another generic gift card.

### Graduation

Send a market-linked gift for someone's next chapter.

### First Asset

Introduce someone to tokenized markets through something they already received.

### Celebrations

Use an asset gift for milestones, thank-yous, and personal occasions.

### Physical Gifts

Place a protected or QR-based claim inside a physical card.

## Community Use Cases

### Contributor Rewards

Send claimable asset rewards to contributors.

### Event Drops

Create protected or limited claim experiences for events.

### Campaign Gifts

Distribute a controlled set of claim links without collecting wallet addresses first.

### Creator Rewards

Let creators reward supporters, collaborators, or winners with tokenized assets.

## Business Use Cases

Future business tooling can support:

- Bulk gift creation
- Branded claim pages
- Campaign dashboards
- Custom delivery messages
- Expiration controls
- Gift analytics
- API-based generation

The business product should remain downstream of the core consumer experience, not define the initial brand.

## Growth Loop

Givexa can create a product-native distribution loop:

**Sender → Gift → Recipient → Claim → New User → New Gift**

The product reaches a new person because value is already waiting for them, rather than because they were asked to sign up for another financial application.

## Target Users

### Primary

- Crypto-native users who already hold supported tokenized assets
- People who want to send a financial gift without exchanging wallet addresses first
- Friends and family sending small-to-moderate asset gifts

### Secondary

- Communities
- Creators
- Web3 ecosystems
- Businesses running gifting or reward campaigns
- Developers integrating programmable gifting

## Business Model

Givexa uses a simple consumer protocol fee.

### Asset Gift Creation

Givexa charges a **0.50% sender-paid protocol creation fee** when a gift is funded.

The sender pays:
- The selected gift principal
- The 0.50% Givexa creation fee
- Robinhood Chain network gas in ETH

The recipient receives the full gift principal selected by the sender.

Givexa charges:
- **No Givexa claim fee**
- **No Givexa cancellation fee**
- **No Givexa recovery fee**

The recipient still pays the Robinhood Chain network gas required to submit the claim transaction.

Fee changes in V1 are timelocked and capped at **1.00%**.

No subscription pricing is defined in the current Givexa product foundation.

## Why Robinhood Chain## Why Robinhood Chain

Givexa is designed for an ecosystem where tokenized real-world assets can exist and move onchain.

Robinhood Chain provides the settlement environment. Givexa provides the gifting and distribution experience above it.

The chain should be visible when users need verification, but it should not dominate the consumer journey.

## What Givexa Is

Givexa is a programmable gifting and distribution layer for supported tokenized real-world assets.

## What Givexa Is Not

Unless the final implementation and legal structure explicitly establish otherwise, Givexa should not present itself as:

- A stock broker
- A bank
- An issuer
- A traditional stock exchange
- An investment adviser
- A custodian
- A promise of returns

For the V1 launch allowlist, the relevant instruments are Robinhood Stock Tokens issued by Robinhood Assets (Jersey) Limited. They are tokenised debt securities providing economic exposure to underlying securities and do not grant legal or beneficial rights in the underlying securities.

Givexa V1 is restricted to eligible adults in jurisdictions where the selected Stock Token may lawfully be delivered. The app blocks the United States and U.S. persons, Canada, the United Kingdom, Switzerland, the UAE, sanctioned jurisdictions, and any additional jurisdiction listed in RHJ's current disclosures. Eligibility is re-checked at claim time. An ineligible recipient cannot claim; the sender retains cancellation/recovery rights.

## Brand Positioning

### Primary tagline

**Give someone a piece of the market.**

### Category line

**The gifting layer for tokenized markets.**

### Product description

**Givexa lets you send supported tokenized real-world assets through a simple claim link on Robinhood Chain. Choose an asset, fund the gift onchain, and share it anywhere.**

### Short pitch

**Givexa turns supported tokenized real-world assets such as Stock Tokens into programmable gifts. A sender chooses an asset and amount, funds an onchain Gift Vault, and shares a private claim link. The recipient sees the gift first, then completes a simple claim flow to receive the asset.**

### X bio

**Programmable gifting for tokenized markets. Built on Robinhood Chain.**

## Homepage Copy Direction

### Hero

# Give someone a piece of the market.

Send supported tokenized real-world assets such as Stock Tokens through a simple claim link. Choose an asset, fund the gift onchain, and share it anywhere.

**Primary CTA:** Create an Asset Gift  
**Secondary CTA:** See How It Works

### Section 2

## Assets should be as easy to give as a gift card.

Most market products start with account creation, deposits, searches, and trades.

Givexa starts with something people already understand: someone sent you a gift.

### Section 3

## Choose. Fund. Send.

**Choose** a supported tokenized asset and amount.  
**Fund** a programmable Gift Vault on Robinhood Chain.  
**Send** the private claim link anywhere.

The recipient takes it from there.

### Section 4

## More than a token transfer.

A normal transfer requires a destination address. A Givexa gift can also carry a message, claim rules, scheduled delivery, expiration, protection, and a recipient-friendly reveal experience.

### Section 5

## Simple on the surface. Verifiable underneath.

Every funded gift should be backed by transparent onchain state, so users can verify the asset, amount, status, and transaction without turning the entire product into a block explorer.

### Final CTA

## Send an asset, not another signup link.

Create a gift with value already waiting on the other side.

**CTA:** Create an Asset Gift

## Brand Voice

Givexa should sound:

- Clear
- Modern
- Calm
- Trustworthy
- Human
- Technically credible when needed

Avoid:

- Investment hype
- Degen language
- Guaranteed-return language
- Excessive blockchain jargon
- Artificial urgency
- Generic phrases such as "revolutionary," "next-gen," or "seamless" unless supported by specifics

## Long-Term Vision

Tokenized markets make real-world financial exposure programmable. Givexa extends that programmability beyond trading.

An asset can become a birthday gift, a graduation gift, a community reward, a QR claim, a creator reward, or an application-generated distribution.

The long-term goal is for Givexa to become the **gifting and distribution layer for onchain real-world assets**.

Not another place to watch markets.

A new way for markets to reach people.
