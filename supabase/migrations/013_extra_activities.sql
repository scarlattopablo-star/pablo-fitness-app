-- Tabla para loguear entrenamientos/actividades hechas por fuera del plan
-- (correr, futbol, kitesurf, caminata, etc.). No modifica target_calories —
-- queda como registro historico que suma XP al gamification.

create table if not exists extra_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  date date not null default current_date,
  activity_type text not null,          -- 'correr', 'futbol', 'ciclismo', 'kitesurf', 'caminata', 'hiit', 'funcional', 'otro'
  label text not null,                  -- nombre legible que se muestra al cliente
  duration_min int not null check (duration_min > 0 and duration_min <= 600),
  intensity text not null check (intensity in ('baja', 'media', 'alta')),
  kcal_burned int not null check (kcal_burned >= 0),
  notes text,
  created_at timestamptz default now()
);

create index if not exists extra_activities_user_date_idx
  on extra_activities (user_id, date desc);

alter table extra_activities enable row level security;

-- Cada cliente ve/crea/borra lo suyo. Admin ve todo.
drop policy if exists "own read extra" on extra_activities;
create policy "own read extra" on extra_activities
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "own insert extra" on extra_activities;
create policy "own insert extra" on extra_activities
  for insert with check (auth.uid() = user_id);

drop policy if exists "own delete extra" on extra_activities;
create policy "own delete extra" on extra_activities
  for delete using (auth.uid() = user_id or is_admin());
