import { SeededRNG } from "./rng.js";
export { SeededRNG };
import { DEFAULT_TUNING, MAP_CONFIGS } from "./constants.js";

export function round1(num) {
  return Math.round(num * 10) / 10;
}

export function round3(num) {
  return Math.round(num * 1000) / 1000;
}

export function distXZ(p1, p2) {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dz);
}

export function dist3D(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = (p1[1] ?? 0) - (p2[1] ?? 0);
  const dz = p1[2] - p2[2];
  return Math.hypot(dx, dy, dz);
}

export class Simulation {
  constructor(options = {}) {
    this.seed = options.seed ?? 42;
    this.rng = new SeededRNG(this.seed);
    this.night = options.night ?? 1;
    this.tuning = { ...DEFAULT_TUNING, ...options.tuning };
    if (options.tuning && options.tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...options.tuning.score };
    }

    this.map = MAP_CONFIGS[this.night] || MAP_CONFIGS[1];
    this.dt = 1 / 60;
    this.tick = 0;
    this.sim_tick = 0;
    this.state = "playing"; // "playing" | "won" | "lost" | "paused"
    this.is_paused = false;
    this.score = 0;
    this.duration_s = this.map.duration_s;
    this.time_left_s = this.duration_s;
    this.base_time_left_s = this.duration_s;

    // Player state
    this.player = {
      pos: [...this.map.start_pos],
      vel: [0.0, 0.0, 0.0],
      facing_dir: [0.0, 1.0], // facing +Z initially
      grounded: true,
      carried: 0,
      flames: this.tuning.flames,
      successful_lights: 0,
      invuln_ticks: 0,
      dash_cd_ticks: 0,
      dash_ticks_left: 0,
      dash_vel: [0.0, 0.0],
      pulse_cd_ticks: 0,
      charm_ticks: 0,
      falling: false,
      fall_wait_ticks: 0,
      jump_pad_vel: null
    };

    // Backwards-compatibility getter/setter for vy
    Object.defineProperty(this.player, "vy", {
      get() { return this.vel[1]; },
      set(v) { this.vel[1] = v; }
    });

    // Wind (Night 3)
    this.wind = {
      enabled: this.map.wind_enabled,
      active: false,
      dir_deg: 0,
      warn_ticks: 0,
      active_ticks: 0,
      cycle_ticks: 0
    };

    // Entities
    this.lanterns = [];
    this.motes = [];
    this.shades = [];
    this.drifters = [];
    this.charms = [];
    this.jump_pads = [];
    this.obstacles_enabled = options.obstacles_enabled ?? false;
    this.bench_mode = options.bench_mode ?? false;
    this.obstacles = (this.map.obstacles || []).map((o) => ({ ...o }));

    // Next ID counters
    this.nextMoteId = 1;
    this.nextShadeId = 1;
    this.nextDrifterId = 1;

