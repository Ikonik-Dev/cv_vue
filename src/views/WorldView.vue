<script setup>
/**
 * WorldView.vue — Scène monde Three.js (Phase 2 : 3D wireframe)
 * ─────────────────────────────────────────────────────────────
 * Structure :
 *   ┌────────── world-header ──────────────────────────────────┐
 *   │  ← RETOUR   WORLD / ● ● ●    CLIC SUR L'ÎLE · ESC RETOUR│
 *   ├────────── world-canvas (THREE.js, flex:1) ───────────────┤
 *   │  3 îlots wireframe flottants / océan / particules        │
 *   ├────────── world-panel ───────────────────────────────────┤
 *   │  Titre projet · desc · stack · lien                      │
 *   └──────────────────────────────────────────────────────────┘
 *
 * IslandScene gère : RAF, géométries, caméra GSAP, raycaster.
 * Vue gère : cycle de vie, HTML overlay, transitions GSAP.
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { projects } from '@/data/cv.js'
import { IslandScene } from '@/three/IslandScene.js'
import {
  startReveal,
  triggerProjectExit,
} from '@/composables/useProjectTransition.js'

// ── Route ────────────────────────────────────────────────────
const route         = useRoute()
const activeIndex   = ref(Number(route.query.idx ?? 0))
const activeProject = computed(() => projects[activeIndex.value])

// ── Refs DOM ─────────────────────────────────────────────────
const viewRef   = ref(null)
const canvasRef = ref(null)
const panelRef  = ref(null)

// ── Three.js ─────────────────────────────────────────────────
let scene = null

// ── Accents par projet ────────────────────────────────────────
const ACCENTS = ['#00ffe7', '#ff2d78', '#b8ff35']
const accent  = computed(() => ACCENTS[activeIndex.value] ?? ACCENTS[0])
// ── État contrôle bateau ──────────────────────────────────────
const boatControlled = ref(false)
function onBoatControlChange(controlled) {
  boatControlled.value = controlled
}
// ── Callback : clic sur une île dans la scène 3D ──────────────
function onIslandClick(index) {
  if (index === activeIndex.value) return
  animatePanelChange(index)
}

function animatePanelChange(index) {
  gsap.to(panelRef.value, {
    y: 18, opacity: 0, duration: 0.18, ease: 'power1.in',
    onComplete() {
      activeIndex.value = index
      gsap.fromTo(panelRef.value,
        { y: 28, opacity: 0 },
        { y: 0,  opacity: 1, duration: 0.32, ease: 'power2.out' }
      )
    },
  })
}

// ── Mount ─────────────────────────────────────────────────────
onMounted(async () => {
  // Attente du rendu DOM pour que le canvas ait ses dimensions
  await nextTick()

  // Fade-in de la vue (opacity démarre à 0 via CSS)
  gsap.to(viewRef.value, { opacity: 1, duration: 0.3, delay: 0.05, ease: 'power1.out' })

  // Demande à l'overlay de transition de se retirer
  setTimeout(startReveal, 120)

  // Création de la scène Three.js
  scene = new IslandScene(canvasRef.value, activeIndex.value, onIslandClick, handleBack, onBoatControlChange)

  // Panneau info slide-in
  gsap.fromTo(panelRef.value,
    { y: 55, opacity: 0 },
    { y: 0,  opacity: 1, duration: 0.5, delay: 0.55, ease: 'power2.out' }
  )
})

// ── Unmount ───────────────────────────────────────────────────
onUnmounted(() => {
  scene?.dispose()
  scene = null
})

// ── Navigation header dots ─────────────────────────────────────
function selectIsland(index) {
  if (index === activeIndex.value) return
  scene?.flyTo(index)
  animatePanelChange(index)
}

// ── Retour CV ──────────────────────────────────────────────────
function handleBack() {
  // Zoom arrière caméra Three.js puis lancement de la transition overlay
  scene?.flyToOverview(() => {
    gsap.to(viewRef.value, { opacity: 0, duration: 0.18, ease: 'power1.in' })
    setTimeout(triggerProjectExit, 160)
  })
}

// ── Clavier ───────────────────────────────────────────────────
function handleKeydown(e) {  // En mode bateau : ESC relâche, les flèches sont consommées par IslandScene
  if (scene?.boatControlled) {
    if (e.key === 'Escape') scene.releaseBoatControl()
    return
  }  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    const next = (activeIndex.value + 1) % projects.length
    scene?.flyTo(next)
    animatePanelChange(next)
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    const prev = (activeIndex.value - 1 + projects.length) % projects.length
    scene?.flyTo(prev)
    animatePanelChange(prev)
  }
  if (e.key === 'Escape') handleBack()
}

onMounted(()   => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div
    ref="viewRef"
    class="world-view"
    :style="{ '--accent': accent }"
  >

    <!-- ── Header ──────────────────────────────────────────── -->
    <header class="world-header">
      <button
        class="world-back-btn"
        @click="handleBack"
        aria-label="Retourner au CV"
      >
        <span class="world-back-btn__arrow">←</span>
        <span>RETOUR CV</span>
      </button>

      <div class="world-header__center">
        <span class="world-header__label">WORLD</span>
        <span class="world-header__sep">/</span>
        <button
          v-for="(_, i) in projects"
          :key="i"
          class="world-header__dot"
          :class="{ 'world-header__dot--active': i === activeIndex }"
          @click="selectIsland(i)"
          :aria-label="`Île projet ${i + 1}`"
          :aria-current="i === activeIndex ? 'true' : undefined"
        />
      </div>

      <div class="world-header__hint" aria-hidden="true">
        <template v-if="boatControlled">
          ↑3 AVANCER &nbsp;·&nbsp; ←→ TOURNER &nbsp;·&nbsp; ESC RELÂCHER
        </template>
        <template v-else>
          CLIC SUR L'ÎLES &nbsp;·&nbsp; ←→ &nbsp;·&nbsp; SCROLL ↓ RETOUR
        </template>
      </div>
    </header>

    <!-- ── Canvas Three.js ─────────────────────────────────── -->
    <canvas
      ref="canvasRef"
      class="world-canvas"
      aria-label="Scène 3D des projets"
      role="img"
    />

    <!-- ── Panneau info projet ─────────────────────────────── -->
    <div ref="panelRef" class="world-panel" aria-live="polite">
      <div class="world-panel__inner">

        <div class="world-panel__header">
          <span class="world-panel__num">{{ activeProject.num }}</span>
          <h1 class="world-panel__title">{{ activeProject.title }}</h1>
        </div>

        <p class="world-panel__desc">{{ activeProject.desc }}</p>

        <div class="world-panel__stack">
          <span
            v-for="tech in activeProject.stack"
            :key="tech"
            class="world-panel__tag"
          >{{ tech }}</span>
        </div>

        <div class="world-panel__actions">
          <a
            v-if="activeProject.link && activeProject.link !== '#'"
            :href="activeProject.link"
            target="_blank"
            rel="noopener noreferrer"
            class="world-panel__btn"
          >{{ activeProject.label ?? '→ VOIR' }}</a>
        </div>

      </div>
    </div>

  </div>
</template>


<style scoped>
/* ─── Conteneur racine ─────────────────────────────────── */
.world-view {
  position:       fixed;
  inset:          0;
  display:        flex;
  flex-direction: column;
  background:     #070707;
  opacity:        0;          /* GSAP fade-in au mount */
  z-index:        100;
  overflow:       hidden;
  font-family:    'IBM Plex Mono', 'Courier New', monospace;
  color:          #f0ece0;
}

