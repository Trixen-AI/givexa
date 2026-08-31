export const ROBINHOOD_CHAIN_ID = 4663
export const DEPLOYMENT_BLOCK = 50224086n

export const CONTRACTS = Object.freeze({
  assetRegistry: '0x3DbcD81aC7cAE53B11be7490fEc2ADf71EBDaceA',
  feeController: '0x06b04449166FF138FEdcdc894636c8986444aD55',
  giftVault: '0x82d477c00e1D8DC784aE87a71Ffa2C56Ad2626E9',
  timelock: '0x152Cd038Aee65F2Ca4F362b8E9069477C8AAEC03',
  treasurySafe: '0x9E4432C98321dAB22bF78cEd55800F0F5B893802',
})

export const SUPPORTED_ASSETS = Object.freeze([
  { symbol: 'NVDA', name: 'NVIDIA', address: '0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC' },
  { symbol: 'AAPL', name: 'Apple', address: '0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9' },
  { symbol: 'TSLA', name: 'Tesla', address: '0x322F0929c4625eD5bAd873c95208D54E1c003b2d' },
  { symbol: 'MSFT', name: 'Microsoft', address: '0xe93237C50D904957Cf27E7B1133b510C669c2e74' },
  { symbol: 'AMZN', name: 'Amazon', address: '0x12f190a9F9d7D37a250758b26824B97CE941bF54' },
  { symbol: 'GOOGL', name: 'Alphabet', address: '0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3' },
  { symbol: 'META', name: 'Meta', address: '0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35' },
  { symbol: 'SPY', name: 'S&P 500 ETF', address: '0x117cc2133c37B721F49dE2A7a74833232B3B4C0C' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', address: '0xD5f3879160bc7c32ebb4dC785F8a4F505888de68' },
  { symbol: 'GLD', name: 'Gold Trust', address: '0xC9a981FEE1F9DEc688bb123ccDeCc63D0deBFC4e' },
])

export const ASSET_BY_ADDRESS = new Map(
  SUPPORTED_ASSETS.map((asset) => [asset.address.toLowerCase(), asset]),
)

export const BLOCK_EXPLORER_URL = 'https://robinhoodchain.blockscout.com'
export const BLOCKSCOUT_API_URL = `${BLOCK_EXPLORER_URL}/api`
export const TOKEN_DECIMALS = 18
export const DEFAULT_EXPIRY_DAYS = 30
