import { SeededRNG } from "./rng.js";
import { DEFAULT_TUNING } from "./constants.js";

export function round3(num) {
  return Math.round(num * 1000) / 1000;
}

export function distXZ(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dz);
}

export class Simulation {
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.rng = new SeededRNG(this.seed);
    this.tuning = { ...DEFAULT_TUNING, ...options.tuning };
    if (options.tuning && options.tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...options.tuning.score };
    }

    this.dt = 1 / 60;
    this.tick = 0;
    this.sim_tick = 0;
    this.state = "playing"; // "playing" | "won" | "lost"
    this.score = 0;
    this.duration_s = this.tuning.night1_duration_s;
    this.time_left_s = this.duration_s;

    // Player state
    this.player = {
      pos: [0.0, 0.0, 0.0],
      carried: 0,
      flames: this.tuning.flames,
      invuln_timer: 0.0,
      pulse_cooldown: 0.0
    };

    // World entities
    this.lanterns = [];
    this.motes = [];
    this.shades = [];

    // Inputs queue and previous frame state
    this.inputFrames = [];
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false
    };
    this.prevInputButtons = {
      jump: false,
      interact: false,
      pulse: false
    };

    // Events collector
    this.events = [];

    this.initDefaultWorld();
    if (options.scenario) {
      this.applyScenario(options.scenario);
    }
    if (options.inputs) {
      this.loadInputs(options.inputs);
    }
  }

  initDefaultWorld() {
    // 5 lanterns arranged radially
    const lanternRadius = 25.0;
    for (let i = 0; i < this.tuning.lantern_count_night1; i++) {
      const angle = (i * 2 * Math.PI) / this.tuning.lantern_count_night1;
      this.lanterns.push({
        id: `L${i + 1}`,
        pos: [round3(Math.cos(angle) * lanternRadius), 0.0, round3(Math.sin(angle) * lanternRadius)],
        deposited: 0,
        lit: false
      });
    }

    // Default motes
    for (let i = 0; i < 20; i++) {
      const angle = this.rng.range(0, Math.PI * 2);
      const r = this.rng.range(4, 28);
      this.motes.push({
        id: `M${i + 1}`,
        pos: [round3(Math.cos(angle) * r), 0.0, round3(Math.sin(angle) * r)]
      });
    }

    // Default shades
    this.shades.push({
      id: "S1",
      pos: [20.0, 0.0, 0.0],
      state: "chase",
      stun_timer: 0.0
    });
  }

  applyScenario(scenario) {
    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
    }
    if (scenario.time_left_s !== undefined) {
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.random_motes === false) {
      this.motes = [];
    }
    if (scenario.motes && Array.isArray(scenario.motes)) {
      this.motes = scenario.motes.map((m, idx) => {
        if (Array.isArray(m)) {
          return { id: `M${idx + 1}`, pos: [m[0], m[1] ?? 0.0, m[2]] };
        }
        return { id: m.id || `M${idx + 1}`, pos: [...m.pos] };
      });
    }

    if (scenario.random_shades === false) {
      this.shades = [];
    }
    if (scenario.shades && Array.isArray(scenario.shades)) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [...s.pos],
        state: s.state || "chase",
        stun_timer: 0.0
      }));
    }

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const lData of scenario.lanterns) {
        const existing = this.lanterns.find((l) => l.id === lData.id);
        if (existing) {
          if (lData.pos) existing.pos = [...lData.pos];
          if (lData.deposited !== undefined) existing.deposited = lData.deposited;
          if (lData.lit !== undefined) existing.lit = lData.lit;
        } else {
          this.lanterns.push({
            id: lData.id,
            pos: lData.pos ? [...lData.pos] : [0, 0, 0],
            deposited: lData.deposited || 0,
            lit: !!lData.lit
          });
        }
      }
    }
  }

  loadInputs(inputsData) {
    if (inputsData && Array.isArray(inputsData.frames)) {
      this.inputFrames = [...inputsData.frames].sort((a, b) => a.tick - b.tick);
    }
  }

  step() {
    if (this.state !== "playing") {
      this.tick++;
      this.sim_tick++;
      return;
    }

    // 1. Apply inputs for current tick
    while (this.inputFrames.length > 0 && this.inputFrames[0].tick <= this.tick) {
      const frame = this.inputFrames.shift();
      if (frame.move) this.currentInput.move = [...frame.move];
      if (frame.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = frame.cam_yaw_deg;
      if (frame.jump !== undefined) this.currentInput.jump = frame.jump;
      if (frame.interact !== undefined) this.currentInput.interact = frame.interact;
      if (frame.pulse !== undefined) this.currentInput.pulse = frame.pulse;
    }

    const interactTriggered = this.currentInput.interact && !this.prevInputButtons.interact;
    const pulseTriggered = this.currentInput.pulse && !this.prevInputButtons.pulse;
    this.prevInputButtons = {
      jump: !!this.currentInput.jump,
      interact: !!this.currentInput.interact,
      pulse: !!this.currentInput.pulse
    };

    // 2. Cooldowns & timers update
    if (this.player.invuln_timer > 0) {
      this.player.invuln_timer = Math.max(0, this.player.invuln_timer - this.dt);
    }
    if (this.player.pulse_cooldown > 0) {
      this.player.pulse_cooldown = Math.max(0, this.player.pulse_cooldown - this.dt);
    }

    // 3. Player Movement
    const [mx, mz] = this.currentInput.move;
    let len = Math.hypot(mx, mz);
    let nx = mx;
    let nz = mz;
    if (len > 1.0) {
      nx = mx / len;
      nz = mz / len;
    }
    if (len > 0.0001) {
      const rad = (this.currentInput.cam_yaw_deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const wx = nx * cos + nz * sin;
      const wz = -nx * sin + nz * cos;
      this.player.pos[0] = round3(this.player.pos[0] + wx * this.tuning.player_speed * this.dt);
      this.player.pos[2] = round3(this.player.pos[2] + wz * this.tuning.player_speed * this.dt);
    }

    const nextTick = this.tick + 1;

    // 4. Mote Pickups
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const mote = this.motes[i];
      if (distXZ(this.player.pos, mote.pos) <= this.tuning.pickup_radius) {
        if (this.player.carried < this.tuning.carry_capacity) {
          this.player.carried++;
          this.score += this.tuning.score.per_mote;
          this.motes.splice(i, 1);
          this.events.push({
            type: "event",
            tick: nextTick,
            name: "mote_picked",
            data: { carried: this.player.carried }
          });
        }
      }
    }

    // 5. Lantern Interaction
    if (interactTriggered) {
      let closest = null;
      let minDist = Infinity;
      for (const lantern of this.lanterns) {
        const d = distXZ(this.player.pos, lantern.pos);
        if (d <= this.tuning.interact_radius && d < minDist) {
          minDist = d;
          closest = lantern;
        }
      }

      if (closest && !closest.lit && this.player.carried > 0) {
        const needed = this.tuning.lantern_cost - closest.deposited;
        const amount = Math.min(this.player.carried, needed);
        this.player.carried -= amount;
        closest.deposited += amount;
        this.events.push({
          type: "event",
          tick: nextTick,
          name: "deposit",
          data: {
            lantern_id: closest.id,
            amount,
            deposited: closest.deposited
          }
        });

        if (closest.deposited >= this.tuning.lantern_cost) {
          closest.lit = true;
          this.score += this.tuning.score.per_lantern;
          this.events.push({
            type: "event",
            tick: nextTick,
            name: "lantern_lit",
            data: { lantern_id: closest.id }
          });
        }
      }
    }

    // 6. Pulse Trigger
    if (pulseTriggered && this.player.pulse_cooldown <= 0) {
      this.player.pulse_cooldown = this.tuning.pulse_cooldown_s;
      const stunnedIds = [];
      for (const shade of this.shades) {
        const d = distXZ(this.player.pos, shade.pos);
        if (d <= this.tuning.pulse_radius) {
          shade.state = "stunned";
          shade.stun_timer = this.tuning.pulse_stun_s;
          // Push away
          let dx = shade.pos[0] - this.player.pos[0];
          let dz = shade.pos[2] - this.player.pos[2];
          let pLen = Math.hypot(dx, dz) || 1.0;
          shade.pos[0] = round3(shade.pos[0] + (dx / pLen) * this.tuning.pulse_push_m);
          shade.pos[2] = round3(shade.pos[2] + (dz / pLen) * this.tuning.pulse_push_m);
          stunnedIds.push(shade.id);
          this.score += this.tuning.score.per_stun;
        }
      }
      this.events.push({
        type: "event",
        tick: nextTick,
        name: "pulse",
        data: { stunned_ids: stunnedIds }
      });
    }

    // 7. Shades Update & AI
    for (const shade of this.shades) {
      if (shade.state === "stunned") {
        shade.stun_timer -= this.dt;
        if (shade.stun_timer <= 0) {
          shade.state = "chase";
        }
      } else if (shade.state === "chase") {
        // Move towards player
        let dx = this.player.pos[0] - shade.pos[0];
        let dz = this.player.pos[2] - shade.pos[2];
        let d = Math.hypot(dx, dz);
        if (d > 0.01) {
          const stepDist = this.tuning.shade_speed * this.dt;
          shade.pos[0] = round3(shade.pos[0] + (dx / d) * stepDist);
          shade.pos[2] = round3(shade.pos[2] + (dz / d) * stepDist);
        }

        // Check collision with player
        if (distXZ(this.player.pos, shade.pos) <= this.tuning.shade_hit_radius) {
          if (this.player.invuln_timer <= 0) {
            this.player.flames = Math.max(0, this.player.flames - 1);
            const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried -= dropped;
            this.player.invuln_timer = this.tuning.invuln_s;
            this.events.push({
              type: "event",
              tick: nextTick,
              name: "player_hit",
              data: {
                by: "shade",
                flames: this.player.flames,
                dropped
              }
            });

            if (this.player.flames <= 0) {
              this.state = "lost";
              this.events.push({
                type: "event",
                tick: nextTick,
                name: "game_over",
                data: { result: "lost", reason: "no_flames" }
              });
            }
          }
        }
      }
    }

    // 8. Time decrement & Check Win / Loss
    this.tick++;
    this.sim_tick++;
    this.time_left_s = Math.max(0, round3(this.duration_s - this.sim_tick / 60));

    if (this.state === "playing") {
      const allLit = this.lanterns.length > 0 && this.lanterns.every((l) => l.lit);
      if (allLit) {
        this.state = "won";
        this.score += Math.floor(this.time_left_s * this.tuning.score.per_second_left);
        this.score += this.player.flames * this.tuning.score.per_flame_left;
        this.events.push({
          type: "event",
          tick: this.tick,
          name: "game_over",
          data: { result: "won", reason: "all_lit" }
        });
      } else if (this.time_left_s <= 0) {
        this.state = "lost";
        this.events.push({
          type: "event",
          tick: this.tick,
          name: "game_over",
          data: { result: "lost", reason: "dawn" }
        });
      }
    }
  }

  getSnapshot() {
    return {
      type: "snapshot",
      tick: this.tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      motes_active: this.motes.length
    };
  }

  flushEvents() {
    const list = this.events;
    this.events = [];
    return list;
  }
}
