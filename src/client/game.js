import { Simulation } from "/core/simulation.js";

// ── Initialize Simulation ──
const sim = new Simulation({ seed: Date.now() });

const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020512);
scene.fog = new THREE.FogExp2(0x060c24, 0.016);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 800);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// ── Atmospheric Lighting ──
const ambientLight = new THREE.AmbientLight(0x1c2b50, 0.7);
scene.add(ambientLight);

const moonDir = new THREE.DirectionalLight(0x88aaff, 1.1);
moonDir.position.set(60, 80, -60);
moonDir.castShadow = true;
moonDir.shadow.mapSize.set(1024, 1024);
moonDir.shadow.camera.near = 20;
moonDir.shadow.camera.far = 250;
moonDir.shadow.camera.left = -45;
moonDir.shadow.camera.right = 45;
moonDir.shadow.camera.top = 45;
moonDir.shadow.camera.bottom = -45;
scene.add(moonDir);

const skyHemisphere = new THREE.HemisphereLight(0x3d5a80, 0x050a14, 0.5);
scene.add(skyHemisphere);

// ── Giant Glowing Moon ──
const moonMeshGeo = new THREE.SphereGeometry(14, 32, 32);
const moonMeshMat = new THREE.MeshBasicMaterial({ color: 0xfffaea });
const moonMesh = new THREE.Mesh(moonMeshGeo, moonMeshMat);
moonMesh.position.set(100, 110, -160);
scene.add(moonMesh);

const moonAuraGeo = new THREE.SphereGeometry(22, 32, 32);
const moonAuraMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, transparent: true, opacity: 0.12, side: THREE.BackSide });
const moonAura = new THREE.Mesh(moonAuraGeo, moonAuraMat);
moonAura.position.copy(moonMesh.position);
scene.add(moonAura);

// ── Starfield ──
const starCount = 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  const r = 240 + Math.random() * 80;
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10;
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: true, transparent: true, opacity: 0.85 });
scene.add(new THREE.Points(starGeo, starMat));

// ── Animated Ocean ──
const seaGeo = new THREE.PlaneGeometry(500, 500, 48, 48);
const seaMat = new THREE.MeshStandardMaterial({
  color: 0x030a1c,
  roughness: 0.15,
  metalness: 0.85,
  flatShading: true
});
const seaMesh = new THREE.Mesh(seaGeo, seaMat);
seaMesh.rotation.x = -Math.PI / 2;
seaMesh.position.y = -3.2;
scene.add(seaMesh);
const seaPosAttr = seaGeo.attributes.position;
const seaInitialY = new Float32Array(seaPosAttr.count);
for (let i = 0; i < seaPosAttr.count; i++) {
  seaInitialY[i] = seaPosAttr.getZ(i);
}

// ── Island (Đảo Bến) ──
const ISLAND_R = sim.tuning.island_radius || 30.0;

// Main Island Cliff
const landGeo = new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 6, 4.5, 64);
const landMat = new THREE.MeshStandardMaterial({ color: 0x141f17, roughness: 0.95 });
const land = new THREE.Mesh(landGeo, landMat);
land.position.y = -2.25;
land.receiveShadow = true;
scene.add(land);

// Lush Dark Grass on Top
const grassGeo = new THREE.RingGeometry(0, ISLAND_R, 64);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x19331d, roughness: 0.9, side: THREE.DoubleSide });
const grass = new THREE.Mesh(grassGeo, grassMat);
grass.rotation.x = -Math.PI / 2;
grass.position.y = 0.01;
grass.receiveShadow = true;
scene.add(grass);

// Sand Shoreline
const sandGeo = new THREE.RingGeometry(ISLAND_R - 2.5, ISLAND_R + 1.5, 64);
const sandMat = new THREE.MeshStandardMaterial({ color: 0x3b3323, roughness: 0.9, side: THREE.DoubleSide });
const sand = new THREE.Mesh(sandGeo, sandMat);
sand.rotation.x = -Math.PI / 2;
sand.position.y = 0.005;
sand.receiveShadow = true;
scene.add(sand);

