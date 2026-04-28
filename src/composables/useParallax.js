// src/composables/useParallax.js — Système de parallax multi-couches
// ────────────────────────────────────────────────────────────────────
//
// PATTERN UTILISÉ : provide / inject
//
//   HomeView.vue  →  provide('registerLayer', fn)
//                    provide('unregisterLayer', fn)
//   ParallaxLayer.vue → inject('registerLayer') puis l'appelle sur onMounted
//
// FONCTIONNEMENT :
//   1. HomeView appelle useParallaxController() → obtient { start, stop, registerLayer, unregisterLayer }
//   2. HomeView provide registerLayer/unregisterLayer aux composants enfants
//   3. ParallaxLayer appelle registerLayer(el, depth) à son montage
//   4. La boucle RAF principale (dans HomeView) appelle applyParallax() à chaque frame
//
// LERP (interpolation linéaire) :
//   currentY += (targetY - currentY) * LERP_FACTOR
//   → le calque "rattrape" sa cible progressivement → inertie douce
//
// EXPORT :
//   useParallaxController() → à appeler dans HomeView.vue (provide)
//   LERP_FACTOR             → exporté pour réutilisation éventuelle

import { ref } from "vue";

/** Facteur de lissage du parallax. 0.07 = doux et premium. */
export const LERP_FACTOR = 0.07;

/**
 * useParallaxController()
 * Crée et gère le registre des calques parallax.
 * À appeler UNE SEULE FOIS dans HomeView.vue.
 *
 * @returns {{
 *   registerLayer:   (el: HTMLElement, depth: number) => void,
 *   unregisterLayer: (el: HTMLElement) => void,
 *   computeTargets:  () => void,
 *   applyLerp:       () => boolean,
 * }}
 */
export function useParallaxController() {
  /**
   * Registre interne des calques.
   * Chaque entrée : { el, depth, parent, currentY, targetY }
   * @type {Array<{el: HTMLElement, depth: number, parent: HTMLElement|null, currentY: number, targetY: number}>}
   */
  const layers = [];

  /**
   * registerLayer(el, depth)
   * Enregistre un calque dans le registre.
   * Appelé par ParallaxLayer.vue au onMounted.
   *
   * @param {HTMLElement} el    - L'élément DOM du calque
   * @param {number}      depth - Vitesse de parallax (0.1 → lent, 0.5 → rapide)
   */
  function registerLayer(el, depth) {
    layers.push({
      el,
      depth,
      parent: el.closest(".section") ?? null, // Section parente pour le calcul d'offset
      currentY: 0, // Position lissée actuelle (mise à jour chaque frame)
      targetY: 0, // Position cible calculée depuis scrollY
    });
  }

  /**
   * unregisterLayer(el)
   * Retire un calque du registre.
   * Appelé par ParallaxLayer.vue au onUnmounted.
   *
   * @param {HTMLElement} el
   */
  function unregisterLayer(el) {
    const idx = layers.findIndex((l) => l.el === el);
    if (idx !== -1) layers.splice(idx, 1);
  }

  /**
   * computeTargets()
   * Calcule la position cible (targetY) de chaque calque
   * en fonction de scrollY courant.
   * Ne touche PAS au DOM → séparation lecture/écriture.
   */
  function computeTargets() {
    const scrollY = window.scrollY;

    layers.forEach((layer) => {
      if (!layer.parent) return;

      const sectionTop = layer.parent.offsetTop;
      const sectionHeight = layer.parent.offsetHeight;
      const sectionCenter = sectionTop + sectionHeight / 2;

      // Distance entre le centre du viewport et le centre de la section
      const viewportCenter = scrollY + window.innerHeight / 2;
      const delta = viewportCenter - sectionCenter;

      // Déplacement proportionnel à depth (facteur 0.4 pour tempérer l'amplitude)
      layer.targetY = delta * layer.depth * 0.4;
    });
  }

  /**
   * applyLerp()
   * Interpole currentY → targetY pour chaque calque,
   * puis écrit le transform GPU sur l'élément DOM.
   *
   * @returns {boolean} true si au moins un calque est encore en mouvement
   */
  function applyLerp() {
    let stillMoving = false;

    layers.forEach((layer) => {
      if (!layer.parent) return;

      const diff = layer.targetY - layer.currentY;

      if (Math.abs(diff) < 0.05) {
        // Différence négligeable → snap final, on arrête d'animer
        layer.currentY = layer.targetY;
      } else {
        // Avance d'une fraction du chemin restant (LERP)
        layer.currentY += diff * LERP_FACTOR;
        stillMoving = true;
      }

      // Écriture GPU-friendly (translate3d active la couche composite)
      layer.el.style.transform = `translate3d(0, ${layer.currentY}px, 0)`;
    });

    return stillMoving;
  }

  return { registerLayer, unregisterLayer, computeTargets, applyLerp };
}
