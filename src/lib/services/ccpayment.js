import axios from "axios";
import { serverUrl } from "$lib/backendUrl";
import { toast } from "svelte-sonner";
import { app } from "$lib/store/app";
import { get } from "svelte/store";

/**
 * CCPayment API Service
 * Handles all interactions with the CCPayment API through our backend
 */
export class CCPaymentService {
  constructor() {
    this.baseUrl = `${serverUrl()}/api/payment/ccpayment`;
  }

  /**
   * Get authorization headers for API requests
   * @returns {Object} - Headers object with authorization token
   */
  getAuthHeaders() {
    // Get token from app store
    const appInstance = get(app);
    const token = appInstance?.secret || '';

    return {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Get supported currencies and networks
   * Endpoint: /api/payment/ccpayment/currencies
   */
  async getSupportedCurrencies() {
    try {
      const response = await axios.get(`${this.baseUrl}/currencies`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get currency prices in USD
   * Endpoint: /api/payment/ccpayment/prices
   * @param {string|array} coinIds - Comma-separated list or array of coin IDs
   */
  async getCurrencyPrices(coinIds) {
    try {
      let coinIdsStr;
      if (Array.isArray(coinIds)) {
        coinIdsStr = coinIds.join(',');
      } else {
        coinIdsStr = coinIds;
      }
      const response = await axios.get(`${this.baseUrl}/prices?coinIds=${coinIdsStr}`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get or create a permanent deposit address
   * Endpoint: /api/payment/ccpayment/permanent-address (POST)
   * @param {Object} data - Request data
   * @param {string} data.referenceId - Required: 3-64 characters, unique reference ID for the user
   * @param {string} [data.chain="ETH"] - Symbol of the chain (defaults to 'ETH')
   */
  async getOrCreateDepositAddress(data) {
    try {
      // Default to ETH chain if not specified
      const requestData = {
        ...data,
        chain: data.chain || "ETH"
      };
      const response = await axios.post(`${this.baseUrl}/permanent-address`, requestData, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get deposit record by record ID
   * Endpoint: /api/payment/ccpayment/deposit-record (POST)
   * @param {string} recordId - CCPayment unique ID for a transaction
   */
  async getDepositRecord(recordId) {
    try {
      const response = await axios.post(`${this.baseUrl}/deposit-record`, { recordId }, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get deposit records list
   * Endpoint: /api/payment/ccpayment/deposit/records (GET)
   * @param {Object} params - Query parameters
   * @param {number} [params.coinId] - Coin ID
   * @param {string} [params.referenceId] - Unique reference ID for the user
   * @param {string} [params.orderId] - Order ID
   * @param {string} [params.chain] - Symbol of the chain
   * @param {number} [params.startAt] - Retrieve records starting from this timestamp
   * @param {number} [params.endAt] - Retrieve records up to this timestamp
   * @param {string} [params.nextId] - Next ID for pagination
   */
  async getDepositRecords(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${this.baseUrl}/deposit/records?${queryParams.toString()}`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Unbind an address
   * Endpoint: /api/payment/ccpayment/unbind-address (POST)
   * @param {Object} data - Request data
   * @param {string} data.chain - Required: Chain symbol of the address to be unbound (defaults to 'ETH')
   * @param {string} data.address - Required: Address to be unbound
   */
  async unbindAddress(data) {
    try {
      const requestData = {
        ...data,
        chain: data.chain || "ETH"
      };
      const response = await axios.post(`${this.baseUrl}/unbind-address`, requestData, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Create a withdrawal request
   * Endpoint: /api/payment/ccpayment/withdraw (POST)
   * @param {Object} data - Request data
   * @param {string} data.amount - Required: Withdrawal amount
   * @param {number} data.coinId - Required: Coin ID
   * @param {string} data.address - Required: Withdrawal destination address
   * @param {string} [data.chain="ETH"] - Symbol of the chain (defaults to 'ETH')
   * @param {string} [data.memo] - Memo of the withdrawal address
   * @param {boolean} [data.merchantPayNetworkFee=false] - True if merchant pays network fee, false if user pays
   */
  async createWithdrawal(data) {
    try {
      // Default to ETH chain if not specified
      const requestData = {
        ...data,
        chain: data.chain || "ETH",
        merchantPayNetworkFee: data.merchantPayNetworkFee || false
      };
      const response = await axios.post(`${this.baseUrl}/withdraw`, requestData, this.getAuthHeaders());
      if (response.data.success) {
        toast.success("Withdrawal request submitted successfully");
      }
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get withdrawal record status
   * Endpoint: /api/payment/ccpayment/withdraw/status/:withdrawalId (GET)
   * @param {string} withdrawalId - Your unique order ID for the withdrawal
   */
  async getWithdrawalStatus(withdrawalId) {
    try {
      const response = await axios.get(`${this.baseUrl}/withdraw/status/${withdrawalId}`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Get withdrawal records list
   * Endpoint: /api/payment/ccpayment/withdraw/records (GET)
   * @param {Object} params - Query parameters
   * @param {number} [params.coinId] - Coin ID
   * @param {string} [params.orderIds] - Comma-separated list of order IDs (max 20)
   * @param {string} [params.chain] - Symbol of the chain
   * @param {number} [params.startAt] - Retrieve records starting from this timestamp
   * @param {number} [params.endAt] - Retrieve records up to this timestamp
   * @param {string} [params.nextId] - Next ID for pagination
   */
  async getWithdrawalRecords(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${this.baseUrl}/withdraw/records?${queryParams.toString()}`, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // convertAmount method removed as backend doesn't support this endpoint

  /**
   * Get coin USD price (Alias for getCurrencyPrices)
   * @param {string|array} coinIds - Comma-separated list or array of coin IDs
   */
  async getCoinUSDTPrice(coinIds) {
    return this.getCurrencyPrices(coinIds);
  }

  // Handle errors
  handleError(error) {
    if (error.response) {
      console.error('CCPayment API Error:', error.response.data);
      toast.error(error.response.data?.message || "Payment processing error");
    } else if (error.request) {
      console.error('Network Error:', error.request);
      toast.error("Network error while processing payment");
    } else {
      console.error('Error:', error.message);
      toast.error(error.message || "Unknown payment error");
    }
  }
}

// Export a singleton instance
export const ccpaymentService = new CCPaymentService();
