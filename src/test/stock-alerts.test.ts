import { beforeEach, describe, expect, it, vi } from "vitest";
import { avisarBajos, seed } from "@/lib/pos-store";

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
});
