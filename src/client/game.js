import { Simulation } from "/core/simulation.js";

// ── Read Night from URL param (?night=1|2|3) ──
const urlParams = new URLSearchParams(window.location.search);
let currentNight = parseInt(urlParams.get("night") || "1", 10);
if (![1, 2, 3].includes(currentNight)) currentNight = 1;

// ── Initialize Simulation with Obstacles Enabled for 3D Client ──
const sim = new Simulation({
  seed: Date.now(),
  night: currentNight,
  obstacles_enabled: true
});

// Update Night Bar active button
document.querySelectorAll(".night-btn").forEach((btn, idx) => {
  btn.classList.toggle("active", idx + 1 === currentNight);
});
window.switchNight = function (n) {
  window.location.search = `?night=${n}`;
};

const mapTitleEl = document.getElementById("map-title");
const nightSubEl = document.getElementById("night-sub");
if (mapTitleEl) mapTitleEl.textContent = sim.map.name;
if (nightSubEl) nightSubEl.textContent = `Đêm ${currentNight}`;

const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020512);
scene.fog = new THREE.FogExp2(0x060c24, 0.009); // Clearer atmospheric fog for vast expansive view

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1200);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// ── Dynamic Camera Zoom Controls ──
let zoomFactor = 1.0;
addEventListener("wheel", (e) => {
  zoomFactor = Math.max(0.65, Math.min(2.2, zoomFactor + e.deltaY * 0.001));
}, { passive: true });

// ── Lighting ──
const ambientLight = new THREE.AmbientLight(0x1c2b50, 0.7);
scene.add(ambientLight);

const moonDir = new THREE.DirectionalLight(0x88aaff, 1.15);
moonDir.position.set(80, 110, -80);
moonDir.castShadow = true;
moonDir.shadow.mapSize.set(1024, 1024);
moonDir.shadow.camera.near = 20;
moonDir.shadow.camera.far = 400;
moonDir.shadow.camera.left = -80;
moonDir.shadow.camera.right = 80;
moonDir.shadow.camera.top = 80;
moonDir.shadow.camera.bottom = -80;
scene.add(moonDir);

const skyHemisphere = new THREE.HemisphereLight(0x3d5a80, 0x050a14, 0.5);
scene.add(skyHemisphere);

// ── Moon ──
const moonMeshGeo = new THREE.SphereGeometry(18, 32, 32);
const moonMeshMat = new THREE.MeshBasicMaterial({ color: 0xfffaea });
const moonMesh = new THREE.Mesh(moonMeshGeo, moonMeshMat);
moonMesh.position.set(160, 140, -240);
scene.add(moonMesh);

const moonAuraGeo = new THREE.SphereGeometry(28, 32, 32);
const moonAuraMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, transparent: true, opacity: 0.12, side: THREE.BackSide });
const moonAura = new THREE.Mesh(moonAuraGeo, moonAuraMat);
moonAura.position.copy(moonMesh.position);
scene.add(moonAura);

// ── Starfield (Expanded) ──
const starCount = 1400;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  const r = 350 + Math.random() * 120;
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.85 });
scene.add(new THREE.Points(starGeo, starMat));

// ── Vast Animated Ocean / Sea of Clouds (1600m x 1600m) ──
const seaGeo = new THREE.PlaneGeometry(1600, 1600, 64, 64);
const seaMat = new THREE.MeshStandardMaterial({
  color: 0x030a1c,
  roughness: 0.15,
  metalness: 0.85,
  flatShading: true
});
const seaMesh = new THREE.Mesh(seaGeo, seaMat);
seaMesh.rotation.x = -Math.PI / 2;
seaMesh.position.y = -3.5;
scene.add(seaMesh);
const seaPosAttr = seaGeo.attributes.position;
const seaInitialY = new Float32Array(seaPosAttr.count);
for (let i = 0; i < seaPosAttr.count; i++) {
  seaInitialY[i] = seaPosAttr.getZ(i);
}

// ── Distant Floating Sky Lanterns ──
const skyLanterns = [];
for (let i = 0; i < 30; i++) {
  const sAngle = Math.random() * Math.PI * 2;
  const sDist = 70 + Math.random() * 120;
  const sY = 10 + Math.random() * 35;
  const sMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xff9f43, transparent: true, opacity: 0.75 })
  );
  sMesh.position.set(Math.cos(sAngle) * sDist, sY, Math.sin(sAngle) * sDist);
  scene.add(sMesh);
  skyLanterns.push({ mesh: sMesh, speed: 0.2 + Math.random() * 0.3, initialY: sY });
}

// ── Outer Archipelago Shoals & Distant Reef Rocks ──
const reefGroup = new THREE.Group();
const reefMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.9, flatShading: true });
for (let i = 0; i < 28; i++) {
  const angle = (i / 28) * Math.PI * 2 + Math.sin(i * 1.5) * 0.2;
  const r = 50 + (i % 5) * 14 + Math.random() * 8;
  const reefRock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(2.5 + Math.random() * 3.5, 1),
    reefMat
  );
  reefRock.position.set(Math.cos(angle) * r, -1.8 + Math.random() * 0.8, Math.sin(angle) * r);
  reefRock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
  reefRock.scale.set(1.0, 1.2 + Math.random() * 0.5, 1.0);
  reefGroup.add(reefRock);
}
scene.add(reefGroup);

// ── Island Geometry Construction per Night ──
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const cliffMat = new THREE.MeshStandardMaterial({ color: 0x141f17, roughness: 0.95 });
const grassMat = new THREE.MeshStandardMaterial({ color: 0x19331d, roughness: 0.9 });
const sandMat = new THREE.MeshStandardMaterial({ color: 0x3b3323, roughness: 0.9 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.85 });

function buildNight1Map() {
  const R = 40.0;
  // Island cliff
  const land = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 8, 5, 64), cliffMat);
  land.position.y = -2.5;
  land.receiveShadow = true;
  islandGroup.add(land);

  // Grass top
  const grass = new THREE.Mesh(new THREE.RingGeometry(0, R, 64), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = 0.01;
  grass.receiveShadow = true;
  islandGroup.add(grass);

  // Sand Shoreline Ring
  const sand = new THREE.Mesh(new THREE.RingGeometry(R - 3.0, R + 1.0, 64), sandMat);
  sand.rotation.x = -Math.PI / 2;
  sand.position.y = 0.005;
  sand.receiveShadow = true;
  islandGroup.add(sand);

  // Wooden Pier
  const pier = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 16), woodMat);
  pier.position.set(0, -0.2, R + 5);
  pier.receiveShadow = true;
  islandGroup.add(pier);

  // Central Plaza Stone
  const centerPlaza = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.2, 0.1, 16), stoneMat);
  centerPlaza.position.y = 0.04;
  centerPlaza.receiveShadow = true;
  islandGroup.add(centerPlaza);
}

