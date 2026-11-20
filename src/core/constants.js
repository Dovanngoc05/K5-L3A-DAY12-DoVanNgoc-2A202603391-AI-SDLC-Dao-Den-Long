export const DEFAULT_TUNING = {
  player_speed: 6.0,
  player_charm_speed: 7.2,
  carry_capacity: 10,
  capacity_max: 20,
  lantern_cost: 10,
  relight_cost: 5,
  fuel_max: 100,
  fuel_decay_per_s: 1.0,
  fuel_per_mote: 10,
  drain_per_s: 5,
  low_fuel_threshold: 30,
  win_ratio: 0.6,
  lantern_count_night1: 5,
  lantern_count_night2: 6,
  lantern_count_night3: 7,
  pickup_radius: 1.0,
  pickup_dy: 1.5,
  interact_radius: 2.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_stun_ticks: 120,
  pulse_push_ticks: 15,
  pulse_push_m: 4.0,
  pulse_cooldown_s: 3.0,
  pulse_cooldown_ticks: 180,
  night1_duration_s: 240,
  night2_duration_s: 270,
  night3_duration_s: 300,
  flames: 3,
  invuln_s: 1.5,
  invuln_ticks: 90,
  hit_drop_ratio: 0.5,
  safe_radius: 6.0,
  shade_speed_night1: 4.0,
  shade_speed_night2: 4.0,
  shade_speed_night3: 4.5,
  shade_detect_radius: 12.0,
  shade_lose_radius: 18.0,
  shade_hit_radius: 1.0,
  shade_recoil_m: 2.0,
  shade_recoil_ticks: 60,
  fall_enabled: true,
  fall_death_y: -10.0,
  fall_wait_ticks: 60,
  dash_speed: 14.0,
  dash_duration_ticks: 12,
  dash_duration_s: 0.2,
  dash_cooldown_ticks: 90,
  dash_cooldown_s: 1.5,
  jump_vy: 7.0,
  gravity: -20.0,
  charm_duration_ticks: 600,
  charm_respawn_ticks: 2700,
  drifter_speed: 7.0,
  drifter_idle_speed: 2.0,
  drifter_chase_dist: 15.0,
  drifter_chase_motes: 5,
  drifter_hit_dist: 1.2,
  drifter_steal_max: 3,
  drifter_flee_ticks: 240,
  score: {
    per_mote_deposit: 5,
    first_light_bonus: 100,
    relight_bonus: 40,
    per_stun: 5,
    per_drain_stun: 15,
    dawn_lantern_bonus: 50,
    dawn_flame_bonus: 50
  }
};

