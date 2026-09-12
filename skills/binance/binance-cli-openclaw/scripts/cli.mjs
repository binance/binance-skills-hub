import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const USAGE = `Usage:
  node scripts/cli.mjs <command> '<json_params>' [--dry-run]

Commands:
  account-info
  ticker-price
  order-place
  order-status
  decode-qr
`;

function parseParams(input) {
  if (!input) return {};
  try {
    const parsed = JSON.parse(input);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("params must be a JSON object");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid JSON params: ${error.message}`);
  }
}

function requireField(params, field, command) {
  if (params[field] === undefined || params[field] === null || params[field] === "") {
    throw new Error(`'${field}' is required for ${command}`);
  }
}

function pushFlag(args, flag, value) {
  if (value === undefined || value === null || value === "") return;
  args.push(flag, String(value));
}

export function buildQrDecodeArgs(params = {}) {
  const imagePath = params.imagePath ?? params.image ?? params.path;
  const imageUrl = params.imageUrl ?? params.url;

  if (!!imagePath === !!imageUrl) {
    throw new Error("Provide exactly one of 'imagePath' (or image/path) or 'imageUrl' (or url) for decode-qr");
  }

  return imagePath ? ["--image", String(imagePath)] : ["--url", String(imageUrl)];
}

function runQrDecode(params = {}, dryRun = false) {
  const scriptPath = fileURLToPath(new URL("./qr-decode.py", import.meta.url));
  const args = [scriptPath, ...buildQrDecodeArgs(params)];

  if (dryRun) {
    console.log(`python3 ${args.join(" ")}`);
    return;
  }

  const result = spawnSync("python3", args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

export function buildBinanceCliArgs(command, params = {}) {
  const args = [];
  switch (command) {
    case "account-info": {
      args.push("spot", "get-account");
      pushFlag(args, "--omit-zero-balances", params.omitZeroBalances);
      break;
    }
    case "ticker-price": {
      requireField(params, "symbol", command);
      args.push("spot", "ticker-price", "--symbol", String(params.symbol));
      break;
    }
    case "order-place": {
      requireField(params, "symbol", command);
      requireField(params, "side", command);
      requireField(params, "type", command);
      if (!params.quantity && !params.quoteOrderQty) {
        throw new Error("'quantity' or 'quoteOrderQty' is required for order-place");
      }
      args.push(
        "spot",
        "new-order",
        "--symbol",
        String(params.symbol),
        "--side",
        String(params.side),
        "--type",
        String(params.type),
      );
      pushFlag(args, "--quantity", params.quantity);
      pushFlag(args, "--quote-order-qty", params.quoteOrderQty);
      pushFlag(args, "--price", params.price);
      pushFlag(args, "--time-in-force", params.timeInForce);
      pushFlag(args, "--new-order-resp-type", params.newOrderRespType);
      break;
    }
    case "order-status": {
      requireField(params, "symbol", command);
      if (!params.orderId && !params.origClientOrderId) {
        throw new Error("'orderId' or 'origClientOrderId' is required for order-status");
      }
      args.push("spot", "get-order", "--symbol", String(params.symbol));
      pushFlag(args, "--order-id", params.orderId);
      pushFlag(args, "--orig-client-order-id", params.origClientOrderId);
      break;
    }
    default:
      throw new Error(`Unknown command: ${command}`);
  }

  pushFlag(args, "--recv-window", params.recvWindow);
  pushFlag(args, "--profile", params.profile);

  return args;
}

function main(argv) {
  const command = argv[2];
  const paramsInput = argv[3];
  const dryRun = argv.includes("--dry-run");

  if (!command) {
    throw new Error(USAGE);
  }

  const params = parseParams(paramsInput);
  if (command === "decode-qr") {
    runQrDecode(params, dryRun);
    return;
  }

  const args = buildBinanceCliArgs(command, params);

  if (dryRun) {
    console.log(`binance-cli ${args.join(" ")}`);
    return;
  }

  const result = spawnSync("binance-cli", args, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(process.argv);
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
}
