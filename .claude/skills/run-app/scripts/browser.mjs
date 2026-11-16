#!/usr/bin/env node
// Drive the Expo web build in headless Chrome over CDP: phone-sized viewport with touch,
// optional sign-in, then a list of steps. Each run uses a fresh browser context.
//
//   node browser.mjs [options] step...
//
// Options:
//   --login new | <user>:<pass>  sign in before the app loads ("new" registers a throwaway user
//                                and prints its credentials so later runs can reuse them)
//   --url <route>                route to open first (default /)
//   --size <w>x<h>               viewport, default 390x844
//   --dpr <n>                    device pixel ratio, default 1 (2 for crisp text)
//   --out <dir>                  screenshot dir, default $RUN_APP_DIR/shots
//   --base <url>                 web app, default http://localhost:$WEB_PORT (8082)
//   --api <url>                  backend API, default http://localhost:8080/api
//
// Steps (run in order):
//   shot:<name>                  screenshot to <out>/<name>.png
//   wait:<ms>                    sleep
//   settle                       wait until the network is idle
//   tap:<x>,<y>                  touch tap at CSS pixel coordinates
//   tap-text:<text>              tap the smallest visible element with that text (exact, else contains)
//   type:<text>                  insert text into the focused input (tap the input first)
//   swipe:<x1>,<y1>,<x2>,<y2>[,<ms>]  touch drag, default 300 ms
//   goto:<route>                 navigate within the app, then settle
//   text                         print the page's visible text
//   eval:<js>                    evaluate an expression in the page and print the result
//   offline | online             emulate losing / regaining the network
//
// Console errors and uncaught exceptions are printed at the end.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHROME_PORT = 9333;
const RUN_DIR = process.env.RUN_APP_DIR ?? "/tmp/trainingapp-run";

const args = process.argv.slice(2);
const opts = {
  login: null,
  url: "/",
  size: "390x844",
  dpr: "1",
  out: join(RUN_DIR, "shots"),
  base: `http://localhost:${process.env.WEB_PORT ?? 8082}`,
  api: "http://localhost:8080/api",
};
const steps = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    if (!(key in opts)) fail(`unknown option ${a}`);
    opts[key] = args[++i];
  } else steps.push(a);
}
const [width, height] = opts.size.split("x").map(Number);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function chromeVersion() {
  try {
    const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
    return await res.json();
  } catch {
    return null;
  }
}

