DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('encargado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  puesto text NOT NULL DEFAULT '',
  aprobado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (nombre, puesto) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cada usuario ve su propio perfil"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cada usuario ve sus propios roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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

CREATE OR REPLACE FUNCTION public.is_approved_staff()
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

CREATE OR REPLACE FUNCTION public.is_manager()
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

CREATE OR REPLACE FUNCTION public.set_staff_approval(p_profile_id uuid, p_aprobado boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_manager() THEN
    RAISE EXCEPTION 'NO_AUTORIZADO';
  END IF;
  IF p_profile_id = auth.uid() AND NOT p_aprobado THEN
    RAISE EXCEPTION 'NO_PUEDES_RETIRAR_TU_PROPIO_ACCESO';
  END IF;
  UPDATE public.profiles
  SET aprobado = p_aprobado
  WHERE id = p_profile_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PERFIL_NO_ENCONTRADO';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_staff_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, puesto)
  VALUES (
    NEW.id,
    left(COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'nombre'), ''), split_part(COALESCE(NEW.email, ''), '@', 1), 'Personal'), 100),
    left(COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'puesto'), ''), 'Personal'), 100)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_approved_staff() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_manager() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_staff_approval(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_staff_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_staff_approval(uuid, boolean) TO authenticated, service_role;

CREATE POLICY "Los encargados ven los perfiles del personal"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_manager());

DROP TRIGGER IF EXISTS on_auth_user_created_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_staff
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_staff_profile();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.set_pos_updated_at();

INSERT INTO public.profiles (id, nombre, puesto)
SELECT
  id,
  left(COALESCE(NULLIF(trim(raw_user_meta_data ->> 'nombre'), ''), split_part(COALESCE(email, ''), '@', 1), 'Personal'), 100),
  left(COALESCE(NULLIF(trim(raw_user_meta_data ->> 'puesto'), ''), 'Personal'), 100)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acceso compartido a categorias" ON public.pos_categorias;
DROP POLICY IF EXISTS "Acceso compartido a alimentos de ordenes" ON public.pos_orden_alimentos;
DROP POLICY IF EXISTS "Acceso compartido a ordenes" ON public.pos_ordenes;
DROP POLICY IF EXISTS "Acceso compartido a productos" ON public.pos_productos;
DROP POLICY IF EXISTS "Acceso compartido a ingredientes" ON public.pos_receta_ingredientes;
DROP POLICY IF EXISTS "Acceso compartido a recetas" ON public.pos_recetas;
DROP POLICY IF EXISTS "Acceso compartido al punto de venta" ON public.pos_workspaces;

REVOKE ALL ON public.pos_categorias FROM anon;
REVOKE ALL ON public.pos_orden_alimentos FROM anon;
REVOKE ALL ON public.pos_ordenes FROM anon;
REVOKE ALL ON public.pos_productos FROM anon;
REVOKE ALL ON public.pos_receta_ingredientes FROM anon;
REVOKE ALL ON public.pos_recetas FROM anon;
REVOKE ALL ON public.pos_workspaces FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_categorias TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_orden_alimentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_ordenes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_productos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_receta_ingredientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_recetas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_workspaces TO authenticated;
GRANT ALL ON public.pos_categorias TO service_role;
GRANT ALL ON public.pos_orden_alimentos TO service_role;
GRANT ALL ON public.pos_ordenes TO service_role;
GRANT ALL ON public.pos_productos TO service_role;
GRANT ALL ON public.pos_receta_ingredientes TO service_role;
GRANT ALL ON public.pos_recetas TO service_role;
GRANT ALL ON public.pos_workspaces TO service_role;

CREATE POLICY "Personal aprobado gestiona categorias"
ON public.pos_categorias FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona alimentos de ordenes"
ON public.pos_orden_alimentos FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona ordenes"
ON public.pos_ordenes FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona productos"
ON public.pos_productos FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona ingredientes"
ON public.pos_receta_ingredientes FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona recetas"
ON public.pos_recetas FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());
CREATE POLICY "Personal aprobado gestiona el punto de venta"
ON public.pos_workspaces FOR ALL TO authenticated
USING (public.is_approved_staff()) WITH CHECK (public.is_approved_staff());

REVOKE ALL ON FUNCTION public.sync_pos_state(jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_pos_state(jsonb, integer) TO authenticated, service_role;