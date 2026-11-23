"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/Button";

/** Tombol submit yang otomatis menampilkan status memuat saat form diproses. */
export function SubmitButton({
  children,
  variant = "primary",
  className,
  size = "md",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} loading={pending} className={className} size={size}>
      {children}
    </Button>
  );
}
