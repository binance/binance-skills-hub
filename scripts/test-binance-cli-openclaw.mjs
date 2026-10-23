import assert from "node:assert/strict";

import { buildBinanceCliArgs, buildQrDecodeArgs } from "../skills/binance/binance-cli-openclaw/scripts/cli.mjs";

assert.deepEqual(buildBinanceCliArgs("account-info", {}), ["spot", "get-account"]);
assert.deepEqual(buildBinanceCliArgs("ticker-price", { symbol: "BTCUSDT" }), [
  "spot",
  "ticker-price",
  "--symbol",
  "BTCUSDT",
]);
assert.deepEqual(
  buildBinanceCliArgs("order-place", {
    symbol: "BTCUSDT",
    side: "BUY",
    type: "MARKET",
    quoteOrderQty: "25",
    profile: "prod-main",
  }),
  [
    "spot",
    "new-order",
    "--symbol",
    "BTCUSDT",
    "--side",
    "BUY",
    "--type",
    "MARKET",
    "--quote-order-qty",
    "25",
    "--profile",
    "prod-main",
  ],
);
assert.deepEqual(
  buildBinanceCliArgs("order-status", {
    symbol: "BTCUSDT",
    orderId: "123",
    recvWindow: 5000,
  }),
  [
    "spot",
    "get-order",
    "--symbol",
    "BTCUSDT",
    "--order-id",
    "123",
    "--recv-window",
    "5000",
  ],
);

assert.throws(
  () => buildBinanceCliArgs("order-place", { symbol: "BTCUSDT", side: "BUY", type: "MARKET" }),
  /quantity.*quoteOrderQty/,
);
assert.throws(() => buildBinanceCliArgs("ticker-price", {}), /symbol/);

assert.deepEqual(buildQrDecodeArgs({ imagePath: "/tmp/qr.png" }), ["--image", "/tmp/qr.png"]);
assert.deepEqual(buildQrDecodeArgs({ image: "/tmp/qr.png" }), ["--image", "/tmp/qr.png"]);
assert.deepEqual(buildQrDecodeArgs({ imageUrl: "https://example.com/qr.png" }), ["--url", "https://example.com/qr.png"]);
assert.throws(() => buildQrDecodeArgs({}), /exactly one/);
assert.throws(() => buildQrDecodeArgs({ imagePath: "/tmp/a.png", imageUrl: "https://example.com/b.png" }), /exactly one/);

console.log("binance-cli-openclaw:test passed");
