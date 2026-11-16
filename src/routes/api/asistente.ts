import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createResponsesCall } from "@/lib/ai/responses";

const consultaSchema = z.object({
  pregunta: z.string().trim().min(3).max(1000),
  datos: z.string().min(2).max(60000),
});

export const Route = createFileRoute("/api/asistente")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = consultaSchema.safeParse(await request.json().catch(() => null));
        if (!body.success) return Response.json({ error: "Escribe una pregunta válida para continuar." }, { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "La conexión con Lovable AI no está configurada." }, { status: 503 });

        const instructions = `Eres el asistente del encargado de una chilaquería. Responde en español, de forma clara y práctica, usando exclusivamente los datos proporcionados. Las ventas históricas incluyen únicamente órdenes pagadas.

Cuando pidan reposición:
- Prioriza los productos con inventario rastreado cuya existencia disponible sea menor o igual a su mínimo de reorden.
- Calcula el faltante para volver al mínimo como mínimo menos disponible; si recomiendas comprar más para cubrir demanda, explica el cálculo y no lo presentes como un dato registrado.
- Indica cantidades con su unidad de medida y ordena por urgencia.
- Usa las recetas para relacionar platillos vendidos con insumos cuando sea relevante.

Cuando pidan ventas, usa cantidades e importes en MXN y distingue claramente los periodos disponibles. No inventes proveedores, costos, tiempos de entrega, ventas ni existencias. Si faltan datos para una conclusión, dilo y sugiere qué dato capturar. Entrega una respuesta breve con viñetas y una acción concreta siguiente.`;

        try {
          const call = createResponsesCall(
            request,
            { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
            [
              {
                role: "user",
                content: `Pregunta del encargado:\n${body.data.pregunta}\n\nDatos actuales del punto de venta en JSON:\n${body.data.datos}`,
              },
            ],
            instructions,
          );
          return call.response();
        } catch (error) {
          if (request.signal.aborted) return Response.json({ error: "Consulta detenida." }, { status: 499 });
          console.error("Error al consultar Lovable AI:", error);
          const message = error instanceof Error ? error.message : "No se pudo completar la consulta.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