// Map Configurations for Night 1, 2, 3
export const MAP_CONFIGS = {
  1: {
    name: "Đảo Bến",
    duration_s: 240,
    island_radius: 40.0,
    start_pos: [0.0, 0.0, 0.0],
    lanterns: [
      { id: "L1", pos: [0.0, 0.0, 25.0] },
      { id: "L2", pos: [23.8, 0.0, 7.7] },
      { id: "L3", pos: [14.7, 0.0, -20.2] },
      { id: "L4", pos: [-14.7, 0.0, -20.2] },
      { id: "L5", pos: [-23.8, 0.0, 7.7] }
    ],
    // 8 points at r=12m (every 45 deg), 16 points at r=33m (every 22.5 deg)
    mote_spawn_points: (() => {
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 12 * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 12 * 1000) / 1000]);
      }
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 33 * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 33 * 1000) / 1000]);
      }
      return pts;
    })(),
    // 12 points at r=37m (15, 45, 75...)
    shade_spawn_points: (() => {
      const pts = [];
      for (let i = 0; i < 12; i++) {
        const rad = ((15 + i * 30) * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 37 * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 37 * 1000) / 1000]);
      }
      return pts;
    })(),
    shade_max: 6,
    shade_spawn_interval_ticks: 480, // every 8s
    drifters_enabled: false,
    wind_enabled: false,
    jump_pads: [],
    charms: [],
    obstacles: [
      { id: "n1_rock1", type: "rock", pos: [10.0, 0.0, 12.0], radius: 1.2, height: 2.0 },
      { id: "n1_rock2", type: "rock", pos: [-12.0, 0.0, 14.0], radius: 1.3, height: 2.2 },
      { id: "n1_rock3", type: "rock", pos: [18.0, 0.0, -8.0], radius: 1.1, height: 1.8 },
      { id: "n1_rock4", type: "rock", pos: [-16.0, 0.0, -10.0], radius: 1.2, height: 1.9 },
      { id: "n1_tree1", type: "tree", pos: [8.0, 0.0, -14.0], radius: 0.9, height: 5.0 },
      { id: "n1_tree2", type: "tree", pos: [-8.0, 0.0, -14.0], radius: 0.9, height: 5.0 },
      { id: "n1_tree3", type: "tree", pos: [5.0, 0.0, 18.0], radius: 0.8, height: 4.5 },
      { id: "n1_tree4", type: "tree", pos: [-5.0, 0.0, 18.0], radius: 0.8, height: 4.5 },
      { id: "n1_pillar_l", type: "pillar", pos: [-2.0, 0.0, 5.0], radius: 0.4, height: 4.0 },
      { id: "n1_pillar_r", type: "pillar", pos: [2.0, 0.0, 5.0], radius: 0.4, height: 4.0 }
    ]
  },
  2: {
    name: "Đảo Cau",
    duration_s: 270,
    island_radius: 28.0,
    start_pos: [0.0, 0.0, 0.0],
    lanterns: [
      { id: "L1", pos: [0.0, 0.0, 20.0] },
      { id: "L2", pos: [17.0, 0.0, -10.0] },
      { id: "L3", pos: [-17.0, 0.0, -10.0] },
      { id: "L4", pos: [70.0, 0.0, 20.0] },
      { id: "L5", pos: [87.0, 0.0, -10.0] },
      { id: "L6", pos: [53.0, 0.0, -10.0] }
    ],
    jump_pads: [
      { id: "JP1", pos: [20.0, 0.0, 18.0], radius: 1.0, target: [70.0, 0.0, 0.0], vy: 14.0, vx_speed: 24.0 },
      { id: "JP2", pos: [50.0, 0.0, -18.0], radius: 1.0, target: [0.0, 0.0, 0.0], vy: 14.0, vx_speed: 24.0 }
    ],
    charms: [{ id: "C1", pos: [35.0, 0.0, 0.0] }],
    mote_spawn_points: (() => {
      const pts = [];
      for (const cx of [0.0, 70.0]) {
        for (let i = 0; i < 4; i++) {
          const rad = (i * 90 * Math.PI) / 180;
          pts.push([Math.round((cx + Math.cos(rad) * 10) * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 10 * 1000) / 1000]);
        }
        for (let i = 0; i < 8; i++) {
          const rad = (i * 45 * Math.PI) / 180;
          pts.push([Math.round((cx + Math.cos(rad) * 22) * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 22 * 1000) / 1000]);
        }
      }
      return pts;
    })(),
    shade_spawn_points: (() => {
      const pts = [];
      for (const cx of [0.0, 70.0]) {
        for (let i = 0; i < 8; i++) {
          const rad = ((22.5 + i * 45) * Math.PI) / 180;
          pts.push([Math.round((cx + Math.cos(rad) * 26) * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 26 * 1000) / 1000]);
        }
      }
      return pts;
    })(),
    shade_max: 8,
    shade_spawn_interval_ticks: 420, // every 7s
    drifters_enabled: true,
    wind_enabled: false,
    obstacles: [
      // Island A
      { id: "a_rock1", type: "rock", pos: [10.0, 0.0, 10.0], radius: 1.2, height: 2.0 },
      { id: "a_rock2", type: "rock", pos: [-10.0, 0.0, 12.0], radius: 1.3, height: 2.2 },
      { id: "a_tree1", type: "tree", pos: [8.0, 0.0, -14.0], radius: 0.9, height: 5.0 },
      { id: "a_tree2", type: "tree", pos: [-8.0, 0.0, -14.0], radius: 0.9, height: 5.0 },
      // Island B
      { id: "b_rock1", type: "rock", pos: [65.0, 0.0, 10.0], radius: 1.2, height: 2.0 },
      { id: "b_rock2", type: "rock", pos: [80.0, 0.0, 12.0], radius: 1.3, height: 2.2 },
      { id: "b_tree1", type: "tree", pos: [63.0, 0.0, -14.0], radius: 0.9, height: 5.0 },
      { id: "b_tree2", type: "tree", pos: [78.0, 0.0, -14.0], radius: 0.9, height: 5.0 },
      // Bridge Pillars
      { id: "br_p1", type: "pillar", pos: [25.0, 0.0, 2.2], radius: 0.4, height: 3.0 },
      { id: "br_p2", type: "pillar", pos: [25.0, 0.0, -2.2], radius: 0.4, height: 3.0 },
      { id: "br_p3", type: "pillar", pos: [45.0, 0.0, 2.2], radius: 0.4, height: 3.0 },
      { id: "br_p4", type: "pillar", pos: [45.0, 0.0, -2.2], radius: 0.4, height: 3.0 }
    ]
  },
  3: {
    name: "Đảo Chuông",
    duration_s: 300,
    island_radius: 45.0,
    start_pos: [0.0, 6.0, 4.0],
    lanterns: [
      { id: "L1", pos: [0.0, 6.0, 6.0] },
      { id: "L2", pos: [18.0, 3.0, 10.0] },
      { id: "L3", pos: [-18.0, 3.0, 10.0] },
      { id: "L4", pos: [35.0, 0.0, -10.0] },
      { id: "L5", pos: [-35.0, 0.0, -10.0] },
      { id: "L6", pos: [20.0, 0.0, -35.0] },
      { id: "L7", pos: [-20.0, 0.0, -35.0] }
    ],
    jump_pads: [
      { id: "JP1", pos: [0.0, 3.0, 13.0], radius: 1.0, vy: 12.0, vx_speed: 8.0, dir: [0, 0, -1] }
    ],
    charms: [
      { id: "C1", pos: [30.0, 0.0, 25.0] },
      { id: "C2", pos: [-30.0, 0.0, 25.0] }
    ],
    mote_spawn_points: (() => {
      const pts = [];
      // Tier 0: 18 points at r=34m
      for (let i = 0; i < 18; i++) {
        const rad = (i * 20 * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 34 * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 34 * 1000) / 1000]);
      }
      // Tier 1: 8 points at r=18m (20 to 160 deg)
      for (let deg = 20; deg <= 160; deg += 20) {
        const rad = (deg * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 18 * 1000) / 1000, 3.0, Math.round(Math.sin(rad) * 18 * 1000) / 1000]);
      }
      // Tier 2: 4 points at r=5m (45, 135, 225, 315)
      for (const deg of [45, 135, 225, 315]) {
        const rad = (deg * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 5 * 1000) / 1000, 6.0, Math.round(Math.sin(rad) * 5 * 1000) / 1000]);
      }
      return pts;
    })(),
    shade_spawn_points: (() => {
      const pts = [];
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        pts.push([Math.round(Math.cos(rad) * 43 * 1000) / 1000, 0.0, Math.round(Math.sin(rad) * 43 * 1000) / 1000]);
      }
      return pts;
    })(),
    shade_max: 10,
    shade_spawn_interval_ticks: 360, // every 6s
    drifters_enabled: true,
    wind_enabled: true,
    obstacles: [
      // Central Bell Tower (Ticket-02 explicit: R=2m, height 8m on Tier 2)
      { id: "bell_tower", type: "tower", pos: [0.0, 6.0, 0.0], radius: 2.0, height: 8.0 },
      // Tier 0 Standing Stones & Pines
      { id: "n3_rock1", type: "rock", pos: [22.0, 0.0, 16.0], radius: 1.3, height: 2.5 },
      { id: "n3_rock2", type: "rock", pos: [-22.0, 0.0, 16.0], radius: 1.3, height: 2.5 },
      { id: "n3_rock3", type: "rock", pos: [26.0, 0.0, -16.0], radius: 1.2, height: 2.0 },
      { id: "n3_rock4", type: "rock", pos: [-26.0, 0.0, -16.0], radius: 1.2, height: 2.0 },
      { id: "n3_tree1", type: "tree", pos: [12.0, 0.0, -25.0], radius: 0.9, height: 5.0 },
      { id: "n3_tree2", type: "tree", pos: [-12.0, 0.0, -25.0], radius: 0.9, height: 5.0 },
      // Tier 1 Snow Pines
      { id: "n3_t1_tree1", type: "tree", pos: [13.0, 3.0, 15.0], radius: 0.9, height: 4.5 },
      { id: "n3_t1_tree2", type: "tree", pos: [-13.0, 3.0, 15.0], radius: 0.9, height: 4.5 }
    ]
  }
};
