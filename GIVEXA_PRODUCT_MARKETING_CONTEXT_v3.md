# Product Marketing Context

**Product:** Givexa  
**Main domain:** givexa.xyz  
**Document version:** v3  
**Last updated:** 2026-08-30

## Product Overview

**One-liner:** Givexa is the gifting layer for tokenized markets, letting users send supported tokenized real-world assets such as Robinhood Stock Tokens through programmable claim links on Robinhood Chain.

**What it does:** A sender chooses a supported asset such as a Robinhood Stock Token and an amount, funds an onchain Gift Vault, and receives a private claim link. The recipient opens the link, sees the gift before dealing with blockchain mechanics, completes the required claim flow, and receives the asset. Givexa is positioned as both a consumer gifting product and, over time, programmable distribution infrastructure.

**Product category:** Stock Token gifting / tokenized RWA distribution / programmable onchain gifting.

**Product type:** Consumer Web3 application with smart-contract infrastructure; future developer API and business gifting platform.

**Network:** Robinhood Chain.

**Main domain:** givexa.xyz.

**Business model:** Consumer gifts use a transparent 0.50% sender-paid protocol creation fee at funding. The recipient pays no Givexa fee to receive or claim the gift, although the claimant pays the Robinhood Chain network gas in ETH. No subscription pricing is defined in the current Givexa product foundation.

## Target Audience

**Primary users:**
- Crypto-native users who already hold supported tokenized assets.
- People who want to send a financial or market-linked gift without exchanging wallet addresses first.
- Friends and family sending small-to-moderate asset gifts.

**Secondary users / customers:**
- Communities distributing contributor or event rewards.
- Creators rewarding collaborators, supporters, or winners.
- Web3 ecosystems introducing users to tokenized RWAs.
- Businesses running gifting and reward campaigns.
- Developers integrating programmable asset gifting.

**Primary use case:** Send a supported tokenized asset to another person through a simple private claim link instead of requiring the recipient's wallet address up front.

**Jobs to be done:**
- Give someone a tokenized asset in a familiar, recipient-friendly way.
- Introduce a first-time recipient to tokenized markets without starting with a trading workflow.
- Distribute onchain assets with transparent claim, expiration, and recovery rules.
- Create claim-based asset campaigns without first collecting destination wallet addresses.

**Use cases:**
- Birthdays and celebrations.
- Graduation gifts.
- First-asset gifts.
- Physical cards with QR/protected claims.
- Community contributor rewards.
- Event drops.
- Creator rewards.
- Business gifting campaigns.
- Future API-generated gifts.

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| Sender | Easy gifting, safety, clarity, recoverability | Does not want to ask for or verify a wallet address | Choose an asset, fund it, send a private link |
| Recipient | Trust, simplicity, understanding what they received | May not understand tokenized assets or Robinhood Chain and must already have a compatible wallet | See the gift first, then connect an EVM wallet through Reown and claim directly |
| Community / Creator | Distribution at scale | Collecting wallet addresses and coordinating rewards creates friction | Claim links and future campaign tooling |
| Business | Branded gifting, controls, reporting | Traditional gift cards are limited and onchain distribution is operationally complex | Future bulk gifting, campaign controls, analytics, and API |
| Developer | Reliable programmable primitive | Building escrow, claim, expiry, and recovery logic from scratch | Future Givexa API / protocol layer |

## Problems & Pain Points

**Core problem:** Tokenized assets can move onchain, but gifting them still feels like a crypto transfer rather than a normal consumer gifting experience.

**Why alternatives fall short:**
- Direct token transfers require a destination wallet address before the gift can be sent.
- Trading applications optimize for buying and selling, not gifting.
- Traditional gift cards send store credit, not a market-linked asset.
- Generic token claim links may not provide recipient-first explanation, asset-specific transparency, scheduled gifting, recovery rules, or a coherent gifting brand.

**What it costs users:** Extra coordination, recipient confusion, abandoned onboarding, wrong-address risk, and a gifting experience that feels technical rather than personal.

**Emotional tension:** The sender wants the gift to feel thoughtful and trustworthy. The recipient may be curious but skeptical of unfamiliar financial or crypto links.

## Competitive Landscape

**Direct:** Link-based tokenized-asset gifting products. These validate the use case but may focus narrowly on a simple stock-gift experience rather than a broader programmable gifting and distribution layer.

