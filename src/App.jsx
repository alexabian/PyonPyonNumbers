import { useState, useRef, createContext, useContext } from 'react'
import { buildSession, buildNereSession, buildM7Session, shuffle } from './questionData.js'
import ShapeSVG from './ShapeSVG.jsx'

// ─── Theme context (used by shape renderers to get primary color) ─────────────
const ThemeCtx = createContext({ primary: '#C77DFF' })

// ─── Module info ──────────────────────────────────────────────────────────────
const LIDIA_MODULES = [
  { id: 1, title: 'すうじをおぼえよう', en: 'Number Recognition', emoji: '🔢', color: '#FF8C42' },
  { id: 2, title: 'かぞえてみよう',     en: 'Counting',           emoji: '✋', color: '#7BC67E' },
  { id: 3, title: 'どっちがおおい？',   en: 'More or Fewer',      emoji: '⚖️', color: '#A8D8EA' },
  { id: 4, title: 'つぎはなんばん？',   en: 'Number Order',       emoji: '📈', color: '#C9B8E8' },
  { id: 5, title: 'たしざんをしよう',   en: 'Addition',           emoji: '➕', color: '#FFCC80' },
  { id: 6, title: 'かたちをおぼえよう', en: 'Shapes',             emoji: '🔷', color: '#80CBC4' },
  { id: 7, title: 'すうじのせん',       en: 'Number Line',        emoji: '📏', color: '#7BC67E' },
]

const NEREA_MODULES = [
  { id: 1, title: 'すうじをおぼえよう', en: 'Numbers 1 to 5',  emoji: '🔢', color: '#FF6EC7' },
  { id: 2, title: 'かぞえてみよう',     en: 'Counting 1 to 5', emoji: '✋', color: '#B19CD9' },
  { id: 3, title: 'かたちをおぼえよう', en: 'Basic Shapes',     emoji: '🔷', color: '#FFB3E6' },
  { id: 4, title: 'どっちがおおい？',   en: 'More or Fewer',   emoji: '⚖️', color: '#AEC6FF' },
  { id: 5, title: 'たしざんをしよう',   en: 'Simple Addition',  emoji: '➕', color: '#FFDBA4' },
  { id: 6, title: 'もっとかたち',       en: 'More Shapes',      emoji: '🌟', color: '#C8B6FF' },
]

// ─── Themes ───────────────────────────────────────────────────────────────────
const LIDIA_THEME = {
  bg: '#FFF8EE', bgAlt: '#F0F7E6',
  primary: '#FF8C42', secondary: '#A8D8EA', lavender: '#C9B8E8',
  brown: '#3D2B1F', brownLight: '#6D4C41',
  skyTop: '#C8E6F5', skyMid: '#FFF8EE', skyBot: '#F0F7E6',
  ground: '#7BC67E', tuft: '#3DAA5C',
  progressBg: '#F0F7E6',
}

