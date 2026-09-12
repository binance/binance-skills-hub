import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** Matches every tracked file whose basename ends in .data, case-insensitively. */
export const localOnlyDataPattern = /(^|\/)[^/]*\.data$/i;

// Scheduled workflow output that is allowed to be tracked (read-only market data).
export const allowedTrackedData = ["data/binance-1h.data", "data/binance-daily.data"];

export function findTrackedLocalOnlyData(fileNames) {
  return fileNames
    .filter((fileName) => !allowedTrackedData.includes(fileName))
    .filter((fileName) => localOnlyDataPattern.test(fileName));
}

function main() {
  const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  // Opt-in: the scheduled workflow outputs are allowed to be tracked
  // (read-only market data). See the workflow files for provenance.
  const allowed = ["data/binance-1h.data", "data/binance-daily.data"];
  const blockedFiles = findTrackedLocalOnlyData(
    trackedFiles.filter((f) => !allowed.includes(f)),
  );

  if (blockedFiles.length > 0) {
    console.error(
      "::error::Tracked .data files are not allowed. Keep account, login, and scan data local-only.",
    );
    console.error(blockedFiles.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("No tracked local-only data files found.");
}

const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile === fileURLToPath(import.meta.url)) {
  main();
}
