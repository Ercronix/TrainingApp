#!/usr/bin/env node
// Serve the static web export (`expo export --platform web`) for the end-to-end tests.
//
//   node e2e/serve.mjs <dir> <port>
//
// Resolves paths like `try_files $uri $uri/ /index.html` in nginx.conf: a file, then a
// directory's index.html, else the root index.html, and Expo Router resolves the route on
// the client. Expo also writes one HTML file per route (/training -> training.html), but
// Nginx never serves those for a route path, so neither does this; keep the two in step.

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? 8093);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
};

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveFile(urlPath) {
  // normalize() collapses "..", and the prefix check keeps requests inside root
  const base = join(root, normalize(decodeURIComponent(urlPath)));
  if (!base.startsWith(root)) return null;
  for (const candidate of [base, join(base, "index.html")]) {
    if (isFile(candidate)) return candidate;
  }
  return join(root, "index.html");
}

createServer((req, res) => {
  const file = resolveFile(new URL(req.url ?? "/", "http://localhost").pathname);
  if (!file) {
    res.writeHead(400).end();
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://localhost:${port}`));
