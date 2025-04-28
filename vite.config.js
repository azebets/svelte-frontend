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
				manualChunks: undefined
			}
		},
		chunkSizeWarningLimit: 1000
	}
});
