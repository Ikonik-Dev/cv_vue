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
const ISLAND_SCALES = [1.0, 0.75, 1.25];

// Positions des îlots — disposition éparse dans le plan XZ
// y = 0.6 * scale (base du socle posée exactement sur le plan)
const ISLAND_POSITIONS = [
  new THREE.Vector3(-20, 0.6, -6), // Île 0 — gauche, légèrement en retrait
  new THREE.Vector3(5, 0.45, 12), // Île 1 — centre-droit, proche (petite)
  new THREE.Vector3(22, 0.75, -5), // Île 2 — droite, légèrement en retrait (grande)
];

// Positions caméra par îlot (focused) — adaptées aux positions et tailles
const CAMERA_SLOTS = [
  {
    pos: new THREE.Vector3(-17, 10, 14),
    target: new THREE.Vector3(-20, 3, -6),
  },
  { pos: new THREE.Vector3(8, 8, 28), target: new THREE.Vector3(5, 2, 12) },
  { pos: new THREE.Vector3(20, 12, 10), target: new THREE.Vector3(22, 4, -5) },
];

// Position caméra vue d'ensemble — centrée sur la disposition aléatoire
const OVERVIEW = {
  pos: new THREE.Vector3(2, 38, 62),
  target: new THREE.Vector3(2, 0, 1),
};

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
  const wGeo = new THREE.WireframeGeometry(geo);
  geo.dispose();
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false,
  });
  return new THREE.LineSegments(wGeo, mat);
}

// ─── Constructeur d'île ───────────────────────────────────────────
/**
 * Retourne un THREE.Group représentant une île cyberpunk wireframe.
 * @param {number} color  — couleur hex 0xRRGGBB
 * @returns {{ group: THREE.Group, hitMeshes: THREE.Mesh[] }}
 */
function buildIsland(color) {
  const group = new THREE.Group();
  const hitMeshes = [];

  // ── Socle hexagonal (large prisme aplati) ─────────────────────
  group.add(wf(new THREE.CylinderGeometry(5.2, 6.8, 1.2, 6), color));

  // ── Pic montagneux (cône hexagonal) ──────────────────────────
  const peak = wf(new THREE.ConeGeometry(3, 5.5, 6), color);
  peak.position.y = 3.35;
  group.add(peak);

  // ── Structures (bâtiments / serveurs) ────────────────────────
  const buildings = [
    { geo: new THREE.BoxGeometry(0.7, 2.8, 0.7), pos: [2.6, 2.0, 0.8] },
    { geo: new THREE.BoxGeometry(0.5, 1.8, 0.5), pos: [-2.2, 1.5, 1.6] },
    { geo: new THREE.BoxGeometry(1.0, 0.9, 1.0), pos: [1.4, 1.05, -2.0] },
    { geo: new THREE.BoxGeometry(0.4, 1.2, 0.4), pos: [-1.0, 1.2, 2.2] },
  ];
  buildings.forEach(({ geo, pos }) => {
    const b = wf(geo, color, 0.75);
    b.position.set(...pos);
    group.add(b);
  });

  // ── Balise verticale (beacon) ──────────────────────────────────
  const beaconGeo = new THREE.CylinderGeometry(0.05, 0.05, 12, 4);
  const beaconMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
  });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.y = 8.6;
  group.add(beacon);

  // ── Anneau orbital (torus) ─────────────────────────────────────
  const ringGeo = new THREE.TorusGeometry(7.5, 0.03, 4, 48);
  const ringMat = new THREE.LineBasicMaterial({
    color,
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

// ─── Bateau à moteur ──────────────────────────────────────────────
// Couleurs : gradient ScrollProgress (cyan → rose → lime)
function buildBoat() {
  const group = new THREE.Group();

  // ── Coque (hull) — cyan ───────────────────────────────────────
  const hull = wf(new THREE.BoxGeometry(2.4, 0.7, 5.5), 0x00ffe7);
  hull.position.y = 0.35;
  group.add(hull);

  // ── Étrave (bow) — cône pointé vers +Z ───────────────────────
  const bow = wf(new THREE.ConeGeometry(0.9, 1.8, 4), 0x00ffe7);
  bow.position.set(0, 0.35, 3.65);
  bow.rotation.x = Math.PI / 2;
  group.add(bow);

  // ── Poupe (stern) ─────────────────────────────────────────────
  const stern = wf(new THREE.CylinderGeometry(0, 1.2, 0.7, 4), 0x00ffe7, 0.5);
  stern.position.set(0, 0.35, -2.75);
  group.add(stern);

  // ── Cabine — rose ─────────────────────────────────────────────
  const cabin = wf(new THREE.BoxGeometry(1.6, 0.9, 1.8), 0xff2d78);
  cabin.position.set(0, 1.15, 0.3);
  group.add(cabin);

  // ── Tuyaux d'échappement — rose ×2 ───────────────────────────
  [-0.7, 0.7].forEach((x) => {
    const exhaust = wf(
      new THREE.CylinderGeometry(0.12, 0.12, 0.7, 4),
      0xff2d78,
      0.7,
    );
    exhaust.position.set(x, 1.65, -0.5);
    group.add(exhaust);
  });

  // ── Mât — lime ────────────────────────────────────────────────
  const mast = wf(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 4), 0xb8ff35);
  mast.position.set(0, 2.2, 0.8);
  group.add(mast);

  // ── Sillage en V (2 branches, BufferGeometry dynamique) ───────
  const N_WAKE = 10;
  const wakeGroup = new THREE.Group();
  wakeGroup.userData.isWake = true;
  [-1, 1].forEach((side) => {
    const pts = new Float32Array(N_WAKE * 3);
    for (let i = 0; i < N_WAKE; i++) {
      const frac = i / (N_WAKE - 1);
      pts[i * 3] = side * frac * 3.5; // élargissement latéral
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
          opacity: 0.35,
        }),
      ),
    );
  });
  wakeGroup.position.y = -0.3;
  group.add(wakeGroup);

  // ── Zone de clic (sphère invisible) ───────────────────────────
  const hitGeo = new THREE.SphereGeometry(3.5, 6, 4);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 0.5;
  hitMesh.userData.isBoatHit = true;
  group.add(hitMesh);

  return { group, hitMesh };
}