// Central Plaza Stone
const centerPlazaGeo = new THREE.CylinderGeometry(3.5, 3.8, 0.1, 16);
const centerPlazaMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.8 });
const centerPlaza = new THREE.Mesh(centerPlazaGeo, centerPlazaMat);
centerPlaza.position.y = 0.04;
centerPlaza.receiveShadow = true;
scene.add(centerPlaza);

// Stone Pathways leading to 5 Lanterns
for (const lantern of sim.lanterns) {
  const lx = lantern.pos[0];
  const lz = lantern.pos[2];
  const steps = 14;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const px = lx * t + (Math.random() - 0.5) * 0.4;
    const pz = lz * t + (Math.random() - 0.5) * 0.4;
    const r = 0.4 + Math.random() * 0.3;
    const stepGeo = new THREE.CylinderGeometry(r, r + 0.1, 0.05, 8);
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x3d4351, roughness: 0.85 });
    const step = new THREE.Mesh(stepGeo, stepMat);
    step.position.set(px, 0.03, pz);
    step.receiveShadow = true;
    scene.add(step);
  }
}

// Wooden Pier / Docks (Đảo Bến)
const pierGroup = new THREE.Group();
pierGroup.position.set(0, -0.2, ISLAND_R - 1);
const deckGeo = new THREE.BoxGeometry(4.5, 0.3, 14);
const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
const deck = new THREE.Mesh(deckGeo, woodMat);
deck.position.set(0, 0, 6);
deck.castShadow = true;
deck.receiveShadow = true;
pierGroup.add(deck);

// Pier pilings
for (let z = 1; z <= 12; z += 3.5) {
  for (const x of [-2, 2]) {
    const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 4, 8);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(x, -1.8, z);
    post.castShadow = true;
    pierGroup.add(post);
  }
}
scene.add(pierGroup);

// Decorative Torii / Stone Arch at center entrance
const archGroup = new THREE.Group();
archGroup.position.set(0, 0, 5);
const archPillarMat = new THREE.MeshStandardMaterial({ color: 0xb33939, roughness: 0.5 });
const archBeamMat = new THREE.MeshStandardMaterial({ color: 0x222f3e, roughness: 0.4 });

const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4, 12), archPillarMat);
leftPillar.position.set(-2, 2, 0);
archGroup.add(leftPillar);

const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 4, 12), archPillarMat);
rightPillar.position.set(2, 2, 0);
archGroup.add(rightPillar);

const topBeam = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 0.6), archBeamMat);
topBeam.position.set(0, 4.1, 0);
archGroup.add(topBeam);
scene.add(archGroup);

// Pine Trees on island
for (let i = 0; i < 14; i++) {
  const angle = (i / 14) * Math.PI * 2 + 0.3;
  const r = 9 + (i % 3) * 6;
  const tree = new THREE.Group();
  tree.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x3e2723 }));
  trunk.position.y = 0.8;
  tree.add(trunk);

  const foliageColor = 0x0d2818;
  const fMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.85 });
  for (let level = 0; level < 3; level++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6 - level * 0.4, 1.5, 8), fMat);
    cone.position.y = 1.8 + level * 0.9;
    cone.castShadow = true;
    tree.add(cone);
  }
  scene.add(tree);
}

// ── Stylized Character: Mây (Người giữ đèn) ──
const playerGroup = new THREE.Group();

// Cape / Robe
const robeGeo = new THREE.CylinderGeometry(0.3, 0.55, 1.15, 16);
const robeMat = new THREE.MeshStandardMaterial({ color: 0x0984e3, roughness: 0.5, metalness: 0.1 });
const robe = new THREE.Mesh(robeGeo, robeMat);
robe.position.y = 0.58;
robe.castShadow = true;
playerGroup.add(robe);

