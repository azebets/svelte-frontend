<script>
    import "../styles/home.css"
    import LiveLayout from "$lib/homeComponent/liveLayout.svelte";
    import NavTabs from "$lib/homeComponent/navTabs.svelte";
    import GamesList from "$lib/components/GamesList.svelte";
    import Slots from "$lib/components/Slots.svelte";
    import Livecasino from "$lib/components/Livecasino.svelte";
    import Showgame from "$lib/components/showgame.svelte";
    import Bets from "../lib/components/Bets.svelte";

</script>

<div class="css-7oel5t">
    <LiveLayout />
    <div style="height: 24px;"></div>
    <NavTabs />
    <GamesList />
    <Slots />
    <Livecasino />
    <Showgame />
    <Bets />
</div>

<style>
   
</style>