**Secondary:** Wallet-to-wallet token transfers, crypto gift-card products, token claim-link products, and embedded-wallet distribution tools. They solve transfer or onboarding pieces but not necessarily the full asset-gifting experience.

**Indirect:** Cash, bank transfers, prepaid gift cards, brokerage gift programs, and traditional financial gifts. These are familiar but are not built as programmable onchain RWA distribution primitives.

**Important:** Specific competitor names and claims should be researched before publishing comparison copy. Do not invent competitor weaknesses.

## Differentiation

**Key differentiators:**
- Recipient-first reveal before wallet connection.
- Programmable Gift Vault lifecycle.
- Private claim-link delivery.
- Potential scheduled, protected, expiring, cancellable, and recoverable gift rules.
- Curated supported tokenized assets rather than arbitrary contracts in the consumer flow.
- Onchain receipts and verifiable gift state.
- Consumer app plus future API/protocol positioning.
- Built specifically around tokenized real-world assets on Robinhood Chain.

**How we do it differently:** Givexa treats the gift itself as a product object with state, rules, context, delivery, and recovery, not as a decorative wrapper around a normal token transfer.

**Why that's better:** The sender gets a simpler gifting flow and predictable controls. The recipient understands what they received before being asked to connect a wallet or approve an onchain transaction.

**Why customers choose us:** To send market-linked onchain assets with less coordination and a more human recipient experience.

## Objections

| Objection | Response |
|---|---|
| "Is this actually a stock?" | Givexa must describe each underlying instrument exactly as issued. If it provides only economic exposure and not equity ownership, say that clearly. |
| "Is a gift link safe?" | Funded gift state should be verifiable onchain, previews should minimize sensitive information, and supported gifts may use claim protection and explicit recovery rules. |
| "What if nobody claims it?" | Givexa should provide a predictable cancellation/expiration/recovery path defined by the final smart contract rules. |
| "Do I need an account?" | No Givexa account is required. The recipient reveals the gift, connects an existing EVM wallet through Reown AppKit / WalletConnect, and claims onchain. |
| "What if the asset is not available in my country?" | Availability must follow the actual issuer and jurisdiction rules; unsupported claims should follow a clear recovery path. |

**Anti-persona:** Users seeking leveraged speculation, guaranteed returns, anonymous regulatory workarounds, arbitrary unverified token distribution, or a professional trading terminal are not the primary fit for Givexa.

## Switching Dynamics

**Push:** Wallet-address coordination, technical transfer flows, generic gift cards, and wallet-address coordination and technical claim flows make asset gifting awkward.

**Pull:** A familiar gift experience, private link delivery, transparent onchain funding, programmable controls, and a simple recipient journey.

**Habit:** People already know cash, bank transfers, gift cards, and direct wallet transfers. These are familiar and require no new category explanation.

**Anxiety:** Recipients may distrust financial links; senders may worry about wrong recipients, unclaimed funds, asset legitimacy, regulations, or losing access to the gift.

## Customer Language

**Early hypothesis language, not yet validated by customer interviews:**
- "Send an asset without asking for their wallet address first."
- "Give someone a piece of the market."
- "Choose it, fund it, send the link."
- "Show me what I received before asking me to connect anything."

**How we describe Givexa:**
- "The gifting layer for tokenized markets."
- "Programmable gifting for tokenized real-world assets such as Stock Tokens."
- "Send supported Stock Tokens through a simple claim link."

**Words to use:** gift, send, asset, Stock Token, tokenized real-world asset, claim, reveal, supported asset, Gift Vault, onchain, private link, recipient, recover, verify, tokenized market, Robinhood Chain.

**Words to avoid unless technically/legal accurate:** tokenized stock, tokenized equity, stock ownership, guaranteed, risk-free, investment return, custody, broker, bank, exchange, shares, dividend, insured.

**Words to avoid stylistically:** revolutionary, next-gen, frictionless, seamless, 100x, moon, alpha, degen.

**Glossary:**

| Term | Meaning |
|---|---|
| Asset Gift | A supported tokenized asset packaged into a Givexa gifting experience |
| Gift Vault | The onchain state/contract mechanism holding and governing an active gift |
| Claim Link | A private link used to open and begin claiming a gift |
| Sender | The person or application creating and funding a gift |
| Recipient | The person claiming the gift |
| Reveal | The recipient-facing step that explains the gift before wallet connection |
| Recovery | Returning or making an unclaimed gift recoverable under its configured rules |
| Givexa Send | Consumer gift-creation product |
| Givexa Claim | Recipient claim experience |
| Givexa Dashboard | Gift management interface |
| Givexa API | Future developer distribution infrastructure |
| Givexa Protocol | Smart-contract/infrastructure layer |