// Head
const pHeadGeo = new THREE.SphereGeometry(0.3, 16, 16);
const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xffe0d0, roughness: 0.4 });
const pHead = new THREE.Mesh(pHeadGeo, pHeadMat);
pHead.position.y = 1.35;
pHead.castShadow = true;
playerGroup.add(pHead);

// Eyes
const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e272e });
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-0.1, 1.38, -0.28);
playerGroup.add(leftEye);
const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(0.1, 1.38, -0.28);
playerGroup.add(rightEye);

// Asian Conical Hat (Nón lá)
const hatGeo = new THREE.ConeGeometry(0.65, 0.32, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xe58e26, roughness: 0.6 });
const hat = new THREE.Mesh(hatGeo, hatMat);
hat.position.y = 1.62;
hat.castShadow = true;
playerGroup.add(hat);

// Bamboo Staff & Lantern
const hStaffGroup = new THREE.Group();
const staffGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.6, 8);
const staffMat = new THREE.MeshStandardMaterial({ color: 0x574b3a });
const staff = new THREE.Mesh(staffGeo, staffMat);
staff.position.y = 0.8;
hStaffGroup.add(staff);

// Staff curved hook
const hookGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 16, Math.PI);
const hook = new THREE.Mesh(hookGeo, staffMat);
hook.rotation.z = Math.PI / 2;
hook.position.set(0.18, 1.6, 0);
hStaffGroup.add(hook);

// Hanging Lantern
const hLampGeo = new THREE.OctahedronGeometry(0.22, 0);
const hLampMat = new THREE.MeshStandardMaterial({ color: 0xffdd59, emissive: 0xffa502, emissiveIntensity: 1.2, transparent: true, opacity: 0.95 });
const hLamp = new THREE.Mesh(hLampGeo, hLampMat);
hLamp.position.set(0.36, 1.4, 0);
hStaffGroup.add(hLamp);

hStaffGroup.position.set(0.45, 0, -0.2);
playerGroup.add(hStaffGroup);

// Player Lantern Light Aura
const pLight = new THREE.PointLight(0xffbe76, 2.8, 12);
pLight.position.set(0.8, 1.4, -0.2);
playerGroup.add(pLight);

// Direction indicator arrow at player feet
const arrowShape = new THREE.Shape();
arrowShape.moveTo(0, -0.9);        // tip points forward (-Z)
arrowShape.lineTo(-0.35, -0.3);
arrowShape.lineTo(-0.12, -0.3);
arrowShape.lineTo(-0.12, 0.4);
arrowShape.lineTo(0.12, 0.4);
arrowShape.lineTo(0.12, -0.3);
arrowShape.lineTo(0.35, -0.3);
arrowShape.closePath();

