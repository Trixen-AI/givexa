# Givexa

Production React and Vite frontend for Givexa, the gifting layer for tokenized markets on Robinhood Chain. The repository includes the marketing website, Reown AppKit wallet integration, complete gift lifecycle flows, a direct-chain user dashboard, read-only governance visibility, and the verified Foundry contract suite.

## Application routes

- `/` marketing website
- `/docs` public product, contract, asset, and security documentation
- `/app` Create Gift flow
- `/claim` private-link entry flow
- `/claim/:giftId#gvx=...` recipient reveal and claim flow
- `/dashboard` direct-chain wallet history and filters
- `/gift/:giftId` public Gift Vault detail, sender cancellation, and expired recovery
- `/governance` read-only Safe, Timelock, fee, pause, and allowlist posture

The claim secret is encoded in the URL fragment. Browsers do not include fragments in HTTP requests, so the bearer secret is not sent to the web host. It is hashed before gift creation, never logged, and must never be moved into a query parameter or pathname.

## Local setup

Use Node.js 22 or newer and pnpm 11.

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Configure these public browser values in `.env.local`:

```dotenv
VITE_REOWN_PROJECT_ID=your_public_reown_project_id
VITE_ROBINHOOD_RPC_URL=https://your-browser-restricted-robinhood-chain-rpc
VITE_PUBLIC_APP_URL=https://givexa.xyz
```

Frontend variables are included in the browser bundle. Never put a deployer key, wallet private key, Safe signer key, server credential, or unrestricted provider credential in a `VITE_` variable.

## Quality gates

```bash
pnpm lint
pnpm test
pnpm build
```

`pnpm check` runs all three checks. The optimized output is generated in `dist/`. Wallet dependencies are route-split and only downloaded on application routes.

## Hosting requirements

The host must serve `index.html` for `/docs`, `/app`, `/claim`, `/claim/*`, `/dashboard`, `/gift/*`, and `/governance` so direct navigation works. Keep HTTPS enabled and apply a restrictive Content Security Policy appropriate for Reown, the selected RPC provider, and the application domain.

For Netlify, `netlify.toml` already defines the production build, `dist` publish directory, SPA fallback, immutable asset caching, and baseline security headers. Add these environment variables in Netlify under Site configuration > Environment variables:

```text
VITE_REOWN_PROJECT_ID
VITE_ROBINHOOD_RPC_URL
VITE_PUBLIC_APP_URL
```

Restrict the Reown project and RPC credential to the final Netlify and custom domains before public launch.

Recommended baseline headers:

```text
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Do not add marketing or session analytics that capture full URLs on claim routes. If observability is added, strip hashes and redact wallet addresses, gift messages, secrets, and Claim Codes.

## Contract integration

Robinhood Chain ID: `4663`

- Gift Vault: `0x82d477c00e1D8DC784aE87a71Ffa2C56Ad2626E9`
- Asset Registry: `0x3DbcD81aC7cAE53B11be7490fEc2ADf71EBDaceA`
- Fee Controller: `0x06b04449166FF138FEdcdc894636c8986444aD55`
- Timelock: `0x152Cd038Aee65F2Ca4F362b8E9069477C8AAEC03`
- Treasury Safe: `0x9E4432C98321dAB22bF78cEd55800F0F5B893802`

The frontend performs contract reads, allowance checks, transaction simulation, wallet confirmation, and receipt confirmation before reporting success. The sender pays the current onchain creation fee. The recipient receives the full principal and pays Robinhood Chain gas in ETH.

The dashboard does not use a Givexa backend. It retrieves public lifecycle events from the Robinhood Chain Blockscout API, waits for two confirmations, removes duplicate logs, and verifies current Gift Vault snapshots directly through the configured RPC. This avoids provider-specific `eth_getLogs` block-range limits while keeping state verification onchain. Because a bearer gift has no recipient address before claim, pending incoming gifts remain private in their claim links and appear as received only after claim.

## Operations

Run the read-only production monitor with a public RPC environment variable:

```bash
ROBINHOOD_RPC_URL=https://your-provider pnpm monitor:mainnet
```

The monitor never requests a signer and never broadcasts. Operational references:

- `docs/SECURITY_OPERATIONS.md`
- `docs/INCIDENT_RESPONSE.md`
- `docs/MAINNET_SMOKE_TEST.md`
- `.github/workflows/mainnet-monitor.yml`

## Structure

- `src/App.jsx` marketing site and lazy dApp route boundary
- `src/features/docs/` public product and protocol documentation
- `src/features/gifts/` Create, claim, detail, cancel, and recovery flows
- `src/features/dashboard/` backendless user dashboard with Blockscout event discovery and onchain state verification
- `src/features/governance/` separate read-only governance status page
- `src/web3/` Reown configuration, chain definition, ABI, event history, gift-link security, and error handling
- `src/config/deployment.js` verified deployment addresses and supported asset manifest
- `src/styles.css` shared responsive design system
- `public/stocks/` ten supported Stock Token logo assets
- `contracts/` verified Foundry smart contract project and tests
- `design-system/givexa-app/MASTER.md` persisted UI/UX Pro Max guidance
- `design-system/givexa-app/pages/dashboard.md` dashboard-specific UI/UX override

## Product and compliance boundaries

Stock Tokens are tokenised debt securities issued by Robinhood Assets (Jersey) Limited. They provide economic exposure and do not grant legal or beneficial ownership of underlying securities. Availability is jurisdiction-dependent.

The claim UI includes adult and restricted-jurisdiction declarations from the supplied product concept. This repository intentionally has no application backend. Before unrestricted public distribution, deploy an independently reviewed hosting-edge or specialist compliance control for IP/geolocation, sanctions, and current issuer asset-level eligibility. Client-side declarations alone are not a substitute for those controls. Until then, distribution must remain limited to a controlled eligible audience.
