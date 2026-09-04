#!/usr/bin/env python3
"""
Checks whether a given action_ref has a matching Anchored(bytes32,address,
uint256) event on AnchorRegistry, on the specified chain. Independent,
stdlib-only — queries public RPC directly, trusts nothing passed in beyond
the ref itself.

Usage:
    python3 verify_anchor.py <action_ref_hex> --near-block N [--chain base|arbitrum|ink] [--rpc URL]
    python3 verify_anchor.py <action_ref_hex> --from-block A --to-block B [--chain ...]

<action_ref_hex> — the action_ref to check, with or without leading 0x
                    (64 hex chars, as printed by produce.py's envelope).

Public RPC providers reject unbounded eth_getLogs (HTTP 413 / "block range
too large") — there is no default full-chain scan. Give either
--near-block (the block the anchor tx is claimed to be in or near; scans
+/-1000 blocks around it) or an explicit --from-block/--to-block range.
Neither is a security requirement — the block hint only narrows the RPC
query; the match is still verified against the actual on-chain log, not
trusted from the hint.

Exit code 0 if a matching Anchored event was found (prints tx/block/
anchoredBy/timestamp), 1 otherwise (including "no anchor found" — the
absence of an anchor is not an error, just a fact this script reports).
"""
import argparse
import json
import sys
import urllib.request

ANCHOR_REGISTRY = "0x49fEcA52bC634a9Ab773226D16619deC547794aa"
# keccak256("Anchored(bytes32,address,uint256)")
ANCHORED_TOPIC0 = "0xfe2289542f7a0110ac112c3a4d712afdcaaf2900a1326f4e6f340b563a0e8734"

RPCS = {
    "base": "https://mainnet.base.org",
    "arbitrum": "https://arb1.arbitrum.io/rpc",
    "ink": "https://rpc-gel.inkonchain.com",
}
CHAIN_IDS = {"base": 8453, "arbitrum": 42161, "ink": 57073}


def rpc(url, method, params):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(
        url, data=body,
        headers={"Content-Type": "application/json", "User-Agent": "onchain-pay-action-ref-verify/0.1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        out = json.loads(r.read())
    if "error" in out:
        raise RuntimeError(f"RPC {method} error: {out['error']}")
    return out["result"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("action_ref", help="64-hex-char action_ref, with or without 0x prefix")
    ap.add_argument("--chain", choices=list(RPCS), default="base")
    ap.add_argument("--rpc", default=None, help="override the default public RPC for --chain")
    ap.add_argument("--near-block", type=int, default=None,
                     help="block the anchor is claimed to be near; scans +/-1000 blocks")
    ap.add_argument("--window", type=int, default=1000,
                     help="blocks to scan on each side of --near-block (default 1000)")
    ap.add_argument("--from-block", default=None,
                     help="explicit start block (decimal); overrides --near-block")
    ap.add_argument("--to-block", default=None,
                     help="explicit end block (decimal); overrides --near-block")
    args = ap.parse_args()

    if args.from_block is not None and args.to_block is not None:
        from_block, to_block = hex(int(args.from_block)), hex(int(args.to_block))
    elif args.near_block is not None:
        from_block = hex(max(0, args.near_block - args.window))
        to_block = hex(args.near_block + args.window)
    else:
        sys.exit(
            "give --near-block N (recommended) or both --from-block/--to-block — "
            "public RPC rejects an unbounded eth_getLogs scan. See --help."
        )

    ref = args.action_ref.lower()
    if not ref.startswith("0x"):
        ref = "0x" + ref
    if len(ref) != 66:
        sys.exit(f"action_ref must be 32 bytes (64 hex chars); got {len(ref) - 2}")

    url = args.rpc or RPCS[args.chain]

    # Clamp to_block to the current head — a --near-block/--window (or
    # explicit --to-block) that reaches past chain tip is a normal case
    # (e.g. checking a recent anchor with the default window), not a user
    # error; public RPC rejects it outright rather than clamping itself.
    if to_block not in ("earliest", "latest", "pending"):
        head = int(rpc(url, "eth_blockNumber", []), 16)
        if int(to_block, 16) > head:
            to_block = hex(head)

    logs = rpc(url, "eth_getLogs", [{
        "address": ANCHOR_REGISTRY,
        "fromBlock": from_block,
        "toBlock": to_block,
        "topics": [ANCHORED_TOPIC0, ref],
    }])

    if not logs:
        print(f"[NOT FOUND] no Anchored event for {ref} on {args.chain} "
              f"(chainId {CHAIN_IDS[args.chain]}, registry {ANCHOR_REGISTRY})")
        sys.exit(1)

    log = logs[0]
    ts = int(log["data"], 16)
    anchored_by = "0x" + log["topics"][2][-40:]
    print(f"[FOUND] Anchored event on {args.chain} (chainId {CHAIN_IDS[args.chain]})")
    print(f"  registry         : {ANCHOR_REGISTRY}")
    print(f"  ref              : {ref}")
    print(f"  tx               : {log['transactionHash']}")
    print(f"  block            : {int(log['blockNumber'], 16)}")
    print(f"  anchoredBy       : {anchored_by}")
    print(f"  block timestamp  : {ts}")
    sys.exit(0)


if __name__ == "__main__":
    main()
