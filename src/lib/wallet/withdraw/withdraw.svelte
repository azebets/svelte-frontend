<script>
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation"
    import { url } from "$lib/store/routes";
    import Detailed from "./detailed.svelte";
    import { isLoggin} from "$lib/store/activities";
    import { user } from "$lib/store/profile";
    import CCPaymentWithdrawalForm from "./ccpayment/WithdrawalForm.svelte";
    import { getCoinIdFromSymbol, getTokensWithData, getSupportedTokens, fetchSupportedTokens, supportedTokensStore } from "$lib/utils/ccpayment";
    import { ccpaymentService } from '$lib/services/ccpayment';
    import { ccpaymentCoins, selectedCoin, ccpaymentLoading, ccpaymentError } from '$lib/store/ccpayment';
    import { toast } from 'svelte-sonner';

    export let wallet
    export let currency
    export let provider = null

    $: activeCoin = ""
    $: coinId = null
    $: status = null
    $: supportedTokensData = $supportedTokensStore

    // Get our supported tokens with data from wallet if available
    $: supportedTokens = getTokensWithData(wallet);

    $:{
        if(currency){
            wallet.forEach(element => {
                if((element.coin_name).toLowerCase() === currency){
                    activeCoin = element
                }
            });
        }
    }

    // Parse URL parameters
    $: {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            provider = urlParams.get('provider') || provider;
            coinId = urlParams.get('coinId');
            status = urlParams.get('status');
            const urlSymbol = urlParams.get('symbol');
            if (urlSymbol && !currency) {
                currency = urlSymbol;
            }
        }
    }

    onMount(async () => {
        // Fetch supported tokens from the server
        await fetchSupportedTokens(true);

        if (provider === 'ccpayment') {
            try {
                ccpaymentLoading.update(state => ({ ...state, coins: true }));

                // Prepare the coin data for our supported tokens
                const coinData = await Promise.all(supportedTokens.map(async token => {
                    const coinId = await getCoinIdFromSymbol(token.symbol);
                    return {
                        coinId: parseInt(coinId),
                        symbol: token.symbol,
                        coinFullName: token.name,
                        logoUrl: token.image,
                        // Add additional data needed for the withdrawal flow
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
                }));

                // Set the coins in the store
                ccpaymentCoins.set(coinData);

                // Try to fetch actual network data from the API
                try {
                    const response = await ccpaymentService.getSupportedCurrencies();

                    if (response.success && response.data && response.data.coins) {
                        // Update our coin data with actual network information from the API
                        const updatedCoinData = coinData.map(coin => {
                            const apiCoin = response.data.coins.find(c =>
                                c.symbol.toUpperCase() === coin.symbol.toUpperCase());

                            if (apiCoin && apiCoin.networks) {
                                return {
                                    ...coin,
                                    coinId: apiCoin.coinId,
                                    networks: apiCoin.networks
                                };
                            }

                            return coin;
                        });

                        ccpaymentCoins.set(updatedCoinData);
                    }
                } catch (apiError) {
                    console.warn('Could not fetch network data from API, using defaults', apiError);
                }
            } catch (error) {
                console.error('Error preparing coin data:', error);
                toast.error('Error loading supported cryptocurrencies');
                ccpaymentError.update(state => ({ ...state, coins: error.message }));
            } finally {
                ccpaymentLoading.update(state => ({ ...state, coins: false }));
            }
        }
    });

    // Function to handle cryptocurrency selection
    const handleCryptoSelect = async (symbol) => {
        // Get the coin ID for the selected cryptocurrency
        const coinId = await getCoinIdFromSymbol(symbol);
        goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw&provider=ccpayment&coinId=${coinId}&symbol=${symbol}`);
    }

    // Function to handle coin selection
    const handleCoinSelect = async (coin) => {
        selectedCoin.set(coin);
        goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw&provider=ccpayment&coinId=${coin.coinId}&symbol=${coin.symbol}`);
    };
</script>

{#if !currency && !provider}
    <div>
        <h1 class="css-rhqiop">Withdrawal options</h1>

        {#if supportedTokensStore.isLoading}
            <div class="css-loading">Loading supported cryptocurrencies...</div>
        {:else if supportedTokensStore.error}
            <div class="css-error">
                <p>Error loading cryptocurrencies</p>
                <button class="css-vmbe4r" on:click={() => fetchSupportedTokens(true)}>Retry</button>
            </div>
        {:else}
            <div class="css-1d5ntxf">
                <!-- Cryptocurrency options -->
                {#each supportedTokens as token}
                    <button on:click={() => handleCryptoSelect(token.symbol)} class="css-1yhwmxl enabled">
                        <div class="css-tt41bp">
                            <img src="{token.image}" alt="{token.symbol}" size="32" class="css-bzek24">
                        </div>
                        <div class="css-1v92hyt">
                            {token.name}
                            <div class="css-h7b5qw">{token.symbol}</div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
{/if}

{#if provider === 'ccpayment' && !coinId}
    <div>
        <h1 class="css-rhqiop">Select Cryptocurrency</h1>

        {#if $ccpaymentLoading.coins}
            <div class="css-loading">Loading supported cryptocurrencies...</div>
        {:else if $ccpaymentError.coins}
            <div class="css-error">
                <p>Error loading cryptocurrencies</p>
                <button class="css-vmbe4r" on:click={() => window.location.reload()}>Retry</button>
            </div>
        {:else}
            <div class="css-1d5ntxf">
                {#each $ccpaymentCoins as coin}
                    <button on:click={() => handleCoinSelect(coin)} class="css-1yhwmxl enabled">
                        <div class="css-tt41bp">
                            <img src="{coin.logoUrl}" alt="{coin.symbol}" size="32" class="css-bzek24">
                        </div>
                        <div class="css-1v92hyt">
                            {coin.coinFullName}
                            <div class="css-h7b5qw">{coin.symbol}</div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
{/if}

{#if provider === 'ccpayment' && coinId && status !== 'success'}
    <CCPaymentWithdrawalForm {coinId} symbol={currency} {wallet} />
{/if}

{#if provider === 'ccpayment' && status === 'success'}
    <div class="css-success-container">
        <div class="css-success-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" size="48" class="css-success-svg">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.243 17.657L6.343 13.24l1.414-1.414 3 3 6.486-6.486 1.414 1.414-7.9 7.9z" fill="currentColor"/>
            </svg>
        </div>
        <h1 class="css-success-title">Withdrawal Request Submitted</h1>
        <p class="css-success-message">Your withdrawal request has been submitted successfully. It will be processed shortly.</p>
        <button on:click={() => goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=withdraw`)} class="css-vmbe4r">Back to Withdrawals</button>
    </div>
{/if}

{#if currency && !provider}
    <Detailed activeCoin={activeCoin}/>
{/if}

<style>
    .css-success-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        text-align: center;
    }

    .css-success-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 80px;
        height: 80px;
        background-color: rgba(39, 174, 96, 0.1);
        border-radius: 50%;
        margin-bottom: 24px;
    }

    .css-success-svg {
        width: 48px;
        height: 48px;
        color: #27ae60;
    }

    .css-success-title {
        font-size: 24px;
        font-weight: 600;
        color: white;
        margin-bottom: 16px;
    }

    .css-success-message {
        font-size: 16px;
        color: rgb(177, 182, 198);
        margin-bottom: 24px;
        max-width: 400px;
    }

    .css-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: rgb(177, 182, 198);
    }

    .css-error {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: #ff5252;
    }
</style>