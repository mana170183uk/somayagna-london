import { classNames } from '@/lib/utils';

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="lm-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="50%" stopColor="#FB9A2C" />
          <stop offset="100%" stopColor="#8B2727" />
        </linearGradient>
        <linearGradient id="lm-brick" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9A480A" />
          <stop offset="100%" stopColor="#400F0F" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
      <circle cx="32" cy="6" r="0.9" fill="currentColor" />
      <circle cx="6" cy="32" r="0.9" fill="currentColor" />
      <circle cx="58" cy="32" r="0.9" fill="currentColor" />
      <circle cx="32" cy="58" r="0.9" fill="currentColor" />
      <rect x="20" y="40" width="24" height="12" rx="1" fill="url(#lm-brick)" stroke="#2C0A0A" strokeWidth="0.6" />
      <rect x="22" y="38" width="20" height="4" rx="0.5" fill="#2C0A0A" />
      <g className="animate-flicker" style={{ transformOrigin: '32px 30px' }}>
        <path d="M32 12 Q42 22 40 36 Q36 44 32 44 Q28 44 24 36 Q22 22 32 12 Z" fill="url(#lm-flame)" />
        <path d="M32 19 Q38 25 36.5 36 Q34 41 32 41 Q30 41 27.5 36 Q26 25 32 19 Z" fill="#FFE08A" />
        <ellipse cx="32" cy="35" rx="1.6" ry="3.5" fill="#FFFCF6" />
      </g>
    </svg>
  );
}

export function Logo({
  className = '',
  size = 'md',
  inverted = false
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}) {
  const dim = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }[size];
  const text = { sm: 'text-lg', md: 'text-xl md:text-2xl', lg: 'text-2xl md:text-3xl' }[size];
  return (
    <div className={classNames('inline-flex items-center gap-3', className)}>
      <LogoMark className={classNames(dim, inverted ? 'text-gold-300' : 'text-gold-500')} />
      <div className="leading-tight">
        <div className={classNames(
          'h-display',
          text,
          inverted ? 'text-ivory-50' : 'text-maroon-800'
        )}>
          SomaYagna <span className={inverted ? 'text-gold-300' : 'text-saffron-600'}>London</span>
        </div>
      </div>
    </div>
  );
}
