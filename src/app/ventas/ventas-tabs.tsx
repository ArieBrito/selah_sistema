"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/ventas", label: "Ventas" },
  { href: "/ventas/dashboard", label: "Dashboard" },
];

export function VentasTabs() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = tab.href === "/ventas" ? pathname === "/ventas" : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "border-b-2 border-primary text-primary"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
