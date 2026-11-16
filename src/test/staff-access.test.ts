import { describe, expect, it } from "vitest";
import { canManageStaff, canUsePOS, safeStaffRedirect } from "@/lib/staff-access";

describe("Acceso del personal", () => {
  it("permite usar el POS únicamente con una cuenta aprobada", () => {
    expect(canUsePOS({ aprobado: true })).toBe(true);
    expect(canUsePOS({ aprobado: false })).toBe(false);
    expect(canUsePOS(null)).toBe(false);
  });

  it("permite aprobar personal solo a un encargado que también está aprobado", () => {
    expect(canManageStaff({ aprobado: true }, ["encargado"])).toBe(true);
    expect(canManageStaff({ aprobado: false }, ["encargado"])).toBe(false);
    expect(canManageStaff({ aprobado: true }, [])).toBe(false);
  });

  it("limita el regreso tras iniciar sesión a rutas internas", () => {
    expect(safeStaffRedirect("/personal")).toBe("/personal");
    expect(safeStaffRedirect("https://example.com")).toBe("/pos");
    expect(safeStaffRedirect("//example.com")).toBe("/pos");
  });
});
