# Givexa Mainnet Smoke Test

## Safety boundary

Every approval, create, claim, cancel, or recovery step is a real financial transaction. A human wallet owner must review the selected token, principal, protocol fee, gas, recipient wallet, and contract address before confirmation. Automation must not broadcast these steps.

Use the smallest economically valid amount accepted by the selected Stock Token and current issuer rules. Keep enough Robinhood Chain ETH in each test wallet for gas.

## Preconditions

- Production frontend points to Robinhood Chain ID 4663.
- Reown project ID is domain-allowlisted for the production host.
- Browser RPC credential is restricted by origin and rate limit.
- `corepack pnpm check`, Foundry unit tests, invariant tests, governance tests, and fork tests pass.
- `corepack pnpm monitor:mainnet` passes.
- Two test wallets are eligible for the selected Stock Token.
- The claim link can be transferred through an approved private channel.

## Create and claim

1. Connect the sender wallet and confirm chain ID 4663.
2. Select one allowlisted asset and the smallest valid test principal.
3. Confirm the displayed fee matches the Fee Controller quote.
4. Approve only the exact total required by the Gift Vault flow.
5. Create an immediate gift and wait for a successful receipt.
6. Save the gift ID, approval transaction, creation transaction, and private claim link in the restricted test record. Never place the link in a public ticket or chat.
7. Open the claim link in a separate browser profile.
8. Connect the recipient wallet, complete eligibility confirmations, simulate, and claim.
9. Verify the recipient token balance increased by the exact principal.
10. Verify Gift Vault status is Claimed and the dashboard links to the correct Blockscout transactions.

## Cancel

1. Create a second small gift.
2. Open its public detail page from the sender dashboard.
3. Review the cancellation dialog and confirm with the sender wallet.
4. Verify status is Cancelled, the sender balance is restored by the principal, and the private claim fails without moving funds.

## Expiry recovery

The contract minimum expiry is seven days. Test timestamp advancement on a Robinhood Chain fork before release. A mainnet recovery smoke check may only use a deliberately created gift after its real expiry window.

1. Confirm status is Expired.
2. Trigger recovery from any funded wallet.
3. Verify the caller only pays gas.
4. Verify the principal returns to the original sender.
5. Verify status is Returned and a subsequent claim, cancel, or recovery fails.

## Wrong-network and failure checks

- Connect on another EVM network and verify the UI offers an explicit Robinhood Chain switch.
- Reject an approval and verify no creation transaction is sent.
- Attempt an amount above balance and verify simulation blocks submission.
- Use an invalid claim secret and Claim Code only on a local fork. Never leak a valid mainnet secret into logs.
- Verify a paused contract blocks creation while existing claim, cancel, and recovery remain accessible.

## Completion record

Record date, release version, browser and device, wallet applications, asset, public gift IDs, transaction hashes, expected and actual balances, monitor output hash, and reviewer sign-off. Exclude private claim links, secrets, recovery phrases, and RPC credentials.

