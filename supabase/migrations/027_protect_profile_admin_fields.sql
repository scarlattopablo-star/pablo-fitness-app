-- Seguridad: la policy "Users can update own profile" deja que cada usuario
-- haga UPDATE de cualquier columna de su fila, incluido is_admin.
-- Este trigger bloquea que un usuario comun cambie is_admin o deleted_at.
-- Permitido: admins (is_admin()) y el servidor con service role / SQL editor
-- (auth.uid() es NULL en esos casos).
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
      RAISE EXCEPTION 'No autorizado a cambiar is_admin';
    END IF;
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      RAISE EXCEPTION 'No autorizado a cambiar deleted_at';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;
CREATE TRIGGER protect_profile_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();
