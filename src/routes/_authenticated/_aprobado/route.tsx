import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { canUsePOS } from "@/lib/staff-access";

export const Route = createFileRoute("/_authenticated/_aprobado")({
  beforeLoad: async ({ context }) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, nombre, puesto, aprobado")
      .eq("id", context.authUser.id)
      .maybeSingle();

    if (error || !canUsePOS(profile)) throw redirect({ to: "/pendiente" });
    return { profile: profile! };
  },
  component: () => <Outlet />,
});
