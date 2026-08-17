"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types";

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const ITEMS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prospeccao", label: "Prospecção" },
  { href: "/leads", label: "Leads" },
  { href: "/empresas", label: "Empresas" },
  { href: "/vendedoras", label: "Vendedora" },
  { href: "/configuracoes", label: "Config.", adminOnly: true },
];

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <nav className="md:hidden sticky top-0 z-20 flex gap-1 overflow-x-auto bg-brand-950 px-3 py-2 scrollbar-thin">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium",
              active ? "bg-white/15 text-white" : "text-white/60"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
