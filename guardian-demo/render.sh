#!/usr/bin/env bash
# Render the GUARDIAN deck to an mp4 — headless AND deterministic.
#   ./render.sh                    → full deck (scene 11 held HOLD_LAST s) → guardian-demo.mp4
#   ./render.sh sample.mp4 8       → first 8 virtual seconds only → sample.mp4
#
# How: the deck's ?capture=1 mode never reads the wall clock — the harness below
# steps the page one exact 1/FPS frame at a time over raw CDP
# (__capStep → await __capSettle → Page.captureScreenshot), writes
# frames/f_%05d.png, then ffmpeg assembles them. Chrome's virtual-time budget is
# NOT used (it dies at boot); the external clock is the whole trick.
# Needs: Chrome, node ≥22 (native WebSocket), python (http.server), ffmpeg.
set -u
FPS=30
W=1920
H=1080
CRF=18                 # x264 quality (18 ≈ visually lossless)
HOLD_LAST=15           # stop once scene 11 has held this many virtual seconds (15 = full 3:54 close)
PORT=8099              # http server for the deck (served, not file://)
DBG=9333               # chrome CDP port
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
BASE="C:/Users/chrsn/Desktop/SUI26/ONLINE2026/guardian-demo"
OUT="${1:-guardian-demo.mp4}"
MAXS="${2:-0}"         # >0 = stop after this many VIRTUAL seconds (sample mode)
T0="${3:-}"            # optional ?t= scene-clock offset (probe a cut: ./render.sh cut.mp4 5 12.5)

FRAMES="$BASE/frames"
mkdir -p "$FRAMES"; rm -f "$FRAMES"/f_*.png
PROFILE="$(mktemp -d)"; HARNESS="$PROFILE/cap.mjs"

# ── deck server (ignore failure if 8099 is already being served) ─────────────
(cd "$BASE" && python -m http.server "$PORT" >/dev/null 2>&1) & SRV=$!

# ── headless chrome, software GL, CDP open ───────────────────────────────────
"$CHROME" --headless=new --disable-gpu --use-angle=swiftshader --hide-scrollbars \
  --window-size="$W,$H" --remote-debugging-port="$DBG" --remote-allow-origins='*' \
  --user-data-dir="$PROFILE/prof" --no-first-run --mute-audio about:blank \
  >/dev/null 2>&1 & CHR=$!
cleanup(){ taskkill //F //T //PID $CHR >/dev/null 2>&1 || kill $CHR 2>/dev/null
           taskkill //F //T //PID $SRV >/dev/null 2>&1 || kill $SRV 2>/dev/null; }
trap cleanup EXIT

# ── the stepper (raw CDP, zero npm deps) ─────────────────────────────────────
cat >"$HARNESS" <<'EOF'
import fs from "node:fs";
const [DBG,PAGEURL,FRAMES,FPS,W,H,HOLD,MAXS] = [
  +process.env.DBG, process.env.PAGEURL, process.env.FRAMES, +process.env.FPS,
  +process.env.W, +process.env.H, +process.env.HOLD_LAST, +process.env.MAXS];
const LAST=11, sleep=ms=>new Promise(r=>setTimeout(r,ms));  // R27 — 11 scenes
let pg=null;
for(let i=0;i<150&&!pg;i++){                       // wait for CDP + a page target
  try{const l=await(await fetch(`http://127.0.0.1:${DBG}/json/list`)).json();
      pg=l.find(t=>t.type==="page")}catch(_){await sleep(200)}}
if(!pg)throw new Error("CDP never came up on :"+DBG);
const ws=new WebSocket(pg.webSocketDebuggerUrl);
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
let id=0;const pend=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);
  if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);
    m.error?p.rej(new Error(m.error.message)):p.res(m.result)}};
const send=(method,params={})=>new Promise((res,rej)=>{
  pend.set(++id,{res,rej});ws.send(JSON.stringify({id,method,params}))});
const evjs=async(expression,awaitPromise=false)=>{
  const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise});
  if(r.exceptionDetails)throw new Error("page: "+JSON.stringify(r.exceptionDetails.exception));
  return r.result.value};

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride",{width:W,height:H,deviceScaleFactor:1,mobile:false});
await send("Page.navigate",{url:PAGEURL});
for(let i=0;;i++){                                  // fonts + GLB + first avatar clip
  const v=await evjs("window.__capState?JSON.stringify(__capState()):''");
  if(v&&JSON.parse(v).ready)break;
  if(i>200)throw new Error("deck never reported ready (capture hooks missing?)");
  await sleep(150)}
await sleep(400);                                   // let font redraws land pre-step

const t0=Date.now();let n=0,s=null;
for(;;){
  s=JSON.parse(await evjs("JSON.stringify(__capStep())"));
  await evjs("__capSettle()",true);                 // avatar <video> seek done
  const shot=await send("Page.captureScreenshot",
    {format:"png",clip:{x:0,y:0,width:W,height:H,scale:1}});
  fs.writeFileSync(`${FRAMES}/f_${String(n).padStart(5,"0")}.png`,
    Buffer.from(shot.data,"base64"));
  n++;
  if(n%150===0){const el=(Date.now()-t0)/1000,r=n/el,
    left=MAXS>0?MAXS-s.t:236-s.t;
    console.log(`  f${n}  t=${s.t.toFixed(1)}s scene ${s.scene} tl=${s.tl.toFixed(1)}  `+
      `${r.toFixed(2)} fr/s wall  ~${Math.max(0,left*FPS/r/60).toFixed(1)} min left`)}
  if(MAXS>0&&s.t>=MAXS)break;
  if(s.scene===LAST&&s.tl>=HOLD)break}
console.log(`frames done: ${n} (${(n/FPS).toFixed(1)}s of video, ended scene ${s.scene} `+
  `tl=${s.tl.toFixed(1)}) in ${((Date.now()-t0)/60000).toFixed(1)} min wall`);
ws.close();process.exit(0);
EOF

URL="http://127.0.0.1:$PORT/index.html?auto=1&chrome=0&capture=1&fps=$FPS"
[ -n "$T0" ] && URL="$URL&t=$T0"
echo "render: $URL @${W}x${H} → $OUT (MAXS=${MAXS}s HOLD_LAST=${HOLD_LAST}s)"
DBG=$DBG PAGEURL="$URL" FRAMES="$FRAMES" FPS=$FPS W=$W H=$H \
  HOLD_LAST=$HOLD_LAST MAXS=$MAXS node "$HARNESS" || { echo "HARNESS FAILED"; exit 1; }

# ── assemble ─────────────────────────────────────────────────────────────────
ffmpeg -y -framerate "$FPS" -i "$FRAMES/f_%05d.png" -c:v libx264 -pix_fmt yuv420p \
  -crf "$CRF" -movflags +faststart "$BASE/$OUT" 2>&1 | tail -2
[ -f "$BASE/$OUT" ] && echo "ok  $OUT  $(du -k "$BASE/$OUT" | cut -f1)KB" || echo "FAILED: no $OUT"
