// src/router/index.js — Configuration Vue Router 4
// ──────────────────────────────────────────────────
// Route unique : '/' → HomeView (tout le CV est une seule page)
// Toute URL inconnue redirige vers '/' (fallback)
// createWebHashHistory : pas de configuration serveur requise (#/about)

import { createRouter, createWebHashHistory } from "vue-router";

// Import différé (lazy) : HomeView est chargé uniquement quand la route est activée
// Vite code-split automatiquement les imports dynamiques en chunks séparés
const HomeView = () => import("@/views/HomeView.vue");
const WorldView = () => import("@/views/WorldView.vue");

/** @type {import('vue-router').RouteRecordRaw[]} */
const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    // Scène monde 3D — accessible via transition depuis les cartes projet
    path: "/world",
    name: "world",
    component: WorldView,
  },
  {
    // Catch-all : toute route non définie redirige vers /
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  // createWebHashHistory : URLs de type /#/ (fonctionne sans serveur)
  // Alternativement, createWebHistory pour /about — nécessite un serveur configuré
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,

  // Comportement du scroll lors de la navigation :
  // on gère le scroll manuellement via useSmoothScroll,
  // donc on retourne la position actuelle sans saut natif
  scrollBehavior: () => false,
});

export default router;
