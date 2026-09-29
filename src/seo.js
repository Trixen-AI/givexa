const SITE_URL = 'https://latentiaapp.org'

// Routes that carry private gift state or wallet views stay out of search results.
const PRIVATE_ROUTE = /^\/(?:claim|gift|dashboard)(?:\/|$)/u

const ROUTE_META = [
  { match: /^\/docs\/?$/u, path: '/docs', title: 'Docs | Latentia', description: 'How Latentia gifts work on Robinhood Chain: connect a wallet, fund a Gift Vault, share a private claim link, and claim, cancel, or recover a gift.' },
  { match: /^\/app\/?$/u, path: '/app', title: 'Create an Asset Gift | Latentia', description: 'Choose a supported Stock Token, set the amount, schedule and claim rules, and create a private Latentia claim link on Robinhood Chain.' },
  { match: /^\/governance\/?$/u, path: '/governance', title: 'Governance | Latentia', description: 'Read-only view of the Latentia Safe, Timelock, fee settings, pause state, and asset allowlist.' },
  { match: /^\/claim(?:\/|$)/u, path: '/claim', title: 'Claim a gift | Latentia', description: 'Open a private Latentia claim link and receive your gift in your wallet on Robinhood Chain.' },
  { match: /^\/dashboard\/?$/u, path: '/dashboard', title: 'Gift dashboard | Latentia', description: 'Track the Latentia gifts you have sent and received.' },
  { match: /^\/gift(?:\/|$)/u, path: '/gift', title: 'Gift Vault | Latentia', description: 'Lifecycle details for a Latentia Gift Vault.' },
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
