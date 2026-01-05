#!/usr/bin/env bash
# Basic test runner for DSPy Bridge (FastAPI)
# Usage: ./scripts/test-dspy-bridge.sh

set -euo pipefail

DSPY_PORT=${DSPY_PORT:-8765}
DSPY_TOKEN=${DSPY_API_TOKEN:-dummy-token}

echo "Starting DSPy bridge..."
DSPY_LOG=$(mktemp)
python3 scripts/dspy_bridge.py &> "$DSPY_LOG" &
PID=$!
echo "DSPy bridge started with PID $PID"

sleep 1

echo "Running health check..."
if curl -sf "http://127.0.0.1:$DSPY_PORT/health" | grep -q 'dspy-bridge'; then
  echo "Health: OK"
else
  echo "DSPy bridge health check failed"
  tail -n +1 "$DSPY_LOG"
  kill $PID || true
  exit 1
fi

echo "Running optimize endpoint test..."
RESPONSE=$(curl -s -X POST "http://127.0.0.1:$DSPY_PORT/optimize" \
  -H "Authorization: Bearer $DSPY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Test prompt for DSPy"}')

echo "Response: $RESPONSE"

echo "Stopping DSPy bridge..."
kill $PID || true
wait $PID 2>/dev/null || true
echo "Done"
