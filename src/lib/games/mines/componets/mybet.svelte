<script>
import { user } from "$lib/store/profile"
import { mine_history } from "$lib/games/mines/store/index"
import HistoryDetails from "./historyDetails.svelte";
import { browser } from '$app/environment';

let newItem;
$: {
    newItem =  [...$mine_history].reverse()
}

let DgII = ''
let hisQQ = false
const handleDiceHistoryDetail = ((data)=>{
    if(hisQQ){
        hisQQ = false
    }else{
        DgII = data
        hisQQ = true
    }
})

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

let is_mobile = false
$:{
    if (browser && window.innerWidth < 650) {
        is_mobile = true
    }
    else {
        is_mobile = false
    }
}

</script>


{#if hisQQ}
    <HistoryDetails on:close={handleDiceHistoryDetail} DgII={DgII}/> 
{/if}


<div class="tabs-view" style="transform: none;">
    <div class="sc-eZhRLC iycaRo">
        <table class="sc-gWXbKe iUeetX table is-hover">
            <thead>
                <tr>
                    <th class="num">Bet ID</th>
                    {#if !is_mobile}
                    <th class="time">Time</th>
                        <th class="bet">Bet</th>
                    {/if}
                    <th class="payout">Payout</th>
                    <th class="profit">Profit</th>
                </tr>
            </thead>
            <tbody>
                {#each newItem.slice(0, 15) as dice (dice._id) }
                {#if $user.user_id === dice.user_id}
                <tr on:click={()=> handleDiceHistoryDetail(dice)}>
                    <td>
                        <button  class="hash ellipsis">{dice.game_id}</button>
                    </td>
                    {#if !is_mobile}
                    <td>{formatTime(dice.time)}</td>
                    <td class="bet">
                        <div class="sc-Galmp erPQzq coin notranslate monospace">
                            <img class="coin-icon" alt="" src={dice.bet_token_img}>
                            <div class="amount">
                                <span class="amount-str">{(dice.bet_amount).toFixed(4)}<span class="suffix">00</span>
                                </span>
                            </div>
                        </div>
                    </td>
                    {/if}
                    {#if dice.has_won}
                    <td class="payout">{dice.cashout}×</td>
                    {:else}
                    <td class="payout">0.00×</td>
                    {/if}
                    <td class={`profitline ${dice.has_won ? "is-win" : "is-lose" } `}>
                        <div class="sc-Galmp erPQzq coin notranslate monospace has-sign">
                            <img class="coin-icon" alt="" src={dice.bet_token_img}>
                            <div class="amount">
                                {#if dice.has_won}
                                <span class="amount-str">+{(parseFloat(dice.profit)).toFixed(4)}<span class="suffix">00</span>
                                </span>
                                {:else}
                                <span class="amount-str">{(dice.bet_amount).toFixed(4)}<span class="suffix">00</span>
                                </span>
                                {/if}
                            </div>
                        </div>
                    </td>
                </tr>
                {/if}
                {/each}
            </tbody>
        </table>
    </div>
</div>

<style>
.tabs-view {
    background-color: rgb(30, 32, 36);
    border-radius: 1.25rem;
    padding: 1px 0px;
}

.iycaRo {
    min-height: 30rem;
    padding: 0.5rem;
}

.iUeetX {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0px;
}

.iycaRo tr {
    cursor: pointer;
    font-size: 14px;
}

.iycaRo tr:hover {

    background: #ccc9c912;
}


.iUeetX th:first-child,
.iUeetX td:first-child {
    text-align: left;
}

.iUeetX th,
.iUeetX td {
    overflow: hidden;
    text-align: center;
    padding: 0.875rem 0.75rem;
}

.iUeetX th,
.iUeetX td {
    overflow: hidden;
    text-align: center;
    padding: 0.875rem 0.75rem;
}

.iUeetX th {
    font-weight: normal;
    color: rgba(153, 164, 176, 0.6);
}

.iycaRo tr {
    cursor: pointer;
}

.iUeetX td:first-child {
    border-radius: 0.625rem 0px 0px 0.625rem;
}

.erPQzq {
    display: inline-flex;
    vertical-align: middle;
    -webkit-box-align: center;
    align-items: center;
    white-space: nowrap;
}

.erPQzq .coin-icon {
    width: 1.4em;
    height: 1.4em;
    margin-right: 0.25em;
}

.iycaRo .is-lose .amount {
    color: rgb(237, 99, 0);
}

.erPQzq.has-sign .amount-str {
    width: 7.2em;
}

.iycaRo .is-lose .amount {
    color: rgb(237, 99, 0);
}
.iycaRo .is-win .amount {
    color: rgb(67, 179, 9);
}

.coin .amount {
    color: rgb(245, 246, 247);
}

.iycaRo .coin {
    font-weight: bold;
}
</style>
