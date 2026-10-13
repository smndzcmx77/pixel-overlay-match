import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChefHat, ClipboardList, LayoutGrid, Package, RotateCcw } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { seed, usePOS } from "@/lib/pos-store";
import { cn } from "@/lib/utils";
import { POSView } from "@/components/pos/POSView";
import { OrdenesView } from "@/components/pos/OrdenesView";
import { CatalogosView } from "@/components/pos/CatalogosView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chilaquería · Punto de Venta" },
      { name: "description", content: "Captura comandas, cobra y controla el inventario de Chilaquería." },
      { property: "og:title", content: "Chilaquería · Punto de Venta" },
      { property: "og:description", content: "Captura comandas, cobra y controla el inventario de Chilaquería." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TABS = [
  { id: "pos", label: "POS", icon: LayoutGrid },
  { id: "ordenes", label: "Órdenes", icon: ClipboardList },
  { id: "catalogos", label: "Catálogos", icon: Package },
  { id: "kds", label: "Cocina", icon: ChefHat },
] as const;

function Index() {
  const { state, update } = usePOS();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pos");
  const pendientes = state?.ordenes.filter((o) => o.estado === "Pendiente Cocina").length ?? 0;

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto flex items-center gap-2">
            <span className="text-2xl">🌶️</span>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">Chilaquería</h1>
          </div>
          <nav className="flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  tab === t.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <t.icon className="size-4" />
                <span className="hidden sm:inline">{t.label}</span>
                {t.id === "kds" && pendientes > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{pendientes}</span>
                )}
              </button>
            ))}
          </nav>
          <button
            title="Restaurar datos demo"
            onClick={() => confirm("¿Restaurar datos demo? Se perderán los cambios.") && update(() => seed())}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {!state ? (
          <p className="py-16 text-center text-muted-foreground">Cargando…</p>
        ) : tab === "pos" ? (
          <POSView state={state} update={update} />
        ) : tab === "ordenes" ? (
          <OrdenesView state={state} update={update} />
        ) : tab === "catalogos" ? (
          <CatalogosView state={state} update={update} />
        ) : (
          <OrdenesView state={state} update={update} kds />
        )}
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
