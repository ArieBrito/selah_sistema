import { VentasTabs } from "./ventas-tabs";

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <VentasTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
