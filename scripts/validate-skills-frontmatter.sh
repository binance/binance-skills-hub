#!/usr/bin/env bash
set -euo pipefail

fail=0

while IFS= read -r -d '' file; do
  frontmatter=$(awk 'BEGIN{in=0} /^---$/{if(in==0){in=1;next}else{exit}} in{print}' "$file")

  if [[ -z "$frontmatter" ]]; then
    echo "[ERROR] Missing frontmatter: $file"
    fail=1
    continue
  fi

  if ! grep -Eq '^name:' <<<"$frontmatter"; then
    echo "[ERROR] Missing 'name' in $file"
    fail=1
  fi

  if ! grep -Eq '^description:' <<<"$frontmatter"; then
    echo "[ERROR] Missing 'description' in $file"
    fail=1
  fi

  if ! grep -Eq '^metadata:' <<<"$frontmatter"; then
    echo "[ERROR] Missing 'metadata' in $file"
    fail=1
  fi

  if ! grep -Eq '^[[:space:]]+version:' <<<"$frontmatter"; then
    echo "[ERROR] Missing 'metadata.version' in $file"
    fail=1
  fi

  if ! grep -Eq '^[[:space:]]+author:' <<<"$frontmatter"; then
    echo "[ERROR] Missing 'metadata.author' in $file"
    fail=1
  fi
done < <(find skills -type f -name 'SKILL.md' -print0)

if [[ "$fail" -ne 0 ]]; then
  echo "\nFrontmatter validation failed."
  exit 1
fi

echo "Frontmatter validation passed."
