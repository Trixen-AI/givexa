# Arcium live-site reference audit

Audited on 2026-08-30 from the live public homepage at `https://www.arcium.com/` using the in-app browser. This document records layout and interaction principles for Givexa. It is a visual reference only: Arcium copy, logos, illustrations, proprietary fonts, and product claims must not be copied.

## Core layout

- Desktop audit viewport: 1440 × 900 CSS pixels.
- Page canvas: white.
- Sticky navigation: 68.8px tall, `rgba(255,255,255,.72)`, subtle border, content aligned to the same 1200px wrapper as the page.
- Primary wrapper: 1200px including 32px horizontal padding, producing 1136px visual panels at x=144px.
- Mobile audit viewport: 390 × 844. The page content area rendered at 375px with 22px gutters and 331px panels.
- Desktop large-panel radius: 32px. Mobile large-panel radius: 18px.
- Large white-space sections use 96–170px vertical breathing room. Visual rhythm alternates dense panels with large calm white sections.

## Typography

- Body family observed: Aeonik Pro with Apple/Helvetica/Arial fallbacks. Givexa uses Inter/system sans to avoid copying a proprietary font.
- Hero H1: 88px / 89.76px, weight 400, letter-spacing -1.76px; centered, max-width about 814px.
- Major desktop section H2: 56px / 57.12px, weight 400, letter-spacing -1.12px, max-width about 622px.
- Mid-size section H2: 40px / 44.8px, weight 400.
- Card H3: 19–22px, weight 500.
- Mobile H1: 40px / 40.8px, letter-spacing -0.8px.
- Mobile major H2: 34px / 34.68px.
- Eyebrows and metadata use a dot-matrix/monospace voice around 10–12px with 0.18–0.22em tracking.

## Color and surfaces

- Primary panel purple observed: `#6d45ff`.
- Gradient highlights: lighter violet at top-left/center fading to the core purple.
- Dark panels: approximately `#0a0a0c`.
- Soft cards: gradient from `#f8f7fc` to `#edebf5`.
- Primary ink: `#000000`; supporting copy is cool gray.
- Purple text highlight is used sparingly inside otherwise black display headings.
- Buttons use 12–14px radii, large click areas, white-on-purple or purple-on-white contrast.

## Homepage sequence observed

1. Sticky header with logo, three navigation groups, language pill, and primary CTA.
2. Purple hero panel with announcement pill, animated monospace category line, two-line display headline, supporting sentence, and two CTAs.
3. Compact marquee of institutional logos on white.
4. Centered white-space thesis section, followed by two equal bento cards.
5. Large 1136 × 700 purple live-network visualization.
6. Centered white-space “how it works” thesis.
7. Large dark product-teaser panel.
8. Ecosystem heading and a soft testimonial/tab panel.
9. Research cards.
10. Large purple token-utility panel with tabbed explanations.
11. Centered white-space security thesis.
12. Large purple build CTA containing nested cards and a lower marquee.
13. Spacious FAQ with horizontal dividers.
14. Full-width dark footer with muted columns and oversized ghost wordmark.

## Motion language

- Hero eyebrow swaps one central term while the surrounding phrase remains stable. Transition combines a small vertical shift, opacity, and blur.
- Logo rails move continuously at a calm, linear speed and pause for reduced-motion users.
- Content enters with short, low-distance fades; motion supports hierarchy rather than decoration.
- Card hover: 2–4px lift with a light shadow or border-color change.
- Accordion: height/opacity transition with rotating caret.
- All repeated motion must honor `prefers-reduced-motion`.

## Givexa adaptation decisions

- Remove the language selector as requested.
- Use the supplied Givexa mark and wordmark in the header/footer.
- Replace institutional logos with the ten supported Givexa Stock Token logos.
- Replace encrypted-compute claims with Givexa’s verified product concepts: programmable Gift Vaults, recipient-first reveal, Robinhood Chain settlement, 0.50% sender-paid creation fee, and verifiable lifecycle.
- Do not display fabricated customers, transaction counts, live price data, contract addresses, or launch status.
- Clearly label the product as in development/private preview wherever a CTA could imply a live contract deployment.
- Preserve the legal distinction: Robinhood Stock Tokens are tokenised debt securities providing economic exposure and do not convey legal or beneficial ownership of underlying securities.
- Keep semantic landmarks, keyboard-operable navigation/dialog/accordion controls, 44px minimum touch targets, visible focus rings, and responsive layouts that do not rely on horizontal scrolling except deliberately labeled rails.
