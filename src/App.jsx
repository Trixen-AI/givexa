import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight, ArrowUpRight, CalendarBlank, CaretDown, Check, ClockCountdown, Gift,
  GlobeHemisphereWest, List, LockKey, PaperPlaneTilt, Receipt, ShieldCheck, Sparkle,
  Vault, Wallet, X, XLogo,
} from '@phosphor-icons/react'
import { BrandLogo } from './components/BrandLogo.jsx'
import { AssetGlobe } from './components/AssetGlobe.jsx'

const GiftApplicationRoot = lazy(() => import('./features/gifts/GiftApplicationRoot.jsx'))
const DocsPage = lazy(() => import('./features/docs/DocsPage.jsx'))

function isGiftApplicationRoute(pathname = window.location.pathname) {
  return pathname === '/app' || pathname === '/app/'
    || pathname === '/dashboard' || pathname === '/dashboard/'
    || pathname === '/governance' || pathname === '/governance/'
    || /^\/gift(?:\/.*)?\/?$/u.test(pathname)
    || /^\/claim(?:\/\d+)?\/?$/u.test(pathname)
}

const assets = [
  ['NVDA', 'NVIDIA'], ['AAPL', 'Apple'], ['TSLA', 'Tesla'], ['MSFT', 'Microsoft'], ['AMZN', 'Amazon'],
  ['GOOGL', 'Alphabet'], ['META', 'Meta'], ['SPY', 'S&P 500 ETF'], ['QQQ', 'Nasdaq 100 ETF'], ['GLD', 'Gold Trust'],
]

const heroTerms = ['MARKET', 'ASSET', 'RWA']
const flowSteps = [
  { number: '01', title: 'Choose', copy: 'Select a supported Stock Token, amount, message, and claim rules.', icon: Sparkle },
  { number: '02', title: 'Fund', copy: 'Fund an isolated Gift Vault on Robinhood Chain from your wallet.', icon: Vault },
  { number: '03', title: 'Send', copy: 'Share the private claim link anywhere. No wallet address is needed first.', icon: PaperPlaneTilt },
  { number: '04', title: 'Reveal', copy: 'The recipient sees who sent it, what it is, and what happens next.', icon: Gift },
  { number: '05', title: 'Claim', copy: 'They connect an existing EVM wallet and submit the claim transaction.', icon: Wallet },
  { number: '06', title: 'Own', copy: 'The full gift principal moves directly to the claiming wallet.', icon: Check },
]

const giftModes = [
  { id: 'instant', number: '01', label: 'Instant', title: 'Ready when they are.', copy: 'Fund it, send the private link, and let the recipient claim immediately.', note: 'Claimable after funding', icon: Gift },
  { id: 'scheduled', number: '02', label: 'Scheduled', title: 'Make the moment count.', copy: 'Set a future unlock for a birthday, graduation, or milestone.', note: 'Up to 365 days ahead', icon: CalendarBlank },
  { id: 'protected', number: '03', label: 'Protected', title: 'Add a second layer.', copy: 'Pair the gift link with a separate Givexa-generated Claim Code.', note: 'Optional claim protection', icon: LockKey },
]

const feeModes = [
  { id: 'create', number: '01', label: 'Create', value: '0.50%', title: 'Sender-paid creation fee', copy: 'The sender funds the selected principal, the Givexa protocol fee, and Robinhood Chain gas.' },
  { id: 'claim', number: '02', label: 'Claim', value: '0%', title: 'No Givexa claim fee', copy: 'The recipient receives the full gift principal and only pays the network gas required to claim.' },
  { id: 'recover', number: '03', label: 'Recover', value: '0%', title: 'No cancellation or recovery fee', copy: 'Unclaimed principal can only return to the original sender under the configured lifecycle rules.' },
]

