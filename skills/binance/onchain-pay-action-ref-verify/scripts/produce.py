#!/usr/bin/env python3
"""
Derives action_ref (action-ref-v1: JCS RFC 8785 + SHA-256) for a declared
Binance Onchain-Pay `pre-order` request/result pair, plus the additive
params_digest/result_digest envelope.

Does NOT call Binance's API and does NOT place any order. Takes the
request and response JSON the caller already has (from its own pre-order
call) and derives a recomputable identifier for them.

Usage:
    python3 produce.py '<request_json>' '<response_json>' [--agent-id ID] [--timestamp TS]

<request_json>  — the pre-order request body actually sent (must include
                   at minimum externalOrderId; other fields per
                   skills/binance/onchain-pay/SKILL.md's pre-order table).
<response_json> — the pre-order response actually received (per SKILL.md's
                   documented response shape: code, message, success,
                   data.link, data.linkExpireTime).
--agent-id      — caller-declared identity for the preimage. Defaults to
                   "unspecified-agent" if omitted (still produces a valid,
                   recomputable action_ref — the caller is responsible for
                   supplying a meaningful agent_id for real use).
--timestamp     — RFC 3339 UTC, ms precision (e.g. 2026-08-20T18:00:00.000Z).
                   Defaults to current UTC time if omitted.

Prints the envelope JSON to stdout. Nothing is written to disk and nothing
is anchored — anchoring is a separate, explicit step (see the worked
example at giskard09/binance-onchain-pay-action-ref-anchor for how, and
its PROVENANCE.md for what "anchored" does and does not mean).
"""
import argparse
import datetime
import hashlib
import json
import sys


def jcs(obj):
    return json.dumps(obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False)


def sha256_hex(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("request_json", help="pre-order request body actually sent, as a JSON string")
    ap.add_argument("response_json", help="pre-order response actually received, as a JSON string")
    ap.add_argument("--agent-id", default="unspecified-agent")
    ap.add_argument("--timestamp", default=None, help="RFC 3339 UTC ms precision; defaults to now")
    args = ap.parse_args()

    try:
        params = json.loads(args.request_json)
    except json.JSONDecodeError as e:
        sys.exit(f"request_json is not valid JSON: {e}")
    try:
        result = json.loads(args.response_json)
    except json.JSONDecodeError as e:
        sys.exit(f"response_json is not valid JSON: {e}")

    if "externalOrderId" not in params:
        sys.exit("request_json must include externalOrderId (per SKILL.md's pre-order table)")

    timestamp = args.timestamp or datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.") + f"{datetime.datetime.now(datetime.timezone.utc).microsecond // 1000:03d}Z"

    # scope carries the network the pre-order targets, when declared —
    # falls back to "unspecified" if the request didn't set one (network is
    # optional in SKILL.md's pre-order table).
    network = params.get("network", "unspecified")
    preimage = {
        "agent_id": args.agent_id,
        "action_type": "binance.onchain_pay.buy.pre_order",
        "scope": f"binance:onchain-pay:papi/v1/ramp/connect/buy/pre-order:network:{network}",
        "timestamp": timestamp,
    }
    jcs_payload = jcs(preimage)
    action_ref = sha256_hex(jcs_payload)

    params_digest = sha256_hex(jcs(params))
    result_digest = sha256_hex(jcs(result))

    envelope = {
        "packet_version": "1.0",
        "action_ref": action_ref,
        "hash_algo": "sha256",
        "preimage_format": "jcs-rfc8785-v1",
        "preimage": preimage,
        "capability": "onchain-pay.buy.pre_order",
        "params_digest": params_digest,
        "result_digest": result_digest,
        "anchor_ref_bytes32": "0x" + action_ref,
        "generated_at_utc": timestamp,
    }

    print(json.dumps(envelope, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
