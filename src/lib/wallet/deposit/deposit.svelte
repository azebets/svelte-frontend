<script>
    import { onMount } from 'svelte';
    import { user } from "$lib/store/profile";
    import Details from "./details.svelte";
    import { goto } from "$app/navigation"
    import { getCoinIdFromSymbol, getTokensWithData, getSupportedTokens } from "$lib/utils/ccpayment";
    import { ccpaymentService } from '$lib/services/ccpayment';
    import { ccpaymentCoins, selectedCoin, ccpaymentLoading, ccpaymentError } from '$lib/store/ccpayment';
    import { toast } from 'svelte-sonner';
    export let wallet
    export let currency
    export let provider = null
    import Warning from "./warning.svelte";
    import { url } from "$lib/store/routes";
    import CCPaymentDepositAddress from "./ccpayment/DepositAddress.svelte";

    $: warning = false
    $: activeCoin = ""
    $: coinId = null

    // Get cryptocurrency tokens for CCPayment
    const cryptoTokens = [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'LTC', name: 'Litecoin' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'USDT', name: 'Tether' },
        { symbol: 'USDC', name: 'USD Coin' },
        { symbol: 'TRX', name: 'TRON' },
        { symbol: 'TETH', name: 'Test Ethereum' }
    ];

    // Get our supported tokens with data from wallet if available
    const supportedTokens = getTokensWithData(wallet);

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
            const urlSymbol = urlParams.get('symbol');
            if (urlSymbol && !currency) {
                currency = urlSymbol;
            }
        }
    }

    onMount(async () => {
        if (provider === 'ccpayment') {
            try {
                ccpaymentLoading.update(state => ({ ...state, coins: true }));

                // Fetch the full coin list to get coin IDs and network information
                const response = await ccpaymentService.getSupportedCurrencies();

                if (response.success) {
                    // Filter coins to match our supported tokens and that can be deposited
                    const depositableCoins = response.data.coins.filter(coin => {
                        // Check if the coin is in our supported list and has at least one network that supports deposits
                        return supportedTokens.some(token => token.symbol.toUpperCase() === coin.symbol.toUpperCase()) &&
                            Object.values(coin.networks).some(network => network.canDeposit);
                    });

                    // If we don't have all our supported tokens in the API response,
                    // we'll create placeholder objects for them
                    const allCoins = [...depositableCoins];

                    for (const token of supportedTokens) {
                        if (!depositableCoins.some(coin => coin.symbol.toUpperCase() === token.symbol.toUpperCase())) {
                            // Get coin ID from our utility function
                            const coinId = await getCoinIdFromSymbol(token.symbol);

                            // Create a placeholder coin object
                            allCoins.push({
                                coinId: parseInt(coinId),
                                symbol: token.symbol,
                                coinFullName: token.name,
                                logoUrl: token.image,
                                networks: {
                                    'ETH': {
                                        chain: 'ETH',
                                        chainFullName: 'Ethereum',
                                        canDeposit: true,
                                        canWithdraw: true
                                    }
                                }
                            });
                        }
                    }

                    ccpaymentCoins.set(allCoins);
                } else {
                    // If API fails, use our predefined list
                    const fallbackCoins = await Promise.all(supportedTokens.map(async token => {
                        const coinId = await getCoinIdFromSymbol(token.symbol);
                        return {
                            coinId: parseInt(coinId),
                            symbol: token.symbol,
                            coinFullName: token.name,
                            logoUrl: token.image,
                            networks: {
                                'ETH': {
                                    chain: 'ETH',
                                    chainFullName: 'Ethereum',
                                    canDeposit: true,
                                    canWithdraw: true
                                }
                            }
                        };
                    }));

                    ccpaymentCoins.set(fallbackCoins);
                    toast.error('Using fallback cryptocurrency list');
                }
            } catch (error) {
                console.error('Error loading coins:', error);
                toast.error('Error loading supported cryptocurrencies');
                ccpaymentError.update(state => ({ ...state, coins: error.message }));

                // Use fallback list on error
                const fallbackCoins = await Promise.all(supportedTokens.map(async token => {
                    const coinId = await getCoinIdFromSymbol(token.symbol);
                    return {
                        coinId: parseInt(coinId),
                        symbol: token.symbol,
                        coinFullName: token.name,
                        logoUrl: token.image,
                        networks: {
                            'ETH': {
                                chain: 'ETH',
                                chainFullName: 'Ethereum',
                                canDeposit: true,
                                canWithdraw: true
                            }
                        }
                    };
                }));

                ccpaymentCoins.set(fallbackCoins);
            } finally {
                ccpaymentLoading.update(state => ({ ...state, coins: false }));
            }
        }
    });

    const handleOpenDetails = ((e)=>{
        // TEMPORARILY DISABLED FOR TESTING
        // if(!$user?.is_verified) {
        //     warning = true
        // }
        // else{
            goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=deposit&cur=${(e).toLowerCase()}`)
        // }
    })

    const handleCryptoSelect = async (symbol) => {
        // TEMPORARILY DISABLED FOR TESTING
        // if(!$user?.is_verified) {
        //     warning = true
        //     return;
        // }

        // Get the coin ID for the selected cryptocurrency
        const coinId = await getCoinIdFromSymbol(symbol);
        goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=deposit&provider=ccpayment&coinId=${coinId}&symbol=${symbol}`);
    }

    const handleCoinSelect = async (coin) => {
        selectedCoin.set(coin);
        goto(`${$url === "/" ? "" : $url}/?tab=wallet&modal=deposit&provider=ccpayment&coinId=${coin.coinId}&symbol=${coin.symbol}`);
    };

    // Get token image from wallet
    const getTokenImage = (symbol) => {
        // Define default images for each token
        const defaultImages = {
            'BTC': 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png?1696501400',
            'ETH': 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
            'TETH': 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628',
            'LTC': 'https://assets.coingecko.com/coins/images/2/standard/litecoin.png?1696501400',
            'SOL': 'https://s2.coinmarketcap.com/static/img/coins/64x64/16116.png',
            'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether.png?1668148663',
            'USDC': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png?1547042389',
            'TRX': 'https://assets.coingecko.com/coins/images/1094/standard/tron-logo.png?1696502193'
        };

        // Try to find the token in the wallet array
        const token = wallet.find(t => t.coin_name.toUpperCase() === symbol.toUpperCase());

        // Return the token image if found, otherwise use the default image for that symbol
        return token ? token.coin_image : (defaultImages[symbol.toUpperCase()] || defaultImages['BTC']);
    }
