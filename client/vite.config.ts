import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
			}),
			react(),
			tailwindcss({}),
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
				"@shared": path.resolve(__dirname, "../shared/src"),
				"@server": path.resolve(__dirname, "../server/src"),
			},
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						"react-vendor": ["react", "react-dom"],
						"tanstack-query": ["@tanstack/react-query"],
						"tanstack-router": ["@tanstack/react-router"],
						"tanstack-form": ["@tanstack/react-form"],
						"radix-ui": [
							"@radix-ui/react-accordion",
							"@radix-ui/react-dialog",
							"@radix-ui/react-label",
							"@radix-ui/react-select",
							"@radix-ui/react-separator",
							"@radix-ui/react-slot",
							"radix-ui",
						],
						"ui-vendor": [
							"lucide-react",
							"sonner",
							"class-variance-authority",
							"clsx",
							"tailwind-merge",
							"next-themes",
						],
						"better-auth": ["better-auth"],
					},
				},
			},
		},
		server: {
			proxy: {
				"/api": {
					target: env.VITE_SERVER_URL || "http://localhost:3000",
					changeOrigin: true,
				},
			},
		},
	};
});
