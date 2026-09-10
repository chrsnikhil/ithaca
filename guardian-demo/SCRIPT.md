# Guardian — Demo Day Deck · Script v1

**Format:** single-file offline HTML, persistent Three.js world (monochrome), 10 cinematic scenes.
Keyboard: →/Space next · ← prev · `N` presenter notes · `T` rehearsal timer · `F` fullscreen · `1–9` jump.
**Brand:** pure black bg, white/gray type, **Inter** + Geist Mono. Hero **alternates**: clay TV-robot
(story beats) ↔ ElevenLabs orb (technical beats), composited via `mix-blend-mode:screen` over the 3D.
**Runtime:** ~3 min 20s. Every claim shows real proof (deployed URL / on-chain tx).

Real proof assets (all verifiable):
- App: **guardian-rho-two.vercel.app**
- Base vault (Flex-owned, multi-market): `0x81AEbF68946D62FDf088579A6F6F2c587015e28A`
- Base autonomous invest tx: `0x15558852a1a59a6ff24f1fca4d80e5ad0a936fc6bd8efd0f5ce7da1f54df6e9d`
- Arc vault (Flex-owned): `0x67ef856e1a95be96aa4Cdbd7B0cF348A6C4dD808`
- Arc autonomous invest tx: `0xbd3df971d5043df3ca8523cc128dcab95402296600a94098e5a4d1d0dd08932d`
- Flex owner (root): `0xDeC312D5Fe0eaef03048BE83137f87cE7907A7Da` · Agent key: `0x975Bb943…`

---

### 1 · HOOK  (0:00, 15s) — hero: **clay avatar** (idle)
**3D world:** a single calm white wireframe vault-cube floating in black, slow drift, dust grid.
**On-screen:** `GUARDIAN.` / *"An AI that grows your money — and physically cannot lose it."*
Chips: `LIVE` · `BASE + ARC` · `SELF-CUSTODIAL` · `ETHONLINE '26`
**Narration:** "This is Guardian — an autonomous AI that puts your stablecoins to work, and physically cannot lose them. Three minutes: the problem, how we made an agent safe to trust, then the live system."

### 2 · PROBLEM ①  — DATA OVERLOAD  (0:15, 18s) — hero: **clay avatar** (thinking, overwhelmed)
**3D world:** a storm — hundreds of thin monochrome tickers/protocol shards swirling, rates flickering, too fast to read. The lone vault-cube is buried in it.
**3D assets:** instanced "data shards" (procedural planes w/ ticker text), swirling.
**On-screen (bottom captions):** `A THOUSAND PROTOCOLS` · `RATES MOVE EVERY BLOCK` · `NO HUMAN CAN WATCH`
**Narration:** "Problem one: normal wallets are drowning in data. Yields move every block across a thousand protocols. No human can watch it all — so your money sits idle, or you guess. Managing DeFi by hand is a full-time job you'll always lose."

### 3 · PROBLEM ②  — NO SAFETY NET  (0:33, 18s) — hero: **clay avatar** (alert)
**3D world:** the storm clears to a stark edge — a single bright agent-node races forward and runs off a cliff; coins tumble into the void. No net.
**3D assets:** a thin "ledge" plane, a falling-coins particle burst.
**On-screen:** `AGENTS GOT WALLETS` → `BUT NO BRAKES`
**Narration:** "So people hand it to an AI agent. But every agent wallet in 2026 is a gas pedal with no brakes — spend limits that live in software, bypassable, off-chain. One hallucination, one hack, and the funds are gone. Autonomy with no safety net is just a faster way to lose."

### 4 · SENSES — graphscout, THE SCOPE  (0:51, 30s) — hero: **orb** (listening→talking)
**THE metaphor scene.** Beat 1: an agent-node fires "shots" at a field of protocol targets and **misses** — too much context, shots scatter wide. Caption: `CONTEXT IS EVERYTHING…` → `…AND TOO MUCH IS BLINDING`.
Beat 2: a **targeting scope** drops over the view — a monochrome reticle/crosshair, vignette closes in, the noise dims. graphscout label snaps on.
Beat 3: the reticle sweeps the protocols, risk read as it passes each, then **locks** on one (Compound ★) — a clean, precise hit. The other two dim (Aave, Moonwell·watch).
**3D assets:** reticle ring + crosshair (procedural), protocol target-nodes, scan sweep.
**On-screen:** ranked list — `COMPOUND ★ healthy 82  ›  AAVE healthy 78  ›  MOONWELL watch 69` · badge `THE GRAPH`
**Narration:** "An agent buried in context can't aim — it fires blind. graphscout is the scope. It reads live, on-chain risk through The Graph, cuts the noise, and locks the agent onto the one market that's actually safe and paying. Not blind fire — targeted hits. Right now it's ranking Compound over Aave over Moonwell, live."

