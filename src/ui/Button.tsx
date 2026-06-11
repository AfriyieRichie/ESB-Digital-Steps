import type { ButtonHTMLAttributes } from 'react';
import './Button.css';

type Variant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Shared button with large touch targets and visible focus baked in. */
export function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...rest
}: ButtonProps): React.JSX.Element {
  const classes = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');
  // eslint-disable-next-line react/button-has-type -- type is constrained above.
  return <button type={type} className={classes} {...rest} />;
}
