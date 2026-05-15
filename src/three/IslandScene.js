// src/three/IslandScene.js
// ─────────────────────────────────────────────────────────────────
// Moteur Three.js de la scène "World" — Cyberpunk Wireframe
//
// Architecture :
//   • 3 îlots flottants (wireframe néon, chacun sa couleur accent)
//   • Plan océan animé (grille wireframe + scanner)
//   • Champ de particules en fond
//   • Caméra GSAP fly-to entre îlots
//   • Raycaster pour détection de clic sur les îlots
// ─────────────────────────────────────────────────────────────────

import * as THREE from "three";
import gsap from "gsap";

// ─── Constantes ──────────────────────────────────────────────────

const ACCENT_HEX = [0x00ffe7, 0xff2d78, 0xb8ff35];

// Échelles des îlots — tailles variées pour un rendu plus naturel
const ISLAND_SCALES = [4.0, 0.75, 1.25];

// Positions des îlots — disposition éparse dans le plan XZ (océan 220×220, ±110)
// y = 0.6 × scale — base du socle posée exactement au niveau de l'eau
const ISLAND_POSITIONS = [
  new THREE.Vector3(-65, 2.4,  -30), // Île 0 — loin à gauche  (scale 4.0, géante)
  new THREE.Vector3( 62, 0.45,  55), // Île 1 — loin à droite  (scale 0.75, petite)
  new THREE.Vector3( 30, 0.75, -70), // Île 2 — centre arrière (scale 1.25, moyenne)
];

// Positions caméra par îlot — adaptées aux nouvelles positions et tailles
const CAMERA_SLOTS = [
  { pos: new THREE.Vector3(-35, 55, 15),  target: new THREE.Vector3(-65, 20, -30) }, // île géante
  { pos: new THREE.Vector3( 68, 10, 85),  target: new THREE.Vector3( 62,  2,  55) }, // petite île
  { pos: new THREE.Vector3( 45, 20, -38), target: new THREE.Vector3( 30,  5, -70) }, // île moyenne
];

// Position caméra vue d'ensemble — recule pour couvrir la disposition élargie
const OVERVIEW = {
  pos:    new THREE.Vector3(10, 95, 130),
  target: new THREE.Vector3( 8,  0, -15),
};

// Zone d'exclusion du continent (pour _isXZSafe — évite que le sous-marin le traverse)
const CONTINENT_POS = { x: 88, z: 8, minDist: 52 };

// ─── Paramètres du bateau ─────────────────────────────────────────
const BOAT = {
  AI_SPEED: 0.055,
  PLAYER_MAX_SPEED: 0.12,
  PLAYER_ACCEL: 0.005,
  PLAYER_DECEL: 0.007,
  TURN: 0.034,
  FRICTION: 0.96,
  CAM_OFFSET: new THREE.Vector3(0, 6, -12), // local: derrière la poupe
  CAM_LOOKAHEAD: new THREE.Vector3(0, 0, 12), // local: devant la proue
};

// ─── Utilitaire wireframe ─────────────────────────────────────────
/**
 * Crée un THREE.LineSegments wireframe à partir d'une géométrie.
 * La géométrie source est immédiatement disposée (plus besoin après).
 */
function wf(geo, color, opacity = 1) {
  const mat = new THREE.MeshLambertMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  return new THREE.Mesh(geo, mat);
}

// ─── Constructeur d'île ───────────────────────────────────────────
/**
 * Retourne un THREE.Group représentant une île avec palette naturelle.
 * @param {number} accentColor — hex 0xRRGGBB — beacon & anneau orbital uniquement
 * @returns {{ group: THREE.Group, hitMeshes: THREE.Mesh[] }}
 */
