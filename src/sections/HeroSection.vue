<script setup>
/**
 * HeroSection.vue — Section Hero (première section visible)
 * ──────────────────────────────────────────────────────────
 * - Titre avec effet glitch CSS (via .glitch + data-text)
 * - 4 calques parallax à profondeurs différentes
 * - Statistiques (stats) affichées en grille
 * - Boutons de navigation smooth scroll
 * - useReveal sur le contenu principal
 */
import { ref } from "vue";
import ParallaxLayer from "@/components/ParallaxLayer.vue";
import { useReveal }  from "@/composables/useReveal.js";
import { useGlitch }  from "@/composables/useGlitch.js";

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /** Objet person depuis cv.js */
  person: { type: Object, required: true },
  /** Tableau de stats depuis cv.js */
  stats: { type: Array, required: true },
});

// ── Reveal ────────────────────────────────────────────────────
const heroContent = ref(null);
useReveal(heroContent);
// ── Glitch ────────────────────────────────────────────
// heroContent contient les deux .glitch spans — useGlitch les trouve via querySelectorAll
useGlitch(heroContent);</script>

<template>
  <section id="hero" class="section hero">
    <!-- ── Calques parallax décoratifs ───────────────────── -->
    <!-- 0.08 — fond très lointain : grille de points -->
    <ParallaxLayer :depth="0.08">
      <div class="hero__bg hero__bg--dots" />
    </ParallaxLayer>

    <!-- 0.15 — ligne horizontale fantôme -->
    <ParallaxLayer :depth="0.15">
      <div class="hero__bg hero__bg--line-h" />
    </ParallaxLayer>

    <!-- 0.2 — grand cercle top-right (accent-2) -->
    <ParallaxLayer :depth="0.2">
      <div class="hero__deco hero__deco--circle-lg" />
    </ParallaxLayer>

    <!-- 0.28 — grande croix top-left (accent-3) -->
    <ParallaxLayer :depth="0.28">
      <div class="hero__deco hero__deco--cross-lg" />
    </ParallaxLayer>

    <!-- 0.38 — carré medium center-right (accent-3) -->
    <ParallaxLayer :depth="0.38">
      <div class="hero__deco hero__deco--square" />
    </ParallaxLayer>

    <!-- 0.45 — petit cercle mid-left (accent-1) -->
    <ParallaxLayer :depth="0.45">
      <div class="hero__deco hero__deco--circle-sm" />
    </ParallaxLayer>

    <!-- 0.55 — petit carré bottom-left (accent-2) -->
    <ParallaxLayer :depth="0.55">
      <div class="hero__deco hero__deco--square-sm" />
    </ParallaxLayer>

    <!-- 0.65 — petite croix bottom-right (accent-1) -->
    <ParallaxLayer :depth="0.65">
      <div class="hero__deco hero__deco--cross-sm" />
    </ParallaxLayer>

    <!-- ── Contenu principal ──────────────────────────────── -->
    <div class="container">
      <div ref="heroContent" class="hero__content reveal">
        <!-- Label supérieur clignotant -->
        <p class="hero__label">
          <span class="hero__label-dot" /> DISPONIBLE · PARIS
        </p>

        <!-- Titre glitch : .glitch sur chaque <span> enfant, pas sur le <h1> bloc -->
        <h1 class="hero__name">
          <span
            class="hero__name-last glitch"
            :data-text="props.person.lastName"
            >{{ props.person.lastName }}</span
          >
          <span
            class="hero__name-first glitch"
            :data-text="props.person.firstName"
            >{{ props.person.firstName }}</span
          >
        </h1>

        <!-- Titre de poste -->
        <p class="hero__title">
          {{ props.person.title }}
        </p>

        <!-- Bio (première phrase) -->
        <p class="hero__bio">
          {{ props.person.bio[0] }}
        </p>

        <!-- CTA -->
        <div class="hero__cta">
          <a href="#contact" class="btn btn--primary js-smooth">ME CONTACTER</a>
          <a href="#projects" class="btn btn--outline js-smooth"
            >VOIR MES PROJETS</a
          >
        </div>

        <!-- Statistiques -->
        <ul class="hero__stats" role="list">
          <li v-for="stat in stats" :key="stat.label" class="hero__stat">
            <span class="hero__stat-value">{{ stat.num }}</span>
            <span class="hero__stat-label">{{ stat.label }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Indicateur de scroll -->
    <a href="#about" class="hero__scroll-indicator js-smooth" aria-label="Défiler vers le contenu">
      <div class="hero__scroll-mouse">
        <span class="hero__scroll-wheel" />
      </div>
      <div class="hero__scroll-arrows">
        <span class="hero__scroll-arrow" />
        <span class="hero__scroll-arrow" />
      </div>
      <span class="hero__scroll-text">SCROLL</span>
    </a>
  </section>
</template>

<style scoped>
/* ── Section hero ─────────────────────────────────────── */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding-top: 72px; /* compense la nav fixe */
  overflow: hidden;
  position: relative;
}

