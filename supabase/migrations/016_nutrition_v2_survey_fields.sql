-- Migration: Nutrition v2 — extender surveys con campos para personalizacion premium
-- Todas las columnas son NULLABLE / con DEFAULT para no romper inserts existentes.
-- Sin sleep, stress ni favoritos (descartados en el scope).
--
-- Campos agregados:
--   - body_fat_pct           : habilita Katch-McArdle (BMR mas preciso)
--   - training_time          : timing peri-entreno
--   - job_activity           : NEAT laboral (afina TDEE)
--   - pathologies            : contraindica suplementos / ajusta plan
--   - intolerances           : filtra alimentos
--   - disliked_foods         : excluye en sustituciones
--   - meals_per_day          : usuario elige numero de comidas (3-6)
--   - food_budget_monthly    : valida lista de compras
--   - food_budget_currency   : UYU / ARS / USD / EUR
--   - country / city         : adapta precios y disponibilidad
--   - uses_supplements       : ya consume?
--   - current_supplements    : cuales
--   - wants_supplement_advice: opt-in a recomendaciones
--   - cooking_time_per_day   : minutos disponibles → filtra recetas
--   - shopping_frequency     : semanal / quincenal / mensual
--   - bmr_method             : 'mifflin' | 'katch-mcardle' | 'harris-benedict'

ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS body_fat_pct NUMERIC(4,1)
    CHECK (body_fat_pct IS NULL OR (body_fat_pct >= 3 AND body_fat_pct <= 60)),
  ADD COLUMN IF NOT EXISTS training_time TIME,
  ADD COLUMN IF NOT EXISTS job_activity TEXT
    CHECK (job_activity IS NULL OR job_activity IN ('sedentario','de-pie','manual','muy-activo')),
  ADD COLUMN IF NOT EXISTS pathologies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS intolerances TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disliked_foods TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meals_per_day SMALLINT
    CHECK (meals_per_day IS NULL OR (meals_per_day BETWEEN 3 AND 6)),
  ADD COLUMN IF NOT EXISTS food_budget_monthly NUMERIC(10,2)
    CHECK (food_budget_monthly IS NULL OR food_budget_monthly >= 0),
  ADD COLUMN IF NOT EXISTS food_budget_currency TEXT DEFAULT 'UYU'
    CHECK (food_budget_currency IN ('UYU','ARS','USD','EUR','BRL','CLP','MXN')),
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'UY',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS uses_supplements BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_supplements TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS wants_supplement_advice BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS cooking_time_per_day SMALLINT
    CHECK (cooking_time_per_day IS NULL OR cooking_time_per_day BETWEEN 0 AND 240),
  ADD COLUMN IF NOT EXISTS shopping_frequency TEXT
    CHECK (shopping_frequency IS NULL OR shopping_frequency IN ('semanal','quincenal','mensual')),
  ADD COLUMN IF NOT EXISTS bmr_method TEXT
    CHECK (bmr_method IS NULL OR bmr_method IN ('mifflin','katch-mcardle','harris-benedict'));

-- Indice para acelerar filtros por pais (precios regionales en F2)
CREATE INDEX IF NOT EXISTS idx_surveys_country ON public.surveys(country);
