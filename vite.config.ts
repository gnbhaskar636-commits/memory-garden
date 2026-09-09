import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    watch: {
      ignored: ["**/.vercel/**", "**/.tanstack/**"],
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            // Set to your target: "vercel", "node-server", "cloudflare-pages",
            // etc. See https://nitro.build/deploy for the full list.
            preset: "vercel",
          }),
        ]
      : []),
    viteReact(),
  ],
}));
