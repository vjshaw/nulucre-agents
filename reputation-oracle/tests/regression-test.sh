#!/bin/bash
set -u
BASE_URL="${BASE_URL:-http://localhost:3010}"
PASS=0
FAIL=0
FAILURES=()
WALLET_KNOWN="GCRUBFDANV52JP3URUJ7EZGPZKFEESBTW7T3FV2SJXZZGB6HDNRBWV24"
WALLET_INVALID="NOTAVALIDSTELLARADDRESS"
WALLET_EMPTY="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
check() {
  local description="$1"
  local condition="$2"
  if [ "$condition" = "true" ]; then
    echo "  PASS: $description"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $description"
    FAIL=$((FAIL+1))
    FAILURES+=("$description")
  fi
}
echo "=================================================="
echo "Nulucre Reputation Oracle — Regression Test Suite"
echo "Target: $BASE_URL"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=================================================="
echo ""
echo "[1] Health check"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" --max-time 10)
check "GET /health returns 200" "$([ "$HEALTH" = "200" ] && echo true || echo false)"
echo ""
echo "[2] Known wallet: $WALLET_KNOWN"
RESPONSE=$(curl -s "$BASE_URL/reputation/stellar/$WALLET_KNOWN" -H "x-payment: test" --max-time 15)
SCORE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('score','MISSING'))" 2>/dev/null)
STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','MISSING'))" 2>/dev/null)
SANCTIONS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('breakdown',{}).get('sanctionsCheck',{}).get('raw','MISSING'))" 2>/dev/null)
check "Response contains a numeric score" "$(echo "$SCORE" | grep -qE '^[0-9]+$' && echo true || echo false)"
check "Score is within valid range 0-100" "$([ "${SCORE:-999}" -ge 0 ] 2>/dev/null && [ "${SCORE:-999}" -le 100 ] 2>/dev/null && echo true || echo false)"
check "Status is one of the 5 valid tiers" "$(echo "$STATUS" | grep -qE '^(TRUSTED|VERIFIED|CAUTION|RISKY|BLACKLISTED)$' && echo true || echo false)"
check "Score and status tier are consistent" "$(python3 -c "
score = $SCORE if '$SCORE'.isdigit() else -1
status = '$STATUS'
tiers = [(80,100,'TRUSTED'),(60,79,'VERIFIED'),(40,59,'CAUTION'),(20,39,'RISKY'),(0,19,'BLACKLISTED')]
ok = any(lo <= score <= hi and status == name for lo,hi,name in tiers)
print('true' if ok else 'false')
" 2>/dev/null)"
check "Sanctions check ran and is not MISSING" "$([ "$SANCTIONS" != "MISSING" ] && [ -n "$SANCTIONS" ] && echo true || echo false)"
check "Sanctions result is a recognized value" "$(echo "$SANCTIONS" | grep -qE '^(CLEAR|SANCTIONED|UNCHECKED)$' && echo true || echo false)"
for SIGNAL in accountAge txVolume assetDiversity dexParticipation networkTrust claimableActivity sorobanUsage liquidityPools spamPenalty sanctionsCheck; do
  PRESENT=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if '$SIGNAL' in d.get('breakdown',{}) else 'false')" 2>/dev/null)
  check "Breakdown includes signal: $SIGNAL" "${PRESENT:-false}"
done
echo ""
echo "[3] Invalid wallet (malformed address)"
INVALID_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/reputation/stellar/$WALLET_INVALID" -H "x-payment: test" --max-time 15)
check "Malformed address returns 4xx not 200 or 5xx" "$([ "$INVALID_CODE" -ge 400 ] 2>/dev/null && [ "$INVALID_CODE" -lt 500 ] 2>/dev/null && echo true || echo false)"
echo ""
echo "[4] Empty/unused wallet (zero activity edge case)"
EMPTY_RESPONSE=$(curl -s "$BASE_URL/reputation/stellar/$WALLET_EMPTY" -H "x-payment: test" --max-time 15)
EMPTY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/reputation/stellar/$WALLET_EMPTY" -H "x-payment: test" --max-time 15)
EMPTY_SCORE=$(echo "$EMPTY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('score','MISSING'))" 2>/dev/null)
check "Empty wallet does not crash with 5xx" "$([ "$EMPTY_CODE" -lt 500 ] 2>/dev/null && echo true || echo false)"
check "Empty wallet score is not NaN" "$([ "$EMPTY_SCORE" != "NaN" ] && echo true || echo false)"
check "Empty wallet returns numeric score or clean 4xx" "$(echo "$EMPTY_SCORE" | grep -qE '^[0-9]+$' && echo true || ( [ "$EMPTY_CODE" -ge 400 ] && echo true ) || echo false)"
echo ""
echo "[5] Sanctions check determinism (two calls same wallet)"
SANCTIONS_2=$(curl -s "$BASE_URL/reputation/stellar/$WALLET_KNOWN" -H "x-payment: test" --max-time 15 | python3 -c "import sys,json; print(json.load(sys.stdin).get('breakdown',{}).get('sanctionsCheck',{}).get('raw','MISSING'))" 2>/dev/null)
check "Sanctions result identical across repeated calls" "$([ "$SANCTIONS" = "$SANCTIONS_2" ] && echo true || echo false)"
echo ""
echo "=================================================="
echo "RESULTS: $PASS passed, $FAIL failed"
echo "=================================================="
if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Failed checks:"
  for f in "${FAILURES[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "DO NOT save server.cjs backup until failures are resolved."
  exit 1
fi
echo ""
echo "All checks passed. Safe to run:"
echo "  cp ~/agents/reputation-oracle/server.js ~/agents/reputation-oracle/server.cjs"
exit 0
