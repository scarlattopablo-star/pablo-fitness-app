-- Nutrition v2 — F4: catalogo de suplementos
--
-- Una sola tabla con suplementos comunes en deporte/fitness, niveles de
-- evidencia (ISSN/JISSN), contraindicaciones, dosis por defecto y costo
-- mensual estimado en UYU.
--
-- evidence_level: 1=especulativo, 2=poca evidencia, 3=mixta, 4=solida, 5=ISSN tier-A
-- priority en supplement-advisor.ts decidira cual es esencial/recomendado/opcional
-- segun perfil del cliente.

CREATE TABLE IF NOT EXISTS public.supplement_catalog (
  id                TEXT PRIMARY KEY,                       -- 'whey','creatina'
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,                          -- 'proteina','rendimiento','salud','recuperacion'
  evidence_level    SMALLINT CHECK (evidence_level BETWEEN 1 AND 5),
  recommended_for   TEXT[] DEFAULT '{}',                    -- ['ganar-musculo','rendimiento','definicion','recuperacion']
  contraindications TEXT[] DEFAULT '{}',                    -- ['hipertension','diabetes',...]
  default_dose      TEXT,                                   -- ej: '5g/dia'
  timing            TEXT,                                   -- 'post-entreno','antes-de-dormir','con-comidas'
  monthly_cost_uyu  NUMERIC(8,2),                           -- estimacion mensual UY
  notes             TEXT,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplement_category ON public.supplement_catalog(category);

-- RLS: lectura abierta, admin escribe
ALTER TABLE public.supplement_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view supplement_catalog" ON public.supplement_catalog;
DROP POLICY IF EXISTS "Admin can manage supplement_catalog" ON public.supplement_catalog;
CREATE POLICY "Anyone can view supplement_catalog" ON public.supplement_catalog FOR SELECT USING (TRUE);
CREATE POLICY "Admin can manage supplement_catalog" ON public.supplement_catalog FOR ALL USING (public.is_admin());

DROP TRIGGER IF EXISTS supplement_catalog_touch_updated_at ON public.supplement_catalog;
CREATE TRIGGER supplement_catalog_touch_updated_at
  BEFORE UPDATE ON public.supplement_catalog
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- SEED
-- ============================================================

INSERT INTO public.supplement_catalog (id, name, category, evidence_level, recommended_for, contraindications, default_dose, timing, monthly_cost_uyu, notes) VALUES
('whey',          'Proteina whey',          'proteina',     5, ARRAY['ganar-musculo','rendimiento','definicion'],            ARRAY['lactosa-severa'],         '1 scoop (25-30g)',     'post-entreno o desayuno',     1300, 'Cierra cuota de proteina cuando la dieta queda corta. Aislada para sensibilidad a lactosa.'),
('creatina',      'Creatina monohidrato',   'rendimiento',  5, ARRAY['ganar-musculo','fuerza','rendimiento','definicion'],   ARRAY['enfermedad-renal'],       '5g/dia',               'cualquier momento (constancia)', 600,  'Aumenta fuerza, volumen y rendimiento en alta intensidad. Tomar todos los dias incluso en descanso.'),
('omega-3',       'Omega 3 (EPA+DHA)',      'salud',        5, ARRAY['recuperacion','salud-cardiovascular','antiinflamatorio'],ARRAY['anticoagulantes'],       '2-3g EPA+DHA/dia',     'con comidas',                 900,  'Antiinflamatorio. Critico si la dieta no incluye pescado azul 2x/semana.'),
('multivitaminico','Multivitaminico',       'salud',        3, ARRAY['salud','dieta-restrictiva'],                            ARRAY[]::TEXT[],                 '1 capsula/dia',        'desayuno',                    500,  'Cubre micronutrientes en dietas hipocaloricas o muy restrictivas.'),
('magnesio',      'Magnesio (citrato/bisglicinato)','recuperacion',4, ARRAY['recuperacion','calambres','sueno','rendimiento'],ARRAY['enfermedad-renal'],       '300-400mg/dia',        'antes-de-dormir',             450,  'Relajacion muscular, sueno, prevencion de calambres en entrenos intensos.'),
('vitamina-d',    'Vitamina D3',            'salud',        4, ARRAY['salud','sistema-inmune','huesos'],                      ARRAY['hipercalcemia'],          '2000-4000 UI/dia',     'con-grasa',                   350,  'Critico en otono/invierno UY. Soporta inmunidad y absorcion de calcio.'),
('cafeina',       'Cafeina anhidra',        'rendimiento',  5, ARRAY['rendimiento','definicion','energia'],                   ARRAY['hipertension','arritmias','ansiedad'], '3-6mg/kg pre-entreno', 'pre-entreno (30-45 min antes)', 500, 'Aumenta rendimiento y oxidacion de grasas. Evitar cerca del horario de sueno.'),
('pre-entreno',   'Pre-entreno (cafeina+citrulina+beta-alanina)','rendimiento',4, ARRAY['rendimiento','energia'],         ARRAY['hipertension','arritmias','ansiedad'], '1 scoop',          'pre-entreno (20-30 min antes)', 1500, 'Complejo para sesiones intensas. Mismo cuidado con cafeina nocturna.'),
('bcaa',          'BCAAs',                  'recuperacion', 2, ARRAY['definicion','entreno-en-ayunas'],                       ARRAY[]::TEXT[],                 '5-10g',                'pre o intra entreno',         800,  'Util solo si entrenas en ayunas. Si comes proteina suficiente, prescindible.'),
('glutamina',     'Glutamina',              'recuperacion', 2, ARRAY['recuperacion','salud-intestinal'],                      ARRAY[]::TEXT[],                 '5g/dia',               'antes-de-dormir',             700,  'Evidencia mixta para hipertrofia. Util en alta carga de entreno o estres digestivo.'),
('caseina',       'Caseina micelar',        'proteina',     4, ARRAY['ganar-musculo','recuperacion'],                         ARRAY['lactosa-severa'],         '1 scoop (25-30g)',     'antes-de-dormir',             1200, 'Liberacion lenta de aminoacidos. Buena ultima comida del dia.'),
('zma',           'ZMA (Zinc+Mg+B6)',       'recuperacion', 3, ARRAY['recuperacion','sueno','testosterona'],                  ARRAY['enfermedad-renal'],       '1 dosis',              'antes-de-dormir (sin lacteos)', 600, 'Soporta recuperacion y descanso. Tomar lejos de calcio para mejor absorcion.'),
('ashwagandha',   'Ashwagandha (KSM-66)',   'salud',        3, ARRAY['estres','recuperacion','sueno','testosterona'],         ARRAY['embarazo','tiroides-medicada'], '600mg/dia',         'partido en 2 tomas',          800,  'Adaptogeno. Ayuda en estres alto y sueno deficiente.'),
('vitamina-b12',  'Vitamina B12 (metilcobalamina)','salud', 5, ARRAY['vegano','vegetariano','energia'],                       ARRAY[]::TEXT[],                 '1000mcg 2-3x/semana',  'desayuno',                    400,  'OBLIGATORIO en vegano. Recomendado en vegetariano. Sin riesgo de toxicidad.'),
('hierro',        'Hierro (bisglicinato)',  'salud',        4, ARRAY['mujer','vegano','vegetariano','rendimiento'],           ARRAY['hemocromatosis'],         '15-30mg/dia',          'con-vitamina-c',              500,  'Recomendado en mujeres menstruantes activas, veganas o con anemia confirmada. NO suplementar sin analisis.')
ON CONFLICT (id) DO UPDATE SET
  name              = EXCLUDED.name,
  category          = EXCLUDED.category,
  evidence_level    = EXCLUDED.evidence_level,
  recommended_for   = EXCLUDED.recommended_for,
  contraindications = EXCLUDED.contraindications,
  default_dose      = EXCLUDED.default_dose,
  timing            = EXCLUDED.timing,
  monthly_cost_uyu  = EXCLUDED.monthly_cost_uyu,
  notes             = EXCLUDED.notes,
  updated_at        = NOW();
