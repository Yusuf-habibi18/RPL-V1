import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "success" | "warning" | "danger" | "info" | "primary" | "neutral";

export const TONE_TEKS: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-cyan",
  primary: "text-primary",
  neutral: "text-muted",
};

const TONE: Record<Tone, string> = {
  success: "bg-success/12 text-success ring-success/30",
  warning: "bg-warning/12 text-warning ring-warning/30",
  danger: "bg-danger/12 text-danger ring-danger/35",
  info: "bg-cyan/10 text-cyan ring-cyan/30",
  primary: "bg-primary/15 text-[#7fb2ff] ring-primary/35",
  neutral: "bg-white/5 text-muted ring-white/10",
};

interface Props {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/** Label status. Selalu berisi teks (status tidak disampaikan hanya lewat warna). */
export function Badge({ tone = "neutral", icon, children, className, size = "sm" }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2.5 py-0.5 text-xs [&_svg]:size-3.5" : "px-3 py-1 text-sm [&_svg]:size-4",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