function buildNight2Map() {
  const R = 28.0;
  // Island A at (0,0,0)
  const landA = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 6, 5, 48), cliffMat);
  landA.position.set(0, -2.5, 0);
  landA.receiveShadow = true;
  islandGroup.add(landA);

  const grassA = new THREE.Mesh(new THREE.RingGeometry(0, R, 48), grassMat);
  grassA.rotation.x = -Math.PI / 2;
  grassA.position.set(0, 0.01, 0);
  grassA.receiveShadow = true;
  islandGroup.add(grassA);

  // Island B at (70,0,0)
  const landB = new THREE.Mesh(new THREE.CylinderGeometry(R, R + 6, 5, 48), cliffMat);
  landB.position.set(70, -2.5, 0);
  landB.receiveShadow = true;
  islandGroup.add(landB);

  const grassB = new THREE.Mesh(new THREE.RingGeometry(0, R, 48), grassMat);
  grassB.rotation.x = -Math.PI / 2;
  grassB.position.set(70, 0.01, 0);
  grassB.receiveShadow = true;
  islandGroup.add(grassB);

  // Bamboo Bridge: X in [26, 44], Z in [-2, 2]
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 4), woodMat);
  bridge.position.set(35, -0.1, 0);
  bridge.receiveShadow = true;
  islandGroup.add(bridge);

  // Bridge bamboo ropes
  for (const z of [-1.9, 1.9]) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 18, 8), new THREE.MeshStandardMaterial({ color: 0x8395a7 }));
    rope.rotation.z = Math.PI / 2;
    rope.position.set(35, 0.6, z);
    islandGroup.add(rope);
  }
}

function buildNight3Map() {
  // Tier 0: Disc R=45 at Y=0
  const land0 = new THREE.Mesh(new THREE.CylinderGeometry(45, 52, 5, 64), cliffMat);
  land0.position.y = -2.5;
  land0.receiveShadow = true;
  islandGroup.add(land0);

  const grass0 = new THREE.Mesh(new THREE.RingGeometry(0, 45, 64), grassMat);
  grass0.rotation.x = -Math.PI / 2;
  grass0.position.y = 0.01;
  grass0.receiveShadow = true;
  islandGroup.add(grass0);

  // Tier 1: Annular ring 12 <= r <= 24, z > 0 at Y=3
  const t1Group = new THREE.Group();
  t1Group.position.set(0, 1.5, 0);
  const ringGeo = new THREE.RingGeometry(12, 24, 48, 1, 0, Math.PI);
  const ringMesh = new THREE.Mesh(ringGeo, grassMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 1.51;
  t1Group.add(ringMesh);

  // Tier 1 Cliff walls
  const wallGeo = new THREE.CylinderGeometry(24, 24, 3, 48, 1, true, 0, Math.PI);
  const wallMesh = new THREE.Mesh(wallGeo, cliffMat);
  t1Group.add(wallMesh);
  islandGroup.add(t1Group);

  // Tier 2: Disc R=8 at Y=6
  const t2Land = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 6, 32), cliffMat);
  t2Land.position.y = 3.0;
  t2Land.receiveShadow = true;
  islandGroup.add(t2Land);

  const t2Grass = new THREE.Mesh(new THREE.RingGeometry(0, 8, 32), grassMat);
  t2Grass.rotation.x = -Math.PI / 2;
  t2Grass.position.y = 6.01;
  t2Grass.receiveShadow = true;
  islandGroup.add(t2Grass);

  // Bell Tower at center of Tier 2: Height 8m, R=2m
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 8, 16), stoneMat);
  tower.position.set(0, 10, 0);
  tower.castShadow = true;
  islandGroup.add(tower);

  // Golden Bell inside tower
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0xffd32a, metalness: 0.8, roughness: 0.3 }));
  bell.position.set(0, 12, 0);
  islandGroup.add(bell);

  // Radial ramps at 30 deg and 150 deg (from r=30 Y=0 to r=24 Y=3)
  for (const deg of [30, 150]) {
    const rad = (deg * Math.PI) / 180;
    const rampGroup = new THREE.Group();
    rampGroup.position.set(Math.cos(rad) * 27, 1.5, Math.sin(rad) * 27);
    rampGroup.rotation.y = -rad;
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 6.5), stoneMat);
    ramp.rotation.x = -0.45;
    ramp.receiveShadow = true;
    rampGroup.add(ramp);
    islandGroup.add(rampGroup);
  }
}

if (currentNight === 1) buildNight1Map();
else if (currentNight === 2) buildNight2Map();
else if (currentNight === 3) buildNight3Map();

// ── Solid Obstacles 3D Rendering (Rocks, Trees, Pillars, Tower) ──
const obstacleGroup = new THREE.Group();
scene.add(obstacleGroup);

const rockMat = new THREE.MeshStandardMaterial({ color: 0x3d4351, roughness: 0.9, flatShading: true });
const rockMossMat = new THREE.MeshStandardMaterial({ color: 0x223a26, roughness: 0.85, flatShading: true });
const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x2d1d13, roughness: 0.9 });
const pineFoliageMat = new THREE.MeshStandardMaterial({ color: 0x0f2b1d, roughness: 0.85, flatShading: true });
const pillarVermilionMat = new THREE.MeshStandardMaterial({ color: 0xeb3b5a, roughness: 0.5 });
const pillarStoneMat = new THREE.MeshStandardMaterial({ color: 0x485460, roughness: 0.8 });

for (const obs of sim.obstacles) {
  const oGroup = new THREE.Group();
  oGroup.position.set(obs.pos[0], obs.pos[1], obs.pos[2]);

  if (obs.type === "rock") {
    // Multi-faceted boulder
    const rockGeo = new THREE.DodecahedronGeometry(obs.radius, 1);
    const rockMesh = new THREE.Mesh(rockGeo, Math.random() > 0.5 ? rockMat : rockMossMat);
    rockMesh.scale.set(1.0, 0.85, 1.0);
    rockMesh.position.y = obs.radius * 0.7;
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    oGroup.add(rockMesh);
  } else if (obs.type === "tree") {
    // Ancient pine tree
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(obs.radius * 0.35, obs.radius * 0.5, 1.8, 8), treeTrunkMat);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    oGroup.add(trunk);

    for (let lvl = 0; lvl < 3; lvl++) {
      const coneR = obs.radius * (1.6 - lvl * 0.35);
      const coneH = 1.4;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(coneR, coneH, 8), pineFoliageMat);
      cone.position.y = 1.6 + lvl * 0.85;
      cone.castShadow = true;
      oGroup.add(cone);
    }
  } else if (obs.type === "pillar") {
    const pMat = obs.id.includes("pillar") ? pillarVermilionMat : pillarStoneMat;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(obs.radius, obs.radius * 1.1, obs.height || 3.5, 12), pMat);
    p.position.y = (obs.height || 3.5) / 2;
    p.castShadow = true;
    p.receiveShadow = true;
    oGroup.add(p);
  }
  obstacleGroup.add(oGroup);
}