// ─── Plan océan ───────────────────────────────────────────────────
function buildOcean() {
  const container = new THREE.Group();
  container.position.y = -0.6; // juste sous la base du socle

  // Grille de fond (très transparent)
  const gridGeo = new THREE.PlaneGeometry(180, 180, 36, 36);
  const grid = new THREE.LineSegments(
    new THREE.WireframeGeometry(gridGeo),
    new THREE.LineBasicMaterial({
      color: 0x00ffe7,
      transparent: true,
      opacity: 0.035,
    }),
  );
  gridGeo.dispose();
  grid.rotation.x = -Math.PI / 2;
  container.add(grid);

  // Ligne scanner avec ondulations (BufferGeometry dynamique, 90 segments)
  const N_SCAN = 90;
  const scanPositions = new Float32Array(N_SCAN * 3);
  for (let j = 0; j < N_SCAN; j++) {
    scanPositions[j * 3] = (j / (N_SCAN - 1) - 0.5) * 180; // x : -90 → +90
    scanPositions[j * 3 + 1] = 0;
    scanPositions[j * 3 + 2] = 0;
  }
  const scanGeo = new THREE.BufferGeometry();
  const scanAttr = new THREE.BufferAttribute(scanPositions, 3);
  scanAttr.setUsage(THREE.DynamicDrawUsage);
  scanGeo.setAttribute("position", scanAttr);
  const scanMat = new THREE.LineBasicMaterial({
    color: 0x00ffe7,
    transparent: true,
    opacity: 0.4,
  });
  const scanner = new THREE.Line(scanGeo, scanMat);
  scanner.userData.isScanner = true;
  container.add(scanner);

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
    this.renderer.setClearColor(0x070707, 1);
    this._resize();
  }

  // ── Scène ────────────────────────────────────────────────────────
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070707, 0.01);
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
    // Océan
    this._ocean = buildOcean();
    this.scene.add(this._ocean);

    // Particules
    this._particles = buildParticles();
    this.scene.add(this._particles);

    // Îlots — tailles variées (ISLAND_SCALES) + positions aléatoires
    this._islandGroups = ISLAND_POSITIONS.map((pos, i) => {
      const { group, hitMeshes } = buildIsland(ACCENT_HEX[i]);
      group.scale.setScalar(ISLAND_SCALES[i]);
      group.position.copy(pos);
      hitMeshes.forEach((m) => this._allHitMeshes.push({ mesh: m, index: i }));
      this.scene.add(group);
      return group;
    });

    // Lumières ponctuelles — intensité et portée proportionnelles à la taille
    ISLAND_POSITIONS.forEach((pos, i) => {
      const s = ISLAND_SCALES[i];
      const light = new THREE.PointLight(ACCENT_HEX[i], 1.2 * s, 28 * s);
      light.position.set(pos.x, pos.y + 6, pos.z);
      this.scene.add(light);
    });

    // Lumière ambiante très sombre
    this.scene.add(new THREE.AmbientLight(0x111111, 0.6));

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
    for (let i = 0; i < ISLAND_POSITIONS.length; i++) {
      const ip = ISLAND_POSITIONS[i];
      const minDist = 7 * ISLAND_SCALES[i] + 12;
      const dx = x - ip.x;
      const dz = z - ip.z;
      if (dx * dx + dz * dz < minDist * minDist) return false;
    }
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

    // Scanner — fréquence ×1.5 + ondulations dynamiques sur les vertices
    const scanner = this._ocean.children.find((c) => c.userData.isScanner);
    if (scanner) {
      scanner.position.z = ((t * 10.5) % 180) - 90;
      const posAttr = scanner.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        posAttr.setY(i, Math.sin(x * 0.12 + t * 2.8) * 0.4);
      }
      posAttr.needsUpdate = true;
    }

    // Drift des particules
    this._particles.rotation.y = t * 0.015;

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
