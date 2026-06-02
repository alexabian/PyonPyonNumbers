# Module Briefing: Number Line — ぴょんぴょん Numbers
## Add this as Module 7 to the existing ぴょんぴょん Numbers app

---

## How to use this document

Paste this alongside CLAUDE.md and DESIGN_SYSTEM.md in your Claude Code
session. This describes one new module only. Do not change any existing
modules, game logic, or visual design. Add Module 7 to the home screen
grid and wire it into the existing unlock and star system.

---

## Module identity

- Module number: 7 (added after the existing 6 modules)
- Module name (English): Number Line
- Module name (hiragana): すうじのせん
- Module emoji: 📏
- Unlock condition: complete Module 4 (Number Order) with 1 star or more
- Gradient accent bar: uses the app gradient linear-gradient(135deg, #7BC67E, #3DAA5C)
- Home screen subtitle (English): Where do numbers live?
- Home screen subtitle (hiragana): かずはどこにいる？

---

## What this module teaches

Number lines are a core Year 1 UK maths tool. Lidia's homework includes
exercises where a shape or marker points to a position on a number line
and she must identify the value, or where she must place a given number
in the correct position. This module replicates that exact experience
digitally with four activity types.

---

## Number ranges — three levels, unlocked in sequence

| Level | Range | Tick marks shown | Notes |
|-------|-------|-----------------|-------|
| 1 | 0 to 10 | Every number labelled | Easiest — all positions visible |
| 2 | 0 to 20 | Every 2 labelled (0, 2, 4…) | Must estimate odd positions |
| 3 | 0 to 100 | Every 10 labelled (0, 10, 20…) | Must estimate between tens |

Level 1 unlocks immediately. Level 2 unlocks after 2 stars on Level 1.
Level 3 unlocks after 2 stars on Level 2.
Stars are awarded per level, not per activity type.

---

## Four activity types

All four activity types appear within each level, mixed randomly per
session. Every question uses multiple choice — three buttons, one
correct answer, two plausible distractors. No typing, no dragging.

---

### Activity 1 — Which number is the marker pointing at?

A number line is drawn horizontally across the screen. An emoji marker
sits on the line at a specific position with a vertical line dropping
down from it to the number line. The position is not labelled. Lidia
must identify the value from three multiple choice buttons.

**Marker emojis** — rotate randomly through this set, one per question:
🐰 🌟 ❤️ 🔺 🟡 🟦 🌸 🍎 ⭐ 🎈 🦋 🌈 🐸 🍄 🔶 🔷 🟢 🟣

Use a mix of geometric shapes and fun objects — this matches Lidia's
homework which uses geometric shapes, while keeping the rabbit world feel.

**Distractor rules:**
- Level 1: distractors within ±3 of correct answer
- Level 2: distractors within ±4, always on existing tick marks or
  adjacent positions
- Level 3: distractors within ±15, always multiples of 5 or 10

**Hiragana prompt:** 「どのかずをさしているかな？」
**English prompt (large):** What number is it pointing at?
**English secondary (small, muted):** Tap the correct number.

---

### Activity 2 — Find the number on the line

A number is shown above the number line (e.g. "7"). Three emoji markers
are placed on the line at different positions. One is at the correct
position, two are wrong. Lidia taps the correct marker.

The markers should be visually distinct from each other — use three
different emojis per question, drawn from the set above.

**Hiragana prompt:** 「どこにあるかな？」
**English prompt (large):** Where is [number] on the line?
**English secondary (small, muted):** Tap the correct marker.

---

### Activity 3 — Which is bigger?

Two emoji markers are placed on the number line at different positions.
Both positions are labelled. Three buttons: left marker / right marker /
they are the same. Lidia taps which number is bigger.

Button labels use the actual numbers, not words — e.g. "7" not "seven".
Below each number button show a small label: bigger (おおきい) / smaller
(ちいさい) / same (おなじ) after she answers.

Never place both markers at the same position in v1 — the "same" option
is a distractor only.

**Hiragana prompt:** 「どっちがおおきい？」
**English prompt (large):** Which number is bigger?

---

### Activity 4 — Estimate the missing number

A number line is shown with some tick marks labelled and one position
marked with a 🐰 rabbit marker. The position sits between two labelled
marks. Three multiple choice buttons. Lidia taps her best estimate.

This activity only appears in Level 2 and Level 3 — it requires
understanding of spacing and estimation, which is not appropriate for
Level 1 where all numbers are labelled.

**Hiragana prompt:** 「うさぎはどこにいる？」
**English prompt (large):** About what number is the rabbit at?
**English secondary (small, muted):** Choose your best guess.

---

## Number line visual design

The number line is the hero of every screen. It must be large, clear,
and touch-friendly.

```
Layout (portrait, full width of content area):

        🐰                    ← marker emoji, 32–40px
        |                     ← thin vertical line, 2px, app green
  ──────●──────────────────   ← number line, 4px thick, dark brown #3D2B1F
  |    |    |    |    |    |  ← tick marks, major = 12px tall, minor = 6px
  0    2    4    6    8   10  ← labels in Fraunces 700, 16–18px
```

- Line colour: `#3D2B1F` (warm dark brown, matches text colour)
- Major tick marks: every labelled number, 12px tall, 2px wide
- Minor tick marks: unlabelled positions, 6px tall, 1px wide
- Number labels: Fraunces 700, `#3D2B1F`, centred below each major tick
- Marker vertical line: 2px, app green `#3DAA5C`
- Marker emoji: 32–40px, sits directly above the vertical line
- Line should have 16px padding on each side so end markers are not clipped
- On Level 3 (0–100), show every 10 as a major tick, every 5 as a minor tick

**Do not use a canvas element.** Build the number line with SVG or
flexbox/CSS so it scales cleanly across iPad and iPhone widths.

---

## Answer feedback — consistent with all other modules

- Correct: button turns success green, brief 700ms pause, auto-advance
- Wrong: button shakes, error red border, try again — do not advance
- No score shown during play
- 「せいかい！」shown on correct (small, below the line)
- Never show the correct answer after a wrong guess — Lidia must work it out

---

## Completion and stars per level

After 10 questions per level session:
- 0 mistakes: 3 stars
- 1 to 2 mistakes: 2 stars
- 3 or more mistakes: 1 star

Show the rabbit celebrating on the completion screen.
Use the shared Confetti component from DESIGN_SYSTEM.md on 3 stars only.

---

## Home screen card

Add Module 7 as the seventh card in the home screen grid.
Card content:
- Top accent bar: app gradient
- Emoji: 📏
- Title (Fraunces 700 18px): Number Line
- Hiragana subtitle (Noto Sans JP 400 12px): すうじのせん
- English subtitle (DM Sans 400 12px): Where do numbers live?
- Star rating: shows best stars earned across all three levels combined
  (max 9 stars — 3 per level)
- Lock icon overlay if unlock condition not met

---

## Scope boundary

Only add Module 7. Do not touch:
- Modules 1 through 6
- The existing star and unlock logic (extend it, do not rewrite it)
- The rabbit theme, colour palette, or any shared components
- The hiragana UI of existing modules
- localStorage structure — add new keys for module 7 alongside existing ones
  e.g. `pyonpyon_m7_l1_stars`, `pyonpyon_m7_l2_stars`, `pyonpyon_m7_l3_stars`