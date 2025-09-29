import type React from "react";
import { cn } from "@/lib/utils";
import styles from "./typography.module.scss";

interface TypographyProps {
  children?: React.ReactNode;
  className?: string;
  dangerouslySetInnerHTML?: { __html: string };
}

export function Display({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(styles.display, "font-serif text-balance", className)}>
      {children}
    </h1>
  );
}

export function Headline({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(styles.headline, "font-serif text-balance", className)}>
      {children}
    </h2>
  );
}

export function Title({ children, className }: TypographyProps) {
  return (
    <h3 className={cn(styles.title, "font-sans text-pretty", className)}>
      {children}
    </h3>
  );
}

export function BodyLarge({ children, className }: TypographyProps) {
  return (
    <p className={cn(styles.bodyLarge, "text-pretty", className)}>{children}</p>
  );
}

export function Body({ children, className }: TypographyProps) {
  return (
    <p className={cn(styles.body, "text-pretty", className)}>{children}</p>
  );
}

export function Caption({ children, className }: TypographyProps) {
  return <p className={cn(styles.caption, className)}>{children}</p>;
}

export function Micro({ children, className }: TypographyProps) {
  return <span className={cn(styles.micro, className)}>{children}</span>;
}
