import { browser } from '$app/environment';
import { routes, handleAuthToken, otp } from "$lib/store/routes";
import { handleProfile } from "$lib/index";
import { changeotp } from "$lib/store/routes";

/** @type {import('./$types').PageLoad} */
export async function load({ route, data }) {
  if (browser) {
    // Preload classic-dice assets immediately
    const preloadAssets = () => {
      // Preload main components
      const links = [
        '/src/lib/games/ClassicDice/gameview.svelte',
        '/src/lib/games/ClassicDice/Controls.svelte',
        '/src/lib/games/ClassicDice/audio/SoundManager.js',
      ].map(href => {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = href;
        return link;
      });

      document.head.append(...links);
    };

    // Execute immediately
    preloadAssets();
  }

  let password = browser && JSON.parse(sessionStorage.getItem('password'));
  let fach = browser && JSON.parse(sessionStorage.getItem('otp'));
  const user = browser && JSON.parse(localStorage.getItem('drr'));
  const changeEmail = browser && JSON.parse(sessionStorage.getItem('change-email'));

  if (user) {
    await handleProfile(user);
  }

  changeotp.set(changeEmail);
  handleAuthToken.set(user);
  routes.set(route.id);
  otp.set(fach);
  
  return { password };
}
