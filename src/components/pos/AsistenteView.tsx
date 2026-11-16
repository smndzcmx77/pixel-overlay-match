import { useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Sparkles, Square } from "lucide-react";
import type { POSState } from "@/lib/pos-store";
import { construirContextoAsistente } from "@/lib/asistente-datos";
import { Btn, Card } from "./ui";

const SUGERENCIAS = [
  "¿Qué productos e insumos debo reponer hoy y en qué cantidad?",
  "¿Cuáles son los productos más vendidos y cuánto han generado?",
  "Según mis ventas y recetas, ¿qué insumos debo comprar primero?",
];

type Props = { state: POSState };

type StreamChunk = {
  type?: string;
  delta?: string;
  errorText?: string;
};

export function AsistenteView({ state }: Props) {
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [razonamiento, setRazonamiento] = useState("");
  const [cargando, setCargando] = useState(false);
  const [detenido, setDetenido] = useState(false);
  const [error, setError] = useState("");
  const controlador = useRef<AbortController | null>(null);

  const consultar = async (event: FormEvent) => {
    event.preventDefault();
    if (pregunta.trim().length < 3 || cargando) return;

    const abortController = new AbortController();
    controlador.current = abortController;
    setCargando(true);
    setRespuesta("");
    setRazonamiento("");
    setError("");
    setDetenido(false);
    let texto = "";

    try {
      const response = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregunta: pregunta.trim(),
          datos: JSON.stringify(construirContextoAsistente(state)),
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "No se pudo consultar al asistente.");
      }
      if (!response.body) throw new Error("El asistente no devolvió una respuesta.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const procesarEvento = (evento: string) => {
        const data = evento
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data || data === "[DONE]") return;
        const chunk = JSON.parse(data) as StreamChunk;
        if (chunk.type === "text-delta" && chunk.delta) {
          texto += chunk.delta;
          setRespuesta(texto);
        } else if (chunk.type === "reasoning-delta" && chunk.delta) {
          setRazonamiento((actual) => actual + chunk.delta);
        } else if (chunk.type === "error") {
          throw new Error(chunk.errorText || "No se pudo completar la consulta.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const eventos = buffer.split("\n\n");
        buffer = eventos.pop() ?? "";
        eventos.filter(Boolean).forEach(procesarEvento);
        if (done) {
          if (buffer.trim()) procesarEvento(buffer);
          break;
        }
      }

      if (!texto.trim()) throw new Error("El asistente no generó una respuesta. Intenta con otra pregunta.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        setDetenido(true);
      } else {
        setError(cause instanceof Error ? cause.message : "No se pudo completar la consulta.");
      }
    } finally {
      setCargando(false);
      controlador.current = null;
    }
  };

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <Card className="space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-lg bg-secondary p-2 text-secondary-foreground"><Sparkles className="size-5" /></span>
            <h2 className="font-display text-xl font-bold">Asistente del encargado</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Pregunta por tus ventas o inventario y recibe acciones de reposición basadas en los datos actuales.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {SUGERENCIAS.map((sugerencia) => (
            <Btn
              key={sugerencia}
              variant="outline"
              className="h-auto justify-start whitespace-normal py-2.5 text-left font-normal"
              onClick={() => setPregunta(sugerencia)}
              disabled={cargando}
            >
              {sugerencia}
            </Btn>
          ))}
        </div>

        <form onSubmit={consultar} className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground" htmlFor="pregunta-asistente">
            Tu pregunta
          </label>
          <textarea
            id="pregunta-asistente"
            value={pregunta}
            onChange={(event) => setPregunta(event.target.value)}
            maxLength={1000}
            rows={5}
            placeholder="Ej. ¿Cuántos refrescos debo comprar para volver al mínimo?"
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <div className="flex gap-2">
            <Btn type="submit" className="flex-1" disabled={cargando || pregunta.trim().length < 3}>
              {cargando ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {cargando ? "Analizando datos…" : "Generar recomendación"}
            </Btn>
            {cargando && (
              <Btn type="button" variant="outline" onClick={() => controlador.current?.abort()}>
                <Square className="size-3.5" /> Detener
              </Btn>
            )}
          </div>
        </form>
        <p className="text-xs text-muted-foreground">
          Se analizan órdenes pagadas, existencias, mínimos de reorden y recetas guardados en este navegador.
        </p>
      </Card>

      <Card className="min-h-96">
        <h3 className="mb-4 font-display text-lg font-bold">Recomendación</h3>
        {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}
        {detenido && <p className="mb-3 text-sm text-muted-foreground">Consulta detenida; se conservó la respuesta parcial.</p>}
        {razonamiento && (
          <details className="mb-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-semibold">Ver análisis del asistente</summary>
            <div className="mt-2 whitespace-pre-wrap leading-5">{razonamiento}</div>
          </details>
        )}
        {respuesta ? (
          <div className="whitespace-pre-wrap text-sm leading-7">{respuesta}</div>
        ) : cargando ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Revisando ventas, existencias y recetas…
          </div>
        ) : !error && !detenido ? (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Escribe una pregunta o elige una sugerencia para comenzar.</p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
