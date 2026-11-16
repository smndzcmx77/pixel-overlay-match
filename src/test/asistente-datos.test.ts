import { describe, expect, it } from "vitest";
import { construirContextoAsistente } from "@/lib/asistente-datos";
import { seed, type Orden } from "@/lib/pos-store";

const orden = (id: string, estado: Orden["estado"], productoId: string, cantidad: number, precio: number): Orden => ({
  id,
  noOrden: 1,
  fecha: "2026-11-16T12:00:00.000Z",
  paraLlevar: false,
  mesa: 1,
  mesero: "Mesero-1",
  alimentos: [{ productoId, cantidad, precioUnitario: precio, precioTotal: cantidad * precio }],
  total: cantidad * precio,
  estado,
});

describe("datos del asistente", () => {
  it("resume como ventas únicamente las órdenes pagadas", () => {
    const state = {
      ...seed(),
      ordenes: [orden("pagada", "Pagada", "p4", 2, 35), orden("pendiente", "Pendiente Cocina", "p5", 1, 45)],
    };

    const contexto = construirContextoAsistente(state);

    expect(contexto.ventasPagadas.ordenes).toBe(1);
    expect(contexto.ventasPagadas.importeTotal).toBe(70);
    expect(contexto.ventasPagadas.porProducto).toEqual([{ nombre: "Café de Olla", cantidad: 2, importe: 70 }]);
    expect(contexto.ventasPagadas.porDia).toEqual([{ fecha: "2026-11-16", ordenes: 1, importe: 70 }]);
  });
});
