import { ccpaymentService } from '$lib/services/ccpayment';

// Cache for coin list
let coinListCache = null;

// Supported tokens in our application
const SUPPORTED_TOKENS = ['BTC', 'ETH', 'LTC', 'SOL', 'USDT', 'USDC', 'TRX', 'TETH'];

/**
 * Get coin ID from symbol by fetching from API or using cache
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @returns {Promise<string>} - Coin ID as string
 */
export const getCoinIdFromSymbol = async (symbol) => {
  try {
    // Use cached coin list if available
    if (coinListCache) {
      const coin = coinListCache.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
      if (coin) return coin.coinId.toString();
    }

    // Fetch coin list if not cached
    const response = await ccpaymentService.getSupportedCurrencies();

    if (response && response.success && response.data && response.data.coins) {
      // Cache the coin list
      coinListCache = response.data.coins;

      // Find the coin by symbol
      const coin = response.data.coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
      if (coin) return coin.coinId.toString();
    }

    // Fallback to default mapping if coin not found
    const fallbackMap = {
      'BTC': '1155',
      'ETH': '1161',
      'USDT': '1280',
      'SOL': '1186',
      'LTC': '1173',
      'TRX': '1482',
      'TETH': '1891',
      'USDC': '1282'
    };

    return fallbackMap[symbol.toUpperCase()] || '1161'; // Default to ETH if not found
  } catch (error) {
    console.error('Error getting coin ID:', error);
    return '1161'; // Default to ETH on error
  }
};

/**
 * Get CCPayment service instance
 * @returns {CCPaymentService} - CCPayment service instance
 */
export const getCCPaymentService = () => {
  return ccpaymentService;
};

/**
 * Get fallback exchange rate for a currency
 * @param {string} currency - Cryptocurrency symbol
 * @returns {number} - Exchange rate in USD
 */
export const getDefaultExchangeRate = (currency) => {
  const rates = {
    'BTC': 50000,
    'ETH': 3000,
    'USDT': 1,
    'USDC': 1,
    'TRX': 0.1,
    'SOL': 100,
    'LTC': 70,
    'TETH': 3000
  };
  return rates[currency.toUpperCase()] || 1;
};

/**
 * Get supported tokens for CCPayment
 * @returns {Array<string>} - Array of supported token symbols
 */
export const getSupportedTokens = () => {
  return SUPPORTED_TOKENS;
};

/**
 * Get token data with images and names
 * @param {Array} wallet - Optional wallet array containing token data
 * @returns {Array<Object>} - Array of token objects with symbol, name and image
 */
export const getTokensWithData = (wallet) => {
  // Default token data
  const defaultTokens = [
    { symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400' },
    { symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628' },
    { symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/standard/litecoin.png?1696501400' },
    { symbol: 'SOL', name: 'Solana', image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png' },
    { symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663' },
    { symbol: 'USDC', name: 'USD Coin', image: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389' },
    { symbol: 'TRX', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/standard/tron-logo.png?1696502193' },
    { symbol: 'TETH', name: 'Test Ethereum', image: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628' }
  ];

  // If wallet is provided, use its data
  if (wallet && Array.isArray(wallet)) {
    return SUPPORTED_TOKENS.map(symbol => {
      const walletToken = wallet.find(t => t.coin_name.toUpperCase() === symbol.toUpperCase());
      if (walletToken) {
        return {
          symbol: walletToken.coin_name,
          name: walletToken.fullname,
          image: walletToken.coin_image
        };
      } else {
        // Fallback to default if token not found in wallet
        const defaultToken = defaultTokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
        return defaultToken || { symbol, name: symbol, image: defaultTokens[0].image };
      }
    });
  }

  // Return default tokens if no wallet provided
  return defaultTokens;
};

/**
 * Get token image by symbol from wallet array
 * @param {string} symbol - Token symbol
 * @param {Array} wallet - Wallet array containing token data
 * @returns {string} - Image URL
 */
export const getTokenImage = (symbol, wallet) => {
  // If wallet is provided, try to find the token image there first
  if (wallet && Array.isArray(wallet)) {
    const walletToken = wallet.find(t => t.coin_name.toUpperCase() === symbol.toUpperCase());
    if (walletToken && walletToken.coin_image) {
      return walletToken.coin_image;
    }
  }

  // Fallback to default token data
  const tokens = getTokensWithData();
  const token = tokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
  return token ? token.image : 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400'; // Default to BTC if not found
};

/**
 * Get token name by symbol
 * @param {string} symbol - Token symbol
 * @param {Array} wallet - Optional wallet array containing token data
 * @returns {string} - Token name
 */
export const getTokenName = (symbol, wallet) => {
  // If wallet is provided, try to find the token name there first
  if (wallet && Array.isArray(wallet)) {
    const walletToken = wallet.find(t => t.coin_name.toUpperCase() === symbol.toUpperCase());
    if (walletToken && walletToken.fullname) {
      return walletToken.fullname;
    }
  }

  // Fallback to default token data
  const tokens = getTokensWithData();
  const token = tokens.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
  return token ? token.name : symbol;
};

export default {
  getCoinIdFromSymbol,
  getCCPaymentService,
  getDefaultExchangeRate,
  getSupportedTokens,
  getTokensWithData,
  getTokenImage,
  getTokenName
};
