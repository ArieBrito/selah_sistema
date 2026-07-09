"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/produccion/compras", label: "Registro de compras" },
  { href: "/produccion/materiales", label: "Materiales" },
  { href: "/produccion/calculadora", label: "Calculadora de precios" },
  { href: "/produccion/productos", label: "Catálogo de productos" },
  { href: "/produccion/configuracion", label: "Configuración" },
];

export function ProduccionTabs() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
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
