<script>
    import { onMount } from 'svelte';
    import { ccpaymentService } from "$lib/services/ccpayment";
    import { toast } from "svelte-sonner";
    import Spinner from "$lib/components/Spinner.svelte";

    // Deposit records state
    let deposits = [];
    let loading = true;
    let error = null;
    let nextId = null;
    let hasMore = false;

    // Filter state
    let selectedCoin = '';
    let startDate = '';
    let endDate = '';
    let supportedCoins = [
        { id: '', name: 'All Coins' },
        { id: '1', name: 'Bitcoin (BTC)' },
        { id: '2', name: 'Ethereum (ETH)' },
        { id: '3', name: 'Tether (USDT)' },
        { id: '5', name: 'Litecoin (LTC)' },
        { id: '6', name: 'Solana (SOL)' },
        { id: '7', name: 'TRON (TRX)' }
    ];

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    // Format amount with 8 decimal places max
    const formatAmount = (amount) => {
        if (!amount) return '0';
        return parseFloat(amount).toFixed(8).replace(/\.?0+$/, '');
    };

    // Get status badge class based on status
    const getStatusClass = (status) => {
        if (!status) return 'status-unknown';

        // Convert to lowercase for case-insensitive comparison
        const statusLower = status.toLowerCase();

        switch (statusLower) {
            case 'completed':
            case 'success':
                return 'status-completed';
            case 'pending':
                return 'status-pending';
            case 'failed':
                return 'status-failed';
            default:
                return 'status-unknown';
        }
    };

    // Load deposit records
    const loadDeposits = async (reset = false) => {
        try {
            loading = true;
            error = null;

            // Prepare filter parameters
            const params = {};
            if (selectedCoin) params.coinId = selectedCoin;

            // Add date filters if provided
            if (startDate) {
                params.startAt = Math.floor(new Date(startDate).getTime() / 1000);
            }
            if (endDate) {
                params.endAt = Math.floor(new Date(endDate).getTime() / 1000);
            }

            // Add pagination if not resetting
            if (!reset && nextId) {
                params.nextId = nextId;
            }

            // Call the API
            const response = await ccpaymentService.getDepositRecords(params);

            if (response && response.success && response.data && Array.isArray(response.data.records)) {
                // If resetting, replace the list, otherwise append
                deposits = reset ? response.data.records : [...deposits, ...response.data.records];
                nextId = response.data.nextId;
                hasMore = !!nextId;
            } else {
                deposits = [];
                nextId = null;
                hasMore = false;
                error = (response && response.message) || 'Failed to load deposit records';
                toast.error(error);
            }
        } catch (err) {
            deposits = [];
            nextId = null;
            hasMore = false;
            error = err.message || 'An error occurred while loading deposit records';
            toast.error(error);
        } finally {
            loading = false;
        }
    };

    // Handle filter change
    const handleFilterChange = () => {
        loadDeposits(true); // Reset and load with new filters
    };

    // Load more records
    const loadMore = () => {
        if (hasMore && !loading) {
            loadDeposits(false);
        }
    };

    onMount(() => {
        loadDeposits(true);
    });
</script>

