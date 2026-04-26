-- Nutrition v2 — F2: catalogo de supermercados por region
--
-- Permite que la app detecte el super local del cliente (segun country + city
-- en surveys) y muestre el boton de compra online solo si hay un servicio
-- disponible. Tambien permite que en F2.5 los precios de food_prices se
-- vinculen a un super especifico (precio Tienda Inglesa vs Disco).
--
-- search_url_template: usar {query} como placeholder para encodeURIComponent
-- del nombre del producto. Ej: 'https://www.disco.com.uy/busca?ft={query}'.
-- Si has_online_shopping=false, search_url_template puede quedar NULL.

CREATE TABLE IF NOT EXISTS public.supermarket_catalog (
  id                   TEXT PRIMARY KEY,                      -- 'disco-uy','tienda-inglesa-uy'
  name                 TEXT NOT NULL,                          -- 'Disco'
  country              TEXT NOT NULL,                          -- 'UY','AR','ES'
  cities               TEXT[] DEFAULT '{}',                    -- vacio = cobertura nacional
  has_online_shopping  BOOLEAN DEFAULT FALSE,
  online_url           TEXT,                                   -- 'https://www.disco.com.uy'
  search_url_template  TEXT,                                   -- 'https://www.disco.com.uy/busca?ft={query}'
  logo_url             TEXT,                                   -- opcional para UI
  priority             SMALLINT DEFAULT 0,                     -- mayor = preferido primero en region
  active               BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supermarket_country ON public.supermarket_catalog(country);
CREATE INDEX IF NOT EXISTS idx_supermarket_active ON public.supermarket_catalog(active);

-- Vincular food_prices a un super especifico (opcional). NULL = precio
-- promedio regional (lo que ya tenemos de migration 018).
ALTER TABLE public.food_prices
  ADD COLUMN IF NOT EXISTS supermarket_id TEXT
    REFERENCES public.supermarket_catalog(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_food_prices_supermarket ON public.food_prices(supermarket_id);

-- RLS: lectura abierta, admin escribe.
ALTER TABLE public.supermarket_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view supermarket_catalog" ON public.supermarket_catalog;
DROP POLICY IF EXISTS "Admin can manage supermarket_catalog" ON public.supermarket_catalog;

CREATE POLICY "Anyone can view supermarket_catalog" ON public.supermarket_catalog
  FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage supermarket_catalog" ON public.supermarket_catalog
  FOR ALL USING (public.is_admin());

-- Trigger updated_at (la funcion ya existe de migration 017)
DROP TRIGGER IF EXISTS supermarket_catalog_touch_updated_at ON public.supermarket_catalog;
CREATE TRIGGER supermarket_catalog_touch_updated_at
  BEFORE UPDATE ON public.supermarket_catalog
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- SEED inicial — Uruguay
-- Cobertura nacional asumida cuando cities='{}'.
-- URLs de busqueda verificadas a 2025; pueden requerir ajuste si los sites
-- cambian sus rutas de busqueda.
-- ============================================================

INSERT INTO public.supermarket_catalog (id, name, country, cities, has_online_shopping, online_url, search_url_template, priority, active) VALUES
('disco-uy',           'Disco',           'UY', ARRAY[]::TEXT[], TRUE,  'https://www.disco.com.uy',          'https://www.disco.com.uy/busca?ft={query}',                 90, TRUE),
('tienda-inglesa-uy',  'Tienda Inglesa',  'UY', ARRAY[]::TEXT[], TRUE,  'https://www.tiendainglesa.com.uy',  'https://www.tiendainglesa.com.uy/buscar/?q={query}',        85, TRUE),
('devoto-uy',          'Devoto',          'UY', ARRAY[]::TEXT[], TRUE,  'https://www.devoto.com.uy',         'https://www.devoto.com.uy/busca?ft={query}',                80, TRUE),
('tata-uy',            'Tata',            'UY', ARRAY[]::TEXT[], TRUE,  'https://www.tata.com.uy',           'https://www.tata.com.uy/buscapagina?ft={query}',            70, TRUE),
('frigorifico-uy',     'Frigorifico',     'UY', ARRAY[]::TEXT[], FALSE, NULL,                                NULL,                                                         50, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name                = EXCLUDED.name,
  country             = EXCLUDED.country,
  cities              = EXCLUDED.cities,
  has_online_shopping = EXCLUDED.has_online_shopping,
  online_url          = EXCLUDED.online_url,
  search_url_template = EXCLUDED.search_url_template,
  priority            = EXCLUDED.priority,
  active              = EXCLUDED.active,
  updated_at          = NOW();
