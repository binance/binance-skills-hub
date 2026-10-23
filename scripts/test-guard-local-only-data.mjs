import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { findTrackedLocalOnlyData } from "./check-no-tracked-data.mjs";

const fixturePath = fileURLToPath(
  new URL("../tests/fixtures/local-only-data-filenames.json", import.meta.url),
);
const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));

assert.deepEqual(
  findTrackedLocalOnlyData(fixture.blocked),
  fixture.blocked,
  "ทุกชื่อไฟล์ fixture เชิงลบต้องถูก guard ปฏิเสธ",
);
assert.deepEqual(
  findTrackedLocalOnlyData(fixture.allowed),
  [],
  "ชื่อไฟล์ fixture ที่อนุญาตต้องไม่ถูก guard ปฏิเสธ",
);

console.log(
  JSON.stringify({
    ok: true,
    blocked_fixture_count: fixture.blocked.length,
    allowed_fixture_count: fixture.allowed.length,
    metadata_files_written: 0,
  }),
);
