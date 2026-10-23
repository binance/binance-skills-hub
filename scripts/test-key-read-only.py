#!/usr/bin/env python3
"""Read-only verification of a Binance API key pair (no trading/withdraw).

Uses HMAC-SHA256 signature required by private endpoints (GET /api/v3/account).
Only reads: account identity, enabled permissions, balances.
"""
import hashlib
import hmac
import os
import time
import urllib.parse
from urllib.request import Request, urlopen

KEY = os.environ.get("BINANCE_API_KEY", "")
SECRET = os.environ.get("BINANCE_SECRET_KEY", "")
BASE = "https://api.binance.com"


def signed_get(path, extra=None):
    params = dict(extra or {})
    params["timestamp"] = int(time.time() * 1000)
    query = urllib.parse.urlencode(params)
    signature = hmac.new(
        SECRET.encode(), query.encode(), hashlib.sha256
    ).hexdigest()
    query += f"&signature={signature}"
    req = Request(
        f"{BASE}{path}?{query}",
        headers={"X-MBX-APIKEY": KEY},
    )
    with urlopen(req, timeout=15) as resp:
        return resp.read().decode()


def main():
    raw = signed_get("/api/v3/account")
    import json

    acct = json.loads(raw)
    print("uid:", acct.get("uid"))
    # permissions is a plain list of strings, e.g. ["SPOT"]
    perms = acct.get("permissions", [])
    print("permissions:", perms)
    is_spot = "SPOT" in perms
    print("spot reading allowed:", is_spot)
    n_bal = sum(1 for b in acct.get("balances", []) if float(b["free"]) or float(b["locked"]))
    print("balances with non-zero:", n_bal, "of", len(acct.get("balances", [])))
    for b in acct.get("balances", []):
        if float(b["free"]) or float(b["locked"]):
            print(f"  {b['asset']}: free={b['free']} locked={b['locked']}")
    print("READ-ONLY CHECK PASSED — no orders placed")


if __name__ == "__main__":
    main()
