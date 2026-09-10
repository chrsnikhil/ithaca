# Guardian Style Guide — "KILN"

**Warm-dark clay minimalism.** Version 1.0 · Sep 2026
Replaces the neobrutalism theme. Companion preview: `style-preview.html` (screenshot: `generated/styleguide_preview.png`).

---

## 1. The aesthetic

### Name: **Kiln**

*A kiln is where clay is fired: dark, warm, and quietly glowing.*

**Philosophy.** The app is a dim, warm workshop — and the clay figure is the only thing that's lit. Every surface is a warm charcoal that behaves like unfired clay in low light: matte, soft-edged, gently rounded. Color is sampled directly from the mascot itself — the mint of its screen-glow becomes the primary accent, the peach of its smile becomes the warm secondary, the greige of its body becomes the neutral. The UI never tries to *be* clay (no pastel puff-pastry claymorphism); it is the **stage around the sculpture** — restrained, premium, tactile only where you touch it.

**Why it fits the clay avatars.**
- The avatar clips are subject-on-black video composited with `mix-blend-mode: screen`. In a warm-dark theme, **every pixel of the app is a valid backdrop** — the blend constraint stops being a constraint and becomes the theme.
- The hero renders were lit against warm charcoal (~`#232224`). A warm-dark canvas makes the avatar look *native*, not composited — like the camera never cut away from the workshop.
- Full claymorphism (pastels + triple shadows everywhere) reads "toy / kids app" and competes with the mascot — two clay things fighting. Kiln keeps the clay-ness in **behavior** (big radii, matte dual-shadow pressables, squish on press) while the mascot keeps the spotlight.

**Why it fits a premium, trustworthy DeFi product.**
- Warm charcoal (not pure black) is the documented premium dark-mode play: lower eye strain, elevation via lighter surfaces, "deep color + dark panels feels intentional rather than like someone turned the lights off."
- Dark = vault, night-watch, guardian-on-duty. Warm = human, calm, anxiety-reducing. Mint = "safe / protected" as a brand-level semantic. Terracotta (clay pushed red) for danger keeps even the alarms inside the material world — urgent, never shrieking.
- It's an evolution of the current black+blue app, not a rebuild: same dark bones, warmer blood.

---

## 2. Color palette

### 2.1 Kiln Dark (primary theme)

Sampled relationships: `--mint` = the TV screen's glow · `--peach` = the smile · `--clay` = the body · surfaces = the render backdrop, warmed and stepped.

```css
:root {
  /* ---- canvas & surfaces (warm charcoal ramp, ~7% → 20% lightness) ---- */
  --bg:         #191512;   /* app canvas — warm espresso charcoal */
  --surface:    #211C17;   /* cards */
  --surface-2:  #2A241E;   /* elevated: tiles, segments, inputs */
  --surface-3:  #342D25;   /* highest: hover, active segment, sheet handle */
  --stage:      #131010;   /* AVATAR STAGE — darkest paint in the app */
  --scrim:      rgba(12, 9, 7, 0.68);   /* behind bottom sheets */

  /* ---- ink ---- */
  --fg:         #F3EDE4;   /* warm ivory — primary text */
  --fg-soft:    #D9D0C3;   /* secondary text */
  --muted:      #A2978A;   /* labels, captions */
  --faint:      #6E655A;   /* disabled, footer */
  --hairline:   rgba(243, 237, 228, 0.07);  /* the only "border" */

  /* ---- brand (from the mascot) ---- */
  --mint:       #7BE3CC;   /* primary accent — the screen glow */
  --mint-deep:  #4FC9AF;   /* pressed / gradients */
  --mint-ink:   #0C231E;   /* text on mint fills */
  --mint-glow:  rgba(123, 227, 204, 0.5);
  --peach:      #F2B48C;   /* warm secondary — the smile; deltas, highlights */
  --clay:       #B7A996;   /* neutral brand — the body; icons, illustration */

  /* ---- semantic ---- */
  --primary:    var(--mint);
  --safe:       var(--mint);    /* "protected" IS the brand color */
  --danger:     #E06A4E;        /* terracotta — clay pushed red-hot */
  --danger-ink: #2A0F08;
  --warn:       #EDB577;        /* amber clay */
}
```