const NEREA_THEME = {
  bg: '#FFF0F9', bgAlt: '#FFE5F5',
  primary: '#FF6EC7', secondary: '#B19CD9', lavender: '#FFB3E6',
  brown: '#4A1942', brownLight: '#8B3A7E',
  skyTop: '#FFD6F5', skyMid: '#FFF0F9', skyBot: '#E8D5FF',
  ground: '#FFB3E6', tuft: '#FF6EC7',
  progressBg: '#FFE5F5',
  magic: true,
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
const PROFILES = {
  lidia: {
    id: 'lidia', name: 'Lidia', mascot: '🦁',
    storageKey: 'pyonpyon_progress_lidia',
    modules: LIDIA_MODULES, moduleCount: 7,
    allUnlocked: true,
    getStars: (w) => w === 0 ? 3 : w <= 3 ? 2 : 1,
    buildSession,
    theme: LIDIA_THEME,
  },
  nerea: {
    id: 'nerea', name: 'Nerea', mascot: '🦄',
    storageKey: 'pyonpyon_progress_nerea',
    modules: NEREA_MODULES, moduleCount: 6,
    allUnlocked: true,
    getStars: (w) => w === 0 ? 3 : w <= 2 ? 2 : 1,
    buildSession: buildNereSession,
    theme: NEREA_THEME,
  },
}

// ─── Persistence ─────────────────────────────────────────────────────────────
// Migrate old single-profile save to Lidia's key
try {
  const old = localStorage.getItem('pyonpyon_progress')
  if (old && !localStorage.getItem('pyonpyon_progress_lidia')) {
    localStorage.setItem('pyonpyon_progress_lidia', old)
  }
} catch (_) {}

function freshProgress(profile) {
  const unlocked = {}
  if (profile.allUnlocked) {
    profile.modules.forEach(m => { unlocked[m.id] = true })
  } else {
    unlocked[1] = true
  }
  return {
    stars: {},
    unlocked,
    carrots: 0,
    stats: {
      sessionsCompleted: 0,
      perfectSessions: 0,
      bestStreak: 0,
    },
    daily: {
      lastCompletedDate: null,
      streak: 0,
      bonusClaimedDate: null,
    },
  }
}

function normalizeProgress(profile, raw) {
  const fresh = freshProgress(profile)
  const normalized = {
    ...fresh,
    ...raw,
    stars: { ...fresh.stars, ...(raw?.stars || {}) },
    unlocked: { ...fresh.unlocked, ...(raw?.unlocked || {}) },
    carrots: Number.isFinite(raw?.carrots) ? raw.carrots : 0,
    stats: {
      ...fresh.stats,
      ...(raw?.stats || {}),
    },
    daily: {
      ...fresh.daily,
      ...(raw?.daily || {}),
    },
  }

  if (profile.allUnlocked) {
    profile.modules.forEach(m => { normalized.unlocked[m.id] = true })
  }

  return normalized
}

function loadProgress(profile) {
  try {
    const raw = localStorage.getItem(profile.storageKey)
    if (raw) {
      const p = normalizeProgress(profile, JSON.parse(raw))
      saveProgress(profile, p)
      return p
    }
  } catch (_) {}
  return freshProgress(profile)
}

function saveProgress(profile, p) {
  try { localStorage.setItem(profile.storageKey, JSON.stringify(p)) } catch (_) {}
}

// ─── CSS vars helper ──────────────────────────────────────────────────────────
function themeVars(t) {
  return {
    '--bg': t.bg, '--bg-alt': t.bgAlt,
    '--orange': t.primary, '--blue': t.secondary, '--lavender': t.lavender,
    '--brown': t.brown, '--brown-light': t.brownLight, '--cream': t.bg,
  }
}

function getBadgeLabel(carrots = 0) {
  if (carrots >= 160) return 'Rainbow Hopper'
  if (carrots >= 90) return 'Super Rabbit'
  if (carrots >= 40) return 'Star Finder'
  if (carrots >= 15) return 'Curious Bunny'
  return 'Little Hopper'
}

function createSessionQuests(profile, questionsLength) {
  const gentleGoal = profile.id === 'nerea' ? 3 : 2
  return [
    { id: 'finish', label: 'Finish the lesson', progress: 0, goal: 1, reward: 4, done: false },
    { id: 'streak3', label: 'Make a 3-answer streak', progress: 0, goal: 3, reward: 3, done: false },
    { id: 'steady', label: `Keep oops to ${gentleGoal} or less`, progress: gentleGoal, goal: gentleGoal, reward: 4, done: false },
    { id: 'sparkle', label: `Get ${questionsLength} carrots`, progress: 0, goal: questionsLength, reward: 2, done: false },
  ]
}

function updateQuestProgress(quests, snapshot) {
  return quests.map(quest => {
    let progress = quest.progress
    if (quest.id === 'finish') progress = snapshot.finished ? 1 : 0
    if (quest.id === 'streak3') progress = Math.min(quest.goal, snapshot.bestStreak)
    if (quest.id === 'steady') progress = Math.max(0, quest.goal - snapshot.wrongTaps)
    if (quest.id === 'sparkle') progress = Math.min(quest.goal, snapshot.sessionCarrots)
    return {
      ...quest,
      progress,
      done: progress >= quest.goal,
    }
  })
}

function buildMixedSessionForProfile(profile, m7Stars = {}) {
  const moduleMap = Object.fromEntries(profile.modules.map(mod => [mod.id, mod]))
  const highestM7Level = (m7Stars[3] || 0) >= 2 ? 3 : (m7Stars[2] || 0) >= 2 ? 2 : 1
  const deck = []

  profile.modules.forEach(info => {
    if (info.id === 7) {
      const count = highestM7Level >= 2 ? 2 : 1
      deck.push(
        ...buildM7Session(highestM7Level)
          .slice(0, count)
          .map(q => ({ ...q, sourceModuleId: 7, sourceLabel: `Number Line · Level ${highestM7Level}` })),
      )
      return
    }

    deck.push(
      ...profile.buildSession(info.id)
        .slice(0, 2)
        .map(q => ({ ...q, sourceModuleId: info.id, sourceLabel: info.en })),
    )
  })

  return shuffle(deck)
    .slice(0, 10)
    .map(q => ({
      ...q,
      sourceLabel: q.sourceLabel || moduleMap[q.sourceModuleId]?.en || 'Mixed Practice',
    }))
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getYesterdayKey(dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// ─── Background ──────────────────────────────────────────────────────────────
function Background({ theme: t }) {
  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 400 700"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.skyTop} />
          <stop offset="60%" stopColor={t.skyMid} />
          <stop offset="100%" stopColor={t.skyBot} />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#sky)" />
      <ellipse cx="200" cy="690" rx="280" ry="60" fill={t.ground} opacity="0.4" />
      {t.magic ? (
        // Unicorn sparkles instead of grass
        [[30,620],[75,640],[140,615],[195,638],[255,618],[315,635],[368,622],[110,595],[280,590],[200,570]].map(([x, y], i) => (
          <text key={i} x={x} y={y} fontSize={i % 3 === 0 ? 18 : 13} opacity={0.5 + (i % 3) * 0.15} textAnchor="middle"
            style={{ fill: i % 2 === 0 ? t.tuft : t.secondary }}>
            {['✨','⭐','💫','🌸'][i % 4]}
          </text>
        ))
      ) : (
        [30, 80, 150, 240, 310, 370].map((x, i) => (
          <g key={i} transform={`translate(${x}, 640)`}>
            <ellipse cx="0" cy="0" rx="18" ry="6" fill={t.tuft} opacity="0.3" />
            <path d="M-6,0 Q-4,-14 0,-8 Q4,-14 6,0" fill={t.tuft} opacity="0.5" />
          </g>
        ))
      )}
      {[[60, 80], [280, 110], [160, 50]].map(([cx, cy], i) => (
        <g key={i} opacity="0.5">
          <ellipse cx={cx} cy={cy} rx="38" ry="18" fill="white" />
          <ellipse cx={cx + 22} cy={cy + 4} rx="26" ry="14" fill="white" />
          <ellipse cx={cx - 20} cy={cy + 4} rx="22" ry="12" fill="white" />
        </g>
      ))}
    </svg>
  )
}

// ─── Mascot ───────────────────────────────────────────────────────────────────
function Mascot({ emoji, mood = 'neutral' }) {
  return (
    <div
      className={mood === 'happy' ? 'bounce-anim' : mood === 'sad' ? 'shake-anim' : ''}
      style={{
        fontSize: 52, lineHeight: 1,
        filter: mood === 'sad' ? 'grayscale(30%) brightness(0.85)' : 'none',
        transition: 'filter 0.3s', display: 'inline-block',
      }}
    >
      {emoji}
    </div>
  )
}

// ─── Answer button ───────────────────────────────────────────────────────────
function AnswerBtn({ children, onClick, state = 'idle', disabled }) {
  const bg = state === 'correct' ? '#7BC67E' : state === 'wrong' ? '#FF6B6B' : 'var(--bg)'
  const border = state === 'correct' ? '#4a9e52' : state === 'wrong' ? '#c0392b' : 'var(--lavender)'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={state === 'wrong' ? 'shake-anim' : state === 'correct' ? 'pop-anim' : ''}
      style={{
        background: bg, border: `3px solid ${border}`,
        borderRadius: 20, padding: '14px 18px',
        fontSize: 22, fontFamily: 'var(--font-num)', fontWeight: 800,
        color: 'var(--brown)',
        boxShadow: state === 'idle' ? '0 4px 0 var(--lavender)' : 'none',
        transition: 'background 0.2s, border 0.2s',
        minHeight: 64, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}
    >
      {children}
    </button>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total, theme }) {
  return (
    <div style={{ width: '100%', maxWidth: 340, height: 12, background: theme.progressBg, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${(current / total) * 100}%`,
        background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
        borderRadius: 8, transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

// ─── Counting field ───────────────────────────────────────────────────────────
function CountingField({ count, emoji, tapped, onTap }) {
  const W = 300, H = 260, R = 22
  // 4 cols x 5 rows — guaranteed non-overlapping (min 52px spacing, emoji diameter 44px)
  const seeds = [
    [0.367, 0.554], [0.800, 0.154], [0.150, 0.754], [0.583, 0.354],
    [0.367, 0.915], [0.800, 0.554], [0.150, 0.154], [0.583, 0.754],
    [0.367, 0.354], [0.800, 0.915], [0.150, 0.554], [0.583, 0.154],
    [0.800, 0.354], [0.367, 0.754], [0.150, 0.915], [0.583, 0.554],
    [0.800, 0.754], [0.150, 0.354], [0.583, 0.915], [0.367, 0.154],
  ]
  const positions = seeds.slice(0, count).map(([fx, fy]) => ({
    x: R + fx * (W - R * 2), y: R + fy * (H - R * 2),
  }))
  return (
    <div style={{
      position: 'relative', width: W, height: H,
      background: 'var(--bg)', borderRadius: 20,
      border: '3px solid var(--lavender)', margin: '0 auto', overflow: 'hidden',
    }}>
      {positions.map((pos, i) => (
        <button key={i} onClick={() => onTap(i)} style={{
          position: 'absolute', left: pos.x - R, top: pos.y - R,
          width: R * 2, height: R * 2,
          background: tapped.has(i) ? '#7BC67E' : 'transparent',
          border: tapped.has(i) ? '2px solid #4a9e52' : '2px solid transparent',
          borderRadius: '50%', fontSize: 24, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: tapped.has(i) ? 'default' : 'pointer', transition: 'background 0.2s',
        }}>
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ─── Number Line SVG ──────────────────────────────────────────────────────────
function NumberLineSVG({ level, markerPos, markerEmoji, extraMarkers }) {
  const max = level === 1 ? 10 : level === 2 ? 20 : 100
  const majorStep = level === 1 ? 1 : level === 2 ? 2 : 10
  const W = 340, pad = 20, lineY = 52

  function xFor(n) { return pad + (n / max) * (W - pad * 2) }

  const majorTicks = []
  for (let n = 0; n <= max; n += majorStep) majorTicks.push(n)

  const minorTicks = []
  if (level === 2) { for (let n = 1; n <= 19; n += 2) minorTicks.push(n) }
  if (level === 3) { for (let n = 5; n <= 95; n += 10) minorTicks.push(n) }

  const labelSize = level === 3 ? 11 : 13

  return (
    <svg viewBox={`0 0 ${W} 85`} width="100%" style={{ display: 'block', maxWidth: W, margin: '0 auto' }}>
      <line x1={pad} y1={lineY} x2={W - pad} y2={lineY} stroke="#3D2B1F" strokeWidth={4} strokeLinecap="round" />
      {majorTicks.map(n => (
        <g key={n}>
          <line x1={xFor(n)} y1={lineY - 6} x2={xFor(n)} y2={lineY + 6} stroke="#3D2B1F" strokeWidth={2} />
          <text x={xFor(n)} y={lineY + 18} textAnchor="middle" fontFamily="Fraunces, serif" fontSize={labelSize} fontWeight={700} fill="#3D2B1F">{n}</text>
        </g>
      ))}
      {minorTicks.map(n => (
        <line key={n} x1={xFor(n)} y1={lineY - 3} x2={xFor(n)} y2={lineY + 3} stroke="#3D2B1F" strokeWidth={1} opacity={0.5} />
      ))}
      {markerPos !== undefined && (
        <g>
          <line x1={xFor(markerPos)} y1={10} x2={xFor(markerPos)} y2={lineY} stroke="#3DAA5C" strokeWidth={2} />
          <text x={xFor(markerPos)} y={10} textAnchor="middle" dominantBaseline="hanging" fontSize={26}>{markerEmoji}</text>
        </g>
      )}
      {extraMarkers && extraMarkers.map(({ pos, emoji }, i) => (
        <g key={i}>
          <line x1={xFor(pos)} y1={10} x2={xFor(pos)} y2={lineY} stroke="#3DAA5C" strokeWidth={2} />
          <text x={xFor(pos)} y={10} textAnchor="middle" dominantBaseline="hanging" fontSize={22}>{emoji}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Module 7 question renderers ──────────────────────────────────────────────
function QuestionM7A({ q, onAnswer, answerState }) {
  const locked = !!Object.keys(answerState).length
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontFamily: 'var(--font-num)', fontWeight: 700, marginBottom: 2, color: 'var(--brown)' }}>
        What number is it pointing at?
      </p>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-jp)', color: '#888', marginBottom: 16 }}>
        どのかずをさしているかな？
      </p>
      <div style={{ padding: '0 4px', marginBottom: 20 }}>
        <NumberLineSVG level={q.level} markerPos={q.position} markerEmoji={q.marker} />
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={locked && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 30 }}>{c}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM7B({ q, onAnswer, answerState }) {
  const locked = !!Object.keys(answerState).length
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontFamily: 'var(--font-num)', fontWeight: 700, marginBottom: 2, color: 'var(--brown)' }}>
        Where is {q.targetNumber} on the line?
      </p>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-jp)', color: '#888', marginBottom: 8 }}>
        どこにあるかな？
      </p>
      <div style={{ fontSize: 52, fontFamily: 'var(--font-num)', fontWeight: 900, color: 'var(--orange)', lineHeight: 1, marginBottom: 10 }}>
        {q.targetNumber}
      </div>
      <div style={{ padding: '0 4px', marginBottom: 16 }}>
        <NumberLineSVG level={q.level} extraMarkers={q.pairs} />
      </div>
      <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Tap the correct marker.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {q.pairs.map((pair, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(pair.pos)} state={answerState[pair.pos] || 'idle'} disabled={locked && answerState[pair.pos] !== 'wrong'}>
            <span style={{ fontSize: 30 }}>{pair.emoji}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM7C({ q, onAnswer, answerState }) {
  const locked = !!Object.keys(answerState).length
  const btnData = [
    { key: 'left',  label: String(q.left) },
    { key: 'right', label: String(q.right) },
    { key: 'same',  label: 'おなじ' },
  ]
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontFamily: 'var(--font-num)', fontWeight: 700, marginBottom: 2, color: 'var(--brown)' }}>
        Which number is bigger?
      </p>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-jp)', color: '#888', marginBottom: 16 }}>
        どっちがおおきい？
      </p>
      <div style={{ padding: '0 4px', marginBottom: 16 }}>
        <NumberLineSVG level={q.level}
          extraMarkers={[
            { pos: q.left, emoji: q.markers[0] },
            { pos: q.right, emoji: q.markers[1] },
          ]}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {btnData.map(({ key, label }) => (
          <AnswerBtn key={key} onClick={() => onAnswer(key)} state={answerState[key] || 'idle'} disabled={locked && answerState[key] !== 'wrong'}>
            <span style={{ fontFamily: key === 'same' ? 'var(--font-jp)' : 'var(--font-num)', fontWeight: 900, fontSize: 26 }}>{label}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM7D({ q, onAnswer, answerState }) {
  const locked = !!Object.keys(answerState).length
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 20, fontFamily: 'var(--font-num)', fontWeight: 700, marginBottom: 2, color: 'var(--brown)' }}>
        About what number is the rabbit at?
      </p>
      <p style={{ fontSize: 13, fontFamily: 'var(--font-jp)', color: '#888', marginBottom: 16 }}>
        うさぎはどこにいる？
      </p>
      <div style={{ padding: '0 4px', marginBottom: 8 }}>
        <NumberLineSVG level={q.level} markerPos={q.position} markerEmoji="🐰" />
      </div>
      <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16 }}>Choose your best guess.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={locked && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 30 }}>{c}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

// ─── Question renderers ───────────────────────────────────────────────────────
function QuestionM1A({ q, onAnswer, answerState }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#888', fontFamily: 'var(--font-jp)', marginBottom: 6 }}>いくつの {q.emoji}？</p>
      <div style={{ fontSize: 96, fontFamily: 'var(--font-num)', fontWeight: 900, color: 'var(--orange)', lineHeight: 1.1, marginBottom: 24 }}>
        {q.numeral}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
            <span style={{ fontSize: 26 }}>{q.emoji.repeat(c)}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM1B({ q, onAnswer, answerState }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#888', fontFamily: 'var(--font-jp)', marginBottom: 10 }}>なんこ あるかな？</p>
      <div style={{ fontSize: 28, letterSpacing: 4, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
        {q.emoji.repeat(q.numeral)}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 34 }}>{c}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM2({ q, onAnswer, answerState }) {
  const [tapped, setTapped] = useState(new Set())
  const [phase, setPhase] = useState('count')
  function handleTap(i) {
    if (phase !== 'count') return
    setTapped(prev => {
      const next = new Set(prev)
      next.add(i)
      if (next.size === q.count) setTimeout(() => setPhase('answer'), 300)
      return next
    })
  }
  return (
    <div style={{ textAlign: 'center' }}>
      {phase === 'count' ? (
        <>
          <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 14, color: 'var(--brown)' }}>
            {q.emoji} を ぜんぶ おしてね！
          </p>
          <CountingField count={q.count} emoji={q.emoji} tapped={tapped} onTap={handleTap} />
          <div style={{ marginTop: 12, fontSize: 22, fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--orange)' }}>
            {tapped.size} / {q.count}
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 14 }}>ぜんぶで いくつ？</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {q.choices.map((c, i) => (
              <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
                <span style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 34 }}>{c}</span>
              </AnswerBtn>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function QuestionM3({ q, onAnswer, answerState }) {
  const btnEn = k => k === 'left' ? 'left has more' : k === 'right' ? 'right has more' : 'same'
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 16 }}>どっちが おおい？</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg)', border: '3px solid var(--lavender)', borderRadius: 16, padding: '12px 16px', minWidth: 100, fontSize: 26, lineHeight: 1.8 }}>
          {q.emoji.repeat(q.left)}
        </div>
        <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--lavender)' }}>VS</span>
        <div style={{ background: 'var(--bg)', border: '3px solid var(--lavender)', borderRadius: 16, padding: '12px 16px', minWidth: 100, fontSize: 26, lineHeight: 1.8 }}>
          {q.emoji.repeat(q.right)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 17 }}>
              {c === 'same' ? 'おなじ' : c === 'left' ? 'ひだりが おおい' : 'みぎが おおい'}
            </span>
            <span style={{ fontSize: 14, color: '#888', marginLeft: 6 }}>{btnEn(c)}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM4({ q, onAnswer, answerState }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 20 }}>つぎは なんばん？</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        {q.seq.map((n, i) => (
          <div key={i} style={{
            width: 64, height: 64,
            background: n === null ? `linear-gradient(135deg, var(--lavender), var(--orange))` : 'var(--bg)',
            border: `3px solid ${n === null ? 'var(--orange)' : 'var(--lavender)'}`,
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: n === null ? 32 : 28,
            fontFamily: 'var(--font-num)', fontWeight: 900,
            color: n === null ? 'white' : 'var(--brown)',
            boxShadow: n === null ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
          }}>
            {n === null ? '？' : n}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 32 }}>{c}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM5({ q, onAnswer, answerState }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 18 }}>こたえは いくつ？</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--bg)', border: '3px solid var(--blue)', borderRadius: 16, padding: '10px 14px', fontSize: 28, lineHeight: 1.6 }}>
          {q.emoji.repeat(q.a)}
        </div>
        <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--orange)', fontFamily: 'var(--font-num)' }}>＋</span>
        <div style={{ background: 'var(--bg)', border: '3px solid var(--blue)', borderRadius: 16, padding: '10px 14px', fontSize: 28, lineHeight: 1.6 }}>
          {q.b > 0 ? q.emoji.repeat(q.b) : <span style={{ color: '#ccc', fontSize: 22 }}>なし</span>}
        </div>
        <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--orange)', fontFamily: 'var(--font-num)' }}>＝</span>
        <div style={{
          width: 64, height: 64,
          background: `linear-gradient(135deg, var(--lavender), var(--orange))`,
          border: '3px solid var(--orange)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontFamily: 'var(--font-num)', fontWeight: 900, color: 'white',
        }}>？</div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 32 }}>{c}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM6A({ q, onAnswer, answerState }) {
  const { primary } = useContext(ThemeCtx)
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 20 }}>この かたちの なまえは？</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <ShapeSVG shapeId={q.shape.id} size={120} color={primary} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        {q.choices.map((shape, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(shape.id)} state={answerState[shape.id] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[shape.id] !== 'wrong'}>
            <ShapeSVG shapeId={shape.id} size={32} color={primary} />
            <span style={{ fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 17 }}>{shape.jp}</span>
            <span style={{ fontSize: 14, color: '#888', marginLeft: 4 }}>{shape.en}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM6B({ q, onAnswer, answerState }) {
  const { primary } = useContext(ThemeCtx)
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 10 }}>この かたちは どれ？</p>
      <div style={{ fontSize: 30, fontFamily: 'var(--font-jp)', fontWeight: 900, color: 'var(--orange)', marginBottom: 28 }}>
        {q.shape.jp}
        <span style={{ fontSize: 16, color: '#888', display: 'block', fontWeight: 400, marginTop: 4 }}>{q.shape.en}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {q.choices.map((shape, i) => (
          <button
            key={i}
            onClick={() => onAnswer(shape.id)}
            disabled={!!Object.keys(answerState).length && answerState[shape.id] !== 'wrong'}
            className={answerState[shape.id] === 'wrong' ? 'shake-anim' : answerState[shape.id] === 'correct' ? 'pop-anim' : ''}
            style={{
              background: answerState[shape.id] === 'correct' ? '#7BC67E' : answerState[shape.id] === 'wrong' ? '#FF6B6B' : 'var(--bg)',
              border: `3px solid ${answerState[shape.id] === 'correct' ? '#4a9e52' : answerState[shape.id] === 'wrong' ? '#c0392b' : 'var(--lavender)'}`,
              borderRadius: 20, padding: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ShapeSVG shapeId={shape.id} size={80} color={primary} />
          </button>
        ))}
      </div>
    </div>
  )
}

function QuestionView({ q, onAnswer, answerState }) {
  const props = { q, onAnswer, answerState }
  switch (q.type) {
    case 'M1A': return <QuestionM1A {...props} />
    case 'M1B': return <QuestionM1B {...props} />
    case 'M2':  return <QuestionM2 {...props} />
    case 'M3':  return <QuestionM3 {...props} />
    case 'M4':  return <QuestionM4 {...props} />
    case 'M5':  return <QuestionM5 {...props} />
    case 'M6A': return <QuestionM6A {...props} />
    case 'M6B': return <QuestionM6B {...props} />
    case 'M7A': return <QuestionM7A {...props} />
    case 'M7B': return <QuestionM7B {...props} />
    case 'M7C': return <QuestionM7C {...props} />
    case 'M7D': return <QuestionM7D {...props} />
    default:    return <p>？</p>
  }
}

// ─── Game screen ──────────────────────────────────────────────────────────────
function GameScreen({ moduleId, profile, onComplete, onBack, m7Level, customQuestions, customTitle }) {
  const [questions] = useState(() =>
    customQuestions || (moduleId === 7 && m7Level ? buildM7Session(m7Level) : profile.buildSession(moduleId))
  )
  const [qIndex, setQIndex] = useState(0)
  const [answerState, setAnswerState] = useState({})
  const [wrongTaps, setWrongTaps] = useState(0)
  const [mood, setMood] = useState('neutral')
  const [feedback, setFeedback] = useState(null)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [sessionCarrots, setSessionCarrots] = useState(0)
  const [quests, setQuests] = useState(() => createSessionQuests(profile, questions.length))
  const advancing = useRef(false)

  const q = questions[qIndex]
  const info = profile.modules.find(m => m.id === moduleId)
  const heading = customTitle || info?.title
  const subheading = customQuestions ? q?.sourceLabel : info?.en

  function syncQuests(snapshot) {
    setQuests(prev => updateQuestProgress(prev, snapshot))
  }

  function handleAnswer(value) {
    if (advancing.current) return
    if (value === q.correct) {
      const nextWrongTaps = wrongTaps
      const nextStreak = currentStreak + 1
      const nextBestStreak = Math.max(bestStreak, nextStreak)
      const nextSessionCarrots = sessionCarrots + 1
      const finished = qIndex + 1 >= questions.length
      const nextQuests = updateQuestProgress(quests, {
        finished,
        bestStreak: nextBestStreak,
        wrongTaps: nextWrongTaps,
        sessionCarrots: nextSessionCarrots,
      })

      advancing.current = true
      setAnswerState({ [value]: 'correct' })
      setMood('happy')
      setFeedback('correct')
      setCurrentStreak(nextStreak)
      setBestStreak(nextBestStreak)
      setSessionCarrots(nextSessionCarrots)
      setQuests(nextQuests)

      setTimeout(() => {
        advancing.current = false
        setAnswerState({})
        setMood('neutral')
        setFeedback(null)
        if (finished) {
          const questBonus = nextQuests.filter(quest => quest.done).reduce((sum, quest) => sum + quest.reward, 0)
          onComplete({
            wrongTaps: nextWrongTaps,
            bestStreak: nextBestStreak,
            carrotsEarned: nextSessionCarrots + questBonus,
            quests: nextQuests,
          })
        } else {
          setQIndex(i => i + 1)
        }
      }, 1000)
    } else {
      const nextWrongTaps = wrongTaps + 1
      setWrongTaps(nextWrongTaps)
      setCurrentStreak(0)
      setMood('sad')
      syncQuests({
        finished: false,
        bestStreak,
        wrongTaps: nextWrongTaps,
        sessionCarrots,
      })
      setAnswerState(prev => ({ ...prev, [value]: 'wrong' }))
      setTimeout(() => {
        setMood('neutral')
        setAnswerState(prev => { const n = { ...prev }; delete n[value]; return n })
      }, 600)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
        <button onClick={onBack} style={{
          background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 12,
          padding: '8px 14px', fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 16,
          color: 'var(--brown)', cursor: 'pointer',
        }}>← もどる</button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ProgressBar current={qIndex} total={questions.length} theme={profile.theme} />
        </div>
        <span style={{ fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 16, color: '#888' }}>
          {qIndex + 1}/{questions.length}
        </span>
      </div>
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <span style={{ fontSize: 14, fontFamily: 'var(--font-jp)', color: '#888' }}>{heading}</span>
        {subheading && (
          <div style={{ fontSize: 12, fontFamily: 'var(--font-num)', color: '#9b8fb6', marginTop: 4 }}>
            {subheading}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', padding: '0 16px 12px' }}>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 999, padding: '6px 12px', fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 700, color: 'var(--brown)' }}>
          🥕 {sessionCarrots}
        </div>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 999, padding: '6px 12px', fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 700, color: 'var(--brown)' }}>
          🔥 {currentStreak} / best {bestStreak}
        </div>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 999, padding: '6px 12px', fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 700, color: 'var(--brown)' }}>
          ✨ {quests.filter(quest => quest.done).length}/{quests.length} quests
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px' }}>
        {quests.map(quest => (
          <div key={quest.id} style={{
            minWidth: 132,
            background: quest.done ? 'linear-gradient(135deg, #fff7d6, #ffe7a8)' : 'rgba(255,255,255,0.75)',
            border: `2px solid ${quest.done ? '#F5B041' : 'var(--lavender)'}`,
            borderRadius: 16,
            padding: '10px 12px',
            boxShadow: quest.done ? '0 4px 10px rgba(245,176,65,0.2)' : 'none',
          }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--brown)', marginBottom: 4 }}>{quest.label}</div>
            <div style={{ fontSize: 11, color: '#7a6d90' }}>{Math.min(quest.progress, quest.goal)} / {quest.goal}</div>
            <div style={{ fontSize: 11, color: '#c67c00', marginTop: 4 }}>+{quest.reward} 🥕</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '8px 0', minHeight: 90 }}>
        <Mascot emoji={profile.mascot} mood={mood} />
        {feedback === 'correct' && (
          <div className="pop-anim" style={{ display: 'inline-block', marginLeft: 12, fontSize: 20, fontFamily: 'var(--font-jp)', fontWeight: 900, color: '#4a9e52' }}>
            せいかい！✨ +1 🥕
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440 }} key={qIndex} className="fade-in">
          <QuestionView q={q} onAnswer={handleAnswer} answerState={answerState} />
        </div>
      </div>
    </div>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ moduleId, summary, profile, onHome, onRetry, onProfiles, titleOverride }) {
  const wrongTaps = summary?.wrongTaps ?? 0
  const stars = moduleId === 7 ? (wrongTaps === 0 ? 3 : wrongTaps <= 2 ? 2 : 1) : profile.getStars(wrongTaps)
  const info = profile.modules.find(m => m.id === moduleId)
  const carrotsEarned = summary?.carrotsEarned ?? 0
  const bestStreak = summary?.bestStreak ?? 0
  const completedQuests = summary?.quests?.filter(quest => quest.done) || []
  const dailyBonusAwarded = !!summary?.dailyBonusAwarded
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div className="bounce-anim" style={{ fontSize: 80, marginBottom: 8 }}>{profile.mascot}</div>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{'⭐'.repeat(stars)}</div>
      <h2 style={{ fontSize: 26, fontFamily: 'var(--font-jp)', fontWeight: 900, color: 'var(--orange)', marginBottom: 8 }}>おわった！</h2>
      <p style={{ fontSize: 16, fontFamily: 'var(--font-jp)', color: 'var(--brown)', marginBottom: 4 }}>よくできました！</p>
      <p style={{ fontSize: 13, color: '#888', fontFamily: 'var(--font-jp)', marginBottom: 14 }}>{titleOverride || info?.title}</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ background: '#fff7d6', border: '2px solid #F5B041', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-num)', fontWeight: 800, color: '#9a5a00' }}>
          🥕 +{carrotsEarned}
        </div>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--brown)' }}>
          🔥 best streak {bestStreak}
        </div>
      </div>
      {dailyBonusAwarded && (
        <div style={{ background: '#e9ffe8', border: '2px solid #7BC67E', borderRadius: 16, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 800, color: '#2f6d37', marginBottom: 14 }}>
          📅 Daily bonus claimed! +8 🥕
        </div>
      )}
      {completedQuests.length > 0 && (
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {completedQuests.map(quest => (
            <div key={quest.id} style={{ background: 'rgba(255,255,255,0.8)', border: '2px solid #F5B041', borderRadius: 16, padding: '10px 14px' }}>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--brown)' }}>{quest.label}</div>
              <div style={{ fontSize: 12, color: '#c67c00', marginTop: 4 }}>Quest clear! +{quest.reward} 🥕</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 280 }}>
        <button onClick={onRetry} style={{
          background: `linear-gradient(135deg, ${profile.theme.lavender}, ${profile.theme.primary})`,
          border: 'none', borderRadius: 20, padding: '16px 24px',
          fontFamily: 'var(--font-jp)', fontWeight: 900, fontSize: 18,
          color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer',
        }}>
          もういちど {profile.mascot}
        </button>
        <button onClick={onHome} style={{
          background: 'var(--bg)', border: '3px solid var(--lavender)',
          borderRadius: 20, padding: '14px 24px',
          fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 17,
          color: 'var(--brown)', cursor: 'pointer',
        }}>
          ほかの もじゅーる
        </button>
        <button onClick={onProfiles} style={{
          background: 'transparent', border: '2px solid var(--lavender)',
          borderRadius: 20, padding: '12px 24px',
          fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 17,
          color: 'var(--brown-light)', cursor: 'pointer',
        }}>
          ← Back to profiles
        </button>
      </div>
    </div>
  )
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({ info, stars, unlocked, onPlay }) {
  return (
    <button
      onClick={unlocked ? onPlay : undefined}
      style={{
        background: unlocked ? 'var(--bg)' : 'var(--bg-alt)',
        border: `3px solid ${unlocked ? info.color : '#ddd'}`,
        borderRadius: 20, padding: '18px 12px',
        cursor: unlocked ? 'pointer' : 'default',
        opacity: unlocked ? 1 : 0.55,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        boxShadow: unlocked ? `0 4px 0 ${info.color}55` : 'none',
        minHeight: 140,
      }}
    >
      <div style={{ fontSize: 36 }}>{unlocked ? info.emoji : '🔒'}</div>
      <div style={{ fontSize: 14, fontFamily: 'var(--font-jp)', fontWeight: 700, color: 'var(--brown)', lineHeight: 1.3 }}>
        {info.title}
      </div>
      <div style={{ fontSize: 14, color: '#888', fontFamily: 'var(--font-num)' }}>{info.en}</div>
      {unlocked && (
        <div style={{ fontSize: 18 }}>
          {stars > 0 ? '⭐'.repeat(stars) : <span style={{ fontSize: 12, color: '#bbb' }}>まだ　あそんでいない</span>}
        </div>
      )}
    </button>
  )
}

// ─── Parent panel ─────────────────────────────────────────────────────────────
function ParentPanel({ progress, profile, onRestore, onReset, onClose }) {
  const [importVal, setImportVal] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [copyStatus, setCopyStatus] = useState('idle')
  const exportInputRef = useRef(null)
  const exportCode = btoa(JSON.stringify(progress))

  function flashCopyStatus(status, delay = 2000) {
    setCopyStatus(status)
    window.clearTimeout(flashCopyStatus.timeoutId)
    flashCopyStatus.timeoutId = window.setTimeout(() => setCopyStatus('idle'), delay)
  }

  function fallbackCopy() {
    const input = exportInputRef.current
    if (!input) return false
    input.focus()
    input.select()
    input.setSelectionRange(0, input.value.length)
    try {
      return document.execCommand('copy')
    } catch (_) {
      return false
    }
  }

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportCode)
        flashCopyStatus('copied')
        return
      }
    } catch (_) {
      // Fall back to manual selection / execCommand below.
    }

    if (fallbackCopy()) {
      flashCopyStatus('copied')
    } else {
      fallbackCopy()
      flashCopyStatus('manual', 2600)
    }
  }

  function handleImport() {
    try {
      const parsed = normalizeProgress(profile, JSON.parse(atob(importVal.trim())))
      if (!parsed.stars || !parsed.unlocked) throw new Error('bad')
      onRestore(parsed)
      setImportStatus('ok')
      setTimeout(onClose, 800)
    } catch (_) {
      setImportStatus('err')
      setTimeout(() => setImportStatus(null), 2000)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{
        background: 'var(--bg)', borderRadius: 28, padding: 28,
        width: '100%', maxWidth: 400,
        border: '3px solid var(--lavender)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 20, color: 'var(--brown)' }}>
              Parent / Save Progress
            </h2>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {profile.name}'s progress. Copy the code to save; paste to restore on any device.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--lavender)', border: 'none', borderRadius: 12, width: 36, height: 36, fontSize: 18, cursor: 'pointer', color: 'var(--brown)' }}>✕</button>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 8, fontFamily: 'var(--font-num)' }}>Save code (copy this)</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={exportInputRef}
              readOnly
              value={exportCode}
              onFocus={e => e.target.select()}
              onClick={e => e.target.select()}
              aria-label="Save code"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                border: `2px solid ${copyStatus === 'manual' ? 'var(--orange)' : 'var(--lavender)'}`,
                background: 'var(--bg-alt)',
                fontFamily: 'monospace', fontSize: 11, color: 'var(--brown)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            />
            <button onClick={handleCopy} style={{
              background: copyStatus === 'copied' ? '#7BC67E' : copyStatus === 'manual' ? '#A8D8EA' : 'var(--orange)',
              border: 'none', borderRadius: 12, padding: '10px 16px',
              color: 'white', fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap',
            }}>
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'manual' ? 'Press Ctrl+C' : 'Copy'}
            </button>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 8, fontFamily: 'var(--font-num)' }}>Restore from code</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={importVal}
              onChange={e => { setImportVal(e.target.value); setImportStatus(null) }}
              placeholder="Paste save code here"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                border: `2px solid ${importStatus === 'err' ? '#FF6B6B' : importStatus === 'ok' ? '#7BC67E' : 'var(--lavender)'}`,
                background: 'var(--bg-alt)', fontFamily: 'monospace', fontSize: 11, color: 'var(--brown)',
              }}
            />
            <button onClick={handleImport} disabled={!importVal.trim()} style={{
              background: importStatus === 'ok' ? '#7BC67E' : importStatus === 'err' ? '#FF6B6B' : 'var(--blue)',
              border: 'none', borderRadius: 12, padding: '10px 16px',
              color: 'white', fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 13,
              cursor: importVal.trim() ? 'pointer' : 'default',
              opacity: importVal.trim() ? 1 : 0.5, transition: 'background 0.2s',
            }}>
              {importStatus === 'ok' ? 'Done!' : importStatus === 'err' ? 'Error' : 'Restore'}
            </button>
          </div>
        </div>
        <div style={{ borderTop: '2px solid var(--lavender)', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Reset all progress (cannot be undone)</p>
          <button
            onClick={() => { if (window.confirm(`Reset all of ${profile.name}'s progress?`)) { onReset(); onClose() } }}
            style={{
              background: 'transparent', border: '2px solid var(--blue)',
              borderRadius: 12, padding: '8px 16px',
              fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 13,
              color: '#c0392b', cursor: 'pointer',
            }}
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ profile, progress, m7Stars, onPlay, onPlayMix, onPlayDaily, onParent, onSwitchProfile }) {
  const m7Total = (m7Stars[1] || 0) + (m7Stars[2] || 0) + (m7Stars[3] || 0)
  const badgeLabel = getBadgeLabel(progress.carrots)
  const todayKey = getTodayKey()
  const dailyDone = progress.daily?.lastCompletedDate === todayKey
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 0', zIndex: 10 }}>
        <button onClick={onSwitchProfile} style={{
          background: 'var(--bg)', border: '2px solid var(--lavender)',
          borderRadius: 12, padding: '7px 14px',
          fontSize: 14, fontFamily: 'var(--font-num)', fontWeight: 700,
          color: 'var(--brown-light)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← {profile.mascot} プロフィール
        </button>
        <button onClick={onParent} style={{
          background: 'var(--bg)', border: '2px solid var(--lavender)',
          borderRadius: 12, padding: '7px 14px',
          fontSize: 13, fontFamily: 'var(--font-num)', fontWeight: 700,
          color: 'var(--brown-light)', cursor: 'pointer',
        }}>⚙ Parent</button>
      </div>
      <div style={{ textAlign: 'center', padding: '28px 20px 12px' }}>
        <h1 style={{
          fontFamily: 'var(--font-rounded)', fontWeight: 800, fontSize: 36, lineHeight: 1.1,
          background: 'linear-gradient(135deg, #7BC67E, #3DAA5C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          ぴょんぴょん
        </h1>
        <h2 style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 28, color: 'var(--brown)', letterSpacing: 2 }}>
          Numbers
        </h2>
        <div style={{ fontSize: 44, marginTop: 6 }}>{profile.mascot}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '0 20px 14px' }}>
        <div style={{ background: '#fff7d6', border: '2px solid #F5B041', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-num)', fontWeight: 800, color: '#9a5a00' }}>
          🥕 {progress.carrots}
        </div>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--brown)' }}>
          🔥 best streak {progress.stats?.bestStreak || 0}
        </div>
        <div style={{ background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--brown)' }}>
          🏅 {badgeLabel}
        </div>
        <div style={{ background: dailyDone ? '#e9ffe8' : 'var(--bg)', border: `2px solid ${dailyDone ? '#7BC67E' : 'var(--lavender)'}`, borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--brown)' }}>
          📅 daily streak {progress.daily?.streak || 0}
        </div>
      </div>
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%', padding: '0 20px 12px', display: 'grid', gap: 12 }}>
        <button onClick={onPlayDaily} style={{
          width: '100%',
          background: dailyDone ? 'linear-gradient(135deg, #e9ffe8, #fff7d6)' : 'linear-gradient(135deg, #dff5ff, #fff1fb)',
          border: `3px solid ${dailyDone ? '#7BC67E' : '#7bb7ff'}`,
          borderRadius: 24,
          padding: '18px 18px',
          boxShadow: dailyDone ? '0 6px 0 rgba(123,198,126,0.22)' : '0 6px 0 rgba(123,183,255,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 20, color: 'var(--brown)' }}>📅 Daily Hop</div>
            <div style={{ fontSize: 13, color: '#63789d', marginTop: 4 }}>{dailyDone ? 'Today\'s bonus claimed — replay for practice.' : 'One bonus run per day, with streak rewards.'}</div>
          </div>
          <div style={{ fontSize: 30 }}>{dailyDone ? '✅' : '🎁'}</div>
        </button>
        <button onClick={onPlayMix} style={{
          width: '100%',
          background: 'linear-gradient(135deg, #fff7d6, #ffe4fa)',
          border: '3px solid #F5B041',
          borderRadius: 24,
          padding: '18px 18px',
          boxShadow: '0 6px 0 rgba(245,176,65,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 20, color: 'var(--brown)' }}>🎲 Lucky Mix</div>
            <div style={{ fontSize: 13, color: '#7a6d90', marginTop: 4 }}>A surprise lesson with mixed question types.</div>
          </div>
          <div style={{ fontSize: 34 }}>🥕✨</div>
        </button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14, padding: '12px 20px 28px',
        maxWidth: 520, margin: '0 auto', width: '100%',
      }}>
        {profile.modules.map(info => (
          <ModuleCard
            key={info.id}
            info={info}
            stars={info.id === 7 ? m7Total : (progress.stars[info.id] || 0)}
            unlocked={!!(progress.unlocked[info.id])}
            onPlay={() => onPlay(info.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Module 7 level select ────────────────────────────────────────────────────
function Module7Screen({ m7Stars, onPlay, onBack }) {
  const levels = [
    { level: 1, range: '0 → 10', label: 'Level 1' },
    { level: 2, range: '0 → 20', label: 'Level 2' },
    { level: 3, range: '0 → 100', label: 'Level 3' },
  ]
  const m7Unlocked = {
    1: true,
    2: (m7Stars[1] || 0) >= 2,
    3: (m7Stars[2] || 0) >= 2,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
      <div style={{ padding: '12px 16px' }}>
        <button onClick={onBack} style={{
          background: 'var(--bg)', border: '2px solid var(--lavender)', borderRadius: 12,
          padding: '8px 14px', fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 16,
          color: 'var(--brown)', cursor: 'pointer',
        }}>← もどる</button>
      </div>
      <div style={{ textAlign: 'center', padding: '8px 20px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>📏</div>
        <h2 style={{ fontFamily: 'var(--font-rounded)', fontWeight: 700, fontSize: 26, color: 'var(--brown)', marginBottom: 2 }}>Number Line</h2>
        <p style={{ fontFamily: 'var(--font-jp)', fontSize: 15, color: '#888' }}>すうじのせん — かずはどこにいる？</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 24px 32px', maxWidth: 400, margin: '0 auto', width: '100%' }}>
        {levels.map(({ level, range, label }) => {
          const unlocked = m7Unlocked[level]
          const stars = m7Stars[level] || 0
          return (
            <button key={level} onClick={unlocked ? () => onPlay(level) : undefined} style={{
              background: 'var(--bg)', border: `3px solid ${unlocked ? '#7BC67E' : '#ddd'}`,
              borderRadius: 20, padding: '18px 20px',
              opacity: unlocked ? 1 : 0.55, cursor: unlocked ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: unlocked ? '0 4px 0 #7BC67E55' : 'none',
            }}>
              <div style={{ fontSize: 28 }}>{unlocked ? '📏' : '🔒'}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 18, color: 'var(--brown)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-num)', fontSize: 14, color: '#888' }}>{range}</div>
              </div>
              <div style={{ fontSize: 20 }}>
                {unlocked && stars > 0 ? '⭐'.repeat(stars) : unlocked ? <span style={{ fontSize: 12, color: '#bbb' }}>まだ</span> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Profile select ───────────────────────────────────────────────────────────
function ProfileSelect({ onSelect }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', position: 'relative', zIndex: 1,
      padding: 24, textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-rounded)', fontWeight: 800, fontSize: 34, lineHeight: 1.1, marginBottom: 2,
        background: 'linear-gradient(135deg, #7BC67E, #3DAA5C)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        ぴょんぴょん
      </h1>
      <h2 style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 26, color: '#3D2B1F', letterSpacing: 2, marginBottom: 28 }}>
        Numbers
      </h2>
      <p style={{ fontSize: 24, fontFamily: 'var(--font-jp)', fontWeight: 700, color: '#3E2723', marginBottom: 32 }}>
        だれかな？
      </p>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => onSelect('lidia')}
          style={{
            background: '#FFF8EE', border: '4px solid #FF8C42',
            borderRadius: 28, padding: '28px 32px',
            cursor: 'pointer', minWidth: 140,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            boxShadow: '0 6px 0 #FF8C4255',
          }}
        >
          <div style={{ fontSize: 72 }}>🦁</div>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-num)', fontWeight: 900, color: '#3D2B1F' }}>Lidia</div>
          <div style={{ fontSize: 15, color: '#888', fontFamily: 'var(--font-num)' }}>6 years</div>
        </button>
        <button
          onClick={() => onSelect('nerea')}
          style={{
            background: '#FFF0F9', border: '4px solid #FF6EC7',
            borderRadius: 28, padding: '28px 32px',
            cursor: 'pointer', minWidth: 140,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            boxShadow: '0 6px 0 #FF6EC755',
          }}
        >
          <div style={{ fontSize: 72 }}>🦄</div>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-num)', fontWeight: 900, color: '#4A1942' }}>Nerea</div>
          <div style={{ fontSize: 15, color: '#888', fontFamily: 'var(--font-num)' }}>3 years</div>
        </button>
      </div>
    </div>
  )
}

// ─── Profile select background ────────────────────────────────────────────────
function SelectBackground() {
  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 400 700"
    >
      <defs>
        <linearGradient id="sky-sel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8E6F5" />
          <stop offset="50%" stopColor="#FFF8EE" />
          <stop offset="100%" stopColor="#F0F7E6" />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#sky-sel)" />
      {[[60, 80], [280, 110], [160, 50]].map(([cx, cy], i) => (
        <g key={i} opacity="0.5">
          <ellipse cx={cx} cy={cy} rx="38" ry="18" fill="white" />
          <ellipse cx={cx + 22} cy={cy + 4} rx="26" ry="14" fill="white" />
          <ellipse cx={cx - 20} cy={cy + 4} rx="22" ry="12" fill="white" />
        </g>
      ))}
      <ellipse cx="200" cy="690" rx="280" ry="60" fill="#7BC67E" opacity="0.3" />
    </svg>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(null)
  const [progress, setProgress] = useState(null)
  const [screen, setScreen] = useState('home')
  const [activeModule, setActiveModule] = useState(null)
  const [activeM7Level, setActiveM7Level] = useState(1)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [sessionSummary, setSessionSummary] = useState(null)
  const [showParent, setShowParent] = useState(false)
  const [m7Stars, setM7Stars] = useState({ 1: 0, 2: 0, 3: 0 })
  const [customSessionQuestions, setCustomSessionQuestions] = useState(null)
  const [customSessionTitle, setCustomSessionTitle] = useState('')

  function loadM7Stars() {
    return {
      1: parseInt(localStorage.getItem('pyonpyon_m7_l1_stars') || '0'),
      2: parseInt(localStorage.getItem('pyonpyon_m7_l2_stars') || '0'),
      3: parseInt(localStorage.getItem('pyonpyon_m7_l3_stars') || '0'),
    }
  }

  function applySessionRewards(summary, starsToStore = null) {
    const todayKey = getTodayKey()
    const needsDailyBonus = activeModule === 'daily' && progress?.daily?.bonusClaimedDate !== todayKey
    const enhancedSummary = {
      ...summary,
      carrotsEarned: (summary.carrotsEarned || 0) + (needsDailyBonus ? 8 : 0),
      dailyBonusAwarded: needsDailyBonus,
    }
    setSessionWrong(enhancedSummary.wrongTaps)
    setSessionSummary(enhancedSummary)
    setProgress(prev => {
      const next = normalizeProgress(profile, prev)
      if (starsToStore !== null && typeof activeModule === 'number' && activeModule !== 7) {
        const prevStars = next.stars[activeModule] || 0
        next.stars[activeModule] = Math.max(prevStars, starsToStore)
      }
      next.carrots += enhancedSummary.carrotsEarned || 0
      if (activeModule === 'daily' && next.daily.bonusClaimedDate !== todayKey) {
        next.daily.bonusClaimedDate = todayKey
        next.daily.streak = next.daily.lastCompletedDate === getYesterdayKey(todayKey)
          ? (next.daily.streak || 0) + 1
          : 1
        next.daily.lastCompletedDate = todayKey
      }
      next.stats.sessionsCompleted += 1
      if ((enhancedSummary.wrongTaps || 0) === 0) next.stats.perfectSessions += 1
      next.stats.bestStreak = Math.max(next.stats.bestStreak || 0, enhancedSummary.bestStreak || 0)
      saveProgress(profile, next)
      return next
    })
    setScreen('complete')
  }

  function selectProfile(id) {
    const p = PROFILES[id]
    setProfile(p)
    setProgress(loadProgress(p))
    if (id === 'lidia') setM7Stars(loadM7Stars())
    else setM7Stars({ 1: 0, 2: 0, 3: 0 })
    setCustomSessionQuestions(null)
    setCustomSessionTitle('')
    setSessionSummary(null)
    setScreen('home')
  }

  function handlePlay(moduleId) {
    if (moduleId === 7) { setScreen('m7levels'); return }
    setActiveModule(moduleId)
    setCustomSessionQuestions(null)
    setCustomSessionTitle('')
    setSessionSummary(null)
    setSessionWrong(0)
    setScreen('game')
  }

  function handlePlayMix() {
    setActiveModule('mix')
    setCustomSessionTitle('Lucky Mix')
    setCustomSessionQuestions(buildMixedSessionForProfile(profile, m7Stars))
    setSessionSummary(null)
    setSessionWrong(0)
    setScreen('game')
  }

  function handlePlayDaily() {
    setActiveModule('daily')
    setCustomSessionTitle('Daily Hop')
    setCustomSessionQuestions(buildMixedSessionForProfile(profile, m7Stars))
    setSessionSummary(null)
    setSessionWrong(0)
    setScreen('game')
  }

  function handleM7Play(level) {
    setActiveModule(7)
    setActiveM7Level(level)
    setCustomSessionQuestions(null)
    setCustomSessionTitle('')
    setSessionSummary(null)
    setSessionWrong(0)
    setScreen('game')
  }

  function handleComplete(summary) {
    if (activeModule === 'mix' || activeModule === 'daily') {
      applySessionRewards(summary)
      return
    }
    const stars = profile.getStars(summary.wrongTaps)
    applySessionRewards(summary, stars)
  }

  function handleCompleteM7(summary) {
    const stars = summary.wrongTaps === 0 ? 3 : summary.wrongTaps <= 2 ? 2 : 1
    const key = `pyonpyon_m7_l${activeM7Level}_stars`
    const prev = m7Stars[activeM7Level] || 0
    const newStars = Math.max(prev, stars)
    try { localStorage.setItem(key, String(newStars)) } catch (_) {}
    setM7Stars(s => ({ ...s, [activeM7Level]: newStars }))
    applySessionRewards(summary)
  }

  function handleRetry() {
    setSessionWrong(0)
    setSessionSummary(null)
    if (activeModule === 'mix' || activeModule === 'daily') {
      setCustomSessionQuestions(buildMixedSessionForProfile(profile, m7Stars))
    }
    setScreen('game')
  }

  function handleHome() {
    setScreen('home')
    setActiveModule(null)
    setCustomSessionQuestions(null)
    setCustomSessionTitle('')
  }

  function handleM7Home() {
    setScreen('m7levels')
    setCustomSessionQuestions(null)
    setCustomSessionTitle('')
  }

  function handleRestore(saved) {
    const normalized = normalizeProgress(profile, saved)
    setProgress(normalized)
    saveProgress(profile, normalized)
  }

  function handleReset() {
    const fresh = freshProgress(profile)
    setProgress(fresh)
    saveProgress(profile, fresh)
    if (profile.id === 'lidia') {
      try {
        localStorage.removeItem('pyonpyon_m7_l1_stars')
        localStorage.removeItem('pyonpyon_m7_l2_stars')
        localStorage.removeItem('pyonpyon_m7_l3_stars')
      } catch (_) {}
      setM7Stars({ 1: 0, 2: 0, 3: 0 })
    }
  }

  // Profile selection — no profile active yet
  if (!profile) {
    return (
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        <SelectBackground />
        <ProfileSelect onSelect={selectProfile} />
      </div>
    )
  }

  const theme = profile.theme

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', ...themeVars(theme) }}>
        <Background theme={theme} />
        {showParent && (
          <ParentPanel
            progress={progress}
            profile={profile}
            onRestore={handleRestore}
            onReset={handleReset}
            onClose={() => setShowParent(false)}
          />
        )}
        {screen === 'home' && (
          <HomeScreen
            profile={profile}
            progress={progress}
            m7Stars={m7Stars}
            onPlay={handlePlay}
            onPlayMix={handlePlayMix}
            onPlayDaily={handlePlayDaily}
            onParent={() => setShowParent(true)}
            onSwitchProfile={() => setProfile(null)}
          />
        )}
        {screen === 'm7levels' && (
          <Module7Screen
            m7Stars={m7Stars}
            onPlay={handleM7Play}
            onBack={handleHome}
          />
        )}
        {screen === 'game' && (
          <GameScreen
            key={`${activeModule}-${activeM7Level}-${sessionWrong}-${customSessionQuestions?.length || 0}-${Math.random()}`}
            moduleId={activeModule}
            m7Level={activeM7Level}
            profile={profile}
            customQuestions={customSessionQuestions}
            customTitle={customSessionTitle}
            onComplete={activeModule === 7 ? handleCompleteM7 : handleComplete}
            onBack={activeModule === 7 ? handleM7Home : handleHome}
          />
        )}
        {screen === 'complete' && (
          <CompletionScreen
            moduleId={activeModule}
            summary={sessionSummary}
            profile={profile}
            titleOverride={customSessionTitle}
            onHome={activeModule === 7 ? handleM7Home : handleHome}
            onRetry={handleRetry}
            onProfiles={() => setProfile(null)}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  )
}
