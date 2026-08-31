import { ArrowLeft, ArrowRight, ArrowSquareOut, CheckCircle, Copy, LinkSimple, LockKey, ShieldCheck, Wallet, XLogo } from '@phosphor-icons/react'
import { BrandLogo } from '../../components/BrandLogo.jsx'
import { BLOCK_EXPLORER_URL, CONTRACTS, ROBINHOOD_CHAIN_ID, SUPPORTED_ASSETS } from '../../config/deployment.js'

const steps = [
  ['01', 'Connect', 'Connect an EVM wallet through Reown and switch to Robinhood Chain.'],
  ['02', 'Choose an asset', 'Select one of the ten verified Stock Token contracts and enter the gift principal.'],
  ['03', 'Approve', 'Approve only the amount Givexa needs to fund the Gift Vault.'],
  ['04', 'Create', 'Review principal, protocol fee, unlock time, expiry, and network gas before signing.'],
  ['05', 'Share', 'Send the private claim URL. Its secret remains in the URL fragment and is never sent to a server.'],
  ['06', 'Claim', 'The recipient connects a wallet and claims the full principal from the verified contract.'],
]

const contracts = [
  ['Gift Vault', CONTRACTS.giftVault],
  ['Asset Registry', CONTRACTS.assetRegistry],
  ['Fee Controller', CONTRACTS.feeController],
  ['Timelock', CONTRACTS.timelock],
  ['Treasury Safe', CONTRACTS.treasurySafe],
]

