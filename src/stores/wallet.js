import { writable } from 'svelte/store';

// Initialize with null
export const default_Wallet = writable(null);

// Function to update wallet
export function updateDefaultWallet(walletData) {
    default_Wallet.set(walletData);
}