## Brand Voice

**Tone:** Professional but friendly, calm, clear, consumer-accessible.

**Style:** Direct sentences, minimal jargon, benefit-first copy, transparent explanations when financial or blockchain details matter.

**Personality:** Modern, trustworthy, human, clear, technically credible.

**Voice rule:** If clarity and cleverness conflict, choose clarity.

**Messaging hierarchy:**
1. What the person can do.
2. Why it is easier or better.
3. How it works.
4. Onchain verification and technical detail.
5. Legal/asset-specific disclosure where required.

## Core Messaging

**Primary tagline:** Give someone a piece of the market.

**Category line:** The gifting layer for tokenized markets.

**Homepage hero:**

> **Give someone a piece of the market.**
>
> Send supported tokenized real-world assets such as Stock Tokens through a simple claim link. Choose an asset, fund the gift onchain, and share it anywhere.

**Primary CTA:** Create an Asset Gift

**Secondary CTA:** See How It Works

**Short pitch:** Givexa turns supported tokenized real-world assets such as Stock Tokens into programmable gifts. A sender chooses an asset and amount, funds an onchain Gift Vault, and shares a private claim link. The recipient sees the gift first, then completes a simple claim flow to receive the asset.

**X bio:** Programmable gifting for tokenized markets. Built on Robinhood Chain.

## Proof Points

**Metrics:** None yet. Do not fabricate usage, transaction, user, country, gift, or volume metrics.

**Customers:** None provided yet.

**Testimonials:** None provided yet.

**Value themes:**

| Theme | Current proof |
|---|---|
| Easier delivery | Product design removes the need to request a destination wallet address before creating the gift |
| Recipient-first | Product concept explicitly reveals/explains the gift before wallet connection |
| Verifiable | Planned onchain funding and receipt model |
| Programmable | Planned gift state supports configurable claim/recovery behavior |
| RWA-native | Product is designed around supported tokenized real-world assets on Robinhood Chain |

## Launch Implementation Decisions

### Launch asset allowlist
Givexa V1 launches with a curated 10-asset allowlist:
- NVDA
- AAPL
- TSLA
- MSFT
- AMZN
- GOOGL
- META
- SPY
- QQQ
- GLD

The frontend and contracts must resolve canonical Robinhood Chain deployments from Robinhood's official Stock Token registry/API and only accept assets with active status. Do not trust ticker or token name alone. If a launch asset becomes inactive or restricted, Givexa disables new gifts for it while preserving claim/recovery paths for existing gifts.

### Issuer and legal classification
Launch assets are Robinhood Stock Tokens issued by Robinhood Assets (Jersey) Limited (RHJ). They are tokenised debt securities that provide economic exposure to underlying securities and do not grant legal or beneficial ownership rights in the underlying securities. External Givexa copy uses "Stock Tokens" or "tokenized real-world assets such as Stock Tokens," not "tokenized stocks" or "tokenized equities."

### Jurisdiction and eligibility policy
Givexa V1 is available only to adults aged 18+ in jurisdictions where the selected Stock Token may lawfully be offered or delivered. The app hard-blocks the United States and U.S. persons, Canada, the United Kingdom, Switzerland, the UAE, sanctioned jurisdictions, and any additional jurisdiction listed as restricted in RHJ's current disclosures/final terms.

Eligibility is checked at claim time using:
1. IP/geolocation screening.
2. Recipient country-of-residence self-declaration.
3. Sanctions/restricted-jurisdiction screening.
4. Asset-level eligibility rules pulled from current issuer disclosures.

If a recipient is not eligible, the gift cannot be claimed and remains cancellable/recoverable by the sender.

### Wallet and claim flow
Sender:
- Connects an existing EVM wallet through Reown AppKit / WalletConnect.
- Funds gifts directly from their own wallet.
- Pays the Givexa creation fee and Robinhood Chain gas in ETH.

Recipient:
- Opens the private gift link and sees sender, asset, value, message, and disclosure before wallet connection.
- Connects an existing EVM wallet through Reown AppKit / WalletConnect.
- Switches to Robinhood Chain if needed.
- Pays the Robinhood Chain network gas required for the claim transaction.
- Receives the gift directly to the connected wallet that submits the valid claim.

