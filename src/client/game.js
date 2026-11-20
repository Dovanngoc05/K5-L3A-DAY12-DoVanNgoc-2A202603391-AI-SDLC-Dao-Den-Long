import { Simulation } from "/core/simulation.js";

// ── Init ──
const sim = new Simulation({ seed: Date.now() });

const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030610);
scene.fog = new THREE.FogExp2(0x060e22, 0.018);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
container.appendChild(renderer.domElement);

// ── Lighting ──
scene.add(new THREE.AmbientLight(0x1a2244, 0.6));
const moon = new THREE.DirectionalLight(0x5577bb, 0.9);
moon.position.set(40, 60, -30);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.near = 10;
moon.shadow.camera.far = 120;
moon.shadow.camera.left = -40;
moon.shadow.camera.right = 40;
moon.shadow.camera.top = 40;
moon.shadow.camera.bottom = -40;
scene.add(moon);

// Rim fill from behind
const rimLight = new THREE.DirectionalLight(0x334488, 0.3);
rimLight.position.set(-20, 30, 40);
scene.add(rimLight);

// ── Skybox stars ──
const starCount = 600;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  const r = 180 + Math.random() * 60;
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)); // only upper hemisphere
  starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true });
scene.add(new THREE.Points(starGeo, starMat));

// ── Island ──
const ISLAND_R = 32;

// Main land mass
const landGeo = new THREE.CylinderGeometry(ISLAND_R, ISLAND_R + 5, 4, 64);
const landMat = new THREE.MeshStandardMaterial({ color: 0x1a2e1a, roughness: 0.95 });
const land = new THREE.Mesh(landGeo, landMat);
land.position.y = -2;
land.receiveShadow = true;
scene.add(land);

// Grass ring on top
const grassGeo = new THREE.RingGeometry(0, ISLAND_R, 64);
const grassMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 1.0, side: THREE.DoubleSide });
const grass = new THREE.Mesh(grassGeo, grassMat);
grass.rotation.x = -Math.PI / 2;
grass.position.y = 0.01;
grass.receiveShadow = true;
scene.add(grass);

// Beach ring
const beachGeo = new THREE.RingGeometry(ISLAND_R - 2, ISLAND_R + 2, 64);
const beachMat = new THREE.MeshStandardMaterial({ color: 0x3d3222, roughness: 0.9, side: THREE.DoubleSide });
const beach = new THREE.Mesh(beachGeo, beachMat);
beach.rotation.x = -Math.PI / 2;
beach.position.y = 0.005;
scene.add(beach);

// Sea
const seaGeo = new THREE.PlaneGeometry(400, 400);
const seaMat = new THREE.MeshStandardMaterial({ color: 0x040a1a, roughness: 0.1, metalness: 0.9 });
const sea = new THREE.Mesh(seaGeo, seaMat);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -3.2;
scene.add(sea);

// Decorative rocks
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
  const r = ISLAND_R - 1 + Math.random() * 3;
  const scale = 0.3 + Math.random() * 0.5;
  const rGeo = new THREE.DodecahedronGeometry(scale, 0);
  const rMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
  const rock = new THREE.Mesh(rGeo, rMat);
  rock.position.set(Math.cos(angle) * r, scale * 0.3 - 0.3, Math.sin(angle) * r);
  rock.rotation.set(Math.random(), Math.random(), 0);
  rock.castShadow = true;
  scene.add(rock);
}

// Decorative trees (simple cones)
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2 + 0.4;
  const r = 10 + Math.random() * 14;
  const treeGroup = new THREE.Group();
  treeGroup.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);

  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.6;
  treeGroup.add(trunk);

  const leavesGeo = new THREE.ConeGeometry(0.9 + Math.random() * 0.4, 2.0 + Math.random() * 0.8, 8);
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0a2a0e, roughness: 0.8 });
  const leaves = new THREE.Mesh(leavesGeo, leavesMat);
  leaves.position.y = 2.2;
  leaves.castShadow = true;
  treeGroup.add(leaves);
  scene.add(treeGroup);
}

// ── Player (May) ──
const playerGroup = new THREE.Group();

