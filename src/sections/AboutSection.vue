<script setup>
/**
 * AboutSection.vue — Section À propos
 * ────────────────────────────────────
 * - Avatar avec initiales (DSV)
 * - Grille : avatar gauche, texte bio droite
 * - 2 calques parallax décoratifs
 * - useReveal sur la grille
 */
import { ref }       from 'vue'
import ParallaxLayer from '@/components/ParallaxLayer.vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /** Objet person depuis cv.js */
  person: { type: Object, required: true },
})

// ── Reveal ────────────────────────────────────────────────────
const gridRef = ref(null)
useReveal(gridRef)
</script>

<template>
  <section id="about" class="section about">

    <!-- Calque parallax arrière-plan : motif diagonal -->
    <ParallaxLayer :depth="0.15">
      <div class="about__bg-stripe" />
    </ParallaxLayer>

    <!-- Calque parallax avant-plan : carré décoratif -->
    <ParallaxLayer :depth="0.35">
      <div class="about__deco-block" />
    </ParallaxLayer>

    <div class="container">

      <h2 class="section__title">À PROPOS</h2>

      <!-- Grille avatar + bio -->
      <div ref="gridRef" class="about__grid reveal">

        <!-- Avatar avec initiales -->
        <div class="about__avatar" aria-hidden="true">
          <div class="about__avatar-inner">
            <span class="about__avatar-initials">{{ props.person.initials }}</span>
          </div>
          <div class="about__avatar-frame" />
        </div>

        <!-- Texte bio -->
        <div class="about__text">

          <!-- Nom complet avec accent -->
          <h3 class="about__name">
            {{ props.person.firstName }}&nbsp;
            <span class="accent">{{ props.person.lastName }}</span>
          </h3>

          <!-- Chaque paragraphe de bio -->
          <p
            v-for="(paragraph, i) in props.person.bio"
            :key="i"
            class="about__bio"
          >
            {{ paragraph }}
          </p>

          <!-- Liens de contact rapide -->
          <div class="about__links">
            <a
              :href="`mailto:${props.person.email}`"
              class="about__link"
            >
              {{ props.person.email }}
            </a>
            <a
              v-if="props.person.github"
              :href="props.person.github"
              target="_blank"
              rel="noopener noreferrer"
              class="about__link"
            >
              GitHub
            </a>
            <a
              v-if="props.person.linkedin"
              :href="props.person.linkedin"
              target="_blank"
              rel="noopener noreferrer"
              class="about__link"
            >
              LinkedIn
            </a>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about { background-color: var(--color-surface); }

/* ── Grille principale ─────────────────────────────────── */
.about__grid {
  display:  grid;
  grid-template-columns: 240px 1fr;
  gap:      var(--spacing-xl);
  align-items: center;
}

/* ── Avatar ────────────────────────────────────────────── */
.about__avatar {
  position:  relative;
  width:     200px;
  height:    200px;
  flex-shrink: 0;
}

.about__avatar-inner {
  width:            200px;
  height:           200px;
  background:       var(--color-bg);
  border:           var(--border-thick);
  display:          flex;
  align-items:      center;
  justify-content:  center;
  position:         relative;
  z-index:          1;
}

.about__avatar-initials {
  font-family:    var(--font-display);
  font-size:      3.5rem;
  font-weight:    700;
  color:          var(--color-accent-1);
  letter-spacing: 0.1em;
}

/* Cadre décalé brutaliste */
.about__avatar-frame {
  position:   absolute;
  inset:      0;
  top:        10px;
  left:       10px;
  border:     2px solid var(--color-accent-2);
  z-index:    0;
}

/* ── Bio texte ─────────────────────────────────────────── */
.about__name {
  font-family:    var(--font-display);
  font-size:      var(--text-xl);
  font-weight:    700;
  text-transform: uppercase;
  margin-bottom:  var(--spacing-sm);
}

.about__bio {
  font-size:     var(--text-base);
  color:         color-mix(in srgb, var(--color-fg) 80%, transparent);
  margin-bottom: var(--spacing-sm);
  line-height:   1.7;
}

/* ── Liens ─────────────────────────────────────────────── */
.about__links {
  display:    flex;
  gap:        var(--spacing-md);
  flex-wrap:  wrap;
  margin-top: var(--spacing-sm);
}

.about__link {
  font-family:    var(--font-mono);
  font-size:      var(--text-sm);
  color:          var(--color-accent-1);
  border-bottom:  1px solid var(--color-accent-1);
  transition:     color var(--transition-fast), border-color var(--transition-fast);
}
.about__link:hover {
  color:        var(--color-accent-2);
  border-color: var(--color-accent-2);
}

/* ── Décors parallax ───────────────────────────────────── */
.about__bg-stripe {
  position:   absolute;
  top:        0; right: 0;
  width:      40%;
  height:     100%;
  background: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 20px,
    color-mix(in srgb, var(--color-accent-3) 4%, transparent) 20px,
    color-mix(in srgb, var(--color-accent-3) 4%, transparent) 21px
  );
}

.about__deco-block {
  width:  80px;
  height: 80px;
  background: var(--color-accent-2);
  opacity: 0.12;
  right:   15%;
  top:     20%;
  position: absolute;
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 768px) {
  .about__grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .about__avatar { margin: 0 auto; }
  .about__links  { justify-content: center; }
}
</style>