### 5 · THE MANDATE — Ledger  (1:21, 26s) — hero: **clay avatar** (protecting)
**3D world:** a **Ledger Flex** (clean monochrome 3D model) center stage. A signature pulse leaves the device → a glowing boundary/cage snaps around the vault-cube. The scoped agent-key materializes *inside* the cage, tethered.
**3D assets:** **Ledger Flex model** (Higgsfield or procedural — priority asset), boundary cage, tether.
**On-screen:** `SIGN ONCE` → `INVEST ≤ CAP · PROTECT → SAFE HAVEN · NOTHING ELSE` · `FACE ID + FLEX`
**Narration:** "Here's the safety net. You sign one mandate on your Ledger Flex — invest up to this much, retreat only to this safe haven, nothing else. The agent gets a scoped key that lives *inside* that boundary. Sign once; it acts for you for as long as you allow — always within your rules."

### 6 · AUTONOMOUS  (1:47, 24s) — hero: **orb** (talking) → **clay** (happy)
**3D world:** funds (bright motes) flow vault → Compound; a better market appears and they **rotate**; then a red-shift ripple = danger, and everything **retreats** to the safe haven. All inside the cage.
**On-screen:** live ticker of real actions · tx chip `INVEST 100 USDC → COMPOUND ↗`
**Narration:** "Now it just… works. It deploys your idle USDC into graphscout's pick, rotates when a safer, better market appears, and the instant danger hits — a depeg, a crash — it pulls everything to safety. No 3am panic, no signing every trade. You'll see it move money on its own — that's the whole point."

### 7 · CAN'T BE ROBBED  (2:11, 22s) — hero: **orb** (alert, hard contrast)
**3D world:** a red intruder-node grabs the agent-key and tries to fling funds to an outside address — the cage wall **flares white and rejects it** (revert), funds snap back.
**On-screen (capability table):** `deRisk → own vault ✓` · `rebalance → allowlisted only ✓` · `invest/protect → needs Flex sig ✓` · `send anywhere → ✗ onlyOwner`
**Narration:** "And the part that matters: steal the agent's key and you still can't take a cent. The contract only lets it touch the markets and the safe haven your Ledger approved. A stolen key can annoy — never steal. The Ledger is the root of trust; the hot key is disposable. That's what makes an autonomous agent safe to hand real money."

### 8 · ARC · Circle — FLEE TO SAFE HARBOR  (2:33, 26s) — hero: **clay** (protecting)
**3D world:** storm returns over the Base side; funds burn and **stream across a bridge** to a calm Arc harbor, re-forming as USDC, then settling into a steady USYC yield-ring.
**3D assets:** two "shores" (Base / Arc), a CCTP bridge arc, yield-ring.
**On-screen:** `CCTP: BASE → ARC` · Arc vault `0x67ef…` (Flex-owned, live) · Arc invest tx `0xbd3d…` · `USYC · T-BILL YIELD ON MAINNET`
**Narration:** "When the storm's bad, Guardian doesn't just retreat — it flees cross-chain to Arc, Circle's stablecoin L1, over CCTP. The same autonomous vault runs there, Flex-owned and live — here's a real invest on Arc. And on Arc mainnet the yield is USYC: tokenized T-bills. Safety and yield, on Circle's own rails."

### 9 · PROOF — IT'S LIVE  (2:59, 18s) — hero: **orb** (idle, steady)
**3D world:** the vault-cube resolves into a crisp UI frame; real screenshot of the app; tx hashes scroll past as verifiable links.
**On-screen:** `guardian-rho-two.vercel.app` · Base + Arc tx hashes · `NOT A MOCKUP — VERIFY EVERY MOVE`
**Narration:** "None of this is a mockup. It's deployed and live — arm it on your Ledger, watch it act, and verify every single move on-chain, on Base and on Arc. Today."

### 10 · CLOSE  (3:17, 15s) — hero: **clay avatar** (idle, warm)
**3D world:** the cube settles to calm; three quiet nodes light in sequence.
**On-screen:** `THE GRAPH — eyes` · `LEDGER — conscience` · `CIRCLE — safe harbor` · big `GUARDIAN.`
**Narration:** "The Graph gives it eyes. Ledger gives it a conscience. Circle gives it a safe harbor. Guardian — autonomous yield you can't lose."

---

## 3D asset list (for Higgsfield-if-authed / else procedural)
1. **Ledger Flex** model — scene 5 (priority).  2. Targeting **scope/reticle** — scene 4.
3. **Data-shard storm** — scenes 2, 4.  4. **Vault cage** + fund motes — scenes 5–7.
5. **CCTP bridge** + Base/Arc shores + USYC ring — scene 8.  6. Clay avatar clips (have) + orb (have).

## Build plan
Fable subagent builds `guardian-demo/index.html` (adapts talos-demo's engine: scene array, camera,
keyboard nav, presenter notes, rehearsal timer, film cuts). Assets in `guardian-demo/assets/`
(three.js + Inter/Geist woff2 from talos-demo; key clay clips copied from guardian/public/avatars).
Monochrome procedural Three.js world; heroes composited over it. Reviewed by me for fact accuracy.