const arrowGeo = new THREE.ShapeGeometry(arrowShape);
const arrowMat = new THREE.MeshBasicMaterial({ color: 0x0be881, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
const dirArrow = new THREE.Mesh(arrowGeo, arrowMat);
dirArrow.rotation.x = -Math.PI / 2;
dirArrow.position.y = 0.05;
playerGroup.add(dirArrow);

scene.add(playerGroup);

// ── 5 Đèn Lồng Lớn (Grand Pagoda Lanterns) ──
const lanternVisuals = new Map();
for (const l of sim.lanterns) {
  const g = new THREE.Group();
  g.position.set(l.pos[0], 0, l.pos[2]);

  // Carved Stone Base
  const baseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x353b48, roughness: 0.85 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // Middle Stone Pillar
  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, 2.6, 8);
  const pillar = new THREE.Mesh(pillarGeo, baseMat);
  pillar.position.y = 1.9;
  pillar.castShadow = true;
  g.add(pillar);

  // Lantern Chamber (Octagonal wood/paper frame)
  const chamberGeo = new THREE.CylinderGeometry(0.9, 0.8, 1.4, 8, 1, true);
  const chamberMat = new THREE.MeshStandardMaterial({ color: 0x718093, roughness: 0.6, wireframe: false, side: THREE.DoubleSide });
  const chamber = new THREE.Mesh(chamberGeo, chamberMat);
  chamber.position.y = 3.6;
  g.add(chamber);

  // Pagoda Curved Roof
  const roofGeo = new THREE.ConeGeometry(1.5, 0.8, 8);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xb33939, roughness: 0.4 });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 4.6;
  roof.castShadow = true;
  g.add(roof);

  // Spire on roof top
  const spireGeo = new THREE.ConeGeometry(0.18, 0.6, 8);
  const spireMat = new THREE.MeshStandardMaterial({ color: 0xdcdde1, metalness: 0.6 });
  const spire = new THREE.Mesh(spireGeo, spireMat);
  spire.position.y = 5.3;
  g.add(spire);

  // Inner Sacred Fire
  const fireGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xffd32a, transparent: true, opacity: 0.0 });
  const fireMesh = new THREE.Mesh(fireGeo, fireMat);
  fireMesh.position.y = 3.6;
  g.add(fireMesh);

  // Safe Radius Halo Ring (illuminates when lit)
  const safeRingGeo = new THREE.RingGeometry(sim.tuning.safe_radius - 0.2, sim.tuning.safe_radius, 48);
  const safeRingMat = new THREE.MeshBasicMaterial({ color: 0xfffa65, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const safeRing = new THREE.Mesh(safeRingGeo, safeRingMat);
  safeRing.rotation.x = -Math.PI / 2;
  safeRing.position.y = 0.08;
  g.add(safeRing);

  // Lantern Point Light
  const lLight = new THREE.PointLight(0xffa502, 0, 22);
  lLight.position.y = 3.6;
  g.add(lLight);

  scene.add(g);
  lanternVisuals.set(l.id, { group: g, chamberMat, fireMat, safeRingMat, lLight });
}

// ── Fireflies / Motes (Đom đóm) ──
const moteMeshMap = new Map();
const moteCoreGeo = new THREE.SphereGeometry(0.2, 10, 10);
const moteCoreMat = new THREE.MeshBasicMaterial({ color: 0x70a1ff });
const moteHaloGeo = new THREE.SphereGeometry(0.4, 8, 8);
const moteHaloMat = new THREE.MeshBasicMaterial({ color: 0x00d2d3, transparent: true, opacity: 0.25 });

function syncMotes() {
  const currentIds = new Set(sim.motes.map((m) => m.id));
  for (const [id, grp] of moteMeshMap.entries()) {
    if (!currentIds.has(id)) {
      scene.remove(grp);
      moteMeshMap.delete(id);
    }
  }
  for (const mote of sim.motes) {
    if (!moteMeshMap.has(mote.id)) {
      const grp = new THREE.Group();
      grp.add(new THREE.Mesh(moteCoreGeo, moteCoreMat));
      grp.add(new THREE.Mesh(moteHaloGeo, moteHaloMat));

      const pLight = new THREE.PointLight(0x00d2d3, 0.8, 5);
      grp.add(pLight);

      grp.position.set(mote.pos[0], 0.8, mote.pos[2]);
      scene.add(grp);
      moteMeshMap.set(mote.id, grp);
    }
  }
}

// ── Ink Shades (Bóng Mực) ──
const shadeMeshMap = new Map();
const shadeCoreGeo = new THREE.SphereGeometry(0.75, 16, 16);

function getOrCreateShade(s) {
  let obj = shadeMeshMap.get(s.id);
  if (!obj) {
    const grp = new THREE.Group();
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.1, metalness: 0.9 });
    const core = new THREE.Mesh(shadeCoreGeo, coreMat);
    core.castShadow = true;
    grp.add(core);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3838 });
    const e1 = new THREE.Mesh(eyeGeo, eyeMat);
    e1.position.set(-0.25, 0.2, -0.65);
    grp.add(e1);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat);
    e2.position.set(0.25, 0.2, -0.65);
    grp.add(e2);

    // Dark Misty Aura
    const auraGeo = new THREE.SphereGeometry(1.25, 12, 12);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0x220033, transparent: true, opacity: 0.25 });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    grp.add(aura);

    const sLight = new THREE.PointLight(0x8854d0, 0.9, 6);
    grp.add(sLight);

    scene.add(grp);
    obj = { grp, coreMat, eyeMat, auraMat, sLight };
    shadeMeshMap.set(s.id, obj);
  }
  return obj;
}

