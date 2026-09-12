# Guardian Deck — Self-Improving Polish Loop

**Goal:** elevate `guardian-demo/index.html` from v1 to **Meld-caliber**. Kill every flat/"cheap"
asset (pasted 2D images used as scene backdrops) and replace with **real procedural 3D** in the
Three.js world. Iterate with Fable rounds; review each round against the bar below; stop at 23:00 IST.

## Quality bar (Meld-caliber)
1. **No flat image backdrops for 3D scenes.** Depth must be real geometry, not a pasted PNG. (The
   Ledger GLB in scene 5 and the scope HUD in scene 4 are fine; `datastorm.png` and `bridge.png` as
   full-bleed backdrops are the offenders.)
2. **Rich monochrome materials** — matte body / metallic edges / emissive accents; not flat lines.
3. **Layered lighting** — key + rim + fill; silhouettes carved out of pure black; subtle bloom/glow.
4. **Cinematic camera** — measured moves, parallax, micro-sway, impact kicks, hard cuts (Meld's
   "measured craft" — eased, deliberate, never floaty or random).
5. **Particle systems with real depth** — motion, trails, DOF-ish falloff.
6. **Cohesion** — one continuous world; every scene shares palette, grain, grade.
7. Keep it **100% offline, one file** (local assets only) and **factually exact** (never alter the
   verified addresses/txs/URL). Keep keyboard nav, presenter notes (N), rehearsal timer (T), shot.sh.

## Backlog (prioritized — top item is next)
- [x] **R1a** Scene 2 (DATA OVERLOAD): replace `datastorm.png` backdrop with a **procedural 3D storm**
  — hundreds of instanced 3D ticker/candlestick shards swirling in a real depth vortex around the
  half-buried vault; parallax + fog falloff. Flat png gone.
- [x] **R1b** Scene 8 (SAFE HARBOR): replace `bridge.png` backdrop with **procedural 3D** — turbulent
  Base shore (displaced geo) on the left, a real 3D bridge/stream of particles crossing to a 3D Arc
  **harbor ring** (USYC) on the right. Flat png gone.
- [x] **R1c** Global: lighting rig (key+rim+fill) + material upgrade on vault/cage/nodes/motes +
  subtle monochrome bloom/grade; camera easing toward Meld's measured feel.
- [x] **R2** Scene 4: market nodes as high-quality 3D emblems; miss-volley as 3D tracers; storm behind
  procedural (not png). Plus R1-residual fixes (S2 vault top, S1/S10 cube ramp, S8 launch flare).
- [x] **R3** Scene 6: motes → 3D particle flows with trails; safe-haven ring in 3D.
- [x] **R4** Scene 7: intruder + cage-reject richer 3D (dark strobing mass, white reject flare).
- [x] **R5** Scene 3 rebuilt as depthful 3D; cohesive film grade (real bloom pass) on all 10;
  S6/S2 residuals fixed; full 10-scene QA (final_s01…final_s10).
- [x] **R6** Director's pass on the R5 nits: S3 rail reads as wreckage (not goal-frames) + dive
  flare tamed ~40% (measured); S4 tokens beveled/bossed + raked by a near light (dimensional in
  stills); S5 Flex pendulum keeps the screen to the room; arrive+hold camera on all settle/read
  shots (Meld measured-motion); notes/timer audit.