<div class="deposits-container">
    <h1 class="page-title">Deposit History</h1>

    <!-- Filters -->
    <div class="filters-container">
        <div class="filter-group">
            <label for="coin-filter">Cryptocurrency</label>
            <select id="coin-filter" bind:value={selectedCoin} on:change={handleFilterChange}>
                {#each supportedCoins as coin}
                    <option value={coin.id}>{coin.name}</option>
                {/each}
            </select>
        </div>

        <div class="filter-group">
            <label for="start-date">Start Date</label>
            <input type="date" id="start-date" bind:value={startDate} on:change={handleFilterChange}>
        </div>

        <div class="filter-group">
            <label for="end-date">End Date</label>
            <input type="date" id="end-date" bind:value={endDate} on:change={handleFilterChange}>
        </div>
    </div>

    <!-- Deposits Table -->
    <div class="table-container">
        <table class="deposits-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Coin</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Transaction ID</th>
                </tr>
            </thead>
            <tbody>
                {#if loading && (!deposits || deposits.length === 0)}
                    <tr>
                        <td colspan="5" class="loading-cell">
                            <Spinner size="24px" />
                            <span>Loading deposits...</span>
                        </td>
                    </tr>
                {:else if error && (!deposits || deposits.length === 0)}
                    <tr>
                        <td colspan="5" class="error-cell">
                            <div class="error-message">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span>{error}</span>
                            </div>
                        </td>
                    </tr>
                {:else if !deposits || deposits.length === 0}
                    <tr>
                        <td colspan="5" class="empty-cell">
                            <div class="empty-message">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                                <span>No deposit records found</span>
                            </div>
                        </td>
                    </tr>
                {:else}
                    {#each deposits as deposit}
                        <tr>
                            <td>{formatDate(deposit.arrivedAt || deposit.createdAt)}</td>
                            <td>
                                <div class="coin-cell">
                                    <span class="coin-symbol">{deposit.coinSymbol || 'Unknown'}</span>
                                </div>
                            </td>
                            <td class="amount-cell">{formatAmount(deposit.amount)} {deposit.coinSymbol}</td>
                            <td>
                                <span class="status-badge {getStatusClass(deposit.status)}">
                                    {deposit.status || 'Unknown'}
                                </span>
                            </td>
                            <td class="txid-cell">
                                <div class="txid-container">
                                    <span class="txid">{deposit.txId || deposit.txid || 'N/A'}</span>
                                    {#if deposit.txId || deposit.txid}
                                        <button class="copy-button" on:click={() => {
                                            navigator.clipboard.writeText(deposit.txId || deposit.txid);
                                            toast.success('Transaction ID copied to clipboard');
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                            </svg>
                                        </button>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                {/if}
            </tbody>
        </table>
    </div>

    <!-- Load More Button -->
    {#if hasMore && deposits && deposits.length > 0}
        <div class="load-more-container">
            <button class="load-more-button" on:click={loadMore} disabled={loading}>
                {#if loading}
                    <Spinner size="16px" />
                    Loading...
                {:else}
                    Load More
                {/if}
            </button>
        </div>
    {/if}
</div>

<style>
    .deposits-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
    }

    .page-title {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 24px;
        color: #fff;
    }

    .filters-container {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 24px;
        background-color: #1e2130;
        padding: 16px;
        border-radius: 8px;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        min-width: 200px;
    }

    .filter-group label {
        font-size: 14px;
        margin-bottom: 8px;
        color: #b1b6c6;
    }

    .filter-group select,
    .filter-group input {
        padding: 8px 12px;
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background-color: rgba(255, 255, 255, 0.05);
        color: #fff;
        font-size: 14px;
    }

    .table-container {
        overflow-x: auto;
        background-color: #1e2130;
        border-radius: 8px;
        margin-bottom: 24px;
    }

    .deposits-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
    }

    .deposits-table th,
    .deposits-table td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .deposits-table th {
        font-weight: 600;
        color: #b1b6c6;
        background-color: #1a1d2a;
    }

    .deposits-table td {
        color: #fff;
    }

    .coin-cell {
        display: flex;
        align-items: center;
    }

    .coin-symbol {
        font-weight: 500;
    }

    .amount-cell {
        font-family: monospace;
        font-weight: 500;
    }

    .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
    }

    .status-completed {
        background-color: rgba(39, 174, 96, 0.2);
        color: #27ae60;
    }

    .status-pending {
        background-color: rgba(241, 196, 15, 0.2);
        color: #f1c40f;
    }

    .status-failed {
        background-color: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
    }

    .status-unknown {
        background-color: rgba(149, 165, 166, 0.2);
        color: #95a5a6;
    }

    .txid-cell {
        max-width: 200px;
    }

    .txid-container {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .txid {
        font-family: monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 150px;
    }

    .copy-button {
        background: none;
        border: none;
        color: #b1b6c6;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .copy-button:hover {
        color: #fff;
    }

    .loading-cell,
    .error-cell,
    .empty-cell {
        height: 200px;
        text-align: center;
    }

    .loading-cell,
    .error-message,
    .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        color: #b1b6c6;
    }

    .error-message {
        color: #e74c3c;
    }

    .load-more-container {
        display: flex;
        justify-content: center;
        margin-top: 24px;
    }

    .load-more-button {
        background-color: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .load-more-button:hover {
        background-color: rgba(255, 255, 255, 0.15);
    }

    .load-more-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .filters-container {
            flex-direction: column;
            gap: 12px;
        }

        .filter-group {
            width: 100%;
        }

        .deposits-table th,
        .deposits-table td {
            padding: 8px;
        }

        .txid {
            max-width: 100px;
        }
    }
</style>