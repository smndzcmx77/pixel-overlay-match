import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChefHat, ClipboardList, Database, LayoutGrid, LoaderCircle, LogOut, Package, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { seed } from "@/lib/pos-store";
import { usePOS } from "@/lib/use-pos";
import { useIsManager, useStaffSignOut } from "@/hooks/use-staff";
import { cn } from "@/lib/utils";
import { POSView } from "@/components/pos/POSView";
import { OrdenesView } from "@/components/pos/OrdenesView";
import { CatalogosView } from "@/components/pos/CatalogosView";
import { Btn, Card } from "@/components/pos/ui";

export const Route = createFileRoute("/_authenticated/_aprobado/pos")({
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
  component: POSPage,
});

const TABS = [
  { id: "pos", label: "POS", icon: LayoutGrid },
  { id: "ordenes", label: "Órdenes", icon: ClipboardList },
  { id: "catalogos", label: "Catálogos", icon: Package },
  { id: "kds", label: "Cocina", icon: ChefHat },
] as const;

function POSPage() {
  const { authUser, profile } = Route.useRouteContext();
  const { state, update, loading, saving, error, imported, retry } = usePOS();
  const { isManager } = useIsManager(authUser.id);
  const { signOut, signingOut } = useStaffSignOut();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pos");
  const pendientes = state?.ordenes.filter((o) => o.estado === "Pendiente Cocina").length ?? 0;

  useEffect(() => {
    if (imported) toast.success("Tus datos del navegador se importaron a Supabase.");
  }, [imported]);

  const restaurar = async () => {
    if (!confirm("¿Restaurar datos demo en Supabase? Se perderán los cambios.")) return;
    try {
      await update(() => seed());
      toast.success("Datos demo restaurados en Supabase");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudieron restaurar los datos.");
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto flex items-center gap-2">
            <span className="text-2xl">🌶️</span>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-primary">Chilaquería</h1>
              <p className="hidden text-xs text-muted-foreground lg:block">{profile.nombre} · {profile.puesto}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Datos centralizados en Supabase">
            {saving ? <LoaderCircle className="size-3.5 animate-spin" /> : <Database className="size-3.5 text-success" />}
            <span className="hidden md:inline">{saving ? "Guardando…" : "Supabase"}</span>
          </div>
          <nav className="flex gap-1 rounded-xl bg-muted p-1" aria-label="Secciones del punto de venta">
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
          {isManager && (
            <Link to="/personal" className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground">
              <Users className="size-4" /><span className="hidden md:inline">Personal</span>
            </Link>
          )}
          <button
            title="Restaurar datos demo"
            disabled={!state || saving}
            onClick={() => void restaurar()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            title="Cerrar sesión"
            disabled={signingOut}
            onClick={() => void signOut()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            {signingOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && state && <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}
        {loading || !state ? (
          <Card className="mx-auto max-w-lg py-10 text-center">
            {error ? (
              <div className="space-y-4">
                <p className="text-sm text-destructive" role="alert">{error}</p>
                <Btn onClick={() => void retry()}>Reintentar conexión</Btn>
              </div>
            ) : (
              <p className="flex items-center justify-center gap-2 text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Cargando datos de Supabase…</p>
            )}
          </Card>
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
    </div>
  );
}