function ExternalLink({ href, children }) {
  return <a className="inline-flex min-h-11 items-center gap-2 font-semibold text-givexa-600 hover:text-givexa-700" href={href} target="_blank" rel="noreferrer">{children}<ArrowSquareOut size={16} /></a>
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#faf9fc] text-[#121015]">
      <a className="skip-link" href="#docs-main">Skip to documentation</a>
      <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-[22px] md:px-8">
          <BrandLogo />
          <nav className="flex items-center gap-2" aria-label="Documentation navigation">
            <a className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold hover:bg-black/[0.04]" href="/"><ArrowLeft size={17} /> Home</a>
            <a className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-givexa-500 px-4 text-[13px] font-semibold text-white" href="/app">Open app <ArrowRight size={17} /></a>
          </nav>
        </div>
      </header>

      <main id="docs-main">
        <section className="border-b border-black/[0.08] bg-white">
          <div className="mx-auto max-w-[1200px] px-[22px] py-20 md:px-8 md:py-28">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-givexa-500">Givexa documentation</p>
            <h1 className="mt-5 max-w-[850px] text-[clamp(44px,7vw,76px)] font-normal leading-[1.01] tracking-[-0.05em]">Give tokenized assets through a private claim link.</h1>
            <p className="mt-7 max-w-[720px] text-base leading-relaxed text-[#68636e] md:text-lg">Givexa is a non-custodial interface for creating, claiming, cancelling, and recovering funded Gift Vaults on Robinhood Chain.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-givexa-500 px-5 font-semibold text-white" href="/app">Create a gift <ArrowRight size={18} /></a>
              <ExternalLink href={`${BLOCK_EXPLORER_URL}/address/${CONTRACTS.giftVault}`}>Verified contract</ExternalLink>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-[22px] py-20 md:px-8 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b8591]">On this page</p>
              <nav className="mt-5 grid gap-1 text-sm" aria-label="Documentation sections">
                {['Quick start', 'How gifts work', 'Contracts', 'Supported assets', 'Security'].map((label) => <a className="min-h-11 rounded-lg px-3 py-3 hover:bg-white hover:text-givexa-600" href={`#${label.toLowerCase().replaceAll(' ', '-')}`} key={label}>{label}</a>)}
              </nav>
            </aside>

            <div className="min-w-0 space-y-24">
              <section id="quick-start">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-givexa-500">Quick start</p>
                <h2 className="mt-4 text-[clamp(34px,5vw,50px)] font-normal tracking-[-0.045em]">From Stock Token to claim link.</h2>
                <div className="mt-10 grid gap-3 sm:grid-cols-2">{steps.map(([number, title, copy]) => <article className="rounded-2xl border border-black/[0.08] bg-white p-6" key={number}><span className="font-mono text-[9px] text-givexa-500">{number}</span><h3 className="mt-7 text-xl font-semibold">{title}</h3><p className="mt-3 text-[13px] leading-relaxed text-[#6d6873]">{copy}</p></article>)}</div>
              </section>

              <section id="how-gifts-work">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-givexa-500">How gifts work</p>
                <h2 className="mt-4 text-[clamp(34px,5vw,50px)] font-normal tracking-[-0.045em]">The contract holds the asset. The link holds the secret.</h2>
                <div className="mt-9 grid gap-4 md:grid-cols-3">
                  {[[Wallet, 'Sender funded', 'The selected principal and creation fee are shown before the wallet signs.'], [LinkSimple, 'Private handoff', 'Only the secret hash is stored onchain. The raw secret stays in the claim link fragment.'], [CheckCircle, 'Recipient owned', 'A valid claim transfers the full principal directly to the recipient wallet.']].map(([Icon, title, copy]) => <article className="rounded-2xl bg-[#121015] p-6 text-white" key={title}><Icon className="text-[#a98cff]" size={30} weight="duotone" /><h3 className="mt-12 text-xl font-semibold">{title}</h3><p className="mt-3 text-[13px] leading-relaxed text-white/60">{copy}</p></article>)}
                </div>
              </section>

              <section id="contracts">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-givexa-500">Mainnet contracts</p>
                <h2 className="mt-4 text-[clamp(34px,5vw,50px)] font-normal tracking-[-0.045em]">Verified deployment on chain {ROBINHOOD_CHAIN_ID}.</h2>
                <div className="mt-9 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">{contracts.map(([label, address]) => <div className="grid gap-2 border-b border-black/[0.07] p-5 last:border-0 md:grid-cols-[180px_1fr_auto] md:items-center" key={label}><strong className="text-sm">{label}</strong><code className="overflow-hidden text-ellipsis text-[11px] text-[#6e6875]">{address}</code><ExternalLink href={`${BLOCK_EXPLORER_URL}/address/${address}`}>Blockscout</ExternalLink></div>)}</div>
              </section>

              <section id="supported-assets">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-givexa-500">Supported assets</p>
                <h2 className="mt-4 text-[clamp(34px,5vw,50px)] font-normal tracking-[-0.045em]">Ten canonical Stock Token contracts.</h2>
                <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{SUPPORTED_ASSETS.map((asset) => <a className="rounded-2xl border border-black/[0.08] bg-white p-4 transition hover:border-givexa-500/50" href={`${BLOCK_EXPLORER_URL}/token/${asset.address}`} target="_blank" rel="noreferrer" key={asset.address}><img className="h-11 w-11 rounded-xl object-contain" src={`/stocks/${asset.symbol}.webp`} alt="" width="44" height="44" loading="lazy" /><strong className="mt-8 block">{asset.symbol}</strong><span className="mt-1 block truncate text-[11px] text-[#77717e]">{asset.name}</span></a>)}</div>
              </section>

              <section id="security" className="rounded-[24px] bg-[#6d45ff] p-7 text-white md:p-10">
                <div className="flex items-center gap-3"><ShieldCheck size={30} weight="duotone" /><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">Security model</p></div>
                <h2 className="mt-8 text-[clamp(34px,5vw,50px)] font-normal tracking-[-0.045em]">Keep the claim URL private.</h2>
                <p className="mt-5 max-w-[720px] text-sm leading-relaxed text-white/75">Anyone holding an unprotected claim link can submit its secret. Optional Claim Code protection adds a separate factor. Givexa never asks for a seed phrase or private key.</p>
                <div className="mt-8 flex flex-wrap gap-5"><span className="inline-flex items-center gap-2"><LockKey /> Secret generated locally</span><span className="inline-flex items-center gap-2"><Copy /> Share once, store safely</span></div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#09090b] text-white/55">
        <div className="mx-auto max-w-[1200px] px-[22px] py-12 md:px-8 md:py-16">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <BrandLogo inverse />
              <p className="mt-5 max-w-[430px] text-[13px] leading-relaxed text-white/45">Documentation for creating, sharing, claiming, cancelling, and recovering Gift Vaults on Robinhood Chain.</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2" aria-label="Documentation footer navigation">
              <a className="inline-flex min-h-11 items-center rounded-xl px-4 text-[13px] font-semibold transition hover:bg-white/[0.07] hover:text-white" href="/">Main website</a>
              <a className="inline-flex min-h-11 items-center rounded-xl px-4 text-[13px] font-semibold transition hover:bg-white/[0.07] hover:text-white" href="/app">Open app</a>
              <a className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 transition hover:border-white/25 hover:bg-white/[0.07] hover:text-white" href="https://x.com/Givexa_xyz" target="_blank" rel="noreferrer" aria-label="Follow Givexa on X" title="Follow Givexa on X"><XLogo size={18} /></a>
            </nav>
          </div>
          <div className="flex flex-col gap-3 pt-7 text-[10px] leading-relaxed text-white/35 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Givexa. All rights reserved.</p>
            <p>Robinhood Chain · Chain ID {ROBINHOOD_CHAIN_ID}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