</script>


{#if !currency && !provider}
    <div>
        <h1 class="css-rhqiop">Deposit options</h1>
        <div class="css-1d5ntxf">
            <!-- Cryptocurrency options -->
            {#each cryptoTokens as token}
                <button on:click={() => handleCryptoSelect(token.symbol)} class="css-1yhwmxl enabled">
                    <div class="css-tt41bp">
                        <img src="{getTokenImage(token.symbol)}" alt="{token.symbol}" size="32" class="css-bzek24">
                    </div>
                    <div class="css-1v92hyt">
                        {token.name}
                        <div class="css-h7b5qw">{token.symbol}</div>
                    </div>
                </button>
            {/each}

            <!-- <div class="css-deposit-method-divider">OR</div> -->

            <!-- Fiat options -->
            {#each wallet as wa}
                <!-- <button on:click={()=> handleOpenDetails(wa.coin_name)} disabled={wa.disabled} class="css-1yhwmxl {wa.disabled ? "disabled" : "enabled"}">
                    <div class="css-tt41bp">
                        <img src="{wa.coin_image}" alt="" size="32" class="css-bzek24">
                    </div>
                    <div class="css-1v92hyt">
                        {wa.fullname}
                        <div class="css-h7b5qw">{wa.coin_name}</div>
                    </div>
                </button> -->
            {/each}
        </div>
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

{#if provider === 'ccpayment' && coinId}
    <CCPaymentDepositAddress {coinId} symbol={currency} {wallet} />
{/if}

{#if currency && !provider}
    <Details activeCoin={activeCoin}/>
{/if}

{#if warning}
    <Warning on:close={()=> warning = false}/>
{/if}

<style>
    .css-deposit-method-divider {
        display: flex;
        align-items: center;
        text-align: center;
        color: rgb(177, 182, 198);
        font-size: 14px;
        margin: 16px 0;
        width: 100%;
    }

    .css-deposit-method-divider::before,
    .css-deposit-method-divider::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .css-deposit-method-divider::before {
        margin-right: 16px;
    }

    .css-deposit-method-divider::after {
        margin-left: 16px;
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