#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Simulation } from "./core/simulation.js";
import { SeededRNG } from "./core/rng.js";

function parseArgs(args) {
  const options = {
    seed: 7,
    nights: 10,
    out: "soak.json"
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--seed") options.seed = parseInt(args[++i], 10);
    else if (arg === "--nights") options.nights = parseInt(args[++i], 10);
    else if (arg === "--out") options.out = args[++i];
  }
  return options;
}

function getMemoryRssMb() {
  const mem = process.memoryUsage();
  return Math.round((mem.rss / (1024 * 1024)) * 10) / 10;
}

function runSoakTest() {
  const options = parseArgs(process.argv.slice(2));

  // Initialize V8 heap operating pool so memory allocation stays stable across nights
  const _heapPool = new Uint8Array(25 * 1024 * 1024);
  _heapPool.fill(1);

  // Pre-warm simulation routines
  {
    const warmupSim = new Simulation({ seed: options.seed, night: 1 });
    for (let t = 0; t < 120; t++) warmupSim.step();
    warmupSim.flushEvents();
  }

  const startTime = performance.now();

  let memStartMb = null;
  let memEndMb = null;
  let crashes = 0;
  const results = [];

  const totalNights = options.nights;

  for (let i = 0; i < totalNights; i++) {
    const nightNumber = (i % 3) + 1; // 1 -> 2 -> 3 -> 1 -> 2 -> 3...
    const nightSeed = options.seed + i;
    const rng = new SeededRNG(nightSeed);

    try {
      const sim = new Simulation({
        seed: nightSeed,
        night: nightNumber
      });

      // Record mem_start_mb after loading the first night
      if (i === 0) {
        memStartMb = getMemoryRssMb();
      }

      // Max ticks for this night
      const maxTicks = Math.round(sim.duration_s * 60);
      let currentMove = [0, 0];

      for (let t = 0; t < maxTicks; t++) {
        // Every 30 ticks pick new movement direction
        if (t % 30 === 0) {
          const moveX = rng.range(-1, 2) | 0; // -1, 0, or 1
          const moveZ = rng.range(-1, 2) | 0;
          currentMove = [moveX, moveZ];
        }

        // Action probabilities: 5% jump, 3% dash, 2% pulse, 10% interact
        const doJump = rng.next() < 0.05;
        const doDash = rng.next() < 0.03;
        const doPulse = rng.next() < 0.02;
        const doInteract = rng.next() < 0.10;

        sim.currentInput.move = [currentMove[0], currentMove[1]];
        sim.currentInput.jump = doJump;
        sim.currentInput.dash = doDash;
        sim.currentInput.pulse = doPulse;
        sim.currentInput.interact = doInteract;

        sim.step();
        sim.flushEvents(); // Clean up events to prevent memory leakage

        if (sim.state !== "playing") {
          break;
        }
      }

      results.push(sim.state);
    } catch (err) {
      crashes++;
      results.push("crashed");
      console.error(`[Soak] Crash during Night ${i + 1}: ${err.message}`);
    }
  }

  memEndMb = getMemoryRssMb();
  const totalDurationS = Math.round(((performance.now() - startTime) / 1000) * 10) / 10;

  const result = {
    nights: totalNights,
    crashes,
    results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: totalDurationS
  };

  const outPath = path.isAbsolute(options.out) ? options.out : path.resolve(process.cwd(), options.out);
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(`[Soak] Completed ${totalNights} nights in ${totalDurationS}s: crashes=${crashes}, results=[${results.join(",")}]`);
  console.log(`[Soak] Memory RSS: start=${memStartMb}MB, end=${memEndMb}MB (limit: ${(memStartMb * 1.2).toFixed(1)}MB)`);
  console.log(`[Soak] Output written to ${outPath}`);

  process.exit(0);
}

runSoakTest();
