<script setup>
/**
 * NavBar.vue — Barre de navigation fixe
 * ──────────────────────────────────────
 * - Liens générés depuis cv.js (prop navLinks)
 * - Scroll doux via useSmoothScroll
 * - Ombre portée apparaît après 20px de scroll
 * - Mise en surbrillance du lien actif via IntersectionObserver
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { useSmoothScroll }             from '@/composables/useSmoothScroll.js'

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  /** Tableau de liens de navigation, issu de cv.js (navLinks) */
  navLinks: {
    type:     Array,
    required: true,
    // Attendu : [{ label: 'À PROPOS', href: '#about' }, ...]
  },
})

// ── État local ─────────────────────────────────────────────────

/** ID de la section active (sans #), utilisé pour la classe .active */
const activeId = ref('')

/** Ombre activée quand scrollY > 20px */
const elevated = ref(false)

// ── Composable scroll doux ─────────────────────────────────────
const { smoothScrollTo } = useSmoothScroll()

/**
 * handleNavClick(event, href)
 * Intercèpte le clic sur un lien d'ancre et déclenche
 * le scroll lerp JS à la place du comportement natif.
 *
 * @param {MouseEvent} event - Événement clic
 * @param {string}     href  - Ancre cible, ex. '#about'
 */
function handleNavClick(event, href) {
  event.preventDefault()

  const id = href.replace('#', '')
  const target = document.getElementById(id)
  if (!target) return

  // Décale la destination sous la nav fixe (~72px)
  const navHeight = 72
  const targetY   = target.getBoundingClientRect().top + window.scrollY - navHeight

  smoothScrollTo(targetY)
}

// ── Observer pour l'ombre de la nav ───────────────────────────
function onScroll() {
  elevated.value = window.scrollY > 20
}

// ── IntersectionObserver pour le lien actif ───────────────────
let sectionObserver = null

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })

  // Observe toutes les sections référencées dans navLinks
  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeId.value = entry.target.id
      }
    })
  }, {
    // Déclenche quand la section occupe 30% du viewport
    rootMargin: '-30% 0px -60% 0px',
    threshold:  0,
  })

  props.navLinks.forEach(link => {
    const id = link.href.replace('#', '')
    const el = document.getElementById(id)
    if (el) sectionObserver.observe(el)
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  sectionObserver?.disconnect()
})
</script>

<template>
  <!-- nav.nav : aria-label pour l'accessibilité -->
  <nav
    class="nav"
    :class="{ 'nav--elevated': elevated }"
    aria-label="Navigation principale"
  >
    <div class="nav__inner">

      <!-- Logo / Initiales -->
      <a href="#hero" class="nav__logo" @click="handleNavClick($event, '#hero')">
        <span class="nav__logo-initials">DSV</span>
        <span class="nav__logo-sep">/</span>
        <span class="nav__logo-title">DEV</span>
      </a>

      <!-- Liens de navigation -->
      <ul class="nav__links" role="list">
        <li
          v-for="link in navLinks"
          :key="link.href"
        >
          <a
            :href="link.href"
            class="nav__link"
            :class="{ 'nav__link--active': activeId === link.href.replace('#', '') }"
            @click="handleNavClick($event, link.href)"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>

    </div>
  </nav>
</template>

<style scoped>
/* ── Barre de navigation ──────────────────────────────────── */
.nav {
  position:         fixed;
  top:              0;
  left:             0;
  right:            0;
  z-index:          var(--z-nav);
  background-color: var(--color-bg);
  border-bottom:    2px solid var(--color-fg);
  transition:       box-shadow var(--transition-fast);
}

/* Ombre portée quand on a scrollé */
.nav--elevated {
  box-shadow: 0 4px 0px var(--color-accent-1);
}

/* Conteneur interne flex */
.nav__inner {
  max-width: 1100px;
  margin:    0 auto;
  padding:   0 var(--spacing-md);
  height:    72px;
  display:   flex;
  align-items:     center;
  justify-content: space-between;
}

/* ── Logo ──────────────────────────────────────────────── */
.nav__logo {
  display:     flex;
  align-items: center;
  gap:         0.4rem;
  font-family: var(--font-mono);
  font-size:   var(--text-sm);
  color:       var(--color-fg);
  text-decoration: none;
  letter-spacing: 0.06em;
}
.nav__logo:hover { color: var(--color-fg); }

.nav__logo-initials {
  font-size:   var(--text-base);
  font-weight: 700;
  color:       var(--color-accent-1);
}

.nav__logo-sep {
  color:   var(--color-accent-2);
  margin:  0 0.1rem;
}

.nav__logo-title {
  font-weight: 700;
  text-transform: uppercase;
}

/* ── Liens ─────────────────────────────────────────────── */
.nav__links {
  display:  flex;
  gap:      var(--spacing-md);
  list-style: none;
  margin:   0;
  padding:  0;
}

.nav__link {
  font-family:    var(--font-mono);
  font-size:      0.72rem;
  font-weight:    600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color:          var(--color-fg);
  text-decoration: none;
  padding-bottom:  2px;
  border-bottom:   2px solid transparent;
  transition:
    color        var(--transition-fast),
    border-color var(--transition-fast);
}

.nav__link:hover,
.nav__link--active {
  color:        var(--color-accent-1);
  border-color: var(--color-accent-1);
}

/* ── Responsive : masque les liens sur petit écran ─────── */
@media (max-width: 768px) {
  .nav__links { display: none; }
}
</style>
