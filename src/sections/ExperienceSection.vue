<script setup>
/**
 * ExperienceSection.vue — Section Expérience professionnelle
 * ────────────────────────────────────────────────────────────
 * - Timeline verticale avec marqueurs et cartes
 * - Tags de stack technologique
 * - useReveal sur chaque carte (décalé)
 */
import { ref }       from 'vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /**
   * Tableau d'expériences depuis cv.js.
   * Structure : [{ company, role, period, location, desc, stack: string[] }]
   */
  experiences: { type: Array, required: true },
})

// ── Reveal sur le header de section ───────────────────────────
const headerRef = ref(null)
useReveal(headerRef)
</script>

<template>
  <section id="experience" class="section experience">
    <div class="container">

      <h2 ref="headerRef" class="section__title reveal">EXPÉRIENCE</h2>

      <!-- Timeline -->
      <ol class="experience__timeline" role="list">
        <li
          v-for="(exp, index) in experiences"
          :key="exp.company + exp.period"
          class="experience__item"
          :style="{ '--item-index': index }"
        >
          <!-- Marqueur de la timeline -->
          <div class="experience__marker" aria-hidden="true">
            <span class="experience__marker-dot" />
            <span class="experience__marker-line" />
          </div>

          <!-- Carte d'expérience -->
          <div class="experience__card">

            <!-- En-tête : période + localisation -->
            <div class="experience__meta">
              <span class="experience__period">{{ exp.period }}</span>
              <span class="experience__location">{{ exp.location }}</span>
            </div>

            <!-- Rôle + entreprise -->
            <h3 class="experience__role">{{ exp.role }}</h3>
            <p class="experience__company">{{ exp.company }}</p>

            <!-- Description -->
            <p class="experience__desc">{{ exp.desc }}</p>

            <!-- Stack technologique -->
            <div class="experience__stack">
              <span
                v-for="tech in exp.stack"
                :key="tech"
                class="tag-sm"
              >
                {{ tech }}
              </span>
            </div>

          </div>
        </li>
      </ol>

    </div>
  </section>
</template>

<style scoped>
.experience { background-color: var(--color-surface); }

/* ── Timeline container ────────────────────────────────── */
.experience__timeline {
  position:    relative;
  list-style:  none;
  margin:      0;
  padding:     0;
}

/* ── Item ──────────────────────────────────────────────── */
.experience__item {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap:     var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  /* Animation d'entrée décalée selon l'index */
  opacity:   0;
  transform: translateY(30px);
  transition:
    opacity   var(--transition-slow),
    transform var(--transition-slow);
  transition-delay: calc(var(--item-index, 0) * 120ms + 200ms);
}

/* Classe .visible ajoutée depuis HomeView via IntersectionObserver parent */
.experience__timeline .experience__item.visible,
.experience:has(.section__title.visible) .experience__item {
  opacity:   1;
  transform: translateY(0);
}

/* ── Marqueur ──────────────────────────────────────────── */
.experience__marker {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  padding-top:    4px;
}

.experience__marker-dot {
  width:         12px;
  height:        12px;
  border:        2px solid var(--color-accent-1);
  background:    var(--color-bg);
  flex-shrink:   0;
  position:      relative;
  z-index:       1;
}

.experience__marker-line {
  flex:       1;
  width:      1px;
  background: color-mix(in srgb, var(--color-accent-1) 30%, transparent);
  margin-top: 4px;
}

/* Cache la ligne sur le dernier item */
.experience__item:last-child .experience__marker-line { display: none; }

/* ── Carte ─────────────────────────────────────────────── */
.experience__card {
  border:     var(--border-thick);
  padding:    var(--spacing-md);
  background: var(--color-bg);
  box-shadow: var(--shadow-brutal);
  margin-bottom: var(--spacing-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.experience__card:hover {
  transform:  translate(-3px, -3px);
  box-shadow: 9px 9px 0px var(--color-accent-1);
}

/* ── Meta ──────────────────────────────────────────────── */
.experience__meta {
  display:       flex;
  gap:           var(--spacing-sm);
  align-items:   center;
  margin-bottom: 0.4rem;
}

.experience__period,
.experience__location {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.experience__period   { color: var(--color-accent-2); }
.experience__location {
  color: color-mix(in srgb, var(--color-fg) 50%, transparent);
  padding-left: var(--spacing-sm);
  border-left:  1px solid color-mix(in srgb, var(--color-fg) 20%, transparent);
}

/* ── Rôle & entreprise ─────────────────────────────────── */
.experience__role {
  font-family:    var(--font-display);
  font-size:      var(--text-xl);
  font-weight:    700;
  text-transform: uppercase;
  margin-bottom:  0.2rem;
}

.experience__company {
  font-family:   var(--font-mono);
  font-size:     var(--text-sm);
  color:         var(--color-accent-1);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── Description ───────────────────────────────────────── */
.experience__desc {
  font-size:     var(--text-base);
  color:         color-mix(in srgb, var(--color-fg) 75%, transparent);
  margin-bottom: var(--spacing-sm);
  line-height:   1.65;
}

/* ── Stack ─────────────────────────────────────────────── */
.experience__stack {
  display:   flex;
  flex-wrap: wrap;
  gap:       0.4rem;
}
</style>
