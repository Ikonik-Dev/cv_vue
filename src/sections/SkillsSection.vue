<script setup>
/**
 * SkillsSection.vue — Section Compétences
 * ─────────────────────────────────────────
 * - Catégories de compétences depuis cv.js
 * - Tags avec délai staggeré (CSS var --i)
 * - Variant de couleur via :class="'tag--' + category.variant"
 * - useReveal par catégorie
 */
import { ref }       from 'vue'
import { useReveal } from '@/composables/useReveal.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /**
   * Tableau de catégories de compétences depuis cv.js.
   * Structure : [{ name: string, variant: 'primary'|'accent2'|'accent3', items: string[] }]
   */
  skills: { type: Array, required: true },
})

// ── Reveal sur le header de section ───────────────────────────
const headerRef = ref(null)
useReveal(headerRef)
</script>

<template>
  <section id="skills" class="section skills">
    <div class="container">

      <h2 ref="headerRef" class="section__title reveal">COMPÉTENCES</h2>

      <!-- Grille de catégories -->
      <div class="skills__grid">

        <div
          v-for="category in skills"
          :key="category.name"
          class="skills__category"
        >
          <!-- Nom de la catégorie -->
          <h3 class="skills__cat-name">{{ category.name }}</h3>

          <!-- Tags de compétences (visible = classe ajoutée par parent au scroll) -->
          <!--
            La classe .visible est ajoutée sur .skills__tags via IntersectionObserver
            intégré directement ici avec un v-intersection-observer custom.
            Pour simplifier, on ajoute .visible via le parent (.skills__category).
            Les transitions sont définies dans global.css (.tag).
          -->
          <div class="skills__tags visible">
            <span
              v-for="(item, index) in category.items"
              :key="item"
              class="tag"
              :class="`tag--${category.variant}`"
              :style="{ '--i': index }"
            >
              {{ item }}
            </span>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
.skills { background-color: var(--color-bg); }

/* ── Grille de catégories ──────────────────────────────── */
.skills__grid {
  display:               grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap:                   var(--spacing-lg);
}

/* ── Carte de catégorie ────────────────────────────────── */
.skills__category {
  border:     var(--border-thick);
  padding:    var(--spacing-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-brutal);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.skills__category:hover {
  transform:  translate(-4px, -4px);
  box-shadow: 10px 10px 0px var(--color-accent-1);
}

/* ── Titre catégorie ───────────────────────────────────── */
.skills__cat-name {
  font-family:    var(--font-mono);
  font-size:      var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color:          color-mix(in srgb, var(--color-fg) 60%, transparent);
  margin-bottom:  var(--spacing-sm);
  padding-bottom: 0.5rem;
  border-bottom:  1px solid color-mix(in srgb, var(--color-fg) 20%, transparent);
}

/* ── Conteneur de tags ─────────────────────────────────── */
.skills__tags {
  display:   flex;
  flex-wrap: wrap;
  gap:       0.5rem;
}
</style>
