// Clean SVG shape renderer
export default function ShapeSVG({ shapeId, size = 80, color = '#FF8C42' }) {
  const s = size
  const props = { width: s, height: s, viewBox: '0 0 100 100', style: { display: 'block' } }

  switch (shapeId) {
    case 'circle':
      return (
        <svg {...props}>
          <circle cx="50" cy="50" r="44" fill={color} stroke="#3B1458" strokeWidth="3" />
        </svg>
      )
    case 'triangle':
      return (
        <svg {...props}>
          <polygon points="50,8 94,92 6,92" fill={color} stroke="#3B1458" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      )
    case 'square':
      return (
        <svg {...props}>
          <rect x="8" y="8" width="84" height="84" rx="4" fill={color} stroke="#3B1458" strokeWidth="3" />
        </svg>
      )
    case 'rectangle':
      return (
        <svg {...props} viewBox="0 0 140 100">
          <rect x="8" y="18" width="124" height="64" rx="4" fill={color} stroke="#3B1458" strokeWidth="3" />
        </svg>
      )
    case 'sphere':
      return (
        <svg {...props}>
          <defs>
            <radialGradient id={`sg-${shapeId}`} cx="38%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill={`url(#sg-${shapeId})`} stroke="#3B1458" strokeWidth="3" />
          <ellipse cx="50" cy="50" rx="44" ry="14" fill="none" stroke="#3B1458" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      )
    case 'cube':
      return (
        <svg {...props}>
          <polygon points="50,10 88,30 88,70 50,90 12,70 12,30" fill={color} stroke="#3B1458" strokeWidth="3" />
          <line x1="50" y1="10" x2="50" y2="50" stroke="#3B1458" strokeWidth="2" />
          <line x1="88" y1="30" x2="50" y2="50" stroke="#3B1458" strokeWidth="2" />
          <line x1="12" y1="30" x2="50" y2="50" stroke="#3B1458" strokeWidth="2" />
        </svg>
      )
    case 'pyramid':
      return (
        <svg {...props}>
          <polygon points="50,8 90,88 10,88" fill={color} stroke="#3B1458" strokeWidth="3" strokeLinejoin="round" />
          <line x1="50" y1="8" x2="50" y2="88" stroke="#3B1458" strokeWidth="2" strokeDasharray="4 3" />
          <ellipse cx="50" cy="88" rx="40" ry="8" fill={color} stroke="#3B1458" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}
