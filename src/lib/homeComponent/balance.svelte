<script>
    import { screen } from "$lib/store/screen";
    import { coin_list, default_Wallet } from "$lib/store/coins";
    import { createEventDispatcher } from "svelte";
    import { app } from '$lib/store/app';
    const dispatch = createEventDispatcher()

    let loading = {}
    const selectDefaultWallet = (async(newItem)=>{
        default_Wallet.set(newItem)
        dispatch("close")
        loading = newItem
        const {response, isLoading} = await $app?.handleChangeDefaultWallet( newItem)
        if(response){
            coin_list.set(response)
            // response.forEach(element => {
            //     if(element.is_active){
            //         default_Wallet.set(element)
            //     }
            // });
        }
        loading = isLoading
    })
    
</script>

<div id="rollbit-modal-popover-container">
    <div class="css-1nfl9e5" style="height: 225.583px; max-height: 225.583px; top: 59.8333px; left: {$screen < 500 ? 0 : 35}%;">
        <div class="css-rymlxq">
                <div style="padding: 16px 16px 4px;">
                    <div class="css-1yx9de1">
                        <!-- <div class="css-q0akof">
                            <div class="css-1sg2lsz">
                                Balances
                            </div>
                            <div class="css-n4mkve">Total:<span>$0.00</span></div>
                        </div> -->

                        {#each $coin_list as wallet}
                        <button on:click={()=>selectDefaultWallet(wallet)} class="css-1e0k2gt">
                            <div  class="css-ayxvns {wallet?.is_active && "active"}">
                                <div class="css-rx3rp4">
                                    <div>
                                        <label  for="proof-radio-34760" class="css-13ahkye {wallet?.is_active && "active"}">
                                            <span class="css-dm6haw"></span>
                                        </label>
                                    </div>
                                    <div class="css-cebha4">
                                        <div class="jehslJs css-1ooew8q">
                                            <img src="{$app.getWalletIcon(wallet?.coin_name)}" class="coin" alt="">
                                            <div class="css-15smzfl">{wallet?.coin_name}</div>
                                        </div>
                                        <div class="css-1ooew8q">
                                            ${(parseFloat(wallet?.balance)).toFixed(2)}
                                        </div>
                                    </div>  
                                </div>
                            </div>                  
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>
<style>
   
</style>