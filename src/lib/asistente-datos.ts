import type { POSState } from "@/lib/pos-store";

export function construirContextoAsistente(state: POSState) {
  const productos = new Map(state.productos.map((p) => [p.id, p]));
  const categorias = new Map(state.categorias.map((c) => [c.id, c.nombre]));
  const pagadas = state.ordenes.filter((o) => o.estado === "Pagada");
  const porProducto = new Map<string, { cantidad: number; importe: number }>();
  const porDia = new Map<string, { ordenes: number; importe: number }>();

  for (const orden of pagadas) {
    const dia = orden.fecha.slice(0, 10);
    const diaActual = porDia.get(dia) ?? { ordenes: 0, importe: 0 };
    diaActual.ordenes += 1;
    diaActual.importe += orden.total;
    porDia.set(dia, diaActual);

    for (const alimento of orden.alimentos) {
      const actual = porProducto.get(alimento.productoId) ?? { cantidad: 0, importe: 0 };
      actual.cantidad += alimento.cantidad;
      actual.importe += alimento.precioTotal;
      porProducto.set(alimento.productoId, actual);
    }
  }

  return {
    fechaCorte: new Date().toISOString(),
    moneda: "MXN",
    productos: state.productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      categoria: categorias.get(p.categoriaId) ?? "Sin categoría",
      precioVenta: p.precio,
      disponible: p.disponible,
      unidadMedida: p.unidadMedida,
      minimoReorden: p.minimoReorden,
      inventarioRastreado: p.rastrearInventario,
    })),
    recetas: state.recetas.map((r) => ({
      producto: productos.get(r.productoId)?.nombre ?? r.productoId,
      cantidadProducida: r.cantidad,
      unidades: r.unidades,
      ingredientes: r.ingredientes.map((i) => ({
        nombre: productos.get(i.componenteProductoId)?.nombre ?? i.componenteProductoId,
        cantidad: i.cantidad,
        unidadMedida: i.unidadMedida,
      })),
    })),
    ventasPagadas: {
      ordenes: pagadas.length,
      importeTotal: pagadas.reduce((sum, o) => sum + o.total, 0),
      porProducto: Array.from(porProducto, ([productoId, valores]) => ({
        nombre: productos.get(productoId)?.nombre ?? productoId,
        ...valores,
      })),
      porDia: Array.from(porDia, ([fecha, valores]) => ({ fecha, ...valores })).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    },
  };
}
