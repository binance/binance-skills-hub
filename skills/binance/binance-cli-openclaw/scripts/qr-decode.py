#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


def fail(error, message, **extra):
    payload = {"success": False, "error": error, "message": message, **extra}
    print(json.dumps(payload))
    raise SystemExit(1)


try:
    import cv2
    import numpy as np
except Exception:
    fail(
        "missing_dependencies",
        "QR decoder dependencies are missing. Install with: pip install opencv-python",
    )


def decode_from_image(image):
    detector = cv2.QRCodeDetector()
    results = []
    seen = set()

    try:
        ok, decoded_info, _points, _ = detector.detectAndDecodeMulti(image)
    except Exception:
        ok, decoded_info = False, []

    if ok and decoded_info:
        for item in decoded_info:
            value = (item or "").strip()
            if value and value not in seen:
                seen.add(value)
                results.append(value)

    if not results:
        try:
            value, _points, _ = detector.detectAndDecode(image)
        except Exception:
            value = ""
        value = (value or "").strip()
        if value:
            results.append(value)

    return results


def fetch_image_bytes(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        fail("invalid_url", "Only http/https URLs are supported", provided_url=url)

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return response.read()
    except urllib.error.URLError as exc:
        fail("url_fetch_failed", f"Failed to fetch image URL: {exc}", provided_url=url)


def classify_value(value):
    labels = []
    lowered = value.lower()
    parsed = urllib.parse.urlparse(value)
    hostname = (parsed.hostname or "").lower()
    is_binance_host = hostname == "binance.com" or hostname.endswith(".binance.com")
    is_binance_pay_path = parsed.path.startswith("/pay") or parsed.path.startswith("/qr")

    if (
        lowered.startswith("binance://")
        or "binancepay" in lowered
        or (is_binance_host and is_binance_pay_path)
    ):
        labels.append("binance_pay_qr")

    if re.match(r"^(bitcoin|ethereum|litecoin|solana|tron|bnb|bsc):", lowered):
        labels.append("payment_uri")

    if re.fullmatch(r"0x[a-fA-F0-9]{40}", value):
        labels.append("wallet_address")
    elif re.fullmatch(r"(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}", value):
        labels.append("wallet_address")
    elif re.fullmatch(r"T[1-9A-HJ-NP-Za-km-z]{33}", value):
        labels.append("wallet_address")
    elif re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{32,44}", value):
        labels.append("wallet_address_candidate")

    return labels or ["unclassified"]


def main():
    parser = argparse.ArgumentParser(description="Decode QR code(s) from image path or URL")
    parser.add_argument("--image", help="Image file path")
    parser.add_argument("--url", help="Image URL")
    args = parser.parse_args()

    if bool(args.image) == bool(args.url):
        fail("invalid_input", "Provide exactly one of --image or --url")

    source = {}
    if args.image:
        if not os.path.exists(args.image):
            fail("file_not_found", f"File not found: {args.image}", provided_path=args.image)
        image = cv2.imread(args.image)
        if image is None:
            fail("decode_input_failed", f"Unable to read image file: {args.image}", provided_path=args.image)
        source = {"type": "image_path", "value": args.image}
    else:
        image_bytes = fetch_image_bytes(args.url)
        array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if image is None:
            fail("decode_input_failed", "Unable to decode image bytes from URL", provided_url=args.url)
        source = {"type": "image_url", "value": args.url}

    decoded_values = decode_from_image(image)
    if not decoded_values:
        fail("no_qr_found", "No QR code found in the provided image", source=source)

    results = [
        {"raw_value": value, "recognized_as": classify_value(value)}
        for value in decoded_values
    ]
    print(json.dumps({"success": True, "source": source, "count": len(results), "results": results}))


if __name__ == "__main__":
    main()
