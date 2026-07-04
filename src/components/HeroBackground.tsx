export function HeroBackground() {
  return (
    <svg
      className="hero-bg"
      viewBox="0 0 1600 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b4c7e" />
          <stop offset="45%" stopColor="#e07a5f" />
          <stop offset="100%" stopColor="#f4a261" />
        </linearGradient>
        <linearGradient id="hero-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1428" />
          <stop offset="100%" stopColor="#1a2340" />
        </linearGradient>
      </defs>
      <style>{`
        .hero-bg .hero-sun {
          animation: hero-sunrise 4s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }
        @keyframes hero-sunrise {
          from { transform: translateY(400px); }
          to { transform: translateY(0); }
        }
        .hero-bg .hero-nightshade {
          animation: hero-daybreak 4s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }
        @keyframes hero-daybreak {
          from { opacity: 0.65; }
          to { opacity: 0; }
        }
        .hero-bg .hero-flock {
          animation: hero-appear 1.2s ease-out 2.6s both;
        }
        @keyframes hero-appear {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-bg .hero-sun,
          .hero-bg .hero-nightshade,
          .hero-bg .hero-flock {
            animation: none;
          }
        }
      `}</style>
      <rect width="1600" height="800" fill="url(#hero-sky)" />
      <g className="hero-sun">
        <circle cx="1180" cy="430" r="170" fill="#ffe8a3" opacity="0.25" />
        <circle cx="1180" cy="430" r="120" fill="#ffe8a3" opacity="0.9" />
      </g>
      <g className="hero-flock">
        <path
          d="M120 160 q15 -18 30 0 q15 -18 30 0"
          stroke="#1b2a4a"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M220 210 q12 -15 24 0 q12 -15 24 0"
          stroke="#1b2a4a"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M60 380 C 300 300, 500 340, 680 260"
          stroke="#ffffff"
          strokeWidth="3"
          strokeDasharray="2 14"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        <g transform="translate(680,260) rotate(-25)">
          <path d="M0 0 L26 4 L10 10 L26 16 L0 20 L-8 10 Z" fill="#ffffff" />
        </g>
      </g>
      <path
        d="M0 560 L200 420 L340 520 L520 380 L700 540 L880 400 L1050 540 L1250 430 L1440 560 L1600 480 L1600 800 L0 800 Z"
        fill="#3a4f74"
        opacity="0.85"
      />
      <path
        d="M0 620 L180 500 L360 600 L560 480 L760 620 L980 500 L1180 630 L1400 520 L1600 620 L1600 800 L0 800 Z"
        fill="#26395c"
      />
      <path
        d="M0 700 L260 610 L520 700 L800 600 L1050 700 L1320 610 L1600 700 L1600 800 L0 800 Z"
        fill="#16233d"
      />
      <rect className="hero-nightshade" width="1600" height="800" fill="url(#hero-night)" opacity="0" />
    </svg>
  );
}
