import { useState } from "react";
import { money, type Orden } from "@/lib/pos-store";
import { Btn, Field, Input, Modal } from "./ui";

export function PagoModal({
  orden,
  onClose,
  onConfirm,
}: {
  orden: Orden | null;
  onClose: () => void;
  onConfirm: (metodo: "efectivo" | "tarjeta") => Promise<void>;
}) {
  const [metodo, setMetodo] = useState<"efectivo" | "tarjeta">("efectivo");
  const [recibido, setRecibido] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  if (!orden) return null;
  const monto = parseFloat(recibido) || 0;
  const cambio = monto - orden.total;
  const valido = metodo === "tarjeta" || monto >= orden.total;

  const confirmar = async () => {
    if (!valido || confirmando) return;
    setConfirmando(true);
    try {
      await onConfirm(metodo);
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Modal open onClose={confirmando ? () => undefined : onClose} title={`Pago · Orden #${orden.noOrden}`}>
      <div className="mb-4 rounded-xl bg-secondary p-4 text-center">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Total a pagar</div>
        <div className="font-display text-4xl font-extrabold text-secondary-foreground">{money(orden.total)}</div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["efectivo", "tarjeta"] as const).map((m) => (
          <Btn key={m} variant={metodo === m ? "primary" : "outline"} onClick={() => setMetodo(m)} className="py-3" disabled={confirmando}>
            {m === "efectivo" ? "💵 Efectivo" : "💳 Tarjeta"}
          </Btn>
        ))}
      </div>
      {metodo === "efectivo" && (
        <div className="mb-4 space-y-3">
          <Field label="Monto Recibido">
            <Input type="number" min={0} step="0.01" value={recibido} onChange={(e) => setRecibido(e.target.value)} autoFocus disabled={confirmando} />
          </Field>
          <div className="flex justify-between rounded-lg border border-border p-3 text-sm">
            <span className="font-medium">Cambio</span>
            <span className={cambio < 0 ? "font-bold text-destructive" : "font-bold text-success"}>
              {money(Math.max(cambio, 0))}
            </span>
          </div>
        </div>
      )}
      <Btn className="w-full py-3" disabled={!valido || confirmando} onClick={() => void confirmar()}>
        {confirmando ? "Guardando…" : "Confirmar Pago"}
      </Btn>
    </Modal>
  );
}
