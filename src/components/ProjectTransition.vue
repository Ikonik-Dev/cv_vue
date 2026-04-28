<script setup>
/**
 * ProjectTransition.vue — Overlay de transition cinématique
 * ──────────────────────────────────────────────────────────
 * Rendu via <Teleport to="body"> dans App.vue.
 *
 * Phases gérées :
 *   entering  → zoom de la carte source vers plein écran
 *   covering  → attente (WorldView se monte)
 *   revealing → fade-out pour révéler WorldView derrière
 *   exiting   → fade-in plein écran → retour au CV
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import {
  transitionState,
  startReveal,
  resetTransition,
} from '@/composables/useProjectTransition.js'

const router     = useRouter()
const overlayRef = ref(null)

// Une couleur accent différente par projet (cohérent avec les accents du CV)
const ACCENTS = ['#00ffe7', '#ff2d78', '#b8ff35']
const accent  = computed(() =>
  ACCENTS[transitionState.projectIndex] ?? ACCENTS[0]
)

// ── Machine de phases ──────────────────────────────────────
watch(
  () => transitionState.phase,
  async (phase) => {

    // ── ENTER : la carte zoome vers plein écran ────────────
    if (phase === 'entering') {
      await nextTick()
      const el   = overlayRef.value
      const rect = transitionState.sourceRect
      if (!el || !rect) return

      // Positionnement initial sur la carte source
      gsap.set(el, {
        left:    rect.left,
        top:     rect.top,
        width:   rect.width,
        height:  rect.height,
        opacity: 1,
        display: 'block',
      })

      // Expansion vers plein écran
      gsap.to(el, {
        left:     0,
        top:      0,
        width:    '100vw',
        height:   '100vh',
        duration: 0.72,
        ease:     'power3.inOut',
        onComplete() {
          transitionState.phase = 'covering'
          router.push({ name: 'world', query: { idx: transitionState.projectIndex } })
        },
      })
    }

    // ── REVEALING : l'overlay se retire pour laisser place ─
    if (phase === 'revealing') {
      const el = overlayRef.value
      if (!el) return

      gsap.to(el, {
        opacity:  0,
        duration: 0.45,
        ease:     'power2.out',
        onComplete: resetTransition,
      })
    }

    // ── EXITING : flash → fade → retour home ──────────────
    if (phase === 'exiting') {
      await nextTick()
      const el = overlayRef.value
      if (!el) return

      // Plein écran immédiat opaque
      gsap.set(el, {
        left:    0,
        top:     0,
        width:   '100vw',
        height:  '100vh',
        opacity: 1,
        display: 'block',
      })

      // Court délai → navigation → contraction vers centre
      await new Promise(r => setTimeout(r, 80))
      router.push({ name: 'home', hash: '#projects' })

      gsap.to(el, {
        left:     '50vw',
        top:      '50vh',
        width:    0,
        height:   0,
        opacity:  0,
        duration: 0.55,
        ease:     'power3.in',
        delay:    0.15,
        onComplete: resetTransition,
      })
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="transitionState.active"
      ref="overlayRef"
      class="pt-overlay"
      :style="{ '--pt-accent': accent }"
    >
      <!-- Grille cyberpunk -->
      <div class="pt-grid" aria-hidden="true" />

      <!-- Ligne de scan animée -->
      <div class="pt-scan" aria-hidden="true" />

      <!-- Coins décoratifs -->
      <span class="pt-corner pt-corner--tl" aria-hidden="true" />
      <span class="pt-corner pt-corner--tr" aria-hidden="true" />
      <span class="pt-corner pt-corner--bl" aria-hidden="true" />
      <span class="pt-corner pt-corner--br" aria-hidden="true" />

      <!-- Label projet centré -->
      <div class="pt-label" aria-hidden="true">
        <span class="pt-label__num">{{ transitionState.project?.num ?? '—' }}</span>
        <span class="pt-label__title">{{ transitionState.project?.title }}</span>
        <span class="pt-label__loading">LOADING WORLD…</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ─── Overlay principal ─────────────────────────────────── */
.pt-overlay {
  position:   fixed;
  z-index:    9999;
  background: #090909;
  border:     2px solid var(--pt-accent);
  box-shadow: 0 0 40px var(--pt-accent), inset 0 0 80px rgba(0, 0, 0, 0.9);
  overflow:   hidden;
  /* GSAP gère position + taille via style inline */
}

/* ─── Grille de fond ────────────────────────────────────── */
.pt-grid {
  position:         absolute;
  inset:            0;
  background-image:
    linear-gradient(to right, var(--pt-accent) 1px, transparent 1px),
    linear-gradient(to bottom, var(--pt-accent) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity:         0.06;
}

/* ─── Ligne de scan ─────────────────────────────────────── */
.pt-scan {
  position:   absolute;
  left:        0;
  right:       0;
  height:      2px;
  background: linear-gradient(to right, transparent, var(--pt-accent), transparent);
  animation:  pt-scan-move 1.2s linear infinite;
  opacity:    0.55;
}
@keyframes pt-scan-move {
  from { top: -2px; }
  to   { top: 100%;  }
}

/* ─── Coins ─────────────────────────────────────────────── */
.pt-corner {
  position:    absolute;
  width:       16px;
  height:      16px;
  border-color: var(--pt-accent);
  border-style: solid;
  opacity:     0.8;
}
.pt-corner--tl { top: 8px;  left: 8px;  border-width: 2px 0 0 2px; }
.pt-corner--tr { top: 8px;  right: 8px; border-width: 2px 2px 0 0; }
.pt-corner--bl { bottom: 8px; left: 8px;  border-width: 0 0 2px 2px; }
.pt-corner--br { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; }

/* ─── Label centré ──────────────────────────────────────── */
.pt-label {
  position:       absolute;
  inset:          0;
  display:        flex;
  flex-direction: column;
  align-items:    center;
  justify-content: center;
  font-family:    'IBM Plex Mono', 'Courier New', monospace;
  color:          var(--pt-accent);
  gap:            0.4rem;
  pointer-events: none;
}
.pt-label__num {
  font-size:      0.68rem;
  letter-spacing: 0.35em;
  opacity:        0.5;
  text-transform: uppercase;
}
.pt-label__title {
  font-size:      clamp(1.1rem, 4vw, 2.8rem);
  font-weight:    700;
  text-align:     center;
  text-transform: uppercase;
  text-shadow:    0 0 24px var(--pt-accent);
  letter-spacing: 0.06em;
}
.pt-label__loading {
  font-size:      0.6rem;
  letter-spacing: 0.4em;
  opacity:        0.35;
  margin-top:     1rem;
  animation:      pt-blink 1.1s step-end infinite;
}
@keyframes pt-blink {
  0%, 100% { opacity: 0.35; }
  50%       { opacity: 0;    }
}
</style>
