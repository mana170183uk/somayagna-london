import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#400F0F',
          borderRadius: 36
        }}
      >
        <svg width="140" height="140" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE08A" />
              <stop offset="50%" stopColor="#FB9A2C" />
              <stop offset="100%" stopColor="#8B2727" />
            </linearGradient>
            <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9A480A" />
              <stop offset="100%" stopColor="#400F0F" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="29" fill="none" stroke="#E2BB58" strokeWidth="1.4" />
          <circle cx="32" cy="32" r="25" fill="none" stroke="#E2BB58" strokeWidth="0.6" opacity="0.55" />
          <rect x="20" y="40" width="24" height="12" rx="1" fill="url(#b)" stroke="#2C0A0A" strokeWidth="0.6" />
          <rect x="22" y="38" width="20" height="4" rx="0.5" fill="#2C0A0A" />
          <path d="M32 12 Q42 22 40 36 Q36 44 32 44 Q28 44 24 36 Q22 22 32 12 Z" fill="url(#f)" />
          <path d="M32 19 Q38 25 36.5 36 Q34 41 32 41 Q30 41 27.5 36 Q26 25 32 19 Z" fill="#FFE08A" />
          <ellipse cx="32" cy="35" rx="1.6" ry="3.5" fill="#FFFCF6" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
