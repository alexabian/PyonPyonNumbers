import { useState, useEffect, useCallback, useRef } from 'react'
import { buildSession, shuffle, SHAPES_2D, SHAPES_3D, ALL_SHAPES } from './questionData.js'
import ShapeSVG from './ShapeSVG.jsx'

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'pyonpyon_progress'
const MODULE_COUNT = 6

const MODULE_INFO = [
  { id: 1, title: 'すうじをおぼえよう', en: 'Number Recognition', emoji: '🔢', color: '#FF8C42' },
  { id: 2, title: 'かぞえてみよう',     en: 'Counting',           emoji: '✋', color: '#A8D8EA' },
  { id: 3, title: 'どっちがおおい？',   en: 'More or Fewer',      emoji: '⚖️', color: '#7BC67E' },
  { id: 4, title: 'つぎはなんばん？',   en: 'Number Order',       emoji: '📈', color: '#C9B8E8' },
  { id: 5, title: 'たしざんをしよう',   en: 'Addition',           emoji: '➕', color: '#FFD166' },
  { id: 6, title: 'かたちをおぼえよう', en: 'Shapes',             emoji: '🔷', color: '#EF8DB3' },
]

// ─── Persistence ─────────────────────────────────────────────────────────────
function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { stars: {}, unlocked: { 1: true } }
}

function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch (_) {}
}

// ─── Background ──────────────────────────────────────────────────────────────
function Background() {
  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 400 700"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4eeff" />
          <stop offset="60%" stopColor="#FFF8EE" />
          <stop offset="100%" stopColor="#e8f5e2" />
        </linearGradient>
      </defs>
      <rect width="400" height="700" fill="url(#sky)" />
      {/* grass strip */}
      <ellipse cx="200" cy="690" rx="280" ry="60" fill="#b5e0a0" opacity="0.5" />
      {/* grass tufts */}
      {[30, 80, 150, 240, 310, 370].map((x, i) => (
        <g key={i} transform={`translate(${x}, 640)`}>
          <ellipse cx="0" cy="0" rx="18" ry="6" fill="#7BC67E" opacity="0.4" />
          <path d="M-6,0 Q-4,-14 0,-8 Q4,-14 6,0" fill="#7BC67E" opacity="0.6" />
        </g>
      ))}
      {/* soft clouds */}
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

// ─── Rabbit mascot ───────────────────────────────────────────────────────────
function Rabbit({ mood = 'neutral' }) {
  const emoji = mood === 'happy' ? '🐰' : mood === 'sad' ? '🐰' : '🐰'
  return (
    <div
      className={mood === 'happy' ? 'bounce-anim' : mood === 'sad' ? 'shake-anim' : ''}
      style={{
        fontSize: 52,
        lineHeight: 1,
        filter: mood === 'sad' ? 'grayscale(30%) brightness(0.85)' : 'none',
        transition: 'filter 0.3s',
        display: 'inline-block',
      }}
    >
      {emoji}
    </div>
  )
}

// ─── Stars display ───────────────────────────────────────────────────────────
function Stars({ count, size = 24 }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 2 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ opacity: i <= count ? 1 : 0.2 }}>⭐</span>
      ))}
    </span>
  )
}

