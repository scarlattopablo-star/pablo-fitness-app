-- Entrenadores suplentes: pueden ver a los clientes directos (personalizados)
-- y cargarles sesiones (pesos/reps), pero NO editar planes ni dietas.
-- Tabla aparte (y no una columna en profiles) porque los usuarios pueden
-- hacer UPDATE de su propia fila de profiles: asi nadie se puede auto-asignar el rol.
CREATE TABLE IF NOT EXISTS public.trainers (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainer can view own row" ON public.trainers;
CREATE POLICY "Trainer can view own row" ON public.trainers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage trainers" ON public.trainers;
CREATE POLICY "Admin can manage trainers" ON public.trainers
  FOR ALL USING (public.is_admin());
