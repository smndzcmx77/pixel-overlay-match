CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION private.is_approved_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND aprobado = true
  );
$$;

CREATE OR REPLACE FUNCTION private.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
      AND p.aprobado = true
      AND ur.role = 'encargado'
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_approved_staff() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_manager() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_approved_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_manager() TO authenticated, service_role;

DROP POLICY IF EXISTS "Los encargados ven los perfiles del personal" ON public.profiles;
CREATE POLICY "Los encargados ven los perfiles del personal"
ON public.profiles FOR SELECT TO authenticated
USING (private.is_manager());

DROP POLICY IF EXISTS "Personal aprobado gestiona categorias" ON public.pos_categorias;
DROP POLICY IF EXISTS "Personal aprobado gestiona alimentos de ordenes" ON public.pos_orden_alimentos;
DROP POLICY IF EXISTS "Personal aprobado gestiona ordenes" ON public.pos_ordenes;
DROP POLICY IF EXISTS "Personal aprobado gestiona productos" ON public.pos_productos;
DROP POLICY IF EXISTS "Personal aprobado gestiona ingredientes" ON public.pos_receta_ingredientes;
DROP POLICY IF EXISTS "Personal aprobado gestiona recetas" ON public.pos_recetas;
DROP POLICY IF EXISTS "Personal aprobado gestiona el punto de venta" ON public.pos_workspaces;

CREATE POLICY "Personal aprobado gestiona categorias"
ON public.pos_categorias FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona alimentos de ordenes"
ON public.pos_orden_alimentos FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona ordenes"
ON public.pos_ordenes FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona productos"
ON public.pos_productos FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona ingredientes"
ON public.pos_receta_ingredientes FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona recetas"
ON public.pos_recetas FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona el punto de venta"
ON public.pos_workspaces FOR ALL TO authenticated
USING (private.is_approved_staff()) WITH CHECK (private.is_approved_staff());

DROP FUNCTION public.set_staff_approval(uuid, boolean);
DROP FUNCTION public.is_manager();
DROP FUNCTION public.is_approved_staff();
DROP FUNCTION public.has_role(uuid, public.app_role);