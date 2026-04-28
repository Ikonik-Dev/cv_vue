<script setup>
/**
 * HomeView.vue — Vue principale (unique route /)
 * ────────────────────────────────────────────────
 * Chef d'orchestre de l'application :
 *
 * 1. Importe toutes les données (cv.js)
 * 2. Initialise le contrôleur parallax et le fournit aux composants
 * 3. Lance la boucle RAF unifiée :
 *    - tickScroll()       → smooth scroll lerp
 *    - computeTargets()   → calcul positions parallax cibles
 *    - applyLerp()        → interpolation + écriture DOM parallax
 *    - updateProgress()   → mise à jour barre de progression
 * 4. Transmet scrollPct à App.vue via emit (ou prop remonté)
 * 5. Passe les données en props à chaque section
 *
 * BOUCLE RAF :
 *   La boucle tourne en continu avec requestAnimationFrame.
 *   scheduleRaf() est appelée à chaque frame, elle rappelle
 *   systématiquement la prochaine frame pour maintenir une
 *   animation fluide (parallax + scroll).
 */

import { ref, provide, onMounted, onUnmounted } from 'vue'

// ── Composants de sections ─────────────────────────────────────
import HeroSection       from '@/sections/HeroSection.vue'
import AboutSection      from '@/sections/AboutSection.vue'
import SkillsSection     from '@/sections/SkillsSection.vue'
import ExperienceSection from '@/sections/ExperienceSection.vue'
import ProjectsSection   from '@/sections/ProjectsSection.vue'
import EducationSection  from '@/sections/EducationSection.vue'
import ContactSection    from '@/sections/ContactSection.vue'

// ── Données CV ────────────────────────────────────────────────
import {
  person,
  stats,
  skills,
  experiences,
  projects,
  education,
} from '@/data/cv.js'

// ── Composables ───────────────────────────────────────────────
import { useParallaxController }  from '@/composables/useParallax.js'
import { useSmoothScroll }        from '@/composables/useSmoothScroll.js'
import { useScrollProgress }      from '@/composables/useScrollProgress.js'

// ── Props reçus de App.vue ─────────────────────────────────────
// (aucun pour l'instant — App.vue injecte directement ScrollProgress)

// ── Émissions vers App.vue ─────────────────────────────────────
const emit = defineEmits([
  /**
   * scrollPct : pourcentage scroll 0–100
   * Reçu par App.vue → transmis à ScrollProgress.vue
   */
  'update:scrollPct',
])

// ── Contrôleur parallax ───────────────────────────────────────
const {
  registerLayer,
  unregisterLayer,
  computeTargets,
  applyLerp,
} = useParallaxController()

/**
 * Fournit registerLayer et unregisterLayer aux composants descendants.
 * Utilisé par ParallaxLayer.vue (inject).
 */
provide('registerLayer',   registerLayer)
provide('unregisterLayer', unregisterLayer)

// ── Scroll lerp ───────────────────────────────────────────────
const { tickScroll } = useSmoothScroll()

// ── Barre de progression ──────────────────────────────────────
const { scrollPct, updateProgress } = useScrollProgress()

// ── Boucle RAF unifiée ────────────────────────────────────────
let rafId = null

/**
 * rafLoop()
 * Exécutée à chaque frame. Orchestre :
 *   1. Scroll lerp
 *   2. Cibles parallax
 *   3. Interpolation parallax
 *   4. Progression de scroll
 */
function rafLoop() {
  tickScroll()
  computeTargets()
  applyLerp()
  updateProgress()

  // Remonte scrollPct à App.vue pour ScrollProgress.vue
  emit('update:scrollPct', scrollPct.value)

  // Planifie la frame suivante
  rafId = requestAnimationFrame(rafLoop)
}

onMounted(() => {
  // Lance la boucle infinie
  rafId = requestAnimationFrame(rafLoop)

  // Intercepte les clics sur les boutons CTA (.js-smooth) du hero
  // Les liens de nav sont gérés dans NavBar.vue
  document.querySelectorAll('.js-smooth[href^="#"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault()
      const id     = el.getAttribute('href').replace('#', '')
      const target = document.getElementById(id)
      if (!target) return

      const { smoothScrollTo } = useSmoothScroll()
      const navH  = 72
      const destY = target.getBoundingClientRect().top + window.scrollY - navH
      smoothScrollTo(destY)
    })
  })
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <!-- HomeView est le wrapper de toutes les sections -->
  <main>
    <HeroSection       :person="person"      :stats="stats"       />
    <AboutSection      :person="person"                           />
    <SkillsSection     :skills="skills"                           />
    <ExperienceSection :experiences="experiences"                 />
    <ProjectsSection   :projects="projects"                       />
    <EducationSection  :education="education"                     />
    <ContactSection    :person="person"                           />
  </main>
</template>
