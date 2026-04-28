// src/composables/useProjectTransition.js
// ─────────────────────────────────────────────────────────────
// Singleton réactif — état de la transition zoom entre la
// section Projets et la scène monde (WorldView).
//
// Phases :
//   idle        → overlay non monté
//   entering    → overlay zoome de la carte vers plein écran
//   covering    → plein écran, en attente de navigation
//   revealing   → overlay disparaît pour révéler WorldView
//   exiting     → overlay réapparaît pour retourner au CV
// ─────────────────────────────────────────────────────────────

import { reactive } from "vue";

/** @type {{ active: boolean, project: object|null, projectIndex: number, sourceRect: DOMRect|null, phase: string }} */
export const transitionState = reactive({
  active: false,
  project: null,
  projectIndex: -1,
  sourceRect: null,
  phase: "idle",
});

/**
 * Déclenche la transition d'entrée depuis une carte projet.
 * @param {object}  project   — objet projet (cv.js)
 * @param {number}  index     — index dans le tableau projects
 * @param {DOMRect} domRect   — getBoundingClientRect() de la carte
 */
export function triggerProjectEnter(project, index, domRect) {
  transitionState.project = project;
  transitionState.projectIndex = index;
  transitionState.sourceRect = {
    left: domRect.left,
    top: domRect.top,
    width: domRect.width,
    height: domRect.height,
  };
  transitionState.phase = "entering";
  transitionState.active = true;
}

/**
 * Passe en phase « revealing » pour que l'overlay se retire.
 * Appelé depuis WorldView.onMounted.
 */
export function startReveal() {
  transitionState.phase = "revealing";
}

/**
 * Déclenche la transition de sortie (retour au CV).
 * Appelé depuis WorldView (bouton ← Retour).
 */
export function triggerProjectExit() {
  transitionState.phase = "exiting";
  transitionState.active = true;
}

/**
 * Reset complet après fin d'animation.
 */
export function resetTransition() {
  transitionState.active = false;
  transitionState.phase = "idle";
  transitionState.project = null;
  transitionState.projectIndex = -1;
  transitionState.sourceRect = null;
}
