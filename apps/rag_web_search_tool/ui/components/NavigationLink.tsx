/**
 * Next.js Link component alternative for Vite/React
 * Provides similar API to Next.js Link component
 */
import React from "react";

export interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  prefetch?: boolean;
  ref?: React.Ref<HTMLAnchorElement>;
}

export const NavigationLink = React.forwardRef<HTMLAnchorElement, NavigationLinkProps>(
  (
    { href, children, className, style, target, rel, onClick, ...props },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e);
      }

      // Handle internal navigation if needed
      if (href.startsWith("/") && !target) {
        e.preventDefault();
        // You could implement client-side routing here
        window.location.href = href;
      }
    };

    return (
      <a
        href={href}
        className={className}
        style={style}
        target={target}
        rel={rel}
        onClick={handleClick}
        ref={ref}
      >
        {children}
      </a>
    );
  }
);

export default NavigationLink;
