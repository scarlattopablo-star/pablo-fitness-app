-- Nutrition v2 — F2: catalogo de alimentos con precios por region
-- Disenado para alimentar la lista de compras + validador de presupuesto.
--
-- Diseno:
--  - food_catalog: 1 fila por alimento, con macros + tier comercial + tags.
--  - food_prices: 1 fila por (food_id, country, [city]). Permite tener precio
--    promedio nacional (city=NULL) y overrides por ciudad.
--
-- Ambas tablas read-only para clientes; admin puede CRUD via service role.
-- Las tablas son INDEPENDIENTES de food-database.ts (la lib estatica sigue
-- existiendo y se usa para sustituciones rapidas en el cliente). Esta tabla
-- es la fuente de verdad para precios + lista de compras del lado servidor.

CREATE TABLE IF NOT EXISTS public.food_catalog (
  id            TEXT PRIMARY KEY,                       -- 'pollo-pechuga'
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('protein','carb','fat','vegetable','fruit','dairy','snack')),
  calories      NUMERIC(7,2) NOT NULL,                  -- kcal por 100g
  protein       NUMERIC(5,2) NOT NULL DEFAULT 0,
  carbs         NUMERIC(5,2) NOT NULL DEFAULT 0,
  fat           NUMERIC(5,2) NOT NULL DEFAULT 0,
  fiber         NUMERIC(5,2),
  unit          TEXT NOT NULL,                          -- 'g' | 'unidad (50g)' | ...
  meal_types    TEXT[] DEFAULT '{}',                    -- ['desayuno','almuerzo']
  prep_time_min SMALLINT CHECK (prep_time_min IS NULL OR prep_time_min BETWEEN 0 AND 120),
  difficulty    SMALLINT CHECK (difficulty IS NULL OR difficulty BETWEEN 1 AND 3),
  tier          TEXT CHECK (tier IS NULL OR tier IN ('economico','estandar','premium')),
  tags          TEXT[] DEFAULT '{}',                    -- ['vegano','sin-gluten','low-ig']
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_catalog_category ON public.food_catalog(category);
CREATE INDEX IF NOT EXISTS idx_food_catalog_tier ON public.food_catalog(tier);
CREATE INDEX IF NOT EXISTS idx_food_catalog_tags ON public.food_catalog USING GIN(tags);

-- Precios por pais/ciudad. city=NULL es el promedio nacional/default.
CREATE TABLE IF NOT EXISTS public.food_prices (
  food_id        TEXT NOT NULL REFERENCES public.food_catalog(id) ON DELETE CASCADE,
  country        TEXT NOT NULL,                          -- 'UY','AR','ES'
  city           TEXT NOT NULL DEFAULT '',               -- '' = promedio nacional
  price_per_kg   NUMERIC(10,2),                          -- ej: 320.00 UYU/kg
  price_per_unit NUMERIC(10,2),                          -- ej: huevo 8.50 UYU/u
  currency       TEXT NOT NULL,                          -- 'UYU','ARS','USD'
  source         TEXT,                                   -- 'estimado-uy-2025','tienda-inglesa-2026-04'
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (food_id, country, city)
);

CREATE INDEX IF NOT EXISTS idx_food_prices_country ON public.food_prices(country);

-- RLS: lectura abierta (cualquier cliente puede ver precios para mostrar
-- shopping list). Solo admin escribe.
ALTER TABLE public.food_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_prices ENABLE ROW LEVEL SECURITY;

-- Drop policies si existian (idempotencia)
DROP POLICY IF EXISTS "Anyone can view food_catalog" ON public.food_catalog;
DROP POLICY IF EXISTS "Admin can manage food_catalog" ON public.food_catalog;
DROP POLICY IF EXISTS "Anyone can view food_prices" ON public.food_prices;
DROP POLICY IF EXISTS "Admin can manage food_prices" ON public.food_prices;

CREATE POLICY "Anyone can view food_catalog" ON public.food_catalog
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage food_catalog" ON public.food_catalog
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view food_prices" ON public.food_prices
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage food_prices" ON public.food_prices
  FOR ALL USING (public.is_admin());

-- Trigger: actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS food_catalog_touch_updated_at ON public.food_catalog;
CREATE TRIGGER food_catalog_touch_updated_at
  BEFORE UPDATE ON public.food_catalog
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS food_prices_touch_updated_at ON public.food_prices;
CREATE TRIGGER food_prices_touch_updated_at
  BEFORE UPDATE ON public.food_prices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