function buildIsland(accentColor) {
  const group = new THREE.Group();
  const hitMeshes = [];

  // Palette naturelle : roche → végétation → neige
  const EARTH = 0x5a3e2b; // socle : roche brun foncé
  const GRASS = 0x2f6b22; // flancs : végétation dense
  const SNOW = 0xe8f4fb; // sommet : neige/glace légèrement bleutée

  // ── Socle hexagonal (large prisme aplati) — roche/terre ───────
  group.add(wf(new THREE.CylinderGeometry(5.2, 6.8, 1.2, 6), EARTH));

  // ── Pic montagneux (cône hexagonal) — enneigé ────────────────
  const peak = wf(new THREE.ConeGeometry(3, 5.5, 6), SNOW);
  peak.position.y = 3.35;
  group.add(peak);

  // ── Structures (végétation / constructions envahies de mousse) ─
  const buildings = [
    { geo: new THREE.BoxGeometry(0.7, 2.8, 0.7), pos: [2.6, 2.0, 0.8] },
    { geo: new THREE.BoxGeometry(0.5, 1.8, 0.5), pos: [-2.2, 1.5, 1.6] },
    { geo: new THREE.BoxGeometry(1.0, 0.9, 1.0), pos: [1.4, 1.05, -2.0] },
    { geo: new THREE.BoxGeometry(0.4, 1.2, 0.4), pos: [-1.0, 1.2, 2.2] },
  ];
  buildings.forEach(({ geo, pos }) => {
    const b = wf(geo, GRASS, 0.9);
    b.position.set(...pos);
    group.add(b);
  });

  // ── Balise verticale (beacon) — rappel couleur accent du site ──
  const beaconGeo = new THREE.CylinderGeometry(0.05, 0.05, 12, 4);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.12,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 8.6;
  group.add(beacon);

  // ── Anneau orbital (torus) — rappel couleur accent du site ────
  const ringGeo = new THREE.TorusGeometry(7.5, 0.03, 4, 48);
  const ringMat = new THREE.LineBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.18,
  });
  const ring = new THREE.LineSegments(
    new THREE.WireframeGeometry(ringGeo),
    ringMat,
  );
  ringGeo.dispose();
  ring.rotation.x = Math.PI / 2.2;
  group.add(ring);

  // ── Zone de clic (sphère invisible) ───────────────────────────
  const hitGeo = new THREE.SphereGeometry(7, 8, 6);
  const hitMat = new THREE.MeshBasicMaterial({
    visible: false,
    side: THREE.FrontSide,
  });
  const hit = new THREE.Mesh(hitGeo, hitMat);
  hit.userData.isHitArea = true;
  group.add(hit);
  hitMeshes.push(hit);

  return { group, hitMeshes };
}

