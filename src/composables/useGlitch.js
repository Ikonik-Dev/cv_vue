// src/composables/useGlitch.js — Glitch effect piloté par JS
// ──────────────────────────────────────────────────────────────
// Principe :
//   Les pseudo-éléments ::before/::after de .glitch consomment
//   des CSS custom properties (--gx1, --gt1, etc.) définies sur
//   l'élément hôte via el.style.setProperty().
//   Un scheduler aléatoire déclenche des "bursts" (rafales de frames)
//   à intervalles irréguliers — impossible à reproduire avec @keyframes.
//
// Usage :
//   useGlitch(containerRef)
//   containerRef : ref() pointant sur un élément DOM contenant
//                  un ou plusieurs .glitch

import { onMounted, onUnmounted } from "vue";

// ── Helpers ────────────────────────────────────────────────────
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// ── Reset : couches invisibles, pas de décalage ────────────────
function resetGlitch(el) {
  el.style.setProperty("--gx1", "0px");
  el.style.setProperty("--gy1", "0px");
  el.style.setProperty("--gs1", "0deg");
  el.style.setProperty("--gt1", "0%");
  el.style.setProperty("--gb1", "35%");
  el.style.setProperty("--go1", "0");

  el.style.setProperty("--gx2", "0px");
  el.style.setProperty("--gy2", "0px");
  el.style.setProperty("--gs2", "0deg");
  el.style.setProperty("--gt2", "65%");
  el.style.setProperty("--gb2", "100%");
  el.style.setProperty("--go2", "0");
}

// ── Un frame aléatoire : position, bande clip, skew, opacité ──
function applyGlitchFrame(el) {
  // Couche cyan (::before)
  el.style.setProperty("--gx1", `${rand(-14, 14).toFixed(1)}px`);
  el.style.setProperty("--gy1", `${rand(-4, 4).toFixed(1)}px`);
  el.style.setProperty("--gs1", `${rand(-3, 3).toFixed(1)}deg`);
  const t1 = rand(0, 60);
  el.style.setProperty("--gt1", `${t1.toFixed(1)}%`);
  el.style.setProperty(
    "--gb1",
    `${Math.min(t1 + rand(8, 42), 100).toFixed(1)}%`,
  );
  el.style.setProperty("--go1", `${rand(0.6, 1).toFixed(2)}`);

  // Couche hot pink (::after)
  el.style.setProperty("--gx2", `${rand(-12, 12).toFixed(1)}px`);
  el.style.setProperty("--gy2", `${rand(-4, 4).toFixed(1)}px`);
  el.style.setProperty("--gs2", `${rand(-2, 2).toFixed(1)}deg`);
  const t2 = rand(0, 60);
  el.style.setProperty("--gt2", `${t2.toFixed(1)}%`);
  el.style.setProperty(
    "--gb2",
    `${Math.min(t2 + rand(8, 42), 100).toFixed(1)}%`,
  );
  el.style.setProperty("--go2", `${rand(0.5, 0.9).toFixed(2)}`);
}

// ── Burst : rafale de N frames rapides ────────────────────────
async function runBurst(el, signal) {
  // 3 à 7 frames par burst
  const frameCount = Math.floor(rand(3, 8));

  for (let i = 0; i < frameCount; i++) {
    if (signal.cancelled) return;
    applyGlitchFrame(el);
    // Durée d'un frame : 20–80 ms (snap-like)
    await new Promise((r) => setTimeout(r, rand(20, 80)));
  }

  // Parfois on insère une micro-pause noire au milieu du burst
  if (Math.random() > 0.6 && !signal.cancelled) {
    resetGlitch(el);
    await new Promise((r) => setTimeout(r, rand(30, 120)));

    // Reburst court
    const frames2 = Math.floor(rand(1, 4));
    for (let i = 0; i < frames2; i++) {
      if (signal.cancelled) return;
      applyGlitchFrame(el);
      await new Promise((r) => setTimeout(r, rand(20, 60)));
    }
  }

  resetGlitch(el);
}

// ── Scheduler récursif par élément ────────────────────────────
function scheduleElement(el, signal) {
  // Délai avant le prochain burst : 300 ms – 2 000 ms
  // (fréquence élevée voulue → min court)
  const delay = rand(300, 2000);

  const tid = setTimeout(async () => {
    if (signal.cancelled) return;
    await runBurst(el, signal);
    scheduleElement(el, signal);
  }, delay);

  signal.tids.push(tid);
}

// ── Composable public ─────────────────────────────────────────
export function useGlitch(containerRef) {
  const signal = { cancelled: false, tids: [] };

  onMounted(() => {
    const container = containerRef?.value;
    if (!container) return;

    const els = container.querySelectorAll(".glitch");
    els.forEach((el, i) => {
      resetGlitch(el);
      // Décalage initial : évite que les deux noms glitchent en même temps
      const initialDelay = rand(200, 600) + i * rand(150, 400);
      const tid = setTimeout(() => scheduleElement(el, signal), initialDelay);
      signal.tids.push(tid);
    });
  });

  onUnmounted(() => {
    signal.cancelled = true;
    signal.tids.forEach(clearTimeout);
    signal.tids.length = 0;
  });
}