// ── Pulse Wave Effect (Tỏa sáng) ──
const pulseWaveGeo = new THREE.RingGeometry(0.1, 0.45, 64);
const pulseWaveMat = new THREE.MeshBasicMaterial({ color: 0x00d2d3, side: THREE.DoubleSide, transparent: true, opacity: 0 });
const pulseWave = new THREE.Mesh(pulseWaveGeo, pulseWaveMat);
pulseWave.rotation.x = -Math.PI / 2;
pulseWave.position.y = 0.12;
scene.add(pulseWave);
let pulseAnim = 0;

// ── Input Handling ──
const keys = {};
addEventListener("keydown", (e) => { keys[e.code] = true; });
addEventListener("keyup", (e) => { keys[e.code] = false; });

// ── HUD Elements ──
const flamesBar = document.getElementById("flames-bar");
const carriedVal = document.getElementById("carried-val");
const carriedBar = document.getElementById("carried-bar");
const lanternsVal = document.getElementById("lanterns-val");
const lanternsBar = document.getElementById("lanterns-bar");
const scoreVal = document.getElementById("score-val");
const timerDisplay = document.getElementById("timer-display");
const proximityHint = document.getElementById("proximity-hint");
const modalEl = document.getElementById("game-over-modal");
const modalTitle = document.getElementById("game-over-title");
const modalScore = document.getElementById("game-over-score");

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

// ── Camera: Third-Person View ──
const CAM_DIST = 14;
const CAM_HEIGHT = 9;

// ── Fixed Timestep Game Loop (60Hz) ──
let accumulator = 0;
let lastTime = performance.now();
const DT = 1 / 60;

