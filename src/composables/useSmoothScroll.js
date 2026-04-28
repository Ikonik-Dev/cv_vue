// src/composables/useSmoothScroll.js — Scroll lerp JS
// ──────────────────────────────────────────────────────
//
// FONCTIONNEMENT :
//   smoothScrollTo(targetY) → définit scrollState.target
//   tickScroll()            → appelé à chaque frame RAF (dans HomeView)
//                             interpole scrollState.current → target
//                             écrit window.scrollTo(0, current)
//                             retourne true tant que l'animation est active
//
// AVANTAGE vs scroll-behavior: smooth :
//   - Vitesse cohérente avec l'inertie du parallax (même boucle RAF)
//   - Contrôle précis sur le facteur d'interpolation
//   - Compatible avec la gestion manuelle de la nav fixe

/** Facteur d'interpolation du scroll. 0.08 = doux et réactif. */
const SCROLL_LERP = 0.08;

/**
 * État interne de l'animation de scroll.
 * Partagé entre smoothScrollTo() et tickScroll().
 * @type {{ active: boolean, current: number, target: number }}
 */
const scrollState = {
  active: false, // true = animation en cours
  current: 0, // position lissée courante (px)
  target: 0, // position cible (px depuis le haut du document)
};

/**
 * useSmoothScroll()
 * Composable à appeler dans n'importe quel composant ou view.
 *
 * @returns {{
 *   smoothScrollTo: (targetY: number) => void,
 *   tickScroll:     () => boolean,
 * }}
 */
export function useSmoothScroll() {
  /**
   * smoothScrollTo(targetY)
   * Lance une animation de scroll vers la position targetY.
   * La hauteur de la nav fixe doit être soustraite AVANT l'appel.
   *
   * @param {number} targetY - Position cible en px (depuis le haut du document)
   */
  function smoothScrollTo(targetY) {
    scrollState.current = window.scrollY; // Point de départ = position actuelle
    scrollState.target = Math.max(0, targetY); // On ne peut pas scroller en négatif
    scrollState.active = true;
  }

  /**
   * tickScroll()
   * Avance d'un pas l'animation de scroll via LERP.
   * À appeler dans la boucle RAF principale (HomeView.vue → rafLoop).
   *
   * @returns {boolean} true si l'animation est encore en cours
   */
  function tickScroll() {
    if (!scrollState.active) return false;

    const diff = scrollState.target - scrollState.current;

    if (Math.abs(diff) < 0.5) {
      // On est arrivé à destination → snap final précis
      window.scrollTo(0, scrollState.target);
      scrollState.current = scrollState.target;
      scrollState.active = false;
      return false;
    }

    // Interpolation linéaire : avance d'une fraction du chemin restant
    scrollState.current += diff * SCROLL_LERP;
    window.scrollTo(0, scrollState.current);
    return true;
  }

  return { smoothScrollTo, tickScroll };
}