/* ─── Header ───────────────────────────────────────────── */
.world-header {
  flex-shrink:     0;
  position:        relative;
  z-index:         10;
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  padding:         0.85rem 1.5rem;
  border-bottom:   1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  background:      rgba(7, 7, 7, 0.85);
  backdrop-filter: blur(4px);
}

.world-back-btn {
  display:        flex;
  align-items:    center;
  gap:            0.5rem;
  background:     transparent;
  border:         1px solid var(--accent);
  color:          var(--accent);
  padding:        0.4rem 1rem;
  font-family:    inherit;
  font-size:      0.65rem;
  letter-spacing: 0.18em;
  cursor:         pointer;
  transition:     background 0.2s, box-shadow 0.2s;
}
.world-back-btn:hover {
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  box-shadow: 0 0 14px var(--accent);
}
.world-back-btn__arrow { font-size: 1rem; }

.world-header__center {
  display:     flex;
  align-items: center;
  gap:         0.55rem;
}
.world-header__label {
  font-size:      0.6rem;
  letter-spacing: 0.4em;
  color:          var(--accent);
  opacity:        0.5;
  text-transform: uppercase;
}
.world-header__sep {
  opacity: 0.25;
  color:   var(--accent);
}
.world-header__dot {
  width:         8px;
  height:        8px;
  border-radius: 50%;
  background:    color-mix(in srgb, var(--accent) 25%, #222);
  border:        1px solid color-mix(in srgb, var(--accent) 35%, transparent);
  cursor:        pointer;
  transition:    background 0.25s, box-shadow 0.25s;
  padding:       0;
}
.world-header__dot--active {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}
.world-header__hint {
  font-size:      0.52rem;
  letter-spacing: 0.14em;
  opacity:        0.2;
  text-transform: uppercase;
}

/* ─── Canvas Three.js ──────────────────────────────────── */
.world-canvas {
  flex:       1;
  min-height: 0;     /* indispensable en flexbox colonne */
  width:      100%;
  display:    block;
}

/* ─── Panneau info ─────────────────────────────────────── */
.world-panel {
  flex-shrink: 0;
  position:    relative;
  z-index:     10;
  border-top:  1px solid color-mix(in srgb, var(--accent) 18%, transparent);
  padding:     1rem 1.5rem 1.25rem;
  background:  linear-gradient(to top, rgba(7,7,7,0.98) 75%, transparent);
  backdrop-filter: blur(6px);
}
.world-panel__inner {
  max-width: 760px;
  margin:    0 auto;
}
.world-panel__header {
  display:       flex;
  align-items:   baseline;
  gap:           0.9rem;
  margin-bottom: 0.4rem;
}
.world-panel__num {
  font-size:      0.6rem;
  letter-spacing: 0.3em;
  color:          var(--accent);
  opacity:        0.5;
}
.world-panel__title {
  font-size:      clamp(1rem, 3vw, 1.5rem);
  font-weight:    700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color:          var(--accent);
  text-shadow:    0 0 22px color-mix(in srgb, var(--accent) 45%, transparent);
  margin:         0;
  font-family:    'Space Grotesk', 'Arial Black', sans-serif;
}
.world-panel__desc {
  font-size:   clamp(0.68rem, 1.2vw, 0.82rem);
  line-height: 1.6;
  color:       rgba(240, 236, 224, 0.68);
  margin:      0 0 0.6rem;
}
.world-panel__stack {
  display:       flex;
  flex-wrap:     wrap;
  gap:           0.35rem;
  margin-bottom: 0.65rem;
}
.world-panel__tag {
  font-size:      0.56rem;
  padding:        0.18rem 0.55rem;
  border:         1px solid color-mix(in srgb, var(--accent) 32%, transparent);
  color:          color-mix(in srgb, var(--accent) 80%, #f0ece0);
  background:     color-mix(in srgb, var(--accent) 6%, transparent);
  letter-spacing: 0.1em;
}
.world-panel__actions { display: flex; gap: 0.75rem; }
.world-panel__btn {
  font-size:       0.62rem;
  padding:         0.4rem 1rem;
  border:          1px solid var(--accent);
  color:           var(--accent);
  text-decoration: none;
  letter-spacing:  0.14em;
  text-transform:  uppercase;
  font-family:     inherit;
  transition:      background 0.2s, box-shadow 0.2s;
}
.world-panel__btn:hover {
  background:  color-mix(in srgb, var(--accent) 14%, transparent);
  box-shadow:  0 0 12px var(--accent);
}
</style>

