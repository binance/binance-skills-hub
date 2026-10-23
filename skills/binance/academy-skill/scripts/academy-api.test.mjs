import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

async function client(t, handle) {
  const root = await mkdtemp(join(tmpdir(), "academy-timeout-"));
  const server = createServer(handle);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  await mkdir(join(root, "scripts"));
  await mkdir(join(root, "env"));
  await copyFile(new URL("./academy-api.mjs", import.meta.url), join(root, "scripts", "academy-api.mjs"));
  await writeFile(join(root, "env", "prod.env"), [
    `ACADEMY_BASE_URL=${base}`,
    `ACADEMY_SEARCH_API_BASE_URL=${base}`,
    "ACADEMY_PUBLIC_DOMAIN=https://example.invalid",
    "ACADEMY_TIMEOUT_MS=100",
  ].join("\n"));
  return import(pathToFileURL(join(root, "scripts", "academy-api.mjs")));
}

async function bounded(promise) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Test deadline expired")), 1500); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function json(res, data) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ code: "000000", data }));
}

for (const bodyStarted of [false, true]) {
  test(`POST times out with ${bodyStarted ? "unfinished body" : "no headers"}`, async (t) => {
    const api = await client(t, (_, res) => {
      if (bodyStarted) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write('{"code":"000000","data":');
      }
    });
    await assert.rejects(bounded(api.searchGlossary("prod", { query: "test" })), /Request timeout after 100ms/);
  });
}

test("stalled best-effort GET keeps the original article URL", async (t) => {
  let lookedUp = false;
  const api = await client(t, (req, res) => {
    if (req.method === "POST") {
      json(res, { items: [{ title: "Test article", visitUrl: "https://example.invalid/original" }] });
    } else {
      lookedUp = true;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write('{"code":"000000","data":');
    }
  });
  const items = await bounded(api.searchArticles("prod", { query: "test", language: "en" }));
  assert.equal(lookedUp, true);
  assert.equal(items[0].visitUrl, "https://example.invalid/original");
});

test("completed POST and GET still resolve the canonical article URL", async (t) => {
  const api = await client(t, (req, res) => json(res, req.method === "POST"
    ? { items: [{ title: "Test article", visitUrl: "https://example.invalid/original" }] }
    : { pages: { data: [{ slug: "test-article" }] } }));
  const items = await bounded(api.searchArticles("prod", { query: "test", language: "en" }));
  assert.equal(items[0].visitUrl, "https://example.invalid/en/academy/articles/test-article");
  assert.equal(items[0].originalVisitUrl, "https://example.invalid/original");
});

for (const [name, respond, expected] of [
  ["HTTP error", (res) => { res.writeHead(503); res.end("Unavailable"); }, /HTTP 503/],
  ["malformed JSON", (res) => res.end("not JSON"), /Malformed JSON response/],
  ["backend error", (res) => res.end(JSON.stringify({ code: "ERROR", message: "Unavailable" })), /Backend error code=ERROR/],
]) {
  test(`completed POST preserves ${name}`, async (t) => {
    const api = await client(t, (_, res) => respond(res));
    await assert.rejects(bounded(api.searchGlossary("prod", { query: "test" })), expected);
  });
}

for (const failure of ["no headers", "disconnected response", "HTTP error", "malformed JSON"]) {
  test(`best-effort GET falls back after ${failure}`, async (t) => {
    const api = await client(t, (req, res) => {
      if (req.method === "POST") {
        json(res, { items: [{ title: "Test article", visitUrl: "https://example.invalid/original" }] });
      } else if (failure === "disconnected response") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write('{"code":"000000","data":');
        setImmediate(() => res.destroy());
      } else if (failure === "HTTP error") {
        res.writeHead(503);
        res.end("Unavailable");
      } else if (failure === "malformed JSON") {
        res.end("not JSON");
      }
    });
    const items = await bounded(api.searchArticles("prod", { query: "test", language: "en" }));
    assert.equal(items[0].visitUrl, "https://example.invalid/original");
  });
}
