"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { aktifPada, menuUntuk } from "@/components/layout/nav";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";
import { inisial } from "@/lib/format";
import { LABEL_PERAN } from "@/types";
import type { PenggunaShell } from "@/components/layout/DashboardShell";

/** Isi sidebar, dipakai di desktop dan di laci (drawer) ponsel. */
export function SidebarContent({ user, onNavigate }: { user: PenggunaShell; onNavigate?: () => void }) {
  const pathname = usePathname();
  const menu = menuUntuk(user.peran);

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-6 pt-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Agri-Analytics, ke dashboard">
          <Logo />
        </Link>
      </div>

      <p className="px-6 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/70">Menu utama</p>
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menu.map(({ href, label, ikon: Ikon }) => {
            const on = aktifPada(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                    on
                      ? "bg-gradient-to-r from-primary/20 to-primary/5 text-fg ring-1 ring-inset ring-primary/30"
                      : "text-muted hover:bg-white/[0.04] hover:text-fg",
                  )}
                >
                  {on && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-cyan shadow-[0_0_10px_#27C7F5]" />}
                  <Ikon className={cn("size-[18px]", on ? "text-cyan" : "text-muted group-hover:text-fg")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="m-3 rounded-2xl border border-line bg-bg/40 p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan text-sm font-bold text-white">
            {inisial(user.nama)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.nama}</p>
            <p className="truncate text-xs text-muted">{user.konteks ?? LABEL_PERAN[user.peran]}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="size-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user: PenggunaShell }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-sidebar/90 backdrop-blur-md lg:block">
      <SidebarContent user={user} />
    </aside>
  );
}
