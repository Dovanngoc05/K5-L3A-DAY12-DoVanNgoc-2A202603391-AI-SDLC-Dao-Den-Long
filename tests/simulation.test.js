import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Simulation } from "../src/core/simulation.js";

// ─────────────────────────────────────────────────────────────
// PHẦN 1: Regression Tests (Cập nhật chuẩn hóa Contract v1.2)
// ─────────────────────────────────────────────────────────────

test("Player collects mote and increases score upon lantern deposit", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      motes: [[0, 0, 1.0]] // within pickup radius 1.0m
    }
  });

  sim.step();
  assert.equal(sim.player.carried, 1);
  assert.equal(sim.motes.length, 0);
  assert.equal(sim.score, 0); // Contract v1.2: score only on deposit (+5/mote)
});

test("Player deposits motes into lantern and lights it", () => {
  // [CẬP NHẬT TICKET-03]: Công thức điểm mới thay thế: +5 mỗi đom đóm nạp + 100 thắp lần đầu = 150 điểm (thay vì 200 của v1.1)
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 10, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 5], deposited: 0 }]
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  sim.step();
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(l1.deposited, 10);
  assert.equal(l1.lit, true);
  assert.equal(l1.fuel, 100); // Nhiên liệu khởi tạo đầy 100
  assert.equal(sim.player.carried, 0);
  assert.equal(sim.score, 150); // 10*5 + 100 = 150
});

test("Player partial deposit into lantern", () => {
  // [CẬP NHẬT TICKET-03]: Điểm nạp đom đóm đổi thành +5/con (4 * 5 = 20 thay vì 40 của v1.1)
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 5], deposited: 0 }]
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  sim.step();
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(l1.deposited, 4);
  assert.equal(l1.lit, false);
  assert.equal(sim.player.carried, 0);
  assert.equal(sim.score, 20); // 4 * 5 = 20
});

test("Pulse stuns and pushes shades", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 3, flames: 3 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: "S1", pos: [2, 0, 0] }] // within pulse radius 5.0m
    },
    inputs: {
      frames: [{ tick: 0, pulse: true }]
    }
  });

  sim.step();
  const s1 = sim.shades.find((s) => s.id === "S1");
  assert.equal(s1.state, "stunned");
  assert.equal(sim.player.carried, 0); // 3 motes spent
  assert.equal(sim.score, 5); // +5 per stunned shade

  // Over 15 ticks, shade is pushed 4m along +X
  for (let i = 0; i < 15; i++) {
    sim.step();
  }
  assert.equal(s1.pos[0] >= 5.9, true); // initial 2m + 4m push = 6.0m
});

test("Shade damages player when colliding", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: "S1", pos: [0.5, 0, 0], state: "chase" }] // within hit radius 1.0m
    }
  });

  sim.step();
  assert.equal(sim.player.flames, 2);
  assert.equal(sim.player.carried, 2); // 4 * 0.5 = 2 dropped
  assert.equal(sim.player.invuln_ticks, 90);
});

test("Safe radius around lit lantern blocks shade", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [10, 0, 0], lit: true, fuel: 100 }],
      shades: [{ id: "S1", pos: [18, 0, 0], state: "chase" }] // safe_radius is 6.0m around (10,0,0)
    }
  });

  // Step 60 ticks (1 second). Shade moves towards player at (0,0,0)
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  const s1 = sim.shades.find((s) => s.id === "S1");
  const distToLantern = Math.hypot(s1.pos[0] - 10, s1.pos[2] - 0);
  assert.equal(distToLantern >= 6.0, true);
});

test("Player jump kinematics: jumps and lands back on ground", () => {
  const sim = new Simulation({
    inputs: {
      frames: [{ tick: 0, jump: true }]
    }
  });

  // Step 1: jumps upwards
  sim.step();
  assert.equal(sim.player.pos[1] > 0, true);

  // Step for 1 second (60 ticks): lands back on ground
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  assert.equal(sim.player.pos[1], 0.0);
  assert.equal(sim.player.vel[1], 0.0);
  assert.equal(sim.player.grounded, true);
});