// ─── Sous-marin ───────────────────────────────────────────────────
// Remplace l'ancien bateau à moteur (Phase 4 → aspect uniquement).
// Comportement (IA waypoints, contrôle clavier, hitMesh, sillage) inchangé.
// Structure : corps cylindrique horizontal + nez hémisphérique + queue conique
//             + kiosque (conning tower) + périscope + ailerons × 2 + gouvernail en croix.
// Couleurs du design system : cyan (#00ffe7) corps, rose (#ff2d78) détails,
//                              lime (#b8ff35) périscope.
// Axe de déplacement : +Z = avant (bow), -Z = arrière (stern).
function buildBoat() {
  const group = new THREE.Group();

  // ── Corps principal (cylindre horizontal) — cyan ──────────────
  // CylinderGeometry aligné sur Y par défaut → rotation.x = π/2 pour l'axe Z.
  // 12 segments radiaux : silhouette ronde sans surcoût vertex.
  const body = wf(new THREE.CylinderGeometry(0.85, 0.85, 5.6, 12), 0x00ffe7);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.1; // légèrement au-dessus de l'eau (y=0)
  group.add(body);

  // ── Nez hémisphérique (avant +Z) ─────────────────────────────
  // scale.z = 0.7 : aplatit la sphère pour un profil en ogive.
  const nose = wf(new THREE.SphereGeometry(0.85, 10, 7), 0x00ffe7);
  nose.scale.z = 0.7;
  nose.position.set(0, 0.1, 2.8); // centré sur le bout avant du corps
  group.add(nose);

  // ── Queue conique (arrière -Z) ────────────────────────────────
  // ConeGeometry pointe vers +Y → rotation.x = π/2 pour pointer vers -Z.
  const tail = wf(new THREE.ConeGeometry(0.85, 2.0, 12), 0x00ffe7);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0.1, -3.8); // joint sur le bout arrière du corps
  group.add(tail);

  // ── Kiosque (conning tower) — rose ───────────────────────────
  // Tour rectangulaire dorsale, typique des sous-marins classiques.
  const kiosk = wf(new THREE.BoxGeometry(0.85, 0.9, 1.6), 0xff2d78);
  kiosk.position.set(0, 1.2, 0.4); // centré sur le milieu-avant du corps
  group.add(kiosk);

  // ── Périscope — lime ──────────────────────────────────────────
  // Tube fin + petite tête horizontale (occulaire). Décalé de 0.2 sur X
  // pour ne pas chevaucher l'axe de symétrie du kiosque.
  const peri = wf(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 5), 0xb8ff35);
  peri.position.set(0.2, 2.35, 0.4);
  group.add(peri);
  const periTop = wf(new THREE.BoxGeometry(0.22, 0.14, 0.38), 0xb8ff35);
  periTop.position.set(0.2, 3.25, 0.4); // sommet du tube
  group.add(periTop);

  // ── Ailerons latéraux (bow planes / stabilisateurs) ×2 — rose ─
  // Ailettes plates symétriques sur les flancs, à mi-corps côté avant.
  // Servent de stabilisateurs de plongée sur un vrai sous-marin.
  [-1, 1].forEach((side) => {
    const fin = wf(new THREE.BoxGeometry(1.2, 0.1, 0.65), 0xff2d78, 0.8);
    fin.position.set(side * 1.15, 0.1, 1.0); // ±X, au niveau de la ligne de flottaison
    group.add(fin);
  });

  // ── Gouvernail arrière en croix — rose ────────────────────────
  // Deux ailettes perpendiculaires (une verticale, une horizontale) à la poupe.
  // La croix est caractéristique des sous-marins militaires classiques.
  const rudV = wf(new THREE.BoxGeometry(0.1, 1.0, 0.65), 0xff2d78, 0.8); // ailette verticale
  rudV.position.set(0, 0.7, -3.3);
  group.add(rudV);
  const rudH = wf(new THREE.BoxGeometry(1.4, 0.1, 0.65), 0xff2d78, 0.8); // ailette horizontale
  rudH.position.set(0, 0.1, -3.3);
  group.add(rudH);

  // ── Sillage de bulles (traîne discrète) ───────────────────────
  // Même logique que l'ancien sillage en V du bateau, mais élargissement
  // réduit (2.2 vs 3.5) pour simuler une traîne sous-marine plus resserrée.
  // BufferAttribute DynamicDrawUsage : vertices mis à jour en temps réel
  // par _updateBoat() pour donner l'impression de mouvement.
  const N_WAKE = 10;
  const wakeGroup = new THREE.Group();
  wakeGroup.userData.isWake = true; // tag repéré par _updateBoat pour l'animer
  [-1, 1].forEach((side) => {
    const pts = new Float32Array(N_WAKE * 3);
    for (let i = 0; i < N_WAKE; i++) {
      const frac = i / (N_WAKE - 1);
      pts[i * 3] = side * frac * 2.2; // élargissement latéral réduit
      pts[i * 3 + 1] = 0;
      pts[i * 3 + 2] = -2.5 - frac * 5.5; // extension vers -Z (arrière)
    }
    const attr = new THREE.BufferAttribute(pts, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", attr);
    wakeGroup.add(
      new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: 0x00ffe7,
          transparent: true,
          opacity: 0.2, // plus discret que le bateau (0.35) — sous l'eau
        }),
      ),
    );
  });
  wakeGroup.position.y = -0.3; // légèrement sous la surface
  group.add(wakeGroup);

  // ── Zone de clic (sphère invisible) ───────────────────────────
  // Rayon 3.5 : capte les clics/hover sur tout le sous-marin quelle que
  // soit la caméra. userData.isBoatHit détecté par _handleClick/_handleMove.
  const hitGeo = new THREE.SphereGeometry(3.5, 6, 4);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 0.5;
  hitMesh.userData.isBoatHit = true;
  group.add(hitMesh);

  return { group, hitMesh };
}

// ─── Océan animé ──────────────────────────────────────────────────
// Mesh 32×32 (1 089 vertices) — 2 sinusoïdes croisées mises à jour chaque frame.
// MeshPhongMaterial : specular cyan pour le reflet du « soleil ».
// Pas de wireframe, pas de scanner — léger et lisible.
function buildOcean() {
  const container = new THREE.Group();
  container.position.y = -0.6;

  const seaGeo = new THREE.PlaneGeometry(220, 220, 32, 32);
  // DynamicDrawUsage : indique à WebGL que le buffer sera réécrit souvent
  seaGeo.attributes.position.setUsage(THREE.DynamicDrawUsage);

  const seaMat = new THREE.MeshPhongMaterial({
    color: 0x0a4a6e, // bleu-cyan moyen
    specular: 0x00ffe7, // reflet cyan
    shininess: 90,
    transparent: true,
    opacity: 0.88,
    side: THREE.FrontSide,
  });

  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.userData.isWave = true;
  container.add(sea);

  return container;
}

