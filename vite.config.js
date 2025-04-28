import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		minify: 'terser',
		cssMinify: true,
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor': [
						'axios',
						'firebase',
						'chart.js',
						'mobx',
						'lodash'
					],
					'game-core': [
						'./src/lib/games',
					],
					'ui-components': [
						'./src/lib/components',
					]
				}
			}
		},
		chunkSizeWarningLimit: 1000
	},
	optimizeDeps: {
		include: ['lodash', 'axios', 'firebase/app']
	}
});
