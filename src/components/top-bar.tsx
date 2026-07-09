"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const enVentas = pathname?.startsWith("/ventas") ?? false;

  if (pathname?.startsWith("/login")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link href="/produccion/compras" className="flex shrink-0 items-center gap-2">
          <Image src="/logotipo.png" alt="Selah" width={96} height={28} priority className="h-6 w-auto sm:h-7" />
        </Link>

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 shadow-sm sm:gap-3 sm:px-4 sm:py-2">
          <span className={`text-sm font-medium ${!enVentas ? "text-foreground" : "text-muted-foreground"}`}>
            <span className="hidden sm:inline">🛠️ Producción</span>
            <span className="sm:hidden">🛠️</span>
          </span>
          <Switch
            checked={enVentas}
            onCheckedChange={(checked) => router.push(checked ? "/ventas" : "/produccion/compras")}
            aria-label="Cambiar entre Modo Producción y Modo Ventas"
          />
          <span className={`text-sm font-medium ${enVentas ? "text-foreground" : "text-muted-foreground"}`}>
            <span className="hidden sm:inline">💰 Ventas</span>
            <span className="sm:hidden">💰</span>
          </span>
        </div>

        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => logout()} aria-label="Cerrar sesión">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
