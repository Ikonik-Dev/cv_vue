<script setup>
/**
 * App.vue — Composant racine de l'application
 * ─────────────────────────────────────────────
 * Contient :
 *   - NavBar     : navigation fixe (reçoit navLinks)
 *   - ScrollProgress : barre de progression du scroll
 *   - RouterView : affiche la vue active (HomeView)
 *
 * scrollPct est maintenu ici comme state partagé :
 *   HomeView.vue émet 'update:scrollPct' → App.vue l'écoute
 *   → App.vue passe scrollPct en prop à ScrollProgress.vue
 */

import { ref, computed }  from 'vue'
import { useRoute }      from 'vue-router'
import NavBar            from '@/components/NavBar.vue'
import ScrollProgress    from '@/components/ScrollProgress.vue'
import PageBackground    from '@/components/PageBackground.vue'
import ProjectTransition from '@/components/ProjectTransition.vue'
import { navLinks }      from '@/data/cv.js'

/**
 * scrollPct
 * Pourcentage de scroll (0–100) mis à jour par HomeView.vue.
 * @type {import('vue').Ref<number>}
 */
const scrollPct  = ref(0)
const route      = useRoute()
// Masque la NavBar et la barre de progression dans la scène monde
const isWorldView = computed(() => route.name === 'world')
</script>

<template>
  <!-- Root -->
  <div id="app-root">

    <!-- Fond parallax brutaliste global (position: fixed, z-index: 0) -->
    <PageBackground v-if="!isWorldView" />

    <!-- Barre de progression (au-dessus de tout, z-index nav+1) -->
    <ScrollProgress v-if="!isWorldView" :scroll-pct="scrollPct" />

    <!-- Navigation fixe -->
    <NavBar v-if="!isWorldView" :nav-links="navLinks" />

    <!-- Overlay de transition cinématique (Teleport vers body) -->
    <ProjectTransition />

    <!-- Vue active (HomeView via vue-router) -->
    <!--
      @update:scrollPct : HomeView remonte scrollPct via emit
      App.vue le transmet à ScrollProgress
    -->
    <RouterView @update:scroll-pct="val => scrollPct = val" />

  </div>
</template>

<style>
/*
 * Styles globaux du root (non scopés car ils ciblent le body / html).
 * Les variables et resets sont dans variables.css + global.css,
 * tous deux importés dans main.js avant App.vue.
 */
#app-root {
  position: relative;
  min-height: 100vh;
}
</style>
