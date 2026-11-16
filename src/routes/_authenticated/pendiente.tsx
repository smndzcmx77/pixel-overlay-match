import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Clock3, LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { canUsePOS } from "@/lib/staff-access";
import { useStaffSignOut } from "@/hooks/use-staff";
import { Btn, Card } from "@/components/pos/ui";

export const Route = createFileRoute("/_authenticated/pendiente")({
  head: () => ({
    meta: [
      { title: "Cuenta pendiente · Chilaquería" },
      { name: "description", content: "Tu cuenta del personal está esperando la aprobación de un encargado." },
      { property: "og:title", content: "Cuenta pendiente · Chilaquería" },
      { property: "og:description", content: "Acceso pendiente de aprobación por un encargado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { authUser } = Route.useRouteContext();
  const navigate = useNavigate();
  const { signOut, signingOut } = useStaffSignOut();
  const [checking, setChecking] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["own-profile", authUser.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nombre, puesto, aprobado")
        .eq("id", authUser.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const checkApproval = async () => {
    setChecking(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("aprobado")
      .eq("id", authUser.id)
      .maybeSingle();
    setChecking(false);
    if (error) {
      toast.error("No se pudo comprobar la aprobación.");
      return;
    }
    if (canUsePOS(data)) await navigate({ to: "/pos", replace: true });
    else toast.info("Tu cuenta todavía está pendiente de aprobación.");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 font-sans">
      <Card className="w-full max-w-md p-7 text-center">
        <Clock3 className="mx-auto size-11 text-warning" />
        <h1 className="mt-5 font-display text-2xl font-extrabold">Cuenta pendiente de aprobación</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {profile?.nombre ? <><strong>{profile.nombre}</strong> ({profile.puesto}), tu</> : "Tu"} cuenta ya está registrada. Un encargado debe aprobarla antes de que puedas ver POS, Órdenes, Catálogos y Cocina.
        </p>
        <p className="mt-2 break-all text-xs text-muted-foreground">{authUser.email}</p>
        <div className="mt-6 space-y-3">
          <Btn className="w-full" onClick={() => void checkApproval()} disabled={checking}>
            {checking ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Comprobar aprobación
          </Btn>
          <Btn variant="outline" className="w-full" onClick={() => void signOut()} disabled={signingOut}>
            <LogOut className="size-4" /> Cerrar sesión
          </Btn>
        </div>
      </Card>
    </main>
  );
}
