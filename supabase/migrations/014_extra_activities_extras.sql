-- Agrega a extra_activities los campos para:
--   · strength_same_day: si hizo entrenamiento de fuerza del plan el mismo dia
--     (permite sumar al volumen total del dia).
--   · distance_km: opcional, util para correr/ciclismo/caminata.
-- Ambos son opcionales y no rompen registros previos.

alter table extra_activities
  add column if not exists strength_same_day boolean not null default false,
  add column if not exists distance_km numeric(6,2);
