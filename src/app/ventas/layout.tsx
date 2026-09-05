import { requerirAdminEnPagina } from "@/lib/auth";
import { VentasTabs } from "./ventas-tabs";

export default async function VentasLayout({ children }: { children: React.ReactNode }) {
  await requerirAdminEnPagina();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <VentasTabs />
      {children}
    </div>
  );
}