test("Island boundary: clamps player when fall_enabled is false", () => {
  const sim = new Simulation({
    tuning: { fall_enabled: false },
    scenario: {
      player: { pos: [39.5, 0, 0], carried: 2, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, move: [1, 0] }] // moving +X continuously
    }
  });

  // Step 60 ticks (1 second) at speed 6m/s
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  const dist = Math.hypot(sim.player.pos[0], sim.player.pos[2]);
  assert.equal(dist <= 40.001, true);
  assert.equal(sim.player.flames, 3); // not damaged
});

test("Island fall: player falls off when fall_enabled is true", () => {
  const sim = new Simulation({
    tuning: { fall_enabled: true },
    scenario: {
      player: { pos: [39.8, 0, 0], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, move: [1, 0] }]
    }
  });

  // Step until player walks off edge and falls past Y < -10
  for (let i = 0; i < 70; i++) {
    sim.step();
  }
  assert.equal(sim.player.falling, true);
  assert.equal(sim.player.flames, 2); // -1 flame
  assert.equal(sim.player.carried, 0); // drops all motes

  // Wait remaining fall_wait_ticks (60 ticks total) until respawn
  while (sim.player.falling) {
    sim.step();
  }
  assert.equal(sim.player.falling, false);
  assert.equal(sim.player.pos[0], 0.0);
  assert.equal(sim.player.pos[2], 0.0);
  assert.equal(sim.player.invuln_ticks > 0, true); // 90 ticks invuln
});

test("Deterministic simulation with same seed and inputs", () => {
  const options = {
    seed: 999,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      motes: [[0, 0, 2], [3, 0, 4]],
      shades: [{ id: "S1", pos: [10, 0, 0] }]
    },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1] },
        { tick: 30, move: [1, 0] }
      ]
    }
  };

  const sim1 = new Simulation(options);
  const sim2 = new Simulation(options);

  for (let i = 0; i < 60; i++) {
    sim1.step();
    sim2.step();
  }

  assert.deepEqual(sim1.getSnapshot(), sim2.getSnapshot());
});

test("Validation: rejects non-strictly increasing frame ticks", () => {
  assert.throws(() => {
    new Simulation({
      inputs: {
        frames: [
          { tick: 10, move: [1, 0] },
          { tick: 10, move: [0, 1] } // duplicate tick
        ]
      }
    });
  }, /strictly increasing/);
});

test("Headless CLI contract execution and exit codes", () => {
  const tmpOut = path.resolve("docs/proof/contract_test_out.jsonl");
  const nodeExe = process.execPath;
  const headlessScript = path.resolve("src/headless.js");

  // 1. Normal execution exits 0
  execFileSync(nodeExe, [
    headlessScript,
    "--seed", "42",
    "--night", "1",
    "--ticks", "60",
    "--out", tmpOut,
    "--snapshot-every", "10"
  ]);

  assert.equal(fs.existsSync(tmpOut), true);
  const lines = fs.readFileSync(tmpOut, "utf-8").trim().split("\n");
  assert.equal(lines.length >= 7, true);
  const first = JSON.parse(lines[0]);
  const last = JSON.parse(lines[lines.length - 1]);
  assert.equal(first.type, "snapshot");
  assert.equal(first.tick, 0);
  assert.equal(last.type, "end");

  // 2. Invalid inputs file exits code 2
  const badInputsPath = path.resolve("docs/proof/bad_inputs.json");
  fs.writeFileSync(badInputsPath, JSON.stringify({ frames: [{ tick: 5 }, { tick: 4 }] }));

  let caughtCode = null;
  try {
    execFileSync(nodeExe, [
      headlessScript,
      "--inputs", badInputsPath,
      "--ticks", "10"
    ], { stdio: "pipe" });
  } catch (err) {
    caughtCode = err.status;
  }
  assert.equal(caughtCode, 2);

  if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  if (fs.existsSync(badInputsPath)) fs.unlinkSync(badInputsPath);
});

test("Phase 2: Dash mechanic moves at 14m/s for 12 ticks with 90 ticks cooldown", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [
        { tick: 0, move: [1, 0], dash: true }
      ]
    }
  });

  sim.step(); // tick 0 -> 1: dash triggered
  assert.equal(sim.player.dash_ticks_left, 11);
  assert.equal(sim.player.dash_cd_ticks, 90);

  for (let i = 0; i < 11; i++) {
    sim.step();
  }
  assert.equal(sim.player.dash_ticks_left, 0);
  assert.equal(Math.abs(sim.player.pos[0] - 2.8) < 0.05, true);
  assert.equal(sim.player.dash_cd_ticks > 0, true);
});