const faqItems = [
  ['What is Givexa?', 'Givexa is the gifting layer for tokenized markets. It turns supported tokenized real-world assets, such as Robinhood Stock Tokens, into private claimable gifts.'],
  ['Does the recipient need a Givexa account?', 'No. The recipient uses an existing EVM wallet through Reown AppKit / WalletConnect and pays the Robinhood Chain network fee in ETH.'],
  ['Are Stock Tokens the same as owning shares?', 'No. The launch assets are tokenised debt securities issued by Robinhood Assets (Jersey) Limited that provide economic exposure to underlying securities. They do not grant legal or beneficial ownership of those securities.'],
  ['What happens if a gift is not claimed?', 'The sender can cancel any unclaimed gift. After expiry, recovery can be triggered, but the principal can only return to the original sender.'],
  ['How much does Givexa cost?', 'The sender pays a 0.50% protocol creation fee plus network gas. Givexa charges no claim, cancellation, or recovery fee.'],
  ['Where is Givexa available?', 'Givexa is intended for eligible adults in permitted jurisdictions. Asset-level and geographic eligibility is checked at claim time, subject to current issuer disclosures.'],
]

const ease = [0.16, 1, 0.3, 1]

function Eyebrow({ children, light = false }) {
  return <p className={`mb-7 font-mono text-[10px] font-medium uppercase tracking-[0.22em] ${light ? 'text-white/70' : 'text-givexa-500'}`}>{children}</p>
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduceMotion = useReducedMotion()
  return <Motion.div className={className} initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.65, delay, ease }}>{children}</Motion.div>
}

function Header() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-black/[0.07] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-[22px] md:px-8">
        <BrandLogo />
        <nav className="hidden items-center gap-10 md:flex" aria-label="Primary navigation">
          <a className="group inline-flex min-h-11 items-center gap-1 text-[15px] font-medium transition-colors hover:text-givexa-600" href="#product">Products <CaretDown className="h-3 w-3 transition-transform group-hover:rotate-180" /></a>
          <a className="group inline-flex min-h-11 items-center gap-1 text-[15px] font-medium transition-colors hover:text-givexa-600" href="#network">Network <CaretDown className="h-3 w-3 transition-transform group-hover:rotate-180" /></a>
          <a className="inline-flex min-h-11 items-center text-[15px] font-medium transition-colors hover:text-givexa-600" href="/docs">Docs</a>
          <a className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] text-[#302c36] transition-colors hover:border-givexa-500/30 hover:bg-givexa-50 hover:text-givexa-600" href="https://x.com/Givexa_xyz" target="_blank" rel="noreferrer" aria-label="Follow Givexa on X" title="Follow Givexa on X"><XLogo size={18} /></a>
        </nav>
        <a className="hidden min-h-11 items-center gap-2 rounded-[11px] bg-givexa-500 px-5 text-[13px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-givexa-600 md:inline-flex" href="/app">Get started <ArrowUpRight weight="bold" /></a>
        <button className="grid h-10 w-10 place-items-center rounded-[11px] border border-black/10 bg-white md:hidden" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <List />}</button>
      </div>
      <AnimatePresence>
        {open && <Motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="absolute left-3 right-3 top-[60px] grid gap-1 rounded-2xl border border-black/10 bg-white p-3 shadow-2xl md:hidden" aria-label="Mobile navigation">
          {[['Products', '#product'], ['Network', '#network'], ['Docs', '/docs']].map(([label, href]) => <a className="flex min-h-12 items-center justify-between rounded-xl px-3 font-medium hover:bg-givexa-50" href={href} key={href} onClick={() => setOpen(false)}>{label}<ArrowRight /></a>)}
          <a className="flex min-h-12 items-center justify-between rounded-xl px-3 font-medium hover:bg-givexa-50" href="https://x.com/Givexa_xyz" target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Follow on X <XLogo /></a>
          <a className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-givexa-500 px-5 font-semibold text-white" href="/app" onClick={() => setOpen(false)}>Get started <ArrowRight /></a>
        </Motion.nav>}
      </AnimatePresence>
    </header>
  )
}