// ─── Answer button ───────────────────────────────────────────────────────────
function AnswerBtn({ children, onClick, state = 'idle', disabled }) {
  // state: 'idle' | 'correct' | 'wrong'
  const bg =
    state === 'correct' ? '#7BC67E' :
    state === 'wrong'   ? '#FF6B6B' :
    '#FFF8EE'
  const border =
    state === 'correct' ? '#4a9e52' :
    state === 'wrong'   ? '#c0392b' :
    '#C9B8E8'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={state === 'wrong' ? 'shake-anim' : state === 'correct' ? 'pop-anim' : ''}
      style={{
        background: bg,
        border: `3px solid ${border}`,
        borderRadius: 20,
        padding: '14px 18px',
        fontSize: 22,
        fontFamily: 'var(--font-num)',
        fontWeight: 800,
        color: 'var(--brown)',
        boxShadow: state === 'idle' ? '0 4px 0 #C9B8E8' : 'none',
        transition: 'background 0.2s, border 0.2s',
        minHeight: 64,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {children}
    </button>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div style={{ width: '100%', maxWidth: 340, height: 12, background: '#e8ddd0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${(current / total) * 100}%`,
        background: 'linear-gradient(90deg, #FF8C42, #FFD166)',
        borderRadius: 8,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

// ─── Counting dots for M2 ────────────────────────────────────────────────────
function CountingField({ count, emoji, tapped, onTap }) {
  // Random-ish positions seeded by count
  const positions = []
  const W = 280, H = 180, R = 26
  // Simple deterministic scatter using a pseudo-random sequence
  const seeds = [
    [0.15, 0.2], [0.6, 0.15], [0.35, 0.55], [0.8, 0.5], [0.1, 0.75],
    [0.55, 0.78], [0.78, 0.22], [0.25, 0.88], [0.65, 0.62], [0.42, 0.35],
    [0.88, 0.72], [0.12, 0.48], [0.5, 0.95], [0.72, 0.38], [0.3, 0.68],
    [0.62, 0.08], [0.08, 0.62], [0.85, 0.88], [0.45, 0.15], [0.2, 0.42],
  ]
  for (let i = 0; i < count; i++) {
    const [fx, fy] = seeds[i % seeds.length]
    positions.push({ x: R + fx * (W - R * 2), y: R + fy * (H - R * 2) })
  }

  return (
    <div style={{
      position: 'relative',
      width: W,
      height: H,
      background: '#FFF8EE',
      borderRadius: 20,
      border: '3px solid #C9B8E8',
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      {positions.map((pos, i) => (
        <button
          key={i}
          onClick={() => onTap(i)}
          style={{
            position: 'absolute',
            left: pos.x - R,
            top: pos.y - R,
            width: R * 2,
            height: R * 2,
            background: tapped.has(i) ? '#7BC67E' : 'transparent',
            border: tapped.has(i) ? '2px solid #4a9e52' : '2px solid transparent',
            borderRadius: '50%',
            fontSize: 28,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: tapped.has(i) ? 'default' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ─── Module renderers ─────────────────────────────────────────────────────────

function QuestionM1A({ q, onAnswer, answerState }) {
  // Show numeral, choose emoji group count
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#888', fontFamily: 'var(--font-num)', marginBottom: 6 }}>いくつの {q.emoji}？</p>
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
  // Show emoji group, choose numeral
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#888', fontFamily: 'var(--font-num)', marginBottom: 10 }}>なんこ あるかな？</p>
      <div style={{ fontSize: 28, letterSpacing: 4, marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>
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
  const [phase, setPhase] = useState('count') // 'count' | 'answer'

  function handleTap(i) {
    if (phase !== 'count') return
    setTapped(prev => {
      const next = new Set(prev)
      next.add(i)
      if (next.size === q.count) {
        setTimeout(() => setPhase('answer'), 300)
      }
      return next
    })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {phase === 'count' ? (
        <>
          <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 14, color: 'var(--brown)' }}>
            {q.emoji} を ぜんぶ おしてね！
          </p>
          <CountingField count={q.count} emoji={q.emoji} tapped={tapped} onTap={handleTap} />
          <div style={{ marginTop: 12, fontSize: 22, fontFamily: 'var(--font-num)', fontWeight: 800, color: 'var(--orange)' }}>
            {tapped.size} / {q.count}
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 14 }}>
            ぜんぶで いくつ？
          </p>
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
  const labelFor = key => key === 'left' ? q.emoji.repeat(q.left) : key === 'right' ? q.emoji.repeat(q.right) : null
  const btnLabel = key => key === 'left' ? 'ひだり おおい' : key === 'right' ? 'みぎ おおい' : 'おなじ'
  const btnEn = key => key === 'left' ? 'left has more' : key === 'right' ? 'right has more' : 'same'

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 16 }}>どっちが おおい？</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#FFF8EE', border: '3px solid #C9B8E8', borderRadius: 16, padding: '12px 16px', minWidth: 100, fontSize: 26, lineHeight: 1.8 }}>
          {q.emoji.repeat(q.left)}
        </div>
        <span style={{ fontSize: 28, fontWeight: 900, color: '#C9B8E8' }}>VS</span>
        <div style={{ background: '#FFF8EE', border: '3px solid #C9B8E8', borderRadius: 16, padding: '12px 16px', minWidth: 100, fontSize: 26, lineHeight: 1.8 }}>
          {q.emoji.repeat(q.right)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        {q.choices.map((c, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(c)} state={answerState[c] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[c] !== 'wrong'}>
            <span style={{ fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 20 }}>
              {c === 'same' ? 'おなじ' : c === 'left' ? 'ひだりが おおい' : 'みぎが おおい'}
            </span>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>{btnEn(c)}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM4({ q, onAnswer, answerState }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 20 }}>つぎは なんばん？</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        {q.seq.map((n, i) => (
          <div key={i} style={{
            width: 64, height: 64,
            background: n === null ? 'linear-gradient(135deg, #FFD166, #FF8C42)' : '#FFF8EE',
            border: `3px solid ${n === null ? '#FF8C42' : '#C9B8E8'}`,
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: n === null ? 32 : 28,
            fontFamily: 'var(--font-num)',
            fontWeight: 900,
            color: n === null ? 'white' : 'var(--brown)',
            boxShadow: n === null ? '0 4px 12px rgba(255,140,66,0.4)' : 'none',
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
      <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 18 }}>こたえは いくつ？</p>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ background: '#FFF8EE', border: '3px solid #A8D8EA', borderRadius: 16, padding: '10px 14px', fontSize: 28, lineHeight: 1.6 }}>
          {q.emoji.repeat(q.a)}
        </div>
        <span style={{ fontSize: 34, fontWeight: 900, color: '#FF8C42', fontFamily: 'var(--font-num)' }}>＋</span>
        <div style={{ background: '#FFF8EE', border: '3px solid #A8D8EA', borderRadius: 16, padding: '10px 14px', fontSize: 28, lineHeight: 1.6 }}>
          {q.b > 0 ? q.emoji.repeat(q.b) : <span style={{ color: '#ccc', fontSize: 22 }}>なし</span>}
        </div>
        <span style={{ fontSize: 34, fontWeight: 900, color: '#FF8C42', fontFamily: 'var(--font-num)' }}>＝</span>
        <div style={{
          width: 64, height: 64, background: 'linear-gradient(135deg, #FFD166, #FF8C42)',
          border: '3px solid #FF8C42', borderRadius: 16,
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
  // Show shape, pick name button
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 20 }}>この かたちの なまえは？</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <ShapeSVG shapeId={q.shape.id} size={120} color="#FF8C42" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 320, margin: '0 auto' }}>
        {q.choices.map((shape, i) => (
          <AnswerBtn key={i} onClick={() => onAnswer(shape.id)} state={answerState[shape.id] || 'idle'} disabled={!!Object.keys(answerState).length && answerState[shape.id] !== 'wrong'}>
            <ShapeSVG shapeId={shape.id} size={32} color={answerState[shape.id] === 'correct' ? '#3D2B1F' : '#3D2B1F'} />
            <span style={{ fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 20 }}>{shape.jp}</span>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>{shape.en}</span>
          </AnswerBtn>
        ))}
      </div>
    </div>
  )
}

function QuestionM6B({ q, onAnswer, answerState }) {
  // Show name, pick shape
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', fontWeight: 700, marginBottom: 10 }}>この かたちは どれ？</p>
      <div style={{ fontSize: 44, fontFamily: 'var(--font-jp)', fontWeight: 900, color: 'var(--orange)', marginBottom: 28 }}>
        {q.shape.jp}
        <span style={{ fontSize: 14, color: '#888', display: 'block', fontWeight: 400, marginTop: 4 }}>{q.shape.en}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {q.choices.map((shape, i) => (
          <button
            key={i}
            onClick={() => onAnswer(shape.id)}
            disabled={!!Object.keys(answerState).length && answerState[shape.id] !== 'wrong'}
            className={answerState[shape.id] === 'wrong' ? 'shake-anim' : answerState[shape.id] === 'correct' ? 'pop-anim' : ''}
            style={{
              background: answerState[shape.id] === 'correct' ? '#7BC67E' : answerState[shape.id] === 'wrong' ? '#FF6B6B' : '#FFF8EE',
              border: `3px solid ${answerState[shape.id] === 'correct' ? '#4a9e52' : answerState[shape.id] === 'wrong' ? '#c0392b' : '#C9B8E8'}`,
              borderRadius: 20,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShapeSVG shapeId={shape.id} size={80} color="#FF8C42" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Question dispatcher ──────────────────────────────────────────────────────
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
    default: return <p>？</p>
  }
}

// ─── Game screen ──────────────────────────────────────────────────────────────
function GameScreen({ moduleId, onComplete, onBack }) {
  const [questions] = useState(() => buildSession(moduleId))
  const [qIndex, setQIndex] = useState(0)
  const [answerState, setAnswerState] = useState({})
  const [wrongTaps, setWrongTaps] = useState(0)
  const [rabbitMood, setRabbitMood] = useState('neutral')
  const [feedback, setFeedback] = useState(null) // 'correct' | null
  const advancing = useRef(false)

  const q = questions[qIndex]
  const info = MODULE_INFO[moduleId - 1]

  function handleAnswer(value) {
    if (advancing.current) return
    const isCorrect = value === q.correct

    if (isCorrect) {
      advancing.current = true
      setAnswerState({ [value]: 'correct' })
      setRabbitMood('happy')
      setFeedback('correct')
      setTimeout(() => {
        advancing.current = false
        setAnswerState({})
        setRabbitMood('neutral')
        setFeedback(null)
        if (qIndex + 1 >= questions.length) {
          onComplete(wrongTaps)
        } else {
          setQIndex(i => i + 1)
        }
      }, 1000)
    } else {
      setWrongTaps(w => w + 1)
      setRabbitMood('sad')
      setAnswerState(prev => ({ ...prev, [value]: 'wrong' }))
      setTimeout(() => {
        setRabbitMood('neutral')
        setAnswerState(prev => {
          const next = { ...prev }
          delete next[value]
          return next
        })
      }, 600)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: '#FFF8EE', border: '2px solid #C9B8E8', borderRadius: 12,
            padding: '8px 14px', fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 16,
            color: 'var(--brown)', cursor: 'pointer',
          }}
        >
          ← もどる
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ProgressBar current={qIndex} total={questions.length} />
        </div>
        <span style={{ fontFamily: 'var(--font-num)', fontWeight: 800, fontSize: 16, color: '#888' }}>
          {qIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <span style={{ fontSize: 14, fontFamily: 'var(--font-jp)', color: '#888' }}>{info.title}</span>
      </div>

      {/* Rabbit + feedback */}
      <div style={{ textAlign: 'center', padding: '8px 0', minHeight: 90 }}>
        <Rabbit mood={rabbitMood} />
        {feedback === 'correct' && (
          <div className="pop-anim" style={{
            display: 'inline-block', marginLeft: 12, fontSize: 24,
            fontFamily: 'var(--font-jp)', fontWeight: 900, color: '#4a9e52',
          }}>
            せいかい！✨
          </div>
        )}
      </div>

      {/* Question */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440 }} key={qIndex} className="fade-in">
          <QuestionView q={q} onAnswer={handleAnswer} answerState={answerState} />
        </div>
      </div>
    </div>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ moduleId, wrongTaps, onHome, onRetry }) {
  const stars = wrongTaps === 0 ? 3 : wrongTaps <= 3 ? 2 : 1
  const info = MODULE_INFO[moduleId - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div className="bounce-anim" style={{ fontSize: 80, marginBottom: 8 }}>🐰</div>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{'⭐'.repeat(stars)}</div>

      <h2 style={{ fontSize: 30, fontFamily: 'var(--font-jp)', fontWeight: 900, color: 'var(--orange)', marginBottom: 8 }}>
        おわった！
      </h2>
      <p style={{ fontSize: 18, fontFamily: 'var(--font-jp)', color: 'var(--brown)', marginBottom: 4 }}>
        よくできました！
      </p>
      <p style={{ fontSize: 14, color: '#888', fontFamily: 'var(--font-jp)', marginBottom: 28 }}>
        {info.title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 280 }}>
        <button
          onClick={onRetry}
          style={{
            background: 'linear-gradient(135deg, #FFD166, #FF8C42)',
            border: 'none', borderRadius: 20, padding: '16px 24px',
            fontFamily: 'var(--font-jp)', fontWeight: 900, fontSize: 22,
            color: 'white', boxShadow: '0 4px 12px rgba(255,140,66,0.4)', cursor: 'pointer',
          }}
        >
          もういちど 🐰
        </button>
        <button
          onClick={onHome}
          style={{
            background: '#FFF8EE', border: '3px solid #C9B8E8',
            borderRadius: 20, padding: '14px 24px',
            fontFamily: 'var(--font-jp)', fontWeight: 700, fontSize: 20,
            color: 'var(--brown)', cursor: 'pointer',
          }}
        >
          ホームへ
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
        background: unlocked ? '#FFF8EE' : '#f0ece6',
        border: `3px solid ${unlocked ? info.color : '#ddd'}`,
        borderRadius: 20,
        padding: '18px 12px',
        cursor: unlocked ? 'pointer' : 'default',
        opacity: unlocked ? 1 : 0.55,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        boxShadow: unlocked ? `0 4px 0 ${info.color}55` : 'none',
        transition: 'transform 0.1s',
        minHeight: 140,
      }}
    >
      <div style={{ fontSize: 36 }}>{unlocked ? info.emoji : '🔒'}</div>
      <div style={{ fontSize: 15, fontFamily: 'var(--font-jp)', fontWeight: 700, color: 'var(--brown)', lineHeight: 1.3 }}>
        {info.title}
      </div>
      <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-num)' }}>{info.en}</div>
      {unlocked && (
        <div style={{ fontSize: 18 }}>
          {stars > 0 ? '⭐'.repeat(stars) : <span style={{ fontSize: 12, color: '#bbb' }}>まだ　あそんでいない</span>}
        </div>
      )}
    </button>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ progress, onPlay }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '28px 20px 12px' }}>
        <h1 style={{ fontFamily: 'var(--font-rounded)', fontWeight: 800, fontSize: 36, color: 'var(--orange)', lineHeight: 1.1 }}>
          ぴょんぴょん
        </h1>
        <h2 style={{ fontFamily: 'var(--font-num)', fontWeight: 900, fontSize: 28, color: 'var(--brown)', letterSpacing: 2 }}>
          Numbers
        </h2>
        <div style={{ fontSize: 40, marginTop: 6 }}>🐰</div>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14,
        padding: '12px 20px 28px',
        maxWidth: 520,
        margin: '0 auto',
        width: '100%',
      }}>
        {MODULE_INFO.map(info => (
          <ModuleCard
            key={info.id}
            info={info}
            stars={progress.stars[info.id] || 0}
            unlocked={!!(progress.unlocked[info.id])}
            onPlay={() => onPlay(info.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [screen, setScreen] = useState('home') // 'home' | 'game' | 'complete'
  const [activeModule, setActiveModule] = useState(null)
  const [sessionWrong, setSessionWrong] = useState(0)

  function handlePlay(moduleId) {
    setActiveModule(moduleId)
    setSessionWrong(0)
    setScreen('game')
  }

  function handleComplete(wrongTaps) {
    const stars = wrongTaps === 0 ? 3 : wrongTaps <= 3 ? 2 : 1
    setSessionWrong(wrongTaps)

    setProgress(prev => {
      const prevStars = prev.stars[activeModule] || 0
      const newStars = Math.max(prevStars, stars)
      const newUnlocked = { ...prev.unlocked }
      if (activeModule < MODULE_COUNT) {
        newUnlocked[activeModule + 1] = true
      }
      const next = { stars: { ...prev.stars, [activeModule]: newStars }, unlocked: newUnlocked }
      saveProgress(next)
      return next
    })

    setScreen('complete')
  }

  function handleRetry() {
    setSessionWrong(0)
    setScreen('game')
  }

  function handleHome() {
    setScreen('home')
    setActiveModule(null)
  }

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <Background />
      {screen === 'home' && (
        <HomeScreen progress={progress} onPlay={handlePlay} />
      )}
      {screen === 'game' && (
        <GameScreen
          key={`${activeModule}-${sessionWrong}-${Math.random()}`}
          moduleId={activeModule}
          onComplete={handleComplete}
          onBack={handleHome}
        />
      )}
      {screen === 'complete' && (
        <CompletionScreen
          moduleId={activeModule}
          wrongTaps={sessionWrong}
          onHome={handleHome}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
