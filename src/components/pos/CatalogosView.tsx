import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { UNIDADES, uid, money, type POSState, type Producto, type Receta, type Unidad } from "@/lib/pos-store";
import { cn } from "@/lib/utils";
import { Btn, Card, Field, Input, Modal, Select } from "./ui";

type Props = { state: POSState; update: (fn: (s: POSState) => POSState) => void };

export function CatalogosView(props: Props) {
  const [sub, setSub] = useState<"cat" | "prod" | "bom">("prod");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([["cat", "Categorías PdV"], ["prod", "Productos"], ["bom", "Lista de Ingredientes"]] as const).map(([k, l]) => (
          <Btn key={k} variant={sub === k ? "primary" : "outline"} onClick={() => setSub(k)}>{l}</Btn>
        ))}
      </div>
      {sub === "cat" && <Categorias {...props} />}
      {sub === "prod" && <Productos {...props} />}
      {sub === "bom" && <Recetas {...props} />}
    </div>
  );
}

function Categorias({ state, update }: Props) {
  const [nuevo, setNuevo] = useState("");
  const [edit, setEdit] = useState<{ id: string; nombre: string } | null>(null);
  return (
    <Card className="max-w-xl space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nuevo.trim()) return;
          update((s) => ({ ...s, categorias: [...s.categorias, { id: uid(), nombre: nuevo.trim() }] }));
          setNuevo("");
        }}
      >
        <Input placeholder="Nueva categoría" value={nuevo} onChange={(e) => setNuevo(e.target.value)} />
        <Btn type="submit"><Plus className="size-4" />Agregar</Btn>
      </form>
      <ul className="divide-y divide-border">
        {state.categorias.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2">
            {edit?.id === c.id ? (
              <>
                <Input value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
                <Btn onClick={() => { update((s) => ({ ...s, categorias: s.categorias.map((x) => (x.id === c.id ? { ...x, nombre: edit.nombre } : x)) })); setEdit(null); }}>Guardar</Btn>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{c.nombre}</span>
                <Btn variant="ghost" onClick={() => setEdit(c)}><Pencil className="size-4" /></Btn>
                <Btn variant="ghost" className="text-destructive" onClick={() => update((s) => ({ ...s, categorias: s.categorias.filter((x) => x.id !== c.id) }))}><Trash2 className="size-4" /></Btn>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const emptyProd = (catId: string): Producto => ({
  id: "", nombre: "", precio: 0, categoriaId: catId, disponible: 0, unidadMedida: "Unidades",
  minimoReorden: 0, ventas: true, pos: true, compra: false, rastrearInventario: false,
});

function Productos({ state, update }: Props) {
  const [form, setForm] = useState<Producto | null>(null);
  const cat = (id: string) => state.categorias.find((c) => c.id === id)?.nombre ?? "—";
  const save = () => {
    if (!form || !form.nombre.trim()) return;
    update((s) =>
      form.id
        ? { ...s, productos: s.productos.map((p) => (p.id === form.id ? form : p)) }
        : { ...s, productos: [...s.productos, { ...form, id: uid() }] },
    );
    setForm(null);
  };
  const num = (k: keyof Producto) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => f && { ...f, [k]: parseFloat(e.target.value) || 0 });

  return (
    <Card className="overflow-x-auto">
      <div className="mb-3 flex justify-end">
        <Btn onClick={() => setForm(emptyProd(state.categorias[0]?.id ?? ""))}><Plus className="size-4" />Nuevo producto</Btn>
      </div>
      <table className="w-full min-w-[720px] text-sm">
        <thead className="text-left text-xs uppercase text-muted-foreground">
          <tr><th className="py-2">Nombre</th><th>Categoría</th><th>Precio</th><th>Disponible</th><th>Mín.</th><th>Banderas</th><th></th></tr>
        </thead>
        <tbody>
          {state.productos.map((p) => {
            const bajo = p.disponible <= p.minimoReorden;
            return (
              <tr key={p.id} className="border-t border-border">
                <td className="py-2 font-medium">{p.nombre}</td>
                <td>{cat(p.categoriaId)}</td>
                <td>{money(p.precio)}</td>
                <td>
                  <span className={cn(bajo && "rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground")}>
                    {p.disponible} {p.unidadMedida}
                  </span>
                </td>
                <td>{p.minimoReorden}</td>
                <td className="space-x-1 text-xs">
                  {(["ventas", "pos", "compra", "rastrearInventario"] as const).filter((k) => p[k]).map((k) => (
                    <span key={k} className="rounded bg-secondary px-1.5 py-0.5 text-secondary-foreground">{k === "rastrearInventario" ? "inv." : k}</span>
                  ))}
                </td>
                <td className="text-right">
                  <Btn variant="ghost" onClick={() => setForm(p)}><Pencil className="size-4" /></Btn>
                  <Btn variant="ghost" className="text-destructive" onClick={() => update((s) => ({ ...s, productos: s.productos.filter((x) => x.id !== p.id), recetas: s.recetas.filter((r) => r.productoId !== p.id) }))}><Trash2 className="size-4" /></Btn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar producto" : "Nuevo producto"}>
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre"><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
            <Field label="Categoría PdV">
              <Select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                {state.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Precio"><Input type="number" step="0.01" value={form.precio} onChange={num("precio")} /></Field>
            <Field label="Unidad de medida">
              <Select value={form.unidadMedida} onChange={(e) => setForm({ ...form, unidadMedida: e.target.value as Unidad })}>
                {UNIDADES.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </Field>
            <Field label="Disponible"><Input type="number" step="0.01" value={form.disponible} onChange={num("disponible")} /></Field>
            <Field label="Mínimo de reorden"><Input type="number" step="0.01" value={form.minimoReorden} onChange={num("minimoReorden")} /></Field>
            <div className="col-span-full flex flex-wrap gap-4 pt-1">
              {([["ventas", "Ventas"], ["pos", "POS"], ["compra", "Compra"], ["rastrearInventario", "Rastrear inventario"]] as const).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="size-4 accent-primary" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />
                  {l}
                </label>
              ))}
            </div>
            <Btn className="col-span-full mt-2" onClick={save}>Guardar</Btn>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function Recetas({ state, update }: Props) {
  const [form, setForm] = useState<Receta | null>(null);
  const [isNew, setIsNew] = useState(false);
  const nombre = (id: string) => state.productos.find((p) => p.id === id)?.nombre ?? "—";
  const sinReceta = state.productos.filter((p) => !state.recetas.some((r) => r.productoId === p.id));

  const save = () => {
    if (!form?.productoId) return;
    update((s) => ({ ...s, recetas: [...s.recetas.filter((r) => r.productoId !== form.productoId), form] }));
    setForm(null);
  };
  const setIng = (idx: number, patch: Partial<Receta["ingredientes"][number]>) =>
    setForm((f) => f && { ...f, ingredientes: f.ingredientes.map((x, i) => (i === idx ? { ...x, ...patch } : x)) });

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Btn disabled={!sinReceta.length} onClick={() => { setIsNew(true); setForm({ productoId: sinReceta[0].id, cantidad: 1, unidades: "Unidades", tipo: "Fabricar producto", ingredientes: [] }); }}>
          <Plus className="size-4" />Nueva lista
        </Btn>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {state.recetas.map((r) => (
          <Card key={r.productoId}>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="font-display text-lg font-bold">{nombre(r.productoId)}</div>
                <div className="text-xs text-muted-foreground">{r.cantidad} {r.unidades} · {r.tipo}</div>
              </div>
              <div>
                <Btn variant="ghost" onClick={() => { setIsNew(false); setForm(r); }}><Pencil className="size-4" /></Btn>
                <Btn variant="ghost" className="text-destructive" onClick={() => update((s) => ({ ...s, recetas: s.recetas.filter((x) => x.productoId !== r.productoId) }))}><Trash2 className="size-4" /></Btn>
              </div>
            </div>
            <ul className="text-sm">
              {r.ingredientes.map((i, k) => (
                <li key={k} className="flex justify-between border-t border-border py-1">
                  <span>{nombre(i.componenteProductoId)}</span><span className="text-muted-foreground">{i.cantidad} {i.unidadMedida}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title="Lista de Ingredientes">
        {form && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Producto">
                <Select value={form.productoId} disabled={!isNew} onChange={(e) => setForm({ ...form, productoId: e.target.value })}>
                  {(isNew ? sinReceta : state.productos).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Cantidad"><Input type="number" step="0.01" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label="Unidades">
                <Select value={form.unidades} onChange={(e) => setForm({ ...form, unidades: e.target.value as Receta["unidades"] })}>
                  <option>Unidades</option><option>Docenas</option>
                </Select>
              </Field>
              <Field label="Tipo">
                <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Receta["tipo"] })}>
                  <option>Fabricar producto</option><option>Kit</option>
                </Select>
              </Field>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold">Componentes</div>
              {form.ingredientes.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_100px_110px_auto] gap-2">
                  <Select value={ing.componenteProductoId} onChange={(e) => setIng(idx, { componenteProductoId: e.target.value })}>
                    {state.productos.filter((p) => p.id !== form.productoId).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </Select>
                  <Input type="number" step="0.01" value={ing.cantidad} onChange={(e) => setIng(idx, { cantidad: parseFloat(e.target.value) || 0 })} />
                  <Select value={ing.unidadMedida} onChange={(e) => setIng(idx, { unidadMedida: e.target.value as Unidad })}>
                    {UNIDADES.map((u) => <option key={u}>{u}</option>)}
                  </Select>
                  <Btn variant="ghost" className="text-destructive" onClick={() => setForm({ ...form, ingredientes: form.ingredientes.filter((_, i) => i !== idx) })}><Trash2 className="size-4" /></Btn>
                </div>
              ))}
              <Btn
                variant="outline"
                onClick={() => {
                  const first = state.productos.find((p) => p.id !== form.productoId);
                  if (first) setForm({ ...form, ingredientes: [...form.ingredientes, { componenteProductoId: first.id, cantidad: 0, unidadMedida: first.unidadMedida }] });
                }}
              >
                <Plus className="size-4" />Agregar componente
              </Btn>
            </div>
            <Btn className="w-full" onClick={save}>Guardar</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
