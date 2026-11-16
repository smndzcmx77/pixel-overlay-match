import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canManageStaff } from "@/lib/staff-access";

export const setStaffApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ profileId: z.string().uuid(), aprobado: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
      context.supabase.from("profiles").select("aprobado").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);

    if (profileError || rolesError) throw new Error("No se pudieron comprobar tus permisos.");
    if (!canManageStaff(profile, (roles ?? []).map((row) => row.role))) {
      throw new Error("Solo un encargado aprobado puede cambiar el acceso del personal.");
    }
    if (data.profileId === context.userId && !data.aprobado) {
      throw new Error("No puedes retirar tu propio acceso de encargado.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ aprobado: data.aprobado })
      .eq("id", data.profileId);

    if (error) throw new Error("No se pudo actualizar el acceso del personal.");
    return { success: true };
  });
