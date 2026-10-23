import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const cliPath = resolve(root, "skills/binance/binance-cli-openclaw/scripts/cli.mjs");
const tempDir = mkdtempSync(join(tmpdir(), "openclaw-qr-decode-"));
const qrImagePath = join(tempDir, "sample-qr.png");
const noQrImagePath = join(tempDir, "blank.png");
const encodedPayload = "ethereum:0x1111111111111111111111111111111111111111";

function runNodeCli(params) {
  return spawnSync(process.execPath, [cliPath, "decode-qr", JSON.stringify(params)], {
    encoding: "utf8",
  });
}

function parseJsonOutput(result) {
  const stdout = (result.stdout || "").trim();
  if (!stdout) return null;
  return JSON.parse(stdout);
}

const generation = spawnSync(
  "python3",
  [
    "-c",
    `
import qrcode
from PIL import Image

payload = ${JSON.stringify(encodedPayload)}
qr_path = ${JSON.stringify(qrImagePath)}
blank_path = ${JSON.stringify(noQrImagePath)}

img = qrcode.make(payload)
img.save(qr_path)
Image.new("RGB", (300, 300), color="white").save(blank_path)
`,
  ],
  { encoding: "utf8" },
);

if (generation.status !== 0) {
  throw new Error(`QR fixture generation failed. Install deps: pip install qrcode pillow\\n${generation.stderr}`);
}

const imageResult = runNodeCli({ imagePath: qrImagePath });
assert.equal(imageResult.status, 0, imageResult.stderr || imageResult.stdout);
const imagePayload = parseJsonOutput(imageResult);
assert.equal(imagePayload?.success, true);
assert.equal(imagePayload?.count, 1);
assert.equal(imagePayload?.results?.[0]?.raw_value, encodedPayload);
assert.ok(imagePayload?.results?.[0]?.recognized_as?.includes("payment_uri"));

const noQrResult = runNodeCli({ imagePath: noQrImagePath });
assert.equal(noQrResult.status, 1);
const noQrPayload = parseJsonOutput(noQrResult);
assert.equal(noQrPayload?.success, false);
assert.equal(noQrPayload?.error, "no_qr_found");

readFileSync(qrImagePath); // ensure fixture exists before serving directory
const serverPort = 8765;
const server = spawn("python3", ["-m", "http.server", String(serverPort), "--bind", "127.0.0.1"], {
  cwd: tempDir,
  stdio: "ignore",
});
await new Promise((resolveReady) => setTimeout(resolveReady, 750));
const urlResult = runNodeCli({ imageUrl: `http://127.0.0.1:${serverPort}/sample-qr.png` });
server.kill("SIGTERM");

assert.equal(urlResult.status, 0, urlResult.stderr || urlResult.stdout);
const urlPayload = parseJsonOutput(urlResult);
assert.equal(urlPayload?.success, true);
assert.equal(urlPayload?.results?.[0]?.raw_value, encodedPayload);

rmSync(tempDir, { recursive: true, force: true });
console.log("binance-cli-openclaw:qr-decode:test passed");
