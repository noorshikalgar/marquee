import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      manifest: {
        name: "Marquee",
        short_name: "Marquee",
        description: "Your weekend watch companion — browse, search, and get AI picks for movies and TV.",
        start_url: "/",
        display: "standalone",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        orientation: "any",
        categories: ["entertainment"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5175,
  },
});
