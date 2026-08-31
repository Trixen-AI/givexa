const ERROR_MESSAGES = {
  CreationPaused: 'Gift creation is temporarily paused. Existing gifts can still be claimed or recovered.',
  UnsupportedAsset: 'This asset is not currently supported by the Givexa registry.',
  ZeroPrincipal: 'Enter a gift amount greater than zero.',
  ScheduleTooSoon: 'Scheduled gifts must unlock at least 10 minutes from now.',
  ScheduleTooFar: 'Scheduled gifts cannot unlock more than 365 days from now.',
  ExpiryOutOfRange: 'Choose an expiry between 7 and 365 days.',
  GiftNotFound: 'This gift does not exist on Robinhood Chain.',
  GiftNotActive: 'This gift has already reached a final state.',
  GiftLocked: 'This gift is scheduled and is not claimable yet.',
  GiftExpired: 'This gift has expired and can no longer be claimed.',
  GiftNotExpired: 'This gift has not expired yet and cannot be recovered.',
  NotGiftSender: 'Only the original sender can cancel this gift.',
  InvalidSecret: 'This claim link is invalid. Ask the sender for the original private link.',
  InvalidClaimCode: 'The Claim Code is incorrect. Check the separately shared code and try again.',
  UnexpectedTransferAmount: 'The selected token did not transfer the exact expected amount.',
}

export function getTransactionErrorMessage(error) {
  const name = error?.data?.errorName || error?.cause?.data?.errorName
  if (name && ERROR_MESSAGES[name]) return ERROR_MESSAGES[name]
  const text = `${error?.shortMessage || ''} ${error?.message || ''}`
  const matchedName = Object.keys(ERROR_MESSAGES).find((key) => text.includes(key))
  if (matchedName) return ERROR_MESSAGES[matchedName]
  if (/rejected|denied|UserRejectedRequestError/iu.test(text)) return 'The wallet request was cancelled. No transaction was submitted.'
  if (/insufficient funds/iu.test(text)) return 'Your wallet does not have enough ETH to pay Robinhood Chain gas.'
  if (/allowance|transfer amount exceeds allowance/iu.test(text)) return 'Token approval is insufficient. Approve the requested amount and try again.'
  if (/balance|exceeds balance/iu.test(text)) return 'Your wallet does not have enough of the selected asset.'
  if (/network|chain/iu.test(text)) return 'Switch your wallet to Robinhood Chain and try again.'
  return 'The transaction could not be completed. Review the wallet details and try again.'
}
