import { parseAbi } from 'viem'

export const giftVaultAbi = parseAbi([
  'function createGift((address asset,uint128 principal,bytes32 secretHash,bytes32 claimCodeHash,uint40 unlockAt,uint32 expiryDuration) params) returns (uint256 giftId)',
  'function claim(uint256 giftId, bytes32 secret, bytes claimCode)',
  'function cancel(uint256 giftId)',
  'function recoverExpired(uint256 giftId)',
  'function gift(uint256 giftId) view returns ((address sender,address asset,uint128 principal,uint40 createdAt,uint40 unlockAt,uint40 expiresAt,uint8 status,bytes32 secretHash,bytes32 claimCodeHash))',
  'function displayStatus(uint256 giftId) view returns (uint8)',
  'function hashSecret(bytes32 secret) view returns (bytes32)',
  'function hashClaimCode(bytes32 secret, bytes claimCode) view returns (bytes32)',
  'function creationPaused() view returns (bool)',
  'function owner() view returns (address)',
  'function guardian() view returns (address)',
  'function assetRegistry() view returns (address)',
  'function feeController() view returns (address)',
  'event GiftCreated(uint256 indexed giftId,address indexed sender,address indexed asset,uint256 principal,uint256 fee,uint40 unlockAt,uint40 expiresAt,bytes32 secretHash,bool claimCodeRequired)',
  'event GiftClaimed(uint256 indexed giftId,address indexed recipient,uint256 principal)',
  'event GiftCancelled(uint256 indexed giftId,address indexed sender,uint256 principal)',
  'event GiftRecovered(uint256 indexed giftId,address indexed caller,address indexed sender,uint256 principal)',
  'error CreationPaused()',
  'error UnsupportedAsset(address asset)',
  'error ZeroPrincipal()',
  'error EmptySecretHash()',
  'error ScheduleTooSoon(uint256 earliestAllowed)',
  'error ScheduleTooFar(uint256 latestAllowed)',
  'error ExpiryOutOfRange(uint256 minimum,uint256 maximum)',
  'error GiftNotFound(uint256 giftId)',
  'error GiftNotActive(uint256 giftId)',
  'error GiftLocked(uint256 unlockAt)',
  'error GiftExpired(uint256 expiresAt)',
  'error GiftNotExpired(uint256 expiresAt)',
  'error NotGiftSender()',
  'error InvalidSecret()',
  'error InvalidClaimCode()',
  'error UnexpectedTransferAmount(uint256 expected,uint256 actual)',
])

export const assetRegistryAbi = parseAbi([
  'function isSupported(address asset) view returns (bool)',
  'function owner() view returns (address)',
])

export const feeControllerAbi = parseAbi([
  'function quoteFee(uint256 principal) view returns (uint256)',
  'function feeBps() view returns (uint16)',
  'function treasury() view returns (address)',
  'function owner() view returns (address)',
  'function MAX_FEE_BPS() view returns (uint16)',
])

export const erc20Abi = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender,uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
])