// ─── Champ de particules ──────────────────────────────────────────
function buildParticles() {
  const count = 700;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 130;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 90 - 5;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.09,
      transparent: true,
      opacity: 0.22,
    }),
  );
}
// ─── Ciel étoilé + Aurore boréale ────────────────────────────────
// 5 couches : 2 couches d'étoiles (demi-sphère) + 3 anneaux d'aurore.
// Aurore : gradient cyan → lime → rose, identique au gradient ScrollProgress.
// fog:false + sizeAttenuation:false sur toutes les couches.
function buildStarfield() {
  const group = new THREE.Group();

  // ── Couche 0 : étoiles fines (demi-sphère) ────────────────────
  const N1 = 2400;
  const p1 = new Float32Array(N1 * 3);
  for (let i = 0; i < N1; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 160 + Math.random() * 40;
    p1[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    p1[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 5;
    p1[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const g1 = new THREE.BufferGeometry();
  g1.setAttribute("position", new THREE.BufferAttribute(p1, 3));
  group.add(
    new THREE.Points(
      g1,
      new THREE.PointsMaterial({
        color: 0xddeeff,
        size: 1.0,
        fog: false,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: false,
      }),
    ),
  );

  // ── Couche 1 : étoiles brillantes (demi-sphère) ───────────────
  const N2 = 180;
  const p2 = new Float32Array(N2 * 3);
  for (let i = 0; i < N2; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 155;
    p2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    p2[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 5;
    p2[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute("position", new THREE.BufferAttribute(p2, 3));
  group.add(
    new THREE.Points(
      g2,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.2,
        fog: false,
        transparent: true,
        opacity: 1.0,
        sizeAttenuation: false,
      }),
    ),
  );

  // ── Générateur d'anneau d'aurore ──────────────────────────────
  // Distribue `count` particules en anneau horizontal autour de Y=baseY.
  // spreadY : dispersion gaussienne approchée (somme de 3 randoms).
  // r = 150-180 u. → hors portée du brouillard (fog:false de toute façon).
  function auroraRing(count, baseY, spreadY, color, opacity, size) {
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 150 + Math.random() * 30;
      const yOff =
        (Math.random() + Math.random() + Math.random() - 1.5) * spreadY;
      pts[i * 3] = r * Math.cos(theta);
      pts[i * 3 + 1] = Math.max(2, baseY + yOff);
      pts[i * 3 + 2] = r * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color,
        size,
        fog: false,
        transparent: true,
        opacity,
        sizeAttenuation: false,
      }),
    );
  }

  // ── Couche 2 : aurore cyan — basse (horizon) ──────────────────
  group.add(auroraRing(900, 15, 8, 0x00ffe7, 0.38, 1.2));
  // ── Couche 3 : aurore lime — médiane ──────────────────────────
  group.add(auroraRing(700, 32, 12, 0xb8ff35, 0.32, 0.9));
  // ── Couche 4 : aurore rose — haute ────────────────────────────
  group.add(auroraRing(400, 55, 18, 0xff2d78, 0.2, 0.8));

  return group;
}

// ─── Dôme de ciel — gradient aurora ──────────────────────────────
// Sphère inversée (BackSide) de rayon 185 avec vertex colors :
// horizon → rose-aurora profond (#b8102e) · ciel moyen → violet sombre (#18062a)
// zénith → noir-violet (#030108). depthWrite:false + renderOrder:-1
// pour qu'il soit toujours dessiné derrière tout le reste.
function buildSkyDome() {
  const R = 185;
  const geo = new THREE.SphereGeometry(R, 36, 18);
  const posAttr = geo.attributes.position;
  const cols = new Float32Array(posAttr.count * 3);

  const cHor = new THREE.Color(0xb8102e); // rose-aurora horizon
  const cMid = new THREE.Color(0x18062a); // violet sombre — ciel moyen
  const cTop = new THREE.Color(0x030108); // quasi-noir violet — zénith

  for (let i = 0; i < posAttr.count; i++) {
    // t=0 à l'équateur, t=1 au zénith (valeurs négatives ignorées = sous l'horizon)
    const t = Math.max(0, Math.min(1, posAttr.getY(i) / R));
    const c =
      t > 0.3
        ? cMid.clone().lerp(cTop, (t - 0.3) / 0.7) // ciel moyen → zénith
        : cHor.clone().lerp(cMid, t / 0.3); // horizon → ciel moyen
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));

  return new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
}

// ─── Continent d'horizon ──────────────────────────────────────────
// Grand relief d'arrière-plan positionné sur le bord droit du plan d'eau.
// Constitué de plusieurs volumes empilés pour simuler une côte montageuse
// sans wireframe — masse sombre qui ancre l'horizon.
function buildContinent() {
  const group = new THREE.Group();

  const ROCK  = 0x3a2e24; // roche sombre
  const EARTH = 0x4a3a2a; // terre/falaise
  const SNOW  = 0xd8eaf4; // neiges éternelles

  // Base — large plateau côtier (prisme hexagonal aplati)
  const base = wf(new THREE.CylinderGeometry(38, 46, 5, 7), EARTH);
  base.position.y = 2.5;
  group.add(base);

  // Relief principal — grande montagne centrale
  const peak1 = wf(new THREE.ConeGeometry(22, 42, 8), ROCK);
  peak1.position.y = 26;
  group.add(peak1);

  // Sommet enneigé
  const cap1 = wf(new THREE.ConeGeometry(10, 18, 8), SNOW);
  cap1.position.y = 52;
  group.add(cap1);

  // Pic secondaire gauche
  const peak2 = wf(new THREE.ConeGeometry(12, 26, 7), ROCK);
  peak2.position.set(-22, 18, 8);
  group.add(peak2);

  // Pic secondaire droit (plus petit)
  const peak3 = wf(new THREE.ConeGeometry(9, 20, 6), ROCK);
  peak3.position.set(18, 15, -12);
  group.add(peak3);

  // Talus avant — doux prolongement vers l'océan
  const slope = wf(new THREE.ConeGeometry(28, 10, 7), EARTH, 0.7);
  slope.position.set(10, 5, 20);
  group.add(slope);

  return group;
}

// ─── Classe principale ────────────────────────────────────────────
export class IslandScene {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number}   initialIndex   — île sélectionnée à l'entrée
   * @param {Function} onIslandClick  — callback(index: number)
   */
  constructor(
    canvas,
    initialIndex = 0,
    onIslandClick,
    onScrollExit,
    onBoatControlChange,
  ) {
    this.canvas = canvas;
    this.activeIndex = initialIndex;
    this.onIslandClick = onIslandClick;
    this.onScrollExit = onScrollExit;
    this.onBoatControlChange = onBoatControlChange;
    this._scrollDelta = 0; // accumulateur wheel
    this._disposed = false;
    this._clock = new THREE.Clock();
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2(-9999, -9999);
    this._lookTarget = new THREE.Vector3();
    this._allHitMeshes = []; // { mesh, index }
    // ── Bateau ──────────────────────────────────────────────────
    this._boat = null;
    this._boatHitMesh = null;
    this._boatWPs = [];
    this._boatWPIdx = 0;
    this._boatSpeed = 0;
    this._boatControlled = false;
    this._boatKeys = { up: false, down: false, left: false, right: false };

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._buildWorld();
    this._bindEvents();
    this._loop();

    // Fly-to automatique après que l'overlay de transition se soit retiré
    setTimeout(() => this.flyTo(initialIndex), 750);
  }

  // ── Renderer ────────────────────────────────────────────────────
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x030108, 1); // correspond au zénith du dôme
    this._resize();
  }

  // ── Scène ────────────────────────────────────────────────────────
  _initScene() {
    this.scene = new THREE.Scene();
    // Fog légèrement violet-sombre — correspond au ciel moyen du dôme
    this.scene.fog = new THREE.FogExp2(0x0d0520, 0.008);
  }

  // ── Caméra ───────────────────────────────────────────────────────
  _initCamera() {
    const { clientWidth: w, clientHeight: h } = this.canvas;
    this.camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 300);
    this.camera.position.copy(OVERVIEW.pos);
    this._lookTarget.copy(OVERVIEW.target);
    this.camera.lookAt(this._lookTarget);
  }

  // ── Construction du monde ─────────────────────────────────────────
  _buildWorld() {
    // Dôme de ciel aurora — rendu en premier (renderOrder -1, depthWrite:false)
    const skyDome = buildSkyDome();
    skyDome.renderOrder = -1;
    this.scene.add(skyDome);

    // Océan animé
    this._ocean = buildOcean();
    this._sea = this._ocean.children.find((c) => c.userData.isWave) ?? null;
    this.scene.add(this._ocean);

    // Particules
    this._particles = buildStarfield();
    this.scene.add(this._particles);

    // Continent — grand relief d'horizon, bord droit du plan d'eau
    const continent = buildContinent();
    continent.position.set(CONTINENT_POS.x, 0, CONTINENT_POS.z);
    this.scene.add(continent);

    // Îlots — tailles variées (ISLAND_SCALES) + positions étalées
    this._islandGroups = ISLAND_POSITIONS.map((pos, i) => {
      const { group, hitMeshes } = buildIsland(ACCENT_HEX[i]);
      group.scale.setScalar(ISLAND_SCALES[i]);
      group.position.copy(pos);
      hitMeshes.forEach((m) => this._allHitMeshes.push({ mesh: m, index: i }));
      this.scene.add(group);
      return group;
    });

    // Lumière directionnelle unique — angle 60° (soleil latéral)
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(30, 52, 20);
    this.scene.add(sun);

    // Lumière ambiante — assez chaude pour éclairer les faces non exposées
    this.scene.add(new THREE.AmbientLight(0x445566, 1.4));

    // Bateau à moteur
    this._spawnBoat();
  }

  // ── Événements souris ────────────────────────────────────────────
  _bindEvents() {
    this._onResize = () => this._resize();
    this._onClick = (e) => this._handleClick(e);
    this._onMove = (e) => this._handleMove(e);
    this._onWheel = (e) => this._handleWheel(e);
    this._onBoatKeydown = (e) => this._handleBoatKeydown(e);
    this._onBoatKeyup = (e) => this._handleBoatKeyup(e);

    window.addEventListener("resize", this._onResize);
    this.canvas.addEventListener("click", this._onClick);
    this.canvas.addEventListener("mousemove", this._onMove);
    this.canvas.addEventListener("wheel", this._onWheel, { passive: true });
    // Phase de capture pour intercepter les flèches avant Vue en mode bateau
    window.addEventListener("keydown", this._onBoatKeydown, true);
    window.addEventListener("keyup", this._onBoatKeyup, true);
  }

  _handleClick(e) {
    this._updateMouse(e);
    this._raycaster.setFromCamera(this._mouse, this.camera);

    // Bateau prioritaire — clic déclenche la prise de contrôle
    if (
      this._boatHitMesh &&
      this._raycaster.intersectObject(this._boatHitMesh).length > 0
    ) {
      this._activateBoatControl();
      return;
    }

    // Îles désactivées en mode bateau joueur
    if (this._boatControlled) return;

    for (const { mesh, index } of this._allHitMeshes) {
      if (this._raycaster.intersectObject(mesh).length > 0) {
        this.onIslandClick?.(index);
        break;
      }
    }
  }

  _handleMove(e) {
    this._updateMouse(e);
    this._raycaster.setFromCamera(this._mouse, this.camera);

    const boatHit =
      this._boatHitMesh &&
      this._raycaster.intersectObject(this._boatHitMesh).length > 0;
    if (boatHit) {
      this.canvas.style.cursor = "pointer";
      return;
    }

    const islandHit =
      !this._boatControlled &&
      this._allHitMeshes.some(
        ({ mesh }) => this._raycaster.intersectObject(mesh).length > 0,
      );
    this.canvas.style.cursor = islandHit ? "pointer" : "default";
  }

  _updateMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // ── Scroll wheel → retour CV ──────────────────────────────────
  // Un cumul de +120px de deltaY (≈ 3 crans de molette) déclenche la sortie.
  // Un timeout de 1.2s réinitialise l'accumulateur si l'utilisateur s'arrête.
  _handleWheel(e) {
    if (this._scrollExiting) return;
    this._scrollDelta += e.deltaY;

    clearTimeout(this._scrollResetTimer);
    this._scrollResetTimer = setTimeout(() => {
      this._scrollDelta = 0;
    }, 1200);

    if (this._scrollDelta > 120) {
      this._scrollExiting = true;
      this.onScrollExit?.();
    }
  }

  // ── Bateau — spawn & waypoints ─────────────────────────────────
  _spawnBoat() {
    const { group, hitMesh } = buildBoat();

    // Position aléatoire à proximité d'une île choisie au hasard
    const refIdx = Math.floor(Math.random() * ISLAND_POSITIONS.length);
    const refPos = ISLAND_POSITIONS[refIdx];
    const scale = ISLAND_SCALES[refIdx];
    const minR = 7 * scale + 14; // un peu au-delà du rayon de collision
    const maxR = minR + 10; // marge pour varier
    const angle = Math.random() * Math.PI * 2;
    const r = minR + Math.random() * (maxR - minR);
    const spawnX = refPos.x + Math.cos(angle) * r;
    const spawnZ = refPos.z + Math.sin(angle) * r;

    group.position.set(spawnX, 0, spawnZ);
    // Proue pointe vers l'île de référence
    group.rotation.y = Math.atan2(refPos.x - spawnX, refPos.z - spawnZ);

    this._boat = group;
    this._boatHitMesh = hitMesh;
    this._boatWPs = this._generateWaypoints(12);
    this._boatWPIdx = 0;
    this.scene.add(group);
  }

  _generateWaypoints(n) {
    const wps = [];
    let attempts = 0;
    while (wps.length < n && attempts < 600) {
      attempts++;
      const x = (Math.random() - 0.5) * 140;
      const z = (Math.random() - 0.5) * 140;
      if (this._isXZSafe(x, z)) wps.push(new THREE.Vector3(x, 0, z));
    }
    // Fallback : 4 coins sûrs
    if (wps.length < 4) {
      [
        [-65, -65],
        [65, -65],
        [65, 65],
        [-65, 65],
      ].forEach(([x, z]) => wps.push(new THREE.Vector3(x, 0, z)));
    }
    return wps;
  }

  _isXZSafe(x, z) {
    if (Math.abs(x) > 78 || Math.abs(z) > 78) return false;
    // Exclusion îlots
    for (let i = 0; i < ISLAND_POSITIONS.length; i++) {
      const ip = ISLAND_POSITIONS[i];
      const minDist = 7 * ISLAND_SCALES[i] + 12;
      const dx = x - ip.x;
      const dz = z - ip.z;
      if (dx * dx + dz * dz < minDist * minDist) return false;
    }
    // Exclusion continent (évite que le sous-marin traverse le relief)
    const cdx = x - CONTINENT_POS.x;
    const cdz = z - CONTINENT_POS.z;
    if (cdx * cdx + cdz * cdz < CONTINENT_POS.minDist * CONTINENT_POS.minDist) return false;
    return true;
  }

  // ── Bateau — contrôle joueur ──────────────────────────────────
  get boatControlled() {
    return this._boatControlled;
  }

  _activateBoatControl() {
    if (this._boatControlled) return;
    this._boatControlled = true;
    this.onBoatControlChange?.(true);
  }

  releaseBoatControl() {
    if (!this._boatControlled) return;
    this._boatControlled = false;
    this._boatKeys = { up: false, down: false, left: false, right: false };
    this.onBoatControlChange?.(false);
    this.flyTo(this.activeIndex);
  }

  _handleBoatKeydown(e) {
    if (!this._boatControlled) return;
    const MAP = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    if (!MAP[e.key]) return;
    e.preventDefault();
    e.stopPropagation();
    this._boatKeys[MAP[e.key]] = true;
  }

  _handleBoatKeyup(e) {
    const MAP = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    if (MAP[e.key]) this._boatKeys[MAP[e.key]] = false;
  }

  // ── Bateau — mise à jour physique ────────────────────────────
  _updateBoat(t) {
    if (!this._boat) return;
    const boat = this._boat;

    if (this._boatControlled) {
      // Mode joueur ──────────────────────────────────────────────
      if (this._boatKeys.up)
        this._boatSpeed = Math.min(
          this._boatSpeed + BOAT.PLAYER_ACCEL,
          BOAT.PLAYER_MAX_SPEED,
        );
      if (this._boatKeys.down)
        this._boatSpeed = Math.max(
          this._boatSpeed - BOAT.PLAYER_DECEL,
          -BOAT.PLAYER_MAX_SPEED * 0.5,
        );
      if (!this._boatKeys.up && !this._boatKeys.down)
        this._boatSpeed *= BOAT.FRICTION;

      if (this._boatKeys.left) boat.rotation.y += BOAT.TURN;
      if (this._boatKeys.right) boat.rotation.y -= BOAT.TURN;

      const fwdP = new THREE.Vector3(0, 0, 1).applyEuler(boat.rotation);
      boat.position.addScaledVector(fwdP, this._boatSpeed);
      boat.position.x = Math.max(-80, Math.min(80, boat.position.x));
      boat.position.z = Math.max(-80, Math.min(80, boat.position.z));

      // Chase-cam douce derrière le bateau
      const camOff = BOAT.CAM_OFFSET.clone().applyEuler(boat.rotation);
      this.camera.position.lerp(boat.position.clone().add(camOff), 0.07);
      const lookFwd = BOAT.CAM_LOOKAHEAD.clone().applyEuler(boat.rotation);
      this._lookTarget.lerp(boat.position.clone().add(lookFwd), 0.1);
    } else {
      // Mode IA — patrouille par waypoints ──────────────────────
      if (!this._boatWPs.length) return;
      const wp = this._boatWPs[this._boatWPIdx];
      const dx = wp.x - boat.position.x;
      const dz = wp.z - boat.position.z;
      if (Math.sqrt(dx * dx + dz * dz) < 8)
        this._boatWPIdx = (this._boatWPIdx + 1) % this._boatWPs.length;

      // Rotation douce vers le waypoint
      const targetHeading = Math.atan2(dx, dz);
      let dAngle = targetHeading - boat.rotation.y;
      while (dAngle > Math.PI) dAngle -= Math.PI * 2;
      while (dAngle < -Math.PI) dAngle += Math.PI * 2;
      boat.rotation.y += dAngle * 0.025;

      this._boatSpeed += (BOAT.AI_SPEED - this._boatSpeed) * 0.02;
      const fwdA = new THREE.Vector3(0, 0, 1).applyEuler(boat.rotation);
      boat.position.addScaledVector(fwdA, this._boatSpeed);
    }

    // Animation du sillage (ondulation Y proportionnelle à la vitesse)
    const wakeGroup = boat.children.find((c) => c.userData.isWake);
    if (wakeGroup && Math.abs(this._boatSpeed) > 0.003) {
      const spd = Math.abs(this._boatSpeed);
      wakeGroup.children.forEach((line) => {
        const attr = line.geometry.attributes.position;
        for (let i = 0; i < attr.count; i++) {
          const frac = i / (attr.count - 1);
          attr.setY(i, Math.sin(frac * 7 + t * 6) * 0.1 * (spd / 0.06));
        }
        attr.needsUpdate = true;
      });
    }
  }

  // ── Fly-to ───────────────────────────────────────────────────────
  /**
   * Anime la caméra vers l'île ciblée.
   * @param {number}  index
   * @param {boolean} immediate — sans animation (pour retour rapide)
   */
  flyTo(index, immediate = false) {
    this.activeIndex = index;
    const { pos, target } = CAMERA_SLOTS[index];

    if (immediate) {
      this.camera.position.copy(pos);
      this._lookTarget.copy(target);
      return;
    }

    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this._lookTarget);

    gsap.to(this.camera.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration: 1.5,
      ease: "power2.inOut",
    });
    gsap.to(this._lookTarget, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1.5,
      ease: "power2.inOut",
    });
  }

  /** Retour à la vue d'ensemble avant de quitter */
  flyToOverview(onComplete) {
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this._lookTarget);
    gsap.to(this.camera.position, {
      x: OVERVIEW.pos.x,
      y: OVERVIEW.pos.y,
      z: OVERVIEW.pos.z,
      duration: 0.9,
      ease: "power2.in",
      onComplete,
    });
    gsap.to(this._lookTarget, {
      x: OVERVIEW.target.x,
      y: OVERVIEW.target.y,
      z: OVERVIEW.target.z,
      duration: 0.9,
      ease: "power2.in",
    });
  }

  // ── Resize ───────────────────────────────────────────────────────
  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  // ── Boucle RAF ───────────────────────────────────────────────────
  _loop() {
    if (this._disposed) return;
    this._raf = requestAnimationFrame(() => this._loop());

    const t = this._clock.getElapsedTime();

    // Les îles sont fixes (posées sur le plan) — pas de flottaison ni rotation

    // Vagues de l'océan — 2 sinusoïdes croisées (amplitude modérée, fréq lente)
    // En géométrie PlaneGeometry rotée -π/2, l'axe Z local = hauteur monde.
    if (this._sea) {
      const pos = this._sea.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const gx = pos.getX(i);
        const gz = pos.getY(i);
        pos.setZ(
          i,
          Math.sin(gx * 0.11 + t * 1.2) * 0.85 +
            Math.sin(gz * 0.08 + t * 1.55) * 0.65 +
            Math.sin((gx + gz) * 0.06 + t * 0.9) * 0.35,
        );
      }
      pos.needsUpdate = true;
      this._sea.geometry.computeVertexNormals();
    }

    // Rotation lente du ciel (aurores tournent doucement)
    this._particles.rotation.y = t * 0.008;
    // Scintillement des 3 anneaux d'aurore — décalage de phase pour effet vivant
    if (this._particles.children[2])
      this._particles.children[2].material.opacity =
        0.38 + Math.sin(t * 0.7) * 0.07; // cyan
    if (this._particles.children[3])
      this._particles.children[3].material.opacity =
        0.32 + Math.sin(t * 0.9 + 1.0) * 0.06; // lime
    if (this._particles.children[4])
      this._particles.children[4].material.opacity =
        0.2 + Math.sin(t * 0.6 + 2.1) * 0.05; // rose

    // Bateau — IA ou contrôle joueur
    this._updateBoat(t);

    // lookAt caméra (mis à jour à chaque frame car GSAP tweene _lookTarget)
    this.camera.lookAt(this._lookTarget);

    this.renderer.render(this.scene, this.camera);
  }

  // ── Nettoyage ────────────────────────────────────────────────────
  dispose() {
    this._disposed = true;
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._onResize);
    this.canvas.removeEventListener("click", this._onClick);
    this.canvas.removeEventListener("mousemove", this._onMove);
    this.canvas.removeEventListener("wheel", this._onWheel);
    window.removeEventListener("keydown", this._onBoatKeydown, true);
    window.removeEventListener("keyup", this._onBoatKeyup, true);
    clearTimeout(this._scrollResetTimer);
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this._lookTarget);
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material))
          obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    this.renderer.dispose();
  }
}
