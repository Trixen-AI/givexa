import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react'
import { CheckCircle, Wallet } from '@phosphor-icons/react'
import { shortAddress } from '../../web3/format.js'
import { isWalletNetwork, WALLET_NAMESPACE, walletNetwork } from '../../web3/network.js'

export function WalletControl({ compact = false }) {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount({ namespace: WALLET_NAMESPACE })
  const { chainId, switchNetwork } = useAppKitNetwork()
  const onCorrectNetwork = isWalletNetwork(chainId)

  if (!isConnected) {
    return (
      <button className="app-wallet-button" type="button" onClick={() => open({ view: 'Connect', namespace: WALLET_NAMESPACE })}>
        <Wallet size={18} weight="bold" />
        <span>{compact ? 'Connect' : 'Connect wallet'}</span>
      </button>
    )
  }

  if (!onCorrectNetwork) {
    return (
      <button className="app-wallet-button app-wallet-button--warning" type="button" onClick={() => switchNetwork(walletNetwork)}>
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
