<script>
  import { onMount } from 'svelte';
  import { ccpaymentService } from '$lib/services/ccpayment';
  import { selectedCoin, depositAddress, ccpaymentLoading, ccpaymentError } from '$lib/store/ccpayment';
  import { user } from '$lib/store/profile';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { url } from '$lib/store/routes';
  import QRCode from '$lib/components/QRCode.svelte';
  import { getTokensWithData, getCoinIdFromSymbol } from '$lib/utils/ccpayment';

  export let coinId;
  export let symbol;
  export let networkChain = 'ETH'; // Default network
  export let wallet = [];

  let coin = null;
  let networks = [];
  let selectedNetwork = null;
  let copySuccess = false;

  // Get our supported tokens with data from wallet if available
  const supportedTokensData = getTokensWithData(wallet);

  onMount(async () => {
    if (!$selectedCoin && (coinId || symbol)) {
      // If we don't have the selected coin in the store but have coinId or symbol, try to find it
      try {
        ccpaymentLoading.update(state => ({ ...state, coins: true }));

        // Try to get coin from API first
        try {
          const response = await ccpaymentService.getSupportedCurrencies();

          if (response.success) {
            let foundCoin;

            if (coinId) {
              foundCoin = response.data.coins.find(c => c.coinId === parseInt(coinId));
            } else if (symbol) {
              foundCoin = response.data.coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
            }

            if (foundCoin) {
              selectedCoin.set(foundCoin);
            }
          }
        } catch (apiError) {
          console.warn('Could not fetch coin from API', apiError);
        }

        // If we still don't have a selected coin, create one from our supported tokens
        if (!$selectedCoin && symbol) {
          const tokenData = supportedTokensData.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());

          if (tokenData) {
            const coinId = await getCoinIdFromSymbol(tokenData.symbol);

            const fallbackCoin = {
              coinId: parseInt(coinId),
              symbol: tokenData.symbol,
              coinFullName: tokenData.name,
              logoUrl: tokenData.image,
              networks: {
                'ETH': {
                  chain: 'ETH',
                  chainFullName: 'Ethereum',
                  canDeposit: true,
                  canWithdraw: true,
                  minimumDepositAmount: '0',
                  minimumWithdrawAmount: '0.001'
                }
              }
            };

            selectedCoin.set(fallbackCoin);
          } else {
            toast.error('Selected cryptocurrency not found');
            goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=deposit&provider=ccpayment`);
          }
        } else if (!$selectedCoin) {
          toast.error('Selected cryptocurrency not found');
          goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=deposit&provider=ccpayment`);
        }
      } catch (error) {
        console.error('Error loading coin:', error);
        toast.error('Error loading cryptocurrency details');
      } finally {
        ccpaymentLoading.update(state => ({ ...state, coins: false }));
      }
    }

    if ($selectedCoin) {
      coin = $selectedCoin;

      // Get available networks for this coin that support deposits
      networks = Object.entries(coin.networks || {})
        .filter(([_, network]) => network.canDeposit)
        .map(([chainName, network]) => ({
          chain: chainName,
          ...network
        }));

      // If no networks are available, create a default one
      if (networks.length === 0) {
        networks = [{
          chain: 'ETH',
          chainFullName: 'Ethereum',
          canDeposit: true,
          canWithdraw: true,
          minimumDepositAmount: '0',
          minimumWithdrawAmount: '0.001'
        }];
      }

      // Set default network or use the provided one if it exists
      selectedNetwork = networks.find(n => n.chain === networkChain) || networks[0];

      if (selectedNetwork) {
        await generateDepositAddress(selectedNetwork.chain);
      }
    }
  });

  const generateDepositAddress = async (chain) => {
    if (!$user?.user_id) {
      toast.error('You must be logged in to generate a deposit address');
      return;
    }

    try {
      ccpaymentLoading.update(state => ({ ...state, depositAddress: true }));

      // Use user_id as reference ID
      const referenceId = $user.user_id.toString();

      const response = await ccpaymentService.getOrCreateDepositAddress({
        referenceId,
        chain
      });

      if (response.success) {
        depositAddress.set(response.data);
      } else {
        toast.error('Failed to generate deposit address');
        ccpaymentError.update(state => ({ ...state, depositAddress: 'Failed to generate deposit address' }));
      }
    } catch (error) {
      console.error('Error generating deposit address:', error);
      toast.error('Error generating deposit address');
      ccpaymentError.update(state => ({ ...state, depositAddress: error.message }));
    } finally {
      ccpaymentLoading.update(state => ({ ...state, depositAddress: false }));
    }
  };

  const handleNetworkChange = async (network) => {
    selectedNetwork = network;
    await generateDepositAddress(network.chain);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      copySuccess = true;
      toast.success('Address copied to clipboard');

      setTimeout(() => {
        copySuccess = false;
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error('Failed to copy address');
    }
  };

  const goBack = () => {
    goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=deposit`);
  };
</script>

<h1 class="css-mpks89">
  <button on:click={goBack} class="css-bofapj">
    <svg viewBox="0 0 8 14" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" size="9" color="#fff" class="css-6opzgw">
      <title>arrow</title>
      <g id="arrow" fill-rule="currentColor">
        <path d="M8,12.534 C8.00312077,12.1491981 7.86017338,11.7775349 7.6,11.494 L3.348,7 L7.6,2.506 C8.14019021,1.91980519 8.14019021,1.01719481 7.6,0.431 C7.34808121,0.156127315 6.99235127,-0.000378973093 6.6195,-0.000378973093 C6.24664873,-0.000378973093 5.89091879,0.156127315 5.639,0.431 L0.407,5.963 C-0.135688789,6.54706274 -0.135688789,7.45093726 0.407,8.035 L5.634,13.569 C5.88591879,13.8438727 6.24164873,14.000379 6.6145,14.000379 C6.98735127,14.000379 7.34308121,13.8438727 7.595,13.569 C7.8548547,13.2872672 7.99785194,12.9172619 7.995,12.534" id="Arrow-left-1"></path>
      </g>
    </svg>
  </button>
  {#if coin}
    <img src="{coin.logoUrl}" alt="{coin.symbol}" size="32" class="css-bzek24">
    Deposit {coin.symbol || symbol}
  {:else if symbol}
    <div class="css-loading-small"></div>
    Deposit {symbol}
  {:else}
    <div class="css-loading-small"></div>
    Loading...
  {/if}
</h1>

<div class="css-1slrani">
  {#if $ccpaymentLoading.depositAddress}
    <div class="css-loading">Generating deposit address...</div>
  {:else if $ccpaymentError.depositAddress}
    <div class="css-error">
      <p>Error generating deposit address</p>
      <button class="css-vmbe4r" on:click={() => generateDepositAddress(selectedNetwork.chain)}>Retry</button>
    </div>
  {:else if coin && networks.length > 0}
    <div class="deposit-container">
      <div class="deposit-instructions">
        <p>Send the amount of {coin.symbol} of your choice to the following address to receive the equivalent in Coins.</p>

        {#if networks.length > 1}
          <div class="css-network-selector">
            <label for="network-selector" class="css-1vec8iw">Select Network</label>
            <div class="css-network-buttons" id="network-selector" role="radiogroup" aria-labelledby="network-selector-label">
              {#each networks as network}
                <button
                  type="button"
                  class="css-network-button {selectedNetwork.chain === network.chain ? 'active' : ''}"
                  on:click={() => handleNetworkChange(network)}
                  role="radio"
                  aria-checked={selectedNetwork.chain === network.chain}
                >
                  {network.chainFullName}
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="warning-message">
          <div class="warning-icon">⚠️</div>
          <div class="warning-text">
            Deposited {coin.symbol} must be above 0.002 {coin.symbol}. Deposits below this amount will not be credited.
          </div>
        </div>

        <div class="warning-message">
          <div class="warning-icon">⚠️</div>
          <div class="warning-text">
            {coin.coinFullName} is a highly experimental blockchain. Deposits and withdrawals might be routinely delayed for extended periods of time. Use at your own risk.
          </div>
        </div>
      </div>

      {#if $depositAddress.address}
        <div class="qr-code-container">
          <QRCode text={$depositAddress.address} size={150} />
        </div>
      {/if}
    </div>

    {#if $depositAddress.address}
      <div class="address-section">
        <div class="address-label">
          YOUR PERSONAL {coin.symbol} DEPOSIT ADDRESS {#if selectedNetwork.chain !== 'MAIN'}({selectedNetwork.chainFullName}){/if}
        </div>
        <div class="address-container">
          <div id="deposit-address" class="address-text">{$depositAddress.address}</div>
          <button class="copy-button" on:click={() => copyToClipboard($depositAddress.address)} aria-label="Copy deposit address">
            {copySuccess ? 'COPIED' : 'COPY ADDRESS'}
          </button>
        </div>
      </div>

      {#if $depositAddress.memo}
        <div class="memo-section">
          <div class="address-label">Memo (Required)</div>
          <div class="address-container">
            <div id="deposit-memo" class="address-text">{$depositAddress.memo}</div>
            <button class="copy-button" on:click={() => copyToClipboard($depositAddress.memo)} aria-label="Copy memo">
              {copySuccess ? 'COPIED' : 'COPY MEMO'}
            </button>
          </div>
        </div>
      {/if}

      <div class="sweep-link">
        Missing {coin.symbol} deposits? <button class="sweep-request" on:click={() => alert('Sweep request functionality will be implemented soon.')}>Request deposit address sweep</button>
      </div>
    {/if}
  {:else}
    <div class="css-error">
      <p>No available networks for this cryptocurrency</p>
      <button class="css-vmbe4r" on:click={goBack}>Go Back</button>
    </div>
  {/if}
</div>

<style>
  .css-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: rgb(177, 182, 198);
  }

  .css-loading-small {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .css-error {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #ff5252;
  }

  .css-network-selector {
    margin: 16px 0;
  }

  .css-network-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .css-network-button {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    padding: 8px 12px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .css-network-button:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .css-network-button.active {
    background-color: #3861fb;
    border-color: #3861fb;
  }

  /* New styles for the updated design */
  .deposit-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .deposit-instructions {
    flex: 1;
    margin-right: 20px;
  }

  .deposit-instructions p {
    margin-bottom: 20px;
    color: #fff;
    line-height: 1.5;
  }

  .warning-message {
    display: flex;
    margin-bottom: 16px;
    background-color: rgba(255, 229, 0, 0.05);
    border-radius: 4px;
    padding: 12px;
  }

  .warning-icon {
    margin-right: 10px;
    font-size: 18px;
  }

  .warning-text {
    color: #ffc107;
    font-size: 14px;
    line-height: 1.5;
  }

  .qr-code-container {
    background-color: #fff;
    padding: 10px;
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .address-section {
    margin-top: 20px;
    margin-bottom: 16px;
  }

  .address-label {
    font-weight: bold;
    color: #fff;
    margin-bottom: 8px;
    text-transform: uppercase;
    font-size: 14px;
  }

  .address-container {
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 8px;
  }

  .address-text {
    flex: 1;
    word-break: break-all;
    font-family: monospace;
    color: #fff;
  }

  .copy-button {
    background-color: #00c853;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-weight: bold;
    white-space: nowrap;
  }

  .copy-button:hover {
    background-color: #00b34a;
  }

  .sweep-link {
    margin-top: 16px;
    color: #b1b6c6;
    font-size: 14px;
  }

  .sweep-request {
    color: #3861fb;
    text-decoration: none;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    display: inline;
  }

  .sweep-request:hover {
    text-decoration: underline;
  }

  .memo-section {
    margin-top: 16px;
    margin-bottom: 16px;
  }
</style>