// Robe / body
const robeGeo = new THREE.CylinderGeometry(0.28, 0.5, 1.1, 12);
const robeMat = new THREE.MeshStandardMaterial({ color: 0x2e86de, roughness: 0.6 });
const robe = new THREE.Mesh(robeGeo, robeMat);
robe.position.y = 0.55;
robe.castShadow = true;
playerGroup.add(robe);

// Head
const pHeadGeo = new THREE.SphereGeometry(0.28, 16, 16);
const pHeadMat = new THREE.MeshStandardMaterial({ color: 0xfad3cf, roughness: 0.5 });
const pHead = new THREE.Mesh(pHeadGeo, pHeadMat);
pHead.position.y = 1.35;
pHead.castShadow = true;
playerGroup.add(pHead);

// Conical hat
const hatGeo = new THREE.ConeGeometry(0.52, 0.3, 16);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4a24e, roughness: 0.4 });
const hat = new THREE.Mesh(hatGeo, hatMat);
hat.position.y = 1.6;
playerGroup.add(hat);

// Handheld lantern
const hLanternGroup = new THREE.Group();
const stickGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
const stickMat = new THREE.MeshStandardMaterial({ color: 0x5d4a30 });
const stick = new THREE.Mesh(stickGeo, stickMat);
stick.position.y = 0.3;
stick.rotation.z = -0.2;
hLanternGroup.add(stick);
const lampGeo = new THREE.OctahedronGeometry(0.18, 0);
const lampMat = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 1.0, transparent: true, opacity: 0.9 });
const lamp = new THREE.Mesh(lampGeo, lampMat);
lamp.position.y = 0.65;
hLanternGroup.add(lamp);
hLanternGroup.position.set(0.55, 0.3, 0.2);
playerGroup.add(hLanternGroup);

// Player point light
const pLight = new THREE.PointLight(0xffcc66, 2.5, 12);
pLight.position.set(0.55, 1.0, 0.2);
playerGroup.add(pLight);

scene.add(playerGroup);

// ── Lanterns (5 large) ──
const lanternVisuals = new Map();
for (const l of sim.lanterns) {
  const g = new THREE.Group();
  g.position.set(l.pos[0], 0, l.pos[2]);

  // Stone base
  const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.2;
  base.castShadow = true;
  g.add(base);

  // Pillar
  const pillarGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.8, 10);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 1.8;
  pillar.castShadow = true;
  g.add(pillar);

  // Lantern cage (wireframe octahedron)
  const cageGeo = new THREE.OctahedronGeometry(0.55, 0);
  const cageMat = new THREE.MeshStandardMaterial({ color: 0x8e8e8e, roughness: 0.5, wireframe: true });
  const cage = new THREE.Mesh(cageGeo, cageMat);
  cage.position.y = 3.5;
  g.add(cage);

  // Inner glow sphere (hidden until lit)
  const glowGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd32a, transparent: true, opacity: 0.0 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 3.5;
  g.add(glow);

  // Deposit progress ring
  const progGeo = new THREE.TorusGeometry(0.7, 0.05, 8, 32);
  const progMat = new THREE.MeshBasicMaterial({ color: 0xffd32a, transparent: true, opacity: 0.0 });
  const prog = new THREE.Mesh(progGeo, progMat);
  prog.rotation.x = -Math.PI / 2;
  prog.position.y = 0.05;
  g.add(prog);

  const lLight = new THREE.PointLight(0xffd32a, 0, 18);
  lLight.position.y = 3.5;
  g.add(lLight);

  scene.add(g);
  lanternVisuals.set(l.id, { group: g, cageMat, glowMat, progMat, lLight });
}

// ── Motes ──
const moteBaseGeo = new THREE.SphereGeometry(0.15, 10, 10);
const moteBaseMat = new THREE.MeshBasicMaterial({ color: 0x48dbfb, transparent: true, opacity: 0.85 });
const moteMeshMap = new Map();
const moteGlowGeo = new THREE.SphereGeometry(0.3, 8, 8);
const moteGlowMat = new THREE.MeshBasicMaterial({ color: 0x48dbfb, transparent: true, opacity: 0.15 });

