// src/main.js — Point d'entrée de l'application Vue 3
// ─────────────────────────────────────────────────────
// Ordre d'initialisation :
//   1. Import des CSS globaux (variables + reset)
//   2. Import du composant racine App.vue
//   3. Import du router
//   4. Création de l'instance Vue + montage sur #app

// ── CSS globaux ──
// variables.css doit être importé EN PREMIER pour que les variables
// soient disponibles dans tous les composants qui suivent
import "@/assets/variables.css";
import "@/assets/global.css";

// ── Vue core ──
import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router/index.js";

// ── Bootstrap ──
// createApp()   → crée l'instance Vue sans la monter
// .use(router)  → enregistre Vue Router (gestion des routes)
// .mount('#app')→ remplace <div id="app"> par le rendu de App.vue
createApp(App).use(router).mount("#app");
