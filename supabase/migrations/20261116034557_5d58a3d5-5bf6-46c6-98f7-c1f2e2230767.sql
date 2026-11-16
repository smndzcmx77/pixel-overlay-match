CREATE TABLE public.pos_workspaces (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  siguiente_no_orden INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_workspaces TO anon, authenticated;
GRANT ALL ON public.pos_workspaces TO service_role;
ALTER TABLE public.pos_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido al punto de venta" ON public.pos_workspaces FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pos_categorias (
  workspace_id TEXT NOT NULL REFERENCES public.pos_workspaces(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  posicion INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_categorias TO anon, authenticated;
GRANT ALL ON public.pos_categorias TO service_role;
ALTER TABLE public.pos_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido a categorias" ON public.pos_categorias FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pos_productos (
  workspace_id TEXT NOT NULL REFERENCES public.pos_workspaces(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  precio NUMERIC(14,3) NOT NULL DEFAULT 0,
  categoria_id TEXT NOT NULL DEFAULT '',
  disponible NUMERIC(14,3) NOT NULL DEFAULT 0,
  unidad_medida TEXT NOT NULL DEFAULT 'Unidades',
  minimo_reorden NUMERIC(14,3) NOT NULL DEFAULT 0,
  ventas BOOLEAN NOT NULL DEFAULT true,
  pos BOOLEAN NOT NULL DEFAULT true,
  compra BOOLEAN NOT NULL DEFAULT false,
  rastrear_inventario BOOLEAN NOT NULL DEFAULT false,
  posicion INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_productos TO anon, authenticated;
GRANT ALL ON public.pos_productos TO service_role;
ALTER TABLE public.pos_productos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido a productos" ON public.pos_productos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pos_recetas (
  workspace_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  cantidad NUMERIC(14,3) NOT NULL DEFAULT 1,
  unidades TEXT NOT NULL DEFAULT 'Unidades',
  tipo TEXT NOT NULL DEFAULT 'Fabricar producto',
  posicion INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, producto_id),
  FOREIGN KEY (workspace_id, producto_id) REFERENCES public.pos_productos(workspace_id, id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_recetas TO anon, authenticated;
GRANT ALL ON public.pos_recetas TO service_role;
ALTER TABLE public.pos_recetas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido a recetas" ON public.pos_recetas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pos_receta_ingredientes (
  workspace_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  posicion INTEGER NOT NULL,
  componente_producto_id TEXT NOT NULL,
  cantidad NUMERIC(14,3) NOT NULL DEFAULT 0,
  unidad_medida TEXT NOT NULL DEFAULT 'Unidades',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, producto_id, posicion),
  FOREIGN KEY (workspace_id, producto_id) REFERENCES public.pos_recetas(workspace_id, producto_id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_receta_ingredientes TO anon, authenticated;
GRANT ALL ON public.pos_receta_ingredientes TO service_role;
ALTER TABLE public.pos_receta_ingredientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido a ingredientes" ON public.pos_receta_ingredientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pos_ordenes (
  workspace_id TEXT NOT NULL REFERENCES public.pos_workspaces(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  no_orden INTEGER NOT NULL,
  fecha TIMESTAMPTZ NOT NULL,
  para_llevar BOOLEAN NOT NULL DEFAULT false,
  mesa SMALLINT NOT NULL DEFAULT 1,
  mesero TEXT NOT NULL DEFAULT 'Mesero-1',
  total NUMERIC(14,3) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendiente Cocina',
  metodo_pago TEXT,
  posicion INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, id),
  UNIQUE (workspace_id, no_orden)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_ordenes TO anon, authenticated;
GRANT ALL ON public.pos_ordenes TO service_role;
ALTER TABLE public.pos_ordenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido a ordenes" ON public.pos_ordenes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.pos_orden_alimentos (
  workspace_id TEXT NOT NULL,
  orden_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  cantidad NUMERIC(14,3) NOT NULL DEFAULT 0,
  precio_unitario NUMERIC(14,3) NOT NULL DEFAULT 0,
  precio_total NUMERIC(14,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, orden_id, producto_id),
  FOREIGN KEY (workspace_id, orden_id) REFERENCES public.pos_ordenes(workspace_id, id) ON DELETE CASCADE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_orden_alimentos TO anon, authenticated;
GRANT ALL ON public.pos_orden_alimentos TO service_role;
ALTER TABLE public.pos_orden_alimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso compartido a alimentos de ordenes" ON public.pos_orden_alimentos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_pos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pos_workspaces_updated_at BEFORE UPDATE ON public.pos_workspaces FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();
CREATE TRIGGER set_pos_categorias_updated_at BEFORE UPDATE ON public.pos_categorias FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();
CREATE TRIGGER set_pos_productos_updated_at BEFORE UPDATE ON public.pos_productos FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();
CREATE TRIGGER set_pos_recetas_updated_at BEFORE UPDATE ON public.pos_recetas FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();
CREATE TRIGGER set_pos_receta_ingredientes_updated_at BEFORE UPDATE ON public.pos_receta_ingredientes FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();
CREATE TRIGGER set_pos_ordenes_updated_at BEFORE UPDATE ON public.pos_ordenes FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();
CREATE TRIGGER set_pos_orden_alimentos_updated_at BEFORE UPDATE ON public.pos_orden_alimentos FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();

CREATE OR REPLACE FUNCTION public.sync_pos_state(p_state JSONB, p_expected_revision INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  workspace CONSTANT TEXT := 'chilaqueria';
  current_revision INTEGER;
BEGIN
  IF jsonb_typeof(p_state) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_state->'categorias') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_state->'productos') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_state->'recetas') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_state->'ordenes') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Estado del punto de venta inválido';
  END IF;

  SELECT revision INTO current_revision
  FROM public.pos_workspaces
  WHERE id = workspace
  FOR UPDATE;

  IF current_revision IS NULL THEN
    RAISE EXCEPTION 'El punto de venta no está inicializado';
  END IF;
  IF current_revision <> p_expected_revision THEN
    RAISE EXCEPTION 'REVISION_CONFLICT';
  END IF;

  DELETE FROM public.pos_receta_ingredientes WHERE workspace_id = workspace;
  DELETE FROM public.pos_orden_alimentos WHERE workspace_id = workspace;

  DELETE FROM public.pos_recetas AS r
  WHERE r.workspace_id = workspace
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_state->'recetas') AS value
      WHERE value->>'productoId' = r.producto_id
    );

  DELETE FROM public.pos_ordenes AS o
  WHERE o.workspace_id = workspace
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_state->'ordenes') AS value
      WHERE value->>'id' = o.id
    );

  INSERT INTO public.pos_categorias (workspace_id, id, nombre, posicion)
  SELECT workspace, value->>'id', value->>'nombre', (orden - 1)::INTEGER
  FROM jsonb_array_elements(p_state->'categorias') WITH ORDINALITY AS item(value, orden)
  ON CONFLICT (workspace_id, id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    posicion = EXCLUDED.posicion;

  DELETE FROM public.pos_categorias AS c
  WHERE c.workspace_id = workspace
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_state->'categorias') AS value
      WHERE value->>'id' = c.id
    );

  INSERT INTO public.pos_productos (
    workspace_id, id, nombre, precio, categoria_id, disponible, unidad_medida,
    minimo_reorden, ventas, pos, compra, rastrear_inventario, posicion
  )
  SELECT
    workspace, value->>'id', value->>'nombre', (value->>'precio')::NUMERIC,
    COALESCE(value->>'categoriaId', ''), (value->>'disponible')::NUMERIC,
    value->>'unidadMedida', (value->>'minimoReorden')::NUMERIC,
    (value->>'ventas')::BOOLEAN, (value->>'pos')::BOOLEAN,
    (value->>'compra')::BOOLEAN, (value->>'rastrearInventario')::BOOLEAN,
    (orden - 1)::INTEGER
  FROM jsonb_array_elements(p_state->'productos') WITH ORDINALITY AS item(value, orden)
  ON CONFLICT (workspace_id, id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    precio = EXCLUDED.precio,
    categoria_id = EXCLUDED.categoria_id,
    disponible = EXCLUDED.disponible,
    unidad_medida = EXCLUDED.unidad_medida,
    minimo_reorden = EXCLUDED.minimo_reorden,
    ventas = EXCLUDED.ventas,
    pos = EXCLUDED.pos,
    compra = EXCLUDED.compra,
    rastrear_inventario = EXCLUDED.rastrear_inventario,
    posicion = EXCLUDED.posicion;

  DELETE FROM public.pos_productos AS p
  WHERE p.workspace_id = workspace
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_state->'productos') AS value
      WHERE value->>'id' = p.id
    );

  INSERT INTO public.pos_recetas (workspace_id, producto_id, cantidad, unidades, tipo, posicion)
  SELECT workspace, value->>'productoId', (value->>'cantidad')::NUMERIC,
    value->>'unidades', value->>'tipo', (orden - 1)::INTEGER
  FROM jsonb_array_elements(p_state->'recetas') WITH ORDINALITY AS item(value, orden)
  ON CONFLICT (workspace_id, producto_id) DO UPDATE SET
    cantidad = EXCLUDED.cantidad,
    unidades = EXCLUDED.unidades,
    tipo = EXCLUDED.tipo,
    posicion = EXCLUDED.posicion;

  INSERT INTO public.pos_receta_ingredientes (
    workspace_id, producto_id, posicion, componente_producto_id, cantidad, unidad_medida
  )
  SELECT workspace, receta.value->>'productoId', (ingrediente.orden - 1)::INTEGER,
    ingrediente.value->>'componenteProductoId', (ingrediente.value->>'cantidad')::NUMERIC,
    ingrediente.value->>'unidadMedida'
  FROM jsonb_array_elements(p_state->'recetas') AS receta(value)
  CROSS JOIN LATERAL jsonb_array_elements(receta.value->'ingredientes') WITH ORDINALITY AS ingrediente(value, orden);

  INSERT INTO public.pos_ordenes (
    workspace_id, id, no_orden, fecha, para_llevar, mesa, mesero,
    total, estado, metodo_pago, posicion
  )
  SELECT workspace, value->>'id', (value->>'noOrden')::INTEGER,
    (value->>'fecha')::TIMESTAMPTZ, (value->>'paraLlevar')::BOOLEAN,
    (value->>'mesa')::SMALLINT, value->>'mesero', (value->>'total')::NUMERIC,
    value->>'estado', value->>'metodoPago', (orden - 1)::INTEGER
  FROM jsonb_array_elements(p_state->'ordenes') WITH ORDINALITY AS item(value, orden)
  ON CONFLICT (workspace_id, id) DO UPDATE SET
    no_orden = EXCLUDED.no_orden,
    fecha = EXCLUDED.fecha,
    para_llevar = EXCLUDED.para_llevar,
    mesa = EXCLUDED.mesa,
    mesero = EXCLUDED.mesero,
    total = EXCLUDED.total,
    estado = EXCLUDED.estado,
    metodo_pago = EXCLUDED.metodo_pago,
    posicion = EXCLUDED.posicion;

  INSERT INTO public.pos_orden_alimentos (
    workspace_id, orden_id, producto_id, cantidad, precio_unitario, precio_total
  )
  SELECT workspace, orden.value->>'id', alimento.value->>'productoId',
    (alimento.value->>'cantidad')::NUMERIC, (alimento.value->>'precioUnitario')::NUMERIC,
    (alimento.value->>'precioTotal')::NUMERIC
  FROM jsonb_array_elements(p_state->'ordenes') AS orden(value)
  CROSS JOIN LATERAL jsonb_array_elements(orden.value->'alimentos') AS alimento(value);

  UPDATE public.pos_workspaces
  SET siguiente_no_orden = (p_state->>'siguienteNoOrden')::INTEGER,
    revision = current_revision + 1
  WHERE id = workspace;

  RETURN current_revision + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_pos_state(JSONB, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_pos_state(JSONB, INTEGER) TO anon, authenticated, service_role;

INSERT INTO public.pos_workspaces (id, nombre, siguiente_no_orden)
VALUES ('chilaqueria', 'Chilaquería', 1);

INSERT INTO public.pos_categorias (workspace_id, id, nombre, posicion) VALUES
  ('chilaqueria', 'c1', 'Chilaquiles', 0),
  ('chilaqueria', 'c2', 'Bebidas', 1),
  ('chilaqueria', 'c3', 'Extras', 2),
  ('chilaqueria', 'c4', 'Insumos', 3);

INSERT INTO public.pos_productos (
  workspace_id, id, nombre, precio, categoria_id, disponible, unidad_medida,
  minimo_reorden, ventas, pos, compra, rastrear_inventario, posicion
) VALUES
  ('chilaqueria', 'p1', 'Chilaquiles Verdes', 120, 'c1', 0, 'Unidades', 0, true, true, false, false, 0),
  ('chilaqueria', 'p2', 'Chilaquiles Rojos', 120, 'c1', 0, 'Unidades', 0, true, true, false, false, 1),
  ('chilaqueria', 'p3', 'Chilaquiles Divorciados', 135, 'c1', 0, 'Unidades', 0, true, true, false, false, 2),
  ('chilaqueria', 'p4', 'Café de Olla', 35, 'c2', 40, 'Unidades', 10, true, true, false, true, 3),
  ('chilaqueria', 'p5', 'Jugo de Naranja', 45, 'c2', 25, 'Unidades', 8, true, true, false, true, 4),
  ('chilaqueria', 'p6', 'Refresco', 30, 'c2', 6, 'Unidades', 10, true, true, false, true, 5),
  ('chilaqueria', 'p7', 'Huevo Estrellado Extra', 20, 'c3', 0, 'Unidades', 0, true, true, false, false, 6),
  ('chilaqueria', 'i1', 'Totopos', 0, 'c4', 5000, 'g', 1000, false, false, true, true, 7),
  ('chilaqueria', 'i2', 'Salsa Verde', 0, 'c4', 3, 'L', 1, false, false, true, true, 8),
  ('chilaqueria', 'i3', 'Salsa Roja', 0, 'c4', 3, 'L', 1, false, false, true, true, 9),
  ('chilaqueria', 'i4', 'Crema', 0, 'c4', 2, 'L', 0.5, false, false, true, true, 10),
  ('chilaqueria', 'i5', 'Queso Fresco', 0, 'c4', 1500, 'g', 500, false, false, true, true, 11),
  ('chilaqueria', 'i6', 'Huevo', 0, 'c4', 60, 'Unidades', 24, false, false, true, true, 12);

INSERT INTO public.pos_recetas (workspace_id, producto_id, cantidad, unidades, tipo, posicion) VALUES
  ('chilaqueria', 'p1', 1, 'Unidades', 'Fabricar producto', 0),
  ('chilaqueria', 'p2', 1, 'Unidades', 'Fabricar producto', 1),
  ('chilaqueria', 'p3', 1, 'Unidades', 'Fabricar producto', 2),
  ('chilaqueria', 'p7', 1, 'Unidades', 'Kit', 3);

INSERT INTO public.pos_receta_ingredientes (
  workspace_id, producto_id, posicion, componente_producto_id, cantidad, unidad_medida
) VALUES
  ('chilaqueria', 'p1', 0, 'i1', 150, 'g'),
  ('chilaqueria', 'p1', 1, 'i2', 0.15, 'L'),
  ('chilaqueria', 'p1', 2, 'i4', 0.03, 'L'),
  ('chilaqueria', 'p1', 3, 'i5', 40, 'g'),
  ('chilaqueria', 'p2', 0, 'i1', 150, 'g'),
  ('chilaqueria', 'p2', 1, 'i3', 0.15, 'L'),
  ('chilaqueria', 'p2', 2, 'i4', 0.03, 'L'),
  ('chilaqueria', 'p2', 3, 'i5', 40, 'g'),
  ('chilaqueria', 'p3', 0, 'i1', 160, 'g'),
  ('chilaqueria', 'p3', 1, 'i2', 0.08, 'L'),
  ('chilaqueria', 'p3', 2, 'i3', 0.08, 'L'),
  ('chilaqueria', 'p3', 3, 'i5', 40, 'g'),
  ('chilaqueria', 'p7', 0, 'i6', 1, 'Unidades');

ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_categorias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_productos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_recetas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_receta_ingredientes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_ordenes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_orden_alimentos;