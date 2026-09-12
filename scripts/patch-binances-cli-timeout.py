#!/usr/bin/env python3
"""Raise the default Binance REST request timeout so binance-cli works behind slow links.

Problem : @binance/common ConfigurationRestAPI defaults to timeout: 1000 ms, but
          api.binance.com latency in this sandbox is ~1.5-5 s, so every request aborts
          and the 3-retry loop ends with "Request failed after 3 retries".

Usage   : python3 scripts/patch-binances-cli-timeout.py [global-node-modules-dir]
          global-node-modules-dir defaults to the npm global prefix of the active
          Node.js installation (`npm root -g`).

Note    : re-run after every `npm install -g @binance/binance-cli` and after switching
          Node.js versions (each version keeps its own global node_modules).

Works with nvm, n, fnm and GitHub Actions (ubuntu-latest) since the path is resolved
via `npm root -g` instead of a hardcoded `~/.nvm` location.
"""
import os
import re
import subprocess
import sys


def global_node_modules_dir() -> str:
    out = subprocess.run(
        ["npm", "root", "-g"], capture_output=True, text=True
    ).stdout.strip()
    if not out or not os.path.isdir(out):
        raise SystemExit(
            "could not resolve npm global root; pass it explicitly as the argument"
        )
    return out


def main() -> int:
    global_root = sys.argv[1] if len(sys.argv) > 1 else global_node_modules_dir()
    base = os.path.join(global_root, "@binance/binance-cli")
    # Include all @binance/common copies: npm dedupes some connectors (usds-futures,
    # coin-futures, fiat, vip-loan, sub-account) to their own nested copy of
    # @binance/common, which also carries the 1000 ms default timeout.
    targets = [
        os.path.join(base, "node_modules/@binance/common/dist/index.mjs"),
        os.path.join(base, "node_modules/@binance/common/dist/index.js"),
    ]
    for glob_dir in (
        f"{base}/node_modules/@binance/*/node_modules/@binance/common/dist",
    ):
        import glob as _glob

        for dist_dir in _glob.glob(glob_dir):
            for name in ("index.mjs", "index.js"):
                targets.append(os.path.join(dist_dir, name))
    patched_any = False
    for path in targets:
        if not os.path.exists(path):
            continue
        src = open(path, encoding="utf-8").read()
        pattern = re.compile(
            r"(this\.baseOptions\s*=\s*\{[^}]*?timeout:\s*param\.timeout\s*\?\?\s*)1e3(,)"
        )
        if not pattern.search(src):
            if "15000" in src and "baseOptions" in src:
                print(f"[ok] {path} — already patched")
                patched_any = True
            else:
                print(f"[skip] {path} — marker not found (already patched or different version)")
            continue
        src, n = pattern.subn(r"\g<1>15000\g<2>", src, count=1)
        open(path, "w", encoding="utf-8").write(src)
        print(f"[patch] {path} — timeout 1000 ms -> 15000 ms ({n} replacement)")
        patched_any = True
    if not patched_any:
        print(
            "no file was patched; is @binance/binance-cli installed at",
            base, "?",
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
