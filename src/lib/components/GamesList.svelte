<script>
    import { goto } from "$app/navigation";
    import { inHouseGames } from "$lib/constants";
</script>

<div class="css-1y4j81h" style="margin-bottom: 3.5px;">
    <div class="css-1lvctvs" style="margin-right: auto;">
        <div class="css-mpgbkp">
            <svg xmlns="http://www.w3.org/2000/svg" class="css-1xnqux5" viewBox="0 0 36.63 40">
                <!-- SVG content -->
            </svg>
        </div>
        <a href="/originals">Cyclix Originals</a>
        <a href="/originals">
            <div class="css-h1pfxx">View All</div>
        </a>
    </div>
</div>

<div class="css-13107in">
    <div class="css-9vwzbp">
        <div style="position: relative; width: 100%; height: 220px; overflow: hidden; will-change: transform; direction: ltr;">
            <div class="swiper swiper-initialized swiper-horizontal swiper-pointer-events sc-bOTDDd fiiKfw">
                <!-- Swiper container -->
                <swiper-container
                    class="swiper-wrapper"
                    slides-per-view={6}
                    speed={1000}
                    space-between="20"
                    navigation
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 20 },
                        390: { slidesPerView: 2, spaceBetween: 20 },
                        520: { slidesPerView: 3, spaceBetween: 20 },
                        688: { slidesPerView: 4, spaceBetween: 20 },
                        1100: { slidesPerView: 5, spaceBetween: 15 },
                        1264: { slidesPerView: 6, spaceBetween: 15 },
                    }}
                >
                    {#each inHouseGames as game}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div on:click={() => goto(game.link)} class="swiper-slide css-vugqe6">
                            <div style="padding-top: 10px;">
                                <div class="css-d6icxj">
                                    <img class="css-nyormw" src="{game.img}" alt="{game.name}">
                                    <div class="css-1agvln2" style="display: none; background: rgba(39, 43, 56, 0.95);">
                                        <div class="css-199grsv">Challenge Pool</div>
                                        <div class="css-peshd1">$944.33</div>
                                        <div class="css-199grsv">Effective RTP</div>
                                        <div class="css-peshd1">99.20%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                </swiper-container>

                <!-- Navigation buttons -->
                <button class="swiper-button-prev">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
                    </svg>
                </button>
                <button class="swiper-button-next">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .swiper-button-prev,
    .swiper-button-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        background-color: rgba(0, 0, 0, 0.5);
        border: none;
        color: white;
        padding: 10px;
        border-radius: 50%;
        cursor: pointer;
    }

    .swiper-button-prev {
        left: 10px;
    }

    .swiper-button-next {
        right: 10px;
    }

    .swiper-button-prev:hover,
    .swiper-button-next:hover {
        background-color: rgba(0, 0, 0, 0.8);
    }
</style>