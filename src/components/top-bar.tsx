"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";

export function TopBar() {
  const pathname = usePathname();

  if (pathname?.startsWith("/login")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:px-6">
        <AppSidebar />

        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logotipo.png" alt="Selah" width={96} height={28} priority className="h-6 w-auto sm:h-7" />
        </Link>

        <div className="flex-1" />

        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => logout()} aria-label="Cerrar sesión">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
