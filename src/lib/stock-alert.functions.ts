import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const alertaStockSchema = z.object({
  nombre: z.string().trim().min(1).max(160),
  categoria: z.string().trim().min(1).max(160),
  disponible: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  minimo_reorden: z.number().finite().min(0).max(1_000_000_000),
  unidad_medida: z.string().trim().min(1).max(40),
});

export const enviarAlertaStock = createServerFn({ method: "POST" })
  .inputValidator(alertaStockSchema)
  .handler(async ({ data }) => {
    const webhookUrl = process.env["N8N_STOCK_ALERT_WEBHOOK_URL"];
    if (!webhookUrl) throw new Error("Falta configurar la URL del webhook de n8n.");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: data.nombre,
        categoria: data.categoria,
        disponible: data.disponible,
        minimo_reorden: data.minimo_reorden,
        unidad_medida: data.unidad_medida,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`n8n respondió [${response.status}]: ${errorBody}`);
      throw new Error(`n8n respondió con un error (${response.status}).`);
    }

    return { ok: true };
  });
