export function LogoIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f8a"/>
          <stop offset="50%" stopColor="#f97316"/>
          <stop offset="100%" stopColor="#eab308"/>
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="4" height="4" fill="url(#lg1)" opacity="0.9"/>
      <rect x="4" y="12" width="4" height="4" fill="url(#lg1)"/>
      <rect x="4" y="16" width="4" height="4" fill="url(#lg1)"/>
      <rect x="4" y="20" width="4" height="4" fill="url(#lg1)"/>
      <rect x="4" y="24" width="4" height="4" fill="url(#lg1)" opacity="0.9"/>
      <rect x="8" y="8" width="4" height="4" fill="url(#lg1)" opacity="0.7"/>
      <rect x="8" y="24" width="4" height="4" fill="url(#lg1)" opacity="0.7"/>
      <rect x="2" y="6" width="2" height="2" fill="url(#lg1)" opacity="0.4"/>
      <rect x="0" y="14" width="2" height="2" fill="url(#lg1)" opacity="0.25"/>
      <rect x="2" y="26" width="2" height="2" fill="url(#lg1)" opacity="0.35"/>
      <rect x="28" y="8" width="4" height="4" fill="url(#lg1)" opacity="0.9"/>
      <rect x="28" y="12" width="4" height="4" fill="url(#lg1)"/>
      <rect x="28" y="16" width="4" height="4" fill="url(#lg1)"/>
      <rect x="28" y="20" width="4" height="4" fill="url(#lg1)"/>
      <rect x="28" y="24" width="4" height="4" fill="url(#lg1)" opacity="0.9"/>
      <rect x="24" y="8" width="4" height="4" fill="url(#lg1)" opacity="0.7"/>
      <rect x="24" y="24" width="4" height="4" fill="url(#lg1)" opacity="0.7"/>
      <rect x="32" y="6" width="2" height="2" fill="url(#lg1)" opacity="0.4"/>
      <rect x="34" y="14" width="2" height="2" fill="url(#lg1)" opacity="0.25"/>
      <rect x="32" y="26" width="2" height="2" fill="url(#lg1)" opacity="0.35"/>
      <rect x="16" y="10" width="4" height="4" fill="url(#lg1)" opacity="0.95"/>
      <rect x="14" y="14" width="4" height="4" fill="url(#lg1)"/>
      <rect x="18" y="18" width="4" height="4" fill="url(#lg1)"/>
      <rect x="16" y="22" width="4" height="4" fill="url(#lg1)" opacity="0.95"/>
    </svg>
  );
}

export function LogoFull({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <LogoIcon size={size} />
      <span style={{
        fontSize: size * 0.7,
        fontWeight: 900,
        background: "linear-gradient(135deg, #f43f8a, #f97316, #eab308)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.5px",
        fontFamily: "Inter, sans-serif",
      }}>
        DevSpace
      </span>
    </div>
  );
}