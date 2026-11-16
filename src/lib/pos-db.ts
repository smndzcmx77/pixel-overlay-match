import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { EstadoOrden, Orden, POSState, Producto, Receta, Unidad } from "@/lib/pos-store";

export const POS_WORKSPACE_ID = "chilaqueria";

export type POSSnapshot = { state: POSState; revision: number };

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Loads the complete POS database and restores the UI's existing data shape. */
export async function loadPOSFromSupabase(): Promise<POSSnapshot> {
  const [workspace, categorias, productos, recetas, ingredientes, ordenes, alimentos] = await Promise.all([
    supabase.from("pos_workspaces").select("siguiente_no_orden, revision").eq("id", POS_WORKSPACE_ID).single(),
    supabase.from("pos_categorias").select("id, nombre").eq("workspace_id", POS_WORKSPACE_ID).order("posicion"),
    supabase.from("pos_productos").select("*").eq("workspace_id", POS_WORKSPACE_ID).order("posicion"),
    supabase.from("pos_recetas").select("*").eq("workspace_id", POS_WORKSPACE_ID).order("posicion"),
    supabase.from("pos_receta_ingredientes").select("*").eq("workspace_id", POS_WORKSPACE_ID).order("posicion"),
    supabase.from("pos_ordenes").select("*").eq("workspace_id", POS_WORKSPACE_ID).order("posicion"),
    supabase.from("pos_orden_alimentos").select("*").eq("workspace_id", POS_WORKSPACE_ID),
  ]);

  throwIfError(workspace.error);
  throwIfError(categorias.error);
  throwIfError(productos.error);
  throwIfError(recetas.error);
  throwIfError(ingredientes.error);
  throwIfError(ordenes.error);
  throwIfError(alimentos.error);
  if (!workspace.data) throw new Error("No se encontró el punto de venta en Supabase.");

  const productosUI: Producto[] = (productos.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    precio: p.precio,
    categoriaId: p.categoria_id,
    disponible: p.disponible,
    unidadMedida: p.unidad_medida as Unidad,
    minimoReorden: p.minimo_reorden,
    ventas: p.ventas,
    pos: p.pos,
    compra: p.compra,
    rastrearInventario: p.rastrear_inventario,
  }));

  const recetasUI: Receta[] = (recetas.data ?? []).map((r) => ({
    productoId: r.producto_id,
    cantidad: r.cantidad,
    unidades: r.unidades as Receta["unidades"],
    tipo: r.tipo as Receta["tipo"],
    ingredientes: (ingredientes.data ?? [])
      .filter((i) => i.producto_id === r.producto_id)
      .map((i) => ({
        componenteProductoId: i.componente_producto_id,
        cantidad: i.cantidad,
        unidadMedida: i.unidad_medida as Unidad,
      })),
  }));

  const ordenesUI: Orden[] = (ordenes.data ?? []).map((o) => ({
    id: o.id,
    noOrden: o.no_orden,
    fecha: o.fecha,
    paraLlevar: o.para_llevar,
    mesa: o.mesa as Orden["mesa"],
    mesero: o.mesero as Orden["mesero"],
    alimentos: (alimentos.data ?? [])
      .filter((a) => a.orden_id === o.id)
      .map((a) => ({
        productoId: a.producto_id,
        cantidad: a.cantidad,
        precioUnitario: a.precio_unitario,
        precioTotal: a.precio_total,
      })),
    total: o.total,
    estado: o.estado as EstadoOrden,
    metodoPago: (o.metodo_pago ?? undefined) as Orden["metodoPago"],
  }));

  return {
    state: {
      categorias: categorias.data ?? [],
      productos: productosUI,
      recetas: recetasUI,
      ordenes: ordenesUI,
      siguienteNoOrden: workspace.data.siguiente_no_orden,
    },
    revision: workspace.data.revision,
  };
}

/** Saves all related changes in one Postgres transaction with conflict protection. */
export async function syncPOSToSupabase(state: POSState, expectedRevision: number): Promise<number> {
  const { data, error } = await supabase.rpc("sync_pos_state", {
    p_state: state as unknown as Json,
    p_expected_revision: expectedRevision,
  });
  if (error) throw new Error(error.message);
  if (typeof data !== "number") throw new Error("Supabase no confirmó el guardado.");
  return data;
}
