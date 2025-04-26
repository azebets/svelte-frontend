import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: {
					'classic-dice-core': [
						'./src/lib/games/ClassicDice/gameview.svelte',
						'./src/lib/games/ClassicDice/Controls.svelte'
					],
					'classic-dice-secondary': [
						'./src/lib/games/ClassicDice/componets/allbet.svelte',
						'./src/lib/games/ClassicDice/componets/mybet.svelte',
						'./src/lib/games/ClassicDice/componets/share/seedsettings.svelte',
						'./src/lib/games/ClassicDice/componets/help.svelte',
						'./src/lib/games/ClassicDice/componets/description.svelte'
					]
				}
			}
		}
	},
	optimizeDeps: {
		include: ['svelte']
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			$app: '/node_modules/@sveltejs/kit/src/runtime/app'
		}
	}
});
