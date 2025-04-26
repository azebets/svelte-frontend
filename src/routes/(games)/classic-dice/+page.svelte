<script>
    import { onMount } from "svelte";
    import { beforeNavigate } from "$app/navigation";
    import { browser } from "$app/environment";
    import { newScreen } from "$lib/store/screen";
    import { handleAuthToken } from "$lib/store/routes";
    import { handleSoundManager } from "$lib/games/ClassicDice/audio/SoundManager";
    import { soundManager, turboManager, soundHandler } from "$lib/games/ClassicDice/store/index";
    import Loader from "$lib/controller/loader.svelte";
    import { handleDiceGameEncrypt, DiceHistory } from "$lib/gameAPIs/dice";

    // Preload components
    const componentPromises = {
        Gameview: () => import("$lib/games/ClassicDice/gameview.svelte"),
        Controls: () => import("$lib/games/ClassicDice/Controls.svelte"),
        Allbet: () => import("$lib/games/ClassicDice/componets/allbet.svelte"),
        Mybet: () => import("$lib/games/ClassicDice/componets/mybet.svelte"),
        SeedSetting: () => import("$lib/games/ClassicDice/componets/share/seedsettings.svelte"),
        Help: () => import("$lib/games/ClassicDice/componets/help.svelte"),
        Description: () => import("$lib/games/ClassicDice/componets/description.svelte")
    };

    // Start preloading as soon as possible
    if (browser) {
        Object.values(componentPromises).forEach(loader => loader());
    }

    // Lazy-loaded components
    let Gameview, Controls, Allbet, Mybet, SeedSetting, Help, Description;

    $: is_hotkey = false;
    $: is_stats = false;
    $: isSeed = false;
    $: isHelp = false;
    $: loading = true; // Tracks overall page loading
    $: modulesLoading = true; // Tracks module loading
    $: tab = 1;
    $: showDesc = false;

    // Load components with better error handling
    async function loadComponents() {
        try {
            modulesLoading = true;
            const results = await Promise.all([
                componentPromises.Gameview(),
                componentPromises.Controls(),
                componentPromises.Allbet(),
                componentPromises.Mybet(),
                componentPromises.SeedSetting(),
                componentPromises.Help(),
                componentPromises.Description()
            ]);

            [Gameview, Controls, Allbet, Mybet, SeedSetting, Help, Description] = 
                results.map(m => m.default);
        } catch (error) {
            console.error('Failed to load components:', error);
        } finally {
            modulesLoading = false;
        }
    }

    onMount(async () => {
        const loadPromises = [
            loadComponents(),
            handleDiceGameEncrypt($handleAuthToken),
            DiceHistory($handleAuthToken)
        ];

        // Load everything in parallel
        const [_, resion] = await Promise.all(loadPromises);

        const id = browser && JSON.parse(localStorage.getItem("classic_dice_sound"));
        const tubor = browser && JSON.parse(localStorage.getItem("classic_dice_tubo"));

        soundHandler.set(id);
        turboManager.set(tubor);
        soundManager.set(handleSoundManager());

        loading = resion;
    });

    const handleAllbet = (e) => {
        tab = e;
    };

    const handleSoundState = () => {
        if ($soundHandler) {
            soundHandler.set(null);
            localStorage.removeItem("classic_dice_sound");
        } else {
            soundHandler.set(true);
            localStorage.setItem("classic_dice_sound", true);
        }
    };

    const handleTurboState = () => {
        if ($turboManager) {
            turboManager.set(null);
            localStorage.removeItem("classic_dice_tubo");
        } else {
            turboManager.set(true);
            localStorage.setItem("classic_dice_tubo", true);
        }
    };
</script>

<div id="dice-main">
    {#if loading || modulesLoading}
        <!-- Show a loader while the page or modules are loading -->
        <div style="height: 70vh;">
            <Loader />
        </div>
    {:else}
        <div id="game-ClassicDice" class={`sc-haTkiu lmWKWf ${$newScreen > 1200 ? "game-style0" : "game-style1"} sc-gDGHff gYWFhf`}>
            <div class="game-area">
                <div class="game-main">
                    {#if Gameview}
                        <svelte:component this={Gameview} />
                    {/if}
                    {#if Controls}
                        <svelte:component this={Controls} />
                    {/if}
                    <div class="game-actions">
                        <button on:click={handleSoundState} class={`action-item ${$soundHandler ? "active" : ""}`}>
                            <!-- Sound Icon -->
                        </button>
                        <button on:click={handleTurboState} class={`action-item ${$turboManager ? "active" : ""}`}>
                            <!-- Turbo Icon -->
                        </button>
                        <button on:click={() => (isSeed = true)} class="action-item" id="set_seed">
                            <!-- Seed Icon -->
                        </button>
                        <button on:click={() => (isHelp = true)} class="action-item">
                            <!-- Help Icon -->
                        </button>
                    </div>
                </div>
            </div>
            <div class="sc-cxpSdN kQfmQV tabs game-tabs len-3">
                <div class="tabs-navs">
                    <button on:click={() => handleAllbet(1)} class={`tabs-nav ${tab === 1 && "is-active"}`}>All Bets</button>
                    <button on:click={() => handleAllbet(2)} class={`tabs-nav ${tab === 2 && "is-active"}`}>My Bets</button>
                    {#if tab === 1}
                        <div class="bg" style={`left: 0%; right: 50%;`}></div>
                    {:else if tab === 2}
                        <div class="bg" style="left: 50%; right: 0%;"></div>
                    {/if}
                </div>
                {#if tab === 1 && Allbet}
                    <svelte:component this={Allbet} />
                {:else if tab === 2 && Mybet}
                    <svelte:component this={Mybet} />
                {/if}
            </div>
            <div class="sc-knKHOI cFxmZX">
                <div class="intro-title">
                    <p>Classic Dice</p>
                </div>
                <div class="description">
                    Classic Dice, a probability game established by blockchain hash value calculation and algorithm, provides more fun with bet and prediction, in which the closer the number rolled by players to the random number, the higher the probability winning.
                </div>
                <button on:click={() => (showDesc = !showDesc)} class="intro-detail">
                    Details
                </button>
            </div>
        </div>
        {#if showDesc && Description}
            <svelte:component this={Description} on:close={() => (showDesc = false)} />
        {/if}
        {#if isSeed && SeedSetting}
            <div class="sc-bkkeKt kBjSXI">
                <div class="dialog">
                    <button on:click={() => (isSeed = false)} class="sc-ieecCq fLASqZ close-icon dialog-close">
                        <!-- Close Icon -->
                    </button>
                    <svelte:component this={SeedSetting} settin={null} />
                </div>
            </div>
        {/if}
        {#if isHelp && Help}
            <svelte:component this={Help} on:close={() => (isHelp = false)} />
        {/if}
    {/if}
</div>

<style>
/* Add your styles here */
</style>
