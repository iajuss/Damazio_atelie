import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type NativeButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const classes = `button button--${variant} ${className}`.trim();

  if ('href' in props && props.href) {
    return (
      <a className={classes} data-variant={variant} {...props}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button className={classes} data-variant={variant} type="button" {...buttonProps}>
      {children}
    </button>
  );
}