function StockRail() {
  const reduceMotion = useReducedMotion()
  return (
    <div className="py-8 md:py-10" aria-label="Supported Givexa Stock Tokens">
      <p className="mb-6 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-[#8b8792] md:text-[10px]">Supported Stock Tokens</p>
      <div className="stock-marquee-mask overflow-hidden">
        <Motion.div className="flex w-max" animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }} transition={reduceMotion ? undefined : { duration: 34, ease: 'linear', repeat: Infinity }}>
          {[0, 1].map((group) => <div className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12" key={group} aria-hidden={group === 1}>
            {assets.map(([symbol, name]) => <div className="flex min-w-[126px] items-center gap-2.5 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0" key={`${group}-${symbol}`}>
              <img className="h-8 w-8 rounded-lg object-contain" src={`/stocks/${symbol}.webp`} alt={group === 0 ? `${name} logo` : ''} width="32" height="32" loading={group === 0 ? 'eager' : 'lazy'} />
              <span><strong className="block text-[13px] leading-none text-[#2a2730]">{symbol}</strong><small className="mt-1 block max-w-[86px] truncate text-[9px] text-[#8d8995]">{name}</small></span>
            </div>)}
          </div>)}
        </Motion.div>
      </div>
    </div>
  )
}

function Hero() {
  const [termIndex, setTermIndex] = useState(0)
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    if (reduceMotion) return undefined
    const timer = window.setInterval(() => setTermIndex((value) => (value + 1) % heroTerms.length), 2200)
    return () => window.clearInterval(timer)
  }, [reduceMotion])
  return (
    <section className="mx-auto max-w-[1200px] px-[22px] pt-[18px] md:px-8 md:pt-6" id="top">
      <div className="relative isolate flex min-h-[520px] items-center justify-center overflow-hidden rounded-[18px] bg-[#6d45ff] px-5 py-12 text-center text-white sm:min-h-[560px] md:min-h-[663px] md:rounded-[32px] md:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.24),transparent_32%),radial-gradient(circle_at_50%_110%,rgba(203,187,255,.45),transparent_38%)]" />
        <Motion.div className="mx-auto flex w-full max-w-[1000px] flex-col items-center" initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <div className="mb-8 flex h-5 items-center justify-center gap-2 overflow-hidden font-mono text-[9px] tracking-[0.2em] text-[#e4ddff] sm:text-[11px] md:mb-10">
            <span>THE GIFTING</span><span className="relative inline-grid w-[52px] place-items-center sm:w-[66px]"><AnimatePresence mode="wait" initial={false}><Motion.span key={heroTerms[termIndex]} initial={reduceMotion ? false : { opacity: 0, y: 7, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={reduceMotion ? undefined : { opacity: 0, y: -7, filter: 'blur(5px)' }} transition={{ duration: 0.35 }} className="absolute">{heroTerms[termIndex]}</Motion.span></AnimatePresence></span><span>LAYER</span>
          </div>
          <h1 className="max-w-[1000px] text-[clamp(42px,7vw,78px)] font-normal leading-[1.02] tracking-[-0.045em] text-white md:tracking-[-0.02em]">Give someone a piece<br className="hidden sm:block" /> of the <span className="text-[#d8ceff]">market.</span></h1>
          <p className="mt-6 max-w-[700px] text-[14px] leading-relaxed text-[#eeeaff] sm:text-base md:mt-8 md:text-[18px]">Send supported tokenized real-world assets such as Stock Tokens through a simple private claim link.</p>
          <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row md:mt-9"><Motion.a whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-white px-7 font-semibold text-givexa-600 shadow-xl" href="/app">Create an Asset Gift <ArrowRight weight="bold" /></Motion.a><Motion.a whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-flex min-h-[54px] items-center justify-center rounded-xl border border-white/25 bg-white/10 px-7 font-semibold text-white" href="#how-it-works">See how it works</Motion.a></div>
        </Motion.div>
      </div>
      <StockRail />
    </section>
  )
}

function Intro() {
  return (
    <section className="pb-14 pt-24 md:pb-20 md:pt-36" id="product"><div className="mx-auto max-w-[1200px] px-[22px] text-center md:px-8">
      <Reveal className="mx-auto max-w-[760px]"><Eyebrow>A more human onchain experience</Eyebrow><h2 className="text-display">Assets should be as easy to give as a <span className="text-givexa-500">gift card.</span></h2><p className="mx-auto mt-7 max-w-[720px] text-base leading-relaxed text-[#64606b] md:text-lg">Most market products begin with an account, deposit, search, and trade. Givexa begins with something people already understand: someone sent you a gift.</p></Reveal>
      <div className="mt-16 grid gap-5 text-left md:grid-cols-2">
        <Reveal className="flex min-h-[310px] flex-col rounded-[18px] bg-gradient-to-br from-[#f8f7fc] to-[#edebf5] p-7 md:min-h-[330px]" delay={0.05}><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b8794]">Direct transfer</p><h3 className="mt-5 text-[27px] font-medium tracking-[-0.025em]">Technical before personal.</h3><p className="mt-3 max-w-[470px] text-[#66616d]">Ask for a wallet address, verify the network, copy it correctly, then explain what arrived.</p><div className="mt-auto flex items-center gap-3 rounded-xl border border-black/[0.07] bg-white/70 p-4 text-[13px]"><Wallet className="text-givexa-500" /><span className="font-mono text-[#6f6a75]">0x7A...91F2</span><ArrowRight className="ml-auto" /><span className="rounded-md bg-givexa-500 px-2 py-1 text-[10px] font-bold text-white">RWA</span></div></Reveal>
        <Reveal className="relative flex min-h-[310px] flex-col overflow-hidden rounded-[18px] bg-[#0a0a0c] p-7 text-white md:min-h-[330px]" delay={0.1}><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-givexa-500/30 blur-3xl" /><p className="relative font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">Givexa gift</p><h3 className="relative mt-5 text-[27px] font-medium tracking-[-0.025em]">Value first. Wallet second.</h3><p className="relative mt-3 max-w-[470px] text-white/60">The recipient sees the sender, asset, value, message, and next step before connecting anything.</p><div className="relative mt-auto flex items-center gap-4 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur"><span className="grid h-11 w-11 place-items-center rounded-lg bg-givexa-500"><Gift weight="fill" /></span><span><small className="block text-[9px] uppercase tracking-[0.14em] text-white/50">A gift from Maya</small><strong className="mt-1 block text-[13px]">0.25 NVDA Stock Token</strong></span><ArrowUpRight className="ml-auto" /></div></Reveal>
      </div>
    </div></section>
  )
}

function NetworkPanel() {
  return <section className="mx-auto max-w-[1200px] px-[22px] py-14 md:px-8 md:py-20" id="network"><Reveal className="relative min-h-[700px] overflow-hidden rounded-[18px] bg-[#6d45ff] text-center text-white md:min-h-[760px] md:rounded-[32px]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,.22),transparent_35%)]" /><div className="relative z-20 mx-auto max-w-[900px] px-5 pt-14 md:px-8 md:pt-16"><Eyebrow light><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#d8ffb0]" />Designed for Robinhood Chain</Eyebrow><h2 className="text-[clamp(38px,5vw,56px)] font-normal leading-[1.02] tracking-[-0.035em]">Simple on the surface.<br /><span className="text-[#d8ceff]">Verifiable underneath.</span></h2><p className="mx-auto mt-6 max-w-[680px] text-[15px] leading-relaxed text-white/70 md:text-lg">Every funded gift is backed by transparent onchain state: asset, amount, lifecycle status, and transaction history.</p></div><div className="absolute inset-x-0 bottom-0 top-[245px] md:top-[220px]"><AssetGlobe interactive /></div></Reveal></section>
}

function HowItWorks() {
  return <section className="py-24 md:py-36" id="how-it-works"><div className="mx-auto max-w-[1200px] px-[22px] md:px-8"><Reveal className="mx-auto max-w-[760px] text-center"><Eyebrow>How it works</Eyebrow><h2 className="text-display">A gift link carries the moment. <span className="text-givexa-500">The chain carries the value.</span></h2><p className="mx-auto mt-7 max-w-[700px] text-base leading-relaxed text-[#64606b] md:text-lg">Givexa keeps the consumer journey familiar while preserving a transparent, predictable onchain lifecycle.</p></Reveal><Reveal className="relative mt-20 overflow-hidden rounded-[18px] bg-[#0a0a0c] px-5 py-12 text-white md:mt-24 md:rounded-[32px] md:px-14 md:py-16"><div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-givexa-500/25 blur-3xl" /><div className="relative grid gap-8 md:grid-cols-[.8fr_1.2fr] md:gap-16"><div><Eyebrow light>Choose → Fund → Send</Eyebrow><h3 className="text-[clamp(38px,5vw,56px)] font-normal leading-[1.02] tracking-[-0.04em]">Built around a <span className="text-[#a98cff]">human handoff.</span></h3><p className="mt-6 max-w-[470px] text-white/60">The private link is a bearer credential. The recipient reveals the gift before connecting a wallet.</p></div><div className="grid gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-2">{flowSteps.map(({ number, title, copy, icon: Icon }) => <article className="min-h-[178px] bg-[#121116] p-5 transition-colors hover:bg-[#191721]" key={number}><div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-[0.18em] text-white/40">{number}</span><Icon className="text-[#a98cff]" size={22} /></div><h4 className="mt-8 text-[20px] font-medium">{title}</h4><p className="mt-2 text-[12px] leading-relaxed text-white/55">{copy}</p></article>)}</div></div></Reveal></div></section>
}

function GiftModes() {
  const [active, setActive] = useState(giftModes[0].id)
  const selected = giftModes.find((item) => item.id === active)
  const ActiveIcon = selected.icon
  return <section className="pb-24 md:pb-36" id="gifts"><div className="mx-auto max-w-[1200px] px-[22px] md:px-8"><Reveal className="mx-auto max-w-[760px] text-center"><h2 className="text-[clamp(38px,5vw,48px)] font-normal leading-[1.05] tracking-[-0.035em]">More than a token transfer.</h2><p className="mx-auto mt-5 max-w-[680px] text-base text-[#64606b] md:text-lg">A Givexa gift carries context, timing, protection, expiration, and a recipient-first reveal.</p></Reveal><Reveal className="mt-12 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#f8f7fc] to-[#edebf5] md:mt-16 md:rounded-[32px]"><div className="flex overflow-x-auto border-b border-black/[0.07]" role="tablist" aria-label="Givexa gift types">{giftModes.map((item) => <button className={`flex min-h-[68px] min-w-[145px] flex-1 items-center justify-center gap-2 border-b-2 px-4 text-[13px] font-medium transition ${active === item.id ? 'border-givexa-500 bg-white/50 text-givexa-600' : 'border-transparent text-[#77727f] hover:text-black'}`} role="tab" aria-selected={active === item.id} key={item.id} onClick={() => setActive(item.id)}><span className="font-mono text-[9px] text-givexa-500">{item.number}</span>{item.label}</button>)}</div><AnimatePresence mode="wait"><Motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="grid min-h-[390px] items-center gap-10 p-7 md:grid-cols-[1fr_280px] md:p-12"><div className="max-w-[680px]"><ActiveIcon className="mb-8 text-givexa-500" size={46} weight="duotone" /><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-givexa-500">{selected.note}</p><h3 className="mt-5 text-[clamp(34px,5vw,52px)] font-normal tracking-[-0.04em]">{selected.title}</h3><p className="mt-4 max-w-[580px] text-[#625e69] md:text-lg">{selected.copy}</p></div><div className="grid aspect-square place-items-center rounded-[24px] border border-black/[0.08] bg-white/60"><div className="relative grid h-36 w-36 place-items-center rounded-full border border-givexa-500/25"><div className="absolute inset-5 rounded-full border border-dashed border-givexa-500/35" /><ActiveIcon className="relative text-givexa-500" size={54} weight="duotone" /></div></div></Motion.div></AnimatePresence></Reveal></div></section>
}

function AssetUniverse() {
  return <section className="pb-16 pt-24 md:pb-24 md:pt-32" id="assets"><div className="mx-auto max-w-[1200px] px-[22px] md:px-8"><Reveal className="mx-auto max-w-[760px] text-center"><Eyebrow>Curated asset universe</Eyebrow><h2 className="text-[clamp(40px,5vw,56px)] font-normal leading-[1.02] tracking-[-0.035em]">Give something they already <span className="text-givexa-500">recognize.</span></h2><p className="mx-auto mt-6 max-w-[680px] text-[#64606b] md:text-lg">Givexa uses a verified ten-asset allowlist resolved from canonical issuer data, not ticker names alone.</p></Reveal><div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-16 md:grid-cols-5 md:gap-4">{assets.map(([symbol, name], index) => <Reveal delay={Math.min(index * 0.025, 0.2)} key={symbol}><article className="group flex min-h-[176px] flex-col rounded-[16px] border border-black/[0.08] bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-givexa-500/40 hover:shadow-[0_18px_45px_rgba(51,36,108,.10)] md:min-h-[195px] md:p-5"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-[#f5f3f8] p-2"><img className="h-full w-full object-contain" src={`/stocks/${symbol}.webp`} alt={`${name} logo`} width="40" height="40" loading="lazy" /></span><span className="font-mono text-[9px] text-[#aaa6b1]">{String(index + 1).padStart(2, '0')}</span></div><h3 className="mt-auto text-[20px] font-medium">{symbol}</h3><p className="mt-1 truncate text-[11px] text-[#77727f]">{name}</p></article></Reveal>)}</div></div></section>
}

function Fees() {
  const [active, setActive] = useState(feeModes[0].id)
  const selected = feeModes.find((item) => item.id === active)
  return <section className="mx-auto max-w-[1200px] px-[22px] py-16 md:px-8 md:py-24"><Reveal className="relative min-h-[660px] overflow-hidden rounded-[18px] bg-[#6d45ff] px-5 py-14 text-center text-white md:min-h-[720px] md:rounded-[32px] md:px-14 md:py-20"><div className="pointer-events-none absolute inset-0 opacity-55" aria-hidden="true"><AssetGlobe background /></div><div className="pointer-events-none absolute inset-0 token-dots opacity-30" /><div className="relative z-10 mx-auto max-w-[800px]"><Eyebrow light>Clear by design</Eyebrow><h2 className="text-[clamp(42px,5.5vw,64px)] font-normal leading-[1.02] tracking-[-0.04em]">One fee to create.<br /><span className="text-[#d8ceff]">None added to the gift.</span></h2><p className="mx-auto mt-6 max-w-[690px] text-white/70 md:text-lg">The fee model stays visible before the sender funds a Gift Vault. The recipient receives the full selected principal.</p></div><div className="relative z-10 mx-auto mt-12 flex max-w-[760px] rounded-2xl border border-white/20 bg-white/[0.06] p-1" role="tablist" aria-label="Givexa fees">{feeModes.map((item) => <button className={`min-h-12 min-w-0 flex-1 rounded-xl px-1 text-[11px] font-medium transition sm:px-4 sm:text-[12px] ${active === item.id ? 'bg-white text-givexa-600' : 'text-white/70 hover:bg-white/10 hover:text-white'}`} role="tab" aria-selected={active === item.id} key={item.id} onClick={() => setActive(item.id)}><span className="mr-1 font-mono text-[8px] opacity-60 sm:mr-2 sm:text-[9px]">{item.number}</span>{item.label}</button>)}</div><AnimatePresence mode="wait"><Motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="relative z-10 mx-auto mt-10 grid max-w-[760px] gap-5 rounded-[20px] border border-white/20 bg-[#6d45ff]/55 p-7 text-left backdrop-blur-md md:grid-cols-[170px_1fr] md:items-center md:p-9"><strong className="text-[54px] font-normal tracking-[-0.055em] md:text-[68px]">{selected.value}</strong><div><h3 className="text-[20px] font-medium md:text-[24px]">{selected.title}</h3><p className="mt-2 text-[13px] leading-relaxed text-white/65 md:text-[15px]">{selected.copy}</p></div></Motion.div></AnimatePresence></Reveal></section>
}

function Security() {
  const items = [
    ['01', 'Verifiable funding', 'Gift asset, principal, and lifecycle state are visible onchain.', Receipt],
    ['02', 'Private bearer links', 'A 256-bit secret stays in the URL fragment; only its hash is stored onchain.', LockKey],
    ['03', 'Predictable recovery', 'Unclaimed principal can only return to the original sender.', ClockCountdown],
    ['04', 'Verified allowlist', 'Canonical contracts are checked from official registry data before launch.', ShieldCheck],
  ]
  return <section className="py-24 md:py-36" id="security"><div className="mx-auto max-w-[1200px] px-[22px] md:px-8"><Reveal className="mx-auto max-w-[760px] text-center"><Eyebrow>Safety model</Eyebrow><h2 className="text-display">Safety you can <span className="text-givexa-500">verify,</span><br />not just trust.</h2><p className="mx-auto mt-7 max-w-[710px] text-[#64606b] md:text-lg">Simple consumer UX above explicit smart-contract rules, honest asset metadata, and recoverable outcomes.</p></Reveal><div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:mt-20">{items.map(([number, title, copy, Icon], index) => <Reveal delay={index * 0.05} key={number}><article className="flex min-h-[300px] flex-col rounded-[18px] border border-black/[0.08] p-6"><div className="flex items-center justify-between"><Icon className="text-givexa-500" size={32} weight="duotone" /><span className="font-mono text-[9px] text-[#aaa6b1]">{number}</span></div><h3 className="mt-auto text-[20px] font-medium">{title}</h3><p className="mt-3 text-[13px] leading-relaxed text-[#6c6873]">{copy}</p></article></Reveal>)}</div></div></section>
}

function BuildCta() {
  return (
    <section className="mx-auto max-w-[1200px] px-[22px] py-12 md:px-8 md:py-20">
      <Reveal className="relative overflow-hidden rounded-[18px] bg-[#6d45ff] px-5 py-16 text-center text-white md:rounded-[32px] md:px-14 md:py-20">
        <div className="absolute inset-0 cta-grid opacity-40" />
        <div className="relative mx-auto max-w-[780px]">
          <Eyebrow light>Programmable gifting</Eyebrow>
          <h2 className="text-[clamp(42px,6vw,64px)] font-normal leading-[1.02] tracking-[-0.045em]">Send an asset,<br /><span className="text-[#d8ceff]">not another signup link.</span></h2>
          <p className="mx-auto mt-6 max-w-[650px] text-white/70 md:text-lg">Create a gift with value already waiting on the other side.</p>
          <a className="mt-8 inline-flex min-h-[54px] items-center justify-center gap-2 rounded-xl bg-white px-7 font-semibold text-givexa-600 transition hover:-translate-y-0.5" href="/app">Create an Asset Gift <ArrowRight weight="bold" /></a>
        </div>
        <div className="relative mx-auto mt-14 grid max-w-[850px] gap-4 text-left md:grid-cols-3">
          {[['Consumer', 'Private claim links for personal moments.', Gift], ['Community', 'Controlled rewards without collecting addresses first.', GlobeHemisphereWest], ['Protocol', 'Gift Vault lifecycle and verifiable receipts.', Vault]].map(([label, copy, Icon]) => <article className="rounded-[18px] border border-white/20 bg-white/[0.07] p-5 backdrop-blur" key={label}><Icon size={28} /><h3 className="mt-8 text-[18px] font-medium">{label}</h3><p className="mt-2 text-[12px] leading-relaxed text-white/60">{copy}</p></article>)}
        </div>
      </Reveal>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)
  return <section className="py-24 md:py-36" id="faq"><div className="mx-auto max-w-[900px] px-[22px] md:px-8"><Reveal className="text-center"><Eyebrow>FAQ</Eyebrow><h2 className="text-display">Frequently asked <span className="text-givexa-500">questions</span></h2></Reveal><div className="mt-14 border-t border-black/15 md:mt-16">{faqItems.map(([question, answer], index) => { const expanded = open === index; return <div className="border-b border-black/15" key={question}><button className="flex min-h-[76px] w-full items-center justify-between gap-5 py-4 text-left text-[15px] font-medium md:min-h-[82px] md:text-[17px]" aria-expanded={expanded} onClick={() => setOpen(expanded ? -1 : index)}>{question}<CaretDown className={`shrink-0 transition-transform ${expanded ? 'rotate-180 text-givexa-500' : ''}`} /></button><AnimatePresence initial={false}>{expanded && <Motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden"><p className="max-w-[760px] pb-7 pr-8 text-[13px] leading-relaxed text-[#68646f] md:text-[15px]">{answer}</p></Motion.div>}</AnimatePresence></div>})}</div></div></section>
}

function Footer() {
  return <footer className="site-footer relative overflow-hidden bg-[#09090b] py-16 text-[#9d99a4] md:py-20"><div className="relative z-10 mx-auto max-w-[1200px] px-[22px] md:px-8"><div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10"><div><BrandLogo inverse /><p className="mt-6 max-w-[330px] text-[13px] leading-relaxed">Programmable gifting for tokenized markets. Built for Robinhood Chain.</p><p className="mt-7 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">givexa.xyz</p></div><div><h3 className="footer-heading">Product</h3><a href="#product">Gift experience</a><a href="#gifts">Gift types</a><a href="#assets">Supported assets</a></div><div><h3 className="footer-heading">Protocol</h3><a href="#network">Gift Vaults</a><a href="#security">Safety model</a><a href="#how-it-works">How it works</a></div><div><h3 className="footer-heading">Resources</h3><a href="/docs">Docs</a><a href="#faq">FAQ</a><a href="https://x.com/Givexa_xyz" target="_blank" rel="noreferrer">X</a><a href="mailto:hello@givexa.xyz">Contact</a></div></div><div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-7 text-[10px] leading-relaxed md:mt-20 md:flex-row md:items-start md:justify-between"><p>© 2026 Givexa. All rights reserved.</p><p className="max-w-[700px] md:text-right">Robinhood Stock Tokens are tokenised debt securities issued by Robinhood Assets (Jersey) Limited. They provide economic exposure and do not grant legal or beneficial ownership of underlying securities. Availability is jurisdiction-dependent.</p></div></div><div className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-[22vw] font-bold tracking-[0.08em] text-white/[0.025]">GIVEXA</div></footer>
}

export default function App() {
  if (isGiftApplicationRoute()) return <Suspense fallback={<main className="app-route-loading"><span className="app-spinner" /><span>Loading Givexa</span></main>}><GiftApplicationRoot /></Suspense>
  if (/^\/docs\/?$/u.test(window.location.pathname)) return <Suspense fallback={<main className="app-route-loading"><span className="app-spinner" /><span>Loading docs</span></main>}><DocsPage /></Suspense>
  return <><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main"><Hero /><Intro /><NetworkPanel /><HowItWorks /><GiftModes /><AssetUniverse /><Fees /><Security /><BuildCta /><Faq /></main><Footer /></>
}
