<script setup>
/**
 * ParallaxLayer.vue — Calque de parallax générique
 * ─────────────────────────────────────────────────
 * Ce composant est un wrapper invisible qui :
 *   1. Au montage, s'enregistre dans le contrôleur parallax (inject)
 *   2. Sert de slot pour du contenu positionné en absolu dans une section
 *   3. Reçoit son transform depuis la boucle RAF de HomeView.vue
 *
 * USAGE :
 *   <ParallaxLayer :depth="0.2">
 *     <div class="hero__bg-shape" />
 *   </ParallaxLayer>
 *
 * PATTERN provide/inject :
 *   HomeView.vue   → provide('registerLayer', fn)
 *                    provide('unregisterLayer', fn)
 *   ParallaxLayer  → inject('registerLayer')  → appel au onMounted
 *                    inject('unregisterLayer') → appel au onUnmounted
 */

import { ref, onMounted, onUnmounted, inject } from 'vue'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /**
   * Facteur de vitesse parallax.
   *   0.1 → très lent (éléments de fond profond)
   *   0.5 → rapide  (éléments proches du premier plan)
   * Valeurs recommandées : 0.1, 0.15, 0.2, 0.3, 0.4, 0.5
   */
  depth: {
    type:      Number,
    default:   0.2,
    validator: v => v > 0 && v <= 1,
  },
})

// ── Ref sur le nœud DOM racine du composant ───────────────────
const layerRef = ref(null)

// ── Inject des fonctions du contrôleur (HomeView.vue) ─────────
/**
 * registerLayer et unregisterLayer sont fournis par HomeView.vue.
 * Si le composant est utilisé hors de HomeView (ex : storybook),
 * les fallbacks évitent un crash.
 */
const registerLayer   = inject('registerLayer',   () => {})
const unregisterLayer = inject('unregisterLayer', () => {})

onMounted(() => {
  if (layerRef.value) {
    registerLayer(layerRef.value, props.depth)
  }
})

onUnmounted(() => {
  if (layerRef.value) {
    unregisterLayer(layerRef.value)
  }
})
</script>

<template>
  <!--
    Le div reçoit la classe .parallax-layer (définie dans global.css)
    qui applique : position: absolute; pointer-events: none; will-change: transform
  -->
  <div ref="layerRef" class="parallax-layer">
    <!-- Contenu fourni par le composant parent -->
    <slot />
  </div>
</template>

<style scoped>
/*
 * Pas de styles additionnels ici — tout est dans global.css (.parallax-layer).
 * On garde ce fichier de style scoped vide pour documenter l'intention.
 */
</style>
