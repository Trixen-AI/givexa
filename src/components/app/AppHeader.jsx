import { BookOpenText, ChartPieSlice, LinkSimple, Plus, ShieldCheck, XLogo } from '@phosphor-icons/react'
import { BrandLogo } from '../BrandLogo.jsx'
import { WalletControl } from './WalletControl.jsx'

const navigation = Object.freeze([
  { mode: 'create', label: 'Create', href: '/app', icon: Plus },
  { mode: 'claim', label: 'Claim', href: '/claim', icon: LinkSimple },
  { mode: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: ChartPieSlice },
  { mode: 'governance', label: 'Governance', href: '/governance', icon: ShieldCheck },
])

function isActive(itemMode, currentMode) {
  return itemMode === currentMode || (itemMode === 'dashboard' && currentMode === 'detail')
}

function NavigationLinks({ mode, mobile = false }) {
  return navigation.map(({ mode: itemMode, label, href, icon: Icon }) => {
    const active = isActive(itemMode, mode)
    return (
      <a className={active ? 'is-active' : ''} href={href} aria-current={active ? 'page' : undefined} key={href}>
        <Icon size={mobile ? 20 : 19} weight={active ? 'fill' : 'regular'} />
        <span>{label}</span>
      </a>
    )
  })
}

export function AppHeader({ mode }) {
  return (
    <>
      <aside className="app-sidebar" aria-label="Givexa application sidebar">
        <div className="app-sidebar__brand"><BrandLogo /></div>
        <nav className="app-sidebar__nav" aria-label="Gift application">
          <NavigationLinks mode={mode} />
        </nav>
        <div className="app-sidebar__footer">
          <div className="app-sidebar__resources">
            <a href="/docs"><BookOpenText size={18} /> <span>Docs</span></a>
            <a href="https://x.com/Givexa_xyz" target="_blank" rel="noreferrer"><XLogo size={18} /> <span>Follow Givexa</span></a>
          </div>
          <WalletControl />
        </div>
      </aside>
      <header className="app-mobile-header">
        <BrandLogo />
        <WalletControl compact />
      </header>
      <nav className="app-bottom-nav" aria-label="Gift application mobile navigation">
        <NavigationLinks mode={mode} mobile />
      </nav>
    </>
  )
}