// ── Jump Pads Visuals ──
for (const jp of sim.jump_pads) {
  const padGroup = new THREE.Group();
  padGroup.position.set(jp.pos[0], jp.pos[1] + 0.05, jp.pos[2]);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(jp.radius, jp.radius + 0.1, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x00d2d3, emissive: 0x01a3a4, emissiveIntensity: 0.6 })
  );
  padGroup.add(disc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(jp.radius * 0.4, jp.radius * 0.9, 24),
    new THREE.MeshBasicMaterial({ color: 0x54a0ff, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  padGroup.add(ring);

  scene.add(padGroup);
}

// ── Charms Visuals (Bùa Hộ Mệnh) ──
const charmVisuals = new Map();
function getOrCreateCharm(c) {
  if (charmVisuals.has(c.id)) return charmVisuals.get(c.id);
  const grp = new THREE.Group();
  grp.position.set(c.pos[0], c.pos[1] + 1.0, c.pos[2]);

  const talisman = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.7, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xee5253, roughness: 0.6, emissive: 0xb33939, emissiveIntensity: 0.5 })
  );
  grp.add(talisman);

  const rune = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.14, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd32a, side: THREE.DoubleSide })
  );
  rune.position.z = 0.025;
  grp.add(rune);

  const cLight = new THREE.PointLight(0xff6b6b, 1.2, 5);
  grp.add(cLight);

  scene.add(grp);
  const obj = { grp, talisman, cLight };
  charmVisuals.set(c.id, obj);
  return obj;
}

// ── Grand Lanterns Visuals ──
const lanternVisuals = new Map();
for (const l of sim.lanterns) {
  const lGroup = new THREE.Group();
  lGroup.position.set(l.pos[0], l.pos[1], l.pos[2]);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8), stoneMat);
  base.position.y = 0.2;
  lGroup.add(base);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 1.8, 8), stoneMat);
  pillar.position.y = 1.2;
  lGroup.add(pillar);

  const chamberMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.5 });
  const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.9), chamberMat);
  chamber.position.y = 2.45;
  lGroup.add(chamber);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0x833471 }));
  roof.position.y = 3.35;
  roof.rotation.y = Math.PI / 4;
  lGroup.add(roof);

  const fireGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xffeaa7, transparent: true, opacity: 0.2 });
  const fire = new THREE.Mesh(fireGeo, fireMat);
  fire.position.y = 2.45;
  lGroup.add(fire);

  const lLight = new THREE.PointLight(0xffbe76, 0.2, 14);
  lLight.position.y = 2.45;
  lGroup.add(lLight);

  // Safe Ring around lit lantern (R=6.0m)
  const safeRingGeo = new THREE.RingGeometry(5.85, 6.0, 48);
  const safeRingMat = new THREE.MeshBasicMaterial({ color: 0xffd32a, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const safeRing = new THREE.Mesh(safeRingGeo, safeRingMat);
  safeRing.rotation.x = -Math.PI / 2;
  safeRing.position.y = 0.05;
  lGroup.add(safeRing);

  // Floating Fuel Bar above lantern
  const fuelBarGroup = new THREE.Group();
  fuelBarGroup.position.set(0, 4.3, 0);

  const fuelBg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.24),
    new THREE.MeshBasicMaterial({ color: 0x111625, side: THREE.DoubleSide })
  );
  fuelBarGroup.add(fuelBg);

  const fuelFillMat = new THREE.MeshBasicMaterial({ color: 0x0be881, side: THREE.DoubleSide });
  const fuelFill = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.18),
    fuelFillMat
  );
  fuelFill.position.z = 0.01;
  fuelBarGroup.add(fuelFill);
  fuelBarGroup.visible = false;
  lGroup.add(fuelBarGroup);

  // Tear shape / water droplet marker for colorblind unlit state
  const tearGeo = new THREE.ConeGeometry(0.25, 0.5, 8);
  const tearMat = new THREE.MeshBasicMaterial({ color: 0x00b3ff, wireframe: true });
  const tearMarker = new THREE.Mesh(tearGeo, tearMat);
  tearMarker.position.set(0, 4.0, 0);
  tearMarker.rotation.x = Math.PI;
  tearMarker.visible = false;
  lGroup.add(tearMarker);

  scene.add(lGroup);
  lanternVisuals.set(l.id, {
    lGroup,
    chamberMat,
    fireMat,
    lLight,
    safeRingMat,
    fuelBarGroup,
    fuelFill,
    fuelFillMat,
    tearMarker
  });
}

// ── Player "Mây" (Character Model) ──
const playerGroup = new THREE.Group();
playerGroup.position.copy(sim.player.pos);
scene.add(playerGroup);

const robeMat = new THREE.MeshStandardMaterial({ color: 0x227093, roughness: 0.7 });
const skinMat = new THREE.MeshStandardMaterial({ color: 0xfed330, roughness: 0.5 });

const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.9, 12), robeMat);
body.position.y = 0.75;
body.castShadow = true;
playerGroup.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), skinMat);
head.position.y = 1.38;
head.castShadow = true;
playerGroup.add(head);

// Conical Straw Hat
const hat = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0xd1a96c, roughness: 0.9 }));
hat.position.y = 1.54;
playerGroup.add(hat);

// Hand Lantern
const hStaffGroup = new THREE.Group();
hStaffGroup.position.set(0.42, 0.9, 0.2);
const hStaff = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), woodMat);
hStaffGroup.add(hStaff);

const handLantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.22), new THREE.MeshStandardMaterial({ color: 0xfffa65, emissive: 0xffbe76, emissiveIntensity: 0.8 }));
handLantern.position.set(0, 0.45, 0.15);
hStaffGroup.add(handLantern);

const handLight = new THREE.PointLight(0xffbe76, 1.8, 10);
handLight.position.copy(handLantern.position);
hStaffGroup.add(handLight);
playerGroup.add(hStaffGroup);

// Facing Direction Arrow (attached to player root)
const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 3);
const dirArrow = new THREE.Mesh(arrowGeo, arrowMat);
dirArrow.rotation.x = -Math.PI / 2;
dirArrow.position.set(0, 0.05, 0.9);
playerGroup.add(dirArrow);

// Companion "Lạc" (Spiritual Companion)
const companionGroup = new THREE.Group();
const compMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xffeaa7 })
);
companionGroup.add(compMesh);
const compLight = new THREE.PointLight(0xffd32a, 1.2, 6);
companionGroup.add(compLight);
scene.add(companionGroup);

