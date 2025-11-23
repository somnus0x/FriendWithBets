// src/components/ape-button.tsx
import { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Props = ButtonHTMLAttributes<HTMLButtonElement>

export function ApeButton({ className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border-2 border-casino px-4 py-3 text-sm font-bold text-primary-foreground casino-gradient casino-glow transition-all hover:scale-105 hover:casino-glow active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      🦍 {children}
    </button>
  )
}

