import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

const VARIANT = {
  primary:
    "bg-primary text-white shadow-[0_8px_22px_-10px_rgb(36_123_255/0.9)] hover:bg-[#3a89ff] active:bg-[#1f6ee6]",
  secondary: "border border-line bg-card-2/80 text-fg hover:border-primary/40 hover:bg-[#1b3157]",
  ghost: "text-muted hover:bg-white/5 hover:text-fg",
  success: "bg-success/15 text-success ring-1 ring-inset ring-success/30 hover:bg-success/25",
  danger: "bg-danger/12 text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger/22",
} as const;

const SIZE = {
  sm: "h-9 gap-1.5 px-3 text-sm [&_svg]:size-4",
  md: "h-11 gap-2 px-4 text-sm [&_svg]:size-[18px]",
  lg: "h-12 gap-2 px-5 text-base [&_svg]:size-5",
  icon: "size-10 [&_svg]:size-5",
} as const;

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({ variant, size, loading, className, children, disabled, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <LoaderCircle className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({ variant = "secondary", size = "sm", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
