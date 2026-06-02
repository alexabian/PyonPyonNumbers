// ─── Emoji groups ───────────────────────────────────────────────────────────
export const EMOJI_GROUPS = {
  rabbits:  ['🐰', '🐇'],
  fruit:    ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🍌', '🍉'],
  animals:  ['🐱', '🐶', '🐸', '🐧', '🦊', '🐻', '🐼'],
  food:     ['🍕', '🍩', '🍪', '🧁', '🍦', '🍫', '🌮', '🥐'],
  nature:   ['🌸', '🌻', '🌈', '⭐', '🌙', '☀️', '🍄', '🌿'],
  vehicles: ['🚗', '🚂', '✈️', '🚀', '🚲', '⛵', '🚁', '🏎️'],
}

export function pickEmoji() {
  const keys = Object.keys(EMOJI_GROUPS)
  const group = EMOJI_GROUPS[keys[Math.floor(Math.random() * keys.length)]]
  return group[Math.floor(Math.random() * group.length)]
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function distractors(correct, min, max, count = 2) {
  const set = new Set()
  let tries = 0
  while (set.size < count && tries < 200) {
    tries++
    const delta = Math.floor(Math.random() * 3) + 1
    const candidate = Math.random() < 0.5
      ? clamp(correct + delta, min, max)
      : clamp(correct - delta, min, max)
    if (candidate !== correct) set.add(candidate)
  }
  return [...set]
}

// ─── Module 1: Number Recognition ───────────────────────────────────────────
// Type A: show numeral, pick group of emoji
// Type B: show group of emoji, pick numeral
export function generateM1Questions(stage) {
  const max = stage === 1 ? 10 : 20
  const pool = []
  for (let n = 1; n <= max; n++) {
    const emoji = pickEmoji()
    // Type A
    const wrongCountsA = distractors(n, 1, max)
    pool.push({
      type: 'M1A',
      numeral: n,
      emoji,
      correct: n,
      choices: shuffle([n, ...wrongCountsA]),
    })
    // Type B
    const wrongCountsB = distractors(n, 1, max)
    pool.push({
      type: 'M1B',
      numeral: n,
      emoji,
      correct: n,
      choices: shuffle([n, ...wrongCountsB]),
    })
  }
  return pool
}

// ─── Module 2: Counting ──────────────────────────────────────────────────────
export function generateM2Questions(stage) {
  const max = stage === 1 ? 10 : 20
  const pool = []
  for (let n = 1; n <= max; n++) {
    const emoji = pickEmoji()
    const wrongs = distractors(n, 1, max)
    pool.push({
      type: 'M2',
      count: n,
      emoji,
      correct: n,
      choices: shuffle([n, ...wrongs]),
    })
  }
  return pool
}

// ─── Module 3: More or Fewer ─────────────────────────────────────────────────
// answer: 'left' | 'right' | 'same'
export function generateM3Questions(stage) {
  const max = stage === 1 ? 10 : 20
  const pool = []
  // unequal pairs
  for (let a = 1; a <= max; a++) {
    for (let b = 1; b <= max; b++) {
      if (a === b) continue
      const emoji = pickEmoji()
      pool.push({
        type: 'M3',
        left: a,
        right: b,
        emoji,
        correct: a > b ? 'left' : 'right',
        choices: ['left', 'right', 'same'],
      })
    }
  }
  // equal pairs (fewer, so pad)
  for (let n = 1; n <= max; n++) {
    const emoji = pickEmoji()
    pool.push({
      type: 'M3',
      left: n,
      right: n,
      emoji,
      correct: 'same',
      choices: ['left', 'right', 'same'],
    })
  }
  return pool
}

// ─── Module 4: Number Order ──────────────────────────────────────────────────
// Book source: Lessons 1-2 (1-more/1-less within 20), Lesson 10 (count in 2s, 5s, 10s to 100)
export function generateM4Questions(stage) {
  const pool = []
  if (stage === 1) {
    // forward gap 1, within 1..20 — missing middle, start, or end
    for (let s = 1; s <= 18; s++) {
      const c1 = s + 1; const w1 = distractors(c1, 1, 20)
      pool.push({ type: 'M4', seq: [s, null, s + 2],    correct: c1, choices: shuffle([c1, ...w1]), direction: 'forward',  gap: 1 })
      const c2 = s;     const w2 = distractors(c2, 1, 20)
      pool.push({ type: 'M4', seq: [null, s + 1, s + 2], correct: c2, choices: shuffle([c2, ...w2]), direction: 'forward',  gap: 1 })
      const c3 = s + 2; const w3 = distractors(c3, 1, 20)
      pool.push({ type: 'M4', seq: [s, s + 1, null],    correct: c3, choices: shuffle([c3, ...w3]), direction: 'forward',  gap: 1 })
    }
    // backward gap 1, within 1..20 (book Lesson 2: "1 less than 19", "18 is 1 less than 19")
    for (let s = 3; s <= 20; s++) {
      const c = s - 1; const w = distractors(c, 1, 20)
      pool.push({ type: 'M4', seq: [s, null, s - 2], correct: c, choices: shuffle([c, ...w]), direction: 'backward', gap: 1 })
    }
  } else {
    // backward gap 1, within 1..100 (book Lesson 10: "33, 32, 31, 30, 29")
    for (let s = 3; s <= 100; s++) {
      const c = s - 1; const w = distractors(c, 1, 100)
      pool.push({ type: 'M4', seq: [s, null, s - 2], correct: c, choices: shuffle([c, ...w]), direction: 'backward', gap: 1 })
    }
    // count in 2s forward, up to 100 (book Lesson 10: "2, 4, 6, 8, 10, 12")
    for (let s = 2; s <= 96; s += 2) {
      const c = s + 2; const w = distractors(c, 2, 100)
      pool.push({ type: 'M4', seq: [s, null, s + 4], correct: c, choices: shuffle([c, ...w]), direction: 'forward', gap: 2 })
    }
    // count in 2s backward, up to 100 (book Lesson 10: counting backwards in twos)
    for (let s = 100; s >= 6; s -= 2) {
      const c = s - 2; const w = distractors(c, 0, 100)
      pool.push({ type: 'M4', seq: [s, null, s - 4], correct: c, choices: shuffle([c, ...w]), direction: 'backward', gap: 2 })
    }
    // count in 5s forward, up to 100 (book Lesson 10: "0, 5, 10, 15, 20, 25")
    for (let s = 0; s <= 90; s += 5) {
      const c = s + 5; const w = distractors(c, 0, 100)
      pool.push({ type: 'M4', seq: [s, null, s + 10], correct: c, choices: shuffle([c, ...w]), direction: 'forward', gap: 5 })
    }
    // count in 10s forward, up to 100 (book Lessons 7-8: tens and ones, 100-square)
    for (let s = 0; s <= 80; s += 10) {
      const c = s + 10; const w = distractors(c, 0, 100)
      pool.push({ type: 'M4', seq: [s, null, s + 20], correct: c, choices: shuffle([c, ...w]), direction: 'forward', gap: 10 })
    }
  }
  return pool
}

// ─── Module 5: Addition ──────────────────────────────────────────────────────
export function generateM5Questions(stage) {
  const maxSum = stage === 1 ? 10 : 20
  const pool = []
  for (let a = 0; a <= maxSum; a++) {
    for (let b = 0; b <= maxSum - a; b++) {
      if (a + b === 0) continue
      const sum = a + b
      const emoji = pickEmoji()
      const wrongs = distractors(sum, 0, maxSum + 5)
      pool.push({ type: 'M5', a, b, sum, emoji, correct: sum, choices: shuffle([sum, ...wrongs]) })
    }
  }
  return pool
}

// ─── Module 6: Shapes ────────────────────────────────────────────────────────
export const SHAPES_2D = [
  { id: 'circle',    jp: 'まる',         en: 'circle' },
  { id: 'triangle',  jp: 'さんかく',     en: 'triangle' },
  { id: 'square',    jp: 'しかく',       en: 'square' },
  { id: 'rectangle', jp: 'ちょうほうけい', en: 'rectangle' },
]
export const SHAPES_3D = [
  { id: 'sphere',    jp: 'きゅう',       en: 'sphere' },
  { id: 'cube',      jp: 'りっぽうたい', en: 'cube' },
  { id: 'pyramid',   jp: 'かくすい',     en: 'pyramid' },
]
export const ALL_SHAPES = [...SHAPES_2D, ...SHAPES_3D]

export function generateM6Questions(stage) {
  const shapeSet = stage === 1 ? SHAPES_2D : ALL_SHAPES
  const pool = []
  for (const shape of shapeSet) {
    // Type A: show shape SVG, pick name
    const wrongShapes = shuffle(shapeSet.filter(s => s.id !== shape.id)).slice(0, 2)
    const choicesA = shuffle([shape, ...wrongShapes])
    pool.push({ type: 'M6A', shape, correct: shape.id, choices: choicesA })
    // Type B: show name, pick shape SVG
    pool.push({ type: 'M6B', shape, correct: shape.id, choices: choicesA })
  }
  return pool
}

// ─── Session builder ─────────────────────────────────────────────────────────
export function buildSession(moduleId) {
  const s1 = buildPool(moduleId, 1)
  const s2 = buildPool(moduleId, 2)
  const q1 = shuffle(s1).slice(0, 5)
  const q2 = shuffle(s2).slice(0, 5)
  return [...q1, ...q2]
}

function buildPool(moduleId, stage) {
  switch (moduleId) {
    case 1: return generateM1Questions(stage)
    case 2: return generateM2Questions(stage)
    case 3: return generateM3Questions(stage)
    case 4: return generateM4Questions(stage)
    case 5: return generateM5Questions(stage)
    case 6: return generateM6Questions(stage)
    default: return []
  }
}

// ─── Nerea (age 3) — simplified content ──────────────────────────────────────
export const NEREA_SHAPES = [
  { id: 'circle',   jp: 'まる',     en: 'circle' },
  { id: 'triangle', jp: 'さんかく', en: 'triangle' },
  { id: 'square',   jp: 'しかく',   en: 'square' },
]

// Extended shape set for Nerea module 6
export const NEREA_SHAPES_EXT = [
  { id: 'circle',    jp: 'まる',           en: 'circle' },
  { id: 'triangle',  jp: 'さんかく',       en: 'triangle' },
  { id: 'square',    jp: 'しかく',         en: 'square' },
  { id: 'rectangle', jp: 'ちょうほうけい', en: 'rectangle' },
  { id: 'sphere',    jp: 'きゅう',         en: 'sphere' },
]

export function buildNereSession(moduleId) {
  let pool = []
  switch (moduleId) {
    case 1: {
      // Number recognition 1..5
      for (let n = 1; n <= 5; n++) {
        const emoji = pickEmoji()
        const wA = distractors(n, 1, 5)
        pool.push({ type: 'M1A', numeral: n, emoji, correct: n, choices: shuffle([n, ...wA]) })
        const wB = distractors(n, 1, 5)
        pool.push({ type: 'M1B', numeral: n, emoji, correct: n, choices: shuffle([n, ...wB]) })
      }
      break
    }
    case 2: {
      // Counting 1..5
      for (let n = 1; n <= 5; n++) {
        const emoji = pickEmoji()
        const w = distractors(n, 1, 5)
        pool.push({ type: 'M2', count: n, emoji, correct: n, choices: shuffle([n, ...w]) })
      }
      break
    }
    case 3: {
      // Basic 2D shapes: circle, square, triangle
      for (const shape of NEREA_SHAPES) {
        const wrongs = shuffle(NEREA_SHAPES.filter(s => s.id !== shape.id)).slice(0, 2)
        const choices = shuffle([shape, ...wrongs])
        pool.push({ type: 'M6A', shape, correct: shape.id, choices })
        pool.push({ type: 'M6B', shape, correct: shape.id, choices })
      }
      break
    }
    case 4: {
      // More or fewer — quantities 1..5
      for (let a = 1; a <= 5; a++) {
        for (let b = 1; b <= 5; b++) {
          const emoji = pickEmoji()
          const correct = a > b ? 'left' : b > a ? 'right' : 'same'
          pool.push({ type: 'M3', left: a, right: b, emoji, correct, choices: ['left', 'right', 'same'] })
        }
      }
      break
    }
    case 5: {
      // Simple addition — sums up to 5
      for (let a = 0; a <= 5; a++) {
        for (let b = 0; b <= 5 - a; b++) {
          if (a + b === 0) continue
          const sum = a + b
          const emoji = pickEmoji()
          const w = distractors(sum, 0, 8)
          pool.push({ type: 'M5', a, b, sum, emoji, correct: sum, choices: shuffle([sum, ...w]) })
        }
      }
      break
    }
    case 6: {
      // More shapes: adds rectangle and sphere
      for (const shape of NEREA_SHAPES_EXT) {
        const wrongs = shuffle(NEREA_SHAPES_EXT.filter(s => s.id !== shape.id)).slice(0, 2)
        const choices = shuffle([shape, ...wrongs])
        pool.push({ type: 'M6A', shape, correct: shape.id, choices })
        pool.push({ type: 'M6B', shape, correct: shape.id, choices })
      }
      break
    }
  }
  return shuffle(pool).slice(0, 5)
}

// ─── Module 7: Number Line ────────────────────────────────────────────────────
export const M7_MARKERS = [
  '🐰','🌟','❤️','🔺','🟡','🟦','🌸','🍎','⭐','🎈','🦋','🌈','🐸','🍄','🔶','🔷','🟢','🟣',
]

function m7PickMarkers(count) {
  const arr = [...M7_MARKERS]
  const out = []
  while (out.length < count && arr.length > 0) {
    const i = Math.floor(Math.random() * arr.length)
    out.push(arr.splice(i, 1)[0])
  }
  return out
}

function m7Distractors(correct, level) {
  const max = level === 1 ? 10 : level === 2 ? 20 : 100
  const set = new Set([correct])
  const result = []
  let tries = 0
  while (result.length < 2 && tries < 300) {
    tries++
    let delta
    if (level === 3) delta = (Math.floor(Math.random() * 3) + 1) * 5
    else if (level === 2) delta = Math.floor(Math.random() * 4) + 1
    else delta = Math.floor(Math.random() * 3) + 1
    const candidate = Math.random() < 0.5
      ? Math.min(max, correct + delta)
      : Math.max(0, correct - delta)
    if (!set.has(candidate)) { set.add(candidate); result.push(candidate) }
  }
  return result
}

function m7Positions(level) {
  if (level === 1) return [1,2,3,4,5,6,7,8,9,10]
  if (level === 2) return [1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,20]
  return [5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95]
}

export function buildM7Session(level) {
  const pool = []
  const positions = m7Positions(level)
  const max = level === 1 ? 10 : level === 2 ? 20 : 100
  const step = level === 3 ? 10 : level === 2 ? 2 : 1

  // Activity 1 — M7A: marker on line, identify the number
  for (const pos of positions) {
    const wrongs = m7Distractors(pos, level)
    if (wrongs.length < 2) continue
    pool.push({
      type: 'M7A', level, position: pos,
      marker: m7PickMarkers(1)[0],
      correct: pos, choices: shuffle([pos, ...wrongs]),
    })
  }

  // Activity 2 — M7B: target number shown, tap correct marker on line
  for (const pos of shuffle([...positions]).slice(0, 12)) {
    const wrongs = m7Distractors(pos, level)
    if (wrongs.length < 2) continue
    const emojis = m7PickMarkers(3)
    const pairs = shuffle([
      { pos, emoji: emojis[0] },
      { pos: wrongs[0], emoji: emojis[1] },
      { pos: wrongs[1], emoji: emojis[2] },
    ])
    pool.push({ type: 'M7B', level, targetNumber: pos, pairs, correct: pos })
  }

  // Activity 3 — M7C: two labelled markers, which is bigger?
  for (let i = 0; i < 15; i++) {
    const a = Math.floor(Math.random() * (max / step + 1)) * step
    let b, tries = 0
    do { b = Math.floor(Math.random() * (max / step + 1)) * step; tries++ }
    while (b === a && tries < 50)
    if (b === a) continue
    const emojis = m7PickMarkers(2)
    pool.push({
      type: 'M7C', level, left: a, right: b, markers: emojis,
      correct: a > b ? 'left' : 'right',
    })
  }

  // Activity 4 — M7D: estimate rabbit's position (Level 2 and 3 only)
  if (level >= 2) {
    const estPos = level === 2
      ? [1,3,5,7,9,11,13,15,17,19]
      : [5,15,25,35,45,55,65,75,85,95]
    for (const pos of estPos) {
      const wrongs = m7Distractors(pos, level)
      if (wrongs.length < 2) continue
      pool.push({
        type: 'M7D', level, position: pos,
        correct: pos, choices: shuffle([pos, ...wrongs]),
      })
    }
  }

  return shuffle(pool).slice(0, 10)
}
