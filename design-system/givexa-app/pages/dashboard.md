# Dashboard Page Override

> These rules override `../MASTER.md` for `/dashboard`, `/gift/:id`, and `/governance`.

## Direction

- Keep the established Givexa light canvas, purple accent, adaptive navigation, and Inter plus DM Mono typography.
- Use dense but calm information hierarchy. Avoid dark crypto dashboard styling and avoid decorative gradients behind data.
- Use white cards with subtle violet borders. Reserve color for status, focus, and primary actions.
- Use motion only for initial card reveal, refresh indicators, and transaction feedback. Respect `prefers-reduced-motion`.

## Dashboard Components

- Use a persistent left sidebar at desktop widths and a four-item bottom navigation below 900px.
- Every navigation destination uses a Phosphor icon, visible text label, active state, and minimum 44px target.
- Reserve bottom safe-area space so no dashboard or footer content is hidden by mobile navigation.

- Summary cards: four columns on desktop, two on small screens.
- History: semantic card rows that collapse to a two-column mobile card without horizontal overflow.
- Filters: native labeled selects with a minimum 44px target and explicit clear action.
- Empty, loading, partial, and RPC error states must be visible and actionable.
- Status text must never rely on color alone. Every status includes a text label and indicator.
- External transaction and address links must name Blockscout in their accessible label.

## Lifecycle Actions

- Cancel is visually destructive and always requires an accessible confirmation dialog.
- Recover must state that principal always returns to the sender and the caller only pays gas.
- Simulate every contract write before requesting a wallet signature.
- Show pending, confirmed, and error feedback in the same context as the action.

## Privacy Copy

- State clearly that bearer gifts have no recipient address before claim.
- Never imply that pending incoming gifts can be discovered by wallet address.
- Never persist or transmit raw claim secrets from dashboard or governance views.
