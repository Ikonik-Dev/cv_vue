// vite.config.js — Configuration Vite pour le projet CV Vue 3
// ─────────────────────────────────────────────────────────────
// - plugin-vue  : compile les Single File Components .vue
// - alias @     : raccourci vers src/ utilisable dans tous les imports
//   Ex : import NavBar from '@/components/NavBar.vue'

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    vue(), // Active la compilation des .vue (template → render fn, scoped styles)
  ],

  resolve: {
    alias: {
      // '@' pointe vers le dossier src/
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