function animate(now) {
  requestAnimationFrame(animate);
  const frameTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += frameTime;

  while (accumulator >= DT) {
    // Input Mapping: W = forward (-Z), S = backward (+Z), A = left (-X), D = right (+X)
    let mx = 0;
    let mz = 0;
    if (keys["KeyW"] || keys["ArrowUp"]) mz -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) mz += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) mx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) mx += 1;

    sim.currentInput.move = [mx, mz];
    sim.currentInput.cam_yaw_deg = 0;
    sim.currentInput.interact = !!keys["KeyE"];
    sim.currentInput.pulse = !!keys["Space"];

    const prevPulse = sim.player.pulse_cooldown;
    sim.step();

    // Trigger visual pulse ring if pulse occurred
    if (sim.player.pulse_cooldown > 0 && prevPulse === 0) {
      pulseAnim = 1.0;
      pulseWave.position.set(sim.player.pos[0], 0.15, sim.player.pos[2]);
    }

    accumulator -= DT;
  }

  const px = sim.player.pos[0];
  const py = sim.player.pos[1];
  const pz = sim.player.pos[2];

  // Animate Ocean Waves
  const timeSec = now * 0.0015;
  for (let i = 0; i < seaPosAttr.count; i++) {
    const u = seaPosAttr.getX(i);
    const v = seaPosAttr.getY(i);
    const wave = Math.sin(u * 0.05 + timeSec) * 0.4 + Math.cos(v * 0.05 + timeSec * 1.2) * 0.3;
    seaPosAttr.setZ(i, seaInitialY[i] + wave);
  }
  seaPosAttr.needsUpdate = true;

  // Sync Player
  playerGroup.position.set(px, py, pz);

  // Rotate Player & Arrow to face movement direction
  const moveX = sim.currentInput.move[0];
  const moveZ = sim.currentInput.move[1];
  if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
    playerGroup.rotation.y = Math.atan2(-moveX, -moveZ);
  }

  // Bobbing animation & lantern swaying
  const bob = Math.sin(now * 0.007) * 0.04;
  playerGroup.position.y += bob;
  hStaffGroup.rotation.z = Math.sin(now * 0.005) * 0.08;

  // Third-person camera follow
  camera.position.set(px, py + CAM_HEIGHT, pz + CAM_DIST);
  camera.lookAt(px, py + 1.4, pz);

  // Sync Grand Lanterns
  for (const l of sim.lanterns) {
    const visual = lanternVisuals.get(l.id);
    if (!visual) continue;
    if (l.lit) {
      visual.chamberMat.color.setHex(0xffbe76);
      visual.fireMat.opacity = 0.85 + Math.sin(now * 0.008) * 0.15;
      visual.lLight.intensity = 3.0 + Math.sin(now * 0.006) * 0.6;
      visual.safeRingMat.opacity = 0.5 + Math.sin(now * 0.004) * 0.15;
    } else {
      visual.fireMat.opacity = (l.deposited / sim.tuning.lantern_cost) * 0.4;
      visual.lLight.intensity = (l.deposited / sim.tuning.lantern_cost) * 0.8;
      visual.safeRingMat.opacity = 0;
    }
  }

  // Sync Fireflies (Motes)
  syncMotes();
  for (const [, grp] of moteMeshMap.entries()) {
    grp.position.y = 0.8 + Math.sin(now * 0.004 + grp.position.x) * 0.25;
    grp.rotation.y = now * 0.003;
  }

  // Sync Ink Shades
  for (const s of sim.shades) {
    const obj = getOrCreateShade(s);
    obj.grp.position.set(s.pos[0], 0.75, s.pos[2]);

    // Shade faces player
    const dx = px - s.pos[0];
    const dz = pz - s.pos[2];
    obj.grp.rotation.y = Math.atan2(dx, dz);

    if (s.state === "stunned") {
      obj.coreMat.color.setHex(0x3867d6);
      obj.eyeMat.color.setHex(0x4bcffa);
      obj.auraMat.color.setHex(0x0fbcf9);
      obj.auraMat.opacity = 0.35;
      // Stunned shake
      obj.grp.position.x += (Math.random() - 0.5) * 0.08;
    } else {
      obj.coreMat.color.setHex(0x020202);
      obj.eyeMat.color.setHex(0xff3838);
      obj.auraMat.color.setHex(0x220033);
      obj.auraMat.opacity = 0.25 + Math.sin(now * 0.006) * 0.08;
    }
  }

  // Pulse Wave Expansion
  if (pulseAnim > 0) {
    pulseAnim = Math.max(0, pulseAnim - 0.025);
    const r = (1 - pulseAnim) * sim.tuning.pulse_radius;
    pulseWave.scale.set(r, r, r);
    pulseWaveMat.opacity = pulseAnim * 0.7;
  }

  // Proximity Hint
  let nearLantern = false;
  for (const l of sim.lanterns) {
    if (l.lit) continue;
    const d = Math.hypot(px - l.pos[0], pz - l.pos[2]);
    if (d <= sim.tuning.interact_radius + 1.0) {
      nearLantern = true;
      break;
    }
  }
  proximityHint.style.display = nearLantern && sim.player.carried > 0 ? "block" : "none";

  // Update HUD
  updateFlamesUI();
  const cap = sim.tuning.carry_capacity;
  carriedVal.textContent = `${sim.player.carried}/${cap}`;
  carriedBar.style.width = `${(sim.player.carried / cap) * 100}%`;

  const litCount = sim.lanterns.filter((l) => l.lit).length;
  const total = sim.tuning.lantern_count_night1;
  lanternsVal.textContent = `${litCount}/${total}`;
  lanternsBar.style.width = `${(litCount / total) * 100}%`;

  scoreVal.textContent = sim.score;

  const secs = Math.max(0, Math.ceil(sim.time_left_s));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  timerDisplay.textContent = `${mm}:${ss}`;
  timerDisplay.className = secs <= 30 ? "warning" : "";

  // Game Over Modal
  if (sim.state !== "playing") {
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
