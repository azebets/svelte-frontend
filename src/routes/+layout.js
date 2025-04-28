import { browser } from '$app/environment';
import { routes, otp } from "$lib/store/routes";
import { changeotp } from "$lib/store/routes";
import { app, loadapp } from '../lib/store/app';
import { serverUrl } from "../lib/backendUrl";

/** @type {import('./$types').PageLoad} */
export async function load({ route }) {
  // Defer non-critical initialization
  if (browser) {
    // Dynamically import App_script only when needed
    const { App_script } = await import('../lib');
    const _app = new App_script();
    const _url = serverUrl();
    _app.serverUrl(_url);
    
    // Initialize user session in parallel
    const initializeUser = async () => {
      const _user = document.cookie.match(/secret=([^;]+)/)?.[1];
      if (_user) {
        await _app.profile(_user);
      } else {
        loadapp.set(false);
      }
    };

    // Run initialization in background
    initializeUser();
    app.set(_app);
  } else {
    loadapp.set(false);
  }

  routes.set(route.id);
  return {};
}
