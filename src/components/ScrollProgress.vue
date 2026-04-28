<script setup>
/**
 * ScrollProgress.vue — Barre de progression du scroll
 * ──────────────────────────────────────────────────────
 * Affiche une fine barre en haut de page dont la largeur
 * est proportionnelle au pourcentage scrollé.
 *
 * Gradient : cyan (#00ffe7) → hot pink (#ff2d78) → lime (#b8ff35)
 * scrollPct est fourni en props depuis HomeView.vue (via useScrollProgress)
 */

// ── Props ──────────────────────────────────────────────────────
defineProps({
  /**
   * Pourcentage de scroll (0–100).
   * Mis à jour par useScrollProgress().updateProgress()
   * dans la boucle RAF de HomeView.vue.
   */
  scrollPct: {
    type:    Number,
    default: 0,
  },
})
</script>

<template>
  <!-- Barre positionnée en position fixed au-dessus de tout -->
  <div class="scroll-progress" aria-hidden="true">
    <div
      class="scroll-progress__bar"
      :style="{ width: scrollPct + '%' }"
    />
  </div>
</template>

<style scoped>
/* Piste de fond (optionnel, peut être invisible) */
.scroll-progress {
  position:   fixed;
  top:        0;
  left:       0;
  width:      100%;
  height:     3px;
  z-index:    calc(var(--z-nav) + 1); /* au-dessus de la nav */
  background: transparent;
  overflow:   hidden;
  pointer-events: none;
}

/* Barre colorée */
.scroll-progress__bar {
  height:     100%;
  /* Gradient cyan → hot pink → lime — identique au design system */
  background: linear-gradient(
    90deg,
    var(--color-accent-1)  0%,
    var(--color-accent-2) 50%,
    var(--color-accent-3) 100%
  );
  /* will-change pour éviter les repaints inutiles */
  will-change:      width;
  transition:       width 60ms linear; /* léger lissage visuel */
  transform-origin: left center;
}
</style>
