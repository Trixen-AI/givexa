# Robinhood Chain mainnet deployment checklist

No mainnet broadcast is authorized until every gate is complete.

## Governance

- [ ] Deploy a Safe with exactly three independent owners and threshold two.
- [ ] Verify each owner controls a hardware-backed signer and has a recovery procedure.
- [ ] Set `GIVEXA_SAFE` to the deployed Safe proxy.
- [ ] Set `GIVEXA_TREASURY` to the approved treasury.
- [ ] Confirm the deployment creates a 48-hour timelock.
- [ ] Confirm the Safe is proposer and canceller; execution is permissionless after delay.
- [ ] Confirm registry, fee controller, and vault ownership ends at the timelock.
- [ ] Confirm the Safe is the vault emergency guardian.

## Assets

- [ ] Download a fresh snapshot from `https://api.robinhood.com/rhj/assets` on deployment day.
- [ ] Verify all 10 assets are `ASSET_STATUS_ACTIVE` on chain ID 4663.
- [ ] Compare the snapshot addresses to `deployments/robinhood-mainnet.assets.json`.
- [ ] Run the fork test against the authenticated production RPC.
- [ ] Record the fork block number.
- [ ] Compute SHA-256 of the reviewed manifest and set `OFFICIAL_ASSET_MANIFEST_HASH`.
- [ ] Stop deployment if any symbol, address, status, decimals, or multiplier check differs.

## Code and security

- [x] Solidity 0.8.36 build passes.
- [x] Runtime bytecode is below EIP-170 limits.
- [x] High and medium Foundry lint passes for `src/` and `script/`.
- [x] Unit and fuzz tests pass.
- [x] Solvency and liability invariants pass.
- [x] Robinhood mainnet fork metadata test passes for 10 assets.
- [x] Full no-broadcast deployment simulation passes on chain ID 4663.
- [x] Production-source coverage: 97.70% lines, 94.76% statements, 85.71% branches, 100% functions.
- [ ] Independent smart-contract review completed with no unresolved high or medium findings.
- [ ] Compliance design decision from `SECURITY.md` approved.
- [ ] Frontend secret-handling review completed.

## Broadcast controls

- [ ] Use a fresh, minimally funded deployment wallet.
- [ ] Load secrets only from the operator's secure environment.
- [ ] Confirm `git status` contains no secrets, broadcast artifacts, or private RPC URL.
- [ ] Run production script once without `--broadcast` using exact production environment values.
- [ ] Have a second operator compare predicted addresses, constructor values, bytecode hashes, and role grants.
- [ ] Record written approval for `--broadcast`.
- [ ] Broadcast once and preserve transaction hashes.
- [ ] Verify source code on Blockscout.
- [ ] Re-read every owner, guardian, fee, treasury, asset, role, and timelock value from chain.
- [ ] Execute a low-value end-to-end gift before public availability.

## Current manifest

Current reviewed file SHA-256:

`0x7d58d519a1f52aa96d5031bb4cbbafed57cace8740715633c319afe2cf8c8ea9`

This hash becomes stale whenever the manifest changes or deployment-day RHJ data differs.
