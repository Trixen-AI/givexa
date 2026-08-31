# Givexa Incident Response

## Objectives

Protect funded gifts, preserve claim and return paths, stop unsafe new creation, and keep an auditable record of every decision.

## Roles

- Incident lead: coordinates severity, communication, and evidence.
- Safe signers: independently verify calldata and approve emergency actions.
- Technical responder: validates contract state through at least two RPC providers and Blockscout.
- Communications owner: publishes only confirmed facts and never exposes bearer claim links.

## Immediate response

1. Confirm the alert through `corepack pnpm monitor:mainnet` using a second RPC provider.
2. Save the JSON monitor output, affected block numbers, and relevant Blockscout links.
3. If new gift creation may increase exposure, have two Safe owners verify and submit `pauseCreation()` to the Gift Vault.
4. Confirm that `creationPaused()` is true onchain and that the application blocks creation.
5. Verify that claim, cancel, and `recoverExpired` remain callable. Do not disable access to existing gifts unless the contract itself requires it.
6. Do not rotate keys, update allowlists, change fees, or unpause during initial triage unless the action addresses a verified threat and follows the authorized governance path.

## Investigation checklist

- Identify the first affected block and transaction.
- Compare contract code and ownership with `contracts/deployments/robinhood-mainnet.json`.
- Compare Safe owners and threshold with the approved 2-of-3 configuration.
- Review recent Safe proposals and Timelock operations.
- Check treasury, guardian, fee, registry support, and provenance.
- Determine whether the issue is contract state, frontend supply chain, RPC integrity, issuer asset state, or user key compromise.
- Never request or collect a raw bearer secret from a user. Reproduce claim-link issues with a newly created test gift.

## Recovery

1. Produce a remediation and a fork simulation using the exact incident block.
2. Obtain independent technical review for any protocol configuration change.
3. Submit the required Safe proposal.
4. Queue owner-controlled changes through the 48-hour Timelock.
5. Monitor the entire delay window and verify calldata again before execution.
6. Run Foundry tests, frontend checks, the mainnet monitor, and the smoke checklist.
7. Unpause only through the authorized Timelock path after exit criteria are signed off.

## Exit criteria

- Root cause documented
- Funded gifts reconciled with `totalEscrowed` and token balances
- All monitor checks pass against two providers
- Safe is 2-of-3 and protocol ownership remains Timelocked
- Frontend production build and tests pass
- Remediation reviewed independently
- User communication published with confirmed scope and no claim secrets

## Post-incident record

Record timeline, affected transactions, financial impact, containment, remediation, reviewer approvals, monitoring changes, and follow-up owners. Store hashes for evidence files and published reports.