// ── Pulse Wave Effect ──
let pulseAnim = 0;
const pulseWaveGeo = new THREE.RingGeometry(0.1, 0.4, 32);
const pulseWaveMat = new THREE.MeshBasicMaterial({ color: 0x48dbfb, side: THREE.DoubleSide, transparent: true, opacity: 0 });
const pulseWave = new THREE.Mesh(pulseWaveGeo, pulseWaveMat);
pulseWave.rotation.x = -Math.PI / 2;
pulseWave.position.y = 0.15;
scene.add(pulseWave);

// ── Firefly Motes Visuals ──
const moteMeshMap = new Map();
function getOrCreateMote(m) {
  if (moteMeshMap.has(m.id)) return moteMeshMap.get(m.id);
  const grp = new THREE.Group();
  grp.position.set(m.pos[0], m.pos[1] + 0.8, m.pos[2]);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshBasicMaterial({ color: m.kind === "dropped" ? 0xff7675 : 0x55efc4 })
  );
  grp.add(core);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({ color: m.kind === "dropped" ? 0xd63031 : 0x00b894, transparent: true, opacity: 0.35 })
  );
  grp.add(glow);

  scene.add(grp);
  moteMeshMap.set(m.id, grp);
  return grp;
}

function syncMotes() {
  const currentIds = new Set(sim.motes.map((m) => m.id));
  for (const [id, grp] of moteMeshMap.entries()) {
    if (!currentIds.has(id)) {
      scene.remove(grp);
      moteMeshMap.delete(id);
    }
  }
  for (const m of sim.motes) {
    const grp = getOrCreateMote(m);
    grp.position.x = m.pos[0];
    grp.position.z = m.pos[2];
  }
}

// ── Ink Shades (Bóng Mực) Visuals ──
const shadeMeshMap = new Map();
function getOrCreateShade(s) {
  if (shadeMeshMap.has(s.id)) return shadeMeshMap.get(s.id);
  const grp = new THREE.Group();
  grp.position.set(s.pos[0], s.pos[1] + 0.75, s.pos[2]);

  const sCoreMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95 });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), sCoreMat);
  core.scale.set(1.0, 1.25, 1.0);
  core.castShadow = true;
  grp.add(core);

  const sEyeMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), sEyeMat);
  leftEye.position.set(-0.16, 0.15, 0.45);
  grp.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), sEyeMat);
  rightEye.position.set(0.16, 0.15, 0.45);
  grp.add(rightEye);

  const sAuraMat = new THREE.MeshBasicMaterial({ color: 0x220033, transparent: true, opacity: 0.25, side: THREE.BackSide });
  const aura = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), sAuraMat);
  grp.add(aura);

  scene.add(grp);
  const obj = { grp, coreMat: sCoreMat, eyeMat: sEyeMat, auraMat: sAuraMat };
  shadeMeshMap.set(s.id, obj);
  return obj;
}

// ── Drifter (Gió Lạc) Visuals ──
const drifterMeshMap = new Map();
function getOrCreateDrifter(d) {
  if (drifterMeshMap.has(d.id)) return drifterMeshMap.get(d.id);
  const grp = new THREE.Group();
  grp.position.set(d.pos[0], d.pos[1] + 1.2, d.pos[2]);

  const ribbonGeo = new THREE.PlaneGeometry(0.4, 1.8, 6, 6);
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0x74b9ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65
  });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.rotation.x = Math.PI / 3;
  grp.add(ribbon);

  const dLight = new THREE.PointLight(0x0984e3, 1.0, 6);
  grp.add(dLight);

  scene.add(grp);
  const obj = { grp, ribbon, ribbonMat, dLight };
  drifterMeshMap.set(d.id, obj);
  return obj;
}

// ── Procedural Web Audio SFX ──
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }
  playPickup() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }
  playDeposit() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }
  playPulse() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
  playDash() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }
  playJump() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }
}
const sfx = new SoundFX();
addEventListener("pointerdown", () => sfx.init(), { once: true });
addEventListener("keydown", () => sfx.init(), { once: true });

const soundToggleBtn = document.getElementById("sound-toggle");
if (soundToggleBtn) {
  soundToggleBtn.addEventListener("click", () => {
    sfx.init();
    sfx.muted = !sfx.muted;
    soundToggleBtn.textContent = sfx.muted ? "🔇" : "🔊";
  });
}

// ── Phase 4: Configurable Keybindings with Conflict Detection ──
const DEFAULT_KEYBINDINGS = {
  forward: "KeyW",
  backward: "KeyS",
  left: "KeyA",
  right: "KeyD",
  jump: "Space",
  dash: "ShiftLeft",
  interact: "KeyE",
  pulse: "KeyQ",
  pause: "KeyP"
};

const ACTION_LABELS = {
  forward: "Đi tới",
  backward: "Đi lùi",
  left: "Sang trái",
  right: "Sang phải",
  jump: "Nhảy",
  dash: "Lướt",
  interact: "Tương tác / Nạp đèn",
  pulse: "Tỏa sáng",
  pause: "Tạm dừng"
};

let userKeybindings = { ...DEFAULT_KEYBINDINGS };
try {
  const saved = localStorage.getItem("dao_den_long_keys");
  if (saved) {
    userKeybindings = { ...DEFAULT_KEYBINDINGS, ...JSON.parse(saved) };
  }
} catch (e) {}

// Keybindings Modal elements
const controlsModal = document.getElementById("controls-modal");
const ctrlBindingsList = document.getElementById("ctrl-bindings-list");
const ctrlConflictMsg = document.getElementById("ctrl-conflict-msg");
const btnResetKeys = document.getElementById("btn-reset-keys");
const btnCloseKeys = document.getElementById("btn-close-keys");
const btnOpenControls = document.getElementById("btn-open-controls");

let listeningAction = null;

function renderKeybindingsList() {
  if (!ctrlBindingsList) return;
  ctrlBindingsList.innerHTML = "";

  // Check conflicts
  const counts = {};
  for (const act of Object.keys(userKeybindings)) {
    const code = userKeybindings[act];
    counts[code] = (counts[code] || 0) + 1;
  }
  const hasConflict = Object.values(counts).some((c) => c > 1);
  if (ctrlConflictMsg) {
    ctrlConflictMsg.textContent = hasConflict ? "⚠ Phát hiện phím trùng! Vui lòng chọn phím khác để tránh xung đột." : "";
  }

  for (const [action, label] of Object.entries(ACTION_LABELS)) {
    const row = document.createElement("div");
    row.className = "ctrl-row";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;
    row.appendChild(labelSpan);

    const keyBtn = document.createElement("button");
    const code = userKeybindings[action];
    keyBtn.className = `key-btn-bind${counts[code] > 1 ? " conflict" : ""}${listeningAction === action ? " listening" : ""}`;
    keyBtn.textContent = listeningAction === action ? "Bấm phím..." : code.replace("Key", "");

    keyBtn.addEventListener("click", () => {
      listeningAction = action;
      renderKeybindingsList();
    });

    row.appendChild(keyBtn);
    ctrlBindingsList.appendChild(row);
  }
}

