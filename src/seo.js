const SITE_URL = 'https://givexa.xyz'

// Routes that carry private gift state or wallet views stay out of search results.
const PRIVATE_ROUTE = /^\/(?:claim|gift|dashboard)(?:\/|$)/u

const ROUTE_META = [
  { match: /^\/docs\/?$/u, path: '/docs', title: 'Docs | Givexa', description: 'How Givexa gifts work on Solana: connect a wallet, fund a Gift Vault, share a private claim link, and claim, cancel, or recover a gift.' },
  { match: /^\/app\/?$/u, path: '/app', title: 'Create an Asset Gift | Givexa', description: 'Choose a supported Stock Token, set the amount, schedule and claim rules, and create a private Givexa claim link on Solana.' },
  { match: /^\/governance\/?$/u, path: '/governance', title: 'Governance | Givexa', description: 'Read-only view of the Givexa Safe, Timelock, fee settings, pause state, and asset allowlist.' },
  { match: /^\/claim(?:\/|$)/u, path: '/claim', title: 'Claim a gift | Givexa', description: 'Open a private Givexa claim link and receive your gift in a Solana wallet.' },
  { match: /^\/dashboard\/?$/u, path: '/dashboard', title: 'Gift dashboard | Givexa', description: 'Track the Givexa gifts you have sent and received.' },
  { match: /^\/gift(?:\/|$)/u, path: '/gift', title: 'Gift Vault | Givexa', description: 'Lifecycle details for a Givexa Gift Vault.' },
]

function setMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector)
  if (element) element.setAttribute(attribute, value)
}

export function applyRouteMeta(pathname = window.location.pathname) {
  const route = ROUTE_META.find(({ match }) => match.test(pathname))
  if (route) {
    const url = `${SITE_URL}${route.path}`
    document.title = route.title
    setMeta('meta[name="description"]', 'content', route.description)
    setMeta('link[rel="canonical"]', 'href', url)
    setMeta('meta[property="og:url"]', 'content', url)
    setMeta('meta[property="og:title"]', 'content', route.title)
    setMeta('meta[property="og:description"]', 'content', route.description)
    setMeta('meta[name="twitter:title"]', 'content', route.title)
    setMeta('meta[name="twitter:description"]', 'content', route.description)
  }
  if (PRIVATE_ROUTE.test(pathname)) setMeta('meta[name="robots"]', 'content', 'noindex, nofollow')
}
