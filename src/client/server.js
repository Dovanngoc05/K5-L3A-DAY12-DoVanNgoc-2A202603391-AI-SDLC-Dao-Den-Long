import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadLeaderboard,
  addLeaderboardEntry,
  exportLeaderboard
} from "../core/leaderboard.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Check CLI export command: <run_cmd> --export-leaderboard out.json ──
const exportIdx = process.argv.indexOf("--export-leaderboard");
if (exportIdx !== -1) {
  const outPath = process.argv[exportIdx + 1];
  if (!outPath) {
    console.error("Error: Missing output file path for --export-leaderboard");
    process.exit(2);
  }
  const fullOutPath = path.isAbsolute(outPath) ? outPath : path.resolve(process.cwd(), outPath);
  exportLeaderboard(fullOutPath);
  console.log(`[Leaderboard] Exported successfully to ${fullOutPath}`);
  process.exit(0);
}

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];

  // ── Leaderboard API Endpoints ──
  if (reqPath === "/api/leaderboard") {
    if (req.method === "GET") {
      const data = loadLeaderboard();
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const payload = JSON.parse(body);
          const updated = addLeaderboardEntry(payload);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify(updated));
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  if (reqPath === "/") reqPath = "/index.html";

  // Map /src/core to ../core
  let filePath;
  if (reqPath.startsWith("/core/")) {
    filePath = path.join(__dirname, "..", reqPath);
  } else {
    filePath = path.join(__dirname, reqPath);
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Đảo Đèn Lồng 3D] Running at http://localhost:${PORT}`);
});
