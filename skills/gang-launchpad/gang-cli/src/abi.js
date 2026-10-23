/** Soft / legacy BNB-payable pad (create archived; buy/sell/claim only). */
export const SOFT_ABI = [
  { type: 'function', name: 'create', stateMutability: 'nonpayable', inputs: [{ name: 'name', type: 'string' }, { name: 'symbol', type: 'string' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'buy', stateMutability: 'payable', inputs: [{ name: 'token', type: 'address' }, { name: 'minTokensOut', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'sell', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'tokensIn', type: 'uint256' }, { name: 'minBnbOut', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'quoteBuy', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }, { name: 'buyer', type: 'address' }, { name: 'bnbGross', type: 'uint256' }], outputs: [{ name: 'tokensOut', type: 'uint256' }, { name: 'bnbIn', type: 'uint256' }, { name: 'fee', type: 'uint256' }, { name: 'refund', type: 'uint256' }] },
  { type: 'function', name: 'quoteSell', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }, { name: 'tokensIn', type: 'uint256' }], outputs: [{ name: 'bnbToUser', type: 'uint256' }, { name: 'fee', type: 'uint256' }] },
  { type: 'function', name: 'curves', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [{ name: 'creator', type: 'address' }, { name: 'realBnb', type: 'uint128' }, { name: 'sold', type: 'uint128' }, { name: 'graduated', type: 'bool' }, { name: 'pair', type: 'address' }] },
  { type: 'function', name: 'allTokens', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'tokenCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'spotPrice', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'isAgent', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'walletRoom', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }, { name: 'buyer', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'GRADUATION_BNB', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'MAX_PER_WALLET', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'event', name: 'Created', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'creator', type: 'address', indexed: true }, { name: 'name', type: 'string', indexed: false }, { name: 'symbol', type: 'string', indexed: false }] },
  { type: 'event', name: 'Buy', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'buyer', type: 'address', indexed: true }, { name: 'bnbIn', type: 'uint256', indexed: false }, { name: 'fee', type: 'uint256', indexed: false }, { name: 'tokensOut', type: 'uint256', indexed: false }, { name: 'realBnb', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'Sell', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'seller', type: 'address', indexed: true }, { name: 'tokensIn', type: 'uint256', indexed: false }, { name: 'fee', type: 'uint256', indexed: false }, { name: 'bnbOut', type: 'uint256', indexed: false }, { name: 'realBnb', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'Graduated', inputs: [{ name: 'token', type: 'address', indexed: true }, { name: 'pair', type: 'address', indexed: true }, { name: 'tokenAmount', type: 'uint256', indexed: false }, { name: 'bnbAmount', type: 'uint256', indexed: false }] },
]

/** LaunchpadV2 (+ U/S-shaped quote pads): create with logoURI; buy/sell take quote ERC-20. */
export const V2_ABI = [
  { type: 'function', name: 'create', stateMutability: 'nonpayable', inputs: [{ name: 'name', type: 'string' }, { name: 'symbol', type: 'string' }, { name: 'logoURI', type: 'string' }, { name: 'taxed', type: 'bool' }, { name: 'pairOrQuote', type: 'address' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'buy', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'quoteIn', type: 'uint256' }, { name: 'minTokensOut', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'sell', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'tokensIn', type: 'uint256' }, { name: 'minQuoteOut', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'curves', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [
    { name: 'creator', type: 'address' }, { name: 'quote', type: 'address' }, { name: 'realQuote', type: 'uint128' }, { name: 'sold', type: 'uint128' },
    { name: 'gradAmt', type: 'uint128' }, { name: 'virtualQuote', type: 'uint128' }, { name: 'graduated', type: 'bool' }, { name: 'taxed', type: 'bool' },
    { name: 'pair', type: 'address' }, { name: 'refPair', type: 'address' },
  ] },
  { type: 'function', name: 'allTokens', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'tokenCount', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'isAgent', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'walletRoom', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }, { name: 'buyer', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'MAX_PER_WALLET', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'TARGET_GRAD_BNB', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'logoURIOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'string' }] },
  { type: 'event', name: 'Created', inputs: [
    { name: 'token', type: 'address', indexed: true }, { name: 'creator', type: 'address', indexed: true },
    { name: 'name', type: 'string', indexed: false }, { name: 'symbol', type: 'string', indexed: false },
    { name: 'logoURI', type: 'string', indexed: false }, { name: 'taxed', type: 'bool', indexed: false },
    { name: 'quote', type: 'address', indexed: true }, { name: 'refPair', type: 'address', indexed: false }, { name: 'gradAmt', type: 'uint256', indexed: false },
  ] },
  { type: 'event', name: 'Buy', inputs: [
    { name: 'token', type: 'address', indexed: true }, { name: 'buyer', type: 'address', indexed: true },
    { name: 'quoteIn', type: 'uint256', indexed: false }, { name: 'taxDividend', type: 'uint256', indexed: false },
    { name: 'taxPlatform', type: 'uint256', indexed: false }, { name: 'tokensOut', type: 'uint256', indexed: false }, { name: 'realQuote', type: 'uint256', indexed: false },
  ] },
  { type: 'event', name: 'Sell', inputs: [
    { name: 'token', type: 'address', indexed: true }, { name: 'seller', type: 'address', indexed: true },
    { name: 'tokensIn', type: 'uint256', indexed: false }, { name: 'taxDividend', type: 'uint256', indexed: false },
    { name: 'taxPlatform', type: 'uint256', indexed: false }, { name: 'quoteOut', type: 'uint256', indexed: false }, { name: 'realQuote', type: 'uint256', indexed: false },
  ] },
  { type: 'event', name: 'Graduated', inputs: [
    { name: 'token', type: 'address', indexed: true }, { name: 'pair', type: 'address', indexed: true },
    { name: 'quote', type: 'address', indexed: false }, { name: 'tokenAmount', type: 'uint256', indexed: false }, { name: 'quoteAmount', type: 'uint256', indexed: false },
  ] },
]

export const ERC20_ABI = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'allowance', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'locked', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
]

/** @deprecated alias kept for older imports */
export const LAUNCHPAD_ABI = V2_ABI