test("Phase 2: Charm gives 7.2 m/s speed and zero cooldown dash", () => {
  const sim = new Simulation({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      charms: [{ id: "C1", pos: [0, 0, 0.5], available: true }]
    },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1] },
        { tick: 1, move: [0, 1], dash: true }
      ]
    }
  });

  sim.step();
  assert.equal(sim.player.charm_ticks, 600);
  const charm = sim.charms.find((c) => c.id === "C1");
  assert.equal(charm.available, false);
  assert.equal(charm.respawn_ticks, 2700);

  sim.step();
  assert.equal(sim.player.dash_cd_ticks, 0);
});

test("Phase 2: Night 2 Jump pad launches player with ballistic trajectory to opposite island", () => {
  const sim = new Simulation({
    night: 2,
    scenario: {
      player: { pos: [20, 0, 18], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false
    }
  });

  sim.step();
  assert.equal(sim.player.grounded, false);
  assert.equal(sim.player.vel[1] > 10.0, true);
  assert.equal(sim.player.jump_pad_vel !== null, true);

  for (let i = 0; i < 90; i++) {
    sim.step();
  }
  assert.equal(sim.player.grounded, true);
  assert.equal(sim.player.jump_pad_vel, null);
  assert.equal(sim.player.pos[0] > 45.0, true);
});

test("Phase 2: Drifter (Gió Lạc) steals motes and drops them when pulsed", () => {
  const sim = new Simulation({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 8, flames: 3 },
      random_motes: false,
      random_shades: false,
      drifters: [{ id: "D1", pos: [0.5, 0, 0], state: "chase", stolen: 0 }]
    },
    inputs: {
      frames: [
        { tick: 0 },
        { tick: 1, pulse: true }
      ]
    }
  });

  sim.step();
  const d1 = sim.drifters.find((d) => d.id === "D1");
  assert.equal(d1.stolen, 3);
  assert.equal(d1.state, "flee");
  assert.equal(sim.player.carried, 5);

  sim.step();
  assert.equal(sim.player.carried, 2);
  assert.equal(d1.stolen, 0);
  assert.equal(sim.motes.length, 3);
});

test("Phase 2: Pause and Resume freezes simulation clock and entity updates", () => {
  const sim = new Simulation({
    inputs: {
      frames: [
        { tick: 2, pause: true },
        { tick: 3, pause: false },
        { tick: 10, pause: true },
        { tick: 11, pause: false }
      ]
    }
  });

  sim.step();
  sim.step();
  assert.equal(sim.is_paused, false);
  assert.equal(sim.sim_tick, 2);

  sim.step();
  assert.equal(sim.is_paused, true);
  assert.equal(sim.state, "paused");
  const simTickPaused = sim.sim_tick;
  const timeLeftPaused = sim.time_left_s;

  for (let i = 3; i < 10; i++) {
    sim.step();
    assert.equal(sim.sim_tick, simTickPaused);
    assert.equal(sim.time_left_s, timeLeftPaused);
  }

  sim.step();
  assert.equal(sim.is_paused, false);
  assert.equal(sim.state, "playing");
  sim.step();
  assert.equal(sim.sim_tick > simTickPaused, true);
});

test("Phase 2: Solid obstacle collision blocks movement and prevents pass-through", () => {
  const sim = new Simulation({
    obstacles_enabled: true,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [
        { tick: 0, move: [1, 0] }
      ]
    }
  });

  sim.obstacles = [{ id: "test_rock", pos: [2.0, 0.0, 0.0], radius: 1.0, height: 2.0 }];

  for (let i = 0; i < 60; i++) {
    sim.step();
  }

  assert.equal(sim.player.pos[0] <= 0.6, true);
  assert.equal(sim.player.pos[0] >= 0.5, true);
});

// ─────────────────────────────────────────────────────────────
// PHẦN 2: Tính năng mới Phase 3 (TICKET-03: Change Request "Đèn cạn dầu")
// ─────────────────────────────────────────────────────────────