function syncMotes() {
  const alive = new Set(sim.motes.map((m) => m.id));
  for (const [id, grp] of moteMeshMap) {
    if (!alive.has(id)) { scene.remove(grp); moteMeshMap.delete(id); }
  }
  for (const m of sim.motes) {
    if (!moteMeshMap.has(m.id)) {
      const grp = new THREE.Group();
      grp.add(new THREE.Mesh(moteBaseGeo, moteBaseMat));
      grp.add(new THREE.Mesh(moteGlowGeo, moteGlowMat));
      const ml = new THREE.PointLight(0x48dbfb, 0.6, 4);
      ml.position.y = 0;
      grp.add(ml);
      grp.position.set(m.pos[0], 0.7, m.pos[2]);
      scene.add(grp);
      moteMeshMap.set(m.id, grp);
    }
  }
}

// ── Shades (Bong Muc) ──
const shadeGeo = new THREE.SphereGeometry(0.6, 16, 16);
const shadeMeshMap = new Map();

function getOrCreateShade(s) {
  let obj = shadeMeshMap.get(s.id);
  if (!obj) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.1, metalness: 0.8 });
    const mesh = new THREE.Mesh(shadeGeo, mat);
    mesh.castShadow = true;

    // Creepy aura
    const auraGeo = new THREE.SphereGeometry(1.0, 12, 12);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0x1a0033, transparent: true, opacity: 0.15 });
    const aura = new THREE.Mesh(auraGeo, auraMat);

    const sLight = new THREE.PointLight(0x6c3483, 0.8, 5);

    const grp = new THREE.Group();
    grp.add(mesh);
    grp.add(aura);
    grp.add(sLight);
    scene.add(grp);
    obj = { grp, mat, auraMat };
    shadeMeshMap.set(s.id, obj);
  }
  return obj;
}

// ── Pulse Wave ──
const pulseWaveGeo = new THREE.RingGeometry(0.1, 0.4, 48);
const pulseWaveMat = new THREE.MeshBasicMaterial({ color: 0x48dbfb, side: THREE.DoubleSide, transparent: true, opacity: 0 });
const pulseWave = new THREE.Mesh(pulseWaveGeo, pulseWaveMat);
pulseWave.rotation.x = -Math.PI / 2;
pulseWave.position.y = 0.15;
scene.add(pulseWave);
let pulseAnim = 0;

// ── Input ──
const keys = {};
addEventListener("keydown", (e) => { keys[e.code] = true; e.preventDefault(); });
addEventListener("keyup", (e) => { keys[e.code] = false; });

// ── HUD refs ──
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

// Build initial flames icons
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

// ── Camera state ──
let camAngle = Math.PI; // behind player (looking in -Z direction from +Z)
const CAM_DIST = 14;
const CAM_HEIGHT = 9;

// ── Game Loop ──
let accumulator = 0;
let lastTime = performance.now();
const DT = 1 / 60;

