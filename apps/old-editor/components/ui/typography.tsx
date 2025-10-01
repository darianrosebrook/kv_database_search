import type React from "react"
import { cn } from "@/lib/utils"

interface TypographyProps {
  children: React.ReactNode
  className?: string
}

export function Display({ children, className }: TypographyProps) {
  return <h1 className={cn("text-display font-serif text-balance", className)}>{children}</h1>
}

export function Headline({ children, className }: TypographyProps) {
  return <h2 className={cn("text-headline font-serif text-balance", className)}>{children}</h2>
}

export function Title({ children, className }: TypographyProps) {
  return <h3 className={cn("text-title font-sans text-pretty", className)}>{children}</h3>
}

export function BodyLarge({ children, className }: TypographyProps) {
  return <p className={cn("text-body-large text-pretty", className)}>{children}</p>
}

export function Body({ children, className }: TypographyProps) {
  return <p className={cn("text-body text-pretty", className)}>{children}</p>
}

export function Caption({ children, className }: TypographyProps) {
  return <p className={cn("text-caption", className)}>{children}</p>
}

export function Micro({ children, className }: TypographyProps) {
  return <span className={cn("text-micro", className)}>{children}</span>
}
