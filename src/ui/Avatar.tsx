import './Avatar.css';

// A simple, privacy-safe identity marker: a coloured disc with the child's
// first initial. No photos, no personal data — just enough for a young child to
// recognise their own name tile.

const TONES = ['reading', 'writing', 'numeracy', 'digital'] as const;

interface AvatarProps {
  name: string;
  avatar: number;
  size?: 'md' | 'lg';
}

export function Avatar({ name, avatar, size = 'md' }: AvatarProps): React.JSX.Element {
  const tone = TONES[avatar % TONES.length];
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className={`avatar avatar--${size}`} data-tone={tone} aria-hidden="true">
      {initial}
    </span>
  );
}