/* ── Contenu ──────────────────────────────────────────── */
.hero__content {
  padding: var(--spacing-lg) 0 var(--spacing-xl);
  max-width: 720px;
  position: relative;
  z-index: var(--z-content);
}

/* ── Label clignotant ─────────────────────────────────── */
.hero__label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: 0.2em;
  color: var(--color-accent-1);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: fade-up 0.8s ease both;
}

.hero__label-dot {
  width: 8px;
  height: 8px;
  background: var(--color-accent-1);
  border-radius: 50%;
  display: inline-block;
  animation: blink-label 1.4s ease-in-out infinite;
}

/* ── Nom glitch ───────────────────────────────────────── */
.hero__name {
  font-family: var(--font-display);
  font-size: var(--text-hero);
  font-weight: 700;
  text-transform: uppercase;
  line-height: 0.88;
  word-break: break-word;
  margin-bottom: var(--spacing-md);
  animation: fade-up 0.9s ease 0.1s both;
  /* Le contenu ::before/::after utilise font-size: var(--text-hero) aussi */
}

.hero__name-last {
  color: var(--color-fg);
  display: block;
}
.hero__name-first {
  color: var(--color-accent-2);
  display: block;
}

/* ── Poste ─────────────────────────────────────────────── */
.hero__title {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  color: var(--color-accent-3);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: var(--spacing-sm);
  animation: fade-up 0.9s ease 0.2s both;
}

/* ── Bio ───────────────────────────────────────────────── */
.hero__bio {
  font-size: var(--text-base);
  max-width: 520px;
  color: color-mix(in srgb, var(--color-fg) 75%, transparent);
  margin-bottom: var(--spacing-md);
  animation: fade-up 0.9s ease 0.3s both;
}

/* ── CTA ───────────────────────────────────────────────── */
.hero__cta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-lg);
  animation: fade-up 0.9s ease 0.4s both;
}

/* ── Stats ─────────────────────────────────────────────── */
.hero__stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  padding-top: var(--spacing-md);
  border-top: 1px solid color-mix(in srgb, var(--color-fg) 20%, transparent);
  list-style: none;
  animation: fade-up 0.9s ease 0.5s both;
}

.hero__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.hero__stat-value {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-accent-1);
  line-height: 1;
}

.hero__stat-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: color-mix(in srgb, var(--color-fg) 60%, transparent);
}

/* ── Décors parallax ───────────────────────────────────── */
.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Grille de points en background */
.hero__bg--dots {
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--color-accent-1) 15%, transparent) 1px,
    transparent 1px
  );
  background-size: 32px 32px;
}

/* Ligne horizontale fine */
.hero__bg--line-h {
  top: 45%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-accent-2),
    transparent
  );
  opacity: 0.3;
}

/* ── Base commune à toutes les décos parallax ── */
.hero__deco {
  position: absolute;
  pointer-events: none;
}

/* Grand cercle — déborde en top-right */
.hero__deco--circle-lg {
  width: 480px;
  height: 480px;
  border-radius: 50%;
  border: 2px solid var(--color-accent-2);
  right: -100px;
  top: -80px;
  opacity: 0.1;
}

