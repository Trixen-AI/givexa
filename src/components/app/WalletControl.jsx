import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { CheckCircle, Wallet } from '@phosphor-icons/react'
import { ROBINHOOD_CHAIN_ID } from '../../config/deployment.js'
import { shortAddress } from '../../web3/format.js'
import { robinhoodChain } from '../../web3/network.js'

export function WalletControl({ compact = false }) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: 'eip155' })
  const { chainId, switchNetwork } = useAppKitNetwork()
  const onCorrectNetwork = Number(chainId) === ROBINHOOD_CHAIN_ID

  if (!isConnected) {
    return (
      <button className="app-wallet-button" type="button" onClick={() => open({ view: 'Connect', namespace: 'eip155' })}>
        <Wallet size={18} weight="bold" />
        <span>{compact ? 'Connect' : 'Connect wallet'}</span>
      </button>
    )
  }

  if (!onCorrectNetwork) {
    return (
      <button className="app-wallet-button app-wallet-button--warning" type="button" onClick={() => switchNetwork(robinhoodChain)}>
        Switch network
      </button>
    )
  }

  return (
    <button className="app-wallet-button app-wallet-button--connected" type="button" onClick={() => open({ view: 'Account' })}>
      <CheckCircle size={18} weight="fill" />
      <span>{shortAddress(address)}</span>
    </button>
  )
}

