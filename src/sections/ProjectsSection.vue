<script setup>
/**
 * ProjectsSection.vue — Section Projets
 * ─────────────────────────────────────
 * - Grille de cartes projet
 * - Effet hover brutaliste (shadow offset)
 * - 2 calques parallax décoratifs
 * - useReveal sur la grille
 */
import { ref }       from 'vue'
import ParallaxLayer from '@/components/ParallaxLayer.vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /**
   * Tableau de projets depuis cv.js.
   * Structure : [{ title, desc, stack: string[], link?, github? }]
   */
  projects: { type: Array, required: true },
})

// ── Reveal ────────────────────────────────────────────────────
const gridRef = ref(null)
useReveal(gridRef)
</script>

<template>
  <section id="projects" class="section projects">

    <!-- Calques parallax décoratifs -->
    <ParallaxLayer :depth="0.15">
      <div class="projects__bg-grid" />
    </ParallaxLayer>

    <ParallaxLayer :depth="0.3">
      <div class="projects__deco-line" />
    </ParallaxLayer>

    <div class="container">

      <h2 class="section__title">PROJETS</h2>

      <!-- Grille de projets -->
      <div ref="gridRef" class="projects__grid reveal">
        <article
          v-for="project in projects"
          :key="project.title"
          class="projects__card"
        >

          <!-- Numéro de projet (décoratif) -->
          <span class="projects__card-number" aria-hidden="true">
            {{ String(projects.indexOf(project) + 1).padStart(2, '0') }}
          </span>

          <!-- Titre -->
          <h3 class="projects__card-title">{{ project.title }}</h3>

          <!-- Description -->
          <p class="projects__card-desc">{{ project.desc }}</p>

          <!-- Stack -->
          <div class="projects__card-stack">
            <span
              v-for="tech in project.stack"
              :key="tech"
              class="tag-sm"
            >
              {{ tech }}
            </span>
          </div>

          <!-- Liens -->
          <div class="projects__card-links">
            <a
              v-if="project.link"
              :href="project.link"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn--primary projects__btn"
            >
              VOIR
            </a>
            <a
              v-if="project.github"
              :href="project.github"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn--outline projects__btn"
            >
              CODE
            </a>
          </div>

        </article>
      </div>

    </div>
  </section>
</template>

<style scoped>
.projects { background-color: color-mix(in srgb, var(--color-bg) 88%, transparent); }

/* ── Grille ─────────────────────────────────────────────── */
.projects__grid {
  display:               grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap:                   var(--spacing-lg);
}

/* ── Carte ──────────────────────────────────────────────── */
.projects__card {
  border:     var(--border-thick);
  padding:    var(--spacing-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-brutal);
  display:    flex;
  flex-direction: column;
  gap:        var(--spacing-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  position:   relative;
  overflow:   hidden;
}
.projects__card:hover {
  transform:  translate(-5px, -5px);
  box-shadow: 11px 11px 0px var(--color-accent-2);
}

/* ── Numéro décoratif ───────────────────────────────────── */
.projects__card-number {
  font-family:    var(--font-mono);
  font-size:      4rem;
  font-weight:    700;
  color:          color-mix(in srgb, var(--color-fg) 6%, transparent);
  position:       absolute;
  top:            -0.5rem;
  right:          0.5rem;
  line-height:    1;
  pointer-events: none;
  user-select:    none;
}

/* ── Titre ──────────────────────────────────────────────── */
.projects__card-title {
  font-family:    var(--font-display);
  font-size:      var(--text-xl);
  font-weight:    700;
  text-transform: uppercase;
  color:          var(--color-accent-3);
}

/* ── Description ────────────────────────────────────────── */
.projects__card-desc {
  font-size:   var(--text-base);
  color:       color-mix(in srgb, var(--color-fg) 75%, transparent);
  line-height: 1.65;
  flex:        1;
}

/* ── Stack ──────────────────────────────────────────────── */
.projects__card-stack {
  display:   flex;
  flex-wrap: wrap;
  gap:       0.4rem;
}

/* ── Liens ──────────────────────────────────────────────── */
.projects__card-links {
  display:    flex;
  gap:        0.75rem;
  margin-top: auto;
  padding-top: var(--spacing-sm);
}

.projects__btn {
  font-size: 0.68rem;
  padding:   0.5rem 1.1rem;
}

/* ── Décors parallax ────────────────────────────────────── */
.projects__bg-grid {
  position: absolute;
  inset:    0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--color-accent-3) 5%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--color-accent-3) 5%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
}

.projects__deco-line {
  position: absolute;
  top:      50%;
  left:     0;
  right:    0;
  height:   1px;
  background: linear-gradient(90deg, transparent, var(--color-accent-2) 30%, transparent);
  opacity:  0.2;
}
</style>