    // Inputs
    this.inputFrames = [];
    this.currentInput = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };
    this.prevInputButtons = {
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };

    this.events = [];

    this.initDefaultWorld();
    if (options.scenario) {
      this.applyScenario(options.scenario);
    }
    if (options.inputs) {
      this.loadInputs(options.inputs);
    }
  }

  get capacity() {
    const baseCap = this.tuning.carry_capacity || 10;
    const maxCap = this.tuning.capacity_max || 20;
    return Math.min(maxCap, baseCap + 2 * (this.player.successful_lights || 0));
  }

  initDefaultWorld() {
    // 1. Lanterns
    this.lanterns = this.map.lanterns.map((l) => ({
      id: l.id,
      pos: [...l.pos],
      deposited: 0,
      lit: false,
      fuel: 0.0,
      ever_lit: false,
      relit_count: 0,
      lit_ticks_ago: -1
    }));

    // 2. Initial Motes (20 points)
    const pts = this.map.mote_spawn_points;
    const initialCount = Math.min(20, pts.length);
    for (let i = 0; i < initialCount; i++) {
      this.motes.push({
        id: `M${this.nextMoteId++}`,
        pos: [...pts[i]],
        kind: "random",
        ttl_ticks: null,
        spawn_point_idx: i
      });
    }

    // 3. Jump Pads
    this.jump_pads = (this.map.jump_pads || []).map((jp) => ({ ...jp }));

    // 4. Charms
    this.charms = (this.map.charms || []).map((c) => ({
      id: c.id,
      pos: [...c.pos],
      available: true,
      respawn_ticks: 0
    }));

    // Night start event
    this.events.push({
      type: "event",
      tick: 0,
      name: "night_start",
      data: { night: this.night }
    });
  }

  applyScenario(scenario) {
    if (scenario.night !== undefined) {
      this.night = scenario.night;
      this.map = MAP_CONFIGS[this.night] || MAP_CONFIGS[1];
      this.duration_s = this.map.duration_s;
      this.time_left_s = this.duration_s;
      this.base_time_left_s = this.duration_s;
    }
    if (scenario.time_left_s !== undefined) {
      this.time_left_s = scenario.time_left_s;
      this.base_time_left_s = scenario.time_left_s;
      this.sim_tick = 0;
    }
    if (scenario.wind_enabled !== undefined) {
      this.wind.enabled = scenario.wind_enabled;
    }

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.invuln_ticks !== undefined) this.player.invuln_ticks = scenario.player.invuln_ticks;
      if (scenario.player.dash_cd_ticks !== undefined) this.player.dash_cd_ticks = scenario.player.dash_cd_ticks;
      if (scenario.player.pulse_cd_ticks !== undefined) this.player.pulse_cd_ticks = scenario.player.pulse_cd_ticks;
      if (scenario.player.charm_ticks !== undefined) this.player.charm_ticks = scenario.player.charm_ticks;
      if (scenario.player.successful_lights !== undefined) this.player.successful_lights = scenario.player.successful_lights;
    }

    if (scenario.random_motes === false) {
      this.motes = [];
    }
    if (scenario.motes && Array.isArray(scenario.motes)) {
      this.motes = scenario.motes.map((m, idx) => {
        if (Array.isArray(m)) {
          return { id: `M${idx + 1}`, pos: [m[0], m[1] ?? 0.0, m[2]], kind: "random", ttl_ticks: null };
        }
        return {
          id: m.id || `M${idx + 1}`,
          pos: [...m.pos],
          kind: m.kind || "random",
          ttl_ticks: m.ttl_s ? Math.round(m.ttl_s * 60) : null
        };
      });
      this.nextMoteId = this.motes.length + 1;
    }

    if (scenario.random_shades === false) {
      this.shades = [];
    }
    if (scenario.shades && Array.isArray(scenario.shades)) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [...s.pos],
        state: s.state || "wander",
        state_ticks_left: s.state_ticks_left || 0,
        recoil_vel: [0, 0],
        target_lantern_id: s.target_lantern_id || null,
        drain_ticks: 0
      }));
      this.nextShadeId = this.shades.length + 1;
    }

    if (scenario.drifters && Array.isArray(scenario.drifters)) {
      this.drifters = scenario.drifters.map((d, idx) => ({
        id: d.id || `D${idx + 1}`,
        pos: [...d.pos],
        state: d.state || "idle",
        stolen: d.stolen || 0,
        flee_ticks_left: d.flee_ticks_left || 0
      }));
      this.nextDrifterId = this.drifters.length + 1;
    }

    if (scenario.charms && Array.isArray(scenario.charms)) {
      this.charms = scenario.charms.map((c) => ({
        id: c.id,
        pos: [...c.pos],
        available: c.available !== undefined ? c.available : true,
        respawn_ticks: c.respawn_s ? Math.round(c.respawn_s * 60) : 0
      }));
    }

    if (scenario.lanterns && Array.isArray(scenario.lanterns)) {
      for (const lData of scenario.lanterns) {
        const existing = this.lanterns.find((l) => l.id === lData.id);
        const isLit = lData.lit !== undefined ? !!lData.lit : (lData.fuel !== undefined ? lData.fuel > 0 : false);
        const fuel = lData.fuel !== undefined ? lData.fuel : (isLit ? (this.tuning.fuel_max || 100) : 0.0);
        const everLit = lData.ever_lit !== undefined ? !!lData.ever_lit : (isLit || false);
        const relitCount = lData.relit_count !== undefined ? lData.relit_count : 0;

        if (existing) {
          if (lData.pos) existing.pos = [...lData.pos];
          if (lData.deposited !== undefined) existing.deposited = lData.deposited;
          existing.lit = isLit;
          existing.fuel = fuel;
          existing.ever_lit = everLit;
          existing.relit_count = relitCount;
          if (isLit) existing.lit_ticks_ago = 100;
        } else {
          this.lanterns.push({
            id: lData.id,
            pos: lData.pos ? [...lData.pos] : [0, 0, 0],
            deposited: lData.deposited || 0,
            lit: isLit,
            fuel,
            ever_lit: everLit,
            relit_count: relitCount,
            lit_ticks_ago: isLit ? 100 : -1
          });
        }
      }
    }
  }

  loadInputs(inputsData) {
    if (!inputsData) return;
    if (inputsData.frames !== undefined) {
      if (!Array.isArray(inputsData.frames)) {
        throw new Error("Invalid inputs format: frames must be an array");
      }
      let prevTick = -1;
      for (const frame of inputsData.frames) {
        if (typeof frame.tick !== "number" || frame.tick <= prevTick) {
          throw new Error(`Invalid inputs format: frame tick ${frame.tick} must be strictly increasing`);
        }
        prevTick = frame.tick;
      }
      this.inputFrames = [...inputsData.frames];
    }
  }

  step() {
    if (this.state === "won" || this.state === "lost") {
      this.tick++;
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 1: Đọc Input & Xử lý Pause
    // ─────────────────────────────────────────────────────────────
    while (this.inputFrames.length > 0 && this.inputFrames[0].tick <= this.tick) {
      const frame = this.inputFrames.shift();
      if (frame.move) this.currentInput.move = [...frame.move];
      if (frame.cam_yaw_deg !== undefined) this.currentInput.cam_yaw_deg = frame.cam_yaw_deg;
      if (frame.jump !== undefined) this.currentInput.jump = frame.jump;
      if (frame.interact !== undefined) this.currentInput.interact = frame.interact;
      if (frame.pulse !== undefined) this.currentInput.pulse = frame.pulse;
      if (frame.dash !== undefined) this.currentInput.dash = frame.dash;
      if (frame.pause !== undefined) this.currentInput.pause = frame.pause;
    }

    const pauseTriggered = this.currentInput.pause && !this.prevInputButtons.pause;
    this.prevInputButtons.pause = !!this.currentInput.pause;

    if (pauseTriggered) {
      this.is_paused = !this.is_paused;
      this.state = this.is_paused ? "paused" : "playing";
      this.events.push({
        type: "event",
        tick: this.tick + 1,
        name: this.is_paused ? "paused" : "resumed",
        data: {}
      });
    }

    // Nếu đang paused: tick tăng, nhưng sim_tick, timer, cooldowns đứng yên!
    if (this.is_paused) {
      this.tick++;
      return;
    }

    const jumpTriggered = this.currentInput.jump && !this.prevInputButtons.jump;
    const interactTriggered = this.currentInput.interact && !this.prevInputButtons.interact;
    const pulseTriggered = this.currentInput.pulse && !this.prevInputButtons.pulse;
    const dashTriggered = this.currentInput.dash && !this.prevInputButtons.dash;

    this.prevInputButtons = {
      jump: !!this.currentInput.jump,
      interact: !!this.currentInput.interact,
      pulse: !!this.currentInput.pulse,
      dash: !!this.currentInput.dash,
      pause: !!this.currentInput.pause
    };

    const nextTick = this.tick + 1;

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 2: Giảm các bộ đếm (Cooldowns, Invuln, Stun, Charm, TTL) & Trừ Nhiên Liệu
    // ─────────────────────────────────────────────────────────────
    if (this.player.invuln_ticks > 0) this.player.invuln_ticks--;
    if (this.player.dash_cd_ticks > 0) this.player.dash_cd_ticks--;
    if (this.player.pulse_cd_ticks > 0) this.player.pulse_cd_ticks--;
    if (this.player.charm_ticks > 0) this.player.charm_ticks--;

    // TTL đom đóm rơi
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      if (m.ttl_ticks !== null) {
        m.ttl_ticks--;
        if (m.ttl_ticks <= 0) {
          this.motes.splice(i, 1);
        }
      }
    }

    // Hồi bùa
    for (const c of this.charms) {
      if (!c.available) {
        c.respawn_ticks--;
        if (c.respawn_ticks <= 0) {
          c.available = true;
        }
      }
    }

    // Cập nhật gió (Đêm 3)
    if (this.wind.enabled) {
      this.wind.cycle_ticks = (this.wind.cycle_ticks + 1) % 1800; // 30s cycle
      if (this.wind.cycle_ticks === 1680) {
        this.wind.dir_deg = this.rng.range(0, 360);
      }
      this.wind.active = this.wind.cycle_ticks >= 1800 - 300; // last 5s
    }

    // 2.5 Trừ nhiên liệu đèn (Hao hụt tự nhiên + Bóng Mực hút) (tắt khi bench_mode)
    if (!this.bench_mode) {
      const decayPerTick = (this.tuning.fuel_decay_per_s || 1.0) / 60;
      const drainPerTick = (this.tuning.drain_per_s || 5.0) / 60;

      for (const lantern of this.lanterns) {
        if (lantern.lit) {
          let totalDrainThisTick = decayPerTick;

          // Kiểm tra các Bóng Mực đang ở trạng thái drain vào đèn này
          for (const shade of this.shades) {
            if (shade.state === "drain" && shade.target_lantern_id === lantern.id) {
              totalDrainThisTick += drainPerTick;
              shade.drain_ticks = (shade.drain_ticks || 0) + 1;
              // Ghi sự kiện fuel_drain mỗi 60 tick khi đang hút
              if (shade.drain_ticks % 60 === 0) {
                this.events.push({
                  type: "event",
                  tick: nextTick,
                  name: "fuel_drain",
                  data: {
                    lantern_id: lantern.id,
                    shade_id: shade.id,
                    fuel: round1(Math.max(0, lantern.fuel - totalDrainThisTick))
                  }
                });
              }
            }
          }

          lantern.fuel = Math.max(0, lantern.fuel - totalDrainThisTick);

          // Ngay sau bước 2, đèn có fuel <= 0 tắt, phát sự kiện lantern_out
          if (lantern.fuel <= 0.0001) {
            lantern.fuel = 0.0;
            lantern.lit = false;
            lantern.deposited = 0;
            lantern.ever_lit = true;
            this.events.push({
              type: "event",
              tick: nextTick,
              name: "lantern_out",
              data: {
                lantern_id: lantern.id
              }
            });
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 3: Di chuyển Mây (Nhảy, Lướt, Bục nhảy, Gió) & Rơi đảo
    // ─────────────────────────────────────────────────────────────
    if (this.player.falling) {
      this.player.fall_wait_ticks--;
      if (this.player.fall_wait_ticks <= 0) {
        // Hồi sinh tại điểm xuất phát
        this.player.pos = [...this.map.start_pos];
        this.player.vel = [0.0, 0.0, 0.0];
        this.player.invuln_ticks = this.tuning.invuln_ticks;
        this.player.falling = false;
        this.player.jump_pad_vel = null;
      }
    } else {
      // 3.1 Xử lý Dash
      if (dashTriggered && this.player.dash_ticks_left <= 0) {
        const canDash = this.player.charm_ticks > 0 || this.player.dash_cd_ticks <= 0;
        if (canDash) {
          this.player.dash_ticks_left = this.tuning.dash_duration_ticks;
          if (this.player.charm_ticks <= 0) {
            this.player.dash_cd_ticks = this.tuning.dash_cooldown_ticks;
          }
          let [mx, mz] = this.currentInput.move;
          if (Math.hypot(mx, mz) < 0.01) {
            this.player.dash_vel = [this.player.facing_dir[0] * this.tuning.dash_speed, this.player.facing_dir[1] * this.tuning.dash_speed];
          } else {
            const rad = (this.currentInput.cam_yaw_deg * Math.PI) / 180;
            const wx = mx * Math.cos(rad) + mz * Math.sin(rad);
            const wz = -mx * Math.sin(rad) + mz * Math.cos(rad);
            const wLen = Math.hypot(wx, wz) || 1.0;
            this.player.dash_vel = [(wx / wLen) * this.tuning.dash_speed, (wz / wLen) * this.tuning.dash_speed];
          }
          this.events.push({
            type: "event",
            tick: nextTick,
            name: "dash",
            data: {}
          });
        }
      }

      // 3.2 Nhảy (chỉ khi chạm đất)
      if (jumpTriggered && this.player.grounded && this.player.dash_ticks_left <= 0) {
        this.player.vel[1] = this.tuning.jump_vy;
        this.player.grounded = false;
      }

      // 3.3 Tính toán vận tốc & di chuyển
      let moveSpeed = this.player.charm_ticks > 0 ? this.tuning.player_charm_speed : this.tuning.player_speed;
      let vx = 0, vz = 0;

      if (this.player.dash_ticks_left > 0) {
        this.player.dash_ticks_left--;
        vx = this.player.dash_vel[0];
        vz = this.player.dash_vel[1];
        // Lướt trên không giữ nguyên độ cao Y
      } else if (this.player.jump_pad_vel) {
        vx = this.player.jump_pad_vel[0];
        vz = this.player.jump_pad_vel[2];
        this.player.vel[1] += this.tuning.gravity * this.dt;
        this.player.pos[1] += this.player.vel[1] * this.dt;
      } else {
        let [mx, mz] = this.currentInput.move;
        const len = Math.hypot(mx, mz);
        if (len > 0.01) {
          const nx = len > 1.0 ? mx / len : mx;
          const nz = len > 1.0 ? mz / len : mz;
          const rad = (this.currentInput.cam_yaw_deg * Math.PI) / 180;
          const wx = nx * Math.cos(rad) + nz * Math.sin(rad);
          const wz = -nx * Math.sin(rad) + nz * Math.cos(rad);
          vx = wx * moveSpeed;
          vz = wz * moveSpeed;
          this.player.facing_dir = [wx, wz];
        }

        if (!this.player.grounded) {
          this.player.vel[1] += this.tuning.gravity * this.dt;
          this.player.pos[1] += this.player.vel[1] * this.dt;
        }
      }

      // Gió mạnh (Đêm 3)
      if (this.wind.active && this.player.dash_ticks_left <= 0) {
        const wRad = (this.wind.dir_deg * Math.PI) / 180;
        vx += Math.cos(wRad) * 2.0;
        vz += Math.sin(wRad) * 2.0;
      }

      const prevX = this.player.pos[0];
      const prevZ = this.player.pos[2];

      this.player.pos[0] = round3(this.player.pos[0] + vx * this.dt);
      this.player.pos[2] = round3(this.player.pos[2] + vz * this.dt);
      this.player.vel[0] = round3(vx);
      this.player.vel[2] = round3(vz);

      // Clamp boundary if fall is disabled
      if (!this.tuning.fall_enabled && this.night === 1) {
        const d = Math.hypot(this.player.pos[0], this.player.pos[2]);
        const maxR = this.map.island_radius || this.map.radius || 40.0;
        if (d > maxR) {
          this.player.pos[0] = round3((this.player.pos[0] / d) * maxR);
          this.player.pos[2] = round3((this.player.pos[2] / d) * maxR);
        }
      }

      // Resolve obstacle collision (cannot walk through solid trees, rocks, pillars)
      if (this.obstacles_enabled) {
        this.resolveObstacleCollision(this.player.pos, 0.45);
      }

      // 3.4 Kiểm tra độ cao mặt đất & Grounded
      const groundY = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
      if (this.player.dash_ticks_left <= 0) {
        // Chặn leo tường vách đứng: nếu độ cao mặt đất đột ngột cao hơn người chơi > 0.6m,
        // đây là vách đá/tường thành, không cho đi bộ xuyên lên đỉnh mà giữ ở chân vách.
        if (this.player.grounded && groundY > this.player.pos[1] + 0.6) {
          this.player.pos[0] = prevX;
          this.player.pos[2] = prevZ;
        } else if (this.player.pos[1] <= groundY) {
          this.player.pos[1] = groundY;
          this.player.vel[1] = 0.0;
          this.player.grounded = true;
          this.player.jump_pad_vel = null;
        } else {
          this.player.grounded = false;
        }
      }

      // 3.5 Bục nhảy (Jump Pads)
      for (const jp of this.jump_pads) {
        const d = distXZ(this.player.pos, jp.pos);
        if (d <= jp.radius && Math.abs(this.player.pos[1] - jp.pos[1]) <= 0.5) {
          this.player.grounded = false;
          this.player.vel[1] = jp.vy;
          if (jp.target) {
            const dx = jp.target[0] - jp.pos[0];
            const dz = jp.target[2] - jp.pos[2];
            const dist = Math.hypot(dx, dz) || 1.0;
            this.player.jump_pad_vel = [(dx / dist) * jp.vx_speed, jp.vy, (dz / dist) * jp.vx_speed];
          } else if (jp.dir) {
            this.player.jump_pad_vel = [jp.dir[0] * jp.vx_speed, jp.vy, jp.dir[2] * jp.vx_speed];
          }
          break;
        }
      }

      // 3.6 Rơi khỏi đảo (Y < -10)
      if (this.player.pos[1] < this.tuning.fall_death_y) {
        this.player.flames = Math.max(0, this.player.flames - 1);
        const dropped = this.player.carried;
        this.player.carried = 0;
        this.player.falling = true;
        this.player.fall_wait_ticks = this.tuning.fall_wait_ticks;
        const lost = this.player.flames <= 0;

        this.events.push({
          type: "event",
          tick: nextTick,
          name: "player_hit",
          data: {
            by: "fall",
            flames: this.player.flames,
            dropped,
            lost
          }
        });

        if (lost) {
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

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 4: Nhặt đom đóm & bùa (khi không trong trạng thái falling, tắt khi bench_mode)
    // ─────────────────────────────────────────────────────────────
    if (!this.bench_mode && !this.player.falling) {
      // 4.1 Nhặt đom đóm (sức chứa tăng dần theo capacity)
      for (let i = this.motes.length - 1; i >= 0; i--) {
        const m = this.motes[i];
        if (m.spawn_tick === this.tick) continue;

        const dXZ = distXZ(this.player.pos, m.pos);
        const dY = Math.abs(this.player.pos[1] - m.pos[1]);
        if (dXZ <= this.tuning.pickup_radius && dY <= this.tuning.pickup_dy) {
          if (this.player.carried < this.capacity) {
            this.player.carried++;
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

      // 4.2 Nhặt bùa gió
      for (const c of this.charms) {
        if (c.available) {
          const dXZ = distXZ(this.player.pos, c.pos);
          const dY = Math.abs(this.player.pos[1] - c.pos[1]);
          if (dXZ <= this.tuning.pickup_radius && dY <= this.tuning.pickup_dy) {
            c.available = false;
            c.respawn_ticks = this.tuning.charm_respawn_ticks;
            this.player.charm_ticks = this.tuning.charm_duration_ticks;
            this.events.push({
              type: "event",
              tick: nextTick,
              name: "charm_picked",
              data: { charm_id: c.id }
            });
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 5: Tương tác với Đèn (Thắp mới, Thắp lại, Châm dầu)
    // ─────────────────────────────────────────────────────────────
    if (interactTriggered && !this.player.falling && this.player.carried > 0) {
      const maxFuel = this.tuning.fuel_max || 100;
      // Chỉ xét đèn nhận được: chưa sáng, hoặc sáng nhưng chưa đầy dầu
      const candidates = this.lanterns.filter((l) => {
        if (!l.lit) return true;
        if (l.lit && l.fuel < maxFuel) return true;
        return false;
      });

      const reachable = candidates
        .filter((l) => distXZ(this.player.pos, l.pos) <= this.tuning.interact_radius)
        .sort((a, b) => {
          const dA = distXZ(this.player.pos, a.pos);
          const dB = distXZ(this.player.pos, b.pos);
          if (Math.abs(dA - dB) > 0.001) return dA - dB;
          return a.id.localeCompare(b.id, undefined, { numeric: true });
        });

      if (reachable.length > 0) {
        const lantern = reachable[0];

        if (!lantern.lit) {
          // Thắp mới hoặc Thắp lại
          const cost = lantern.ever_lit ? (this.tuning.relight_cost || 5) : (this.tuning.lantern_cost || 10);
          const needed = cost - lantern.deposited;
          const depositAmount = Math.min(this.player.carried, needed);

          this.player.carried -= depositAmount;
          lantern.deposited += depositAmount;
          this.score += depositAmount * (this.tuning.score.per_mote_deposit || 5);

          if (lantern.deposited >= cost) {
            lantern.lit = true;
            lantern.fuel = maxFuel;
            lantern.lit_ticks_ago = 0;
            const isRelight = !!lantern.ever_lit;
            if (isRelight) {
              lantern.relit_count = (lantern.relit_count || 0) + 1;
            }
            lantern.ever_lit = true;
            this.player.successful_lights = (this.player.successful_lights || 0) + 1;

            const bonus = isRelight ? (this.tuning.score.relight_bonus || 40) : (this.tuning.score.first_light_bonus || 100);
            this.score += bonus;

            this.events.push({
              type: "event",
              tick: nextTick,
              name: "deposit",
              data: {
                lantern_id: lantern.id,
                amount: depositAmount,
                deposited: lantern.deposited,
                lit: true
              }
            });

            this.events.push({
              type: "event",
              tick: nextTick,
              name: "lantern_lit",
              data: {
                lantern_id: lantern.id,
                relight: isRelight
              }
            });

            // Đẩy lùi các Bóng Mực trong vòng 6m
            for (const shade of this.shades) {
              const dToL = distXZ(shade.pos, lantern.pos);
              if (dToL < this.tuning.safe_radius) {
                shade.state = "spawning";
                shade.state_ticks_left = 30;
                let dx = shade.pos[0] - lantern.pos[0];
                let dz = shade.pos[2] - lantern.pos[2];
                let len = Math.hypot(dx, dz);
                if (len < 0.001) { dx = 1; dz = 0; len = 1; }
                shade.recoil_vel = [
                  ((dx / len) * (this.tuning.safe_radius - dToL)) / 30,
                  ((dz / len) * (this.tuning.safe_radius - dToL)) / 30
                ];
              }
            }
          } else {
            this.events.push({
              type: "event",
              tick: nextTick,
              name: "deposit",
              data: {
                lantern_id: lantern.id,
                amount: depositAmount,
                deposited: lantern.deposited,
                lit: false
              }
            });
          }
        } else {
          // Châm dầu (Refuel) cho đèn đang sáng
          // used = min(đang mang, ceil((100 − fuel) / 10))
          const neededMotes = Math.ceil((maxFuel - lantern.fuel) / (this.tuning.fuel_per_mote || 10));
          const used = Math.min(this.player.carried, neededMotes);

          if (used > 0) {
            const wasBelow30 = lantern.fuel < (this.tuning.low_fuel_threshold || 30);
            this.player.carried -= used;
            lantern.fuel = Math.min(maxFuel, lantern.fuel + used * (this.tuning.fuel_per_mote || 10));
            this.score += used * (this.tuning.score.per_mote_deposit || 5);

            this.events.push({
              type: "event",
              tick: nextTick,
              name: "refuel",
              data: {
                lantern_id: lantern.id,
                amount: used,
                fuel: round1(lantern.fuel)
              }
            });

            // Nếu được châm lên >= 30, đẩy các con đang trong 6m ra ngoài
            if (wasBelow30 && lantern.fuel >= (this.tuning.low_fuel_threshold || 30)) {
              for (const shade of this.shades) {
                const dToL = distXZ(shade.pos, lantern.pos);
                if (dToL < this.tuning.safe_radius) {
                  shade.state = "spawning";
                  shade.state_ticks_left = 30;
                  let dx = shade.pos[0] - lantern.pos[0];
                  let dz = shade.pos[2] - lantern.pos[2];
                  let len = Math.hypot(dx, dz);
                  if (len < 0.001) { dx = 1; dz = 0; len = 1; }
                  shade.recoil_vel = [
                    ((dx / len) * (this.tuning.safe_radius - dToL)) / 30,
                    ((dz / len) * (this.tuning.safe_radius - dToL)) / 30
                  ];
                }
              }
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 6: Cập nhật Vùng an toàn (Chỉ đèn có fuel >= 30 mới có vùng an toàn)
    // ─────────────────────────────────────────────────────────────
    for (const lantern of this.lanterns) {
      if (lantern.lit && lantern.fuel >= (this.tuning.low_fuel_threshold || 30)) {
        if (lantern.lit_ticks_ago >= 0) lantern.lit_ticks_ago++;
        for (const shade of this.shades) {
          if (shade.state !== "spawning") {
            const d = distXZ(shade.pos, lantern.pos);
            if (d < this.tuning.safe_radius) {
              const dx = shade.pos[0] - lantern.pos[0];
              const dz = shade.pos[2] - lantern.pos[2];
              const len = Math.hypot(dx, dz) || 1.0;
              shade.pos[0] = round3(lantern.pos[0] + (dx / len) * this.tuning.safe_radius);
              shade.pos[2] = round3(lantern.pos[2] + (dz / len) * this.tuning.safe_radius);
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 7: Tỏa Sáng (Pulse)
    // ─────────────────────────────────────────────────────────────
    if (pulseTriggered && !this.player.falling && this.player.pulse_cd_ticks <= 0) {
      if (this.player.carried >= this.tuning.pulse_cost) {
        this.player.carried -= this.tuning.pulse_cost;
        this.player.pulse_cd_ticks = this.tuning.pulse_cooldown_ticks;
        const stunnedIds = [];
        const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];

        for (const shade of this.shades) {
          const d3D = dist3D(pulseCenter, shade.pos);
          if (d3D <= this.tuning.pulse_radius) {
            const wasDraining = shade.state === "drain";
            shade.state = "stunned";
            shade.state_ticks_left = this.tuning.pulse_stun_ticks;
            shade.target_lantern_id = null;

            let dx = shade.pos[0] - this.player.pos[0];
            let dz = shade.pos[2] - this.player.pos[2];
            let pLen = Math.hypot(dx, dz);
            if (pLen < 0.001) { dx = 1.0; dz = 0.0; pLen = 1.0; }
            shade.recoil_vel = [
              (dx / pLen) * (this.tuning.pulse_push_m / this.tuning.pulse_push_ticks),
              (dz / pLen) * (this.tuning.pulse_push_m / this.tuning.pulse_push_ticks)
            ];
            stunnedIds.push(shade.id);

            // Điểm mới: +5 bình thường; +15 nếu trước đó đang hút dầu
            this.score += wasDraining
              ? (this.tuning.score.per_drain_stun || 15)
              : (this.tuning.score.per_stun || 5);
          }
        }

        // Tác động lên Gió Lạc (Drifter)
        for (const drifter of this.drifters) {
          const d3D = dist3D(pulseCenter, drifter.pos);
          if (d3D <= this.tuning.pulse_radius) {
            if (drifter.state === "chase") {
              drifter.state = "flee";
              drifter.flee_ticks_left = this.tuning.drifter_flee_ticks;
            } else if (drifter.state === "flee" && drifter.stolen > 0) {
              for (let k = 0; k < drifter.stolen; k++) {
                this.motes.push({
                  id: `M${this.nextMoteId++}`,
                  pos: [drifter.pos[0] + (this.rng.next() - 0.5), drifter.pos[1], drifter.pos[2] + (this.rng.next() - 0.5)],
                  kind: "dropped",
                  ttl_ticks: 120,
                  spawn_tick: this.tick
                });
              }
              this.events.push({
                type: "event",
                tick: nextTick,
                name: "drifter_drop",
                data: { drifter_id: drifter.id, amount: drifter.stolen }
              });
              drifter.stolen = 0;
              drifter.flee_ticks_left = 120;
            }
          }
        }

        this.events.push({
          type: "event",
          tick: nextTick,
          name: "pulse",
          data: { stunned_ids: stunnedIds }
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 8: Di chuyển Bóng Mực & Gió Lạc (Xử lý hút dầu)
    // ─────────────────────────────────────────────────────────────
    const shadeSpeed = this.night === 3 ? this.tuning.shade_speed_night3 : this.tuning.shade_speed_night1;

    for (const shade of this.shades) {
      if (shade.state === "spawning") {
        shade.state_ticks_left--;
        if (shade.recoil_vel) {
          shade.pos[0] = round3(shade.pos[0] + shade.recoil_vel[0]);
          shade.pos[2] = round3(shade.pos[2] + shade.recoil_vel[1]);
        }
        if (shade.state_ticks_left <= 0) shade.state = "wander";
      } else if (shade.state === "stunned") {
        shade.state_ticks_left--;
        const pushTick = this.tuning.pulse_stun_ticks - shade.state_ticks_left;
        if (pushTick <= this.tuning.pulse_push_ticks && shade.recoil_vel) {
          shade.pos[0] = round3(shade.pos[0] + shade.recoil_vel[0]);
          shade.pos[2] = round3(shade.pos[2] + shade.recoil_vel[1]);
        }
        if (shade.state_ticks_left <= 0) shade.state = "wander";
      } else if (shade.state === "recoil") {
        shade.state_ticks_left--;
        if (shade.recoil_vel) {
          shade.pos[0] = round3(shade.pos[0] + shade.recoil_vel[0]);
          shade.pos[2] = round3(shade.pos[2] + shade.recoil_vel[1]);
        }
        if (shade.state_ticks_left <= 0) shade.state = "wander";
      } else if (shade.state === "drain") {
        // Trạng thái DRAIN: đứng yên hút dầu
        const targetLantern = this.lanterns.find((l) => l.id === shade.target_lantern_id);
        const dPlayer = distXZ(shade.pos, this.player.pos);
        const dLantern = targetLantern ? distXZ(shade.pos, targetLantern.pos) : 999;

        // Từ drain: sang chase nếu Mây vào trong 6m; sang wander nếu đèn tắt, fuel >= 30, hoặc cách đèn > 2m
        if (dPlayer <= 6.0) {
          shade.state = "chase";
          shade.target_lantern_id = null;
        } else if (!targetLantern || !targetLantern.lit || targetLantern.fuel >= (this.tuning.low_fuel_threshold || 30) || dLantern > 2.0) {
          shade.state = "wander";
          shade.target_lantern_id = null;
        }
      } else if (shade.state === "chase") {
        const dToPlayer = distXZ(shade.pos, this.player.pos);
        if (dToPlayer > this.tuning.shade_lose_radius || this.player.falling) {
          shade.state = "wander";
        } else {
          let dx = this.player.pos[0] - shade.pos[0];
          let dz = this.player.pos[2] - shade.pos[2];
          let dist = Math.hypot(dx, dz) || 1.0;
          const stepDist = shadeSpeed * this.dt;
          const nextX = round3(shade.pos[0] + (dx / dist) * stepDist);
          const nextZ = round3(shade.pos[2] + (dz / dist) * stepDist);

          // Chặn tại mép vùng an toàn của đèn lit có fuel >= 30
          let blocked = false;
          for (const lantern of this.lanterns) {
            if (lantern.lit && lantern.fuel >= (this.tuning.low_fuel_threshold || 30) && distXZ([nextX, 0, nextZ], lantern.pos) < this.tuning.safe_radius) {
              blocked = true;
              break;
            }
          }
          if (!blocked) {
            shade.pos[0] = nextX;
            shade.pos[2] = nextZ;
          }
        }
      } else {
        // Trạng thái WANDER
        const dToPlayer = distXZ(shade.pos, this.player.pos);
        if (dToPlayer <= this.tuning.shade_detect_radius && !this.player.falling) {
          shade.state = "chase";
        } else {
          // Chỉ Bóng Mực ở trạng thái wander mới chọn đèn yếu: đi tới đèn sáng có fuel < 30 gần nhất
          const weakLanterns = this.lanterns.filter((l) => l.lit && l.fuel < (this.tuning.low_fuel_threshold || 30));
          let target = null;

          if (weakLanterns.length > 0) {
            weakLanterns.sort((a, b) => {
              const dA = distXZ(shade.pos, a.pos);
              const dB = distXZ(shade.pos, b.pos);
              if (Math.abs(dA - dB) > 0.001) return dA - dB;
              return a.id.localeCompare(b.id, undefined, { numeric: true });
            });
            target = weakLanterns[0];
          } else {
            const unlit = this.lanterns.filter((l) => !l.lit);
            if (unlit.length > 0) {
              unlit.sort((a, b) => {
                const dA = distXZ(shade.pos, a.pos);
                const dB = distXZ(shade.pos, b.pos);
                if (Math.abs(dA - dB) > 0.001) return dA - dB;
                return a.id.localeCompare(b.id, undefined, { numeric: true });
              });
              target = unlit[0];
            }
          }

          if (target) {
            const dToTarget = distXZ(shade.pos, target.pos);
            // Khi cách đèn yếu đó <= 2m: chuyển sang drain
            if (target.lit && target.fuel < (this.tuning.low_fuel_threshold || 30) && dToTarget <= 2.0) {
              shade.state = "drain";
              shade.target_lantern_id = target.id;
              shade.drain_ticks = 0;
            } else {
              let dx = target.pos[0] - shade.pos[0];
              let dz = target.pos[2] - shade.pos[2];
              let len = Math.hypot(dx, dz) || 1.0;
              const stepDist = shadeSpeed * this.dt;
              const nextX = round3(shade.pos[0] + (dx / len) * stepDist);
              const nextZ = round3(shade.pos[2] + (dz / len) * stepDist);

              let blocked = false;
              for (const lantern of this.lanterns) {
                if (lantern.lit && lantern.fuel >= (this.tuning.low_fuel_threshold || 30) && distXZ([nextX, 0, nextZ], lantern.pos) < this.tuning.safe_radius) {
                  blocked = true;
                  break;
                }
              }
              if (!blocked) {
                shade.pos[0] = nextX;
                shade.pos[2] = nextZ;
              }
            }
          }
        }
      }
      this.resolveObstacleCollision(shade.pos, 0.55);
    }

    // 8.2 Gió Lạc (Drifter)
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const d = this.drifters[i];
      if (d.state === "idle") {
        const dist = distXZ(d.pos, this.player.pos);
        if (this.player.carried >= this.tuning.drifter_chase_motes && dist <= this.tuning.drifter_chase_dist && !this.player.falling) {
          d.state = "chase";
        }
      } else if (d.state === "chase") {
        const dist = distXZ(d.pos, this.player.pos);
        if (this.player.carried < this.tuning.drifter_chase_motes || dist > this.tuning.drifter_chase_dist || this.player.falling) {
          d.state = "idle";
        } else {
          const dx = this.player.pos[0] - d.pos[0];
          const dz = this.player.pos[2] - d.pos[2];
          const len = Math.hypot(dx, dz) || 1.0;
          d.pos[0] = round3(d.pos[0] + (dx / len) * this.tuning.drifter_speed * this.dt);
          d.pos[2] = round3(d.pos[2] + (dz / len) * this.tuning.drifter_speed * this.dt);
        }
      } else if (d.state === "flee") {
        d.flee_ticks_left--;
        const dx = d.pos[0] - this.player.pos[0];
        const dz = d.pos[2] - this.player.pos[2];
        const len = Math.hypot(dx, dz) || 1.0;
        d.pos[0] = round3(d.pos[0] + (dx / len) * this.tuning.drifter_speed * this.dt);
        d.pos[2] = round3(d.pos[2] + (dz / len) * this.tuning.drifter_speed * this.dt);

        if (d.flee_ticks_left <= 0) {
          d.state = "removed";
          this.drifters.splice(i, 1);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 9: Va chạm / Cướp đồ (Gió Lạc cướp trước, rồi Bóng Mực, tắt khi bench_mode)
    // ─────────────────────────────────────────────────────────────
    if (!this.bench_mode && !this.player.falling) {
      // 9.1 Gió Lạc cướp đồ
      for (const drifter of this.drifters) {
        if (drifter.state === "chase") {
          const dXZ = distXZ(this.player.pos, drifter.pos);
          if (dXZ <= this.tuning.drifter_hit_dist) {
            const stealAmount = Math.min(this.tuning.drifter_steal_max, this.player.carried);
            this.player.carried -= stealAmount;
            drifter.stolen = stealAmount;
            drifter.state = "flee";
            drifter.flee_ticks_left = this.tuning.drifter_flee_ticks;
            this.events.push({
              type: "event",
              tick: nextTick,
              name: "drifter_steal",
              data: {
                drifter_id: drifter.id,
                amount: stealAmount,
                carried: this.player.carried
              }
            });
            break;
          }
        }
      }

      // 9.2 Bóng Mực gây hit (chỉ những con ở trạng thái chase)
      let playerHitThisTick = false;
      const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

      for (const shade of sortedShades) {
        if (shade.state === "chase" && !playerHitThisTick) {
          const dXZ = distXZ(this.player.pos, shade.pos);
          const dY = Math.abs(this.player.pos[1] - shade.pos[1]);

          if (dXZ <= this.tuning.shade_hit_radius && dY <= this.tuning.pickup_dy) {
            shade.state = "recoil";
            shade.state_ticks_left = this.tuning.shade_recoil_ticks;
            let dx = shade.pos[0] - this.player.pos[0];
            let dz = shade.pos[2] - this.player.pos[2];
            let rLen = Math.hypot(dx, dz) || 1.0;
            shade.recoil_vel = [(dx / rLen) * (this.tuning.shade_recoil_m / this.tuning.shade_recoil_ticks), (dz / rLen) * (this.tuning.shade_recoil_m / this.tuning.shade_recoil_ticks)];

            if (this.player.invuln_ticks <= 0) {
              playerHitThisTick = true;
              this.player.flames = Math.max(0, this.player.flames - 1);
              const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
              this.player.carried -= dropped;
              this.player.invuln_ticks = this.tuning.invuln_ticks;

              for (let k = 0; k < dropped; k++) {
                const angle = this.rng.range(0, Math.PI * 2);
                const radius = this.rng.range(1.5, 2.5);
                this.motes.push({
                  id: `M${this.nextMoteId++}`,
                  pos: [round3(this.player.pos[0] + Math.cos(angle) * radius), this.player.pos[1], round3(this.player.pos[2] + Math.sin(angle) * radius)],
                  kind: "dropped",
                  ttl_ticks: 480,
                  spawn_tick: this.tick
                });
              }

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
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 10: Sinh thực thể theo lịch (chỉ tương tác từ tick sau, tắt khi bench_mode)
    // ─────────────────────────────────────────────────────────────
    if (!this.bench_mode && this.sim_tick > 0 && this.sim_tick % 240 === 0 && this.motes.length < 30) {
      const pts = this.map.mote_spawn_points;
      const occupiedIndices = new Set(this.motes.map((m) => m.spawn_point_idx).filter((idx) => idx !== undefined));
      for (let i = 0; i < pts.length; i++) {
        if (!occupiedIndices.has(i)) {
          this.motes.push({
            id: `M${this.nextMoteId++}`,
            pos: [...pts[i]],
            kind: "random",
            ttl_ticks: null,
            spawn_point_idx: i,
            spawn_tick: this.tick
          });
          break;
        }
      }
    }

    if (!this.bench_mode && this.shades.length < this.map.shade_max) {
      let shouldSpawn = false;
      let countToSpawn = 1;

      if (this.sim_tick === 300) {
        shouldSpawn = true;
        countToSpawn = 2;
      } else if (this.sim_tick > 300 && (this.sim_tick - 300) % this.map.shade_spawn_interval_ticks === 0) {
        shouldSpawn = true;
        countToSpawn = 1;
      }

      if (shouldSpawn) {
        const pts = this.map.shade_spawn_points;
        for (let c = 0; c < countToSpawn; c++) {
          if (this.shades.length >= this.map.shade_max) break;
          const validPoints = pts.filter((p) => distXZ(p, this.player.pos) >= 15.0);
          if (validPoints.length > 0) {
            const chosen = validPoints[this.rng.next() * validPoints.length | 0];
            const newShadeId = `S${this.nextShadeId++}`;
            this.shades.push({
              id: newShadeId,
              pos: [...chosen],
              state: "spawning",
              state_ticks_left: 30,
              recoil_vel: [0, 0]
            });
            this.events.push({
              type: "event",
              tick: nextTick,
              name: "shade_spawn",
              data: { shade_id: newShadeId, pos: [...chosen] }
            });
          }
        }
      }
    }

    if (!this.bench_mode && this.map.drifters_enabled && this.sim_tick > 0 && this.sim_tick % 1200 === 0 && this.drifters.length < 2) {
      const pts = this.map.mote_spawn_points;
      const spawnPt = pts[this.rng.range(0, pts.length) | 0];
      const newDrifterId = `D${this.nextDrifterId++}`;
      this.drifters.push({
        id: newDrifterId,
        pos: [...spawnPt],
        state: "idle",
        stolen: 0,
        flee_ticks_left: 0
      });
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 11: Xét Thắng / Thua (Luật thắng mới theo Contract v1.2)
    // ─────────────────────────────────────────────────────────────
    this.tick++;
    this.sim_tick++;
    this.time_left_s = Math.max(0, round3(this.base_time_left_s - this.sim_tick / 60));

    if (!this.bench_mode && this.state === "playing") {
      // 11.1 Hết Ngọn Lửa -> luôn thua (no_flames) ngay lập tức, kể cả ở tick cuối
      if (this.player.flames <= 0) {
        this.state = "lost";
        this.events.push({
          type: "event",
          tick: this.tick,
          name: "game_over",
          data: { result: "lost", reason: "no_flames" }
        });
      } else if (this.time_left_s <= 0) {
        // 11.2 Hết giờ (Bình minh): xét tỷ lệ đèn đang sáng
        const litLanterns = this.lanterns.filter((l) => l.lit);
        const litCount = litLanterns.length;
        const totalCount = this.lanterns.length;
        const req = Math.ceil((this.tuning.win_ratio || 0.6) * totalCount);

        if (litCount >= req) {
          this.state = "won";
          // Điểm thưởng bình minh: +50 + floor(fuel) mỗi đèn đang sáng, +50 mỗi máu
          let dawnBonus = 0;
          for (const l of litLanterns) {
            dawnBonus += (this.tuning.score.dawn_lantern_bonus || 50) + Math.floor(l.fuel);
          }
          dawnBonus += (this.tuning.score.dawn_flame_bonus || 50) * this.player.flames;
          this.score += dawnBonus;

          this.events.push({
            type: "event",
            tick: this.tick,
            name: "game_over",
            data: { result: "won", reason: "dawn_survived" }
          });
        } else {
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
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      if (Math.hypot(x, z) > (this.map.island_radius || this.map.radius || 40.0)) return -50.0;
      return 0.0;
    }
    if (this.night === 2) {
      if (x >= 26.0 && x <= 44.0 && Math.abs(z) <= 2.0) return 0.0;
      if (Math.hypot(x, z) <= 28.0) return 0.0;
      if (Math.hypot(x - 70.0, z) <= 28.0) return 0.0;
      return -50.0;
    }
    if (this.night === 3) {
      const r = Math.hypot(x, z);
      if (r > 45.0) return -50.0;
      // Tier 2: Center bell sanctuary R <= 8m at Y = 6.0
      if (r <= 8.0) return 6.0;
      // Tier 1: Stepped terrace 8m < R <= 24m at Y = 3.0
      if (r <= 24.0) return 3.0;
      // Ramps connecting Tier 0 (R=30, Y=0) to Tier 1 (R=24, Y=3)
      if (r <= 30.0) {
        const deg = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;
        if (Math.abs(deg - 30) <= 5.0 || Math.abs(deg - 150) <= 5.0 || Math.abs(deg - 210) <= 5.0 || Math.abs(deg - 330) <= 5.0) {
          const t = (30.0 - r) / 6.0;
          return round3(t * 3.0);
        }
      }
      return 0.0;
    }
    return 0.0;
  }

  resolveObstacleCollision(pos, radius = 0.45) {
    if (!this.obstacles_enabled) return;

    // ── Night 3 Stepped Mountain Circular Cliff Walls Collision ──
    if (this.night === 3) {
      const rCenter = Math.hypot(pos[0], pos[2]);

      // 1. Tier 2 Circular Cliff Wall (R = 8.0m, wall from Y=3.0 to Y=6.0)
      // When below Tier 2 summit (pos[1] < 5.8), player cannot penetrate into Tier 2 mesa
      const minTier2R = 8.0 + radius;
      if (pos[1] < 5.8 && rCenter < minTier2R) {
        if (rCenter < 0.001) {
          pos[0] = minTier2R;
          pos[2] = 0.0;
        } else {
          pos[0] = round3((pos[0] / rCenter) * minTier2R);
          pos[2] = round3((pos[2] / rCenter) * minTier2R);
        }
      }

      // 2. Tier 1 Circular Cliff Wall (R = 24.0m, wall from Y=0.0 to Y=3.0)
      // When on Tier 0 (pos[1] < 2.8), player cannot walk through Tier 1 cliff outside ramps
      const minTier1R = 24.0 + radius;
      if (pos[1] < 2.8 && rCenter < minTier1R) {
        const deg = ((Math.atan2(pos[2], pos[0]) * 180) / Math.PI + 360) % 360;
        const onRamp = Math.abs(deg - 30) <= 6.0 || Math.abs(deg - 150) <= 6.0 || Math.abs(deg - 210) <= 6.0 || Math.abs(deg - 330) <= 6.0;
        if (!onRamp) {
          pos[0] = round3((pos[0] / rCenter) * minTier1R);
          pos[2] = round3((pos[2] / rCenter) * minTier1R);
        }
      }
    }

    if (!this.obstacles) return;
    for (const obs of this.obstacles) {
      const dXZ = distXZ(pos, obs.pos);
      const minD = radius + obs.radius;
      const dY = Math.abs(pos[1] - obs.pos[1]);
      if (dXZ < minD && dY < (obs.height || 4.0)) {
        if (dXZ < 0.001) {
          pos[0] = round3(obs.pos[0] + minD);
        } else {
          const push = minD - dXZ;
          const nx = (pos[0] - obs.pos[0]) / dXZ;
          const nz = (pos[2] - obs.pos[2]) / dXZ;
          pos[0] = round3(pos[0] + nx * push);
          pos[2] = round3(pos[2] + nz * push);
        }
      }
    }
  }

  getSnapshot() {
    return {
      type: "snapshot",
      tick: this.tick,
      sim_tick: this.sim_tick,
      night: this.night,
      state: this.state,
      time_left_s: round3(this.time_left_s),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: Math.round(this.wind.dir_deg)
      },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        capacity: this.capacity,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(this.player.dash_cd_ticks / 60),
        pulse_cd_s: round3(this.player.pulse_cd_ticks / 60),
        charm_s: round3(this.player.charm_ticks / 60)
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited,
        fuel: l.lit ? round1(l.fuel) : 0,
        ever_lit: !!l.ever_lit,
        relit_count: l.relit_count || 0
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
        kind: m.kind,
        ttl_s: m.ttl_ticks !== null ? round3(m.ttl_ticks / 60) : null
      })),
      motes_active: this.motes.length,
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: round3(c.respawn_ticks / 60)
      }))
    };
  }

  flushEvents() {
    const list = this.events;
    this.events = [];
    return list;
  }
}
