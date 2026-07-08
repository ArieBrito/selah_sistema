import { cn } from "@/lib/utils";

const ESTILOS: Record<string, string> = {
  C: "bg-muted text-muted-foreground",
  B: "bg-[#dbeee3] text-[#2f6b4c]",
  A: "bg-[#f6e2b0] text-[#6b4f1d]",
  A3: "bg-[#f2c98a] text-[#6b4f1d]",
  A2: "bg-[#f0b96a] text-[#5a3d12]",
  A1: "bg-[#eaa64a] text-[#4a2f0a]",
  M: "bg-[#f5b8b0] text-[#7a2e27]",
};

export function BadgeClasificacion({ clasif }: { clasif: string | null }) {
  if (!clasif) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
        Sin clasificar
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ESTILOS[clasif] ?? "bg-muted text-muted-foreground"
      )}
    >
      {clasif === "M" ? "M · Premium" : clasif}
    </span>
  );
}
