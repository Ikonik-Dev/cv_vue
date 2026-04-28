<script setup>
/**
 * PageBackground.vue — Fond parallax brutaliste global
 * ──────────────────────────────────────────────────────
 * Formes géométriques simples (cercles, carrés, croix, lignes)
 * réparties sur toute la hauteur de la page.
 * Chaque forme porte un data-depth : translateY = scrollY × depth × -1
 * pour créer l'effet de profondeur.
 *
 * Indépendant du système ParallaxLayer (pas de .section parent requis).
 * Rendu dans App.vue → présent sur toute l'application.
 */
import { ref, onMounted, onUnmounted } from 'vue'

const bgRef = ref(null)
let rafId = null

function loop() {
  if (bgRef.value) {
    const sy = window.scrollY
    bgRef.value.querySelectorAll('[data-depth]').forEach(el => {
      const d = parseFloat(el.dataset.depth)
      el.style.transform = `translateY(${sy * d * -1}px)`
    })
  }
  rafId = requestAnimationFrame(loop)
}

onMounted(() => { rafId = requestAnimationFrame(loop) })
onUnmounted(() => { if (rafId) cancelAnimationFrame(rafId) })
</script>

<template>
  <div ref="bgRef" class="page-bg" aria-hidden="true">

    <!-- ── Fond : grille de points, quasi immobile ── -->
    <div class="pbg pbg--dots" data-depth="0.01" />

    <!-- ── Grand cercle top-right, sort du cadre ── -->
    <div class="pbg pbg--circle-xl" data-depth="0.03" />

    <!-- ── Ligne horizontale épaisse — séparateur architectural ── -->
    <div class="pbg pbg--hline" data-depth="0.05" />

    <!-- ── Grand carré creux — zone centrale gauche ── -->
    <div class="pbg pbg--square-lg" data-depth="0.06" />

    <!-- ── Croix large — haut gauche ── -->
    <div class="pbg pbg--cross-lg" data-depth="0.08" />

    <!-- ── Petit cercle — tiers supérieur droit ── -->
    <div class="pbg pbg--circle-sm" data-depth="0.10" />

    <!-- ── Ligne verticale — bord droit ── -->
    <div class="pbg pbg--vline" data-depth="0.07" />

    <!-- ── Carré plein accent — mi-page droit ── -->
    <div class="pbg pbg--square-dot" data-depth="0.12" />

    <!-- ── Croix petite — mi-page gauche ── -->
    <div class="pbg pbg--cross-sm" data-depth="0.11" />

    <!-- ── Brackets angulaires bas-gauche ── -->
    <div class="pbg pbg--bracket-l" data-depth="0.09" />
    <div class="pbg pbg--bracket-r" data-depth="0.09" />

    <!-- ── Cercle medium — bas de page ── -->
    <div class="pbg pbg--circle-md" data-depth="0.07" />

    <!-- ── Petite grille de carrés — bas droit ── -->
    <div class="pbg pbg--grid" data-depth="0.04" />

  </div>
</template>

<style scoped>
/* ── Conteneur global : fixed, derrière tout ─────────────────── */
.page-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  user-select: none;
  z-index: 0;
  overflow: hidden;
}

/* ── Base commune ─────────────────────────────────────────────── */
.pbg {
  position: absolute;
  will-change: transform;
}

/* ── Grille de points ────────────────────────────────────────── */
.pbg--dots {
  inset: 0;
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent-1) 12%, transparent) 1px,
    transparent 1px
  );
  background-size: 36px 36px;
  opacity: 0.6;
}

/* ── Grand cercle — déborde en top-right ─────────────────────── */
.pbg--circle-xl {
  width: 600px;
  height: 600px;
  border-radius: 50%;
  border: 2px solid var(--color-accent-2);
  right: -180px;
  top: 8vh;
  opacity: 0.08;
}