function animate(now) {
  requestAnimationFrame(animate);
  const frame = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += frame;

  while (accumulator >= DT) {
    // ── Input Mapping ──
    // Camera is behind player at +Z looking toward -Z.
    // W = move forward (away from camera = -Z), S = move backward (+Z)
    let mx = 0, mz = 0;
    if (keys["KeyW"] || keys["ArrowUp"])    mz -= 1;  // forward = -Z
    if (keys["KeyS"] || keys["ArrowDown"])  mz += 1;  // backward = +Z
    if (keys["KeyA"] || keys["ArrowLeft"])  mx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) mx += 1;

    sim.currentInput.move = [mx, mz];
    sim.currentInput.cam_yaw_deg = 0;
    sim.currentInput.interact = !!keys["KeyE"];
    sim.currentInput.pulse = !!keys["Space"];

    const prevCD = sim.player.pulse_cooldown;
    sim.step();

    if (sim.player.pulse_cooldown > 0 && prevCD <= 0) {
      pulseAnim = 1.0;
      pulseWave.position.set(sim.player.pos[0], 0.15, sim.player.pos[2]);
    }
    accumulator -= DT;
  }

  const px = sim.player.pos[0], py = sim.player.pos[1], pz = sim.player.pos[2];

  // ── Player visual ──
  playerGroup.position.set(px, py, pz);

  // Bobbing animation
  const bob = Math.sin(now * 0.006) * 0.04;
  playerGroup.position.y += bob;

  // Handheld lantern sway
  hLanternGroup.rotation.z = Math.sin(now * 0.004) * 0.1 - 0.15;

  // ── Camera: smooth third-person ──
  const camX = px + Math.sin(camAngle) * CAM_DIST;
  const camZ = pz + Math.cos(camAngle) * CAM_DIST;
  camera.position.set(camX, py + CAM_HEIGHT, camZ);
  camera.lookAt(px, py + 1.4, pz);

  // ── Lanterns visual update ──
  for (const l of sim.lanterns) {
    const v = lanternVisuals.get(l.id);
    if (!v) continue;
    const progress = l.deposited / sim.tuning.lantern_cost;
    v.progMat.opacity = progress > 0 && !l.lit ? 0.4 : 0.0;
    if (l.lit) {
      v.cageMat.color.setHex(0xffd32a);
      v.cageMat.wireframe = false;
      v.cageMat.emissive = v.cageMat.emissive || new THREE.Color();
      v.cageMat.emissive.setHex(0xffa500);
      v.cageMat.emissiveIntensity = 0.6;
      v.glowMat.opacity = 0.7 + Math.sin(now * 0.005) * 0.15;
      v.lLight.intensity = 2.5 + Math.sin(now * 0.004) * 0.5;
    }
  }

  // ── Motes ──
  syncMotes();
  for (const [, grp] of moteMeshMap) {
    grp.position.y = 0.7 + Math.sin(now * 0.003 + grp.position.x * 0.5) * 0.2;
    grp.rotation.y = now * 0.002;
  }

  // ── Shades ──
  for (const s of sim.shades) {
    const obj = getOrCreateShade(s);
    obj.grp.position.set(s.pos[0], 0.6, s.pos[2]);
    if (s.state === "stunned") {
      obj.mat.color.setHex(0x5758bb);
      obj.mat.emissive = obj.mat.emissive || new THREE.Color();
      obj.mat.emissive.setHex(0x3d3dcc);
      obj.mat.emissiveIntensity = 0.5;
      obj.auraMat.color.setHex(0x3d3dcc);
    } else {
      obj.mat.color.setHex(0x0a0a0a);
      if (obj.mat.emissive) obj.mat.emissiveIntensity = 0;
      obj.auraMat.color.setHex(0x1a0033);
    }
    // Pulsating aura
    obj.auraMat.opacity = 0.12 + Math.sin(now * 0.005 + s.pos[0]) * 0.06;
  }

  // ── Pulse wave animation ──
  if (pulseAnim > 0) {
    pulseAnim = Math.max(0, pulseAnim - 0.03);
    const r = (1 - pulseAnim) * sim.tuning.pulse_radius;
    pulseWave.scale.set(r, r, r);
    pulseWaveMat.opacity = pulseAnim * 0.6;
  }

  // ── Proximity hint ──
  let nearLantern = false;
  for (const l of sim.lanterns) {
    if (l.lit) continue;
    const dx = px - l.pos[0], dz = pz - l.pos[2];
    if (Math.hypot(dx, dz) <= sim.tuning.interact_radius + 1) {
      nearLantern = true;
      break;
    }
  }
  proximityHint.style.display = nearLantern && sim.player.carried > 0 ? "block" : "none";

  // ── HUD Update ──
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

  // ── Game over ──
  if (sim.state !== "playing") {
    modalEl.style.display = "flex";
    if (sim.state === "won") {
      modalTitle.textContent = "CHIEN THANG!";
      modalTitle.style.color = "#0be881";
    } else {
      modalTitle.textContent = "THAT BAI!";
      modalTitle.style.color = "#ff5e57";
    }
    modalScore.textContent = `Diem cuoi cung: ${sim.score}`;
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
