import { Gear, ShieldWarning } from '@phosphor-icons/react'
import { BrandLogo } from '../BrandLogo.jsx'
import { web3Configuration } from '../../web3/AppKitProvider.jsx'

export function ConfigurationGate() {
  const missing = [
    !web3Configuration.projectIdConfigured && 'VITE_REOWN_PROJECT_ID',
    !web3Configuration.rpcConfigured && 'VITE_ROBINHOOD_RPC_URL',
  ].filter(Boolean)

  return (
    <main className="configuration-page">
      <div className="configuration-card">
        <BrandLogo />
        <span className="configuration-card__icon"><Gear size={30} weight="duotone" /></span>
        <p className="app-eyebrow">Configuration required</p>
        <h1>Connect the production wallet infrastructure.</h1>
        <p>Copy <code>.env.example</code> to <code>.env.local</code> and provide the public Reown project ID and a browser-restricted Robinhood Chain RPC URL.</p>
        <div className="configuration-card__notice">
          <ShieldWarning size={22} />
          <span>Never place a wallet private key or unrestricted provider credential in a Vite environment variable.</span>
        </div>
        <div className="configuration-card__missing">Missing: {missing.join(', ')}</div>
        <a className="app-primary-button" href="/">Return to Givexa</a>
      </div>
    </main>
  )
}

