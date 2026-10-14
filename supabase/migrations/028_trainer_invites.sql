-- Invitaciones personales para sumar entrenadores suplentes.
-- Pablo genera un link unico (/equipo?t=TOKEN); al aceptarlo, la cuenta queda como entrenador.
CREATE TABLE IF NOT EXISTS public.trainer_invites (
  token TEXT PRIMARY KEY,
  invitee_name TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ
);

ALTER TABLE public.trainer_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage trainer invites" ON public.trainer_invites;
CREATE POLICY "Admin can manage trainer invites" ON public.trainer_invites
  FOR ALL USING (public.is_admin());

-- Genero de la persona invitada, para los textos ("administradora" / "administrador")
ALTER TABLE public.trainer_invites ADD COLUMN IF NOT EXISTS invitee_gender TEXT CHECK (invitee_gender IN ('f', 'm'));