/* Petit cercle — mid-left */
.hero__deco--circle-sm {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--color-accent-1);
  left: 3%;
  top: 52%;
  opacity: 0.35;
}

/* Carré medium — center-right */
.hero__deco--square {
  width: 130px;
  height: 130px;
  border: var(--border-thick);
  border-color: var(--color-accent-3);
  right: 13%;
  top: 24%;
  opacity: 0.2;
}

/* Petit carré — bottom-left */
.hero__deco--square-sm {
  width: 52px;
  height: 52px;
  border: 2px solid var(--color-accent-2);
  left: 7%;
  bottom: 20%;
  opacity: 0.4;
}

/* Grande croix — top-left */
.hero__deco--cross-lg {
  width: 60px;
  height: 60px;
  left: 6%;
  top: 16%;
  opacity: 0.28;
}
.hero__deco--cross-lg::before,
.hero__deco--cross-lg::after {
  content: '';
  position: absolute;
  background: var(--color-accent-3);
}
.hero__deco--cross-lg::before {
  width: 2px;
  height: 100%;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}
.hero__deco--cross-lg::after {
  width: 100%;
  height: 2px;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

/* Petite croix — bottom-right */
.hero__deco--cross-sm {
  width: 30px;
  height: 30px;
  right: 9%;
  bottom: 26%;
  opacity: 0.45;
}
.hero__deco--cross-sm::before,
.hero__deco--cross-sm::after {
  content: '';
  position: absolute;
  background: var(--color-accent-1);
}
.hero__deco--cross-sm::before {
  width: 2px;
  height: 100%;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}
.hero__deco--cross-sm::after {
  width: 100%;
  height: 2px;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
}

/* ── Indicateur de scroll ─────────────────────────────── */
.hero__scroll-indicator {
  position: absolute;
  bottom: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  z-index: var(--z-content);
  text-decoration: none;
  animation: fade-up 1s ease 1s both;
  transition: opacity var(--transition-fast);
}
.hero__scroll-indicator:hover {
  opacity: 0.7;
}

/* Forme souris CSS */
.hero__scroll-mouse {
  width: 22px;
  height: 36px;
  border: 2px solid var(--color-accent-1);
  border-radius: 11px;
  display: flex;
  justify-content: center;
  padding-top: 5px;
}

.hero__scroll-wheel {
  width: 3px;
  height: 7px;
  background: var(--color-accent-1);
  border-radius: 2px;
  animation: scroll-wheel 1.8s ease-in-out infinite;
}

/* Chevrons dégradés */
.hero__scroll-arrows {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.hero__scroll-arrow {
  display: block;
  width: 9px;
  height: 9px;
  border-right: 2px solid var(--color-accent-1);
  border-bottom: 2px solid var(--color-accent-1);
  transform: rotate(45deg) translate(-2px, -2px);
  opacity: 0;
  animation: scroll-arrow 1.8s ease-in-out infinite;
}
.hero__scroll-arrow:nth-child(2) {
  border-color: var(--color-accent-2);
  animation-delay: 0.28s;
}

.hero__scroll-text {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  color: color-mix(in srgb, var(--color-fg) 45%, transparent);
  text-transform: uppercase;
}

@keyframes scroll-wheel {
  0%       { opacity: 1; transform: translateY(0); }
  55%      { opacity: 0; transform: translateY(9px); }
  56%      { opacity: 0; transform: translateY(0); }
  100%     { opacity: 1; transform: translateY(0); }
}

@keyframes scroll-arrow {
  0%, 15%  { opacity: 0; transform: rotate(45deg) translate(-3px, -3px); }
  50%      { opacity: 1; transform: rotate(45deg) translate(0, 0); }
  85%, 100%{ opacity: 0; transform: rotate(45deg) translate(3px, 3px); }
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 768px) {
  .hero__cta {
    flex-direction: column;
  }
  .hero__stats {
    gap: var(--spacing-md);
  }
  .hero__deco--circle-lg,
  .hero__deco--cross-lg,
  .hero__deco--square {
    display: none;
  }
}
</style>