No Givexa account is required. Claiming uses an existing EVM wallet connected through Reown AppKit / WalletConnect, and the claimant pays Robinhood Chain network gas in ETH.

**Bearer-gift rule:** anyone possessing the complete valid, unclaimed gift link may connect a wallet and claim the gift. The sender must treat the link like a bearer instrument and share it only with the intended recipient.

### Gift Vault architecture
Givexa V1 uses a small, non-upgradeable contract suite:
- `GivexaGiftVaultV1` — escrow/state machine for funded gifts.
- `GivexaAssetRegistryV1` — allowlist of canonical Stock Token contracts.
- `GivexaFeeControllerV1` — fee configuration and treasury routing.

Each logical gift has an isolated `giftId` record inside `GivexaGiftVaultV1`, rather than deploying one contract per gift. Core fields: sender, asset, principal amount, secret hash, optional claim-code hash, unlock time, expiry time, status, and created time.

Admin cannot withdraw gift principal. Emergency pause may block new gift creation but must not block valid claims or sender recovery. V1 is non-upgradeable; future versions deploy separately. Administrative changes use a 2-of-3 Safe multisig plus a 48-hour timelock.

### Expiration
Default expiry: 30 days after the gift becomes claimable.

Sender-selectable presets:
- 7 days
- 14 days
- 30 days
- 90 days

Maximum custom expiry: 365 days.

Scheduled gifts start their expiry window at `unlockAt`, not at creation.

### Cancellation and recovery
- Sender may cancel any unclaimed gift before it is claimed.
- Cancel returns the full remaining gift principal to the sender.
- After expiry, the gift becomes recoverable.
- `reclaimExpired(giftId)` is permissionless to trigger, but funds can only return to the original sender.
- No Givexa operator or admin can redirect gift principal.
- No Givexa protocol fee is charged on cancellation or recovery.

### Claim protection
Every gift uses a cryptographically random 256-bit claim secret.

Security rules:
- Only the hash of the secret is stored onchain.
- The secret is carried in the URL fragment so it is not included in normal HTTP requests/referrer data.
- Link previews never show the claim secret, gift amount, or asset quantity.
- Optional Protected Gift mode adds a separately shared, Givexa-generated 8-character alphanumeric Claim Code.
- The claim destination is the wallet that submits the valid transaction (`msg.sender`).

### Scheduled gifts
Scheduled Gift is part of V1.

Rules:
- Contract stores `unlockAt`.
- Gift cannot be claimed before `unlockAt`.
- Minimum schedule delay: 10 minutes.
- Maximum schedule horizon: 365 days.
- Default expiry begins 30 days after unlock unless sender selects another preset.
- Scheduled gifts remain cancellable by the sender until claimed.

### Consumer fee model
- Protocol creation fee: 0.50% of gift principal.
- Fee is paid by the sender at funding.
- Recipient receives the full principal amount selected by the sender.
- Claim fee: 0%.
- Cancellation fee: 0%.
- Recovery fee: 0%.
- Network gas remains separate.
- Fee changes are timelocked and capped at 1.00% in V1.

### Payment methods
V1 is wallet-funded only.

Supported at launch:
- Existing supported Stock Token balance in the sender wallet.
- ETH for Robinhood Chain network gas.

Not included in V1:
- Credit/debit card purchase.
- Bank transfer.
- Fiat custody.
- Built-in fiat on-ramp.
- Automatic swap from another asset.

This keeps Givexa V1 focused on gifting/distribution rather than brokerage, exchange, or payment processing.

### Pricing and market data
Contract-side source of truth:
- Robinhood Chain Chainlink price feeds for supported Stock Tokens.

Frontend data:
- Robinhood RHJ `/assets` API for canonical asset metadata/deployments.
- Robinhood RHJ `/prices/{symbol}` for displayed market quotes.
- Corporate-action multiplier metadata from RHJ `/assets`.

If pricing is stale, halted, or unavailable, Givexa shows "Price temporarily unavailable" rather than estimating.

### Monetization
Current Givexa monetization is intentionally simple:
- 0.50% sender-paid protocol creation fee when a gift is funded.
- Recipient pays no Givexa claim fee.
- No Givexa cancellation fee.
- No Givexa recovery fee.
- Robinhood Chain gas is paid separately by the wallet submitting each transaction.
- No subscription tiers are defined in the current product foundation.

### Deployment status and mainnet contracts
Robinhood Chain mainnet is the target deployment network, Chain ID 4663.

