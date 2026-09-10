#!/usr/bin/env bash
# Render one scene of the GUARDIAN deck to a PNG.
#   ./shot.sh <scene 1-11> <local-seconds into the scene> <out-name>
# The scene clock is fast-forwarded with ?t=SEC (an engine feature), and
# --virtual-time-budget settles fonts/reveals deterministically before capture.
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="C:/Users/chrsn/Desktop/SUI26/ONLINE2026/guardian-demo"
SCENE="${1:-1}"; SEC="${2:-6}"; OUT="${3:-.shots/_probe.png}"
mkdir -p "$BASE/.shots"
"$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --hide-scrollbars \
  --virtual-time-budget=6000 --window-size=1280,720 \
  --screenshot="$BASE/$OUT" "file:///$BASE/index.html?t=$SEC#$SCENE" 2>/dev/null
if [ -f "$BASE/$OUT" ]; then echo "ok  scene $SCENE @${SEC}s -> $OUT ($(du -k "$BASE/$OUT" | cut -f1)KB)"
else echo "FAILED scene $SCENE -> $OUT"; fi