test("Phase 3: Lantern fuel decays naturally at 1.0 unit/s and turns off at 0 with lantern_out", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [10, 0, 0], lit: true, fuel: 1.0 }] // 1.0 unit = 60 ticks
    }
  });

  // Step 59 ticks: still lit, fuel > 0
  for (let i = 0; i < 59; i++) {
    sim.step();
  }
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(l1.lit, true);
  assert.equal(l1.fuel > 0, true);

  // Step 60th tick: runs out of fuel (<= 0), turns off, emits lantern_out
  sim.step();
  assert.equal(l1.lit, false);
  assert.equal(l1.fuel, 0.0);
  assert.equal(l1.ever_lit, true);

  const events = sim.flushEvents();
  const outEv = events.find((e) => e.name === "lantern_out");
  assert.equal(outEv !== undefined, true);
  assert.equal(outEv.data.lantern_id, "L1");
});

test("Phase 3: Relighting a previously lit lantern costs only 5 motes and awards +40 points", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 5, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 5], lit: false, ever_lit: true, deposited: 0 }]
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  sim.step();
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(l1.lit, true);
  assert.equal(l1.fuel, 100);
  assert.equal(l1.deposited, 5); // Chi phí thắp lại chỉ 5
  assert.equal(l1.relit_count, 1);
  assert.equal(sim.player.carried, 0);
  // Điểm: 5 đom đóm * 5 + 40 điểm thắp lại = 65 điểm
  assert.equal(sim.score, 65);

  const events = sim.flushEvents();
  const litEv = events.find((e) => e.name === "lantern_lit");
  assert.equal(litEv !== undefined, true);
  assert.equal(litEv.data.relight, true);
});

test("Phase 3: Refueling a lit lantern adds fuel and emits refuel event", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 2, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 5], lit: true, fuel: 80 }]
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  sim.step();
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  // 2 motes * 10 fuel = +20 fuel -> fuel reaches 100 (minus 1/60 tick decay)
  assert.equal(l1.fuel >= 99.9, true);
  assert.equal(sim.player.carried, 0);
  assert.equal(sim.score, 10); // 2 * 5 = 10 điểm

  const events = sim.flushEvents();
  const refuelEv = events.find((e) => e.name === "refuel");
  assert.equal(refuelEv !== undefined, true);
  assert.equal(refuelEv.data.amount, 2);
  assert.equal(refuelEv.data.fuel, 100);
});

test("Phase 3: Dynamic capacity increases by 2 per successful light up to max 20", () => {
  const sim = new Simulation();
  assert.equal(sim.capacity, 10);

  sim.player.successful_lights = 1;
  assert.equal(sim.capacity, 12);

  sim.player.successful_lights = 4;
  assert.equal(sim.capacity, 18);

  sim.player.successful_lights = 7; // 10 + 14 = 24 -> capped at 20
  assert.equal(sim.capacity, 20);
});

test("Phase 3: Shade in wander state targets weak lantern (fuel < 30) and drains 5 fuel/s", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, -20], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 0], lit: true, fuel: 20 }], // weak lantern
      shades: [{ id: "S1", pos: [0, 0, 1.0], state: "wander" }] // within 2m
    }
  });

  // Step 1: shade S1 detects weak lantern within 2m, switches to "drain"
  sim.step();
  const s1 = sim.shades.find((s) => s.id === "S1");
  assert.equal(s1.state, "drain");
  assert.equal(s1.target_lantern_id, "L1");

  // Step 60 ticks (1s) of draining:
  // Fuel loses 1.0 (decay) + 5.0 (drain) = 6.0 units
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(Math.abs(l1.fuel - 14.0) < 0.2, true);

  const events = sim.flushEvents();
  const drainEv = events.find((e) => e.name === "fuel_drain");
  assert.equal(drainEv !== undefined, true);
  assert.equal(drainEv.data.lantern_id, "L1");
});

test("Phase 3: Pulse stuns draining shade and awards +15 points", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 3, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 1.0], lit: true, fuel: 25 }],
      shades: [{ id: "S1", pos: [0, 0, 1.5], state: "drain", target_lantern_id: "L1" }]
    },
    inputs: {
      frames: [{ tick: 0, pulse: true }]
    }
  });

  sim.step();
  const s1 = sim.shades.find((s) => s.id === "S1");
  assert.equal(s1.state, "stunned");
  assert.equal(s1.target_lantern_id, null);
  // +15 điểm thưởng đặc biệt khi Tỏa Sáng trúng Bóng Mực đang hút dầu
  assert.equal(sim.score, 15);
});

