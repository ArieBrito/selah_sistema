"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { login } from "@/lib/auth-actions";

function Margarita({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="32"
          cy="18"
          rx="7"
          ry="14"
          fill="var(--accent)"
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="8" fill="var(--secondary)" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [entrando, setEntrando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error("Ingresa tu correo y contraseña.");

    setEntrando(true);
    const resultado = await login({ email: email.trim(), password });
    setEntrando(false);

    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    router.push("/produccion/compras");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-secondary/25 to-accent/25 px-4 py-16">
      <Margarita className="pointer-events-none absolute top-16 left-[8%] size-16 -rotate-12 opacity-40 sm:size-20" />
      <Margarita className="pointer-events-none absolute right-[10%] bottom-20 size-20 rotate-6 opacity-30 sm:size-24" />
      <Margarita className="pointer-events-none absolute top-[55%] left-[85%] size-10 rotate-45 opacity-20" />

      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-primary/15"
        aria-hidden
      >
        <path
          d="M0,64 C240,120 480,8 720,48 C960,88 1200,24 1440,64 L1440,120 L0,120 Z"
          fill="currentColor"
        />
      </svg>

      <Card className="relative w-full max-w-sm border-border/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="items-center gap-3 text-center">
          <Image src="/logotipo.png" alt="Selah" width={160} height={46} priority className="h-11 w-auto" />
          <div className="space-y-1">
            <CardTitle className="text-xl">Panel administrativo</CardTitle>
            <CardDescription>Inicia sesión para continuar</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" loading={entrando}>
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
