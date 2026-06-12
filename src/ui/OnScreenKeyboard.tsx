import './OnScreenKeyboard.css';

// On-screen keyboard so typing activities work on tablets with no physical
// keyboard (constraint #5). Touch + mouse via Pointer Events; large keys.
// Alphabetical (not QWERTY) because it is easier for early learners to find
// letters. A `digits` mode is used when the answer is a number.

interface OnScreenKeyboardProps {
  mode: 'letters' | 'digits';
  onKey: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
}

const LETTER_ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'];
const DIGIT_ROWS = ['12345', '67890'];

export function OnScreenKeyboard({
  mode,
  onKey,
  onBackspace,
  onEnter,
  disabled = false,
}: OnScreenKeyboardProps): React.JSX.Element {
  const rows = mode === 'digits' ? DIGIT_ROWS : LETTER_ROWS;

  return (
    <div className="osk" role="group" aria-label="On-screen keyboard">
      {rows.map((row) => (
        <div className="osk__row" key={row}>
          {row.split('').map((char) => (
            <button
              key={char}
              type="button"
              className="osk__key"
              onPointerDown={() => onKey(char)}
              disabled={disabled}
              aria-label={char}
            >
              {char}
            </button>
          ))}
        </div>
      ))}
      <div className="osk__row">
        <button
          type="button"
          className="osk__key osk__key--wide"
          onPointerDown={onBackspace}
          disabled={disabled}
          aria-label="Delete"
        >
          ⌫
        </button>
        <button
          type="button"
          className="osk__key osk__key--wide osk__key--enter"
          onPointerDown={onEnter}
          disabled={disabled}
          aria-label="Enter"
        >
          Enter
        </button>
      </div>
    </div>
  );
}
