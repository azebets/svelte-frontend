<script>
  import { onMount } from 'svelte';
  import { ccpaymentService } from '$lib/services/ccpayment';
  import { selectedCoin, withdrawalStatus, ccpaymentLoading, ccpaymentError } from '$lib/store/ccpayment';
  import { user } from '$lib/store/profile';
  import { toast } from 'svelte-sonner';
  import { goto } from '$app/navigation';
  import { url } from '$lib/store/routes';
  import { getTokensWithData, getCoinIdFromSymbol, getDefaultExchangeRate } from '$lib/utils/ccpayment';

  export let coinId;
  export let symbol;
  export let wallet = [];

  let coin = null;
  let networks = [];
  let selectedNetwork = null;
  let withdrawalAmount = '';
  let withdrawalAddress = '';
  let withdrawalMemo = '';
  let networkFee = '0';
  let minimumWithdrawalAmount = '0';
  let maximumWithdrawalAmount = '0';
  let usdEquivalent = '0';
  let isSubmitting = false;
  let errors = {
    address: '',
    amount: '',
    memo: ''
  };

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
                  minimumWithdrawAmount: '0.001',
                  maximumWithdrawAmount: '1000000'
                }
              }
            };

            selectedCoin.set(fallbackCoin);
          } else {
            toast.error('Selected cryptocurrency not found');
            goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw&provider=ccpayment`);
          }
        } else if (!$selectedCoin) {
          toast.error('Selected cryptocurrency not found');
          goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw&provider=ccpayment`);
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

      // Get available networks for this coin that support withdrawals
      networks = Object.entries(coin.networks || {})
        .filter(([_, network]) => network.canWithdraw)
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
          minimumWithdrawAmount: '0.001',
          maximumWithdrawAmount: '1000000'
        }];
      }

      // Set default network
      selectedNetwork = networks[0];
      minimumWithdrawalAmount = selectedNetwork.minimumWithdrawAmount || '0.001';
      maximumWithdrawalAmount = selectedNetwork.maximumWithdrawAmount || '1000000'; // Default high value if not specified

      // Set default network fee
      networkFee = '0.001'; // Default fee

      // Try to get actual network fee from API (placeholder for future implementation)
      try {
        // This would be an API call to get the actual fee
        // For now, we'll use a default value
      } catch (error) {
        console.error('Error getting network fee:', error);
      }

      // Get USD price for the coin
      try {
        // Try to get price from API first
        const priceResponse = await ccpaymentService.getCurrencyPrices([coin.coinId]);
        let usdPrice;

        if (priceResponse.success && priceResponse.data.prices && priceResponse.data.prices[coin.coinId]) {
          usdPrice = priceResponse.data.prices[coin.coinId];
        } else {
          // Use fallback price if API fails
          usdPrice = getDefaultExchangeRate(coin.symbol);
        }

        // Create function to update USD equivalent
        const updateUsdEquivalent = () => {
          if (withdrawalAmount && !isNaN(withdrawalAmount)) {
            usdEquivalent = (parseFloat(withdrawalAmount) * parseFloat(usdPrice)).toFixed(2);
          } else {
            usdEquivalent = '0';
          }
        };

        // Initial calculation
        updateUsdEquivalent();

        // Set up a watcher for withdrawalAmount changes
        setInterval(() => {
          updateUsdEquivalent();
        }, 500);

      } catch (error) {
        console.error('Error getting coin price:', error);
        // Use fallback price
        const usdPrice = getDefaultExchangeRate(coin.symbol);

        // Update USD equivalent when amount changes
        if (withdrawalAmount && !isNaN(withdrawalAmount)) {
          usdEquivalent = (parseFloat(withdrawalAmount) * usdPrice).toFixed(2);
        }
      }
    }
  });

  const handleNetworkChange = (network) => {
    selectedNetwork = network;
    minimumWithdrawalAmount = network.minimumWithdrawAmount;
    maximumWithdrawalAmount = network.maximumWithdrawAmount || '1000000';

    // Clear memo if the new network doesn't support it
    if (!network.isSupportMemo) {
      withdrawalMemo = '';
    }

    validateForm();
  };

  const validateForm = () => {
    let isValid = true;

    // Validate address
    if (!withdrawalAddress.trim()) {
      errors.address = 'Withdrawal address is required';
      isValid = false;
    } else {
      errors.address = '';
    }

    // Validate amount
    if (!withdrawalAmount.trim()) {
      errors.amount = 'Withdrawal amount is required';
      isValid = false;
    } else if (isNaN(withdrawalAmount) || parseFloat(withdrawalAmount) <= 0) {
      errors.amount = 'Please enter a valid amount';
      isValid = false;
    } else if (parseFloat(withdrawalAmount) < parseFloat(minimumWithdrawalAmount)) {
      errors.amount = `Minimum withdrawal amount is ${minimumWithdrawalAmount} ${coin.symbol}`;
      isValid = false;
    } else if (
      maximumWithdrawalAmount !== '0' &&
      parseFloat(withdrawalAmount) > parseFloat(maximumWithdrawalAmount)
    ) {
      errors.amount = `Maximum withdrawal amount is ${maximumWithdrawalAmount} ${coin.symbol}`;
      isValid = false;
    } else {
      errors.amount = '';
    }

    // Validate memo if required
    if (selectedNetwork && selectedNetwork.isSupportMemo && !withdrawalMemo.trim()) {
      errors.memo = 'Memo is required for this network';
      isValid = false;
    } else {
      errors.memo = '';
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!$user?.user_id) {
      toast.error('You must be logged in to withdraw funds');
      return;
    }

    try {
      isSubmitting = true;

      const withdrawalData = {
        amount: withdrawalAmount,
        coinId: coin.coinId,
        address: withdrawalAddress,
        chain: selectedNetwork.chain
      };

      // Add memo if the network supports it and memo is provided
      if (selectedNetwork.isSupportMemo && withdrawalMemo) {
        withdrawalData.memo = withdrawalMemo;
      }

      const response = await ccpaymentService.createWithdrawal(withdrawalData);

      if (response.success) {
        withdrawalStatus.set({
          withdrawalId: response.withdrawalId,
          status: response.status,
          recordId: response.recordId
        });

        toast.success('Withdrawal request submitted successfully');

        // Redirect to a confirmation page or clear the form
        goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw&provider=ccpayment&status=success`);
      } else {
        toast.error('Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error(error.response?.data?.message || 'Error submitting withdrawal request');
    } finally {
      isSubmitting = false;
    }
  };

  const goBack = () => {
    goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw`);
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
    Withdraw {coin.symbol || symbol}
  {:else if symbol}
    <div class="css-loading-small"></div>
    Withdraw {symbol}
  {:else}
    <div class="css-loading-small"></div>
    Loading...
  {/if}
</h1>

<div class="css-1slrani">
  {#if $ccpaymentLoading.coins}
    <div class="css-loading">Loading cryptocurrency details...</div>
  {:else if $ccpaymentError.coins}
    <div class="css-error">
      <p>Error loading cryptocurrency details</p>
      <button class="css-vmbe4r" on:click={() => window.location.reload()}>Retry</button>
    </div>
  {:else if coin && networks.length > 0}
    <form on:submit={handleSubmit}>
      <div class="css-1x7hz3d">
        Please enter the {coin.symbol} wallet address you wish to receive the funds on. Once confirmed, the withdrawal is usually processed within a few minutes.
      </div>

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

      <div style="height: 8px;"></div>

      <div>
        <label for="withdrawal-address" class="css-1vec8iw">
          Receiving {coin.symbol} address ({selectedNetwork.chainFullName})
          <span class="css-1vr6qde"> *</span>
        </label>
        <div>
          <div class="css-1f51ttt">
            <input
              type="text"
              id="withdrawal-address"
              bind:value={withdrawalAddress}
              placeholder={`Paste your ${coin.symbol} wallet address here`}
              on:input={validateForm}
            >
          </div>
          {#if errors.address}
            <div class="css-error-message">{errors.address}</div>
          {/if}
        </div>
      </div>

      {#if selectedNetwork && selectedNetwork.isSupportMemo}
        <div style="height: 16px;"></div>
        <div>
          <label for="withdrawal-memo" class="css-1vec8iw">
            Memo
            <span class="css-1vr6qde"> *</span>
          </label>
          <div>
            <div class="css-1f51ttt">
              <input
                type="text"
                id="withdrawal-memo"
                bind:value={withdrawalMemo}
                placeholder="Enter memo (required for this network)"
                on:input={validateForm}
              >
            </div>
            {#if errors.memo}
              <div class="css-error-message">{errors.memo}</div>
            {/if}
          </div>
        </div>
      {/if}

      <div style="height: 24px;"></div>

      <label for="withdrawal-amount" class="css-1vec8iw">
        Withdrawal amount
        <span class="css-1vr6qde"> *</span>
      </label>

      <div class="css-191t7fp">
        <div style="width: 100%;">
          <div>
            <div class="css-1f51ttt">
              <img src="{coin.logoUrl}" alt="{coin.symbol}" size="20" class="css-1lgqybz" style="margin-right: 10px;">
              <input
                type="text"
                id="withdrawal-amount"
                bind:value={withdrawalAmount}
                placeholder="Enter amount"
                on:input={validateForm}
              >
            </div>
            {#if errors.amount}
              <div class="css-error-message">{errors.amount}</div>
            {/if}
          </div>
        </div>

        <div class="css-kaz972">=</div>

        <div style="width: 100%;">
          <div>
            <div class="css-1f51ttt">
              <span style="margin-right: 10px;">$</span>
              <input type="text" value={usdEquivalent} disabled>
            </div>
          </div>
        </div>
      </div>

      <div class="css-g5wbxx">
        Network Fee: {networkFee} {coin.symbol}
        {#if minimumWithdrawalAmount !== '0'}
          <br>
          Minimum Withdrawal: {minimumWithdrawalAmount} {coin.symbol}
        {/if}
        {#if maximumWithdrawalAmount !== '0' && maximumWithdrawalAmount !== '1000000'}
          <br>
          Maximum Withdrawal: {maximumWithdrawalAmount} {coin.symbol}
        {/if}
      </div>

      <div class="css-x3ayqu" style="margin: 16px 0;">
        <svg width="21" height="19" viewBox="0 0 21 19" xmlns="http://www.w3.org/2000/svg" size="20" color="#ffe500" glow="#FFB018" class="css-3fqycy">
          <path d="M10.5 0C11.1667 0 11.7708 0.208333 12.3125 0.625C12.8542 1.04167 13.1875 1.58333 13.3125 2.25L13.3125 2.25L19.5 2.25C19.9167 2.25 20.2708 2.39583 20.5625 2.6875C20.8542 2.97917 21 3.33333 21 3.75C21 4.16667 20.8542 4.52083 20.5625 4.8125C20.2708 5.10417 19.9167 5.25 19.5 5.25L19.5 5.25L19.125 5.25L17.8125 16.5C17.7292 17.0833 17.4375 17.5833 16.9375 18C16.4375 18.4167 15.875 18.625 15.25 18.625L15.25 18.625L5.75 18.625C5.125 18.625 4.5625 18.4167 4.0625 18C3.5625 17.5833 3.27083 17.0833 3.1875 16.5L3.1875 16.5L1.875 5.25L1.5 5.25C1.08333 5.25 0.729167 5.10417 0.4375 4.8125C0.145833 4.52083 0 4.16667 0 3.75C0 3.33333 0.145833 2.97917 0.4375 2.6875C0.729167 2.39583 1.08333 2.25 1.5 2.25L1.5 2.25L7.6875 2.25C7.8125 1.58333 8.14583 1.04167 8.6875 0.625C9.22917 0.208333 9.83333 0 10.5 0ZM10.5 1.5C10.2083 1.5 9.94792 1.59375 9.71875 1.78125C9.48958 1.96875 9.35417 2.20833 9.3125 2.5L9.3125 2.5L11.6875 2.5C11.6458 2.20833 11.5104 1.96875 11.2812 1.78125C11.0521 1.59375 10.7917 1.5 10.5 1.5ZM16.3125 5.25L4.6875 5.25L5.9375 16.125C5.97917 16.375 6.09375 16.5729 6.28125 16.7188C6.46875 16.8646 6.6875 16.9375 6.9375 16.9375L6.9375 16.9375L14.0625 16.9375C14.3125 16.9375 14.5312 16.8646 14.7188 16.7188C14.9062 16.5729 15.0208 16.375 15.0625 16.125L15.0625 16.125L16.3125 5.25Z" fill="currentColor"></path>
        </svg>
        Double-check the withdrawal address. Funds sent to the wrong address cannot be recovered.
      </div>

      <button
        class="css-wrt0jz"
        type="submit"
        disabled={isSubmitting || !validateForm()}
      >
        {isSubmitting ? 'Processing...' : 'Request withdrawal'}
      </button>

      <div class="css-1x7hz3d" style="font-size: 12px; margin: 16px 0px 0px;">
        *You will receive the specified {coin.symbol} amount to your withdrawal address<br>
        *The value subtracted from your balance may vary between now and the time we process your withdrawal
      </div>
    </form>
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

  .css-error-message {
    color: #ff5252;
    font-size: 12px;
    margin-top: 4px;
    margin-left: 4px;
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

  .css-wrt0jz:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