**Rules.**
- `--stage` is the **only** surface darker than `--bg`. Everything else elevates by getting *lighter and warmer* (dark-mode elevation = lightness, not shadow).
- Never pure `#000` and never pure `#FFF` anywhere. The whites are ivory; the blacks are espresso.
- Mint is scarce: one primary action per screen, the "Protected" state, and the avatar's own glow. Scarcity is what makes it read premium instead of minty toothpaste.
- Peach is a garnish (deltas, small highlights, the smile in copy), never a fill for large areas.
- Contrast floors: `--fg` on `--surface` ≈ 13:1, `--muted` on `--surface` ≈ 5.5:1, `--mint-ink` on `--mint` ≈ 10:1. Keep body text at `--fg`/`--fg-soft`; `--muted` is for ≥12px labels only.

### 2.2 Kiln Day (optional light variant — marketing pages / future setting)

Warm plaster, not white. **The stage stays dark in both themes** (see §8 — the blend demands it; spec it as "the stage never changes theme").

```css
:root[data-theme="day"] {
  --bg:        #F1EAE0;   /* warm plaster */
  --surface:   #FAF5EC;
  --surface-2: #FFFCF5;
  --surface-3: #FFFFFF;   /* exception: highest light surface may hit near-white */
  --stage:     #171412;   /* UNCHANGED dark — avatar stage is theme-invariant */
  --fg:        #2B241D;
  --fg-soft:   #4E453B;
  --muted:     #7C7264;
  --faint:     #A99E8F;
  --hairline:  rgba(43, 36, 29, 0.08);
  --mint:      #1FA184;   /* deepened for contrast on light */
  --mint-ink:  #FFFFFF;
  --peach:     #D98B57;
  --danger:    #C94F32;
}
```

Ship Kiln Dark as the one true theme for the PWA. Kiln Day exists so the system has an answer, not because it should be default.

---

## 3. Typography

### 3.1 Family

