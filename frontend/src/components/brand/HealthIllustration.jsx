/* Decorative SVG illustration built from shapes — no external image assets. */
export default function HealthIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 560 520" className={className} role="img" aria-label="Illustration of a health worker consulting a patient with voice, safety and connectivity support">
      <defs>
        <linearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E6F7F3" />
          <stop offset="100%" stopColor="#EAF4FB" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0F766E" floodOpacity="0.12" />
        </filter>
      </defs>

      <rect x="18" y="16" width="524" height="488" rx="40" fill="url(#bgGlow)" />
      <circle cx="470" cy="88" r="56" fill="#D5F5EE" />
      <circle cx="78" cy="430" r="70" fill="#E0F2FE" />
      <circle cx="492" cy="440" r="26" fill="#CFFAFE" />

      {/* main consultation card */}
      <g filter="url(#softShadow)">
        <rect x="96" y="96" width="368" height="280" rx="26" fill="#FFFFFF" />
      </g>
      <rect x="96" y="96" width="368" height="46" rx="26" fill="#0F766E" />
      <rect x="96" y="122" width="368" height="20" fill="#0F766E" />
      <circle cx="124" cy="119" r="5" fill="#38BDF8" />
      <circle cx="142" cy="119" r="5" fill="#ffffff" opacity="0.5" />
      <circle cx="160" cy="119" r="5" fill="#ffffff" opacity="0.3" />
      <text x="182" y="124" fill="#FFFFFF" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif">VOICE CONSULTATION</text>

      {/* worker */}
      <circle cx="192" cy="190" r="26" fill="#D5F5EE" />
      <circle cx="192" cy="182" r="10" fill="#0F766E" />
      <path d="M174 212c2-12 9-18 18-18s16 6 18 18" fill="#0F766E" />
      <rect x="156" y="224" width="72" height="10" rx="5" fill="#E2E8F0" />

      {/* voice wave */}
      <rect x="248" y="168" width="168" height="72" rx="16" fill="#F0FDFA" stroke="#CCFBF1" />
      {[10, 22, 34, 18, 42, 26, 14, 32, 20, 38, 12].map((height, index) => (
        <rect key={index} x={262 + index * 13} y={204 - height / 2} width="6" height={height} rx="3" fill={index % 3 === 0 ? '#38BDF8' : '#0F766E'} opacity={0.45 + (index % 4) * 0.15} />
      ))}
      <text x="332" y="252" textAnchor="middle" fill="#0F766E" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">ಕನ್ನಡ · हिन्दी · English</text>

      {/* patient */}
      <circle cx="192" cy="296" r="20" fill="#E0F2FE" />
      <circle cx="192" cy="290" r="8" fill="#164E63" />
      <path d="M177 315c2-9 7-14 15-14s13 5 15 14" fill="#164E63" />
      <rect x="158" y="328" width="68" height="9" rx="4.5" fill="#E2E8F0" />
      <rect x="158" y="342" width="46" height="9" rx="4.5" fill="#E2E8F0" />

      {/* assessment summary */}
      <rect x="248" y="270" width="168" height="82" rx="14" fill="#F8FAFC" stroke="#E2E8F0" />
      <rect x="262" y="284" width="52" height="7" rx="3.5" fill="#CBD5E1" />
      <rect x="262" y="300" width="112" height="7" rx="3.5" fill="#E2E8F0" />
      <rect x="262" y="316" width="88" height="7" rx="3.5" fill="#E2E8F0" />
      <rect x="262" y="332" width="64" height="7" rx="3.5" fill="#99F6E4" />

      {/* floating safety badge */}
      <g filter="url(#softShadow)">
        <rect x="350" y="42" width="160" height="62" rx="16" fill="#FFFFFF" />
      </g>
      <circle cx="380" cy="73" r="15" fill="#DCFCE7" />
      <path d="m374 73 4 4 8-9" stroke="#16A34A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="403" y="69" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">Safety checks</text>
      <text x="403" y="84" fill="#64748B" fontSize="10" fontFamily="Inter, sans-serif">Review before action</text>

      {/* floating offline badge */}
      <g filter="url(#softShadow)">
        <rect x="34" y="336" width="164" height="62" rx="16" fill="#FFFFFF" />
      </g>
      <circle cx="64" cy="367" r="15" fill="#E0F2FE" />
      <path d="M57 371a10 10 0 0 1 14 0M60 366a6 6 0 0 1 8 0" stroke="#0284C7" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="86" y="363" fill="#0F172A" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">Offline first</text>
      <text x="86" y="378" fill="#64748B" fontSize="10" fontFamily="Inter, sans-serif">Records saved locally</text>

      {/* connector dots */}
      <circle cx="330" cy="412" r="5" fill="#0F766E" opacity="0.3" />
      <circle cx="350" cy="412" r="5" fill="#0F766E" opacity="0.2" />
      <circle cx="370" cy="412" r="5" fill="#0F766E" opacity="0.1" />
    </svg>
  );
}
