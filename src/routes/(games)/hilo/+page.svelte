<script>
    import { browser } from "$app/environment";
    import { newScreen } from "$lib/store/screen";
    import GameControls from "$lib/games/hilo/GameControls.svelte";
    import GameActions from "$lib/games/hilo/GameActions.svelte";
    // import GameView from "$lib/games/hilo/GameView.svelte";
    import AllBets from "$lib/games/hilo/AllBets.svelte";
    import MyBets from "$lib/games/hilo/MyBets.svelte";
    import { soundManager, soundSettings } from "$lib/games/hilo/store";
    import SM from "$lib/games/hilo/audio/SoundManager";
    import { socketEvents } from "$lib/games/hilo/socket";
    import { user } from "$lib/store/profile";
    import {
      hilo_game,
      processingRequest,
      hotkeysEnabled,
    } from "$lib/games/hilo/store";
    import { onDestroy, onMount } from "svelte";
    $: currentTab = 1;
  
    $: SE = null;
  
    $: {
      if (browser && $user?.user_id && !SE) {
        SE = socketEvents($user.user_id);
        SE.handleHiloInit({ user_id: $user.user_id });
      }
    }
  
    const handleBet = (e) => {
      if (SE && !$processingRequest) {
        SE.handleHiloBet({
          token: e.detail.token,
          token_img: e.detail.token_img,
          user_id: $user.user_id,
          bet_amount: e.detail.bet_amount,
        });
      }
    };
  
    const handleNextRound = (e) => {
      if (SE && !$processingRequest) {
        const { bet_id, token, token_img, payout, bet_amount } = $hilo_game;
        SE.handleHiloNextRound({
          hi: e.detail.hi,
          lo: e.detail.lo,
          user_id: $user.user_id,
          skip: e.detail.skip,
          bet_id,
          bet_amount,
          token,
          token_img,
          payout,
        });
        // Add a check to ensure the game state is valid before proceeding
        if (!$hilo_game || !$hilo_game.bet_id) {
          console.error('Invalid game state. Refreshing the page...');
          window.location.reload();
          return;
        }
      }
    };
  
    const handleCashOut = (e) => {
      if (SE && !$processingRequest) {
        const { bet_id, token, token_img, payout, bet_amount } = $hilo_game;
        SE.handleHiloCashout({
          user_id: $user.user_id,
          bet_id,
          bet_amount,
          token,
          token_img,
          payout,
        });
      }
    };
    let messageTimeout;
    onMount(() => {
      if (browser) {
        const hotkeys = localStorage.getItem("HILO_HOTKEYS_ENABLED") === "true";
        hotkeysEnabled.set(hotkeys);
        let settings = localStorage.getItem("HILO_SOUND_SETTINGS");
        settings = settings && JSON.parse(settings);
        settings = settings || { music: true, soundFx: true };
        soundSettings.set(settings);
        soundManager.set(
          new SM({ hilo: { enabled: settings.music } }, settings.soundFx)
        );

      }
    });
    onDestroy(() => {
      $soundManager?.stop();
    });

  </script>
  

  <div
    id="game-Hilo"
    class="sc-haTkiu lmWKWf {$newScreen > 1200 ? "game-style0" : "game-style1"} sc-hKumaY hmdAmi"
    style="opacity: 1; transform: none;"
  >
    <div class="game-area">
       <div class="game-main {$newScreen > 1200 ? 'mobile-view' : ''}">
      
        <!-- <GameView on:hiloNextRound={handleNextRound} /> -->
        <GameControls
        on:hiloNextRound={handleNextRound}
        on:hiloCashout={handleCashOut}
        on:hiloBet={handleBet}
      /> 
        <GameActions /> 
      </div>
    </div>
    <div class="sc-cxpSdN kQfmQV tabs game-tabs len-2">
      <div class="tabs-navs">
        <button
          on:click={() => (currentTab = 1)}
          class="tabs-nav {currentTab === 1 ? 'is-active' : ''}">All Bets</button
        >
        <button
          on:click={() => (currentTab = 2)}
          class="tabs-nav {currentTab === 2 ? 'is-active' : ''}">My Bets</button
        >
        <div
          class="bg is-reverse"
          style="width: 50%; left: {currentTab === 2 ? '50%' : '0'};"
        ></div>
      </div>
      <div class="tabs-view" style="transform: none;">
        {#if currentTab === 1}
          <AllBets />
        {:else}
          <MyBets />
        {/if}
      </div>
    </div>
    <div class="sc-knKHOI cFxmZX">
      <div class="intro-title">
        <p>Hilo</p>
        <div class="intro-tags">
          <p>Our Best Games</p>
          <p>BC Originals</p>
          <p>Cards</p>
          <p>BC Table Games</p>
          <p>Table games</p>
          <p>Original</p>
        </div>
      </div>
    <div class="description">
        Hi-lo is an online single player guessing game in which you guess the card
        point is higher (hi) or lower (lo) compared to the previous one.
      </div>
      <button class="intro-detail"
        >Details<svg
          xmlns:xlink="http://www.w3.org/1999/xlink"
          class="sc-gsDKAQ hxODWG icon"><use xlink:href="#icon_Arrow"></use></svg
        ></button
      >
    </div>
  </div> 
  