/* ── Ligne horizontale ────────────────────────────────────────── */
.pbg--hline {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-accent-3) 20%,
    var(--color-accent-3) 80%,
    transparent 100%
  );
  top: 32vh;
  left: 0;
  opacity: 0.12;
}

/* ── Grand carré creux ────────────────────────────────────────── */
.pbg--square-lg {
  width: 220px;
  height: 220px;
  border: 2px solid var(--color-accent-3);
  left: -60px;
  top: 40vh;
  opacity: 0.1;
}

/* ── Grande croix ─────────────────────────────────────────────── */
.pbg--cross-lg {
  width: 80px;
  height: 80px;
  left: 8%;
  top: 18vh;
  opacity: 0.18;
}
.pbg--cross-lg::before,
.pbg--cross-lg::after {
  content: '';
  position: absolute;
  background: var(--color-accent-3);
}
.pbg--cross-lg::before {
  width: 2px; height: 100%;
  left: 50%; top: 0;
  transform: translateX(-50%);
}
.pbg--cross-lg::after {
  width: 100%; height: 2px;
  top: 50%; left: 0;
  transform: translateY(-50%);
}

/* ── Petit cercle ─────────────────────────────────────────────── */
.pbg--circle-sm {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 2px solid var(--color-accent-1);
  right: 12%;
  top: 28vh;
  opacity: 0.22;
}

/* ── Ligne verticale ─────────────────────────────────────────── */
.pbg--vline {
  width: 1px;
  height: 45vh;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-accent-2) 30%,
    var(--color-accent-2) 70%,
    transparent 100%
  );
  right: 6%;
  top: 50vh;
  opacity: 0.15;
}

/* ── Carré plein (petit accent) ──────────────────────────────── */
.pbg--square-dot {
  width: 14px;
  height: 14px;
  background: var(--color-accent-2);
  right: 18%;
  top: 62vh;
  opacity: 0.5;
}

/* ── Petite croix ─────────────────────────────────────────────── */
.pbg--cross-sm {
  width: 36px;
  height: 36px;
  left: 14%;
  top: 70vh;
  opacity: 0.3;
}
.pbg--cross-sm::before,
.pbg--cross-sm::after {
  content: '';
  position: absolute;
  background: var(--color-accent-1);
}
.pbg--cross-sm::before {
  width: 2px; height: 100%;
  left: 50%; top: 0;
  transform: translateX(-50%);
}
.pbg--cross-sm::after {
  width: 100%; height: 2px;
  top: 50%; left: 0;
  transform: translateY(-50%);
}

/* ── Brackets angulaires ─────────────────────────────────────── */
.pbg--bracket-l,
.pbg--bracket-r {
  width: 30px;
  height: 50px;
  top: 82vh;
  opacity: 0.35;
}
.pbg--bracket-l {
  left: 5%;
  border-left: 3px solid var(--color-accent-1);
  border-top: 3px solid var(--color-accent-1);
  border-bottom: 3px solid var(--color-accent-1);
}
.pbg--bracket-r {
  right: 5%;
  border-right: 3px solid var(--color-accent-1);
  border-top: 3px solid var(--color-accent-1);
  border-bottom: 3px solid var(--color-accent-1);
}

/* ── Cercle medium bas de page ───────────────────────────────── */
.pbg--circle-md {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 2px solid var(--color-accent-3);
  left: 3%;
  top: 90vh;
  opacity: 0.12;
}

/* ── Mini grille de carrés ───────────────────────────────────── */
.pbg--grid {
  width: 120px;
  height: 120px;
  background-image:
    linear-gradient(var(--color-accent-1) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-accent-1) 1px, transparent 1px);
  background-size: 20px 20px;
  right: 8%;
  top: 88vh;
  opacity: 0.07;
}

/* ── Responsive : masque les plus grosses formes ─────────────── */
@media (max-width: 768px) {
  .pbg--circle-xl,
  .pbg--square-lg { display: none; }
}
</style>
