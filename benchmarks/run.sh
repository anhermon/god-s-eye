#!/usr/bin/env bash
set -euo pipefail

# Gods Eye — Benchmark Suite
# Measures typecheck, lint, build success, and build time.
# Outputs benchmark-results.json in the repo root.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

###############################################################################
# 1. Install dependencies
###############################################################################
echo "==> Installing dependencies..."
if [ -f package-lock.json ]; then
  npm ci --ignore-scripts=false 2>&1 | tail -1
else
  npm install 2>&1 | tail -1
fi

###############################################################################
# 2. TypeScript type check
###############################################################################
echo "==> Running typecheck (tsc --noEmit)..."
if npx tsc --noEmit 2>&1; then
  TYPECHECK_PASS=1
  echo "    typecheck: PASS"
else
  TYPECHECK_PASS=0
  echo "    typecheck: FAIL"
fi

###############################################################################
# 3. Lint
###############################################################################
echo "==> Running lint..."
if npm run lint 2>&1; then
  LINT_CLEAN=1
  echo "    lint: PASS"
else
  LINT_CLEAN=0
  echo "    lint: FAIL"
fi

###############################################################################
# 4. Build (measure time)
###############################################################################
echo "==> Running build..."
BUILD_START=$(date +%s)
if npm run build 2>&1; then
  BUILD_SUCCESS=1
  echo "    build: PASS"
else
  BUILD_SUCCESS=0
  echo "    build: FAIL"
fi
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
echo "    build_time: ${BUILD_TIME}s"

# Normalize build time: under 120s = 1.0, linear decay to 0 at 600s
if [ "$BUILD_TIME" -le 120 ]; then
  BUILD_TIME_SCORE="1.0"
elif [ "$BUILD_TIME" -ge 600 ]; then
  BUILD_TIME_SCORE="0.0"
else
  # Linear decay: 1.0 - (time - 120) / 480
  BUILD_TIME_SCORE=$(awk "BEGIN { printf \"%.4f\", 1.0 - ($BUILD_TIME - 120) / 480.0 }")
fi

###############################################################################
# 5. Code stats
###############################################################################
TS_FILE_COUNT=$(find "$REPO_ROOT" -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v .next | wc -l | tr -d ' ')
TS_LOC=$(find "$REPO_ROOT" -name '*.ts' -o -name '*.tsx' | grep -v node_modules | grep -v .next | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
TS_LOC=${TS_LOC:-0}

echo "==> Code stats: ${TS_FILE_COUNT} TS files, ${TS_LOC} lines"

###############################################################################
# 6. Compute overall score
###############################################################################
# Weights: build_success 0.35, typecheck_pass 0.30, lint_clean 0.20, build_time 0.15
OVERALL=$(awk "BEGIN { printf \"%.4f\", $BUILD_SUCCESS * 0.35 + $TYPECHECK_PASS * 0.30 + $LINT_CLEAN * 0.20 + $BUILD_TIME_SCORE * 0.15 }")

# pass if overall >= 0.7
PASS_BOOL="false"
if awk "BEGIN { exit ($OVERALL >= 0.7) ? 0 : 1 }"; then
  PASS_BOOL="true"
fi

echo "==> Overall score: ${OVERALL} (pass=${PASS_BOOL})"

###############################################################################
# 7. Write benchmark-results.json
###############################################################################
OUTPUT="$REPO_ROOT/benchmark-results.json"

if command -v jq &>/dev/null; then
  jq -n \
    --arg repo "gods-eye" \
    --arg commit "$COMMIT" \
    --arg ts "$TIMESTAMP" \
    --argjson typecheck "$TYPECHECK_PASS" \
    --argjson lint "$LINT_CLEAN" \
    --argjson build_success "$BUILD_SUCCESS" \
    --arg build_time "$BUILD_TIME_SCORE" \
    --argjson build_time_raw "$BUILD_TIME" \
    --argjson ts_files "$TS_FILE_COUNT" \
    --argjson ts_loc "$TS_LOC" \
    --arg overall "$OVERALL" \
    --arg pass "$PASS_BOOL" \
    '{
      repo: $repo,
      commit: $commit,
      timestamp: $ts,
      scores: [
        { name: "typecheck_pass", value: $typecheck, unit: "ratio" },
        { name: "lint_clean", value: $lint, unit: "ratio" },
        { name: "build_success", value: $build_success, unit: "ratio" },
        { name: "build_time", value: ($build_time | tonumber), unit: "ratio" },
        { name: "build_time_raw", value: $build_time_raw, unit: "seconds" },
        { name: "ts_file_count", value: $ts_files, unit: "count" },
        { name: "ts_loc", value: $ts_loc, unit: "lines" }
      ],
      overall: ($overall | tonumber),
      pass: ($pass == "true")
    }' > "$OUTPUT"
else
  printf '{\n  "repo": "gods-eye",\n  "commit": "%s",\n  "timestamp": "%s",\n  "scores": [\n    { "name": "typecheck_pass", "value": %s, "unit": "ratio" },\n    { "name": "lint_clean", "value": %s, "unit": "ratio" },\n    { "name": "build_success", "value": %s, "unit": "ratio" },\n    { "name": "build_time", "value": %s, "unit": "ratio" },\n    { "name": "build_time_raw", "value": %s, "unit": "seconds" },\n    { "name": "ts_file_count", "value": %s, "unit": "count" },\n    { "name": "ts_loc", "value": %s, "unit": "lines" }\n  ],\n  "overall": %s,\n  "pass": %s\n}\n' \
    "$COMMIT" "$TIMESTAMP" \
    "$TYPECHECK_PASS" "$LINT_CLEAN" "$BUILD_SUCCESS" "$BUILD_TIME_SCORE" "$BUILD_TIME" \
    "$TS_FILE_COUNT" "$TS_LOC" \
    "$OVERALL" "$PASS_BOOL" > "$OUTPUT"
fi

echo "==> Results written to $OUTPUT"

if [ "$PASS_BOOL" = "true" ]; then
  exit 0
else
  exit 1
fi
