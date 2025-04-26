<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { newScreen } from "$lib/store/screen";
    import { handleAuthToken } from "$lib/store/routes";
    import { handleSoundManager } from "$lib/games/ClassicDice/audio/SoundManager";
    import { soundManager, turboManager, soundHandler } from "$lib/games/ClassicDice/store/index";
    import Loader from "$lib/controller/loader.svelte";
    import { handleDiceGameEncrypt, DiceHistory } from "$lib/gameAPIs/dice";

    // State variables
    let tab = 1;
    let isSeed = false;
    let isHelp = false;
    let showDesc = false;
    let loadedComponents = {};
    let loading = true;

    // Component lazy loading
    const components = {
        gameview: () => import("$lib/games/ClassicDice/gameview.svelte"),
        controls: () => import("$lib/games/ClassicDice/Controls.svelte"),
        allbet: () => import("$lib/games/ClassicDice/componets/allbet.svelte"),
        mybet: () => import("$lib/games/ClassicDice/componets/mybet.svelte"),
        seedSettings: () => import("$lib/games/ClassicDice/componets/share/seedsettings.svelte"),
        help: () => import("$lib/games/ClassicDice/componets/help.svelte"),
        description: () => import("$lib/games/ClassicDice/componets/description.svelte")
    };

    // Event handlers
    const handleSoundState = () => {
        const newState = !$soundHandler;
        soundHandler.set(newState);
        if (browser) {
            localStorage.setItem("classic_dice_sound", JSON.stringify(newState));
        }
    };

    const handleTurboState = () => {
        const newState = !$turboManager;
        turboManager.set(newState);
        if (browser) {
            localStorage.setItem("classic_dice_tubo", JSON.stringify(newState));
        }
    };

    const handleAllbet = (newTab) => {
        tab = newTab;
    };

    // Initialize sound settings
    if (browser) {
        const savedSound = localStorage.getItem("classic_dice_sound");
        const savedTurbo = localStorage.getItem("classic_dice_tubo");
        soundHandler.set(savedSound ? JSON.parse(savedSound) : null);
        turboManager.set(savedTurbo ? JSON.parse(savedTurbo) : null);
        soundManager.set(handleSoundManager());
    }

    async function loadInitialComponents() {
        try {
            // Load critical components first
            const [gameviewModule, controlsModule] = await Promise.all([
                components.gameview(),
                components.controls()
            ]);
            
            loadedComponents.gameview = gameviewModule.default;
            loadedComponents.controls = controlsModule.default;
            loading = false;

            // Load remaining components in background
            Object.entries(components)
                .filter(([key]) => !['gameview', 'controls'].includes(key))
                .forEach(async ([key, loader]) => {
                    const module = await loader();
                    loadedComponents[key] = module.default;
                });
        } catch (error) {
            console.error('Failed to load components:', error);
            loading = false;
        }
    }

    onMount(async () => {
        await Promise.all([
            loadInitialComponents(),
            handleDiceGameEncrypt($handleAuthToken),
            DiceHistory($handleAuthToken)
        ]);
    });
</script>

<div id="dice-main">
    {#if loading}
        <!-- Show a loader while the page or modules are loading -->
        <div style="height: 70vh;">
            <Loader />
        </div>
    {:else}
        <div id="game-ClassicDice" class={`sc-haTkiu lmWKWf ${$newScreen > 1200 ? "game-style0" : "game-style1"} sc-gDGHff gYWFhf`}>
            <div class="game-area">
                <div class="game-main">
                    {#if loadedComponents.gameview}
                        <svelte:component this={loadedComponents.gameview} />
                    {/if}
                    {#if loadedComponents.controls}
                        <svelte:component this={loadedComponents.controls} />
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
                {#if tab === 1 && loadedComponents.allbet}
                    <svelte:component this={loadedComponents.allbet} />
                {:else if tab === 2 && loadedComponents.mybet}
                    <svelte:component this={loadedComponents.mybet} />
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
        {#if showDesc && loadedComponents.description}
            <svelte:component this={loadedComponents.description} on:close={() => (showDesc = false)} />
        {/if}
        {#if isSeed && loadedComponents.seedSettings}
            <div class="sc-bkkeKt kBjSXI">
                <div class="dialog">
                    <button on:click={() => (isSeed = false)} class="sc-ieecCq fLASqZ close-icon dialog-close">
                        <!-- Close Icon -->
                    </button>
                    <svelte:component this={loadedComponents.seedSettings} settin={null} />
                </div>
            </div>
        {/if}
        {#if isHelp && loadedComponents.help}
            <svelte:component this={loadedComponents.help} on:close={() => (isHelp = false)} />
        {/if}
    {/if}
</div>

<style>
/* Add your styles here */
</style>
