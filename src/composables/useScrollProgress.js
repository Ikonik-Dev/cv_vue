// src/composables/useScrollProgress.js — Barre de progression du scroll
// ──────────────────────────────────────────────────────────────────────
//
// Retourne une ref réactive `scrollPct` (0 à 100).
// ScrollProgress.vue bind cette valeur sur width du .scroll-progress.
//
// OPTIMISATION :
//   La mise à jour est déclenchée depuis la boucle RAF de HomeView.vue
//   (via updateProgress()) et non depuis un addEventListener scroll
//   autonome — pour rester synchrone avec le parallax et le smooth scroll.

import { ref } from "vue";

/** Pourcentage de scroll courant (0–100). Mis à jour par updateProgress(). */
const scrollPct = ref(0);

/**
 * useScrollProgress()
 *
 * @returns {{
 *   scrollPct:      import('vue').Ref<number>,
 *   updateProgress: () => void,
 * }}
 */
export function useScrollProgress() {
  /**
   * updateProgress()
   * Recalcule scrollPct à partir de window.scrollY.
   * Formule : scrollY / (hauteur doc - hauteur viewport) * 100
   * À appeler dans la boucle RAF principale.
   */
  function updateProgress() {
    const scrollTop = window.scrollY;
    // Hauteur scrollable totale (évite la division par 0 si page courte)
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    scrollPct.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  }

  return { scrollPct, updateProgress };
}
