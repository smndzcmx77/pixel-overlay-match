import { describe, expect, it } from "vitest";
import { crearSolicitudAlertaStock } from "@/lib/stock-alert.functions";

describe("webhook de alertas de stock", () => {
  it("genera una solicitud POST con el JSON de cinco campos solicitado", () => {
    const request = crearSolicitudAlertaStock({
      nombre: "Refresco",
      categoria: "Bebidas",
      disponible: 9,
      minimo_reorden: 10,
      unidad_medida: "Unidades",
    });

    expect(request.method).toBe("POST");
    expect(request.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(request.body))).toEqual({
      nombre: "Refresco",
      categoria: "Bebidas",
      disponible: 9,
      minimo_reorden: 10,
      unidad_medida: "Unidades",
    });
  });
});
