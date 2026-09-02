import type { HTMLAttributes, ReactNode } from 'react';

type SectionHeadingProps = HTMLAttributes<HTMLHeadingElement> & { children: ReactNode };

export function SectionHeading({ children, className = '', ...props }: SectionHeadingProps) {
  return (
    <h2 className={`section-heading ${className}`.trim()} {...props}>
      {children}
    </h2>
  );
}