if (btnOpenControls) {
  btnOpenControls.addEventListener("click", () => {
    controlsModal.style.display = "flex";
    renderKeybindingsList();
  });
}
if (btnCloseKeys) {
  btnCloseKeys.addEventListener("click", () => {
    controlsModal.style.display = "none";
    listeningAction = null;
    try {
      localStorage.setItem("dao_den_long_keys", JSON.stringify(userKeybindings));
    } catch (e) {}
  });
}
if (btnResetKeys) {
  btnResetKeys.addEventListener("click", () => {
    userKeybindings = { ...DEFAULT_KEYBINDINGS };
    listeningAction = null;
    try {
      localStorage.setItem("dao_den_long_keys", JSON.stringify(userKeybindings));
    } catch (e) {}
    renderKeybindingsList();
  });
}

// ── Subtitles / Visual Alerts ──
const subtitlesBanner = document.getElementById("subtitles-banner");
let subtitleTimeout = null;
function showSubtitle(text, durationMs = 3200) {
  if (!subtitlesBanner) return;
  subtitlesBanner.textContent = text;
  subtitlesBanner.style.display = "block";
  clearTimeout(subtitleTimeout);
  subtitleTimeout = setTimeout(() => {
    subtitlesBanner.style.display = "none";
  }, durationMs);
}

// ── Accessibility: Font Scaling & Reduced Motion ──
const fontToggleBtn = document.getElementById("font-toggle");
let isLargeFont = localStorage.getItem("dao_den_long_large_font") === "true";
if (isLargeFont) document.body.classList.add("large-font");
if (fontToggleBtn) {
  fontToggleBtn.textContent = isLargeFont ? "A- Chữ Chuẩn" : "A+ Chữ Lớn";
  fontToggleBtn.addEventListener("click", () => {
    isLargeFont = !isLargeFont;
    document.body.classList.toggle("large-font", isLargeFont);
    fontToggleBtn.textContent = isLargeFont ? "A- Chữ Chuẩn" : "A+ Chữ Lớn";
    localStorage.setItem("dao_den_long_large_font", String(isLargeFont));
  });
}

const motionToggleBtn = document.getElementById("motion-toggle");
let isReducedMotion = localStorage.getItem("dao_den_long_reduced_motion") === "true";
if (isReducedMotion) document.body.classList.add("reduced-motion");
if (motionToggleBtn) {
  motionToggleBtn.textContent = isReducedMotion ? "🌊 Giảm rung: BẬT" : "🌊 Giảm rung";
  motionToggleBtn.style.color = isReducedMotion ? "#0be881" : "#c8d0de";
  motionToggleBtn.addEventListener("click", () => {
    isReducedMotion = !isReducedMotion;
    document.body.classList.toggle("reduced-motion", isReducedMotion);
    motionToggleBtn.textContent = isReducedMotion ? "🌊 Giảm rung: BẬT" : "🌊 Giảm rung";
    motionToggleBtn.style.color = isReducedMotion ? "#0be881" : "#c8d0de";
    localStorage.setItem("dao_den_long_reduced_motion", String(isReducedMotion));
  });
}

// ── Leaderboard UI & API ──
const lbModal = document.getElementById("leaderboard-modal");
const btnOpenLb = document.getElementById("btn-open-lb");
const btnCloseLb = document.getElementById("btn-close-lb");
const lbTableBody = document.getElementById("lb-table-body");
const playerNameInput = document.getElementById("player-name-input");
const btnSaveScore = document.getElementById("btn-save-score");
const lbSubmitMsg = document.getElementById("lb-submit-msg");

