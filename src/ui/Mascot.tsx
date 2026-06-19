import './Mascot.css';

// "Tema" — the friendly star mascot who guides and reacts throughout the app.
// Hand-authored SVG so it stays crisp at any size, bundles with zero weight, and
// works fully offline. Moods let it come alive: cheering on a correct answer,
// gently encouraging on a wrong one, thinking while the child reads.

export type MascotMood = 'happy' | 'cheer' | 'think' | 'oops';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
}

export function Mascot({ mood = 'happy', size = 120 }: MascotProps): React.JSX.Element {
  const cheering = mood === 'cheer';
  return (
    <span className={`mascot mascot--${mood}`} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img">
        <defs>
          <linearGradient id="mascot-star" x1="60" y1="6" x2="60" y2="112" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe08a" />
            <stop offset="1" stopColor="#ffb01f" />
          </linearGradient>
        </defs>

        {/* Star body */}
        <path
          className="mascot__body"
          d="M60 8 L73 42 L110 45 L82 69 L91 106 L60 86 L29 106 L38 69 L10 45 L47 42 Z"
          fill="url(#mascot-star)"
          stroke="#f59e0b"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Cheeks */}
        <circle cx="44" cy="68" r="6" fill="#ff8aa0" opacity="0.7" />
        <circle cx="76" cy="68" r="6" fill="#ff8aa0" opacity="0.7" />

        {/* Eyes */}
        {mood === 'oops' ? (
          <>
            <circle cx="49" cy="58" r="9" fill="#243b53" />
            <circle cx="71" cy="58" r="9" fill="#243b53" />
            <circle cx="51" cy="55" r="3" fill="#ffffff" />
            <circle cx="73" cy="55" r="3" fill="#ffffff" />
          </>
        ) : (
          <>
            <circle cx="49" cy="58" r="7.5" fill="#243b53" />
            <circle cx="71" cy="58" r="7.5" fill="#243b53" />
            <circle cx="51.5" cy="55.5" r="2.5" fill="#ffffff" />
            <circle cx="73.5" cy="55.5" r="2.5" fill="#ffffff" />
          </>
        )}

        {/* Mouth per mood */}
        {mood === 'cheer' && <path d="M48 72 Q60 88 72 72 Q60 80 48 72 Z" fill="#243b53" />}
        {mood === 'happy' && (
          <path d="M50 73 Q60 82 70 73" stroke="#243b53" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {mood === 'think' && (
          <path d="M52 76 H68" stroke="#243b53" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}
        {mood === 'oops' && <circle cx="60" cy="76" r="5" fill="#243b53" />}

        {/* Sparkles when cheering */}
        {cheering && (
          <g className="mascot__sparkles" fill="#ffd97a">
            <path d="M16 24 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
            <path d="M104 22 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
          </g>
        )}

        {/* Thought dot when thinking */}
        {mood === 'think' && <circle className="mascot__think" cx="92" cy="40" r="5" fill="#7c5cff" />}
      </svg>
    </span>
  );
}
