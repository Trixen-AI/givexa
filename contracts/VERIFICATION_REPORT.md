# Verification report

Verified on 2026-08-31 Asia/Jakarta against Robinhood Chain mainnet chain ID 4663.

## Result

All local and fork-based technical gates passed. No transaction was broadcast.

| Gate | Result |
| --- | --- |
| Solidity 0.8.36 production build | Pass |
| Runtime and initcode size limits | Pass |
| Foundry high and medium lint for `src/` | Pass |
| Foundry high and medium lint for `script/` | Pass |
| Unit, negative-path, fuzz, governance, fork, and invariant tests | 30 passed, 0 failed |
| Fuzz cases | 2,000 passed |
| Invariant calls | 32,768 passed with 0 reverts |
| Production source line coverage | 97.70% |
| Production source statement coverage | 94.76% |
| Production source branch coverage | 85.71% |
| Production source function coverage | 100% |
| Robinhood mainnet fork asset verification | 10 of 10 passed |
| Full deployment simulation | Pass, no broadcast |

## Fork evidence

The authenticated Alchemy endpoint from `alchemy.env` was loaded only into the process environment and redacted from command output. The final fork test ran at block 50,212,939. It verified bytecode, expected symbol, 18 decimals, and nonzero `uiMultiplier()` for NVDA, AAPL, TSLA, MSFT, AMZN, GOOGL, META, SPY, QQQ, and GLD.

The reviewed asset manifest is `deployments/robinhood-mainnet.assets.json`. Its current SHA-256 is:

`0x7d58d519a1f52aa96d5031bb4cbbafed57cace8740715633c319afe2cf8c8ea9`

## Simulated deployment wiring

- Initial fee: 50 basis points.
- Maximum fee: 100 basis points.
- Timelock delay: 48 hours.
- Safe role: proposer, canceller, and emergency guardian.
- Timelock role: owner of registry, fee controller, and vault.
- Executor role: permissionless after the timelock delay.
- Registered assets: 10.

Addresses printed by a dry run are ephemeral simulation addresses and must never be used by the app.

## Remaining external launch gates

Technical tests cannot substitute for:

1. A deployed 2-of-3 Safe with three approved signer addresses.
2. An approved treasury address.
3. Independent smart-contract review with no unresolved high or medium findings.
4. A signed compliance decision on app-only eligibility controls versus an onchain attestation module.
5. Explicit operator approval before the one-time mainnet broadcast.

Until those gates are complete, `DeployGivexa.s.sol` intentionally fails closed and the application must not use any dry-run address.
