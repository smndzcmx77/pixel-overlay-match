import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { avisarBajos, money, pagarOrden, uid, type Alimento, type Orden, type POSState } from "@/lib/pos-store";
import { cn } from "@/lib/utils";
import { Btn, Card, Field, Select } from "./ui";
import { PagoModal } from "./PagoModal";

type Props = { state: POSState; update: (fn: (s: POSState) => POSState) => void };

export function POSView({ state, update }: Props) {
  const [cat, setCat] = useState<string>("all");
  const [paraLlevar, setParaLlevar] = useState(false);
  const [mesa, setMesa] = useState<1 | 2 | 3 | 4>(1);
  const [mesero, setMesero] = useState<"Mesero-1" | "Mesero-2">("Mesero-1");
  const [items, setItems] = useState<Alimento[]>([]);
  const [pago, setPago] = useState<Orden | null>(null);

  const menu = state.productos.filter((p) => p.pos && (cat === "all" || p.categoriaId === cat));
  const cats = state.categorias.filter((c) => state.productos.some((p) => p.pos && p.categoriaId === c.id));
  const total = items.reduce((s, i) => s + i.precioTotal, 0);
  const prod = (id: string) => state.productos.find((p) => p.id === id);

  const setQty = (productoId: string, delta: number) =>
    setItems((list) =>
      list
        .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta, precioTotal: (i.cantidad + delta) * i.precioUnitario } : i))
        .filter((i) => i.cantidad > 0),
    );

  const add = (id: string) => {
    const p = prod(id)!;
    setItems((list) =>
      list.some((i) => i.productoId === id)
        ? list.map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad + 1, precioTotal: (i.cantidad + 1) * i.precioUnitario } : i))
        : [...list, { productoId: id, cantidad: 1, precioUnitario: p.precio, precioTotal: p.precio }],
    );
  };

  const crearOrden = (): Orden => ({
    id: uid(),
    noOrden: state.siguienteNoOrden,
    fecha: new Date().toISOString(),
    paraLlevar,
    mesa,
    mesero,
    alimentos: items,
    total,
    estado: "Pendiente Cocina",
  });

  const reset = () => {
    setItems([]);
    setParaLlevar(false);
  };

  const ordenar = () => {
    const o = crearOrden();
    update((s) => ({ ...s, ordenes: [o, ...s.ordenes], siguienteNoOrden: s.siguienteNoOrden + 1 }));
    toast.success(`Orden #${o.noOrden} enviada a cocina`);
    reset();
  };

  const pagarAhora = () => {
    const o = crearOrden();
    update((s) => ({ ...s, ordenes: [o, ...s.ordenes], siguienteNoOrden: s.siguienteNoOrden + 1 }));
    setPago(o);
    reset();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <Card className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <div className="text-xs font-medium text-muted-foreground">No. Orden</div>
            <div className="font-display text-2xl font-extrabold text-primary">#{state.siguienteNoOrden}</div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-primary" checked={paraLlevar} onChange={(e) => setParaLlevar(e.target.checked)} />
            Para Llevar
          </label>
          <Field label="Mesa">
            <Select value={mesa} disabled={paraLlevar} onChange={(e) => setMesa(Number(e.target.value) as 1 | 2 | 3 | 4)}>
              {[1, 2, 3, 4].map((m) => (
                <option key={m} value={m}>Mesa {m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Mesero">
            <Select value={mesero} onChange={(e) => setMesero(e.target.value as "Mesero-1" | "Mesero-2")}>
              <option>Mesero-1</option>
              <option>Mesero-2</option>
            </Select>
          </Field>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Btn variant={cat === "all" ? "primary" : "outline"} onClick={() => setCat("all")}>Todos</Btn>
          {cats.map((c) => (
            <Btn key={c.id} variant={cat === c.id ? "primary" : "outline"} onClick={() => setCat(c.id)}>
              {c.nombre}
            </Btn>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {menu.map((p) => {
            const bajo = p.rastrearInventario && p.disponible <= p.minimoReorden;
            return (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="group flex flex-col items-start rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <span className="font-semibold leading-tight">{p.nombre}</span>
                <span className="mt-2 font-display text-lg font-bold text-primary">{money(p.precio)}</span>
                {p.rastrearInventario && (
                  <span className={cn("mt-1 text-xs", bajo ? "font-semibold text-destructive" : "text-muted-foreground")}>
                    Stock: {p.disponible} {p.unidadMedida}
                  </span>
                )}
              </button>
            );
          })}
          {menu.length === 0 && <p className="text-sm text-muted-foreground">Sin productos en esta categoría.</p>}
        </div>
      </div>

      <Card className="flex h-fit flex-col gap-3 lg:sticky lg:top-4">
        <h2 className="font-display text-lg font-bold">Alimentos</h2>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Toca un producto para agregarlo.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <li key={i.productoId} className="flex items-center gap-2 py-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{prod(i.productoId)?.nombre}</div>
                  <div className="text-xs text-muted-foreground">{money(i.precioUnitario)} c/u</div>
                </div>
                <button onClick={() => setQty(i.productoId, -1)} className="rounded-md border border-border p-1 hover:bg-accent"><Minus className="size-3.5" /></button>
                <span className="w-6 text-center text-sm font-semibold">{i.cantidad}</span>
                <button onClick={() => setQty(i.productoId, 1)} className="rounded-md border border-border p-1 hover:bg-accent"><Plus className="size-3.5" /></button>
                <span className="w-20 text-right text-sm font-semibold">{money(i.precioTotal)}</span>
                <button onClick={() => setQty(i.productoId, -i.cantidad)} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold">Gran Total</span>
          <span className="font-display text-2xl font-extrabold text-primary">{money(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Btn variant="outline" disabled={!items.length} onClick={ordenar}>Ordenar</Btn>
          <Btn disabled={!items.length} onClick={pagarAhora}>Pago</Btn>
        </div>
      </Card>

      {pago && (
        <PagoModal
          orden={pago}
          onClose={() => setPago(null)}
          onConfirm={(m) => {
            const next = pagarOrden(state, pago.id, m);
            update(() => next);
            toast.success(`Orden #${pago.noOrden} pagada`);
            avisarBajos(state, next, (msg) => toast.warning(msg, { duration: 8000 }));
            setPago(null);
          }}
        />
      )}
    </div>
  );
}