**Primary: [Outfit](https://fonts.google.com/specimen/Outfit)** (Google Fonts, variable 100–900).
Geometric like a fintech, but with soft joins and open round counters that rhyme with clay — friendly at 600–700 without ever going Fredoka-babyish. Excellent at both 12px labels and 40px balances.

**Body alternative (if Outfit feels too display-y in long copy): [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans)** — humanist, rounded-adjacent, quieter than Nunito proper.

```css
--font-sans: "Outfit", "Nunito Sans", -apple-system, BlinkMacSystemFont,
             "SF Pro Rounded", "SF Pro Text", "Segoe UI Variable Display",
             "Segoe UI", system-ui, sans-serif;
```

**Numerals:** always `font-variant-numeric: tabular-nums` on any figure that animates or aligns (balances, deltas, stats). Keep the existing `.tnum` utility.

### 3.2 Scale (mobile-first, px / line-height / weight)

| Token       | Size | Line | Weight | Tracking | Use |
|-------------|-----:|-----:|-------:|---------:|-----|
| `display`   | 38   | 44   | 700    | −0.02em  | The balance. One per screen. tnum. |
| `title`     | 24   | 30   | 650    | −0.01em  | Sheet titles, big moments |
| `heading`   | 18   | 24   | 600    | 0        | Card headings, char name |
| `body`      | 15   | 22   | 450    | 0        | Default copy, status line |
| `body-strong`| 15  | 22   | 600    | 0        | Emphasis, action titles |
| `label`     | 12   | 16   | 650    | +0.08em  | UPPERCASE section labels |
| `caption`   | 12.5 | 17   | 500    | +0.01em  | Sublabels, roles, hints |
| `micro`     | 11   | 14   | 700    | +0.06em  | Badges, chips |

**Rules.** Weight does the hierarchy work, size stays modest (finance = composure). Never below 11px. Uppercase only at `label`/`micro` with tracking. No thin weights (<400) on dark — they shimmer.

---

## 4. Surface & elevation — the clay system

The core principle from claymorphism research, adapted for dark: **containers get outer shadow only; the full clay stack is reserved for things you press.** (Identical treatment on everything = affordance collapse.) On dark surfaces, light insets are re-derived — a whisper of warm white "sheen", never gray smudge.

### 4.1 Radii

```css
--r-lg:   28px;   /* stage card, bottom sheets */
--r-md:   22px;   /* cards */
--r-sm:   16px;   /* buttons, inputs, tiles, segments */
--r-xs:   12px;   /* nested elements inside tiles */
--r-full: 999px;  /* chips, badges, avatar wells */
```

Never below 12px on anything visible — below that, soft shadows read as flat drop-shadows, not molded material.

### 4.2 Shadow recipes (the exact values)

```css
/* Matte sheen — the "top light" of matte clay. Goes on every raised surface. */
--sheen: inset 0 1px 0 rgba(255, 244, 230, 0.05);

/* Resting card (containers: outer only + sheen) */
--shadow-rest:
  0 2px 6px -2px rgba(0, 0, 0, 0.42),
  0 12px 32px -14px rgba(0, 0, 0, 0.60);

/* Floating (bottom sheets, popovers) */
--shadow-float:
  0 4px 10px -3px rgba(0, 0, 0, 0.50),
  0 24px 56px -18px rgba(0, 0, 0, 0.72);

/* CLAY POP — full dual-inset stack, PRESSABLES ONLY (primary button, active segment) */
--clay-pop:
  inset 0 1.5px 0 rgba(255, 255, 255, 0.50),   /* top-light: inflated */
  inset 0 -3px 6px rgba(10, 45, 38, 0.28),      /* under-shade: volume */
  0 3px 8px -2px rgba(0, 0, 0, 0.35),
  0 10px 24px -10px var(--mint-glow);           /* the glow IS the drop shadow */

/* CLAY POP, neutral (secondary pressables on dark surfaces) */
--clay-pop-soft:
  inset 0 1px 0 rgba(255, 244, 230, 0.07),
  inset 0 -2px 5px rgba(0, 0, 0, 0.30),
  0 6px 16px -8px rgba(0, 0, 0, 0.55);

/* CLAY WELL — recessed: the avatar stage, inputs, inactive segment track */
--clay-well:
  inset 0 2px 12px rgba(0, 0, 0, 0.50),
  inset 0 -1px 0 rgba(255, 244, 230, 0.04);
```

**Rules.**
- Shadow color is derived from the surface (warm black, warm-white sheen) — never neutral gray, never colored except the mint glow under mint fills.
- Elevation ladder: `well (recessed)` → `bg` → `surface + rest` → `surface-2` → `surface-3` → `float`.
- Borders: none. `--hairline` (7% ivory) only where two same-color surfaces touch (e.g., sheet edge against scrim) — 1px, never 2px+.
- Materials are **matte**: no glossy gradients, no glassmorphism blur, no specular white streaks. The only permitted gradient is a ≤6% vertical lighten on mint fills and the stage's ambient radial (§8).

### 4.3 Press physics (the squish)

```css
.pressable { transition: transform 120ms var(--ease-squish); }
.pressable:active { transform: translateY(1px) scale(0.97); }
```

Animate **transform only, never box-shadow** (paint cost; the big-blur shadows stay static). The element sinks *into* the page — clay compresses; it doesn't shrink.

---

## 5. Components

All examples assume the §2 + §4 tokens.

### 5.1 Buttons

**Primary (mint clay):**
```css
.btn-primary {
  background: linear-gradient(180deg, #83E8D2, #64D6BD); /* ≤6% lighten, matte */
  color: var(--mint-ink);
  font: 600 15px/1 var(--font-sans);
  padding: 16px 24px;
  border: 0; border-radius: var(--r-sm);
  box-shadow: var(--clay-pop);
  transition: transform 120ms var(--ease-squish), filter 200ms var(--ease-smooth);
}
.btn-primary:hover  { filter: brightness(1.05); }
.btn-primary:active { transform: translateY(1px) scale(0.97); }
.btn-primary:disabled { background: var(--surface-3); color: var(--faint);
  box-shadow: var(--sheen); }
.btn-primary:focus-visible { outline: 2px solid var(--mint); outline-offset: 3px; }
```

**Secondary (raised warm clay):**
```css
.btn-secondary {
  background: var(--surface-2);
  color: var(--fg);
  padding: 16px 24px; border: 0; border-radius: var(--r-sm);
  box-shadow: var(--clay-pop-soft);
}
.btn-secondary:hover { background: var(--surface-3); }
```

**Ghost (quiet — "Auto", tertiary):**
```css
.btn-ghost {
  background: transparent; color: var(--muted);
  padding: 8px 14px; border: 0; border-radius: var(--r-full);
  box-shadow: inset 0 0 0 1px var(--hairline);
}
.btn-ghost.on { color: var(--mint); box-shadow: inset 0 0 0 1px rgba(123,227,204,.35); }
```

**Danger:** `background: var(--danger); color: #FFF4EE;` with the clay-pop stack, glow swapped to `rgba(224,106,78,.45)`. Reserve for destructive confirms inside sheets.

### 5.2 Cards

```css
.card {
  background: var(--surface);
  border-radius: var(--r-md);
  padding: 20px;
  box-shadow: var(--sheen), var(--shadow-rest);
}
```
No border, no hover lift (cards aren't pressable). Nested stat cells sit directly on the card — separated by whitespace, not boxes-in-boxes.

### 5.3 Inputs

Inputs are **wells** — you pour into clay, you don't press it:
```css
.input {
  background: var(--stage);            /* recessed = darkest */
  color: var(--fg);
  caret-color: var(--mint);
  padding: 15px 16px; border: 0; border-radius: var(--r-sm);
  box-shadow: var(--clay-well);
  font: 450 15px/22px var(--font-sans);
}
.input::placeholder { color: var(--faint); }
.input:focus { outline: none;
  box-shadow: var(--clay-well), 0 0 0 2px rgba(123, 227, 204, 0.4); }
```

### 5.4 Chips & badges

```css
.badge {           /* "Protected" */
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(123, 227, 204, 0.10);
  color: var(--mint);
  font: 700 11px/1 var(--font-sans); letter-spacing: 0.06em; text-transform: uppercase;
  padding: 7px 12px; border-radius: var(--r-full);
  box-shadow: inset 0 0 0 1px rgba(123, 227, 204, 0.22);
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%;
  background: var(--mint); box-shadow: 0 0 8px var(--mint); }  /* breathes, §6 */
```
Variants: neutral (`--clay` at 10%), warn (`--warn`), danger (`--danger`). Tint fills at 10%, text at full color, 1px inset ring at 22%.

### 5.5 Segmented control (the State picker)

Track = well, active segment = clay pop. The active segment looks physically *pulled up out of* the track:
```css
.states {
  display: flex; gap: 4px; padding: 5px;
  background: var(--stage);
  border-radius: var(--r-sm);
  box-shadow: var(--clay-well);
  overflow-x: auto;
}
.seg {
  flex: 1 0 auto;
  background: transparent; color: var(--muted);
  font: 600 12.5px/1 var(--font-sans);
  padding: 10px 14px; border: 0; border-radius: 12px;
  transition: transform 120ms var(--ease-squish), background 200ms, color 200ms;
}
.seg:active { transform: scale(0.95); }
.seg.active {
  background: var(--surface-3); color: var(--fg);
  box-shadow: inset 0 1px 0 rgba(255,244,230,.08),
              0 2px 6px -1px rgba(0,0,0,.5);
}
```
(If a state is semantically hot — alert — the active segment may tint `rgba(224,106,78,.14)` with `--danger` text.)

### 5.6 Quick-action tiles

```css
.tile {
  display: flex; align-items: center; gap: 14px;
  background: var(--surface-2); color: var(--fg);
  padding: 14px 16px; border: 0; border-radius: var(--r-sm);
  box-shadow: var(--clay-pop-soft);
  transition: transform 120ms var(--ease-squish), background 200ms;
  text-align: left;
}
.tile:active { transform: translateY(1px) scale(0.98); }
.tile img { width: 44px; height: 44px; border-radius: var(--r-xs);
  background: var(--stage); }   /* icon sits in a mini dark well */
.tile b    { font: 600 15px/20px var(--font-sans); display: block; }
.tile span { font: 500 12.5px/17px var(--font-sans); color: var(--muted); }
```

### 5.7 Bottom sheets (PayFlow / FaceIdFlow)

```css
.sheet-scrim { position: fixed; inset: 0; background: var(--scrim);
  backdrop-filter: none; /* matte world — no blur */ }
.sheet {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: var(--surface);
  border-radius: var(--r-lg) var(--r-lg) 0 0;
  padding: 10px 20px calc(20px + env(safe-area-inset-bottom));
  box-shadow: var(--sheen), var(--shadow-float);
  animation: sheet-up 380ms var(--ease-out) both;
}
.sheet-handle { width: 40px; height: 5px; margin: 0 auto 16px;
  border-radius: var(--r-full); background: var(--surface-3); }
@keyframes sheet-up {
  from { transform: translateY(24%) }
  to   { transform: translateY(0) }
}
```
Scrim fades in 240ms. Sheet content staggers 40ms/row. Primary action pinned at bottom, full-width `.btn-primary`. Face-ID success moment: the avatar (happy state) may appear *inside* the sheet on a mini stage well.

---

## 6. Motion

**Principle: everything settles like clay.** Soft mass, tiny overshoot, no hard cuts, no bounce-for-bounce's-sake. The avatar supplies the personality; the UI supplies composure.

```css
--ease-out:    cubic-bezier(0.22, 1.00, 0.36, 1);   /* entrances, reveals */
--ease-squish: cubic-bezier(0.34, 1.56, 0.64, 1);   /* press/release only */
--ease-smooth: cubic-bezier(0.40, 0.00, 0.20, 1);   /* color/opacity */
--t-press: 120ms;  --t-quick: 200ms;  --t-soft: 320ms;  --t-reveal: 560ms;
```

- **Entrances:** existing `reveal-up` stagger stays (70ms steps), retimed to `--t-reveal` with `--ease-out`; translate 14px, scale from 0.985.
- **Press:** §4.3 squish. Release springs back with `--ease-squish` (the 1.56 overshoot = the clay re-inflating).
- **Avatar state changes:** crossfade video layers 400ms `--ease-smooth` (current `AvatarStage` mechanism is correct); status line swaps with 8px rise + fade, 240ms.
- **Badge dot / "Protected":** 2.8s gentle opacity breath (1 → 0.55 → 1), `--ease-smooth`. Calm heartbeat, not blink.
- **Count-ups:** keep easeOutExpo ~1.3s; delays after card reveal.
- **Never** animate `box-shadow`, `filter: blur`, or layout properties. Transform + opacity only.
- `prefers-reduced-motion`: all entrances/count-ups snap to final; crossfades drop to 120ms.

---

## 7. Iconography & illustration

- **Icons:** rounded-stroke line icons, 1.75–2px stroke, round caps/joins (Lucide defaults fit). Color `--muted`, active `--fg` or `--mint`. No filled/duotone icon sets — the mascot owns "solid and dimensional."
- **Replace the emoji** (🌙👂💭…) in segments/status with matching rounded-line glyphs at 16px — emoji fight the premium read and render inconsistently across platforms.
- **Illustration:** only the clay renders themselves (heroes, coin, Face-ID art). Any new illustration must be the same recipe: matte clay, warm greige + mint + peach, dark charcoal backdrop, soft single-source lighting. No flat 2D vector illustration anywhere.
- **The mascot is the only glowing thing.** UI glow is limited to `--mint-glow` under primary buttons and the badge dot's 8px halo.

---

## 8. Staging the avatar (the screen-blend solution, head-on)

**Constraint:** avatar clips are subject-on-pure-black video composited with `mix-blend-mode: screen`. Screen blend adds the video's light to whatever is behind it — so any backdrop that isn't very dark washes the character out, and any backdrop lighter than the video's black level reveals the clip rectangle.

**The Kiln answer — a recessed "diorama" stage:**

1. **The whole theme is blend-safe.** Kiln Dark's lightest surface (`--surface-3`, ~20% lightness) is still dark enough that an avatar could sit anywhere. But it gets a dedicated stage anyway, because the hero deserves a set:
2. **The stage is a recess, not a lift.** `--stage: #131010` is the darkest paint in the app, treated with `--clay-well` inner shadow — it reads as a niche carved *into* the interface, a shadow-box display case. This inverts the elevation system on purpose: content floats up, the guardian's world goes *deep*. Depth = the app has an inside = your money is *inside something safe*.
3. **Set lighting, not background lighting.** One radial ambient is allowed behind the character: `radial-gradient(58% 42% at 50% 30%, rgba(123,227,204,0.07), transparent 70%)` — ≤8% opacity, positioned where the video's own screen-glow already is. Because screen blend adds panel light through the video's dark pixels, this reads as bounce-light on the character's edges (a lighting choice), not as a broken composite. A per-state accent may recolor this ambient (mint → peach for happy, terracotta at 6% for alert). **Never exceed 10% opacity behind the character's silhouette.**
4. **Feather the clip.** Kill any residual rectangle edge with a mask on the video element:
   ```css
   .avatar-video {
     mix-blend-mode: screen;
     -webkit-mask-image: radial-gradient(75% 72% at 50% 46%, #000 58%, transparent 98%);
             mask-image: radial-gradient(75% 72% at 50% 46%, #000 58%, transparent 98%);
   }
   ```
5. **Stage chrome:** radius `--r-lg` (28px), a 1px `--hairline` rim on the *inside* top edge only (the lip of the niche), the status line as a floating chip (`--surface-2`, `--r-full`) overlapping the stage's bottom edge by 50% — half in the world, half in the UI.
6. **Theme-invariance rule:** if Kiln Day ever ships, `--stage` does not flip. The stage is canonically dark in all themes, framed by its well shadow so a dark panel in a light UI reads as intentional depth, not a hole.
7. **Avatar picker thumbnails:** the hero PNGs already carry the dark backdrop — set them in circular `--stage` wells (`--clay-well`), so the PNG's own charcoal melts into the well. Active pick gets a 2px mint ring + 8px glow.

---

## 9. Spacing & layout

**Base-4 scale:** `4, 8, 12, 16, 20, 24, 32, 40, 56`.

| Token | Value | Use |
|-------|------:|-----|
| `--sp-gutter` | 16px | screen edge padding |
| `--sp-stack`  | 14px | gap between cards/blocks |
| `--sp-card`   | 20px | card internal padding |
| `--sp-row`    | 12px | gaps inside components |
| `--sp-micro`  | 8px  | icon-to-label, chip gaps |

- **Mobile-first, single column,** `max-width: 420px` centered; content column is a flex stack (current `.wrap` is right).
- Stage card is the tallest element (~46vh cap); balance card next; controls compress.
- Respect `env(safe-area-inset-*)` top and bottom.
- ≥480px: the phone column floats on `--bg` with `--shadow-float` and `--r-lg` — a device-like slab, no border.

---

## 10. Do's & don'ts

**Do**
- Keep the mascot the single brightest, most saturated, most animated thing on screen.
- Derive every new color from the mascot (greige body, mint screen, peach smile, charcoal set).
- Use lightness for elevation, wells for depth, and the full clay stack only on pressables.
- Round generously (≥12px), squish on press, settle softly.
- Keep copy warm and first-person ("I'm watching your position") — the UI is the guardian's voice.

**Don't**
- ❌ Pastel claymorphism everywhere — puffy pink cards turn a custodian of money into a toddler app.
- ❌ Pure black, pure white, neutral gray shadows, or cold blue-gray surfaces (the old `#4d8dff` blue family is retired — the avatar never wore it).
- ❌ Light panels behind or adjacent-behind the avatar (breaks screen blend). No white sheets sliding *under* the stage while translucent.
- ❌ Borders as structure. If a component needs an outline to be seen, its surface step is wrong.
- ❌ Glassmorphism blur, gloss, specular streaks, emoji-as-icons, more than one mint CTA per screen.
- ❌ Hard offset shadows (neobrutalism is retired), or animating box-shadow.

---

## 11. Component mapping (existing app → Kiln)

| Existing (Guardian.tsx / globals.css) | Kiln treatment |
|---|---|
| `.hdr` header (name/role + badge) | Transparent on `--bg`. Name → `heading` 18/600 ivory; role → `caption` 12.5 `--muted`. Keep the swap-in animation, retime to `--t-quick`. |
| `.badge` "Protected" | §5.4 mint badge with breathing dot. This is the trust anchor — always visible. |
| `.card.stage` avatar stage | §8 diorama: `--stage` fill + `--clay-well`, `--r-lg`, ambient radial per state, masked screen-blend video, status chip half-overlapping the bottom edge. Retire the hard ring pulse (`.stage-pulse`) — replace with a 6% ambient tint change per state. `ACCENTS` map switches from blue family to: idle `--mint`, listening `#9FEDDC`, thinking `--clay`, talking `--peach`, protecting `--mint`, alert `--danger`, happy `--peach`. |
| `.card.balance` | §5.2 card. "Protected balance" → `label`; value → `display` 38/700 tnum; delta chip → peach (gains can be warm, not just green); the 4 `bal-stats` → plain columns, `label` over `body-strong`, hairline between rows only if needed. "Guard: Active" stat in `--mint`. |
| `.states` + `.seg` State picker | §5.5 well-track segmented control; icons swap emoji → rounded line glyphs. |
| `.btn-ghost` "Auto" | §5.1 ghost pill; `on` state mint-ringed. |
| `.avatars .av` avatar picker | §8.7 circular stage-wells, 64px, name in `caption` under; active = 2px mint ring + glow; press squish. |
| `.nb-actions .nb-action` quick actions | §5.6 tiles (rename class `nb-*` → `tile`); clay PNG icons sit in mini `--stage` wells. |
| `.footer` tech line | `caption` in `--faint`, separators as `·`, no links styling. |
| FaceIdFlow / PayFlow overlays | §5.7 bottom sheets: `--surface`, `--r-lg` top corners, handle, staggered rows, full-width mint primary, terracotta only for destructive confirms. Success beat: happy-state avatar in a mini stage well inside the sheet. |
| `:root` motion tokens | Keep names, adopt §6 values. Existing `--ease-spring` ≡ `--ease-squish`. |

---

## 12. Sources (research trail)

- [Claymorphism — Smashing Magazine](https://www.smashingmagazine.com/2022/03/claymorphism-css-ui-design-trend/) · [LogRocket implementation](https://blog.logrocket.com/implementing-claymorphism-css/) · [Setproduct recipe & AI guidelines](https://www.setproduct.com/blog/claymorphism-design-guide) · [Superdesign: when the squish works](https://superdesign.dev/styles/claymorphism) — recipe, dark-mode re-derivation warning, "pressables-only" rule, tone-mismatch caveat.
- [Building a design system that breathes with Headspace — Figma](https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/) · [Headspace tokens](https://www.shadcn.io/design/headspace) — warm canvas + warm charcoal text philosophy.
- [Dark-mode palette guide — ColorArchive](https://colorarchive.org/guides/dark-mode-palette-guide/) · [Atmos dark-mode best practices](https://atmos.style/blog/dark-mode-ui-best-practices) — 8–14% lightness base, elevation via lighter surfaces.
- [App mascot guide 2026 — IndieRadar](https://indieradar.app/blog/app-mascot-design-guide-2026) · [Finch UX teardown](https://medium.com/@deepthi.aipm/ux-teardown-finch-self-care-app-18122357fae7) — character-driven retention/monetization.
- [Fintech UX 2026 — Fuselab](https://fuselabcreative.com/fintech-ux-design-guide-2026-user-experience/) · [Envato icon trends 2026](https://elements.envato.com/learn/icon-design-trends) — trust-first minimalism, soft-3D/multi-material premium cues.
