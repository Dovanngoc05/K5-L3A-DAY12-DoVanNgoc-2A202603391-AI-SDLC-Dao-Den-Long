import { Simulation } from "/core/simulation.js";

// Initialize Core Game Simulation
const sim = new Simulation({ seed: Date.now() });

// Three.js Scene Setup
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1026, 0.025);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x223355, 0.8);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x6688cc, 1.2);
moonLight.position.set(30, 50, 20);
moonLight.castShadow = true;
scene.add(moonLight);

// Island Ground
const islandRadius = 32;
const groundGeo = new THREE.CylinderGeometry(islandRadius, islandRadius + 4, 3, 48);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.y = -1.5;
ground.receiveShadow = true;
scene.add(ground);

// Sea around island
const seaGeo = new THREE.PlaneGeometry(300, 300);
const seaMat = new THREE.MeshStandardMaterial({ color: 0x050a18, roughness: 0.2, metalness: 0.8 });
const sea = new THREE.Mesh(seaGeo, seaMat);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -2.8;
scene.add(sea);

// Player Mesh (Mây)
const playerGroup = new THREE.Group();
const bodyGeo = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.5, 0.8, 8, 16) : new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x4bcffa, emissiveIntensity: 0.3 });
const playerMesh = new THREE.Mesh(bodyGeo, bodyMat);
playerMesh.position.y = 0.9;
playerMesh.castShadow = true;
playerGroup.add(playerMesh);

// Player Light (Aura)
const playerLight = new THREE.PointLight(0x4bcffa, 1.5, 8);
playerLight.position.y = 1.2;
playerGroup.add(playerLight);
scene.add(playerGroup);

// Lanterns 3D representations
const lanternMeshes = new Map();
for (const lantern of sim.lanterns) {
  const group = new THREE.Group();
  group.position.set(lantern.pos[0], 0, lantern.pos[2]);

  // Pillar
  const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.5, 12);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x485460 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.25;
  group.add(pole);

  // Lantern Head
  const headGeo = new THREE.OctahedronGeometry(0.6, 0);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x808e9b, wireframe: false });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 2.7;
  group.add(head);

  // Point light for lantern (activated when lit)
  const lLight = new THREE.PointLight(0xffd32a, 0, 15);
  lLight.position.y = 2.7;
  group.add(lLight);

  scene.add(group);
  lanternMeshes.set(lantern.id, { group, headMat, lLight });
}

// Motes 3D representation
const moteGeo = new THREE.SphereGeometry(0.2, 12, 12);
const moteMat = new THREE.MeshBasicMaterial({ color: 0x70a1ff });
const moteMeshMap = new Map();

function updateMotesVisual() {
  const currentIds = new Set(sim.motes.map((m) => m.id));
  for (const [id, mesh] of moteMeshMap.entries()) {
    if (!currentIds.has(id)) {
      scene.remove(mesh);
      moteMeshMap.delete(id);
    }
  }
  for (const mote of sim.motes) {
    if (!moteMeshMap.has(mote.id)) {
      const mesh = new THREE.Mesh(moteGeo, moteMat);
      mesh.position.set(mote.pos[0], 0.6, mote.pos[2]);
      scene.add(mesh);
      moteMeshMap.set(mote.id, mesh);
    }
  }
}

// Shades 3D representation (Bóng Mực)
const shadeGeo = new THREE.SphereGeometry(0.7, 16, 16);
const shadeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.3 });
const shadeMeshMap = new Map();

// Pulse wave effect
const pulseRingGeo = new THREE.RingGeometry(0.1, 0.3, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({ color: 0x4bcffa, side: THREE.DoubleSide, transparent: true, opacity: 0 });
const pulseRing = new THREE.Mesh(pulseRingGeo, pulseRingMat);
pulseRing.rotation.x = -Math.PI / 2;
pulseRing.position.y = 0.1;
scene.add(pulseRing);
let pulseAnim = 0;

// Input Handling
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// HUD Elements
const flamesEl = document.getElementById("flames-val");
const carriedEl = document.getElementById("carried-val");
const lanternsEl = document.getElementById("lanterns-val");
const timeEl = document.getElementById("time-val");
const scoreEl = document.getElementById("score-val");
const modalEl = document.getElementById("game-over-modal");
const modalTitle = document.getElementById("game-over-title");
const modalScore = document.getElementById("game-over-score");

// Fixed Timestep Simulation Loop (60Hz)
let accumulator = 0;
let lastTime = performance.now();
const dt = 1 / 60;

function animate(now) {
  requestAnimationFrame(animate);
  const frameTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += frameTime;

  while (accumulator >= dt) {
    // Collect Inputs into Sim
    let mx = 0;
    let mz = 0;
    if (keys["KeyW"] || keys["ArrowUp"]) mz += 1;
    if (keys["KeyS"] || keys["ArrowDown"]) mz -= 1;
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
      pulseRing.position.set(sim.player.pos[0], 0.1, sim.player.pos[2]);
    }

    accumulator -= dt;
  }

  // Visual Synchronizations
  playerGroup.position.set(sim.player.pos[0], sim.player.pos[1], sim.player.pos[2]);

  // Third-person camera follow
  camera.position.x = sim.player.pos[0];
  camera.position.y = sim.player.pos[1] + 8;
  camera.position.z = sim.player.pos[2] + 12;
  camera.lookAt(sim.player.pos[0], sim.player.pos[1] + 1.2, sim.player.pos[2]);

  // Update Lanterns
  for (const l of sim.lanterns) {
    const visual = lanternMeshes.get(l.id);
    if (visual) {
      if (l.lit) {
        visual.headMat.color.setHex(0xffd32a);
        visual.headMat.emissive = new THREE.Color(0xffd32a);
        visual.headMat.emissiveIntensity = 1.0;
        visual.lLight.intensity = 2.5;
      }
    }
  }

  // Update Motes
  updateMotesVisual();
  const time = now * 0.003;
  for (const mesh of moteMeshMap.values()) {
    mesh.position.y = 0.6 + Math.sin(time + mesh.position.x) * 0.15;
  }

  // Update Shades
  for (const s of sim.shades) {
    let sMesh = shadeMeshMap.get(s.id);
    if (!sMesh) {
      sMesh = new THREE.Mesh(shadeGeo, shadeMat.clone());
      sMesh.position.y = 0.7;
      scene.add(sMesh);
      shadeMeshMap.set(s.id, sMesh);
    }
    sMesh.position.x = s.pos[0];
    sMesh.position.z = s.pos[2];
    if (s.state === "stunned") {
      sMesh.material.color.setHex(0x575fcf);
    } else {
      sMesh.material.color.setHex(0x1e272e);
    }
  }

  // Pulse animation expand
  if (pulseAnim > 0) {
    pulseAnim = Math.max(0, pulseAnim - 0.04);
    const radius = (1.0 - pulseAnim) * sim.tuning.pulse_radius;
    pulseRing.scale.set(radius, radius, radius);
    pulseRingMat.opacity = pulseAnim;
  }

  // Update HUD
  flamesEl.textContent = "🔥".repeat(sim.player.flames) || "💀";
  carriedEl.textContent = `${sim.player.carried} / ${sim.tuning.carry_capacity}`;
  const litCount = sim.lanterns.filter((l) => l.lit).length;
  lanternsEl.textContent = `${litCount} / ${sim.tuning.lantern_count_night1}`;
  timeEl.textContent = `${Math.ceil(sim.time_left_s)}s`;
  scoreEl.textContent = sim.score;

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

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
