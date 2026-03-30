export default function LogoMark() {
  return (
    <div className="logo-mark" aria-label="DeltaGamma Academy">
      <svg viewBox="0 0 220 220" role="img">
        <defs>
          <linearGradient id="crestFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4fd7ff" />
            <stop offset="100%" stopColor="#1376e8" />
          </linearGradient>
        </defs>
        <path d="M110 18 176 40 110 62 44 40Z" fill="url(#crestFill)" />
        <path d="M167 41v25c0 8-5 16-14 20l-43 18-43-18c-9-4-14-12-14-20V41" fill="none" stroke="url(#crestFill)" strokeWidth="10" strokeLinejoin="round" />
        <path d="M68 78h84v56c0 28-18 48-42 57-24-9-42-29-42-57Z" fill="none" stroke="url(#crestFill)" strokeWidth="8" />
        <path d="M86 99h26v30H86z" fill="url(#crestFill)" opacity=".9" />
        <path d="M124 99h17v31h-17z" fill="url(#crestFill)" opacity=".2" />
        <path d="M167 44v34" stroke="url(#crestFill)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="167" cy="80" r="4" fill="url(#crestFill)" />
        <path d="M36 87c-15 16-22 36-23 56 10-18 20-28 34-34M184 87c15 16 22 36 23 56-10-18-20-28-34-34" fill="none" stroke="url(#crestFill)" strokeWidth="6" strokeLinecap="round" />
        <text x="127" y="124" fontSize="32" fontFamily="Georgia, serif" fill="#1376e8">Γ</text>
      </svg>
      <div>
        <strong>DeltaGamma</strong>
        <span>Academy Cloud</span>
      </div>
    </div>
  );
}
