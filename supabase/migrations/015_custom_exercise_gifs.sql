-- Tabla para GIFs "adoptados" por el admin. Cuando el admin elige un GIF
-- externo para un ejercicio del catalogo (via buscador en ExerciseDB),
-- se guarda aca la URL. getExerciseGif() prueba local → custom → undefined.

create table if not exists custom_exercise_gifs (
  exercise_id text primary key,
  gif_url text not null,
  source text,                         -- ej: 'exercisedb', 'manual'
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table custom_exercise_gifs enable row level security;

-- Todos pueden leer (el GIF se muestra al cliente en /dashboard/ejercicios).
drop policy if exists "anyone reads custom gifs" on custom_exercise_gifs;
create policy "anyone reads custom gifs" on custom_exercise_gifs
  for select using (true);

-- Solo admin escribe.
drop policy if exists "admin writes custom gifs" on custom_exercise_gifs;
create policy "admin writes custom gifs" on custom_exercise_gifs
  for all using (is_admin()) with check (is_admin());
