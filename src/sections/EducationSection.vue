<script setup>
/**
 * EducationSection.vue — Section Formation
 * ──────────────────────────────────────────
 * - Cartes formation en grille
 * - Calque parallax arrière-plan
 * - useReveal sur les cartes
 */
import { ref }       from 'vue'
import ParallaxLayer from '@/components/ParallaxLayer.vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /**
   * Tableau de formations depuis cv.js.
   * Structure : [{ degree, school, year, desc }]
   */
  education: { type: Array, required: true },
})

// ── Reveal ────────────────────────────────────────────────────
const gridRef = ref(null)
useReveal(gridRef)
</script>

<template>
  <section id="education" class="section education">

    <!-- Calque parallax arrière-plan -->
    <ParallaxLayer :depth="0.18">
      <div class="education__bg-dots" />
    </ParallaxLayer>

    <div class="container">

      <h2 class="section__title">FORMATION</h2>

      <div ref="gridRef" class="education__grid reveal">
        <article
          v-for="edu in education"
          :key="edu.degree + edu.year"
          class="education__card"
        >

          <!-- Année -->
          <span class="education__year">{{ edu.year }}</span>

          <!-- Diplôme -->
          <h3 class="education__degree">{{ edu.degree }}</h3>

          <!-- Établissement -->
          <p class="education__school">{{ edu.school }}</p>

          <!-- Description -->
          <p v-if="edu.desc" class="education__desc">{{ edu.desc }}</p>

        </article>
      </div>

    </div>
  </section>
</template>

<style scoped>
.education { background-color: color-mix(in srgb, var(--color-surface) 88%, transparent); }

/* ── Grille ─────────────────────────────────────────────── */
.education__grid {
  display:               grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap:                   var(--spacing-md);
}

/* ── Carte ──────────────────────────────────────────────── */
.education__card {
  border:     var(--border-thick);
  padding:    var(--spacing-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-brutal);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  position:   relative;
}
.education__card:hover {
  transform:  translate(-3px, -3px);
  box-shadow: 9px 9px 0px var(--color-accent-3);
}

/* ── Année ──────────────────────────────────────────────── */
.education__year {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  letter-spacing: 0.15em;
  color:          var(--color-accent-3);
  text-transform: uppercase;
  display:        block;
  margin-bottom:  0.4rem;
}

/* ── Diplôme ────────────────────────────────────────────── */
.education__degree {
  font-family:    var(--font-display);
  font-size:      var(--text-lg);
  font-weight:    700;
  text-transform: uppercase;
  margin-bottom:  0.3rem;
  line-height:    1.2;
}

/* ── École ──────────────────────────────────────────────── */
.education__school {
  font-family:    var(--font-mono);
  font-size:      var(--text-sm);
  color:          var(--color-accent-1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom:  var(--spacing-sm);
}

/* ── Description ────────────────────────────────────────── */
.education__desc {
  font-size:   var(--text-sm);
  color:       color-mix(in srgb, var(--color-fg) 65%, transparent);
  line-height: 1.6;
}

/* ── Décor parallax ─────────────────────────────────────── */
.education__bg-dots {
  position: absolute;
  inset:    0;
  background-image:
    radial-gradient(circle, color-mix(in srgb, var(--color-accent-2) 10%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
}
</style>
