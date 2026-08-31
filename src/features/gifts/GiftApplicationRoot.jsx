import { AppKitProvider } from '../../web3/AppKitProvider.jsx'
import { GiftApplication } from './GiftApplication.jsx'

export default function GiftApplicationRoot() {
  return <AppKitProvider><GiftApplication /></AppKitProvider>
}
