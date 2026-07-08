"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const enVentas = pathname?.startsWith("/ventas") ?? false;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/produccion/compras" className="flex items-center gap-2">
          <Image src="/logotipo.png" alt="Selah" width={96} height={28} priority className="h-7 w-auto" />
        </Link>

        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
          <span className={`text-sm font-medium ${!enVentas ? "text-foreground" : "text-muted-foreground"}`}>
            🛠️ Producción
          </span>
          <Switch
            checked={enVentas}
            onCheckedChange={(checked) => router.push(checked ? "/ventas" : "/produccion/compras")}
            aria-label="Cambiar entre Modo Producción y Modo Ventas"
          />
          <span className={`text-sm font-medium ${enVentas ? "text-foreground" : "text-muted-foreground"}`}>
            💰 Ventas
          </span>
        </div>
      </div>
    </header>
  );
}
