/* eslint-disable react-refresh/only-export-components */
import { AppHeader } from '../../components/app/AppHeader.jsx'
import { ConfigurationGate } from '../../components/app/ConfigurationGate.jsx'
import { web3Configuration } from '../../web3/AppKitProvider.jsx'
import { ClaimGiftFlow } from './ClaimGiftFlow.jsx'
import { CreateGiftFlow } from './CreateGiftFlow.jsx'
import { GiftDetailFlow } from './GiftDetailFlow.jsx'
import { DashboardFlow } from '../dashboard/DashboardFlow.jsx'
import { GovernancePage } from '../governance/GovernancePage.jsx'

function resolveRoute(pathname) {
  if (pathname === '/app' || pathname === '/app/') return { mode: 'create' }
  if (pathname === '/dashboard' || pathname === '/dashboard/') return { mode: 'dashboard' }
  if (pathname === '/governance' || pathname === '/governance/') return { mode: 'governance' }
  const giftMatch = pathname.match(/^\/gift\/(\d+)\/?$/u)
  if (giftMatch) return { mode: 'detail', giftId: giftMatch[1] }
  if (/^\/gift(?:\/.*)?\/?$/u.test(pathname)) return { mode: 'detail', giftId: '' }
  const claimMatch = pathname.match(/^\/claim(?:\/(\d+))?\/?$/u)
  if (claimMatch) return { mode: 'claim', giftId: claimMatch[1] || '' }
  return null
}

export function isGiftApplicationRoute(pathname = window.location.pathname) { return Boolean(resolveRoute(pathname)) }

export function GiftApplication() {
  const route = resolveRoute(window.location.pathname)
  if (!web3Configuration.ready) return <ConfigurationGate />
  return (
    <div className="gift-app"><a className="skip-link" href="#gift-app-main">Skip to gift application</a><AppHeader mode={route.mode} />
      <main className="gift-app__main" id="gift-app-main">
        {route.mode === 'create' && <CreateGiftFlow />}
        {route.mode === 'claim' && <ClaimGiftFlow routeGiftId={route.giftId} />}
        {route.mode === 'detail' && <GiftDetailFlow routeGiftId={route.giftId} />}
        {route.mode === 'dashboard' && <DashboardFlow />}
        {route.mode === 'governance' && <GovernancePage />}
      </main>
      <footer className="gift-app__footer"><span>Givexa on Robinhood Chain</span><span>Verified Gift Vault · Recipient pays no Givexa claim fee · <a href="https://x.com/Givexa_xyz" target="_blank" rel="noreferrer">Follow on X</a></span></footer>
    </div>
  )
}
