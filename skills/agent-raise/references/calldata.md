# Page calldata (`aw.lines`)

When the AgentRaise Mini App or page prompt provides calldata, it is the **canonical** payload.
This method is used for every page-supplied call (`newLauncher`, `contribute`, `settle`, and others), not only create.

## Format

- Do **not** printf or repeat the whole hex in chat as a single blob.
- The prompt has one 32-byte ABI word per line (64 lowercase hex chars).
- The first line is the 4-byte selector (8 hex chars, no `0x`).
- A line that is exactly `0` means 32 zero bytes.
- A line that is exactly `BENE` is the beneficiary (or other reserved address) word: 12 zero bytes + the 20-byte address.
- If the prompt says `FROM40_HERE` / beneficiary is the executing wallet, set `F` to your wallet address as 40 lowercase hex characters **without** `0x`. Otherwise set `F` to the 40-hex value the prompt already gives.

## Script (run exactly; one shell call)

Substitute only `{lineCount}`, `{sha256Dummy}`, and the `F=…` line from the current prompt. Do not alter the `awk` logic.

```sh
F=<40 lowercase hex without 0x>
case "$F" in *[!0-9a-f]*) echo BADFROM; exit 1;; esac; [ ${#F} = 40 ] || { echo BADFROM; exit 1; }
cat > /tmp/aw.lines <<'EOF'
<one selector line, then one word per line, as printed by the page>
EOF
x(){ awk -v F="$1" 'NR==1{printf "0x%s",$0;next}$0=="0"{printf "%064d",0;next}$0=="BENE"{printf "%024d%s",0,F;next}{printf "%s",$0}' /tmp/aw.lines; }
[ "$(wc -l < /tmp/aw.lines | tr -d ' ')" = {lineCount} ] && awk 'NR==1&&length($0)!=8{e=1}NR>1&&$0!="0"&&$0!="BENE"&&length($0)!=64{e=1}END{exit e}' /tmp/aw.lines || { echo BADLINE; exit 1; }
[ "$(x bebebebebebebebebebebebebebebebebebebebe | shasum -a 256 | cut -c1-64)" = {sha256Dummy} ] || { echo CORRUPT; exit 1; }
x "$F" > /tmp/aw.hex; python3 -c "s=open('/tmp/aw.hex').read();print(len(s),len(s)%2,(len(s)-10)%64)"
```

The dummy address used in the sha256 check is always 20 bytes of `0xbe`. That is a checksum sentinel, not a payment destination.

## Pass / fail

- `BADFROM` — `F` is not 40 lowercase hex chars. Fix `F`; do not edit `/tmp/aw.lines`.
- `BADLINE` — line count or a line length is wrong. Stop and request a new prompt.
- `CORRUPT` — sha256 of the expansion with the dummy `F=be…be` does not match `{sha256Dummy}`. Stop. Never hand-patch.
- Last printed line must be `{inputLen} 0 0` as stated in the prompt (`inputLen` includes the `0x` prefix; even length; payload is selector + N × 32-byte words). The `BENE` substitution is 40 hex for 40 hex, so length does not change.
- If the prompt also gives `keccak256` before the swap, you may compare, but a `CORRUPT` sha256 already means stop.

On success, use `/tmp/aw.hex` as `--inputData` verbatim.

```bash
baw contract-call preview --binanceChainId 56 --from <FROM> --to <TO> --value <wei or 0> --inputData "$(cat /tmp/aw.hex)" --json
```

If the page did not use `aw.lines` and instead pasted a complete hex string, use that hex only if it is well-formed `0x` + even hex, and still do not re-encode it. Prefer `aw.lines` when both are present.
