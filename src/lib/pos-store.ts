import { useEffect, useState, useCallback } from "react";

export const UNIDADES = ["g", "oz", "lb", "kg", "t", "L", "m³", "gal", "fl oz", "Unidades"] as const;
export type Unidad = (typeof UNIDADES)[number];

export type CategoriaPdV = { id: string; nombre: string };
export type Producto = {
  id: string;
  nombre: string;
  precio: number;
  categoriaId: string;
  disponible: number;
  unidadMedida: Unidad;
  minimoReorden: number;
  ventas: boolean;
  pos: boolean;
  compra: boolean;
  rastrearInventario: boolean;
};
export type Ingrediente = { componenteProductoId: string; cantidad: number; unidadMedida: Unidad };
export type Receta = {
  productoId: string;
  cantidad: number;
  unidades: "Unidades" | "Docenas";
  tipo: "Fabricar producto" | "Kit";
  ingredientes: Ingrediente[];
};
export type Alimento = { productoId: string; cantidad: number; precioUnitario: number; precioTotal: number };
export type EstadoOrden = "Pendiente Cocina" | "Lista" | "Pagada";
export type Orden = {
  id: string;
  noOrden: number;
  fecha: string;
  paraLlevar: boolean;
  mesa: 1 | 2 | 3 | 4;
  mesero: "Mesero-1" | "Mesero-2";
  alimentos: Alimento[];
  total: number;
  estado: EstadoOrden;
  metodoPago?: "efectivo" | "tarjeta";
};

export type POSState = {
  categorias: CategoriaPdV[];
  productos: Producto[];
  recetas: Receta[];
  ordenes: Orden[];
  siguienteNoOrden: number;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

const p = (
  id: string,
  nombre: string,
  precio: number,
  categoriaId: string,
  disponible: number,
  unidadMedida: Unidad,
  minimoReorden: number,
  esVenta: boolean,
): Producto => ({
  id,
  nombre,
  precio,
  categoriaId,
  disponible,
  unidadMedida,
  minimoReorden,
  ventas: esVenta,
  pos: esVenta,
  compra: !esVenta,
  rastrearInventario: true,
});

export const seed = (): POSState => ({
  categorias: [
    { id: "c1", nombre: "Chilaquiles" },
    { id: "c2", nombre: "Bebidas" },
    { id: "c3", nombre: "Extras" },
    { id: "c4", nombre: "Insumos" },
  ],
  productos: [
    p("p1", "Chilaquiles Verdes", 120, "c1", 0, "Unidades", 0, true),
    p("p2", "Chilaquiles Rojos", 120, "c1", 0, "Unidades", 0, true),
    p("p3", "Chilaquiles Divorciados", 135, "c1", 0, "Unidades", 0, true),
    p("p4", "Café de Olla", 35, "c2", 40, "Unidades", 10, true),
    p("p5", "Jugo de Naranja", 45, "c2", 25, "Unidades", 8, true),
    p("p6", "Refresco", 30, "c2", 6, "Unidades", 10, true),
    p("p7", "Huevo Estrellado Extra", 20, "c3", 0, "Unidades", 0, true),
    p("i1", "Totopos", 0, "c4", 5000, "g", 1000, false),
    p("i2", "Salsa Verde", 0, "c4", 3, "L", 1, false),
    p("i3", "Salsa Roja", 0, "c4", 3, "L", 1, false),
    p("i4", "Crema", 0, "c4", 2, "L", 0.5, false),
    p("i5", "Queso Fresco", 0, "c4", 1500, "g", 500, false),
    p("i6", "Huevo", 0, "c4", 60, "Unidades", 24, false),
  ].map((x) => (x.id === "p1" || x.id === "p2" || x.id === "p3" || x.id === "p7" ? { ...x, rastrearInventario: false } : x)),
  recetas: [
    {
      productoId: "p1",
      cantidad: 1,
      unidades: "Unidades",
      tipo: "Fabricar producto",
      ingredientes: [
        { componenteProductoId: "i1", cantidad: 150, unidadMedida: "g" },
        { componenteProductoId: "i2", cantidad: 0.15, unidadMedida: "L" },
        { componenteProductoId: "i4", cantidad: 0.03, unidadMedida: "L" },
        { componenteProductoId: "i5", cantidad: 40, unidadMedida: "g" },
      ],
    },
    {
      productoId: "p2",
      cantidad: 1,
      unidades: "Unidades",
      tipo: "Fabricar producto",
      ingredientes: [
        { componenteProductoId: "i1", cantidad: 150, unidadMedida: "g" },
        { componenteProductoId: "i3", cantidad: 0.15, unidadMedida: "L" },
        { componenteProductoId: "i4", cantidad: 0.03, unidadMedida: "L" },
        { componenteProductoId: "i5", cantidad: 40, unidadMedida: "g" },
      ],
    },
    {
      productoId: "p3",
      cantidad: 1,
      unidades: "Unidades",
      tipo: "Fabricar producto",
      ingredientes: [
        { componenteProductoId: "i1", cantidad: 160, unidadMedida: "g" },
        { componenteProductoId: "i2", cantidad: 0.08, unidadMedida: "L" },
        { componenteProductoId: "i3", cantidad: 0.08, unidadMedida: "L" },
        { componenteProductoId: "i5", cantidad: 40, unidadMedida: "g" },
      ],
    },
    {
      productoId: "p7",
      cantidad: 1,
      unidades: "Unidades",
      tipo: "Kit",
      ingredientes: [{ componenteProductoId: "i6", cantidad: 1, unidadMedida: "Unidades" }],
    },
  ],
  ordenes: [],
  siguienteNoOrden: 1,
});

const KEY = "chilaqueria-pos-v1";

export function usePOS() {
  const [state, setState] = useState<POSState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      setState(raw ? JSON.parse(raw) : seed());
    } catch {
      setState(seed());
    }
  }, []);

  useEffect(() => {
    if (state) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const update = useCallback((fn: (s: POSState) => POSState) => {
    setState((s) => (s ? fn(s) : s));
  }, []);

  return { state, update };
}

/** Pays an order and deducts stock following BOM rules. */
export function pagarOrden(s: POSState, ordenId: string, metodo: "efectivo" | "tarjeta"): POSState {
  const orden = s.ordenes.find((o) => o.id === ordenId);
  if (!orden || orden.estado === "Pagada") return s;
  const stock = new Map(s.productos.map((x) => [x.id, x.disponible]));
  const prodById = new Map(s.productos.map((x) => [x.id, x]));
  for (const a of orden.alimentos) {
    const receta = s.recetas.find((r) => r.productoId === a.productoId);
    if (receta && receta.ingredientes.length > 0) {
      for (const ing of receta.ingredientes) {
        const comp = prodById.get(ing.componenteProductoId);
        if (comp?.rastrearInventario) {
          stock.set(comp.id, (stock.get(comp.id) ?? 0) - ing.cantidad * a.cantidad);
        }
      }
    } else {
      const prod = prodById.get(a.productoId);
      if (prod?.rastrearInventario) stock.set(prod.id, (stock.get(prod.id) ?? 0) - a.cantidad);
    }
  }
  return {
    ...s,
    productos: s.productos.map((x) => ({ ...x, disponible: Math.round((stock.get(x.id) ?? x.disponible) * 1000) / 1000 })),
    ordenes: s.ordenes.map((o) => (o.id === ordenId ? { ...o, estado: "Pagada", metodoPago: metodo } : o)),
  };
}

export const money = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
