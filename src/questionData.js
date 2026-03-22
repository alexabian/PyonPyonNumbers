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
export function generateM4Questions(stage) {
  const pool = []
  if (stage === 1) {
    // forward, gap of 1, within 1..20
    for (let start = 1; start <= 18; start++) {
      // missing middle
      const seq = [start, null, start + 2]
      const correct = start + 1
      const wrongs = distractors(correct, 1, 20)
      pool.push({ type: 'M4', seq, correct, choices: shuffle([correct, ...wrongs]), direction: 'forward', gap: 1 })
      // missing start
      const seq2 = [null, start + 1, start + 2]
      const correct2 = start
      const wrongs2 = distractors(correct2, 1, 20)
      pool.push({ type: 'M4', seq: seq2, correct: correct2, choices: shuffle([correct2, ...wrongs2]), direction: 'forward', gap: 1 })
      // missing end
      const seq3 = [start, start + 1, null]
      const correct3 = start + 2
      const wrongs3 = distractors(correct3, 1, 20)
      pool.push({ type: 'M4', seq: seq3, correct: correct3, choices: shuffle([correct3, ...wrongs3]), direction: 'forward', gap: 1 })
    }
  } else {
    // backward sequences
    for (let start = 20; start >= 3; start--) {
      const seq = [start, null, start - 2]
      const correct = start - 1
      const wrongs = distractors(correct, 1, 20)
      pool.push({ type: 'M4', seq, correct, choices: shuffle([correct, ...wrongs]), direction: 'backward', gap: 1 })
    }
    // forward gap 2
    for (let start = 2; start <= 16; start += 2) {
      const seq = [start, null, start + 4]
      const correct = start + 2
      const wrongs = distractors(correct, 1, 20)
      pool.push({ type: 'M4', seq, correct, choices: shuffle([correct, ...wrongs]), direction: 'forward', gap: 2 })
    }
    // forward gap 5
    for (let start = 5; start <= 15; start += 5) {
      const seq = [start, null, start + 10]
      const correct = start + 5
      const wrongs = distractors(correct, 1, 25)
      pool.push({ type: 'M4', seq, correct, choices: shuffle([correct, ...wrongs]), direction: 'forward', gap: 5 })
    }
    // forward gap 10
    for (let start = 10; start <= 20; start += 10) {
      const seq = [start, null, start + 20]
      const correct = start + 10
      const wrongs = distractors(correct, 1, 40)
      pool.push({ type: 'M4', seq, correct, choices: shuffle([correct, ...wrongs]), direction: 'forward', gap: 10 })
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
