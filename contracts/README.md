# Givexa smart contracts

Production-oriented, non-upgradeable smart contracts for bearer Stock Token gifts on Robinhood Chain mainnet.

## Contracts

- `GivexaGiftVaultV1`: creates, claims, cancels, and recovers token gifts.
- `GivexaAssetRegistryV1`: timelock-governed Stock Token allowlist.
- `GivexaFeeControllerV1`: 0.50% sender-paid creation fee, capped at 1.00%.
- OpenZeppelin `TimelockController`: 48-hour delay for administrative changes.

The emergency guardian may pause only new gift creation. Claims, sender cancellation, and expired-gift recovery remain available. The vault tracks liabilities per token and permits governance to sweep only balances above those liabilities.

## Pinned toolchain

- Solidity 0.8.36
- Foundry 1.7.1
- OpenZeppelin Contracts 5.6.1
- forge-std 1.16.2

Compiler optimization, IR compilation, fuzzing, and invariant parameters are pinned in `foundry.toml`.

## Local quality gates

```powershell
forge fmt --check
forge build --sizes
forge lint src --severity high med -D warnings
forge lint script --severity high med -D warnings
forge test -vv
forge coverage --ir-minimum --exclude-tests --no-match-coverage '^(script|test)[/\\]' --report summary
```

## Robinhood mainnet fork test

`alchemy.env` contains only the private HTTPS RPC URL and is ignored by git.

```powershell
$givexaRpc = (Get-Content -Raw .\alchemy.env).Trim()
$env:ROBINHOOD_MAINNET_RPC_URL = $givexaRpc
forge test --match-contract RobinhoodMainnetForkTest -vv
```

The fork test verifies chain ID 4663 and all 10 concept assets for deployed bytecode, symbol, 18 decimals, and a nonzero `uiMultiplier()`.

## Mainnet deployment dry run

This command does not contain `--broadcast`, so no transaction is submitted:

```powershell
$givexaRpc = (Get-Content -Raw .\alchemy.env).Trim()
forge script script/DryRunRobinhoodMainnet.s.sol:DryRunRobinhoodMainnet --fork-url $givexaRpc -vv
```

## Production deployment

Do not run this until every item in `DEPLOYMENT_CHECKLIST.md` is signed off. The production script intentionally requires a real deployer key, a deployed 2-of-3 Safe, treasury, chain ID 4663, and an approved current asset-manifest hash. It re-checks all token metadata before broadcasting.

```powershell
forge script script/DeployGivexa.s.sol:DeployGivexa `
  --rpc-url $env:ROBINHOOD_MAINNET_RPC_URL `
  --broadcast `
  --verify `
  --verifier blockscout `
  --verifier-url https://robinhoodchain.blockscout.com/api/
```

No production deployment has been broadcast from this workspace.

## Integration

See `APP_INTEGRATION.md` for ABI locations, secret handling, status mapping, and the exact approve/create/claim flows. See `SECURITY.md` before connecting any user-facing application.
