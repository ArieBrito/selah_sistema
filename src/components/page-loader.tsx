import { Loader2Icon } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-muted-foreground">
      <Loader2Icon className="size-6 animate-spin" />
      <p className="text-sm">Cargando...</p>
    </div>
  );
}