- [x] **R11** Kill the last generic hero asset: the vault cube → a designed voxel SAFE (round
  door, dial + spoke wheel, hinges, rivets, keypad, glowing door seam — obox language, API
  unchanged); s2's spinning storm → a WALL OF DASHBOARDS that looms, strobes and shears off onto
  the agent (s4's storm kept, verified).
- [x] **R12** COLOR pass — strict monochrome → cool fintech. Semantic palette (CYAN=safe ·
  BLUE=AI/money-in-motion · RED=danger) on a #07090c base; the R5 composite's final luma
  collapse removed so color (and colored bloom) survives the grade.
- [x] **R13** CONTENT pass — s4 gains the measured graphscout benchmark panel (~98× fewer tokens,
  115×/81× rows, 3→1 round-trips, decision-ready verdict) as a post-lock beat; s5 becomes truly
  explanatory (mandate terms panel + explainer captions + cause→effect signing chain) and the
  agent stops glowing (flex-rig light blast diagnosed + albedo crush).
- [x] **R14** Scene INSERTION — new **scene 4 · VOICE** ("voice is the control layer") between NO
  SAFETY NET and THE SCOPE: the s2 dashboard wall returns as a ghost and collapses into the R9
  orb; ElevenLabs UI kit (orb · waveform · conversation) + Gemini Live framing; 11 scenes, 3:54,
  full renumber (sets/DURS/CAPS/SHOTS/layers/nav/notes/auto/render.sh).
- [ ] (optional, quote first) Higgsfield GLB hero props if a scene needs a real object — but prefer
  procedural (that's how Meld gets its look). Ledger GLB already done.

## Round log
- **v1** (prior): 10 scenes built, monochrome, real facts, 3D Ledger (scene 5) + live app shot
  (scene 9). Flat backdrops `datastorm.png` (s2) + `bridge.png` (s8) = the cheap assets to replace.
- **R1**: DONE — screenshot-verified per beat.
  - **S2** `datastorm.png` deleted from LAYERCFG; `makeStorm()` builds ~620 instanced shards in three
    populations (cone wall w/ open eye · ground surge disc · high camera-wrapping veil): candle bars,
    tick boxes, 3× canvas-texture ticker strips (real figures, redrawn on font load), additive
    near-field blur streaks (tangential stretch ∝ speed). Whirlpool kinematics, per-instance gray by
    radius + scene fog .030 for aerial depth. Vault half-buried (y .72, listing .09) on a lit ground
    plane. New 2-shot camera: dive over the rim into the bowl · low arc inside the swirl.
  - **S8** `bridge.png` deleted; churning flat-shaded Base sea (425-vert plane, 4-octave sine churn,
    facets carved by the rig) + shard echo + spray; ember-lit void; Arc harbor = calm disc + ripple
    rings + **USYC torus gate** (metal+emissive, brightens on settle) + BASE/USYC labels; 42-mote
    stream launches on the CCTP beat (ph 6.5) along a raised arc w/ faint additive tube. 3-shot
    camera: shore · crossing · settle on the ring.
  - **R1c** global white key/rim/fill + hemi (only Standard materials respond — graphic layer
    untouched); vault = matte-metal body + point-light gradient + edge frame + emissive corner studs +
    orbiting gimbal + behind-silhouette halo; scene-6 market pillars got solid monolith cores; Meld
    long-tail glow texture; per-scene fog table.
  - **Fixes en route**: stratified mote offsets (random clusters stacked into additive blowups);
    `fired()` now skips seek-sized ph jumps — under headless virtual-time fast-forward, load stalls
    made beats fire seconds late and spawn fresh bursts exactly at capture (the "white ball in the
    torus" ghost). Live playback unaffected.
  - **Verified**: S2 @tl 3/8/14, S8 @tl 3/10/16/22 + guards 1/3/4/5/6/7/9/10. Ledger GLB not washed
    out; scene-9 facts untouched; scene 7 reads cleaner than v1 (old double-blob flare tamed).
  - **Still imperfect**: S2 vault top face runs bright when seen from above (reads slab-white at the
    eye of shot A); S1 hero cube faces still fairly flat (point light helps, no toon ramp); S8 launch
    flare at the shore crest is hot for ~1s; scene 4 still pastes `datastorm.png` behind the scope
    (R2's job); ticker strips repeat 3 rows (unnoticeable in motion).

- **R2**: DONE — screenshot-verified per beat (volley · drop · sweep · lock · hit + all guards).
  - **S4** `datastorm.png` deleted from LAYERCFG (no scene pastes a PNG any more; #bg plumbing kept,
    permanently hidden). `makeStorm()` grew `{cx,cz,rK,yK,dim}` + `update(t,opK)` (defaults keep S2
    pixel-identical) and now rages BEHIND the market wall at cz −14, ×1.25 r / ×1.35 y, .6 dim, fog
    .016 — real parallax depth, dims live with the scope-drop. Market nodes → **3D emblems**: matte
    hex-slab token (Standard, R1c rig) + emissive metal torus rim + engraved inner hex on both faces
    + white edge frame + targeting ring + behind halo; tokens spin in-plane and wobble so light walks
    the facets; winner flares by contrast on lock/hit. Blind volley → **3D tracer fire**: hot glow
    head + additive comet streak + fat wake, axis-billboarded to the lens (makeBasis, never edge-on);
    7 rounds at .9s cadence (life .95s — one always mid-flight) scatter PAST the wall and die deep in
    the vortex with muzzle pops and far whiff-bursts. After lock: one slower aimed tracer (22.0–22.6),
    impact at 22.6 — 20-spark burst, double shock (additive ring-band + hairline), token flare, kick,
    flash, and a .7s incandescent afterglow along the shot line. Ranked list / graphscout / "THE
    GRAPH — SENSES" copy untouched; mid-field shards thinned (90→46, op .26) so the fire reads.
  - **Engine**: animate() reordered — camera is now evaluated and its matrices updated BEFORE sets,
    billboards and DOM layers. Kills the one-frame scope lag on hard cuts and the mis-locked-reticle
    artifact under headless virtual-time frame jumps (a real capture showed the reticle projected
    through the previous shot's camera).
  - **R1 residuals fixed**: (a) S2 vault top — makeVault body got an object-space shader ramp via
    onBeforeCompile (uniform-driven, one program for all sizes): dark base → lit crown + lateral
    drift, up-facing plane pulled to ~.42 and roughened to kill the specular sheet → no slab-white
    from above (verified S2 tl 3 + 8). (c) The same ramp makes the S1/S10 hero cube read dimensional
    (diagonal gradient per face). (b) S8 launch pop tamed: 8 sparks/1.4 spd → 4/1.0 — crest no longer
    blows out additively after the CCTP beat (verified tl 7.3).
  - **Verified**: S4 @tl 3.4/4.1/5.5 (volley+tracer) /10.7 (drop) /14 (sweep) /22.6 (lock) /22.7+22.9
    (hit: beam+shock) + guards 1/2(3,8)/3/5/6/7/8(10,22)/9/10. Scene-9 facts byte-identical.
  - **Still imperfect**: token faces rely on wobble+specular for life — a static frame can still read
    them as plain hexagons (engraving is subtle at rest); volley tracers compete with the storm's own
    additive streak layer in stills (unambiguous in motion); S2's near-field blur veil can park a big
    soft bar across a still frame (R1 behavior, reads as motion blur live); the impact shock band is
    slightly hot for ~.3s at its widest.

- **R3 (+R4)**: DONE — screenshot-verified per beat, both scenes in one round.
  - **Shared** `makeComets/cometAt/streamComets` — a fund particle is now a hot glow head + an
    additive streak stretched along the velocity + a fat dim wake, axis-billboarded with scene 4's
    tracer basis (long axis on the path, face to the lens — never edge-on). Per-particle shade
    staggers size/opacity/trail-length for DOF-ish depth. `makeMotes/streamMotes` kept (scene 8
    still uses them); scenes 6 & 7 switched to comets.
  - **S6** flow retimed to the ticker: SCOUT ping (one dim tracer tastes vault→Compound at 1.5),
    deploy launches ON the INVEST beat (3.3, launch burst), rotate ON ROTATE (7.35), retreat right
    after SIGNAL (12.6 — faster u, 1.8× trails, tighter jitter = urgency), then the stream circles
    down INSIDE the new gate. Safe haven rebuilt as real 3D with its own identity vs the USYC ring:
    matte-metal landing torus (Standard, R1c rig) hovering over a ground disc + ripple rings, an
    emissive inner band, two counter-precessing wire gyro rings, soft beam column. On DERISK it
    answers: pad/band flare, gyro spin-up kick, expanding ground ring, arrival burst + kick; the
    comet ring settles in orbit ABOVE the torus plane (raised after v1 hid it in ring glare).
    Ticker copy, tx chip 0x1555…6e9d and orb→happy-robot handoff (15.5–17.5 → av 16.8) untouched.
  - **S7** intruder is now a dark strobing MASS: black icosa core + 11 tumbling black tetra shards
    orbiting it, all silhouetted on a back-halo (renderOrder −1 — the opaque mass occludes the
    centre so a rim of glow carves it), edges + emissive flashing on asynchronous sharp sines;
    approach → grab (ghost key pulled INTO the mass) → lunge → fling → recoil → sulk orbit. Fling is
    a 16-comet stream out through the vault face; heads reach the wall at 8.45, impact 8.5: cage
    flare + shock rings expanding ON the wall plane (ring normal = impact normal) + a wire echo
    shell breathing off the cage + REVERT/onlyOwner pop; the stream snaps back with REVERSED tails
    (dir flips with the eased return). Cage got depth: inner counter-rotating shell, faint additive
    facet skin, vertex studs — all driven by the reject flare. Capability table verbatim.
  - **Iterated in-round**: reject shock ring was a frame-washing curtain seen edge-on from the
    punch-in camera (opacity .8, band .8–1) → thinned to .88–1 at .5 and smaller max scale; settle
    comets were invisible inside the flared torus → orbit raised above the ring plane + pad flare
    trimmed (.3→.24); intruder halo enlarged (2.6→3.1, base .13) so the mass reads at distance.
  - **Verified**: S6 @tl ≈6 (deploy) /9 (rotate) /14 (retreat — long tails streaking to the gate)
    /19 (settle ×2); S7 @tl ≈5.3 (grab, manual 5300ms budget) /7.5 (fling) /8.7 (reject ×2) /9.7
    (snap-back) /13 (sulk + full table) + guards 1/2/3/4(sweep,lock)/5/8(cross,ring)/9/10. Scene-9
    facts byte-identical (SLIDES untouched). Calibration: shot.sh tl ≈ SEC+6 (ticker rows used as
    the clock probe).
  - **Still imperfect**: S7 reject moment is intentionally hot for ~.3s (impact sprite + flash +
    ring — reads as the money shot, but a still at exactly 8.55 is near-white around the wall);
    the recoiling mass can overlap the capability table for ~1s in the punch-in shot; S6 scout-ping
    is subtle in a still; S6 shot-1 frames catch two clipped gyro-ring arcs of the off-frame haven
    at the left edge (reads as world continuity in motion); settled gate stays bright for the rest
    of the loop by design.

- **R5**: DONE — screenshot-verified per beat + a full 10-scene final QA sweep.
  - **S3 (NO SAFETY NET) rebuilt as real 3D** — the thin floating table is gone. The ledge is now a
    24×11×8 cliff body (MeshStandard, carved by the R1c rig + a dedicated graze point-light that rakes
    the brink and dies into the fog below, FOGD[2] .011→.016), with vertex-shaded sediment seams on
    both camera-facing faces (they fade with depth and distance from the lit corner — no orphan
    hairline ever floats on an unlit plane), rim cracks, a bright brink line, and **the guard rail
    that should have been** — metal posts + spans, torn open at z≈0 with two dangling stubs swinging
    faintly, exactly where the agent goes over. The node gained a spinning gimbal ring and a
    velocity-driven comet trail (scene-4 basis, streak-only); coins are now 18 metal Standard discs
    (per-coin tumble rates, fade-in/out) that glint in the graze light as they tumble; the void got 9
    embers + 4 huge dim mist glows so it reads as air, not vacuum. **New 3-shot camera**: track the
    sprint · hold the brink · then from INSIDE the void looking up at the rim — dive #2 (ph 15.3)
    bursts over the silhouette straight at the lens, and the ring of the approaching node peeks over
    the rim beforehand. Beat captions untouched.
  - **Cohesive film grade (all 10)** — a real post pass, not CSS: world renders to an MSAA(2)
    half-float target (band-free dark gradients), a luminance-thresholded quarter-res glow field is
    gaussian-blurred H+V and composited back at .5 with the exact sRGB encode three would have done
    at the canvas, a gentle .14 smoothstep S-curve, and a final luma collapse (pure monochrome is now
    guaranteed at the last write). Restrained on purpose — the deck's additive sprites still do the
    loud glowing; this pass breathes a halo around anything already hot (the s1/s10 cube studs, the
    REVERT pop, the USYC ring). WebGL2-gated with the old direct render as fallback. The film grain
    plate now jumps ~8×/s like print stock (t-driven — headless captures stay deterministic).
    First cut of the pass double-crushed the frame (rendering to a target skips three's sRGB canvas
    encode → composite displayed linear); fixed by moving the encode into the composite shader and
    thresholding in linear (.20–.80 knee).
  - **Residuals fixed**: S6's clipped gyro-ring arcs at the left frame edge in the opening shot —
    gyros AND the pad's lit rim/glow now sleep until the retreat nears (wake ramp ph 9.8–12.2,
    settle flare unchanged); verified clean at tl 6.5. S2/S4's near-field blur layer pulled back
    (op .3→.24, sMax 1.8→1.4, stretch .5→.4) — no more fat soft bar parked across a still; the eye
    and rim-dive shots verified unregressed.
  - **Verified**: S3 @tl 7 (dive+coins) / 10 (brink hold) / 13.3 (cut to void shot) / 15.5 (dive #2
    money shot); S1 tl 8; S2 tl 3 (rim) + 8 (eye); S4 tl 23 (lock+hit); S5 tl 6 (sig→cage) + 10;
    S6 tl 6.5 (clean edge) + 14 (retreat); S7 tl 10 (REVERT); S8 tl 10 (crossing) + 16 (settle);
    S9 tl 10; S10 tl 9.5. Scene-9 facts grepped byte-identical (6 addresses/txs ×1 each + URL);
    keyboard/N/T/R/F handler block untouched; the only `http://` in the file is the grain SVG's XML
    namespace inside a data URI — still 100 % offline.
  - **Honest residuals**: S3's snapped rail reads as two goal-frames from the low void angle (clear
    in motion, slightly diagrammatic in a still); the diving node at peak speed blooms to a hot white
    ball for ~.5s (reads as the agent burning out — deliberate, but it is bright); S5's Flex shows
    its edge mid-scene (tl≈10) due to the continuous spin — the chosen beats (entrance, signature)
    face the room; S7 reject flash at 8.55 remains intentionally hot (money shot, per R3/R4 note).

- **R6**: DONE — director's pass on the R5 residuals + a measured-motion (Meld-rhythm) camera pass.
  Screenshot-verified before/after on every touched beat (`.shots/R6_before_*` / `R6_after*_*` /
  `R6_final_*`) + full 10-scene guards (`R6_g_*`).
  - **S3 rail** — the "two goal-frames" read is gone. Each span was literally two posts + one
    crossbar; now it's wrecked railing: 5 irregular posts (varied heights, leans — the two flanking
    the tear bent hard into it, one at .5 rad), a mid rail under every top rail, spans that sag
    toward the break, and a dimmer alloy (0x484848, emissive .09→.055). Verified from the brink
    shot (tl 10) and the low void angle (tl 15.5) — reads as torn safety rail from both.
  - **S3 node flare** — measured, not eyeballed: the "hot white ball" at the dive peak was mostly
    the BARE SPHERE (closest to the lens at the brink, o=1, clipped white — 3 250 px over
    luma-240 in the tl 15.5 crop), not just the halo. Fix is two-part: halo+trail ease off with
    speed (×.6 at sprint speed), and a dive window (ph 6.25–6.6→1) that takes the sphere to .55
    and the halo down another ×.7. Clipped area 3 250 px → 24 px while the >180 glow field stays
    (≈3 400 px) — the node now reads white-hot with its gimbal ring visible THROUGH the glow
    instead of a blown disc. Mid-fall (tl 7) it reads as the agent burning down: dim, ringed, alive.
  - **S4 tokens** — dimensional in a frozen frame now: the slab is a beveled frustum (front face
    r·.68 vs back r·.8 — a ring of angled facets that catch light at rest), the flat engraved hex
    became a raised boss on both faces (own slant + white edge outline = two planes shading
    differently), and a near point light (10/14/2 at 2.5,4,3 — winner's side, falloff agrees with
    the ranking) puts a gradient on faces a directional lit perfectly evenly. Verified wide (tl 6),
    mid-sweep (tl 14) and through the lock reticle (tl 23) — no more plain hexagons.
  - **S5 Flex spin** — the continuous .15 rad/s spin (edge-on ≈ tl 12.8, BACK of the device facing
    the room through the mandate-terms beat, confirmed in befores at tl 10 + 13) replaced by a slow
    two-sine pendulum (−.35 ± ~.44 rad): the SCREEN faces the room at every readable beat and
    drifts front-and-center exactly for the ph≈5–6.6 signature pulse (tl 6 verified). Deliberate,
    non-repeating life; never edge-on.
  - **Measured-motion pass** — arrive+hold on every settle/read shot (the one floaty tell left was
    the camera creeping through reads): S1 hook (arrive 11.5/15), S3 brink hold (10.8/13), S4 lock
    push (26/30), S5 mandate drift (22.5/26), S6 haven settle (21.5/24), S7 pull-back (15.5/22),
    S8 ring settle (19.5/26), S10 close lift (11.5/15). Same double-eased curve re-windowed inside
    each shot's f — k lands at 1 and truly holds with only the micro-sway alive, so ranked rows,
    the capability table, the receipts and the wordmark all read on still frames. Cuts, dips, kicks
    and all beat timings untouched; nothing sped up.
  - **Notes/timer audit** — per-scene N text matches the on-screen beats (ticker verbs, SIGN ONCE,
    REVERT/onlyOwner, CCTP/USYC) and narration; DURS [15,18,18,30,26,24,22,26,18,15] = 3:32 cume
    unchanged and coherent with the notes' "three minutes" framing. No copy touched.
  - **Verified**: S3 tl 7 / 10 / 15.5; S4 tl 6 / 14 / 23; S5 tl 6 / 10 / 13; guards S1 8 · S2 8 ·
    S6 14 + 19 · S7 10 · S8 10 + 16 · S9 10 · S10 9.5. Facts grep: 6 addresses/txs + URL = 7 hits,
    byte-identical; only `http://` in the file is still the grain SVG namespace (100 % offline);
    keyboard/N/T/R/F block untouched; shot.sh works unchanged.
  - **Left alone (deliberate)**: S7's reject flash at 8.55 stays hot (money shot, per R3/R4);
    S2's veil can still park a soft streak in a worst-case still (R5 already pulled it back —
    further would kill the motion-blur read); the S3 ball at the brink is still the brightest
    thing in frame — it should be; it just no longer clips to a featureless disc.

- **R7**: DONE — video-ready pass: auto-advance + record chrome + transition audit. Additive only;
  no scene restaged, no fact touched (facts grep: 6 addresses/txs + URL = 7 hits byte-identical;
  the only `http://` is still the grain-SVG namespace — 100 % offline).
  - **`?auto=1` (auto-advance)** — the deck plays itself start→finish: each scene holds for its
    presenter-note DURation (DURS, 3:32 cume), then advances through the SAME `go()` dip/letterbox
    cut the arrow keys use (one timeline, no fork — 3 lines in animate() + a re-arm flag). Rests on
    scene 10, no loop. Manual keys compose: any jump/back re-arms, and the new scene holds its own
    DUR from entry. The fire lands .15s BEFORE `ph` wraps at DURS, so the outgoing scene never
    snaps back to its first frame in the gap the dip needs to cover (swap at +120 ms, black at
    ~70 ms) — the wrap-pop is real and was captured (`R7_exit_s4`: scope vanishes + caption
    restarts at ph 0 while the ranked rows persist); auto never shows it. In auto the rehearsal
    timer no longer auto-arms on first advance (a timer chip in the middle of every recorded
    frame); T still toggles it.
  - **`?chrome=0` (record chrome)** — hides ONLY the bottom controls hint; `#label` / `#brand` /
    progress dots stay (film look). `?auto=1&chrome=0` = the record URL. Notes panel documents
    both flags.
  - **Transition audit** — entry frames of all 10 scenes (`R7_enter_s*`, tl≈1.5) + exit frames at
    the auto-fire point (`R7_exit_s2b/s6b/s9b`, tl≈DUR−1): every scene opens with faded-in copy,
    eased camera from rest, and settled art; every handoff leaves from an arrive+hold read frame
    (R6's measured-motion pass already parked the camera there). No pop found in the first .4s of
    any scene; nothing needed smoothing beyond the wrap-guard above — cuts keep Meld's
    quick-but-clean rhythm, deck not slowed (still 3:32 + ~1s of cut overhead).
  - **Verified (screenshots)**: `R7_auto_mid` — plain `?auto=1`, scene 2 reached via the real auto
    cut and mid-hold; `R7_link_2to3` + `R7_link_9to10` — handoffs captured just after their auto
    fire (scene 3 / scene 10 with dip cleared, HUD alive); `R7_rest_10` — scene 10 at tl≈36 (2.4×
    its DUR) still resting, no loop-back; `R7_chrome0_s1` vs `R7_norm_s1` — hint gone / kept, top
    HUD identical; guards `R7_g_s5/s7/s8` + entry/exit set — no regression, scene-9 receipts
    byte-identical on screen (`R7_exit_s9b`).
  - **Headless notes (for future rounds)**: virtual-time budget is consumed during boot — the
    page clock leaps to ≈budget on the first rAF frame (that's why shot.sh's tl ≈ SEC+6), so a
    long budget can NOT ride through transitions; after expiry the page runs in real time and the
    screenshot races the dip (solid-black 4 KB PNGs = capture mid-dip, retry until >50 KB). The
    `?auto=1&t=<DUR−2>#<n>` trick makes any single handoff capturable.
  - **Left alone (deliberate)**: capture race means a scripted headless run can't film the full
    3:32 — the video is recorded live in a real browser (that's the point of `?auto=1`); scene
    art, camera, DURS, copy, keyboard block all untouched.

- **R8**: DONE — headless mp4 export: deterministic external-clock capture + render.sh + proven
  sample + final 10-scene QA. Additive only; facts grep 7/7 byte-identical (6 addresses/txs + URL,
  one hit each); live/auto playback verified unregressed (shot.sh still works, R8_smoke_s1).
  - **`?capture=1[&fps=30]`** — the R7 "capture race" is solved by never racing: with the flag the
    loop reads NO wall clock. `NOWMS()` serves a virtual clock advanced exactly 1000/fps per
    `window.__capStep()` call; `go()`'s dip/swap/letterbox timeouts run on it (`capTimeout`); CSS
    transitions/animations (dip, bars, prog dots, blink) are paused and SEEKED to it per step via
    `document.getAnimations()`; the avatar `<video>` no longer free-runs (wall speed ≈ 6× the
    stepped timeline) — it's scrubbed to `tl` each frame, `__capSettle()` awaits the seek. rAF is
    never armed; the harness steps → settles → screenshots. `__capState()` = `{scene,tl,t,ready}`
    stop probe. Without the flag `NOWMS`/`capTimeout` are pass-throughs — live playback untouched.
  - **`render.sh`** — zero-dependency harness: python http.server (:8099) + headless Chrome
    (swiftshader, CDP :9333) + an embedded raw-CDP node stepper (node ≥22 native WebSocket, no
    npm installs) + ffmpeg x264 crf18 yuv420p. Vars at top (FPS/W/H/CRF/HOLD_LAST). Full deck:
    `./render.sh` → guardian-demo.mp4 (stops when scene 10 has held HOLD_LAST s). Sample:
    `./render.sh sample.mp4 8` (first 8 virtual s). Cut probe: `./render.sh cut.mp4 5 12.5`
    (third arg = ?t offset).
  - **Proven, honestly** — `sample.mp4`: 241 frames / 8.03 s / 1920×1080@30 / 2.4 MB (2 497 kb/s).
    ffmpeg blackdetect+freezedetect clean; extracted t=4 and t=7.5 frames inspected — sharp,
    correctly timed (title→sub→chips fade-in on schedule), grade intact, NOT black, no smearing.
    Adjacent-frame PSNR 32.9 dB vs 26.3 dB at 0.5 s (real, even motion — no duplicated frames);
    avatar crop 49.7 dB adjacent vs 38.9 dB across 5 s (the clip IS scrubbing, not frozen).
    `cut.mp4` (5 s @ t=12.5) proves a scene cut under the stepped clock end-to-end: held s1 read
    frame (f69) → pure-black dip (f73) → letterboxed s2 entry (f80, bars still on at tl .23) →
    settled s2 with caption + tv_thinking swapped in and dot 2 lit (f150). All frame-exact.
  - **Cost on this rig** (swiftshader software GL, 1080p): 1.23 fr/s wall on scene 1, 1.05 fr/s in
    the s2 storm → the full 3:32 (~6 360 frames) ≈ **1.5–1.75 h**. Practical but not quick — run
    it unattended; determinism means CPU load can't change a single pixel of the result.
  - **Final QA** (`.shots/QA_s01…s10`, same beats as the R5/R6 tables): 10/10 pass — s1 hook read,
    s2 eye-of-storm + tickers, s3 void shot (wrecked rail + ringed node + coins over the rim),
    s4 LOCKED — COMPOUND ★ 82 + ranked rows, s5 SIGN ONCE + Flex screen to the room, s6 retreat
    streaks into the gate + tx chip, s7 REVERT/onlyOwner + capability table verbatim, s8 CCTP arc
    + USYC ring + 0x67ef…D808/0xbd3d…932d rows, s9 all six receipts + URL legible, s10 wordmark +
    three quiet lights. No regressions found.
  - **Notes**: notes panel documents the flag; frames/ is transient (wiped per run). Residual
    randomness is per-BOOT only (procedural scatter seeds, same as live) — within a run every
    frame is a pure function of frame index.

- **R9**: DONE — the pre-rendered clay-robot VIDEO avatar is replaced by a **procedural voxel
  character CAST** (the talos/meld obox rig, ported), which also fixes the reported lag (the
  blended fullscreen videos were the cost). Facts grep 7/7 byte-identical; `tv_` refs 0.
  - **The rig** — `obox` (outlined voxel box: toon-shaded 5-step gradient body + BackSide ink
    shell) is the one primitive; `class Chr` builds three characters and runs the talos Bot
    locomotion pattern (spring look/turn, speed-driven gait + hop, teleport guard) plus a
    per-frame act API consumed by `update(t,dt)`:
    **`char.play('idle'|'wave'|'present'|'presentR'|'point'|'overwhelmed'|'run'|'fall'|'aim'|
    'protect'|'grab'|'cheer')`** — pose targets blend in ~.3s, so `?t` seeks converge
    deterministically. `setPos(x,z)` / `lookTo(yaw)` / `groundY` / `rotZ` (scene tumble) stage it.
    Monochrome only (talos is colored — Guardian is NOT): white/gray voxels, near-black ink
    outlines; the INTRUDER inverts the trick (near-black cloth, LIGHTER `0x3c3c3c` rims).
    Characters ground with the deck's ring language (a floor circle that fades on lift), not a
    paint shadow — this world is black.
  - **The cast** — GUARDIAN: TV-head host (glowing eyes + blink, canvas smile, heart emblem with
    soft pulse, antenna with lit tip, dial knobs, chunky white body). AGENT: thinner mid-gray
    figure, single scanning visor-eye (slow sweep idle · frantic when overwhelmed · locked on
    aim), dorsal fin. INTRUDER: hunched (resting spine lean .38), hooded (hood+brim+peak over a
    true-black basic-material face void), jagged (shoulder/back spike diamonds, claw hands, torn
    skirt — no feet), pale eye slits strobing with its shard swarm.
  - **Clay videos dropped entirely** — `#avatar` CSS + `<video>` element + all 7
    `assets/avatars/tv_*.mp4` refs + LAYERCFG `av:` entries + capture scrub/settle plumbing
    removed (`__capSettle` now resolves immediately — render.sh contract intact, verified
    `?capture=1` boots clean). The mp4 files stay on disk unreferenced. Remaining `mix-blend`
    hits (4) are the kept scope/ledger/bg layers, not the avatar.
  - **Perf pass (the lag fix)** — (a) the two composited fullscreen videos are gone; (b) only the
    ACTIVE scene updates per frame (neighbours used to tick their storm/comet/sea instanced
    updates invisibly — the swap frame still updates the incoming set before render, so no stale
    pose ever shows); (c) `setPixelRatio` capped 2 → **1.5** (~44% fewer shaded pixels through
    the whole bloom chain on 2× panels); (d) bloom confirmed lean: one scene render into the MSAA
    target + threshold/blur at quarter-res + one composite — kept as-is.
  - **Enacted (scenes 1–3)** — s1: GUARDIAN greets (wave ≤4.6s) then sweeps a hand to the vault
    (present). s2: the AGENT staggers **inside the storm's eye** — arms flailing, visor-eye
    pinballing, spun by gusts — while the GUARDIAN watches from the rim and reaches out on the
    "NO HUMAN CAN WATCH" beat. s3: the AGENT itself sprints the shelf (gait + comet trail),
    pitches over the brink (fall pose + scene-driven tumble through the wrecked rail), and drops
    into the void with the coins; the GUARDIAN reaches — too late (ph 5.6–8.6, each loop).
  - **Hosted (scenes 4–10, full acting next round)** — GUARDIAN placed and framed in every scene:
    s4 frame-left, points on the lock (ph>21); s5 between cage and Flex, presents the signing
    (4.5–8); s6 braces (protect 12.2–16.8) then cheers the safe retreat (16.8–20.5); s7 protect
    stance at the cage through the fling (6–10) — and the INTRUDER already acts here: the shard
    mass's icosahedron core is replaced by the hooded thief riding the same choreography
    (stalk → grab → hurl(aim) → recoil(overwhelmed) → sulk), swarm/strobe/halo kept, orbit radii
    widened to wrap the figure; s8 on the harbor disc presenting the USYC ring (presentR >13);
    s9 standing witness left of the receipts; s10 waves beside the wordmark (tl>7).
  - **QA rig** — `?cast=guardian|agent|intruder[&pose=NAME][&yaw=DEG]` renders one character on a
    lone turntable stage (HUD hidden, grade kept) — the screenshot rig that caught both R9 bugs:
    the intruder's face read inverted (gray plate/dark slits → fixed with a true-black unlit face
    void + brighter slits) and the arm z-sign convention was mirrored (cheer/protect crossed
    inward over the chest → verified out-spread on the rig, then re-verified in s1/s5/s6/s7/s8).
  - **Verified (screenshots, .shots/)** — cast: `R9_cast_guardian(_wave)`, `R9_cast_agent`,
    `R9_cast_intruder2`, `R9_pose2_cheer/protect/wave/present`. Scenes: `R9_s1_final` (present at
    the vault), `R9_s2b`+`R9_s2_probe` (agent drowning center-frame, host reach), `R9_s3_sprint`
    (mid-leap over the brink) + `R9_s3_void` (head-first tumble past the rail, coins raining),
    `R9_s4_lock`, `R9_s5_final`, `R9_s6_final` (V-arm cheer), `R9_s7_stalk/fling/final`,
    `R9_s8_final`, `R9_s9_proof`, `R9_s10_close` (wave under the wordmark), `R9_capture_smoke`.
    Live/auto/nav/notes/timer untouched; shot.sh drove every scene capture above.

- **R10**: DONE — scenes 4–10 fully ENACTED by the R9 cast (talos-style beat acting on the
  EXISTING scene clocks — no timeline forks, no engine changes, staging code only). Facts grep
  7/7 byte-identical; auto/record/nav/notes/timer untouched; DURS unchanged; ?capture=1 contract
  intact (this round's own verification ran through it).
  - **S4 THE SCOPE** — the abstract shooter sphere is gone: the AGENT itself fires the blind
    volley from (−5.2, 2.4) — `point` pose, WHIPPING its facing to each round's bearing
    (SH[bi].end drives lookTo, .35s lead) — melts down when everything misses (`overwhelmed`
    6.9–9.6, turned to the room after a capture showed the flail self-occluding from behind),
    calms as the scope drops, then `aim`s and HOLDS 10.9→27.5, facing wherever the reticle reads
    (centre→moon→aave→comp), visor locked. Tracer origin `from` moved to its arm
    (−4.85, 1.08, 2.05) + a muzzle burst/kick on the aimed shot (22.0). GUARDIAN crossed the
    stage (−5.5,4.2 → 3.9,4.6 — the old mark sat ON the new OTS lane, and at 3.2 it clipped the
    COMPOUND label), watches at 3/4 (−1.1 — a dead-on back-shot read as a white slab through the
    13s sweep), whips to `point` at Compound on lock. **Shot 3 rebuilt as an over-the-shoulder
    lock push** (pos −12.4→−11.2, fov 34): aiming agent frame-left, Compound + reticle right of
    centre, host pointing frame-right — the aimed tracer crosses the frame mid-flight at 22.2.
    Loser labels now dim to .14 at lock (they bled through the ranked rows in the OTS frame).
  - **S5 THE MANDATE** — the AGENT materializes WITH its scoped key on the key beat (same
    eOutBack, 8.6–9.4; pivot hidden before), stands INSIDE the cage at (−2.6, 1.5) facing the
    vault, `present`s it from ph 11; a second tether links the key to its chest ("the agent
    lives inside the boundary" — the shot-3 read frame shows host outside / agent inside the
    wire). Host: `presentR` to the Flex (3–5.2) → `present` follows the signature to the cage
    (5.2–8.2) → WALKS to park left of the boundary at 10.3–11.9, landing on the ph-12 punch-in
    cut. Two iterations screenshot-caught: at its old mark it loomed over the Flex GLB in the
    punch-in; the first walk timing (8.4) upstaged the materialization beat.
  - **S6 AUTONOMOUS** — the AGENT drives the flow from (.7, 2.3): `point` at Compound through
    SCOUT + INVEST (under the comet arc), re-aims at Aave on ROTATE (7.35), whips to the haven
    in `protect` on SIGNAL (12.5), RUNS the retreat home 14.3–16.9 alongside the stream (the
    path bows +1.3 z mid-run — a straight line clipped through the cage shell, capture-caught),
    then `present`s the gate as the comets settle. Host protect (12.2–16.8) / cheer (16.8–20.5)
    kept from R9 — the settle frame is agent-presents-gate + host-cheers.
  - **S7 CAN'T BE ROBBED** — intruder choreography kept verbatim (stalk→grab→hurl→recoil→sulk);
    the GUARDIAN now SEES the thief coming: strides from (−3, 2.6) to (0.55, 2.75) at 2.4–4.6
    and PLANTS in `protect` 4.9–10.6 between intruder and vault — in the punch-in it stands
    silhouetted against the REVERT flare with the fling stream dying at its shoulder; the
    capability table stays verbatim and clear.
  - **S8 SAFE HARBOR** — host beckons the crossing home (`wave` toward the void, 6.5–13) then
    `presentR`s the ring (R9 beat kept); the AGENT rides the CCTP stream (8.2–12.4 — run-gait
    along the flight line reads as sprinting the light-bridge), swoops onto the disc and lands
    BESIDE the host at (4.15, 1.9) — the first landing (4.5, .2) stacked it behind the host on
    the settle framing — and `cheer`s on the settle flare (13).
  - **S9 PROOF** — calm witness: host shifted (−3.9,2.1 → −4.35,1.9) and turned toward the
    panel (.5) so the full silhouette clears the receipts panel's left edge (the idle arm was
    dipping behind it). All six receipts + URL verified legible with the host in frame.
  - **S10 CLOSE** — the AGENT joins at (−2.1, 2.6): host `wave`s at tl 7 (kept), agent `cheer`s
    at 8.4 — the pair flanks the wordmark between the trinity lights; nothing clips the type.
  - **Verification rig (the round's real find)** — shot.sh's virtual-time budget is consumed at
    BOOT (R7 note), so only a handful of real frames run before the screenshot: the cast's
    face-spring (~1 s to settle) never converges, and early captures showed phantom mis-facing
    and diluted poses that DO NOT exist in live playback (poses blend in .3 s, faces don't).
    All R10 acting verification therefore ran through the R8 ?capture=1 stepper via a scratch
    probe harness (navigate `?capture=1&fps=30&t=BEAT−2.5#N`, step 75 exact frames, screenshot
    — deterministic, spring-converged, same pixels as live). shot.sh remains fine for
    non-acting guards; POLISH's tl≈SEC+6 calibration still holds but add ~1–2 s of jitter.
  - **Verified (probes, .shots/)** — S4: `F4_volley` (whip-fire + caption), `P4_overwhelmed2`
    (flail to the room), `P4_aimhold3` (hold, label clear), `F4_lock` (OTS: tracer mid-flight,
    rows, host points), `F4_hit` (impact bloom). S5: `F5_materialize` (agent+key scale-in,
    host parked), `P5_inside`, `P5_read2` (inside-the-boundary read). S6: `P6_deploy`,
    `P6_signal` (host protect + DEPEG), `P6_run2` (bowed sprint), `P6_settle`. S7: `P7_walk` /
    `P7_plant` / `P7_fling` / `P7_reject` (protect silhouette vs REVERT flare) / `P7_sulk`.
    S8: `P8_ride` (light-bridge run + host beckon), `F8_ridelate` (swoop), `F8_settle`
    (side-by-side cheer + presentR). S9: `P9_proof`. S10: `P10_wave` / `P10_cheer`.
    Guards `F1_guard` / `F2_guard` / `F3_guard` — scenes 1–3 pixel-story identical to R9.
  - **Honest residuals**: the S6 sprint reads slightly puppet-like in a frozen frame (mid-bound
    gait + torso pitch — fine in motion; same rig R9 shipped for the s3 sprint); the S4
    whip-fire's arm only roughly tracks each round's bearing (the muzzle is a fixed point —
    unnoticeable at speed); S8's beckon-wave arm can overlap the ring's left arc for a beat;
    scene-loop wraps still teleport the cast to their opening marks (pre-existing deck
    convention, loops only wrap past a scene's DUR).

- **R11**: DONE — the two intentional-asset upgrades: the generic vault cube is now a **proper
  voxel SAFE**, and scene 2's spinning storm is replaced by a **WALL OF DASHBOARDS**. All acting/
  timed beats screenshot-verified through the R8 `?capture=1` stepper (a scratch CDP batch probe —
  R10's method: navigate `?capture=1&fps=30&t=BEAT−2.5#N`, step 75 exact frames, screenshot;
  13-beat batch `P11_*`) + shot.sh sweeps (`R11_*`). Facts grep 7/7 byte-identical (6 addresses/
  txs + URL, one hit each); the only `http://` is still the grain-SVG namespace; nav/notes/timer/
  `?auto`/`?chrome`/`?capture`/render.sh contracts untouched (`R11_auto_smoke`, and the probe
  batch itself runs the capture hooks).
  - **The SAFE (makeVault rebuilt)** — built in the cast's own language (obox toon voxel + ink
    shell, plus a cylZ round-voxel variant): a banded monolith on a plinth with a crown cap and
    wrap grooves, a thick ROUND vault door proud of the front plate — 3-spoke handle wheel around
    a ticking combination-dial hub (canvas tick face) — a rivet ring, three hinge blocks + pin
    bar down the right jamb, corner bolts on the plate, a keypad chip (canvas button grid) with a
    breathing status lamp, and a glowing SEAM in the door gap. Return API / footprint / anchor
    unchanged (`grp/outer/inner/core/body/update`) so the cage (5/6/7), the comet flows (6), the
    REVERT flare (7) and every camera line up untouched; the through-line language (white wire
    frame, faint gimbal, corner studs, behind-halo) kept, dimmed to op ×.5/×.2 so it frames
    rather than scaffolds. The full-circle spin is gone — a slow pendulum keeps the DOOR to the
    room at every beat (the R6 Flex rule). `update(t,k,seam)` grew the seam arg: the door gap
    flares when the mandate lands (s5, win 6.7), burns through the depeg window (s6, 12.3→settle
    relax), and flares with the REVERT (s7, same win as the cage). Subtle life: the dial wanders,
    the wheel breathes, the lamp blinks. The R9 QA rig grew **`?cast=vault`** (turntable +
    seam-demo every 6s) — the beauty shot is `R11_vault_qa`.
  - **S2 WALL OF DASHBOARDS (makeDashWall)** — the storm read as weather; the copy says
    dashboards. ~112 mini monochrome dashboards (12 shared 192×124 canvas faces — candlestick or
    line chart + live-looking figure + %, registered for font-redraw) on a curved three-shell
    array (r 8.8/11.6/14.6, upper rows overhanging inward, FOGD[1] .030→.024 so the far shell
    drowns instead of vanishing — real depth, not a plane). Beat-locked to the kept captions:
    panels POP IN through A THOUSAND PROTOCOLS (≈42% pre-lit, the rest stagger in .7–5.1), the
    wall CREEPS inward/down and strobe-blackouts + refresh-flashes ramp through RATES MOVE EVERY
    BLOCK, and on NO HUMAN CAN WATCH the 14-panel section straight over the agent shudders,
    SHEARS OFF and cascades — tip-over ease-in, per-panel tumble, .14s stagger, first six land
    with bursts + two camera kicks — leaving a visible hole in the wall and a strewn, flickering
    pile around the AGENT (`overwhelmed` beneath it; moved to (2.5,2.7) — at its old mark it hid
    behind the safe from the new shot-B lane). The half-buried safe stays in the eye,
    half-involved (its seam frets ×.35 during the fall); the host reaches on >10.5 (beat kept)
    and was pulled back a step (−3.6,3.4 → −4.4,3.9 — the old mark blew a clipped white torso
    across shot B mid-move, capture-caught). New two-shot camera: dive down the wall face (look
    raised to the wall) · low arrive+hold under the overhang, the look FALLING with the cascade
    to the buried agent. All randomness is build-time rng(61); runtime is a pure function of
    (t,ph) — capture-deterministic. **makeStorm untouched — scene 4 verified still raging dimmed
    behind the scope** (`P11_s4_sweep` / `P11_s4_lock`).
  - **Verified (screenshots, .shots/)** — safe: `R11_vault_qa` (cast-rig beauty), `P11_s1_present`
    (hero present, door 3/4 to the room), `P11_s5_seam` (door gap answers the mandate) +
    `P11_s5_punch` (full door detail inside the cage, key + agent), `P11_s6_depeg` (seam burning,
    host protect, retreat arc) + `P11_s6_settle` (relaxed, host cheer), `P11_s7_revert` (protect
    silhouette vs the flare, safe reads through the blowout) + `P11_s7_table` (table verbatim),
    `P11_s10_close`, s2 rim (`R11_s2_*`). Wall: `P11_s2_grow` 4.5 / `P11_s2_strobe` 8.5 /
    `P11_s2_fall2` 12.4 / `P11_s2_buried3` 14.6 / `P11_s2_settle` 16.8 + entry. Guards:
    `P11_s3_guard` void dive, `P11_s4_sweep`+`P11_s4_lock` (storm alive, OTS intact),
    `P11_s8_guard` ring settle, `P11_s9_guard` all six receipts + URL legible.
  - **Honest residuals**: falling panels can clip each other and the safe's crown mid-tumble
    (reads as clatter in motion; visible in a frozen frame); the wall's lowest row floats ~1u
    above the ground (reads as hung monitors — a black band can open under the wall early in the
    dive); 192px chart faces go soft when a near panel fills a large part of frame (CRT-soup
    read, fine in motion); the fallen pile dies to op ≈.44 by design — the agent stands among
    the wreckage rather than literally pinned; at s10's small scale (s 1.3, k .55) the dial
    ticks blur to a disc, though door ring + wheel still carry the safe read; s2 is now ~112
    transparent draw calls vs the storm's 8 instanced meshes — stepper pacing felt comparable,
    full render.sh cost unmeasured this round.

- **R12**: DONE — the COLOR pass: the deck leaves strict monochrome for a **semantic cool-fintech
  palette** on a deep near-black **#07090c** base — color carries MEANING, never decoration:
  **CYAN #35E0FF** = safe/good/on · **ELECTRIC BLUE #4C6FFF** = the AI + money in motion ·
  **HOT RED #FF4D4D** = danger. The R5 composite shader's **final luma collapse is REMOVED**
  (`vec4(vec3(luma))` → `vec4(c)`) — bloom, vignette, grain, the sRGB encode and the S-curve are
  all kept, so hot accents now bloom in their own hue. Every beat verified through the R8
  `?capture=1` stepper (19-beat CDP batch, `.shots/R12_*`, 75 exact frames of run-in each) plus
  shot.sh live-path guards (`R12_live_s1/s6` — the non-capture rAF path renders identically).
  Facts grep 7/7 byte-identical (6 addresses/txs + URL, one hit each — `R12_s9_proof` shows all
  six on screen); the only `http://` is still the grain-SVG namespace (100 % offline, file://
  verified by shot.sh); nav / notes / timer / `?auto` / `?chrome` / `?capture` / render.sh /
  `?cast` contracts untouched. One self-contained file; no restaging — staging code untouched.
  - **Machinery** — palette consts + `C_*` Color scratch; `makeVault.update` grew a 4th arg
    (`danger` lerps the door seam + its glow cyan→red — mandate=cyan, danger=red); the lamp,
    seam and behind-halo of the safe are cyan at rest; `burst()` grew a `col` arg (pool sparks
    retint per spawn); `tintComets()` retints a comet set live; `labelBoard` grew
    `subCol`/`starCol`; `popBoard` grew `col`/`subCol` (REVERT is red); a per-scene flash color
    table (red on depeg/REVERT, cyan-white on lock/mandate/arrival); the global rim light runs
    whisper-cool (0xaac3ff); the cast keeps white/gray bodies but wears its accent — GUARDIAN
    cyan eyes/heart/antenna-tip, AGENT blue visor-eye, INTRUDER red slits; DOM chrome: LIVE
    chips + label-dot + prog… cyan, ranked win-row cyan vs watch-row red, ticker rows classed
    `flow`(blue)/`warn`(red)/`safe`(cyan), capability ✓=cyan / ✕=red, captions colored by
    meaning, and the scope svg remapped white→cyan with a CSS
    brightness/sepia/hue-rotate chain (black bg stays black under the screen blend).
  - **Per-scene** (all screenshot-verified):
    **s1** host presents the safe — cyan eyes/heart/tip, cyan seam + status lamp + aura, cyan
    LIVE chip; still reads sleek dark (`R12_s1_present`). **s2** the dashboard wall becomes a
    true trading wall — candles and %s up=cyan-teal / down=muted red; the safe's seam frets RED
    under the collapsing section (`R12_s2_fall`, `R12_s2_buried`). **s3** the void is where
    money dies: red embers + red deep mist, the sprinting agent trails BLUE, "BUT NO BRAKES"
    red (`R12_s3_void`). **s4** the scope ring is cyan, the blind volley pale-blue, the aimed
    tracer full blue; Moonwell = red ring/rim/sub + red WATCH readout, Aave/Compound cyan; the
    LOCK is a cyan verdict — reticle, readout, caption, win-row, star, and the hit blooms CYAN
    off Compound (`R12_s4_volley/sweep/lock`). **s5** the mandate is cyan — signature pulse,
    cage snap + burst, door-seam flare, SIGN ONCE; the scoped key glows agent-blue
    (`R12_s5_seam/key`). **s6** the stream tells the story in hue: BLUE deploy/rotate → RED
    evacuation sprint (with red ripple, red seam, red SIGNAL row + DEPEG caption) → CYAN orbit
    settling into the all-cyan haven gate; pillars cyan/cyan/red (`R12_s6_deploy/depeg/
    retreat/settle` — the depeg and retreat frames are the round's best: red danger flowing
    into cyan safety). **s7** the whole reject is red — fling stream, impact, wall shocks,
    wire echo, REVERT/onlyOwner board, the cage flushing cyan-white→red on the flare, the
    thief's slits and shard rims; the stolen ghost-key red vs the real key blue; table verbatim
    with cyan checks and a red ✕ on send-anywhere (`R12_s7_reject/table`). **s8** blue CCTP
    motes + tube arc out of the red-embered void into the CYAN USYC torus; BASE sub red, SAFE
    HARBOR sub cyan; cyan arrival flare, cyan SETTLED caption (`R12_s8_cross/settle`). **s9**
    receipts byte-identical and fully legible; only the LIVE chips wear cyan
    (`R12_s9_proof`). **s10** quiet close — the three trinity lights stay neutral white; the
    pair flanks the wordmark wearing only their face accents (`R12_s10_close`).
  - **Honest residuals**: the s7 reject still at ~8.7 is now a full RED wash (flash + impact +
    rings + colored bloom) — deliberate money-shot heat like the old white one, but a frozen
    frame at peak is very red (~1s live); s3's dive flare still swallows the blue trail at the
    brink — the blue reads mid-sprint only; the resting Moonwell token reads brown-red (gray
    metal under red emissive) and is unambiguous only beside the cyan pair; the guardian's
    deterministic blink landed eyes-half-shut in two s6 stills (a .13s blink live); the scope's
    cyan comes from an approximate CSS hue-remap — verified on screen, but it tints the whole
    svg uniformly; `burst()` sparks share one pool, so a red and a cyan burst inside the same
    ~1s could recolor a few airborne sparks (no beat pair actually overlaps; never seen in
    probes).

- **R13**: DONE — three targeted CONTENT upgrades on the R12 color state (additive only; no scene
  restaged, engine/auto/record/nav/notes/timer/`?capture`/render.sh/shot.sh/`?cast` untouched).
  Verified through the R8 `?capture=1` stepper (scratchpad CDP batch probe, R10's method: navigate
  `?capture=1&fps=30&t=BEAT−2.5#N`, step 75 exact frames, screenshot — 27 probes, `.shots/R13_*`)
  plus shot.sh live-path smokes (`R13_live_s4/s5` — the non-capture rAF path renders identically).
  Facts grep 7/7 byte-identical (6 addresses/txs + URL, one hit each); the only `http://` is still
  the grain-SVG namespace (100 % offline); benchmark figures grepped exact.
  - **S4 — the graphscout BENCHMARK panel (why the scope beats blind querying)** — a cool-fintech
    stats callout (`.gsx`: JetBrains Mono, tabular-nums, cyan-keyed rows on rgba-black) lands
    lower-right as a BEAT after the lock (header+headline 23.2, rows stagger to 25.2, footer tag
    25.7) — the lock stays hero (verified clean at tl 23.0: no panel, reticle + ranked rows + hit
    bloom untouched). Content is the measured truth from BENCHMARK.md, never altered: headline
    **~98× fewer tokens the model must read** (graphscout vs raw Subgraph MCP), rows **AAVE
    23,400 → 203 tokens · 115× fewer**, **COMPOUND 16,400 → 204 tokens · 81× fewer**,
    **ROUND-TRIPS 3 → 1 per decision**, **RETURNS score + verdict + evidence — decision-ready,
    not raw rows**, footer "measured live · The Graph · graphscout". The ×-figures COUNT UP
    (new `[data-cnt]/[data-cd]` rig in renderSlide/stepPhase — tl-driven, one-shot, eOutCubic
    over .9 s, capture-deterministic). The panel landed exactly on the host's OTS mark, so the
    host now STEPS forward-left on the stats beat (23→24.4, (3.9,4.6)→(2.15,1.35)) and parks
    inside the scope's outer rings, still pointing the lock home — agent left · Compound center ·
    host right now bracket the target and the panel sits on clean storm (iterated ×3: first two
    marks left the head clipping the panel header, capture-caught).
  - **S5 — THE MANDATE made explanatory** — the terms moved off the one-line caption into a
    readable `.mandate` panel, lower-left (header "THE MANDATE — SIGNED ON LEDGER FLEX ·
    ON-CHAIN" 7.8 — right after the boundary snaps — rows 8.4/9.2/10.0/10.8): **INVEST ≤ CAP ·
    allowlisted venues only ✓ · PROTECT → SAFE HAVEN · any time, instantly ✓ · EXPIRES — the
    mandate dies unless renewed ✓ · NOTHING ELSE — send-anywhere → onlyOwner ✕** (echoes the s7
    table), plus two footer lines: "**one signature → autonomous within bounds**" (cyan) and
    "Ledger = root of trust · the agent's hot key is disposable & revocable". Captions retimed to
    carry the EXPLANATION (SIGN ONCE → ONE SIGNATURE → AUTONOMOUS WITHIN BOUNDS → FACE ID + FLEX
    → LEDGER = ROOT OF TRUST · THE HOT KEY IS DISPOSABLE); the h1 sub + presenter note now say
    expiry + disposable-key + "your Ledger key never leaves the device". Signing chain given
    cause→effect: the signature pulse leaves the (real, kept) Ledger GLB with a 5-sprite comet
    TAIL along its flight line; on arrival a cyan ground shock ring STAMPS the boundary under the
    snapping cage (6.7→7.9, r 1→~5.4); six EBLUE motes spiral in and collapse into the key point
    (7.9–8.6) so the scoped key reads as MINTED by the mandate before its eOutBack scale-in.
    Wrapping rows tightened in-round (EXPIRES/NOTHING-ELSE were 2-line, capture-caught).
  - **S3 fix — the agent no longer glows in s5** — root cause found, not guessed: scene 5 is the
    ONLY set the Flex GLB's lighting rig reaches (key 2.4 + rim 2.6 + rim2 1.2 + ambient .3 are
    camera-parented and wake with `flex3d.visible`; directionals are global), so the toon cast's
    5-step gradient slammed to its white top band — the agent read as a light source. Fix scoped
    to the agent in this set: albedo crush ×.4 on its toon voxel materials (per-instance, outline/
    eye untouched) + visor eyeGlow .4→.22 — it now reads as a calm, dim, tethered figure inside
    the cage with the blue visor as the only accent (verified at tl 10.6/13.5/21.0; host left as
    the intended bright through-line).
  - **Verified (screenshots, .shots/)** — s4: `R13_s4_lock` 23.0 (lock hero, no panel),
    `R13_s4_stats1c` 24.5 (count-up mid-flight), `R13_s4_stats2c` 27.5 (full panel + NOT BLIND
    FIRE), `R13_g_s4_volley` 3.4 (early scene clean). s5: `R13_s5_sig` 6.0 (tailed pulse),
    `R13_s5_snap` 7.1 (boundary stamp), `R13_s5_mint3` 8.25 (mint motes), `R13_s5_terms2` 11.2 +
    `R13_s5_read` 13.5 (panel + dim agent in the punch-in), `R13_s5_wide` 21.0 (root-of-trust
    caption + full read), `R13_g_s5_early` 3.0. Guards `R13_g_s1/s2/s3/s6/s7/s8/s9/s10` — all
    pixel-story identical to R12 (s9 shows all six receipts + URL on screen).
  - **Honest residuals**: the s4 host mid-walk (23–24.4) crosses behind the reticle's right rings
    for ~1 s and stands inside the HUD circle after (deliberate bracket, but the scope lines draw
    over it); under shot.sh's virtual-time the cast can still show unconverged poses (R10 note —
    stepper/live are correct); the s5 walking host still fronts the agent+key for ~1 s mid-walk
    (10.3–11.9, pre-existing R10 staging); the mint motes are subtle at 1280 (deliberate — the
    burst + scale-in finish the beat); the mandate panel's ON-CHAIN tag can sit over cage wires
    in wide frames (legible, but low-contrast for a beat); EXPIRES carries a cyan ✓ (reads
    "enforced" — semantically it's a sunset clause); the s5 HOST still runs bright under the
    Flex rig — only the agent was de-glowed, per the brief.

- **R14**: DONE — the deck's first scene INSERTION: a new **scene 4 · VOICE** ("Just say it —
  voice is the control layer") lands between NO SAFETY NET and THE SCOPE; every downstream scene
  shifts +1 (scope→5, mandate→6, autonomous→7, robbed→8, harbor→9, proof→10, close→11 —
  **11 scenes, DURS [15,18,18,22,30,26,24,22,26,18,15] = 3:54**). The real product is
  voice-first (you speak; Gemini Live listens; the ElevenLabs UI kit renders it) — this scene
  sells it. Facts grep 7/7 byte-identical; only `http://` is still the grain-SVG namespace;
  one self-contained file; perf conventions kept (active-scene-only updates, pixelRatio 1.5).
  - **The scene** — opens on a GHOST of scene 2's dashboard wall: 58 panels on three arcs
    (r 7.6/9.6/11.8, overhung rows) wearing the SAME 12 chart faces (`makeDashTexs(61)`
    extracted from makeDashWall — extraction only, same seed formula, s2 guard verified
    pixel-story identical). The wall strobes, then each panel is SUCKED down a curled spiral
    into the **R9 orb** (reused, tinted cyan: wire shell 0x74d9f2 · points · core CYAN) with a
    cyan burst + kick at 5.6 — "all of that → one voice". A **48-bar live WAVEFORM** row (+
    baseline + two billboarded session rings) breathes under the orb; U/G speech envelopes
    (user 9.5–12.7 · guardian 14–17) drive orb amp/speed/glow/scale, bar amplitude and ring
    opacity — the orb visibly listens and speaks. The exchange is DOM **chat bubbles**
    (`.convo` — the ElevenLabs conversation look; the deck's one rounded shape): YOU "Put my
    idle USDC to work." (9.6) → GUARDIAN "Compound's the safe pick — deploying." (14.0) → a
    mono action line "→ invest(USDC → COMPOUND) · inside the mandate" (17.0) that foreshadows
    the s5 lock. Cast: the host attends frame-right (head tracks the orb through the user line,
    NODS as the reply lands, presents the answer); the AGENT waits at its flank, points on
    "deploying", then SPRINTS off behind the orb with a blue comet streak + EBLUE burst —
    money in motion. Camera: one measured push THROUGH the collapsing wall onto the orb
    (0–7.5) then arrive+hold on the exchange. Captions EVERY DASHBOARD, EVERY BLOCK → ALL OF
    THAT → ONE VOICE → SAY WHAT YOU WANT → IT SENSES, BOUNDS, ACTS; badge "VOICE · GEMINI
    LIVE + ELEVENLABS UI"; presenter note bridges into senses/bounds/acts ("the next three
    scenes are what happens under that one sentence").
  - **The renumber (the round's real risk)** — DURS / SLIDES (secs + n fields) / CAPS / FOGD
    (.014 at index 3) / LAYERCFG / FLASHC / SHOTS all went 10→11 with the new index 3; sets
    addSet(3..9)→(4..10) plus their `LOOPS[n]` refs (edited end-first so no index collided);
    layerStep `cur===3/4/5/6/7` → `4/5/6/7/8` (+ a small cyan flash for the voice beats at 3) —
    the scope and ledger DOM layers follow their scenes; **digit-jump remapped**: 1–9 → scenes
    1–9, `0` → scene 10 (PROOF), `-`/`=` → scene 11 (CLOSE), hint + notes updated; notes panel
    now says #1…#11 / rests on 11 (~3:54); render.sh `LAST` 10→11 (+ 236s estimate); shot.sh
    usage comment 1–11; progress dots are SLIDES-driven (auto 11).
  - **Verified (R8 `?capture=1` stepper batch probes, .shots/R14_*)** — voice beats:
    `v_wall2` 1.8 (standing ghost wall + caption), `v_collapse`/`2` 4.2/4.6 (spiral suck into
    the brightening orb), `v_orb2` 7.2 (orb + idle waveform + rings landed), `v_listen2` 11.0
    (user bubble + ● LISTENING + hot waveform + host head-track), `v_reply2` 15.3 (guardian
    bubble + present + speaking orb), `v_acts2` 18.4 (action line + sprinting agent + blue
    streak). Iterated once, capture-caught: at the first marks the agent's limbs poked through
    the host's silhouette (stacked in depth) and the host crowded the right edge — host
    (3.7,2.7)→(3.45,1.2), agent (5.4,.5)→(5.7,−1.6), dispatch trail lengthened ×1.26 / op .55.
    Guards: `g_s2` 14.6 (dashwall after the texs extraction — identical), `g_s3` 15.5 (void
    dive), `g_s5` 23.0 (lock) + `g_s5b` 27.5 (benchmark panel, count-ups landed), `g_s6` 13.5
    (Flex GLB + mandate panel — ledger gating followed the shift), `g_s10` 10 (all six
    receipts + URL), `g_s11` 9.5 (close, dot 11 lit). **`?auto` proven end-to-end** on the
    capture clock (fps=1, deterministic): advances at t=16/35/54/77/108/135/160/183/210/229 →
    rests on scene 11 (`R14_auto_end`). Live path: `R14_live_s4/s5` via shot.sh (the
    non-capture rAF path renders identically; R10's unconverged-pose caveat still applies to
    shot.sh cast frames). JS syntax + 11-length array audit run via node.
  - **Honest residuals**: the ● LISTENING chip stays lit through Guardian's own reply
    (defensible — Gemini Live is full-duplex — but it is static copy); a collapsing panel can
    cross the title scrim for a beat mid-suck; the dispatch sprint reads puppet-like in a
    frozen frame (R10 gait residual); loops past 22s replay the collapse (deck wrap
    convention); the s1 note's "three minutes" is now 3:54 (untouched factual copy elsewhere);
    SCRIPT.md still narrates the 10-scene cut and needs a voice-scene line if it is reused.

- **R15**: DONE — the two quality upgrades: the CAST's two hero bots (GUARDIAN + AGENT) rebuilt
  **very detailed** in the obox language, and scene 6's exposure brought down to calm/premium.
  All verified through the R8 `?capture=1` stepper (scratchpad CDP batch probe, R10's method —
  before/afters + in-scene beats + guards, `.shots/R15_*`) plus shot.sh live-path smokes
  (`R15_live_s1/s6` — the non-capture rAF path renders identically). Facts grep 7/7
  byte-identical; JS parse-audited via node; nav/notes/timer/`?auto`/`?chrome`/`?capture`/
  render.sh/shot.sh/`?cast` contracts untouched; one self-contained file; no scene restaged.
  - **The rig grew one primitive** — `ocyl` (round voxel: toon cylinder + BackSide ink shell,
    the makeVault cylZ language generalized) for joints, axles, knobs and collars. Everything
    else is obox. Anchors (arm groups ±.45/.88 host · ±.30/.90 agent, head/torso/leg groups),
    the full act API (`idle/wave/present/presentR/point/overwhelmed/run/fall/aim/protect/grab/
    cheer`), foot-ground contact and every scene mark are byte-compatible — staging code
    untouched, all 11 scenes re-verified with the new bodies.
  - **GUARDIAN v2** (~75 obox + 6 ocyl vs ~30 before) — legs: hip axles, knee bands, shin
    plates, layered boots (toe cap + heel). Torso: pelvis plate, dark waist seam ring, proud
    side plates, collar ring, a proper **heart-emblem housing** (light bezel + dark inset, the
    cyan heart floats in it), a **bolted chest hatch** with latch, vent slats, a walking row of
    three cyan **status pips** (new update() beat, deterministic), back pack with vents. Arms:
    shoulder axle + layered pauldron + rim, elbow drum, forearm panel, wrist ring, mitt +
    thumb. The TV: neck joint cylinder, **bezel plate with four corner screws**, inset screen
    (eyes/smile kept, z-bumped), **4-slat speaker grille + twin octagon knobs with pointer nubs
    + a cyan power LED** down the right column, vented ear panels (3 slats each side), top
    ridge vent, back panel + vents, coiled antenna (collar + mast + two washers + the kept lit
    tip). Reads like a shipped mascot on the cast rig and at scene scale.
  - **AGENT v2** (~55 obox + 10 ocyl vs ~14 before) — sleeker but intricate: hip/knee axle
    drums, shin guards, ankle blocks, toed feet; waist ring joint, pelvis plate, **sternum
    plate over a breathing EBLUE core light** (new update() beat: idle 2.6 Hz → 7.5 Hz when
    aiming/overwhelmed/falling), chest + panel seams, side intakes, back panel, **4-nub spine
    ridge**, collar + neck joint, shoulder yokes; arms with axles, cap plates, elbow drums,
    forearm panels, wrist rings, thumbs. Head: crown cap, chin band, **segmented visor** (side
    wraps + top/bottom bezel lines), brow sensors + EBLUE forehead camera, **ear sensor pods
    with blue pips**, upgraded dorsal fin with an EBLUE trailing-edge light (first cut buried
    the light inside the fin — capture-caught, moved proud), back vents. The scanning eye +
    eyeGlow contract untouched (s3 tumble, s5 aim-lock, s6 dim, s7 flow all re-verified).
  - **S6 exposure (the R13 residual, finished)** — the camera-parented Flex directional rig
    reaches the WHOLE scene-6 world; at key 2.4 + rim 2.6 + rim2 1.2 + amb .3 (~6.5×) it was
    flooding the mandate — the host read as a clipped white slab (R15_before_s6_read). The rig
    now runs **key 1.0 · rim 1.1 · rim2 .5 · amb .12 (~40%)**; the GLB is compensated at the
    material (albedo .20→.34, emissive .38→.46) so the Flex reads exactly as before; the R13
    agent-only crush ×.4 (which would now bury it) relaxed to **×.75**, visor glow .22→.3. The
    befores/afters at tl 6/13.5/21: safe dial + spokes, cage, mandate panel and both bots now
    read fully modeled, nothing clips; the Flex screen/icons legible as ever.
  - **QA rig** — `?cast` grew **`&face=DEG`** (turns the character independently of the camera
    yaw; default still faces the lens) so back/side detail is screenshotable
    (`R15_cast_guardian_back`, `R15_cast_agent_back2`).
  - **Verified (screenshots, .shots/)** — cast: `R15_cast_guardian(_b/_back/_wave)`,
    `R15_cast_agent(_b/_back2/_aim)` vs `R15_before_cast_*`. In-scene: `R15_s1_present`,
    `R15_s4_listen/acts`, `R15_s5_lock` (OTS), `R15_after_s6_sig/read/wide` vs
    `R15_before_s6_*`, `R15_s7_deploy/run/settle`, `R15_s11_close`. Guards: `R15_g_s2_buried`,
    `R15_g_s3_void`, `R15_g_s8_revert/table` (capability table verbatim), `R15_g_s9_settle`,
    `R15_g_s10_proof` (all six receipts + URL legible).
  - **Perf** — ~+90 visible meshes per bot on the active scene (hidden sets are pruned at the
    graph, R9 convention kept; pixelRatio 1.5 kept). Measured: 150 stepper frames on s6 (both
    bots + GLB + cage) = **2.8 fr/s wall @1280×720 swiftshader** ≈ R8's 1.05–1.23 fr/s @1080p
    band once normalized for pixels — no regression band shift; full render.sh cost
    unmeasured this round.
  - **Honest residuals**: pauldrons/cap plates ride the arm groups, so a big wave/cheer takes
    the shoulder cap with the arm (reads as a flexible joint, not a fixed pauldron); elbow/
    knee drums are cosmetic — limbs still hinge only at shoulder/hip (rig unchanged by
    design); corner screws + knob pointers are sub-pixel at wide framing (they pay off in the
    cast rig and punch-ins); the agent silhouette runs a touch wider/lighter than R9's stick
    frame (sternum + crown) though still clearly the thin mid-gray of the pair; the s6 host
    remains the brightest thing in frame — intended through-line, now modeled instead of
    clipped; the Flex screen still runs hot white at the tl-6 angle (emissive, byte-identical
    to R14's read).

- **R16**: DONE — placeholder-elimination + detail pass: the last two gray-shard fields are gone,
  the s3 coins are USDC, the s5 venues wear real protocol marks, and the INTRUDER is rebuilt to the
  R15 craft level. All beats verified through the R8 `?capture=1` stepper (scratchpad CDP batch
  probe, R10's method — navigate `?capture=1&fps=30&t=BEAT−2.5#N`, step 75 exact frames,
  screenshot; befores + afters + guards, `.shots/R16_*`) plus shot.sh live-path smokes
  (`R16_live_s9/s5/s3` — the non-capture rAF path renders identically). Facts grep 7/7
  byte-identical (6 addresses/txs + URL `guardian-rho-two.vercel.app`, one hit each; the arcscan
  receipt annotation rows untouched); the only `http://` is still the grain-SVG namespace (100 %
  offline); JS parse-audited via node; nav/notes/timer/`?auto`/`?chrome`/`?capture`/render.sh/
  shot.sh/`?cast` contracts untouched; one self-contained file; no staging/beat/camera changes.
  - **S9 SAFE HARBOR — RED danger-storm** (the "Base storm" you flee): the gray `makeShards` echo
    is replaced by a real danger vortex at the Base shore — 64 tumbling plates + 40 slivers
    (2 instanced meshes, per-shard HEAT by radius: dark ember → hot red), churning turbulently
    (orbital swirl + radial breathing + vertical roll + 3-axis tumble), wrapped in 7 drifting red
    haze glows around a flickering core, 14 embers spiralling up off the sea, and a red
    point-light (0xff4030) that RAKES the churning wave facets — the sea itself now reads angry.
    A deterministic lightning flicker (t-driven pow-sine) spikes the core + light together. Spray
    retinted ember (0xff8a70). All scatter rng(97) build-time; runtime pure (t). The story frame
    is `R16_s9_cross`: red chaos left → blue CCTP stream + riding agent → cyan USYC ring right —
    danger → money-in-motion → safe, in one image. Settle guard: ring + all receipt rows clean.
  - **S5 THE SCOPE — DATA-NOISE backdrop**: `makeStorm` + the mid-field `makeShards` are out of
    the scene; `makeDataNoise()` builds a deep receding field of ticker rows, lone APY/TVL/RATE
    figures and sparkline fragments (13 small shared canvas textures on 13 instanced meshes,
    ~100 instances, additive, cool-toned rgba(148,176,208)) drifting slowly at z −6…−24 behind
    the market wall — per-instance brightness falls with depth, FOGD .016 drowns the far band.
    The scope-drop now dims it to .22 (was .3) — "graphscout cuts the noise" is literal: the
    noise is data, and the reticle visibly cuts through it (volley 3.4 bright vs sweep 14 dim,
    capture-verified). Iterated once, screenshot-caught: 2 shared fragment textures × 14–16
    instances repeated the same figure ("81.22%") across the frame like a pattern — split into
    6 fragment + 4 sparkline + 3 row textures, ≤7 instances each. Lock (23.0) and benchmark
    panel (27.5) verified hero + untouched. makeStorm/makeShards stay defined, unused.
  - **S3 — the coins are USDC**: blue bodies (0x2456b8 ridge rim, EBLUE emissive) with a canvas
    USDC face on BOTH caps — blue field, dark rim step, the broken white ring, a bold `$` glyph
    and the `USDC` wordmark (`board()` canvas, redrawn on font load) — plus a soft emissiveMap
    (.26) so the mark reads as each coin falls out of the graze light into the red void. Radius
    .16→.19. The 9-per-coin R() draw count is preserved, so every other scatter in the scene is
    byte-stable. Dollars over the brink now, not gray washers (`R16_s3_coins` — ring + $ legible
    mid-flight; `R16_s3_void2` — the blue clump raining past the wrecked rail).
  - **S5 — real protocol emblems**: the anonymous hex boss on each venue token is a round
    MEDALLION (32-seg frustum, same relief language) carrying a canvas MARK inlaid on both
    faces — **AAVE = the ghost** (arched head, wavy hem, two cut eyes), **COMPOUND = the
    stacked-bar mark**, **MOONWELL = the crescent** (+2 star dots) — each on a dark inlay disc
    with a verdict-keyed ring (cyan / cyan / red). A face group counter-rotates against the
    token's z-spin so the marks stay UPRIGHT while the facets keep walking the light; loser
    marks dim to .96×lockDim on lock (verified: they read at volley/sweep, step back behind the
    ranked rows at 23.0). Ranked list / lock / benchmark / labels untouched.
  - **S8 — INTRUDER detail-match** (~55 obox + 4 ocyl vs 14 primitives): layered torn skirt
    (3 cloth bands + 9-strip jagged hem ring), plated chest over the cloth (chest plate, two
    asymmetric lower plates, belt + buckle, collar guard), kept shoulder diamonds now layered
    over angled pauldron plates + secondary jags, 4-spike descending spine row, segmented arms
    (shoulder/elbow joint drums, jag plates, bracer spikes, wrist bands) ending in three
    2-segment CLAWS + thumb claw per hand, and a proper hood — side flaps, back tail, cowl brow,
    chin guard, crest spike. Threat stays contrast-not-hue (near-black cloth, LIGHTER gray
    rims); the red slits are joined by a few RED seam accents (chest seam, spike tips, hood
    pips) that smoulder on the swarm's strobe family (driven in update()'s intruder branch;
    guardian/agent untouched). Anchors (torso/arm/head pivots, hunch .38, `this.eyes`) and the
    whole stalk→grab→hurl→recoil→sulk choreography byte-compatible — scene-8 staging untouched.
    Verified: `R16_cast_intruder(_grab)` on the QA rig, in-scene grab 5.3 / reject 8.7 (protect
    silhouette vs the red flare, claws readable) / sulk 13 (capability table verbatim).
  - **Guards** — s1 hook, s2 buried (dashwall), s4 voice (orb+waveform+bubble), s6 mandate
    (panel + Flex + dim agent), s7 depeg (red retreat), s10 proof (all six receipts + URL
    legible), s11 close: pixel-story identical to R15 (`R16_g_*`).
  - **Perf** — s5: 13 instanced draws (~100 instances) vs the storm's ~8 — comparable; s9: +2
    instanced meshes, ~22 sprites, +1 point light, −1 instanced shard mesh; intruder ≈ +100
    meshes on its one scene (R15 band, active-scene-only updates kept; pixelRatio 1.5 kept).
  - **Honest residuals**: the s9 debris plates are uniform boxes — unambiguous churn in motion,
    but a frozen frame near the column's top can read slightly confetti-like; the USDC wordmark
    is legible only in the nearer half of the coin flight (the second-dive clump blooms into a
    bright blue cluster — deliberate money-shot, but `USDC` goes sub-pixel there); the emblem
    counter-rotation cancels only the z-spin — under peak y-wobble a frozen frame catches a mark
    a few degrees tilted; a couple of duplicate noise figures can still coexist on screen (reads
    as noise now, not a pattern); the intruder's hem strips can clip an orbiting swarm shard
    mid-tumble; its red accents are subtle at the wide scene-8 framing (they pay off in the
    punch-in and on the cast rig); makeStorm + makeShards are now fully unused (kept defined,
    per the round's rule).

- **R17**: DONE — the ANIMATION pass: constant subtle life on the cast, the frozen props and the
  camera, layered UNDER every existing pose/beat (nothing restaged, no facts touched — grep 7/7
  byte-identical, only `http://` is still the grain-SVG namespace). All beats verified through the
  R8 `?capture=1` stepper (scratchpad CDP batch probe, R10's method — 75-frame run-in, 18 probes,
  `.shots/R17_*`) + the cast rig (`R17_cast_guardian`) + shot.sh live smokes (`R17_live_s1/s7`).
  JS parse-audited via node; nav/notes/timer/`?auto`/`?chrome`/`?capture`/render.sh/shot.sh/`?cast`
  contracts untouched; one self-contained file. Nothing was reverted — every added motion read
  correctly on its screenshot.
  - **Cast ambient layer (`Chr.update`)** — a new always-on life pass under the act API: breathing
    (torso pitch + a `torsoY0`-anchored rise, 1.15 Hz per-character phase), slow weight-shift
    (torso roll .02), per-arm settle (x .045 / z .03, phase-offset so arms never metronome), and a
    two-sine head wander + slow head tilt. All gated by `idleK=(1-moveBlend)(1-flail)` and scaled
    by the pose's own `bob`, so sprints/flails/braces stay exactly as acted and every held pose
    (present, aim, protect, cheer) breathes instead of standing rigid. Faces: GUARDIAN gained an
    eye-glance drift and its **antenna is now a group pivoted at the collar** (idle breeze sway +
    inertial whip `−faceV·.05` behind quick turns — same parts, repositioned relative; cast-rig
    verified); AGENT gained an occasional visor blink (4.7 s cycle, suppressed while aiming) on top
    of the kept scan/lock behavior; INTRUDER gained a rare sharp menace head-twitch (pow-48 strobe
    family). Existing blinks/pips/core-light/tip-pulse all kept.
  - **Reactive head-tracking (staging code, the s4-voice `+=` pattern)** — the host's head now
    follows the action instead of staring: s1 glances at the safe it presents; s2 a slow dismayed
    head-shake under the reach ("no human can watch"); s4 follows the dispatched agent off-frame;
    s5 rides the scope sweep across the wall (eased `hSw` lerp so the moon→aave→comp step-jumps
    become deliberate glances); s6 rides the signature pulse Flex→vault; s7 follows the agent
    through deploy/rotate/run (wrap-normalized offset, clamp .45); s9 follows the rider across the
    whole CCTP arc (the round's best frame — `R17_s09_cross`); s10 READS the receipts (head turns
    to the panel and pans down the rows as they land, 2.0–8.2, then eases back).
  - **Environment life (was frozen)** — s1 ground ring breathes; s5 stray-target rings breathe
    under the dimK; s6 + s8 scoped keys now slowly rotate (they floated frozen); s7 market-pillar
    top beacons pulse (Moonwell's was fully static since R2); s10 gained 5 slow-rising cyan motes
    around the orb (pure-t drift, 5 sprites). Everything already alive (safe dial/seam/lamp, pips,
    waveform, USYC shimmer, storms, flows) untouched.
  - **Camera** — the positional micro-sway was near-sub-pixel at scene distance, so the LOOK
    target now drifts a whisper too (two-sine, ×.16/.11·sw, .17/.23 rad/s) plus a hair of roll
    (up-vector .006·sw): every arrive+hold keeps breathing, cuts/kicks/eases untouched, scaled by
    each shot's own sw so tight reads stay steadiest. Pure t — capture-deterministic.
  - **Perf (the lag check)** — all additions are transform/opacity math on the active scene only
    (~60 trig ops/frame); zero new geometry rebuilds, 5 new sprites total, pixelRatio 1.5 kept.
    Measured on this rig (swiftshader, 1280×720): **6.03 fr/s wall** stepping 150 frames of scene 6
    via CDP (vs R15's quoted 2.8 fr/s — R15's loop spent 2 extra CDP round-trips/frame, so band is
    same-or-better, not a regression); in-page `__capStep` self-time **2.5 ms/frame (s6) · 5.2
    ms/frame (s2, the dash wall)** — the JS side is nowhere near a 60 fps budget even under
    software GL.
  - **Verified (screenshots, .shots/)** — `R17_s01_present` (glance at the safe), `R17_s02_buried`
    (reach + shake), `R17_s03_void` (guard — pixel-story identical to R15_g_s3_void incl. the
    deliberate dive flare), `R17_s04_listen`/`R17_s04_acts`, `R17_s05_sweep` (head on the reticle)
    /`R17_s05_lock` (lock hero intact), `R17_s06_sig`/`R17_s06_read` (mandate panel + Flex intact),
    `R17_s07_deploy`/`R17_s07_run`, `R17_s08_reject`/`R17_s08_table` (table verbatim),
    `R17_s09_cross` (host head up at the rider)/`R17_s09_settle`, `R17_s10_proof` (mid-read + motes)
    /`R17_s10_all` (all six receipts + URL legible), `R17_s11_close`, `R17_cast_guardian` (antenna
    group correct), `R17_live_s1`/`R17_live_s7` (non-capture rAF path renders identically).
  - **Honest residuals**: shot.sh single-shot frames still show partially-converged poses (the R10
    boot-budget caveat — live playback and the stepper are correct); the head-follow offsets are
    applied post-spring, so a raw hash-seek needs ~1 s to look natural (the stepper's 2.5 s run-in
    covers it; live playback always converged); the intruder's menace twitch cycles ~2.8 s and is
    sharp — a random still usually misses it (by design, it's a motion beat); the guardian's
    deterministic blink can still land mid-close in a frozen frame (pre-existing R12 note); the s3
    dive flare stays hot (deliberate, R6 note — verified unregressed frame-for-frame).

- **R18**: DONE — focused fix: the s3 USDC coins were MALFORMED (user-flagged — broken/gapped
  blue discs, a partial white ring with a wedge cut). Root cause was double: (a) a real BUG —
  R16's face draw did a bare `translate(64,64)`, and `board()`'s font-redraw re-runs the draw
  callback on the SAME context, so the transform ACCUMULATED and shifted the whole face +64,+64
  off-canvas on every redraw (live path and capture both redraw once fonts land — the coin face
  everyone actually saw was the top-left quadrant of the art); (b) the R16 "stylized" split-ring
  arcs read as a defect even when drawn correctly. Scene-3 coins only; nothing else touched.
  - **Face** — redrawn at 256px (was 128): absolute coords inside `save()/restore()` (redraws now
    idempotent), a FULL-BLEED blue field (the old circle-on-transparent left an alpha sliver at
    the cap rim under the cap's inscribed-circle UVs), a dark machined edge band, one FULL
    UNBROKEN white ring (r 80, lw 13), a bold `$` glyph centered + the `USDC` wordmark beneath —
    same mark on both caps; emissiveMap (.26) + light face tint (0xdfe9ff) kept so the mark
    survives the fall out of the graze light into the red void.
  - **Body** — a real coin now, not a thin gappy disc: solid cylinder core (r .175, h .06, 28 seg,
    was .19×.05×24) + a TORUS RIM LIP (r .175, tube .034) proud of both faces sharing the darker
    rim material (0x2456b8 metal, EBLUE emissive) — edge-on it reads as a thick rounded coin edge,
    face-on the lip frames the mark. Per coin: one Group of 2 meshes (36 draws in the 2.4 s coin
    window; scene budget fine). The 9-per-coin R() draw order/count is preserved exactly (scale +
    vx/vz/vy/r1/r2/rs1/rs2/dl), so the agent fall, rail, embers, mist and every path in the scene
    are byte-stable; tumble/scatter/fade code untouched.
  - **Verified (screenshots, .shots/)** — through the R8 `?capture=1` stepper (75-frame run-in;
    scratchpad CDP probe, ports 8102/9345): `R18_s3_flight/2/3` (tl 7.4/7.8/8.3 — clean coins
    over the brink), `R18_s3_rain` + `R18_hunt_00…11` (tl 15.7–17.7 — the void rain, full rings +
    `$` legible mid-tumble at real distance), CLOSE-UPS `R18_close_A/B/C` (same deterministic
    frames re-rendered at 4K metrics, 1280×720 crops around the near-lens coins — full ring, `$`,
    `USDC`, torus edge, zero gaps, from face-on/oblique/edge-on). Guards `R18_g_sprint` (tl 6) /
    `R18_g_brink` (tl 10) / `R18_g_void` (tl 14.4) — agent sprint/fall, guardian reach, wrecked
    rail, embers all pixel-story identical. Live-path smokes `R18_live_s3/s3b` (shot.sh — the rAF
    path where the redraw bug actually bit renders the same clean coins). Facts grep untouched;
    only `http://` is still the grain-SVG namespace; nav/notes/timer/`?auto`/`?chrome`/
    `?capture`/render.sh/shot.sh/`?cast` contracts untouched; one self-contained file.
  - **Honest residuals**: the `USDC` wordmark still goes sub-pixel in the far half of the flight
    (the ring + `$` carry the read there — R16's residual, unchanged in kind); a coin caught
    perfectly edge-on renders as a rounded blue bar (that IS a coin edge-on — correct, noted so
    nobody re-flags it); the underside cap shows the mark in the cylinder's native mirrored UVs —
    indistinguishable from rotation on a tumbling coin, invisible in every capture.

- **R19**: DONE — focused fix: the s5 (THE SCOPE) market EMBLEMS were MALFORMED (user-flagged —
  each Moonwell/Aave/Compound medallion showed a broken arc + wedge-gap cutting across the logo).
  Same root cause as R18's coins: R16's `markB` draw callback did a bare `translate(80,80)`, and
  `board()`'s font-redraw re-runs the callback on the SAME context — the transform ACCUMULATED
  and shifted each face +80,+80 off-canvas on the redraw (live path and capture both redraw once
  fonts land; the face everyone saw was a corner quadrant of the art — the "wedge + partial
  arc"). Scene-5 emblem face textures only; nothing else touched.
  - **Faces** — redrawn at 256px (was 160): absolute coords inside `save()/restore()` (redraws
    now idempotent), opaque dark inlay disc (r 118), one FULL UNBROKEN accent ring (r 109, lw 8,
    still verdict-keyed: Aave+Compound cyan, Moonwell red), and each protocol mark complete and
    centered — Aave's ghost (dome + zigzag skirt + two eyes), Compound's three stacked offset
    bars, Moonwell's crescent + two stars. The crescent is now carved by OVERDRAWING the opaque
    inlay colour instead of `destination-out` (which erased through the disc into transparency —
    a second redraw-fragility removed). Medallion geometry, token spin + face counter-rotation
    (marks stay upright), tokL gradient light, halo/ring/label rig all untouched — texture-only.
  - **Verified (screenshots, .shots/)** — through the R8 `?capture=1` stepper (75-frame run-in;
    scratchpad CDP probe `R19probe/close/reload.mjs`, ports 8103/9346): `R19_s5_wide` (tl 5 —
    volley, all three emblems clean at rest), `R19_s5_sweep`/`R19_s5_sweep2` (tl 14/17.5 —
    reticle on Moonwell then Aave, marks upright mid-spin), CLOSE-UPS `R19_close_moonwell/
    aave/compound` (same deterministic beat re-rendered at 4K metrics, 1280×720 crops — full
    rings, complete crescent/ghost/bars, zero gaps or wedges). Guards `R19_s5_lock` (tl 23 —
    lock hero, shock bloom, ranked rows verbatim vs `R17_s05_lock`) and `R19_s5_bench` (tl 25.5
    — benchmark panel byte-story identical to `R16_g_s5_stats`, which incidentally documents the
    broken before-state emblems). IDEMPOTENCY PROOF `R19_idem_A/B`: two REAL loads (about:blank
    between), fonts landing each time so `board()` re-runs the draw, same frame (tl 12) —
    **identical md5** (`5168…b1c1`). Live-path smokes `R19_live_s5`/`R19_live_s5lock` (shot.sh —
    the rAF path where the redraw bug actually bit renders the same clean emblems). Facts/nav/
    notes/timer/`?auto`/`?chrome`/`?capture`/render.sh/shot.sh contracts untouched; 100% offline;
    one self-contained file.
  - **Honest residuals**: at the hit beat (tl 22.6–23.5) Compound's bars sit inside the cyan hit
    bloom and wash bright — that is the beat, not a defect (mark reads again by tl 24); a
    reload A/B at a volley beat (tl 5) differs ONLY in the `Math.random` burst sparks
    (pre-existing spark nondeterminism, emblem regions byte-identical); shot.sh single-shot
    frames still show partially-converged poses (the R10 boot-budget caveat — stepper and live
    playback are correct).

- **R20**: DONE — the REBRAND + TYPOGRAPHY + DECLUTTER pass, in one round: the product is now
  **ITHACA** (the safe haven your money comes home to), the display face is the **Helvetica Bold
  system stack** (`'Helvetica Neue',Helvetica,Arial` — 100% offline, the Space Grotesk @font-face
  + woff2 reference removed; JetBrains Mono KEPT only for true data: addresses, tx hashes,
  tickers, benchmark figures, timer), and every scene's text was stripped to one title (top-left,
  sentence case) + at most one short sub, with every restated line killed. All 11 scenes
  screenshot-verified through the R8 `?capture=1` stepper (scratchpad probe `R20probe.mjs`,
  ports 8104/9347 — navigate `?capture=1&fps=30&t=BEAT−2.5#N`, step 75 exact frames, screenshot;
  `.shots/R20_s01…s11`) plus shot.sh live-path smokes (`R20_live_s1/s10` — the file:// rAF path
  renders the system font identically). Facts grep 7/7 byte-identical (6 addresses/txs + URL
  `guardian-rho-two.vercel.app`, one hit each); only `http://` is still the grain-SVG namespace;
  JS parse-audited via node; nav/notes/timer/`?auto`/`?chrome`/`?capture`/render.sh/shot.sh/
  `?cast` contracts untouched; one self-contained file; no 3D restaged.
  - **RENAME (display copy only)** — `<title>`, the top-right brand tag, s1 mega wordmark, s4
    chat speaker, s4/s9 subs, s11 wordmark and the presenter notes all say ITHACA; the close tag
    is the one deliberate homecoming line: **"Autonomous yield that always comes home."** (s1
    note adds the Odysseus beat for the presenter). Internal identifiers stay (`?cast=guardian`,
    the Chr kind, `window.GUARDIAN_LEDGER_GLB`, code comments) — QA-rig/asset contracts intact.
    The proof URL + all six receipt strings verbatim; the app.png screenshot (the real live app)
    untouched.
  - **TYPE** — body/headings/labels/captions/chips/badges/panel headers/canvas boards (SGF) all
    run Helvetica Bold; h1 −.022em (mega −.04em, line-height .96), captions .15em, chips .18em,
    brand .14em. Mono panels reset to weight 400 (ranked/gsx/mandate/ticker/captable/harbor/
    proof/timer/label/hint) so keys/values keep their hierarchy — the 64-char hashes read
    lighter and cleaner than before.
  - **DECLUTTER, per scene (cut → kept)** — **s1** 4 chips → 3 (BASE + ARC chip cut; sub + wordmark
    kept). **s2** two-sentence sub → "Money sits idle — or you guess." (the 3 wall captions now
    carry protocols/blocks/no-human without restating the sub). **s3** sub → one line ("One
    hallucination — the funds are gone." — the old 2-liner ran white-on-white behind the host,
    capture-caught); BOTH captions cut (they restated the title verbatim). **s4** title → "Just
    say it", the control-layer clause moved into the sub; badge tightened; captions 4 → 1 (only
    "ALL OF THAT → ONE VOICE" survives — SAY WHAT YOU WANT duplicated the user bubble, SENSES/
    BOUNDS/ACTS duplicated the sub). **s5** badge cut, sub → one sentence; benchmark panel:
    header row + RETURNS prose row + footer cut — headline ~98× + AAVE 115× + COMPOUND 81× +
    ROUND-TRIPS 3→1 kept exact, gxq shortened to fit one line (capture-caught wrap); captions
    5 → 2 ("CONTEXT IS EVERYTHING…/…TOO MUCH IS BLINDING" merged; "LOCKED — COMPOUND ★ 82" cut —
    it duplicated the scope readout in the same frame; "NOT BLIND FIRE" cut). **s6** 3-sentence
    sub → 1; LEDGER badge cut; panel head → "SIGNED ON LEDGER FLEX"; EXPIRES row tersed; second
    mfoot cut; captions 4 → 3 (the ONE SIGNATURE caption duplicated the mfoot; root-of-trust
    caption tersed). **s7** sub → "Deploys, rotates, retreats — on its own, inside the mandate.";
    ticker rows tersed (SCOUT/ROTATE/SIGNAL trimmed, INVEST + tx chip verbatim); DEPEG caption
    tersed. **s8** sub → 1 sentence (root-of-trust restatement cut); cfoot cut (it duplicated
    the caption word-for-word). **s9** sub → 1 sentence (flex-owned clause cut — the ARC VAULT
    row says it); captions 3 → 1 (STORM ON BASE duplicated the 3D label, CCTP FLIGHT duplicated
    the hot row; "SETTLED — USYC" kept). **s10** sub → 1 line; the NOT-A-MOCKUP caption cut (it
    restated the title over the receipts); panel + appshot untouched. **s11** tag → the
    homecoming line; trinity rows kept mixed-case in Helvetica Bold.
  - **Verified (screenshots, .shots/)** — `R20_s01_hook` 8 (wordmark + 3 chips), `R20_s02_wall`
    13, `R20_s03_brink` 10 (one-line sub clear of the host), `R20_s04_convo` 18 (bubbles + action
    line, ITHACA speaker), `R20_s05_sweep` 14 + `R20_s05_lock` 25.5 (ranked rows + tidy
    benchmark panel, verdict said once), `R20_s06_mandate` 13.5, `R20_s07_ticker` 16,
    `R20_s08_table` 13.5, `R20_s09_settle` 16, `R20_s10_proof` 10 (all six receipts + URL
    legible in 400-weight mono), `R20_s11_close` 9.5 (ITHACA. + comes-home tag), `R20_live_s1/
    s10` (file:// smoke). Iterated ×2 in-round, both capture-caught: the s3 sub clipping and the
    s5 gxq wrap + duplicate verdict.
  - **Honest residuals**: on a Windows box the stack resolves to Arial Bold (Helvetica Neue is a
    macOS face) — that is the accepted system-stack behavior; the s11 tag crosses the dim safe
    silhouette for its hold (legible, scrim carries it); the in-world MOONWELL label still
    ghosts faintly behind the ranked rows at lock (pre-existing R10 dim behavior); the unused
    .gxh/.gxf/.cfoot CSS rules remain defined (DOM no longer references them); SCRIPT.md still
    says Guardian if it is ever reused for narration.

- **R21** (2026-09-12): DONE — the deck's second scene INSERTION: a new **scene 7 · LIVE DEMO**
  between THE MANDATE and AUTONOMOUS — the real phone capture (`assets/livedemo.mp4`, portrait
  1080x1888, 86.2s) plays full-height, contain-fit (~606px wide) in a thin rounded phone bezel
  (#demoPhone, 1px white border + faint cyan halo) over an intentionally EMPTY 3D stage; the
  deck is now **12 scenes, ~5:22 in ?auto**. Every pre-existing scene's content/staging is
  byte-identical — only positions 7-11 shifted to 8-12.
  - **The scene**: persistent `<video id=demoVid muted playsinline preload=auto>` in the body
    (buffers from page-open); it rides the deck's ONE scene-activation path — renderSlide →
    applyLayers, where `LAYERCFG[6]={demo:1}` shows the layer and plays from `currentTime=0`;
    ANY exit pauses + rewinds, so re-entering restarts. Left column fills the side space:
    "LIVE ON BASE SEPOLIA" (LIVE in the semantic cyan) + 3 talking points ("Talk to it → it
    sets the policy" / "Sign once on the Ledger Flex" / "Autonomous deploy, verified on-chain"),
    Helvetica Bold with the deck's cyan left-border rows, staged on data-at 0.4-2.7. Layer sits
    at z4 (above vig/grain so the recording stays crisp/ungraded, under the z5 HUD); DUR 88s in
    ?auto, live the arrow advances. In ?capture the video is scrubbed to the virtual clock
    (layerStep) instead of wall-time playback, so render.sh stays deterministic.
  - **The renumber (all 12-length, verified)**: SLIDES/DURS/CAPS/FOGD/LAYERCFG/FLASHC/SHOTS
    +1 entry at index 6; addSet 6-10 → 7-11 with their `LOOPS[n]` phase reads; layerStep flash
    beats 6/7/8 → 7/8/9; slide `n:` 007-011 → 008-012; digit-jump `0` now = scene 11 (PROOF, was
    10); progress dots auto-derive → 12; notes panel #1…#12 / rests-on-12 (~5:22); render.sh
    `LAST=12` + ETA base 324s; shot.sh usage 1-12.
  - **Codec fix (capture-caught)**: livedemo.mp4 arrived HEVC 10-bit (`hevc/yuv420p10le`) —
    Chrome reported playback but painted BLACK frames headless (and headed playback would
    depend on the machine's HEVC hw extensions: a live-stage black-rectangle risk). Re-encoded
    in place to H.264 8-bit (`libx264 crf19 yuv420p +faststart`, 47.8MB → 9.8MB, video stream
    86.23s/2587f intact; the source's own audio truncation at 67.6s carried over — irrelevant,
    the element is muted). Original kept as `assets/livedemo_hevc_orig.mp4`.
  - **Verified (screenshots, .shots/)** — `r21_scene7_livedemo` (real-time CDP capture: app
    frame ~3.2s in, avatar + GUARDIAN UI legible inside the bezel, left column landed, HUD
    label "// 07 · LIVE DEMO" + 007, dot 7/12 lit); `r21_scene6_mandate` and
    `r21_scene8_autonomous` (both neighbors pixel-faithful post-shift: mandate table + Flex GLB;
    ticker + tx chip + market columns, label // 08 · 008). CDP virtual-clock run: ?auto=1
    advances HOOK → … → LIVE DEMO (held 88s) → … → CLOSE, all 12 in order, dots tracking,
    rests on 12 at t=321s. All 6 addresses/txs + the live URL grep-identical (1 hit each,
    before and after). Inline script `node --check` clean.
  - **Honest residuals**: shot.sh's `--virtual-time-budget` does not advance media time, so a
    scene-7 still through shot.sh can catch the video before first paint (black phone screen) —
    the H.264 frame 0 itself shows the app; use a real-time capture for scene-7 stills; the
    mp4's audio track ends at 67.6s (source artifact, muted anyway); in ?capture the per-frame
    seek makes scene 7 render slower than the 3D scenes (render.sh only); scene-7 free-look
    drag orbits an empty stage (harmless); SCRIPT.md not updated for the new scene order.

- **R23** (2026-09-12): DONE — round 1 of the 5-round detail+performance push: per-scene
  **ENVIRONMENTS** (no 3D scene reads as flat black any more) + a **P-toggled PERF HUD**.
  (Two in-code micro-passes since R21 were never logged here: R22 = scene-7 de-haze + the
  3D-render gate while the video plays; the scene-7 audio unmute is tagged R23 in code.)
  - **ENV, the system** (`makeEnv`, after `dustGrid`): two shared, GPU-trivial layers behind
    every 3D scene. (1) a **gradient SHELL** — ONE shared open BackSide cylinder (r85, h170)
    wearing a baked vertical gradient: a faint horizon glow band in the scene's semantic tint
    dying to the deck black above and below. Painted in display values, texture tagged
    `SRGBColorSpace` (hardware sRGB decode → the POST comp's manual encode returns them
    exactly; 8-bit sRGB steps stay perceptually even in the darks — no banding), `fog:false`
    (the shell IS the world beyond the fog, so s2's .024 air can't erase it). Looks cached —
    scenes sharing a tint share one texture+material (cyan/blue/red/void/harbor). (2) a
    **STAR/DUST field** — 260–440 soft additive Points (the shared GLOW map) on a far ring
    (r34–76), static by design: parallax comes free from the camera moves, zero per-frame JS.
    Whole system = exactly TWO extra draw calls on the active set; only the active set draws.
    **Scene 7 (LIVE DEMO) untouched** — empty stage, DOM video, R22 gate all byte-identical.
  - **Per scene (deck numbering)** — s1 HOOK calm cyan air + stars · s2 DATA OVERLOAD cold
    blue data-void, densest far dust (420) · s3 NO SAFETY NET the red glow lives DOWN in the
    pit (`look:void`, band at .80) + sparse embers reaching below the rim · s4 VOICE AI-blue
    behind the ghost wall · s5 SCOPE light cyan, sparsest stars (280 — the data-noise field
    is already dense) · s6 MANDATE cyan mandate room · s8 AUTONOMOUS money-in-motion blue
    behind the market skyline · s9 CAN'T BE ROBBED low red unease · s10 SAFE HARBOR the
    SPLIT room: red storm-glow behind Base (−x, u.75) / cyan haven-glow behind Arc (+x,
    u.25) on one 512-wide wrap, stars only above the sea line · s11 PROOF calm cyan ·
    s12 CLOSE the starriest, brightest sky of the deck (440 @ .42) — the homecoming night.
  - **PERF HUD** (`#perf` + `perfToggle`): **P** toggles a corner chip — smoothed **FPS ·
    frame-ms · draw calls**, updated ~2×/sec, JBMono, bottom-right above the hint. OFF by
    default; works with `?chrome=0` (dev tool, not deck chrome); **never under `?capture`**
    (guarded at the key AND the sampler — render.sh stays byte-deterministic). While on,
    `renderer.info.autoReset` is off and `frame()` resets info itself, so the count covers
    the WHOLE frame (scene + all 4 bloom passes), not just the last composite; on scene 7
    the R22 gate holds it at 0 — the honest number. Key legend updated in the header
    comment, the on-screen hint (`P fps`) and the notes panel.
  - **Verified (screenshots, .shots/)** — `r23_s01_hook` 8, `r23_s03_cliff` 10,
    `r23_s08_auto` 13.5, `r23_s12_close` 9.5 (all four: real depth, heroes untouched,
    nothing competing) + the three risk scenes: `r23_s02_wall` (shell reads through the
    .024 fog), `r23_s06_mandate` (Flex GLB + camera rig pixel-faithful over the new depth),
    `r23_s10_harbor` (split tint behind ring + storm). `r23_perf_hud` = chip live over
    scene 8 ("2 FPS · 435.5 ms · 510 calls" on swiftshader). CDP probe: perf chip
    off-by-default (display:none, empty) → P shows live numbers → P hides again. Real-time
    `?auto=1` run: #2→#12 land exactly on the DUR schedule (#12 at 314s ≈ 309 + 5s poll),
    rests on 12, ZERO console errors (also proves all 12 sets built clean). Facts 7/7
    grep-identical before+after (6 addresses/txs + URL, one hit each). `node --check` clean.
  - **Honest residuals**: real fps is UNMEASURABLE headless (software GL ≈2fps) — the user
    must press P on the live GPU to read true numbers; measured ~505–510 draw calls/frame on
    s8 is PRE-EXISTING cost (every obox = 2 meshes, every comet = 3 sprites — the cast alone
    is hundreds of calls) — instancing the voxel cast is the obvious later-round win; the
    perf chip overlaps the notes panel when notes are open (dev tool, benign); under ?cast
    the chip freezes at its last sample (CASTQ's early return skips the sampler); s4/s5/s9/
    s11 backdrops not individually screenshotted this round — they reuse the exact cached
    looks verified above and the sweep showed zero set-build errors.

- **R24** (2026-09-12): DONE — round 2 of the detail+performance push: the HERO ASSETS gain
  real machining while the deck's draw calls are CUT roughly in half. The enabler is the
  **VOXEL BATCHER** (`inkMat`/`bakeGeo`/`mergeParts`/`voxBatch`, after `ocyl`): every STATIC
  voxel inside one rigid group now bakes into ONE merged vertex-colored MeshToonMaterial
  mesh + ONE merged BackSide ink shell per outline color (vertex colors ride the same
  sRGB→linear path material colors do → pixel-identical toon shading; ink materials are
  never mutated → one shared material per outline color deck-wide; each merged fill keeps
  its OWN material so the scene-6 traverse dim still hits each mesh exactly once). Only
  what animates (eyes, lamps, pips, red accents, the wheel, the dial) stays a live mesh.
  - **Per asset**:
    · **VAULT** (`makeVault`) — rebuilt on the batcher (~65 meshes → ~12 draws) AND
      machined: plinth corner feet, 3 crown ribs, recessed door-plate seams, a slatted
      side intake grille, the keypad's conduit run + clamps, crossed back braces, a
      4-bolt ring on the door boss; the 8 corner studs merged to ONE mesh; the wheel
      (rim+spokes) merged to 2 draws. Footprint/anchor/API byte-compatible.
    · **GUARDIAN** — batched per rigid group (~140 draws → ~27) + axle end caps, shin
      plate screws, side-plate/backpack/head-panel bolts, pauldron rivets, a chin seam.
    · **AGENT** — batched (~115 → ~24) + thigh pistons, waist-ring notches, sternum
      screws, yoke bolts, ear-pod rim lips, chin notches, calf vents.
    · **INTRUDER** — batched (~120 → ~27) + belt pouches, back cloak ribs, hood-flap
      stitching; the red smoulder accents, eyes and swarm untouched (threat = contrast).
    · **CAGE** (`makeCage`) — scene 9's one-off depth kit (inner counter-rotating shell,
      additive facet skin, vertex studs) PROMOTED into makeCage, hidden by default:
      scene 9 just switches it on (same drives, byte-equal look), the MANDATE cage now
      wakes it with the snap, AUTONOMOUS runs a faint counter shell.
    · **SCOPED KEY** (s6+s9) — a lit blue octahedron core inside the wire cut + a fine
      spinning collar: machined, not schematic. (The stolen GHOST copy stays bare.)
    · **MARKET TOKENS** (s5) — a 36-tooth REEDED EDGE merged to one mesh per token,
      riding rimM so the lock flare/loser dim light the reeding with the rim.
    · **MARKET COLUMNS** (s8) — skyline trim (4 corner ribs + 4 floor bands + roof lip)
      merged to ONE mesh per pillar on one shared material: engineered towers.
    · **HARBOR GATES** — s8's landing torus gains 10 merged mooring clamps on hPadM;
      s10's USYC gate gains 12 mooring cleats + a fine outer guide band on torusM, so
      the settle flare lights the machining exactly like the rings.
    · **LEDGER (s6)** — deliberately untouched: the Flex GLB is the real product shot;
      the mandate's craft went into the key, cage and vault it stands beside.
  - **DRAW CALLS** (P HUD, whole frame incl. 4 bloom passes; R23 baseline ~510 on s8):
    s8 AUTONOMOUS **~225–235** (−54%) · s2 wall 278 (now the deck max) · s9 robbery 117 ·
    s10 harbor 143 · s5 scope 137 · s6 mandate 81 · s12 close 75 · s4 65 · s3 59 · s1 49 ·
    s11 42. `r24_perf_hud` = chip live over s8 ("6 FPS · 167.2 ms · 235 calls", software GL).
  - **Verified (screenshots, .shots/)** — cast turntables `r24_cast_guardian/agent/
    intruder/vault` (merged rigs pixel-faithful, identity intact, new greebles read as
    engineering); in-scene `r24_s01_hook`, `r24_s05_emblems` (reeded edges legible after a
    +.02r proudness fix), `r24_s06_mandate` (cage depth + machined key + Flex GLB intact),
    `r24_s08_markets`/`r24_s08_haven` (tower trim + clamps), `r24_s09_thief`/`r24_s09_revert`
    (cage kit + key), `r24_s10_harbor` (cleated gate), `r24_s12_close`. CDP hash-sweep of
    all 11 3D scenes: zero console errors. Real-time `?auto=1` run: all 12 on the DUR
    schedule, rests on 12, zero console errors. Facts 7/7 grep-identical (6 addresses/txs
    + URL, 1 hit each). Scene 7 (LIVE DEMO) byte-untouched. `node --check` clean.
  - **Honest residuals**: true fps still unmeasurable headless (software GL) — but at
    ~225 max calls the 120fps budget now has ~2× headroom vs R23; s2's dashboard WALL
    (112 per-panel meshes) is now the deck's call ceiling (278) — per-shell merged wall
    or instanced panels is the obvious R5 target, along with the s2/s5 storm/noise
    instancing already in place; the R24 machining is tuned at deck distance — extreme
    ?cast close-ups show tiny seams intersecting (by design, voxel language); reeded
    edges brighten with rimM on the lock flare (intended, verified not blown out).

- **R25** (2026-09-12): DONE — round 3 of the detail+performance push: the R24 CLUTTER AUDIT
  (step 1, mandated) and CONNECTIVE TISSUE between hero and backdrop (step 2).
  - **AUDIT (before anything was added)** — all 8 R24-touched scenes re-screenshotted at
    their hero beats (`r25a_s03_void/sprint · s05_lock/volley · s06_snap/flex · s08_flow/
    settle · s09_revert/grab/thief · s10_cross/settle · s11_proof · s12_close`): **verdict
    CLEAN, zero dial-back.** The machining reads as precision engineering at deck distance —
    silhouettes intact, no asset noisy or busy. (The dark box by s8's SCOUT ticker row was
    checked against `r24_s08_haven`: pre-existing — the haven disc edge-on behind the
    translucent DOM row, not R24 clutter.)
  - **CONNECTIVE DETAIL, per scene** (all in the existing glow-sprite/line language, all
    build-time rng → runtime pure functions of (t,ph), zero per-frame allocations, only
    the active set animates; scene 2 — the 278-call ceiling — deliberately got NOTHING):
    · **s1 HOOK** — the calm breath: 6 cyan motes rise slowly off the guarded safe
      (`makeRisers`, the new shared helper after hideMotes) — bookends s12's night. +6 draws.
    · **s4 VOICE** — the words pour IN: an 8-mote cyan spiral drains into the orb, gated
      by the YOU speech envelope only (the reply already answers through waveform + rings;
      no mirror stream — one direction, one meaning). +8 draws while YOU speaks, else 0.
    · **s5 SCOPE** — the READ made visible: 6 sample-motes stream from the market under
      the reticle back into the agent (graphscout pulling live risk out of the wall),
      following the reticle's own sweep schedule (moon→aave→comp with the same eased
      handoffs as scopeStep), dying at lock. +6 draws during the sweep.
    · **s6 MANDATE** — the boundary, DRAWN: a still ticked survey ring (r3.42 circle +
      36 merged tick marks, majors every 90°) stays stamped on the floor under the cage
      after the snap pulse dies — the mandate reads as a measured perimeter. +2 draws.
    · **s8 AUTONOMOUS** — yield, visible: 7 cyan motes tick UP off the invested market's
      roof (money working), re-parking Compound→Aave on the ROTATE beat (same eased clock
      as the rotation) and dying with the evacuation window. +7 draws while invested.
    · **s9 ROBBERY** — the exfil VECTOR: a thin red intent line grows from the boundary
      wall toward the OUTSIDE address while the thief flings — the REVERT kills it
      mid-air, so denial and destination read in one glance. +1 draw during the surge.
    · **s10 HARBOR** — approach lights: 3 beacons on the last stretch of the CCTP arc
      blink in sequence TOWARD the gate (landing guidance), lit once the crossing runs.
      +3 draws.
  - **DRAW CALLS** (P HUD over CDP, whole frame incl. bloom, two samples/scene): s1 55 ·
    s2 **278 (deck max, unchanged)** · s3 74–155 · s4 65–181 (ghost-wall beat, pre-existing)
    · s5 147–164 · s6 59–72 · s7 **0** (R22 gate intact) · s8 241–243 (R24 ~235; +7 = the
    risers) · s9 116–197 · s10 52–140 · s11 42 · s12 75. Ceiling unmoved; every scene keeps
    R24's ~2× headroom vs the R23 510 baseline.
  - **Verified** — `node --check` clean on the extracted inline script; new-detail shots
    `r25_s01_breath · s04_intake · s05_readstream · s06_ring(+zoom crop: ticked ring
    confirmed on the floor) · s08_earn/rotate · s09_exfil · s10_beacons`; real-time
    `?auto=1` CDP run: all 12 scenes land on the DUR schedule, rests on 12, ZERO console
    errors/exceptions; facts 7/7 grep-identical before+after (6 addresses/txs + URL, one
    hit each); scene 7 (LIVE DEMO) byte-untouched (`addSet(6,()=>{return()=>{}})` +
    empty-stage path verified, gate still holds 0 calls).
  - **Honest residuals**: real fps still unmeasurable headless (software GL, 3–8 fps —
    the user must press P on the live GPU); the new motes are deliberately whisper-quiet
    (op .10–.5 envelopes) — they read as ambient life in motion but are near-invisible in
    a single still (intended: restraint beat decoration); s2's 278-call dashboard wall
    remains the obvious R5-round instancing target (per-shell merge or instanced panels),
    and the s2/s5 noise fields after that.

- **R26** (2026-09-12): DONE — round 4 of the detail+performance push: lighting, material and
  color COHESION. A deliberately surgical round — the before-audit (8 scenes re-screenshotted
  first, `.shots/r26pre_*`) showed a deck already clean, so R26 is uniform/color work ONLY:
  zero new geometry, zero new lights, zero new draws.
  - **BLOOM, made hue-fair** (the real find of the round): the POST threshold keyed on pure
    luma — cyan's luma weight (.72 G-heavy) let safe-cyan bloom ~10× richer than the SAME
    energy of danger-red (.21) or money-blue (.07), so the deck's two other semantic hues
    always read flatter than cyan. The knee now blends **35% max-channel** into the luma
    (`l=mix(l,max(c.r,max(c.g,c.b)),.35)`) and rises `.20/.80 → .22/.82`: red flares (REVERT,
    depeg) and blue flows (CCTP beacons, comet streams, the scoped key) bloom in their own
    hue at cyan's richness, while neutral WHITES come out a hair TIGHTER — the anti-haze
    direction. Verified: s10's beacon trail reads jewel-like (was flat dots), the s6/s9 key
    core carries a real blue halo, s2's white dashboard wall is unchanged-to-crisper, s12's
    three lights are tighter cores. No scene reads hazier.
  - **SEMANTIC RIM LIGHT** (`RIMTINT[12]` + one `rimL.color.lerp` next to the fog smoothing):
    the R1c film rim (one global 0xaac3ff blue-steel forever) now carries each scene's
    meaning — **cyan-steel** 0x9fd8e6 for the safe rooms (s1/s5/s6/s11/s12), **blue-steel**
    0x9caeff for AI/flow (s2/s4/s8), **red-steel** 0xe0a396 for danger (s3/s9), the base
    steel for the split harbor (s10) and the empty demo stage (s7). Every lit hero (cast,
    vault, tokens, towers, gates) wears a quiet edge in its room's tint and separates from
    the R23 shells; same smoothing constant as the fog so cuts grade over ~1.5s. `?cast` QA
    keeps the neutral rim (frame() returns before the lerp).
  - **WARM KEY ON THE SAFE** (`makeVault` pl 0xffffff → 0xffeedd): the vault's own point
    light runs whisper-warm against the cool rim — the classic warm-key/cool-rim split, and
    it lands the palette rule "warm/neutral = structure": the safe is the home the money
    returns to. Same position/intensity, so it reads as grading, not a second source. The
    global key, fill, hemi and the Flex product rig stay white (Ledger stays neutral).
  - **PALETTE DISCIPLINE**: scene 9's OUTSIDE cross was the one off-palette prop left —
    muddy 0xcc6666 → the deck's danger **RED** (opacity .55→.48 keeps its screen value).
    Audited and deliberately KEPT: the s10 storm's fire-family oranges (ff8a70/ff7a5c —
    red-family heat, not decoration), the USDC coin's brand blues, the agent's pale-blue
    volley tracers (R12), all canvas-text reds/teals.
  - **DRAW CALLS** (P HUD over CDP, whole frame incl. bloom, two samples/scene): s1 52-54 ·
    s2 **254-274 (deck max, unchanged)** · s3 55-78 · s4 99-165 · s5 164 · s6 59 · s7 **0**
    (R22 gate intact, 60fps decode-only) · s8 236-241 · s9 116-132 · s10 50 · s11 42 ·
    s12 75. **Delta vs R25: zero** — every change is a uniform, a shader constant or a
    material color.
  - **Verified** — `node --check`-equivalent (vm.Script) clean on the extracted inline
    script; after-shots `r26_s01/s03/s05/s06/s08/s09/s10/s12` + targeted A/B beats
    `r26_s02_wall` (white-heavy: no haze), `r26_s04_voice`, `r26_s05_lock`, `r26_s06_flex`
    (matches the R25 canonical frame + richer key glow) + `r26_perf_hud`; CDP sweep of all
    12 scenes: ZERO console errors (only the pre-existing three.js r150 deprecation
    warning, present since R1); perf chip off-by-default → P live → P off again; facts 7/7
    grep-identical before+after (6 addresses/txs + URL, one hit each); scene 7 set
    byte-identical (`addSet(6,()=>{return()=>{}})`).
  - **Honest residuals**: real fps and TRUE bloom appearance still need the live GPU —
    swiftshader renders the same math but the half-float blur chain can differ subtly in
    the darks (the user should eyeball s9/s10 red/blue halos live and press P for real
    numbers); shot.sh's virtual-time budget lands on slightly different beats run-to-run
    (mp4 preload consumes budget under load), so before/after pairs compare LOOKS, not
    identical frames — the ?capture clock remains the byte-deterministic path; the rim
    lerp means a scene entered mid-cut carries ~1.5s of the previous room's tint
    (intentional — reads as grading); s2's 278-call wall instancing remains the R5-round
    target.

- **R27** (2026-09-12): DONE — the **LIVE DEMO scene is REMOVED**: the real demo video is
  being stitched in externally during the edit, so the deck no longer contains or references
  it at all. R21 + R22 are reversed; the deck is back to **11 scenes (~3:54 in ?auto)**:
  1 HOOK · 2 DATA OVERLOAD · 3 NO SAFETY NET · 4 VOICE · 5 THE SCOPE · 6 THE MANDATE ·
  7 AUTONOMOUS · 8 CAN'T BE ROBBED · 9 SAFE HARBOR · 10 PROOF · 11 CLOSE. **Every R23-R26
  improvement on the surviving scenes is preserved** (env shells/stars, hero machining +
  voxel batcher, connective motes/lines, hue-fair bloom + semantic rim + warm vault key,
  the P perf HUD).
  - **Removed**: index 6 from every per-scene array (SLIDES/CAPS/DURS/FOGD/LAYERCFG/FLASHC/
    SHOTS/RIMTINT — all back to length 11; LOOPS=DURS follows); the empty demo-stage
    `addSet(6)` with sets 7-11 shifted down to 6-10 (their `LOOPS[n]` reads renumbered);
    the `#demoWrap/#demoPhone/#demoVid` DOM + its whole CSS block (`.demoSide/.dsh/.dsl`);
    the `assets/livedemo.mp4` reference (file left on disk); the applyLayers `demo:1`
    play/pause/rewind path + the `if(CAP)demoVid.muted` guard; the layerStep `cur===6`
    ?capture scrub branch; the R22 `demoDrawn/demoHold/draw3d` render gate — `frame()`
    draws normally every frame for all scenes again, and the perf sampler reads
    `renderer.info.render.calls` unconditionally.
  - **Renumbered**: slide `n:` 008-012 → 007-011 with their "// NN · NAME" HUD labels;
    layerStep flash beats 7/8/9 → 6/7/8; digit-jump `0` = scene 10 (PROOF) again; notes
    panel `#1…#11` / rests-on-11 (~3:54); header changelog (R21/R22 entries dropped, R27
    added, "11 cinematic scenes"); render.sh `LAST=11` + ETA base 236s + comments;
    shot.sh usage 1-11.
  - **Verified**: inline script compiles clean (`new vm.Script` on the extracted block);
    all 8 per-scene arrays measured at length 11; live-DOM probe: **11 progress dots**,
    zero `<video>` elements; `demoVid/demoWrap/livedemo` grep-clean in code; facts 7/7
    grep-identical before+after (6 addresses/txs + URL, one hit each). Screenshots
    (.shots/): the seam `r27_s06_mandate` (// 06 · 006, table + Flex GLB + cage) and
    `r27_s07_autonomous` (// 07 · 007, ticker + tx chip + haven gate) prove the renumber
    is clean, plus `r27_s01_hook · s05_scope · s09_harbor · s11_close` — R23 environments,
    R24 machining, R25 beacons and the R26 grade all intact, dots tracking 11.
  - **Honest residuals**: `assets/livedemo.mp4` + `assets/livedemo_hevc_orig.mp4` remain on
    disk by request (unreferenced); SCRIPT.md still describes the older narration order;
    scene numbers in R21-R26 entries above refer to the historical 12-scene layout.

- **R28** (2026-09-12): DONE — the SMOOTHNESS pass (120fps target): **every decorative
  per-asset glow-sprite/halo QUAD is REMOVED** — big transparent additively-blended quads
  were the deck's fillrate/overdraw ceiling — the bloom post pass is trimmed hard, one
  remaining static merge landed, and the hot loops now allocate nothing. Content, story,
  beats, timing, camera and all controls untouched (11 scenes, ?auto/?chrome/?capture/
  P HUD/render.sh/shot.sh intact).
  - **GLOW REMOVED (P1)** — deleted outright or left as never-added API stubs (zero draws,
    zero fillrate; property writes still land harmlessly where scenes drive them):
    · **vault** — the s*2.7 behind-halo (biggest single quad in the deck, one per vault ×5
      scenes), the door-seam halo, the keypad-lamp halo (the additive seam torus and the
      blinking lamp chip carry those reads now);
    · **cage** — the r*3.1 boundary halo in every cage scene (s6/s7/s8);
    · **cast** — guardian eye halos ×2, heart halo, antenna-tip halo; agent visor halo +
      chest-core halo; intruder eye-slit halos ×2 (eyes/heart/pips stay bright MeshBasic);
    · **sparks** — the per-spark 2.3u halo (a burst used to stack up to 70 additive quads);
    · **markets** — the three r*2.7 token halos (s5) — compensated with a touch more
      emissive on body (.02→.035 base) and rim (.17→.23 base): the "lit" read at zero cost;
    · **towers** (s7) — the 1.6u rooftop glow quads become SMALL additive lamp spheres
      (same beat-driven opacity, same beacon read, a fraction of the fill);
    · **harbor gates** — s7's 2.9u gate aura + 3-quad beam column (hIn emissive .34→.40
      comp); s9's USYC heart quad (torus emissive .3→.34 base, settle .2→.24);
    · **keys** (s6+s8) — the 1.2-1.3u key halos (lit octahedron core .34→.45);
    · **orb** — the r*3.4 core glow quad (4.6-5.1u in voice/proof!) becomes a SMALL
      additive core sphere (child index kept — the voice tint still lands);
    · **atmosphere quads** — s3's void mist (4× 6-9.4u), s4's 3.6u pedestal + 5.4u speech
      aura, s8's 3.1u threat rim + 3.4u impact flash, s9's 7 storm-haze quads (3.4-6u) +
      the 8.5u storm core. Where a removed piece sat mid-rng-sequence (s3 mist, s9 haze)
      the cursor is burned (20/42 calls) so every downstream scatter is byte-identical.
    · **KEPT deliberately** (they ARE content, small quads): comet/tracer heads+streaks,
      the R25 connective motes (breath/intake/read/yield/beacons), embers/spray/coins,
      s10 drift, s11's three sponsor lights, the shared star-field Points (1 draw), and
      all emissive materials.
  - **BLOOM TRIMMED (P2)** — with the halos gone the threshold field is nearly empty, so
    the blur chain drops **1/4 → 1/8 res** (4× fewer blurred pixels/frame) and the
    composite weight drops **.5 → .3**: a whisper halo on real emissive reads, and the
    anti-haze direction the deck already wanted. The R26 hue-fair knee is untouched;
    full-res MSAA scene target + composite stay (they are the AA and the grade).
  - **DRAW CALLS + CPU (P3)** — R24's voxel batcher had already merged the cast/vault/
    tower rigids; this round: s3's 5 rail posts + 4 rails merge to ONE mesh on railM
    (stubs stay live — they swing). Per-frame allocation kill: streamMotes/streamComets
    now `getPoint/getTangent` into scratch vectors (42 Vector3/frame in s9 alone),
    s7's scout-ping and s9's rider path likewise, s8's thief hover/orbit vectors and
    s6's signature-path array are scratch now. rAF confirmed uncapped; only the active
    set updates + renders (R9 gate intact).
  - **DRAW CALLS, before → after** (P HUD over CDP, same beats, whole frame incl. bloom,
    two samples): s1 55/53→**48/46** · s2 268/326→**259/261** · s3 58/60→**42/44** ·
    s4 70/44→**62/38** · s5 137/137→**128/128** · s6 83/83→**72/72** · s7 211/176→
    **199/164** · s8 117/116→**104/103** · s9 156/101→**130/93** · s10 42/42→**38/38** ·
    s11 75/75→**66/66**. Frame-time on software GL (a fillrate proxy) fell ~8-18%
    everywhere (s6 171→147ms · s7 145→120 · s3 120→97 · s10 97→87); the real-GPU win is
    larger still, since what was removed is pure additive overdraw + a 4×-lighter blur
    chain. TRUE fps must be read by the user on the live GPU via **P**.
  - **Verified** — `new vm.Script` compile clean on the extracted inline script; CDP sweep
    of all 11 scenes with the P HUD live: ZERO exceptions/console errors; facts 7/7
    grep-identical before+after (6 addresses/txs + URL, one hit each); 13 screenshots
    (.shots/): `r28_s01_hook · s02_wall · s03_sprint/s03_dive (motion pair 1) ·
    s04_voice · s05_lock · s06_mandate · s07_invest/s07_settle (motion pair 2) ·
    s08_revert · s09_crossing · s10_proof · s11_close` — every scene still reads dark-
    premium, not flat: emissives, line-work, env shells and the R26 rim carry the depth.
  - **Honest residuals**: the look IS drier up close — the most visible losses are s8's
    intruder (no red aura behind the swarm; edges/slits/accents still strobe) and the
    vault's soft cyan aura in s1/s2 (the seam ring + warm key still lift it) — judged
    acceptable against the smoothness mandate, and the user should eyeball s8 live;
    s2's 112-panel dashboard wall (~260 calls) remains the draw-call ceiling — panels
    animate independently so a rigid merge can't take it (instancing with per-instance
    fade channels is the only remaining lever); the never-added stub sprites cost a few
    KB of memory by design (zero draws); real fps still needs the live GPU (software GL
    renders ~7-12fps headless). (shots in .shots/final_s01…final_s10)
| scene | beat (tl) | verdict |
|---|---|---|
| 01 HOOK | 8 | pass — cube ramp + blooming studs, grade subtle |
| 02 DATA OVERLOAD | 8 | pass — eye-of-storm dive, no parked blur bar, tickers legible |
| 03 NO SAFETY NET | 15.5 | pass — void shot: cliff mass, coins over the rim, comet-trailed node |
| 04 THE SCOPE | 23 | pass — lock + hit afterglow, ranked rows, storm dimmed behind |
| 05 THE MANDATE | 6 | pass — Flex screen readable, mandate cage snapping in, SIGN ONCE |
| 06 AUTONOMOUS | 14 | pass — retreat streaks into the woken gate; left frame edge clean |
| 07 CAN'T BE ROBBED | 10 | pass — REVERT/onlyOwner blooms, mass recoils, table verbatim |
| 08 SAFE HARBOR | 10 | pass — CCTP arc over the void, sea facets, USYC ring |
| 09 PROOF | 10 | pass — 6 receipts + URL byte-identical, orb steady behind |
| 10 CLOSE | 9.5 | pass — wordmark, three quiet lights, cube in lower third |

## Loop protocol
Each round: Fable improves the top backlog items to the bar, screenshots EVERY touched scene, self-
critiques, iterates within the round. Orchestrator (main) reviews screenshots, ticks/□ the backlog,
adds new gaps, launches the next round. Repeat until 23:00 IST, then finalize + report.
