import { writable } from 'svelte/store';

// Store for supported cryptocurrencies from CCPayment
export const ccpaymentCoins = writable([]);

// Store for the currently selected coin for deposit/withdrawal
export const selectedCoin = writable(null);

// Store for deposit address
export const depositAddress = writable({
  address: '',
  memo: '',
  chain: ''
});

// Store for withdrawal status
export const withdrawalStatus = writable({
  withdrawalId: '',
  status: '',
  recordId: ''
});

// Store for transaction history
export const transactionHistory = writable({
  deposits: [],
  withdrawals: []
});

// Store for loading states
export const ccpaymentLoading = writable({
  coins: false,
  depositAddress: false,
  withdrawal: false,
  history: false
});

// Store for error states
export const ccpaymentError = writable({
  coins: null,
  depositAddress: null,
  withdrawal: null,
  history: null
});
