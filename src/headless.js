#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Simulation } from "./core/simulation.js";
import { exportLeaderboard } from "./core/leaderboard.js";

// Check --export-leaderboard
const exportIdx = process.argv.indexOf("--export-leaderboard");
if (exportIdx !== -1) {
  const outPath = process.argv[exportIdx + 1];
  if (!outPath) {
    process.stderr.write("Error: Missing output file path for --export-leaderboard\n");
    process.exit(2);
  }
  const fullOutPath = path.isAbsolute(outPath) ? outPath : path.resolve(process.cwd(), outPath);
  exportLeaderboard(fullOutPath);
  process.exit(0);
}

function parseArgs(args) {
  const options = {
    seed: 42,
    night: 1,
    scenario: null,
    inputs: null,
    ticks: 600,
    out: null,
    snapshotEvery: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--seed") options.seed = parseInt(args[++i], 10);
    else if (arg === "--night") options.night = parseInt(args[++i], 10);
    else if (arg === "--scenario") options.scenario = args[++i];
    else if (arg === "--inputs") options.inputs = args[++i];
    else if (arg === "--ticks") options.ticks = parseInt(args[++i], 10);
    else if (arg === "--out") options.out = args[++i];
    else if (arg === "--snapshot-every") options.snapshotEvery = parseInt(args[++i], 10);
  }
  return options;
}

function loadJSONFile(filePath) {
  if (!filePath) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write(`Error reading/parsing JSON file ${filePath}: ${err.message}\n`);
    process.exit(2);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  let scenarioData = null;
  let inputsData = null;

  if (options.scenario) {
    scenarioData = loadJSONFile(options.scenario);
  }
  if (options.inputs) {
    inputsData = loadJSONFile(options.inputs);
  }

  let sim;
  try {
    sim = new Simulation({
      seed: options.seed,
      night: options.night,
      scenario: scenarioData,
      inputs: inputsData
    });
  } catch (err) {
    process.stderr.write(`Invalid scenario/inputs format: ${err.message}\n`);
    process.exit(2);
  }

  const lines = [];

  // Snapshot at tick 0 (before step 0)
  lines.push(JSON.stringify(sim.getSnapshot()));

  const totalTicks = options.ticks;
  for (let t = 0; t < totalTicks; t++) {
    sim.step();

    // Flush any events that happened during this step
    const events = sim.flushEvents();
    for (const ev of events) {
      lines.push(JSON.stringify(ev));
    }

    // Snapshot every snapshotEvery ticks
    if (sim.tick % options.snapshotEvery === 0) {
      lines.push(JSON.stringify(sim.getSnapshot()));
    }

    if (sim.state !== "playing") {
      break;
    }
  }

  // Final end line
  lines.push(
    JSON.stringify({
      type: "end",
      ticks: sim.tick,
      state: sim.state,
      score: sim.score
    })
  );

  const outputContent = lines.join("\n") + "\n";
  if (options.out) {
    const dir = path.dirname(path.resolve(options.out));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.out, outputContent, "utf-8");
  } else {
    process.stdout.write(outputContent);
  }

  process.exit(0);
}

main();
