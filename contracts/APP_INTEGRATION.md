# App integration contract

## Production deployment

Robinhood Chain mainnet uses chain ID `4663`. The reviewed machine-readable deployment record is
`deployments/robinhood-mainnet.json`.

| Contract | Address |
| --- | --- |
| Gift Vault | `0x82d477c00e1D8DC784aE87a71Ffa2C56Ad2626E9` |
| Asset Registry | `0x3DbcD81aC7cAE53B11be7490fEc2ADf71EBDaceA` |
| Fee Controller | `0x06b04449166FF138FEdcdc894636c8986444aD55` |
| Governance Timelock | `0x152Cd038Aee65F2Ca4F362b8E9069477C8AAEC03` |
| Governance Safe and Treasury | `0x9E4432C98321dAB22bF78cEd55800F0F5B893802` |

Application code must import these values from a versioned deployment configuration generated from the
deployment record. Do not duplicate addresses across components.

## ABI sources

After `forge build`, use these generated artifacts:

- `out/GivexaGiftVaultV1.sol/GivexaGiftVaultV1.json`
- `out/GivexaAssetRegistryV1.sol/GivexaAssetRegistryV1.json`
- `out/GivexaFeeControllerV1.sol/GivexaFeeControllerV1.json`

Copy only each artifact's `abi` field into the application build. Contract addresses must come from a reviewed deployment record, never from hardcoded dry-run addresses.

## Create flow

1. Generate a random 32-byte secret with `crypto.getRandomValues`.
2. If protected, generate an independent 8-character Claim Code and display it once to the sender.
3. Read `hashSecret(secret)` from the deployed vault.
4. If protected, read `hashClaimCode(secret, claimCode)` from the vault.
5. Read `quoteFee(principal)` from the fee controller.
6. Verify `assetRegistry.isSupported(asset)`.
7. Approve the vault for `principal + fee`.
8. Call `createGift` with token address, principal, commitments, schedule, and expiry duration.
9. Parse `GiftCreated` for the gift ID.
10. Build the private link with the raw secret only in the URL fragment.

The app must re-read the fee immediately before transaction submission. It must never derive market value from the raw token balance alone; displayed units use current Stock Token metadata and `uiMultiplier()`.

## Claim flow

1. Parse the secret from the URL fragment entirely in the browser.
2. Fetch gift state by ID and show asset, amount, sender, schedule, and status.
3. Perform current eligibility checks before wallet connection and again before claim.
4. Connect the recipient wallet and require Robinhood Chain ID 4663.
5. If protected, collect the separately shared Claim Code.
6. Call `claim(giftId, secret, claimCode)` from the recipient wallet.
7. Treat `msg.sender` as the only recipient. There is no arbitrary destination argument.

Never send the raw secret or Claim Code to analytics, error trackers, backend logs, server rendering, metadata fetchers, or link-preview services.

## Dashboard status mapping

`displayStatus(giftId)` returns:

| Value | UI state |
| --- | --- |
| 0 | Nonexistent |
| 1 | Scheduled |
| 2 | Active |
| 3 | Expired |
| 4 | Claimed |
| 5 | Cancelled |
| 6 | Returned |

Sender dashboard actions:

- Active or Scheduled: `cancel(giftId)`.
- Expired: `recoverExpired(giftId)`, callable by anyone but always paid to the sender.
- Claimed, Cancelled, Returned: terminal and read-only.

## Event indexing

Index `GiftCreated`, `GiftClaimed`, `GiftCancelled`, and `GiftRecovered`. Always reconcile indexed data against direct contract reads. An indexer is a cache, not the source of truth.

## Failure handling

Decode custom errors from the vault ABI. The UI must provide specific states for unsupported asset, creation paused, locked gift, expired gift, invalid secret, invalid code, insufficient allowance, insufficient token balance, and insufficient ETH for gas.
