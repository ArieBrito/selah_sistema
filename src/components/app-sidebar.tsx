"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ITEMS_ADMIN = [
  { href: "/produccion/compras", label: "Panel de producción" },
  { href: "/ventas", label: "Panel de ventas" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/registro-pulseras", label: "Registro de pulseras" },
];

const ITEMS_USUARIO = [{ href: "/registro-pulseras", label: "Registro de pulseras" }];

export function AppSidebar({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = esAdmin ? ITEMS_ADMIN : ITEMS_USUARIO;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button type="button" variant="ghost" size="icon" aria-label="Abrir menú" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent>
        <nav className="mt-2 flex flex-col gap-2">
          {items.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg bg-card px-4 py-2.5 text-center text-sm font-medium shadow-sm transition-colors",
                  active ? "text-primary" : "text-foreground hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
