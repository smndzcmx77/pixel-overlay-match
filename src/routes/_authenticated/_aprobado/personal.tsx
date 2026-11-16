import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, LoaderCircle, LogOut, ShieldCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setStaffApproval } from "@/lib/staff.functions";
import { canManageStaff } from "@/lib/staff-access";
import { useStaffSignOut } from "@/hooks/use-staff";
import { Btn, Card } from "@/components/pos/ui";

export const Route = createFileRoute("/_authenticated/_aprobado/personal")({
  beforeLoad: async ({ context }) => {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.authUser.id);
    if (error || !canManageStaff(context.profile, (roles ?? []).map((row) => row.role))) {
      throw redirect({ to: "/pos" });
    }
  },
  head: () => ({
    meta: [
      { title: "Aprobación del personal · Chilaquería" },
      { name: "description", content: "Aprueba cuentas y administra el acceso del personal al punto de venta de Chilaquería." },
      { property: "og:title", content: "Aprobación del personal · Chilaquería" },
      { property: "og:description", content: "Gestión de acceso exclusiva para encargados de Chilaquería." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const { authUser } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const changeApproval = useServerFn(setStaffApproval);
  const { signOut, signingOut } = useStaffSignOut();
  const [busyId, setBusyId] = useState("");
  const { data: staff = [], isLoading, error, refetch } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("profiles")
        .select("id, nombre, puesto, aprobado, created_at")
        .order("created_at", { ascending: true });
      if (queryError) throw queryError;
      return data;
    },
  });

  const updateApproval = async (profileId: string, aprobado: boolean) => {
    setBusyId(profileId);
    try {
      await changeApproval({ data: { profileId, aprobado } });
      await queryClient.invalidateQueries({ queryKey: ["staff-profiles"] });
      toast.success(aprobado ? "Acceso aprobado." : "Acceso retirado.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No se pudo cambiar el acceso.");
    } finally {
      setBusyId("");
    }
  };

  const pending = staff.filter((person) => !person.aprobado);
  const approved = staff.filter((person) => person.aprobado);

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-4">
          <Link to="/pos" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver al POS
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Encargado</span>
            <Btn variant="ghost" onClick={() => void signOut()} disabled={signingOut} title="Cerrar sesión">
              <LogOut className="size-4" /><span className="hidden sm:inline">Salir</span>
            </Btn>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold"><Users className="size-7 text-primary" /> Personal</h1>
          <p className="mt-2 text-sm text-muted-foreground">Aprueba las cuentas que pueden ver y operar POS, Órdenes, Catálogos y Cocina.</p>
        </div>

        {error ? (
          <Card className="space-y-4 text-center">
            <p className="text-sm text-destructive" role="alert">No se pudo cargar el personal.</p>
            <Btn variant="outline" onClick={() => void refetch()}>Reintentar</Btn>
          </Card>
        ) : isLoading ? (
          <Card className="flex justify-center py-10"><LoaderCircle className="size-5 animate-spin text-primary" /></Card>
        ) : (
          <>
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Solicitudes pendientes ({pending.length})</h2>
              {pending.length === 0 ? (
                <Card className="text-sm text-muted-foreground">No hay solicitudes pendientes.</Card>
              ) : (
                <div className="space-y-3">
                  {pending.map((person) => (
                    <Card key={person.id} className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{person.nombre || "Sin nombre"}</p>
                        <p className="text-sm text-muted-foreground">{person.puesto || "Sin puesto"}</p>
                      </div>
                      <Btn onClick={() => void updateApproval(person.id, true)} disabled={busyId === person.id}>
                        {busyId === person.id ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                        Aprobar acceso
                      </Btn>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Personal con acceso ({approved.length})</h2>
              <div className="space-y-3">
                {approved.map((person) => (
                  <Card key={person.id} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{person.nombre || "Sin nombre"}{person.id === authUser.id && <span className="ml-2 text-xs font-normal text-muted-foreground">(tú)</span>}</p>
                      <p className="text-sm text-muted-foreground">{person.puesto || "Sin puesto"}</p>
                    </div>
                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">Aprobado</span>
                    {person.id !== authUser.id && (
                      <Btn variant="outline" onClick={() => void updateApproval(person.id, false)} disabled={busyId === person.id}>
                        {busyId === person.id ? <LoaderCircle className="size-4 animate-spin" /> : <UserX className="size-4" />}
                        Retirar acceso
                      </Btn>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
