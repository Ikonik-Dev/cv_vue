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
import { ref }       from 'vue'
import ParallaxLayer from '@/components/ParallaxLayer.vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /** Objet person depuis cv.js */
  person: { type: Object, required: true },
  /** Tableau de stats depuis cv.js */
  stats:  { type: Array,  required: true },
})

// ── Reveal ────────────────────────────────────────────────────
const heroContent = ref(null)
useReveal(heroContent)
</script>

<template>
  <section id="hero" class="section hero">

    <!-- ── Calques parallax décoratifs ───────────────────── -->
    <!-- Profondeur 0.1 : très lent, fond lointain -->
    <ParallaxLayer :depth="0.1">
      <div class="hero__bg hero__bg--dots" />
    </ParallaxLayer>

    <!-- Profondeur 0.2 : lent -->
    <ParallaxLayer :depth="0.2">
      <div class="hero__bg hero__bg--line-h" />
    </ParallaxLayer>

    <!-- Profondeur 0.4 : moyen -->
    <ParallaxLayer :depth="0.4">
      <div class="hero__deco hero__deco--square" />
    </ParallaxLayer>

    <!-- Profondeur 0.5 : plus proche, rapide -->
    <ParallaxLayer :depth="0.5">
      <div class="hero__deco hero__deco--circle" />
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
          >{{ props.person.lastName }}</span>
          <span
            class="hero__name-first glitch"
            :data-text="props.person.firstName"
          >{{ props.person.firstName }}</span>
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
          <a href="#projects" class="btn btn--outline js-smooth">VOIR MES PROJETS</a>
        </div>

        <!-- Statistiques -->
        <ul class="hero__stats" role="list">
          <li
            v-for="stat in stats"
            :key="stat.label"
            class="hero__stat"
          >
            <span class="hero__stat-value">{{ stat.value }}</span>
            <span class="hero__stat-label">{{ stat.label }}</span>
          </li>
        </ul>

      </div>
    </div>

    <!-- Indicateur de scroll -->
    <div class="hero__scroll-indicator" aria-hidden="true">
      <span class="hero__scroll-line" /><br>
      <span class="hero__scroll-text">SCROLL</span>
    </div>

  </section>
</template>

<style scoped>
/* ── Section hero ─────────────────────────────────────── */
.hero {
  min-height:  100vh;
  display:     flex;
  align-items: center;
  padding-top: 72px; /* compense la nav fixe */
  overflow:    hidden;
  position:    relative;
}

/* ── Contenu ──────────────────────────────────────────── */
.hero__content {
  padding:    var(--spacing-lg) 0 var(--spacing-xl);
  max-width:  720px;
  position:   relative;
  z-index:    var(--z-content);
}

/* ── Label clignotant ─────────────────────────────────── */
.hero__label {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  letter-spacing: 0.2em;
  color:          var(--color-accent-1);
  margin-bottom:  var(--spacing-sm);
  display:        flex;
  align-items:    center;
  gap:            0.5rem;
  animation:      fade-up 0.8s ease both;
}

.hero__label-dot {
  width:            8px;
  height:           8px;
  background:       var(--color-accent-1);
  border-radius:    50%;
  display:          inline-block;
  animation:        blink-label 1.4s ease-in-out infinite;
}

/* ── Nom glitch ───────────────────────────────────────── */
.hero__name {
  font-family:    var(--font-display);
  font-size:      var(--text-hero);
  font-weight:    700;
  text-transform: uppercase;
  line-height:    0.88;
  word-break:     break-word;
  margin-bottom:  var(--spacing-md);
  animation:      fade-up 0.9s ease 0.1s both;
  /* Le contenu ::before/::after utilise font-size: var(--text-hero) aussi */
}

.hero__name-last  { color: var(--color-fg);      display: block; }
.hero__name-first { color: var(--color-accent-2); display: block; }

/* ── Poste ─────────────────────────────────────────────── */
.hero__title {
  font-family:    var(--font-mono);
  font-size:      var(--text-lg);
  color:          var(--color-accent-3);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom:  var(--spacing-sm);
  animation:      fade-up 0.9s ease 0.2s both;
}

/* ── Bio ───────────────────────────────────────────────── */
.hero__bio {
  font-size:     var(--text-base);
  max-width:     520px;
  color:         color-mix(in srgb, var(--color-fg) 75%, transparent);
  margin-bottom: var(--spacing-md);
  animation:     fade-up 0.9s ease 0.3s both;
}

/* ── CTA ───────────────────────────────────────────────── */
.hero__cta {
  display:       flex;
  gap:           var(--spacing-sm);
  flex-wrap:     wrap;
  margin-bottom: var(--spacing-lg);
  animation:     fade-up 0.9s ease 0.4s both;
}

/* ── Stats ─────────────────────────────────────────────── */
.hero__stats {
  display:       flex;
  gap:           var(--spacing-lg);
  flex-wrap:     wrap;
  padding-top:   var(--spacing-md);
  border-top:    1px solid color-mix(in srgb, var(--color-fg) 20%, transparent);
  list-style:    none;
  animation:     fade-up 0.9s ease 0.5s both;
}

.hero__stat {
  display:        flex;
  flex-direction: column;
  gap:            0.2rem;
}

.hero__stat-value {
  font-family: var(--font-display);
  font-size:   var(--text-2xl);
  font-weight: 700;
  color:       var(--color-accent-1);
  line-height: 1;
}

.hero__stat-label {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color:          color-mix(in srgb, var(--color-fg) 60%, transparent);
}

/* ── Décors parallax ───────────────────────────────────── */
.hero__bg {
  position: absolute;
  inset:    0;
  pointer-events: none;
}

/* Grille de points en background */
.hero__bg--dots {
  background-image:
    radial-gradient(circle, color-mix(in srgb, var(--color-accent-1) 15%, transparent) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* Ligne horizontale fine */
.hero__bg--line-h {
  top:    45%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-accent-2), transparent);
  opacity: 0.3;
}

/* Carré brutaliste */
.hero__deco--square {
  width:  160px;
  height: 160px;
  border: var(--border-thick);
  border-color: var(--color-accent-3);
  right:  12%;
  top:    20%;
  opacity: 0.25;
}

/* Cercle fantôme */
.hero__deco--circle {
  width:         240px;
  height:        240px;
  border-radius: 50%;
  border:        3px solid var(--color-accent-2);
  right:         5%;
  bottom:        15%;
  opacity:       0.15;
}

/* ── Indicateur de scroll ─────────────────────────────── */
.hero__scroll-indicator {
  position:   absolute;
  bottom:     var(--spacing-md);
  left:       50%;
  transform:  translateX(-50%);
  text-align: center;
  z-index:    var(--z-content);
}

.hero__scroll-line {
  display:          inline-block;
  width:            1px;
  height:           40px;
  background:       var(--color-accent-1);
  margin-bottom:    0.5rem;
  animation:        fade-up 1s ease 0.8s both;
}

.hero__scroll-text {
  font-family:    var(--font-mono);
  font-size:      0.65rem;
  letter-spacing: 0.25em;
  color:          color-mix(in srgb, var(--color-fg) 50%, transparent);
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 768px) {
  .hero__cta { flex-direction: column; }
  .hero__stats { gap: var(--spacing-md); }
  .hero__deco--square,
  .hero__deco--circle { display: none; }
}
</style>