async function ensureChrome() {
  let info = await chromeVersion();
  if (info) return info;
  spawn(
    "google-chrome-stable",
    [
      "--headless=new",
      `--remote-debugging-port=${CHROME_PORT}`,
      `--user-data-dir=${join(RUN_DIR, "chrome-profile")}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--hide-scrollbars",
    ],
    { detached: true, stdio: "ignore" },
  ).unref();
  for (let i = 0; i < 50 && !info; i++) {
    await sleep(200);
    info = await chromeVersion();
  }
  if (!info) fail("Chrome did not start");
  return info;
}

// Minimal CDP client over one browser WebSocket with flattened target sessions
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = [];
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(`${msg.error.message} ${msg.error.data ?? ""}`)) : resolve(msg.result);
      } else if (msg.method) {
        for (const l of this.listeners) l(msg);
      }
    };
  }
  open() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = () => reject(new Error("CDP connection failed"));
    });
  }
  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(fn) {
    this.listeners.push(fn);
  }
}

async function api(path, body) {
  const res = await fetch(`${opts.api}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) fail(`${path} -> ${res.status} ${await res.text()} (is the backend up?)`);
  return res.json();
}

async function signIn() {
  if (opts.login === "new") {
    const username = `run_${Math.random().toString(36).slice(2, 8)}`;
    const password = "password123";
    const data = await api("/auth/register", { username, email: `${username}@example.com`, password });
    console.log(`signed in as new user ${username}:${password}`);
    return data;
  }
  const [username, ...rest] = opts.login.split(":");
  const data = await api("/auth/login", { username, password: rest.join(":") });
  console.log(`signed in as ${username}`);
  return data;
}

const info = await ensureChrome();
const cdp = new Cdp(info.webSocketDebuggerUrl);
await cdp.open();

const { browserContextId } = await cdp.send("Target.createBrowserContext");
const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank", browserContextId });
const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
const page = (method, params) => cdp.send(method, params, sessionId);

// Console errors and in-flight requests (for settle)
const problems = [];
const inflight = new Set();
let lastNetwork = Date.now();
cdp.on((msg) => {
  if (msg.sessionId !== sessionId) return;
  const p = msg.params;
  switch (msg.method) {
    case "Runtime.consoleAPICalled":
      if (p.type === "error" || p.type === "warning")
        problems.push(`console.${p.type}: ${p.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
      break;
    case "Runtime.exceptionThrown":
      problems.push(`exception: ${p.exceptionDetails.exception?.description ?? p.exceptionDetails.text}`);
      break;
    case "Network.requestWillBeSent":
      inflight.add(p.requestId);
      lastNetwork = Date.now();
      break;
    case "Network.loadingFinished":
    case "Network.loadingFailed":
      inflight.delete(p.requestId);
      lastNetwork = Date.now();
      break;
  }
});

await page("Page.enable");
await page("Runtime.enable");
await page("Network.enable");
await page("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: Number(opts.dpr), mobile: true });
await page("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

async function evaluate(expression) {
  const res = await page("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description ?? res.exceptionDetails.text);
  return res.result.value;
}

async function settle(timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const ready = await evaluate("document.readyState").catch(() => "loading");
    if (ready === "complete" && inflight.size === 0 && Date.now() - lastNetwork > 600) {
      await sleep(300); // let React commit and animations start
      return;
    }
    await sleep(100);
  }
  console.log(`settle: still ${inflight.size} requests in flight after ${timeout} ms`);
}

async function navigate(route) {
  inflight.clear();
  await page("Page.navigate", { url: new URL(route, opts.base).href });
  await settle();
}

if (opts.login) {
  const data = await signIn();
  const user = JSON.stringify({ userId: data.userId, username: data.username, email: data.email });
  // Seed storage before the app's own scripts run, on the first load only
  const { identifier } = await page("Page.addScriptToEvaluateOnNewDocument", {
    source: `localStorage.setItem("authToken", ${JSON.stringify(data.token)});
localStorage.setItem("refreshToken", ${JSON.stringify(data.refreshToken)});
localStorage.setItem("authUser", ${JSON.stringify(user)});`,
  });
  await navigate(opts.url);
  await page("Page.removeScriptToEvaluateOnNewDocument", { identifier });
} else {
  await navigate(opts.url);
}

async function touch(type, x, y) {
  await page("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
}

async function tap(x, y) {
  await touch("touchStart", x, y);
  await sleep(50);
  await touch("touchEnd", x, y);
  await sleep(250);
}

async function swipe(x1, y1, x2, y2, ms = 300) {
  const n = Math.max(5, Math.round(ms / 16));
  await touch("touchStart", x1, y1);
  for (let i = 1; i <= n; i++) {
    await sleep(ms / n);
    await touch("touchMove", x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n);
  }
  await touch("touchEnd", x2, y2);
  await sleep(300);
}

const findText = (text) => `(() => {
  const want = ${JSON.stringify(text)}.toLowerCase();
  const hits = { exact: [], partial: [] };
  for (const el of document.body.querySelectorAll("*")) {
    const t = (el.innerText ?? "").trim().toLowerCase();
    if (!t || !t.includes(want)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    (t === want ? hits.exact : hits.partial).push({ x: r.left + r.width / 2, y: r.top + r.height / 2, area: r.width * r.height });
  }
  const list = hits.exact.length ? hits.exact : hits.partial;
  list.sort((a, b) => a.area - b.area);
  return list[0] ?? null;
})()`;

mkdirSync(opts.out, { recursive: true });
let failed = false;
for (const step of steps) {
  const sep = step.indexOf(":");
  const name = sep < 0 ? step : step.slice(0, sep);
  const arg = sep < 0 ? "" : step.slice(sep + 1);
  const nums = () => arg.split(",").map(Number);
  try {
    switch (name) {
      case "shot": {
        const { data } = await page("Page.captureScreenshot", { format: "png" });
        const file = join(opts.out, `${arg || "shot"}.png`);
        writeFileSync(file, Buffer.from(data, "base64"));
        console.log(`screenshot ${file}`);
        break;
      }
      case "wait":
        await sleep(Number(arg));
        break;
      case "settle":
        await settle();
        break;
      case "tap":
        await tap(...nums());
        break;
      case "tap-text": {
        const hit = await evaluate(findText(arg));
        if (!hit) throw new Error(`no visible element with text "${arg}"`);
        await tap(hit.x, hit.y);
        break;
      }
      case "type":
        await page("Input.insertText", { text: arg });
        await sleep(100);
        break;
      case "swipe":
        await swipe(...nums());
        break;
      case "goto":
        await navigate(arg);
        break;
      case "text":
        console.log(await evaluate("document.body.innerText"));
        break;
      case "eval":
        console.log(JSON.stringify(await evaluate(arg), null, 2));
        break;
      case "offline":
      case "online":
        await page("Network.emulateNetworkConditions", {
          offline: name === "offline",
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
        });
        break;
      default:
        throw new Error(`unknown step "${step}"`);
    }
  } catch (e) {
    console.error(`step "${step}" failed: ${e.message}`);
    failed = true;
    break;
  }
}

if (problems.length) {
  console.log(`\n${problems.length} console problem(s):`);
  for (const p of problems.slice(0, 20)) console.log(`  ${p.slice(0, 300)}`);
}

await cdp.send("Target.disposeBrowserContext", { browserContextId });
cdp.ws.close();
process.exit(failed ? 1 : 0);