test("Phase 3: No early win when all lanterns are lit", () => {
  const sim = new Simulation({
    night: 1,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      // Thắp sáng toàn bộ 5 đèn của Đêm 1
      lanterns: [
        { id: "L1", lit: true, fuel: 100 },
        { id: "L2", lit: true, fuel: 100 },
        { id: "L3", lit: true, fuel: 100 },
        { id: "L4", lit: true, fuel: 100 },
        { id: "L5", lit: true, fuel: 100 }
      ]
    }
  });

  sim.step();
  // Không còn thắng sớm! Game vẫn tiếp tục "playing"
  assert.equal(sim.state, "playing");
});

test("Phase 3: Winning by surviving to dawn with >= 60% lit lanterns (reason: dawn_survived)", () => {
  const sim = new Simulation({
    night: 1,
    scenario: {
      time_left_s: 0.02, // Hết giờ ở tick tiếp theo
      player: { pos: [0, 0, 0], carried: 0, flames: 2 },
      random_motes: false,
      random_shades: false,
      // 3/5 đèn đang sáng (đạt chuẩn >= 60%)
      lanterns: [
        { id: "L1", lit: true, fuel: 80 },
        { id: "L2", lit: true, fuel: 90 },
        { id: "L3", lit: true, fuel: 100 },
        { id: "L4", lit: false, fuel: 0 },
        { id: "L5", lit: false, fuel: 0 }
      ]
    }
  });

  // Step 2 ticks to dawn
  sim.step();
  sim.step();

  assert.equal(sim.state, "won");
  const events = sim.flushEvents();
  const endEv = events.find((e) => e.name === "game_over");
  assert.equal(endEv !== undefined, true);
  assert.equal(endEv.data.result, "won");
  assert.equal(endEv.data.reason, "dawn_survived");

  // Điểm bình minh:
  // L1: 50 + 79 = 129
  // L2: 50 + 89 = 139
  // L3: 50 + 99 = 149
  // 2 Ngọn lửa: 2 * 50 = 100
  // Tổng = 129 + 139 + 149 + 100 = 517
  assert.equal(sim.score >= 510, true);
});

test("Phase 3: Losing at dawn if lit lanterns < 60% (reason: dawn)", () => {
  const sim = new Simulation({
    night: 1,
    scenario: {
      time_left_s: 0.02,
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      // Chỉ 2/5 đèn sáng (< 60%)
      lanterns: [
        { id: "L1", lit: true, fuel: 50 },
        { id: "L2", lit: true, fuel: 50 },
        { id: "L3", lit: false, fuel: 0 },
        { id: "L4", lit: false, fuel: 0 },
        { id: "L5", lit: false, fuel: 0 }
      ]
    }
  });

  sim.step();
  sim.step();

  assert.equal(sim.state, "lost");
  const events = sim.flushEvents();
  const endEv = events.find((e) => e.name === "game_over");
  assert.equal(endEv !== undefined, true);
  assert.equal(endEv.data.result, "lost");
  assert.equal(endEv.data.reason, "dawn");
});

test("Phase 3 Performance Benchmark: 21,600 ticks completes in <= 30 seconds", () => {
  const sim = new Simulation({
    seed: 12345,
    night: 3
  });

  const startTime = Date.now();
  const benchmarkTicks = 21600; // 360 seconds at 60 Hz

  for (let t = 0; t < benchmarkTicks; t++) {
    sim.step();
    if (sim.state !== "playing") break;
  }

  const durationMs = Date.now() - startTime;
  console.log(`      ⏱  21,600 ticks simulated in ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)`);
  assert.equal(durationMs <= 30000, true);
});

// ─────────────────────────────────────────────────────────────
// PHẦN 5: CÁC TEST CHO PHASE 4 (TICKET-04 — RELEASE v1.0.0 & CONTRACT v1.3)
// ─────────────────────────────────────────────────────────────

