import { browser } from '$app/environment';
import { routes, handleAuthToken, otp } from "$lib/store/routes";
import { handleProfile } from "$lib/index";
import { changeotp } from "$lib/store/routes";

/** @type {import('./$types').PageLoad} */
export async function load({ route, data }) {
  // Preload the classic-dice route
  if (browser) {
    const preloadRoute = () => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = '/';
      document.head.appendChild(link);
    };
    
    // Delay preload slightly to prioritize current route
    setTimeout(preloadRoute, 1000);
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
