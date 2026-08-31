# Givexa Security and Operations

## Production boundary

Givexa uses the deployed Robinhood Chain contracts as its source of truth. The web application reads public events and contract state directly. It does not operate an application backend, custody service, admin signer, or claim-secret database.

Never place a deployer key, Safe owner key, treasury key, WalletConnect relay secret, or unrestricted RPC credential in frontend variables. Frontend variables prefixed with `VITE_` are public by design.

## Governance model

- Governance and treasury Safe: `0x9E4432C98321dAB22bF78cEd55800F0F5B893802`
- Required Safe posture: 2 approvals from 3 unique owners
- Timelock: `0x152Cd038Aee65F2Ca4F362b8E9069477C8AAEC03`
- Minimum delay: 172,800 seconds, equal to 48 hours
- Gift Vault guardian: governance Safe
- Gift Vault, Asset Registry, and Fee Controller owner: Timelock
- Timelock proposer and canceller: governance Safe
- Timelock executor: permissionless

The guardian may pause creation immediately through an approved Safe transaction. Existing claim, cancel, and recovery actions remain available. Unpause and configurable protocol changes pass through the Timelock.

## Continuous read-only monitor

Run:

```powershell
$env:ROBINHOOD_RPC_URL = "https://your-browser-safe-provider"
corepack pnpm monitor:mainnet
```

Optional baselines:

```powershell
$env:GIVEXA_EXPECTED_FEE_BPS = "50"
$env:GIVEXA_ALLOW_CREATION_PAUSED = "false"
```

The monitor never requests a signer and never sends a transaction. It fails closed when the RPC is unavailable or an expected contract read cannot be completed. It checks:

- Chain ID and latest block
- Runtime bytecode for all protocol contracts, Safe, and ten assets
- Timelock ownership and 48-hour delay
- Safe threshold, owner count, and owner uniqueness
- Guardian and treasury routing
- Fee baseline and immutable fee cap
- Gift creation pause state
- Registry support, symbol, decimals, UI multiplier, and provenance for all ten assets
- Timelock roles and permissionless execution

The scheduled workflow in `.github/workflows/mainnet-monitor.yml` can run this check every 15 minutes. Add `ROBINHOOD_RPC_URL` as a repository Actions secret. A failed workflow is an alert and must be reviewed by the on-call owner.

## Alert priorities

### Priority 0

- Unexpected runtime bytecode or missing contract code
- Ownership no longer held by the Timelock
- Safe no longer has exactly 2-of-3 configuration
- Treasury or guardian changed unexpectedly
- Asset allowlist or provenance changed without an approved Timelock operation

Pause new gift creation through the Safe, preserve claim and recovery access, and start the incident response runbook.

### Priority 1

- Fee differs from the approved baseline
- Timelock delay or roles differ from the approved model
- Creation is paused without an active incident or maintenance record

Compare the observed transaction with the Safe proposal and Timelock operation before updating a baseline.

### Priority 2

- RPC unavailable
- Monitor delayed or scheduled workflow failed before reads completed

Retry through an independent provider and inspect Blockscout before declaring an onchain incident.

## Audit requirement

The existing tests and monitoring are not a substitute for an independent audit. Before raising production limits or promoting significant volume, commission an external review of the exact deployed source, compiler configuration, deployment manifest, asset provenance, governance roles, and frontend claim-secret handling. Record the audit commit, report hash, remediation status, and accepted residual risks.

## Key operations

- Keep three Safe owners on independently secured hardware wallets.
- Do not store two owner recovery phrases in the same physical or cloud location.
- Exercise Safe signing and Timelock scheduling on a fork before every production change.
- Record proposal purpose, expected calldata, simulation, reviewers, execution window, and resulting transaction hashes.
- Rotate an owner only through an explicit Safe proposal reviewed by the other owners.

