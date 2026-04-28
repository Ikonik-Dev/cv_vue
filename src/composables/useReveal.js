// src/composables/useReveal.js — Animation d'entrée au scroll
// ─────────────────────────────────────────────────────────────
//
// Wraps IntersectionObserver pour déclencher l'animation CSS
// .reveal → .reveal.visible quand un élément entre dans le viewport.
//
// UTILISATION dans un composant :
//
//   <script setup>
//   import { ref, onMounted } from 'vue'
//   import { useReveal }      from '@/composables/useReveal.js'
//
//   const containerRef = ref(null)
//   useReveal(containerRef)
//   </script>
//
//   <template>
//     <div ref="containerRef" class="container reveal">
//       ...contenu...
//     </div>
//   </template>
//
// IMPORTANT :
//   L'élément doit avoir la classe CSS .reveal (définie dans global.css).
//   useReveal ajoute .visible → la transition CSS s'enclenche.

import { onMounted, onUnmounted } from "vue";

/**
 * useReveal(elementRef, options)
 * Observe un élément via IntersectionObserver.
 * Ajoute la classe .visible à la première intersection.
 *
 * @param {import('vue').Ref<HTMLElement|null>} elementRef - Ref de l'élément à observer
 * @param {IntersectionObserverInit}            [options]  - Options IntersectionObserver
 */
export function useReveal(elementRef, options = {}) {
  let observer = null;

  // Options par défaut : déclenche 80px avant le bas du viewport, seuil 10%
  const defaultOptions = {
    root: null,
    rootMargin: "0px 0px -80px 0px",
    threshold: 0.1,
    ...options, // L'appelant peut surcharger les options
  };

  onMounted(() => {
    const el = elementRef.value;
    if (!el) return;

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Ajoute la classe → déclenche la transition CSS
          entry.target.classList.add("visible");
          // On arrête d'observer (animation une seule fois)
          observer?.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(el);
  });

  // Nettoyage : on déconnecte l'observer quand le composant est démonté
  onUnmounted(() => {
    observer?.disconnect();
  });
}
