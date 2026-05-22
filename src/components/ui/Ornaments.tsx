export function Mandala({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="mg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.08" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="195" fill="url(#mg)" />
      <g fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.6">
        <circle cx="200" cy="200" r="60" />
        <circle cx="200" cy="200" r="90" />
        <circle cx="200" cy="200" r="120" />
        <circle cx="200" cy="200" r="150" />
        <circle cx="200" cy="200" r="180" />
        {/* 16 lotus petals */}
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * 360) / 16;
          return (
            <g key={i} transform={`rotate(${a} 200 200)`}>
              <path d="M200 50 Q210 110 200 170 Q190 110 200 50 Z" />
            </g>
          );
        })}
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 360) / 24;
          return (
            <line key={i} x1="200" y1="200" x2="200" y2="20" transform={`rotate(${a} 200 200)`} strokeWidth="0.3" />
          );
        })}
      </g>
    </svg>
  );
}

export function Diya({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 100" aria-hidden="true" className={className}>
      {/* lamp */}
      <path d="M10 70 Q40 95 70 70 L65 60 Q40 70 15 60 Z" fill="currentColor" opacity="0.85" />
      <path d="M10 70 Q40 95 70 70" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      {/* flame */}
      <g className="animate-flicker origin-bottom" style={{ transformOrigin: '40px 60px' }}>
        <path d="M40 10 Q52 30 46 48 Q40 56 34 48 Q28 30 40 10 Z"
              fill="url(#flame)" />
        <defs>
          <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="50%" stopColor="#FB9A2C" />
            <stop offset="100%" stopColor="#8B2727" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
}

export function OmGlyph({ className = '' }: { className?: string }) {
  // Stylised geometric mark — not a literal Om character, used as a quiet motif
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className={className}>
      <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <circle cx="30" cy="30" r="3" fill="currentColor" />
    </svg>
  );
}

export function LotusBorder({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 30" aria-hidden="true" className={className}>
      <g fill="currentColor" opacity="0.6">
        {Array.from({ length: 13 }).map((_, i) => (
          <g key={i} transform={`translate(${i * 50}, 0)`}>
            <path d="M0 15 Q15 0 30 15 Q25 18 20 15 Q15 12 10 15 Q5 18 0 15 Z" />
            <circle cx="15" cy="15" r="1.6" fill="currentColor" opacity="0.9" />
          </g>
        ))}
      </g>
    </svg>
  );
}
