import { beforeEach, describe, expect, it, vi } from "vitest";
import { avisarBajos, pagarOrden, seed, type Orden } from "@/lib/pos-store";

const { enviarAlertaStockMock } = vi.hoisted(() => ({ enviarAlertaStockMock: vi.fn() }));

vi.mock("@/lib/stock-alert.functions", () => ({ enviarAlertaStock: enviarAlertaStockMock }));

describe("alertas de stock", () => {
  beforeEach(() => {
    enviarAlertaStockMock.mockReset();
    enviarAlertaStockMock.mockResolvedValue({ ok: true });
  });

  it.each([9, 8])("envía a n8n los tres datos cuando Refresco baja a %s unidades", (existenciaRestante) => {
    const prev = {
      ...seed(),
      productos: seed().productos.map((p) => (p.id === "p6" ? { ...p, disponible: 11 } : p)),
    };
    const next = {
      ...prev,
      productos: prev.productos.map((p) => (p.id === "p6" ? { ...p, disponible: existenciaRestante } : p)),
    };

    avisarBajos(prev, next, vi.fn());

    expect(enviarAlertaStockMock).toHaveBeenCalledTimes(1);
    expect(enviarAlertaStockMock).toHaveBeenCalledWith({
      data: { nombre: "Refresco", existenciaRestante, minimoReorden: 10 },
    });
  });

  it("cobra la orden y descuenta los ingredientes de dos chilaquiles en el mismo resultado", () => {
    const initial = seed();
    const orden: Orden = {
      id: "orden-prueba",
      noOrden: 1,
      fecha: "2026-11-16T12:00:00.000Z",
      paraLlevar: false,
      mesa: 1,
      mesero: "Mesero-1",
      alimentos: [{ productoId: "p1", cantidad: 2, precioUnitario: 120, precioTotal: 240 }],
      total: 240,
      estado: "Pendiente Cocina",
    };

    const result = pagarOrden({ ...initial, ordenes: [orden] }, orden.id, "efectivo");

    expect(result.ordenes[0]).toMatchObject({ estado: "Pagada", metodoPago: "efectivo" });
    expect(result.productos.find((p) => p.id === "i1")?.disponible).toBe(4700);
    expect(result.productos.find((p) => p.id === "i2")?.disponible).toBe(2.7);
    expect(result.productos.find((p) => p.id === "i4")?.disponible).toBe(1.94);
    expect(result.productos.find((p) => p.id === "i5")?.disponible).toBe(1420);
  });
});
