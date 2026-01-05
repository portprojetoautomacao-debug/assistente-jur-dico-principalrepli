#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Merging LCOV files..."

LCOV_OUT=coverage/lcov.info
LCOV_API=coverage-api/lcov.info
LCOV_EXT=chrome-extension-pje/coverage/lcov.info

mkdir -p coverage

declare -a FILES_TO_MERGE=()
if [[ -f "$LCOV_API" ]]; then FILES_TO_MERGE+=("$LCOV_API"); fi
if [[ -f "$LCOV_EXT" ]]; then FILES_TO_MERGE+=("$LCOV_EXT"); fi

if [[ ${#FILES_TO_MERGE[@]} -eq 0 ]]; then
  echo "❌ No LCOV files found. Expected at least one of:" >&2
  echo "   - $LCOV_API" >&2
  echo "   - $LCOV_EXT" >&2
  exit 1
fi

TMP_OUT="coverage/.lcov.merged.tmp"
echo "Generating merged LCOV: $LCOV_OUT"
rm -f "$TMP_OUT"

# Basic LCOV concatenation with deduplication of 'TN:' and 'end_of_record' lines.
for f in "${FILES_TO_MERGE[@]}"; do
  awk 'BEGIN {ORS="\n"} {if ($0 ~ /^TN:/) next; if ($0 ~ /^end_of_record/) next; print $0}' "$f" >> "$TMP_OUT"
  echo "end_of_record" >> "$TMP_OUT"
done

mv -f "$TMP_OUT" "$LCOV_OUT"

echo "✅ Merged LCOV created: $(du -h "$LCOV_OUT" | cut -f1)"
exit 0
