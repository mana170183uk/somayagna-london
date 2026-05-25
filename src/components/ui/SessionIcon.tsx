interface Props { kind: 'sunrise' | 'midday' | 'sunset'; className?: string; }

/**
 * Small SVG glyphs depicting the three times of day used by the SomaYagna sessions:
 *   sunrise — half-sun rising over a line (morning)
 *   midday  — sun at zenith with rays
 *   sunset  — half-sun setting with horizon line + dot
 */
export function SessionIcon({ kind, className = 'w-5 h-5' }: Props) {
  if (kind === 'sunrise') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <circle cx="12" cy="14" r="4.5" fill="currentColor" opacity="0.85" />
        <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M12 4 V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M5.5 7.5 L7.2 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M18.5 7.5 L16.8 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        {/* horizon arrow */}
        <path d="M9 22 L12 19 L15 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (kind === 'midday') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 2 V4.5" />
          <path d="M12 19.5 V22" />
          <path d="M2 12 H4.5" />
          <path d="M19.5 12 H22" />
          <path d="M4.8 4.8 L6.6 6.6" />
          <path d="M17.4 17.4 L19.2 19.2" />
          <path d="M19.2 4.8 L17.4 6.6" />
          <path d="M6.6 17.4 L4.8 19.2" />
        </g>
      </svg>
    );
  }
  // sunset
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <circle cx="12" cy="14" r="4.5" fill="currentColor" opacity="0.85" />
      <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* horizon arrow pointing down */}
      <path d="M9 17 L12 20 L15 17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5.5 7.5 L7.2 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M18.5 7.5 L16.8 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