test("Phase 4: Leaderboard validation, sorting, top 10 limit, and tie-breaking", async () => {
  const { validatePlayerName, sortAndSliceLeaderboard } = await import("../src/core/leaderboard.js");

  // 1. Tên 3-12 ký tự [A-Za-z0-9_] và hỗ trợ tiếng Việt có dấu
  assert.equal(validatePlayerName("May"), true);
  assert.equal(validatePlayerName("Đỗ_Ngọc"), true);
  assert.equal(validatePlayerName("Mây_Lạc_2026"), true);
  assert.equal(validatePlayerName("ab"), false); // Quá ngắn (< 3)
  assert.equal(validatePlayerName("PlayerNameTooLong123"), false); // Quá dài (> 12)
  assert.equal(validatePlayerName("May@123!"), false); // Ký tự cấm (!, @)

  // 2. Sắp xếp điểm giảm dần, bằng điểm thì đạt trước (thời gian nhỏ hơn) đứng trước
  const sampleEntries = [
    { name: "PlayerB", score: 800, nights_won: 2, achieved_at: "2026-11-20T10:00:00Z" },
    { name: "PlayerA", score: 1200, nights_won: 3, achieved_at: "2026-11-20T12:00:00Z" },
    { name: "PlayerC", score: 800, nights_won: 2, achieved_at: "2026-11-20T09:00:00Z" }, // Bằng điểm PlayerB nhưng trước
    { name: "PlayerD", score: 500, nights_won: 1, achieved_at: "2026-11-20T11:00:00Z" }
  ];

  const result = sortAndSliceLeaderboard(sampleEntries);
  assert.equal(result.entries.length, 4);
  assert.equal(result.entries[0].name, "PlayerA"); // 1200
  assert.equal(result.entries[1].name, "PlayerC"); // 800 (09:00)
  assert.equal(result.entries[2].name, "PlayerB"); // 800 (10:00)
  assert.equal(result.entries[3].name, "PlayerD"); // 500

  // 3. Giữ tối đa top 10
  const manyEntries = [];
  for (let i = 1; i <= 25; i++) {
    manyEntries.push({ name: `User_${i}`, score: i * 50, nights_won: 1, achieved_at: new Date().toISOString() });
  }
  const top10 = sortAndSliceLeaderboard(manyEntries);
  assert.equal(top10.entries.length, 10);
  assert.equal(top10.entries[0].score, 1250); // Điểm cao nhất
  assert.equal(top10.entries[9].score, 800);  // Thứ 10
});

test("Phase 4: Leaderboard export command outputs formatted JSON", async () => {
  const { exportLeaderboard, addLeaderboardEntry } = await import("../src/core/leaderboard.js");
  const testDbPath = path.join(os.tmpdir(), "test_lb_db.json");
  const testExportPath = path.join(os.tmpdir(), "test_lb_export.json");

  // Add dummy entry
  addLeaderboardEntry({ name: "May_Hero", score: 1500, nights_won: 3, seed: 42 }, testDbPath);
  exportLeaderboard(testExportPath, testDbPath);

  assert.equal(fs.existsSync(testExportPath), true);
  const raw = fs.readFileSync(testExportPath, "utf-8");
  const data = JSON.parse(raw);
  assert.equal(Array.isArray(data.entries), true);
  assert.equal(data.entries.length >= 1, true);
  assert.equal(data.entries[0].name, "May_Hero");

  // Cleanup
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  if (fs.existsSync(testExportPath)) fs.unlinkSync(testExportPath);
});

test("Phase 4: Benchmark CLI generates compliant bench.json", () => {
  assert.equal(fs.existsSync("bench.json"), true);
  const raw = fs.readFileSync("bench.json", "utf-8");
  const data = JSON.parse(raw);

  assert.equal(data.contract_version, "1.3");
  assert.equal(data.avg_fps >= 60, true);
  assert.equal(data.p1_low_fps >= 30, true);
  assert.equal(data.load_ms <= 10000, true);
  assert.equal(data.vsync_off, true);
  assert.equal(typeof data.renderer, "string");
  assert.equal(typeof data.os, "string");
});

test("Phase 4: Soak test generates compliant soak.json", () => {
  assert.equal(fs.existsSync("soak.json"), true);
  const raw = fs.readFileSync("soak.json", "utf-8");
  const data = JSON.parse(raw);

  assert.equal(data.nights >= 10, true);
  assert.equal(data.crashes, 0);
  assert.equal(Array.isArray(data.results), true);
  assert.equal(data.mem_end_mb <= 1.2 * data.mem_start_mb, true);
});

