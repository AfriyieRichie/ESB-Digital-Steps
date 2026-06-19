import './Scene.css';

// One cohesive "world" behind the whole app: a warm sky, a soft sun, drifting
// clouds, gentle rolling hills and a few trees — so every screen feels like the
// same friendly place (the way a good kids' app has a single world, not a set of
// pages). Hand-authored SVG: crisp at any size, weightless, fully offline.

export function Scene(): React.JSX.Element {
  return (
    <div className="scene" aria-hidden="true">
      <svg
        className="scene__svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dff1ff" />
            <stop offset="0.55" stopColor="#eaf6ff" />
            <stop offset="1" stopColor="#fff2dd" />
          </linearGradient>
          <radialGradient id="scene-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffe9a8" />
            <stop offset="0.6" stopColor="#ffd36b" />
            <stop offset="1" stopColor="#ffd36b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Sky */}
        <rect width="1440" height="900" fill="url(#scene-sky)" />

        {/* Sun with a soft glow */}
        <circle cx="1180" cy="180" r="230" fill="url(#scene-sun)" opacity="0.8" />
        <circle cx="1180" cy="180" r="74" fill="#ffd96f" />

        {/* Clouds */}
        <g className="scene__clouds" fill="#ffffff" opacity="0.85">
          <g className="scene__cloud scene__cloud--a">
            <ellipse cx="300" cy="170" rx="70" ry="34" />
            <ellipse cx="350" cy="160" rx="54" ry="40" />
            <ellipse cx="250" cy="178" rx="46" ry="30" />
          </g>
          <g className="scene__cloud scene__cloud--b">
            <ellipse cx="820" cy="120" rx="60" ry="28" />
            <ellipse cx="860" cy="112" rx="44" ry="32" />
            <ellipse cx="780" cy="126" rx="38" ry="24" />
          </g>
        </g>

        {/* Far hill */}
        <path d="M0 720 Q 360 600 720 700 T 1440 660 V900 H0 Z" fill="#cfeccb" />
        {/* Near hill */}
        <path d="M0 800 Q 420 690 860 780 T 1440 760 V900 H0 Z" fill="#a9dca0" />

        {/* Little trees on the near hill */}
        <g className="scene__trees">
          <g transform="translate(180 752)">
            <rect x="-6" y="0" width="12" height="34" rx="4" fill="#9a6a2f" />
            <circle cx="0" cy="-8" r="30" fill="#5cb85c" />
          </g>
          <g transform="translate(1080 770)">
            <rect x="-6" y="0" width="12" height="30" rx="4" fill="#9a6a2f" />
            <circle cx="0" cy="-6" r="26" fill="#5cb85c" />
          </g>
          <g transform="translate(640 788)">
            <rect x="-5" y="0" width="10" height="26" rx="4" fill="#9a6a2f" />
            <circle cx="0" cy="-6" r="22" fill="#69c269" />
          </g>
        </g>
      </svg>
    </div>
  );
}
