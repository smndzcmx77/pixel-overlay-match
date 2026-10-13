import { useState } from "react";
import { toast } from "sonner";
import { money, pagarOrden, type Orden, type POSState } from "@/lib/pos-store";
import { Btn, Card, EstadoBadge } from "./ui";
import { PagoModal } from "./PagoModal";

type Props = { state: POSState; update: (fn: (s: POSState) => POSState) => void; kds?: boolean };

export function OrdenesView({ state, update, kds }: Props) {
  const [pago, setPago] = useState<Orden | null>(null);
  const nombre = (id: string) => state.productos.find((p) => p.id === id)?.nombre ?? "—";
  const ordenes = kds ? state.ordenes.filter((o) => o.estado === "Pendiente Cocina") : state.ordenes;

  if (!ordenes.length)
    return <p className="py-16 text-center text-muted-foreground">{kds ? "No hay comandas pendientes 🎉" : "Aún no hay órdenes."}</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ordenes.map((o) => (
        <Card key={o.id} className={kds ? "border-l-4 border-l-warning" : ""}>
          <div className="mb-2 flex items-start justify-between">
            <div>
              <div className="font-display text-xl font-extrabold text-primary">#{o.noOrden}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.fecha).toLocaleString("es-MX")}</div>
            </div>
            <EstadoBadge estado={o.estado} />
          </div>
          <div className="mb-3 text-sm text-muted-foreground">
            {o.mesero} · {o.paraLlevar ? "Para llevar" : `Mesa ${o.mesa}`}
            {o.metodoPago && ` · ${o.metodoPago}`}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {o.alimentos.map((a) => (
                <tr key={a.productoId} className="border-t border-border">
                  <td className={kds ? "py-1.5 text-base font-semibold" : "py-1.5"}>{nombre(a.productoId)}</td>
                  <td className="py-1.5 text-center font-semibold">×{a.cantidad}</td>
                  {!kds && <td className="py-1.5 text-right">{money(a.precioTotal)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          {!kds && (
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-bold">
              <span>Gran Total</span>
              <span className="text-primary">{money(o.total)}</span>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {o.estado === "Pendiente Cocina" && (
              <Btn
                variant={kds ? "success" : "outline"}
                className="flex-1"
                onClick={() => update((s) => ({ ...s, ordenes: s.ordenes.map((x) => (x.id === o.id ? { ...x, estado: "Lista" } : x)) }))}
              >
                Marcar como Lista
              </Btn>
            )}
            {!kds && o.estado !== "Pagada" && (
              <Btn className="flex-1" onClick={() => setPago(o)}>Pagar</Btn>
            )}
          </div>
        </Card>
      ))}
      {pago && (
        <PagoModal
          orden={pago}
          onClose={() => setPago(null)}
          onConfirm={(m) => {
            update((s) => pagarOrden(s, pago.id, m));
            toast.success(`Orden #${pago.noOrden} pagada`);
            setPago(null);
          }}
        />
      )}
    </div>
  );
}
