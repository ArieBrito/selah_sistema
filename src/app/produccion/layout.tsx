import { ProduccionTabs } from "./produccion-tabs";

export default function ProduccionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <ProduccionTabs />
      <div className="mt-6">{children}</div>
    </div>
  );
}
