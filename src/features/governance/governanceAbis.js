import { parseAbi } from 'viem'

export const ownableAbi = parseAbi([
  'function owner() view returns (address)',
])

export const governanceAssetRegistryAbi = parseAbi([
  'function isSupported(address asset) view returns (bool)',
])

export const governanceVaultAbi = parseAbi([
  'function owner() view returns (address)',
  'function guardian() view returns (address)',
  'function creationPaused() view returns (bool)',
  'function assetRegistry() view returns (address)',
  'function feeController() view returns (address)',
])

export const governanceFeeControllerAbi = parseAbi([
  'function owner() view returns (address)',
  'function feeBps() view returns (uint16)',
  'function treasury() view returns (address)',
  'function MAX_FEE_BPS() view returns (uint16)',
])

export const safeConfigurationAbi = parseAbi([
  'function getOwners() view returns (address[])',
  'function getThreshold() view returns (uint256)',
])

export const timelockConfigurationAbi = parseAbi([
  'function getMinDelay() view returns (uint256)',
])