Givexa contracts are not yet deployed, so real contract addresses do not exist yet and must not be fabricated.

Planned deployment set:
- `GivexaGiftVaultV1` — address assigned at mainnet deployment.
- `GivexaAssetRegistryV1` — address assigned at mainnet deployment.
- `GivexaFeeControllerV1` — address assigned at mainnet deployment.
- `GivexaTreasurySafe` — 2-of-3 Safe created before contract deployment.

After deployment, canonical addresses will be published on `givexa.xyz/contracts` and verified on the Robinhood Chain Blockscout explorer.

## Goals

**Primary business goal:** Build Givexa live as a credible consumer product for asset gifting on Robinhood Chain, with a clear path to community, business, and developer distribution use cases.

**Key conversion action:** Create an Asset Gift.

**Secondary conversion actions:** See How It Works; open and claim an existing gift; connect a wallet; view onchain gift receipts.

**Current metrics:** Not provided. Do not fabricate usage or volume metrics.

## Current Product Decisions

**Locked:**
- Product name: Givexa
- Main domain: givexa.xyz
- Network: Robinhood Chain mainnet, Chain ID 4663, ETH gas
- Core category: programmable gifting for tokenized real-world assets such as Stock Tokens
- Launch assets: NVDA, AAPL, TSLA, MSFT, AMZN, GOOGL, META, SPY, QQQ, GLD
- Launch issuer: Robinhood Assets (Jersey) Limited for Robinhood Stock Tokens
- Primary positioning: The gifting layer for tokenized markets
- Primary tagline: Give someone a piece of the market.
- Core loop: Choose → Fund → Send → Reveal → Claim → Own
- Recipient-first UX principle: reveal first, explain second, connect third
- Wallet flow: Reown AppKit / WalletConnect only; existing EVM wallet required; claimant pays Robinhood Chain gas in ETH
- Gift architecture: non-upgradeable shared `GivexaGiftVaultV1` with isolated gift records
- Default expiry: 30 days after claimability
- Sender cancellation: allowed until claim
- Expired recovery: permissionless trigger, funds return only to sender
- Claim secret: mandatory 256-bit secret; optional 8-character Claim Code
- Scheduled gifts: included in V1, up to 365 days
- Consumer protocol fee: 0.50% sender-paid at funding; no recipient claim fee
- Payments: wallet-funded Stock Tokens only at V1; no fiat/card/bank/on-ramp
- Recipient account model: no Givexa account required; existing EVM wallet required
- Claim destination: connected claimant wallet (`msg.sender`)
- Claim gas: paid by claimant in ETH on Robinhood Chain
- Bearer-link model: anyone with the complete valid, unclaimed gift link can claim
- Price source: Chainlink onchain feeds; RHJ APIs for frontend metadata/quotes
- Mainnet contracts: not deployed yet; addresses must be published only after real deployment
- Consumer brand first, protocol/API expansion later

**Operational deployment requirements, not positioning TBDs:**
- Create Givexa 2-of-3 treasury/admin Safe.
- Complete automated tests and security review for the final contract suite.
- Confirm the final jurisdiction list against RHJ's current legal disclosures before enabling claims.
- Verify the 10 supported asset contract addresses against Robinhood's canonical registry before enabling each asset.
- Deploy and verify the real mainnet contracts.
- Publish canonical mainnet contract addresses only after deployment.

## Changelog

- v3 (2026-08-30) — Replaced the embedded-wallet/sponsored-gas claim model with Reown AppKit / WalletConnect using an existing EVM wallet; claimant now pays Robinhood Chain gas and the connected wallet is the direct claim destination. Locked the bearer-link model, removed subscription pricing, and removed launch timeline targets so the foundation reflects a direct live build.
- v2 (2026-08-30) — Resolved the implementation TBDs: launch assets, RHJ/Stock Token legal terminology, jurisdiction policy, Privy claim flow, V1 contract architecture, expiry/recovery, claim protection, scheduled gifts, 0.50% fee model, wallet-only funding, Chainlink/RHJ data sources, business/API pricing, deployment status, and target launch schedule. Also aligned external terminology with Robinhood Chain brand guidance.
- v1 (2026-08-30) — Initial Givexa foundation created from the finalized project concept; locked the Givexa name, givexa.xyz domain, Robinhood Chain positioning, core product loop, recipient-first messaging, brand voice, and long-term consumer-to-protocol direction. Unresolved implementation and legal details were explicitly marked TBD.