async function fetchAndRenderLeaderboard() {
  if (!lbTableBody) return;
  lbTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#6b7a94;padding:20px;">Đang tải dữ liệu...</td></tr>';
  try {
    const res = await fetch("/api/leaderboard");
    const data = await res.json();
    if (!data.entries || data.entries.length === 0) {
      lbTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#6b7a94;padding:20px;">Chưa có dữ liệu bảng xếp hạng.</td></tr>';
      return;
    }
    let html = "";
    data.entries.forEach((e, idx) => {
      const d = new Date(e.achieved_at);
      const dateStr = `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      html += `<tr>
        <td class="lb-rank">#${idx + 1}</td>
        <td><strong>${e.name}</strong></td>
        <td class="lb-score">${e.score}</td>
        <td>Đêm ${e.nights_won}</td>
        <td style="color:#7a89a4;font-size:11px;">${dateStr}</td>
      </tr>`;
    });
    lbTableBody.innerHTML = html;
  } catch (err) {
    lbTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#ff5e57;padding:20px;">Không thể tải bảng xếp hạng từ máy chủ.</td></tr>';
  }
}

if (btnOpenLb) {
  btnOpenLb.addEventListener("click", () => {
    lbModal.style.display = "flex";
    fetchAndRenderLeaderboard();
  });
}
if (btnCloseLb) {
  btnCloseLb.addEventListener("click", () => {
    lbModal.style.display = "none";
  });
}

if (btnSaveScore && playerNameInput) {
  btnSaveScore.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    if (name.length < 3 || name.length > 12) {
      if (lbSubmitMsg) {
        lbSubmitMsg.style.color = "#ff5e57";
        lbSubmitMsg.textContent = "⚠ Tên phải từ 3 đến 12 ký tự!";
      }
      return;
    }
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          score: sim.score,
          nights_won: sim.state === "won" ? currentNight : Math.max(0, currentNight - 1),
          seed: sim.seed
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (lbSubmitMsg) {
          lbSubmitMsg.style.color = "#0be881";
          lbSubmitMsg.textContent = "✔ Đã lưu thành tích vào Bảng Xếp Hạng!";
        }
        btnSaveScore.disabled = true;
      } else {
        if (lbSubmitMsg) {
          lbSubmitMsg.style.color = "#ff5e57";
          lbSubmitMsg.textContent = `⚠ ${data.error || "Lỗi lưu bảng xếp hạng"}`;
        }
      }
    } catch (err) {
      if (lbSubmitMsg) {
        lbSubmitMsg.style.color = "#ff5e57";
        lbSubmitMsg.textContent = "⚠ Không thể kết nối tới máy chủ!";
      }
    }
  });
}

// ── Colorblind Mode & Drain Tethers ──
let colorblindMode = false;
const cbToggleBtn = document.getElementById("cb-toggle");
if (cbToggleBtn) {
  cbToggleBtn.addEventListener("click", () => {
    colorblindMode = !colorblindMode;
    cbToggleBtn.textContent = colorblindMode ? "👁 Mù màu: BẬT" : "👁 Mù màu: Tắt";
    cbToggleBtn.style.color = colorblindMode ? "#00B3FF" : "#c8d0de";
    document.body.classList.toggle("colorblind", colorblindMode);
  });
}

const drainTethers = new Map();
const edgeIndicatorsContainer = document.getElementById("edge-indicators");

// ── Input Handling with Rebound Keys ──
const keys = {};
addEventListener("keydown", (e) => {
  if (listeningAction) {
    userKeybindings[listeningAction] = e.code;
    listeningAction = null;
    renderKeybindingsList();
    e.preventDefault();
    return;
  }

  keys[e.code] = true;
  if (e.code === userKeybindings.pause || e.code === "Escape") {
    sim.currentInput.pause = true;
  }
});

addEventListener("keyup", (e) => {
  keys[e.code] = false;
  if (e.code === userKeybindings.pause || e.code === "Escape") {
    sim.currentInput.pause = false;
  }
});

// ── HUD Elements ──
const flamesBar = document.getElementById("flames-bar");
const carriedVal = document.getElementById("carried-val");
const carriedBar = document.getElementById("carried-bar");
const lanternsVal = document.getElementById("lanterns-val");
const lanternsBar = document.getElementById("lanterns-bar");
const scoreVal = document.getElementById("score-val");
const timerDisplay = document.getElementById("timer-display");
const proximityHint = document.getElementById("proximity-hint");
const pauseOverlay = document.getElementById("pause-overlay");
const modalEl = document.getElementById("game-over-modal");
const modalTitle = document.getElementById("game-over-title");
const modalScore = document.getElementById("game-over-score");
const dashCdText = document.getElementById("dash-cd-text");
const dashCdBar = document.getElementById("dash-cd-bar");
const pulseCdText = document.getElementById("pulse-cd-text");
const pulseCdBar = document.getElementById("pulse-cd-bar");
const charmBanner = document.getElementById("charm-banner");
const windBanner = document.getElementById("wind-banner");

function updateFlamesUI() {
  const max = sim.tuning.flames;
  let html = "";
  for (let i = 0; i < max; i++) {
    const cls = i < sim.player.flames ? "" : " lost";
    html += `<svg class="flame-icon${cls}" viewBox="0 0 24 24"><path fill="${i < sim.player.flames ? '#ff5e57' : '#333'}" d="M12 2c-1 4-4 6-4 10a4 4 0 0 0 8 0c0-4-3-6-4-10z"/></svg>`;
  }
  flamesBar.innerHTML = html;
}
updateFlamesUI();

// ── Fixed Timestep Game Loop (60Hz) ──
let accumulator = 0;
let lastTime = performance.now();
const DT = 1 / 60;
const BASE_CAM_DIST = 16.0;
const BASE_CAM_HEIGHT = 9.5;

function animate(now) {
  requestAnimationFrame(animate);
  const frameTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += frameTime;

  while (accumulator >= DT) {
    let mx = 0;
    let mz = 0;
    if (keys[userKeybindings.forward] || (userKeybindings.forward === "KeyW" && keys["ArrowUp"])) mz -= 1;
    if (keys[userKeybindings.backward] || (userKeybindings.backward === "KeyS" && keys["ArrowDown"])) mz += 1;
    if (keys[userKeybindings.left] || (userKeybindings.left === "KeyA" && keys["ArrowLeft"])) mx -= 1;
    if (keys[userKeybindings.right] || (userKeybindings.right === "KeyD" && keys["ArrowRight"])) mx += 1;

    sim.currentInput.move = [mx, mz];
    sim.currentInput.cam_yaw_deg = 0;
    sim.currentInput.jump = !!keys[userKeybindings.jump];
    sim.currentInput.interact = !!keys[userKeybindings.interact];
    sim.currentInput.pulse = !!keys[userKeybindings.pulse];
    sim.currentInput.dash = !!keys[userKeybindings.dash];

    const prevCarried = sim.player.carried;
    const prevPulseCD = sim.player.pulse_cd_ticks;
    const prevDashLeft = sim.player.dash_ticks_left;
    const prevPosY = sim.player.pos[1];

    sim.step();

    if (sim.currentInput.pause) {
      sim.currentInput.pause = false;
    }

    // Sound triggers
    if (sim.player.pos[1] > 0.1 && prevPosY <= 0.001) {
      sfx.playJump();
    }
    if (sim.player.carried > prevCarried) {
      sfx.playPickup();
    }
    if (sim.player.dash_ticks_left > 0 && prevDashLeft === 0) {
      sfx.playDash();
    }
    const events = sim.flushEvents();
    for (const ev of events) {
      if (ev.name === "deposit") sfx.playDeposit();
      if (ev.name === "shade_spawn") showSubtitle("👻 Bóng Mực vừa xuất hiện ở góc đảo!");
      if (ev.name === "lantern_out") showSubtitle(`⚠ Đèn ${ev.data.lantern_id} vừa cạn dầu và tắt!`);
      if (ev.name === "refuel") showSubtitle(`✨ Đã châm thêm ${ev.data.amount} đom đóm vào đèn!`);
      if (ev.name === "lantern_lit") showSubtitle(`🏮 Đèn ${ev.data.lantern_id} đã được thắp sáng rực rỡ!`);
    }

    if (sim.player.pulse_cd_ticks > 0 && prevPulseCD === 0) {
      sfx.playPulse();
      pulseAnim = 1.0;
      pulseWave.position.set(sim.player.pos[0], sim.player.pos[1] + 0.15, sim.player.pos[2]);
    }

    accumulator -= DT;
  }

  const px = sim.player.pos[0];
  const py = sim.player.pos[1];
  const pz = sim.player.pos[2];

  if (pauseOverlay) {
    pauseOverlay.style.display = sim.is_paused ? "flex" : "none";
  }

  // Animate Ocean Waves
  const timeSec = now * 0.0015;
  for (let i = 0; i < seaPosAttr.count; i++) {
    const u = seaPosAttr.getX(i);
    const v = seaPosAttr.getY(i);
    const wave = Math.sin(u * 0.05 + timeSec) * 0.45 + Math.cos(v * 0.05 + timeSec * 1.2) * 0.35;
    seaPosAttr.setZ(i, seaInitialY[i] + wave);
  }
  seaPosAttr.needsUpdate = true;

  // Animate Floating Sky Lanterns in distance
  for (const sl of skyLanterns) {
    sl.mesh.position.y = sl.initialY + Math.sin(now * 0.002 * sl.speed) * 1.5;
  }

  // Sync Player
  playerGroup.position.set(px, py, pz);

  const moveX = sim.currentInput.move[0];
  const moveZ = sim.currentInput.move[1];
  if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
    playerGroup.rotation.y = Math.atan2(-moveX, -moveZ);
  }

  // Bobbing & staff sway
  const bob = Math.sin(now * 0.007) * 0.04;
  playerGroup.position.y += bob;
  hStaffGroup.rotation.z = Math.sin(now * 0.005) * 0.08;

  // Animate Companion "Lạc"
  const compAngle = now * 0.0035;
  const targetCX = px + Math.cos(compAngle) * 1.3;
  const targetCZ = pz + Math.sin(compAngle) * 1.3;
  const targetCY = py + 1.8 + Math.sin(now * 0.006) * 0.25;
  companionGroup.position.x += (targetCX - companionGroup.position.x) * 0.12;
  companionGroup.position.y += (targetCY - companionGroup.position.y) * 0.12;
  companionGroup.position.z += (targetCZ - companionGroup.position.z) * 0.12;

  // Danger warning glow if Shade is within 8 meters
  const shadeNearby = sim.shades.some((s) => Math.hypot(px - s.pos[0], pz - s.pos[2]) < 8.0);
  if (shadeNearby) {
    compMesh.material.color.setHex(0xff4757);
    compLight.color.setHex(0xff4757);
    compLight.intensity = 2.0;
  } else {
    compMesh.material.color.setHex(0xffeaa7);
    compLight.color.setHex(0xffd32a);
    compLight.intensity = 1.2;
  }

  // Camera Follow with dynamic zoom
  camera.position.set(px, py + BASE_CAM_HEIGHT * zoomFactor, pz + BASE_CAM_DIST * zoomFactor);
  camera.lookAt(px, py + 1.4, pz);

  // Sync Grand Lanterns
  for (const l of sim.lanterns) {
    const visual = lanternVisuals.get(l.id);
    if (!visual) continue;

    // Billboard fuel gauge to camera
    if (visual.fuelBarGroup) {
      visual.fuelBarGroup.quaternion.copy(camera.quaternion);
    }

    if (l.lit) {
      visual.fuelBarGroup.visible = true;
      const fuelPct = Math.max(0, Math.min(1.0, l.fuel / 100));
      visual.fuelFill.scale.x = fuelPct;
      visual.fuelFill.position.x = -0.75 * (1 - fuelPct);

      // Low fuel blink (< 30) at 1 Hz
      const isLowFuel = l.fuel < 30;
      const blink = isLowFuel ? Math.sin(now * 0.00628) > 0 : true;

      if (isLowFuel) {
        visual.fuelFillMat.color.setHex(colorblindMode ? 0xffffff : 0xff5e57);
      } else if (l.fuel < 60) {
        visual.fuelFillMat.color.setHex(0xffd32a);
      } else {
        visual.fuelFillMat.color.setHex(0x0be881);
      }

      visual.chamberMat.color.setHex(0xffbe76);
      visual.fireMat.opacity = blink ? (0.85 + Math.sin(now * 0.008) * 0.15) : 0.2;
      visual.lLight.intensity = blink ? (3.0 + Math.sin(now * 0.006) * 0.6) : 0.4;
      visual.fuelBarGroup.visible = blink;

      // Safe ring active ONLY if fuel >= 30
      if (l.fuel >= 30) {
        visual.safeRingMat.opacity = 0.5 + Math.sin(now * 0.004) * 0.15;
      } else {
        visual.safeRingMat.opacity = 0;
      }

      visual.lGroup.scale.set(1.0, 1.0, 1.0);
      visual.tearMarker.visible = false;
    } else {
      visual.fuelBarGroup.visible = false;
      const cost = l.ever_lit ? sim.tuning.relight_cost : sim.tuning.lantern_cost;
      visual.fireMat.opacity = (l.deposited / cost) * 0.4;
      visual.lLight.intensity = (l.deposited / cost) * 0.8;
      visual.safeRingMat.opacity = 0;

      // Colorblind mode: Unlit lantern is squashed 20% on Y and shows tear texture / marker
      if (colorblindMode) {
        visual.lGroup.scale.set(1.0, 0.8, 1.0);
        visual.tearMarker.visible = true;
      } else {
        visual.lGroup.scale.set(1.0, 1.0, 1.0);
        visual.tearMarker.visible = false;
      }
    }
  }

  // Sync Charms
  for (const c of sim.charms) {
    const visual = getOrCreateCharm(c);
    visual.grp.visible = c.available;
    if (c.available) {
      visual.grp.rotation.y = now * 0.002;
      visual.grp.position.y = c.pos[1] + 0.8 + Math.sin(now * 0.005) * 0.15;
    }
  }

  // Sync Motes
  syncMotes();
  for (const [, grp] of moteMeshMap.entries()) {
    grp.position.y += Math.sin(now * 0.004 + grp.position.x) * 0.01;
    grp.rotation.y = now * 0.003;
  }

  // Sync Shades & Drain Tethers
  const currentShadeIds = new Set(sim.shades.map((s) => s.id));
  for (const [shadeId, tether] of drainTethers.entries()) {
    if (!currentShadeIds.has(shadeId)) {
      scene.remove(tether);
      drainTethers.delete(shadeId);
    }
  }

  for (const s of sim.shades) {
    const obj = getOrCreateShade(s);
    obj.grp.position.set(s.pos[0], s.pos[1] + 0.75, s.pos[2]);

    const dx = px - s.pos[0];
    const dz = pz - s.pos[2];
    obj.grp.rotation.y = Math.atan2(dx, dz);

    // Drain tether visual
    if (s.state === "drain" && s.target_lantern_id) {
      const tLantern = sim.lanterns.find((l) => l.id === s.target_lantern_id);
      if (tLantern) {
        let tether = drainTethers.get(s.id);
        if (!tether) {
          const tGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(s.pos[0], s.pos[1] + 0.75, s.pos[2]),
            new THREE.Vector3(tLantern.pos[0], tLantern.pos[1] + 2.45, tLantern.pos[2])
          ]);
          const tMat = new THREE.LineBasicMaterial({
            color: colorblindMode ? 0x00b3ff : 0x8e44ad,
            linewidth: 3
          });
          tether = new THREE.Line(tGeo, tMat);
          scene.add(tether);
          drainTethers.set(s.id, tether);
        }
        tether.visible = true;
        const posAttr = tether.geometry.attributes.position;
        posAttr.setXYZ(0, s.pos[0], s.pos[1] + 0.75, s.pos[2]);
        posAttr.setXYZ(1, tLantern.pos[0], tLantern.pos[1] + 2.45, tLantern.pos[2]);
        posAttr.needsUpdate = true;
        tether.material.color.setHex(colorblindMode ? 0x00b3ff : 0x8e44ad);
      }
    } else {
      const tether = drainTethers.get(s.id);
      if (tether) tether.visible = false;
    }

    if (s.state === "stunned") {
      obj.coreMat.color.setHex(0x3867d6);
      obj.eyeMat.color.setHex(colorblindMode ? 0x00b3ff : 0x4bcffa);
      obj.auraMat.color.setHex(colorblindMode ? 0x00b3ff : 0x0fbcf9);
      obj.auraMat.opacity = 0.35;
      obj.grp.position.x += (Math.random() - 0.5) * 0.08;
    } else {
      obj.coreMat.color.setHex(0x020202);
      obj.eyeMat.color.setHex(colorblindMode ? 0x00b3ff : 0xff3838);
      obj.auraMat.color.setHex(colorblindMode ? 0x00b3ff : (s.state === "drain" ? 0x8e44ad : 0x220033));
      obj.auraMat.opacity = 0.25 + Math.sin(now * 0.006) * 0.08;
    }
  }

  // Sync Drifters
  for (const d of sim.drifters) {
    const obj = getOrCreateDrifter(d);
    obj.grp.visible = d.state !== "removed";
    obj.grp.position.set(d.pos[0], d.pos[1] + 1.2 + Math.sin(now * 0.005) * 0.2, d.pos[2]);
    obj.ribbon.rotation.y = now * 0.003;
  }

  // Pulse Wave Expansion
  if (pulseAnim > 0) {
    pulseAnim = Math.max(0, pulseAnim - 0.025);
    const r = (1 - pulseAnim) * sim.tuning.pulse_radius;
    pulseWave.scale.set(r, r, r);
    pulseWaveMat.opacity = pulseAnim * 0.7;
  }

  // Proximity Hint
  let hintText = "";
  for (const l of sim.lanterns) {
    const d = Math.hypot(px - l.pos[0], pz - l.pos[2]);
    if (d <= sim.tuning.interact_radius + 0.5) {
      if (!l.lit && sim.player.carried > 0) {
        const cost = l.ever_lit ? sim.tuning.relight_cost : sim.tuning.lantern_cost;
        hintText = `Nhấn <span class="key" style="display:inline-flex;margin:0 2px;">E</span> để thắp đèn (${l.deposited}/${cost})`;
        break;
      } else if (l.lit && l.fuel < 100 && sim.player.carried > 0) {
        hintText = `Nhấn <span class="key" style="display:inline-flex;margin:0 2px;">E</span> để châm dầu (Dầu: ${Math.round(l.fuel)}%)`;
        break;
      }
    }
  }
  if (hintText) {
    proximityHint.innerHTML = hintText;
    proximityHint.style.display = "block";
  } else {
    proximityHint.style.display = "none";
  }

  // Update HUD
  updateFlamesUI();
  const cap = sim.capacity;
  carriedVal.textContent = `${sim.player.carried}/${cap}`;
  carriedBar.style.width = `${(sim.player.carried / cap) * 100}%`;

  const litCount = sim.lanterns.filter((l) => l.lit).length;
  const total = sim.lanterns.length;
  const req = Math.ceil((sim.tuning.win_ratio || 0.6) * total);
  lanternsVal.textContent = `${litCount}/${total} (Cần: ${req})`;
  lanternsBar.style.width = `${(litCount / total) * 100}%`;

  scoreVal.textContent = sim.score;

  const secs = Math.max(0, Math.ceil(sim.time_left_s));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const warnPrefix = colorblindMode && secs <= 30 ? "⚠ " : "";
  timerDisplay.textContent = `${warnPrefix}${mm}:${ss}`;
  timerDisplay.className = secs <= 30 ? "warning" : "";

  // Dash & Pulse cooldowns
  if (dashCdText && dashCdBar) {
    const cdSec = sim.player.dash_cd_ticks / 60;
    if (sim.player.charm_ticks > 0) {
      dashCdText.textContent = "0.0s (Bùa)";
      dashCdBar.style.width = "100%";
      dashCdBar.className = "cd-bar-fill";
    } else if (sim.player.dash_cd_ticks > 0) {
      dashCdText.textContent = `${cdSec.toFixed(1)}s`;
      const pct = (1 - sim.player.dash_cd_ticks / sim.tuning.dash_cooldown_ticks) * 100;
      dashCdBar.style.width = `${pct}%`;
      dashCdBar.className = "cd-bar-fill cooldown";
    } else {
      dashCdText.textContent = "Sẵn sàng";
      dashCdBar.style.width = "100%";
      dashCdBar.className = "cd-bar-fill";
    }
  }

  if (pulseCdText && pulseCdBar) {
    const cdSec = sim.player.pulse_cd_ticks / 60;
    if (sim.player.pulse_cd_ticks > 0) {
      pulseCdText.textContent = `${cdSec.toFixed(1)}s`;
      const pct = (1 - sim.player.pulse_cd_ticks / sim.tuning.pulse_cooldown_ticks) * 100;
      pulseCdBar.style.width = `${pct}%`;
      pulseCdBar.className = "cd-bar-fill cooldown";
    } else {
      pulseCdText.textContent = "Sẵn sàng (3 đom đóm)";
      pulseCdBar.style.width = "100%";
      pulseCdBar.className = "cd-bar-fill";
    }
  }

  // Charm Banner
  if (charmBanner) {
    charmBanner.style.display = sim.player.charm_ticks > 0 ? "block" : "none";
  }

  // Wind Banner (Night 3)
  if (windBanner) {
    windBanner.style.display = sim.wind.active ? "block" : "none";
  }

  // 10s countdown alert
  if (secs === 10 && !window._warned10s) {
    window._warned10s = true;
    showSubtitle("⏰ 10 GIÂY CUỐI CÙNG TỚI BÌNH MINH!");
  } else if (secs !== 10) {
    window._warned10s = false;
  }

  // Edge screen directional arrows for nearby threatening Shades
  if (edgeIndicatorsContainer) {
    let edgeHtml = "";
    for (const s of sim.shades) {
      const dPlayer = Math.hypot(px - s.pos[0], pz - s.pos[2]);
      if (dPlayer < 24.0) {
        const v = new THREE.Vector3(s.pos[0], s.pos[1] + 0.8, s.pos[2]);
        v.project(camera);
        if (Math.abs(v.x) > 0.82 || Math.abs(v.y) > 0.82 || v.z > 1.0) {
          const angle = Math.atan2(v.y, v.x);
          const screenX = Math.max(30, Math.min(innerWidth - 30, (v.x * 0.5 + 0.5) * innerWidth));
          const screenY = Math.max(30, Math.min(innerHeight - 30, (-v.y * 0.5 + 0.5) * innerHeight));
          const deg = (angle * 180 / Math.PI) - 90;
          edgeHtml += `<div class="edge-arrow" style="left:${screenX}px;top:${screenY}px;transform:translate(-50%,-50%) rotate(${deg}deg);"></div>`;
        }
      }
    }
    edgeIndicatorsContainer.innerHTML = edgeHtml;
  }

  // Game Over Modal
  if (sim.state === "won" || sim.state === "lost") {
    modalEl.style.display = "flex";
    if (sim.state === "won") {
      modalTitle.textContent = "🎉 CHIẾN THẮNG!";
      modalTitle.style.color = "#0be881";
    } else {
      modalTitle.textContent = "💀 THẤT BẠI!";
      modalTitle.style.color = "#ff5e57";
    }
    modalScore.textContent = `Điểm số cuối cùng: ${sim.score}`;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
