import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'SomaYagna London — Sacred 8-day Vedic Yagna programme';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 90,
          background: 'linear-gradient(135deg, #2C0A0A 0%, #561414 40%, #8B2727 100%)',
          color: '#FBF5E7',
          fontFamily: 'Georgia, serif',
          position: 'relative'
        }}
      >
        {/* Decorative mandala in corner */}
        <svg width="500" height="500" viewBox="0 0 400 400" style={{ position: 'absolute', top: -120, right: -120, opacity: 0.18 }}>
          <circle cx="200" cy="200" r="195" fill="none" stroke="#E2BB58" strokeWidth="0.8" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="#E2BB58" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="100" fill="none" stroke="#E2BB58" strokeWidth="0.5" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="200"
              y1="20"
              x2="200"
              y2="380"
              stroke="#E2BB58"
              strokeWidth="0.4"
              transform={`rotate(${(i * 360) / 24} 200 200)`}
            />
          ))}
        </svg>

        {/* Logo mark + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <svg width="80" height="80" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="og-flame" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE08A" />
                <stop offset="50%" stopColor="#FB9A2C" />
                <stop offset="100%" stopColor="#8B2727" />
              </linearGradient>
              <linearGradient id="og-brick" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9A480A" />
                <stop offset="100%" stopColor="#400F0F" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="29" fill="none" stroke="#E2BB58" strokeWidth="1.4" />
            <circle cx="32" cy="32" r="25" fill="none" stroke="#E2BB58" strokeWidth="0.6" opacity="0.55" />
            <rect x="20" y="40" width="24" height="12" rx="1" fill="url(#og-brick)" />
            <rect x="22" y="38" width="20" height="4" rx="0.5" fill="#2C0A0A" />
            <path d="M32 12 Q42 22 40 36 Q36 44 32 44 Q28 44 24 36 Q22 22 32 12 Z" fill="url(#og-flame)" />
            <path d="M32 19 Q38 25 36.5 36 Q34 41 32 41 Q30 41 27.5 36 Q26 25 32 19 Z" fill="#FFE08A" />
          </svg>
          <div style={{ fontSize: 22, letterSpacing: '0.3em', color: '#E2BB58', textTransform: 'uppercase' }}>
            Unity in Divinity · London 2026
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 110, fontWeight: 600, lineHeight: 1.05, color: '#FBF5E7' }}>
          SomaYagna&nbsp;<span style={{ color: '#E2BB58' }}>London</span>
        </div>

        <div style={{ display: 'flex', fontSize: 38, marginTop: 28, fontStyle: 'italic', color: '#F8EBC4' }}>
          An eight-day sacred Vedic Yagna programme
        </div>

        <div style={{ display: 'flex', gap: 36, marginTop: 60, fontSize: 24, color: '#F8EBC4' }}>
          <span>14 – 21 June</span>
          <span style={{ color: '#E2BB58' }}>·</span>
          <span>Purshotam Yagna</span>
          <span style={{ color: '#E2BB58' }}>·</span>
          <span>Vishnu Gopal Yagna</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
