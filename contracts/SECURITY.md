# Givexa security model

## Protected assets and invariants

The primary protected asset is each gift principal held by `GivexaGiftVaultV1`.

Required invariants:

1. For every token, vault balance is at least `totalEscrowed[token]`.
2. A gift can reach only one terminal state: claimed, cancelled, or returned.
3. Claim principal is transferred only to the wallet that calls `claim`.
4. Expired recovery always pays the original sender, even when another wallet triggers it.
5. Fees are charged only at gift creation. Claim, cancel, and recovery have no Givexa fee.
6. Asset disabling blocks only new gifts. Existing liabilities remain claimable or recoverable.
7. Emergency pause blocks only creation.
8. Governance cannot sweep recorded principal.

The invariant suite exercises randomized create, claim, cancel, time advance, and recovery operations against these properties.

## Trust boundaries

- The 2-of-3 Safe proposes governance operations and acts as emergency guardian.
- The 48-hour timelock owns all three Givexa contracts and is the only path to unpause creation or change configuration.
- Robinhood Stock Token contracts are external dependencies and use issuer-controlled infrastructure, including the corporate-action multiplier.
- The authenticated RPC provider is infrastructure, not a source of authorization.
- The frontend and backend are not trusted with gift principal.

## Bearer-link security

Each gift must use a cryptographically random 256-bit secret generated in the browser with a secure random source. Only the domain-separated hash is stored onchain. The raw secret must remain in the URL fragment so it is not sent in normal HTTP request paths, analytics, referrers, server logs, or link previews.

Anyone who obtains the complete link before claim can claim the gift. This is intentional bearer behavior from the product concept. The optional 8-character Claim Code must be sent separately. Its commitment is bound to the 256-bit secret, preventing practical offline brute force from the onchain hash alone.

The claim transaction reveals the secret onchain. The app must not submit claims through untrusted transaction relays and must clearly warn users never to paste claim links into third-party sites.

## Token behavior

The registry accepts only contract addresses reporting 18 decimals. Gift creation and payout verify exact recipient balance deltas. Fee-on-transfer tokens are rejected atomically. Rebase, blacklist, pause, proxy-upgrade, and issuer custody risks remain properties of the external Stock Token contracts.

The protocol intentionally does not use price oracles. Gift accounting is denominated in token units. Market values and `uiMultiplier()` belong in the application display layer.

## Compliance boundary

The concept requires jurisdiction and eligibility checks at creation and claim time. The current bearer vault does not encode jurisdiction onchain and cannot infer a wallet holder's country or legal status. App-only geofencing can be bypassed by direct contract calls.

Therefore mainnet public launch requires one of these approved decisions:

1. Legal approval that app-level controls are sufficient for this bearer design.
2. A separately specified onchain eligibility-attestation module, reviewed for privacy, availability, revocation, and censorship risks.

Do not claim that the contract itself enforces jurisdiction eligibility.

## Known operational risks

- Loss of the bearer secret can make a gift unavailable until sender cancellation or expiry recovery.
- Theft of the bearer secret permits theft of the gift before claim.
- Safe signer compromise can pause creation immediately and can change configuration after the timelock delay.
- A compromised Stock Token implementation can affect balances independently of Givexa.
- Public RPC endpoints are rate-limited. Production must use an authenticated provider and monitoring.

## Before mainnet value

Independent security review is required before holding production user assets. The reviewer must receive the exact compiler config, dependency versions, tests, deployment manifest, Safe owners, timelock roles, and app secret-handling implementation.
