-- Nutrition v2 — F2: seed inicial del catalogo de alimentos + precios UY
--
-- 88 alimentos espejados de src/lib/food-database.ts (USDA FoodData Central),
-- enriquecidos con: tier comercial, prep_time_min, difficulty, tags.
--
-- Precios UY: estimacion 2025 basada en supermercados de Montevideo
-- (Tienda Inglesa, Disco, Frigorifico, Tata). MARCAR como
-- source = 'estimado-uy-2025' para que sea facil ajustar despues con un solo
-- UPDATE. La realidad de cada cliente puede variar +/- 30%.
--
-- Uso de UPSERT: si la migration se corre 2 veces, los datos se REFRESCAN
-- (ON CONFLICT DO UPDATE), no falla.

-- ============================================================
-- FOOD CATALOG (88 alimentos)
-- ============================================================

INSERT INTO public.food_catalog (id, name, category, calories, protein, carbs, fat, fiber, unit, meal_types, prep_time_min, difficulty, tier, tags) VALUES
-- PROTEINAS
('pollo-pechuga',      'Pechuga de pollo (cocida)',     'protein', 165, 31,   0,    3.6,  NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('pollo-muslo',        'Muslo de pollo (cocido)',       'protein', 209, 26,   0,    10.9, NULL, 'g',                ARRAY['almuerzo','cena'],          20, 1, 'economico', ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('carne-magra',        'Carne vacuna magra (cocida)',   'protein', 250, 26,   0,    15,   NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('carne-molida',       'Carne molida magra (cocida)',   'protein', 255, 26,   0,    16,   NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('cerdo-lomo',         'Lomo de cerdo (cocido)',        'protein', 143, 27,   0,    3.5,  NULL, 'g',                ARRAY['almuerzo','cena'],          20, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('pavo-pechuga',       'Pechuga de pavo (cocida)',      'protein', 135, 30,   0,    1,    NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('salmon',             'Salmon (cocido)',               'protein', 208, 20,   0,    13,   NULL, 'g',                ARRAY['almuerzo','cena'],          20, 1, 'premium',   ARRAY['alta-proteina','sin-gluten','sin-lactosa','omega-3']),
('atun',               'Atun en agua (enlatado)',       'protein', 116, 26,   0,    1,    NULL, 'g',                ARRAY['almuerzo','cena','snack'],   2, 1, 'economico', ARRAY['alta-proteina','sin-gluten','sin-lactosa','omega-3']),
('merluza',            'Merluza (cocida)',              'protein', 90,  19,   0,    1.3,  NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('tilapia',            'Tilapia (cocida)',              'protein', 128, 26,   0,    2.7,  NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('camarones',          'Camarones (cocidos)',           'protein', 99,  24,   0.2,  0.3,  NULL, 'g',                ARRAY['almuerzo','cena'],          10, 2, 'premium',   ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('sardina',            'Sardinas en aceite (escurridas)','protein',208, 25,   0,    11,   NULL, 'g',                ARRAY['almuerzo','cena','snack'],   2, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa','omega-3']),
('huevo-entero',       'Huevo entero',                  'protein', 143, 13,   0.7,  9.5,  NULL, 'unidad (50g)',     ARRAY['desayuno','almuerzo','snack'],10,1,'economico', ARRAY['alta-proteina','sin-gluten','vegetariano']),
('clara-huevo',        'Clara de huevo',                'protein', 52,  11,   0.7,  0.2,  NULL, 'g',                ARRAY['desayuno','snack'],         5, 1, 'economico', ARRAY['alta-proteina','sin-gluten','vegetariano','low-fat']),
('whey-protein',       'Proteina whey (scoop)',         'protein', 120, 24,   3,    1.5,  NULL, 'scoop (30g)',      ARRAY['desayuno','snack'],         1, 1, 'premium',   ARRAY['alta-proteina','sin-gluten','vegetariano']),
('tofu',               'Tofu firme',                    'protein', 144, 17,   3,    8,    NULL, 'g',                ARRAY['almuerzo','cena'],          10, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa','vegano','vegetariano']),
('jamon-pavo',         'Jamon de pavo',                 'protein', 104, 18,   2,    2.5,  NULL, 'g',                ARRAY['desayuno','snack'],         1, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('bondiola',           'Bondiola de cerdo (cocida)',    'protein', 280, 24,   0,    20,   NULL, 'g',                ARRAY['almuerzo','cena'],          25, 2, 'premium',   ARRAY['alta-proteina','sin-gluten','sin-lactosa']),
('caballa',            'Caballa (cocida)',              'protein', 205, 19,   0,    14,   NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['alta-proteina','sin-gluten','sin-lactosa','omega-3']),
('caseina',            'Proteina caseina (scoop)',      'protein', 110, 24,   3,    0.5,  NULL, 'scoop (30g)',      ARRAY['snack'],                    1, 1, 'premium',   ARRAY['alta-proteina','sin-gluten','vegetariano']),

-- CARBOHIDRATOS
('arroz-blanco',       'Arroz blanco (cocido)',         'carb',    130, 2.7,  28,   0.3,  NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('arroz-integral',     'Arroz integral (cocido)',       'carb',    123, 2.7,  26,   1,    1.6,  'g',                ARRAY['almuerzo','cena'],          25, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','fibra']),
('avena',              'Avena (cruda)',                 'carb',    389, 17,   66,   7,    10,   'g',                ARRAY['desayuno'],                  5, 1, 'economico', ARRAY['vegano','sin-lactosa','low-ig','fibra']),
('boniato',            'Boniato/Batata (cocido)',       'carb',    90,  2,    21,   0.1,  3,    'g',                ARRAY['almuerzo','cena'],          25, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','fibra']),
('papa',               'Papa (cocida)',                 'carb',    87,  1.9,  20,   0.1,  NULL, 'g',                ARRAY['almuerzo','cena'],          20, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('pan-integral',       'Pan integral (rebanada)',       'carb',    247, 13,   41,   3.4,  7,    'rebanada (30g)',   ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['vegano','sin-lactosa','fibra']),
('pan-blanco',         'Pan blanco (rebanada)',         'carb',    265, 9,    49,   3.2,  NULL, 'rebanada (30g)',   ARRAY['desayuno','snack'],          1, 1, 'economico', ARRAY['vegano','sin-lactosa']),
('fideos',             'Fideos/Pasta (cocida)',         'carb',    131, 5,    25,   1.1,  NULL, 'g',                ARRAY['almuerzo','cena'],          12, 1, 'economico', ARRAY['vegano','sin-lactosa']),
('fideos-integrales',  'Pasta integral (cocida)',       'carb',    124, 5.3,  24,   0.5,  3.2,  'g',                ARRAY['almuerzo','cena'],          12, 1, 'estandar',  ARRAY['vegano','sin-lactosa','fibra']),
('galleta-arroz',      'Galleta de arroz',              'carb',    387, 8,    82,   2.8,  NULL, 'unidad (9g)',      ARRAY['snack'],                     1, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa']),
('quinoa',             'Quinoa (cocida)',               'carb',    120, 4.4,  21,   1.9,  2.8,  'g',                ARRAY['almuerzo','cena'],          20, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','alta-proteina','fibra']),
('lentejas',           'Lentejas (cocidas)',            'carb',    116, 9,    20,   0.4,  8,    'g',                ARRAY['almuerzo','cena'],          30, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','alta-proteina','fibra']),
('garbanzos',          'Garbanzos (cocidos)',           'carb',    164, 9,    27,   2.6,  8,    'g',                ARRAY['almuerzo','cena'],          30, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','alta-proteina','fibra']),
('porotos-negros',     'Porotos negros (cocidos)',      'carb',    132, 9,    24,   0.5,  8.7,  'g',                ARRAY['almuerzo','cena'],          30, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','alta-proteina','fibra']),
('choclo',             'Choclo/Maiz (cocido)',          'carb',    96,  3.4,  21,   1.5,  2.4,  'g',                ARRAY['almuerzo','cena'],          15, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','fibra']),
('mandioca',           'Mandioca/Yuca (cocida)',        'carb',    160, 1.4,  38,   0.3,  NULL, 'g',                ARRAY['almuerzo','cena'],          25, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('tortilla-trigo',     'Tortilla de trigo',             'carb',    312, 8,    52,   8,    NULL, 'unidad (40g)',     ARRAY['almuerzo','cena','snack'],   1, 1, 'estandar',  ARRAY['vegano','sin-lactosa']),
('granola',            'Granola',                       'carb',    471, 10,   64,   20,   5,    'g',                ARRAY['desayuno'],                  1, 1, 'estandar',  ARRAY['vegano','sin-lactosa','fibra']),

-- GRASAS
('aceite-oliva',       'Aceite de oliva',               'fat',     884, 0,    0,    100,  NULL, 'cucharada (14g)',  ARRAY['almuerzo','cena'],           1, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa']),
('aceite-coco',        'Aceite de coco',                'fat',     862, 0,    0,    100,  NULL, 'cucharada (14g)',  ARRAY['desayuno','almuerzo','cena'],1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa']),
('palta',              'Palta/Aguacate',                'fat',     160, 2,    8.5,  15,   7,    'g',                ARRAY['desayuno','almuerzo','snack'],2, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','fibra']),
('almendras',          'Almendras',                     'fat',     579, 21,   22,   50,   12,   'g',                ARRAY['snack'],                     1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','fibra','frutos-secos']),
('nueces',             'Nueces',                        'fat',     654, 15,   14,   65,   NULL, 'g',                ARRAY['snack'],                     1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','frutos-secos','omega-3']),
('castanas-caju',      'Castanas de caju',              'fat',     553, 18,   30,   44,   NULL, 'g',                ARRAY['snack'],                     1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','frutos-secos']),
('pistachos',          'Pistachos',                     'fat',     560, 20,   28,   45,   10,   'g',                ARRAY['snack'],                     1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','fibra','frutos-secos']),
('mani',               'Mantequilla de mani',           'fat',     588, 25,   20,   50,   NULL, 'cucharada (16g)',  ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa']),
('mantequilla-almendras','Mantequilla de almendras',    'fat',     614, 21,   19,   56,   NULL, 'cucharada (16g)',  ARRAY['desayuno','snack'],          1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','frutos-secos']),
('semillas-chia',      'Semillas de chia',              'fat',     486, 17,   42,   31,   34,   'cucharada (12g)',  ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','fibra','omega-3']),
('semillas-lino',      'Semillas de lino',              'fat',     534, 18,   29,   42,   27,   'cucharada (10g)',  ARRAY['desayuno','snack'],          1, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','fibra','omega-3']),
('semillas-girasol',   'Semillas de girasol',           'fat',     584, 21,   20,   51,   9,    'g',                ARRAY['snack'],                     1, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','fibra']),

-- LACTEOS
('yogurt-descremado',  'Yogurt descremado',             'dairy',   56,  10,   4,    0.2,  NULL, 'g (200g)',         ARRAY['desayuno','snack'],          1, 1, 'economico', ARRAY['vegetariano','low-fat']),
('yogurt-griego',      'Yogurt griego',                 'dairy',   97,  9,    3.6,  5,    NULL, 'g (170g)',         ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['vegetariano','alta-proteina']),
('leche-descremada',   'Leche descremada',              'dairy',   34,  3.4,  5,    0.1,  NULL, 'ml (200ml)',       ARRAY['desayuno'],                  1, 1, 'economico', ARRAY['vegetariano','low-fat']),
('leche-entera',       'Leche entera',                  'dairy',   61,  3.2,  4.8,  3.3,  NULL, 'ml (200ml)',       ARRAY['desayuno'],                  1, 1, 'economico', ARRAY['vegetariano']),
('queso-cottage',      'Queso cottage',                 'dairy',   98,  11,   3.4,  4.3,  NULL, 'g',                ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['vegetariano','alta-proteina']),
('queso-ricota',       'Ricota descremada',             'dairy',   138, 11,   3.5,  8,    NULL, 'g',                ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['vegetariano']),
('queso-untable',      'Queso crema light',             'dairy',   140, 7,    5,    10,   NULL, 'g',                ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['vegetariano']),
('queso-muzzarella',   'Muzzarella',                    'dairy',   280, 28,   3.1,  17,   NULL, 'g',                ARRAY['almuerzo','cena','snack'],   1, 1, 'premium',   ARRAY['vegetariano','alta-proteina']),

-- FRUTAS
('banana',             'Banana',                        'fruit',   89,  1.1,  23,   0.3,  NULL, 'unidad (120g)',    ARRAY['desayuno','snack'],          0, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('manzana',            'Manzana',                       'fruit',   52,  0.3,  14,   0.2,  NULL, 'unidad (180g)',    ARRAY['snack'],                     0, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','fibra']),
('arandanos',          'Arandanos',                     'fruit',   57,  0.7,  14,   0.3,  NULL, 'g',                ARRAY['desayuno','snack'],          0, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','antioxidantes']),
('frutilla',           'Frutillas/Fresas',              'fruit',   32,  0.7,  7.7,  0.3,  NULL, 'g',                ARRAY['desayuno','snack'],          0, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','antioxidantes']),
('naranja',            'Naranja',                       'fruit',   47,  0.9,  12,   0.1,  NULL, 'unidad (130g)',    ARRAY['snack'],                     0, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('mandarina',          'Mandarina',                     'fruit',   53,  0.8,  13,   0.3,  NULL, 'unidad (90g)',     ARRAY['snack'],                     0, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('pera',               'Pera',                          'fruit',   57,  0.4,  15,   0.1,  NULL, 'unidad (180g)',    ARRAY['snack'],                     0, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','fibra']),
('durazno',            'Durazno',                       'fruit',   39,  0.9,  10,   0.3,  NULL, 'unidad (150g)',    ARRAY['snack'],                     0, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig']),
('sandia',             'Sandia',                        'fruit',   30,  0.6,  8,    0.2,  NULL, 'g',                ARRAY['snack'],                     0, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('mango',              'Mango',                         'fruit',   60,  0.8,  15,   0.4,  NULL, 'g',                ARRAY['desayuno','snack'],          0, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa']),
('anana',              'Anana/Pina',                    'fruit',   50,  0.5,  13,   0.1,  NULL, 'g',                ARRAY['desayuno','snack'],          1, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa']),
('kiwi',               'Kiwi',                          'fruit',   61,  1.1,  15,   0.5,  NULL, 'unidad (75g)',     ARRAY['desayuno','snack'],          0, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','vitamina-c']),
('uvas',               'Uvas',                          'fruit',   69,  0.7,  18,   0.2,  NULL, 'g',                ARRAY['snack'],                     0, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa']),
('ciruela',            'Ciruela',                       'fruit',   46,  0.7,  11,   0.3,  NULL, 'unidad (65g)',     ARRAY['snack'],                     0, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig']),

-- VERDURAS
('brocoli',            'Brocoli (cocido)',              'vegetable',35, 2.4,  7,    0.4,  3.3,  'g',                ARRAY['almuerzo','cena'],           8, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','fibra']),
('espinaca',           'Espinaca (cruda)',              'vegetable',23, 2.9,  3.6,  0.4,  2.2,  'g',                ARRAY['almuerzo','cena'],           1, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','hierro']),
('tomate',             'Tomate',                        'vegetable',18, 0.9,  3.9,  0.2,  NULL, 'unidad (120g)',    ARRAY['almuerzo','cena'],           1, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','antioxidantes']),
('zapallo',            'Zapallo (cocido)',              'vegetable',26, 1,    6.5,  0.1,  NULL, 'g',                ARRAY['almuerzo','cena'],          15, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('zanahoria',          'Zanahoria (cocida)',            'vegetable',35, 0.8,  8,    0.2,  NULL, 'g',                ARRAY['almuerzo','cena'],          10, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('lechuga',            'Lechuga',                       'vegetable',15, 1.4,  2.9,  0.2,  NULL, 'g',                ARRAY['almuerzo','cena'],           1, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig']),
('pepino',             'Pepino',                        'vegetable',15, 0.7,  3.6,  0.1,  NULL, 'g',                ARRAY['almuerzo','cena'],           1, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa','low-ig']),
('cebolla',            'Cebolla',                       'vegetable',40, 1.1,  9,    0.1,  NULL, 'g',                ARRAY['almuerzo','cena'],           2, 1, 'economico', ARRAY['sin-gluten','vegano','sin-lactosa']),
('morron',             'Morron/Pimiento',               'vegetable',31, 1,    6,    0.3,  NULL, 'unidad (120g)',    ARRAY['almuerzo','cena'],           5, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','vitamina-c']),
('coliflor',           'Coliflor (cocida)',             'vegetable',23, 1.8,  4.1,  0.5,  2.3,  'g',                ARRAY['almuerzo','cena'],          10, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','fibra']),
('chauchas',           'Chauchas/Judias verdes (cocidas)','vegetable',35, 1.8, 7,    0.4, 3.4,  'g',                ARRAY['almuerzo','cena'],          10, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','fibra']),
('berenjena',          'Berenjena (cocida)',            'vegetable',25, 0.8,  6,    0.2,  2.5,  'g',                ARRAY['almuerzo','cena'],          15, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','fibra']),
('zucchini',           'Zucchini/Zapallito (cocido)',   'vegetable',17, 1.2,  3.1,  0.3,  NULL, 'g',                ARRAY['almuerzo','cena'],          10, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa','low-ig']),
('champinones',        'Champinones (cocidos)',         'vegetable',28, 2.2,  5,    0.5,  NULL, 'g',                ARRAY['almuerzo','cena'],           8, 1, 'estandar',  ARRAY['sin-gluten','vegano','sin-lactosa']),
('rucula',             'Rucula',                        'vegetable',25, 2.6,  3.7,  0.7,  1.6,  'g',                ARRAY['almuerzo','cena'],           1, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','low-ig']),
('esparragos',         'Esparragos (cocidos)',          'vegetable',22, 2.4,  4,    0.2,  2,    'g',                ARRAY['almuerzo','cena'],          10, 1, 'premium',   ARRAY['sin-gluten','vegano','sin-lactosa','low-ig','fibra'])
ON CONFLICT (id) DO UPDATE SET
  name          = EXCLUDED.name,
  category      = EXCLUDED.category,
  calories      = EXCLUDED.calories,
  protein       = EXCLUDED.protein,
  carbs         = EXCLUDED.carbs,
  fat           = EXCLUDED.fat,
  fiber         = EXCLUDED.fiber,
  unit          = EXCLUDED.unit,
  meal_types    = EXCLUDED.meal_types,
  prep_time_min = EXCLUDED.prep_time_min,
  difficulty    = EXCLUDED.difficulty,
  tier          = EXCLUDED.tier,
  tags          = EXCLUDED.tags,
  updated_at    = NOW();

-- ============================================================
-- FOOD PRICES — UY (estimacion 2025, supermercados Montevideo)
-- city='' = promedio nacional. price_per_unit solo cuando se vende por unidad.
-- ============================================================

INSERT INTO public.food_prices (food_id, country, city, price_per_kg, price_per_unit, currency, source) VALUES
-- Proteinas
('pollo-pechuga',      'UY','', 280,    NULL, 'UYU','estimado-uy-2025'),
('pollo-muslo',        'UY','', 200,    NULL, 'UYU','estimado-uy-2025'),
('carne-magra',        'UY','', 480,    NULL, 'UYU','estimado-uy-2025'),
('carne-molida',       'UY','', 380,    NULL, 'UYU','estimado-uy-2025'),
('cerdo-lomo',         'UY','', 350,    NULL, 'UYU','estimado-uy-2025'),
('pavo-pechuga',       'UY','', 450,    NULL, 'UYU','estimado-uy-2025'),
('salmon',             'UY','', 1200,   NULL, 'UYU','estimado-uy-2025'),
('atun',               'UY','', 400,    NULL, 'UYU','estimado-uy-2025'),
('merluza',            'UY','', 280,    NULL, 'UYU','estimado-uy-2025'),
('tilapia',            'UY','', 320,    NULL, 'UYU','estimado-uy-2025'),
('camarones',          'UY','', 850,    NULL, 'UYU','estimado-uy-2025'),
('sardina',            'UY','', 350,    NULL, 'UYU','estimado-uy-2025'),
('huevo-entero',       'UY','', NULL,   4.5,  'UYU','estimado-uy-2025'),
('clara-huevo',        'UY','', 90,     NULL, 'UYU','estimado-uy-2025'),
('whey-protein',       'UY','', 1500,   45,   'UYU','estimado-uy-2025'),
('tofu',               'UY','', 380,    NULL, 'UYU','estimado-uy-2025'),
('jamon-pavo',         'UY','', 480,    NULL, 'UYU','estimado-uy-2025'),
('bondiola',           'UY','', 420,    NULL, 'UYU','estimado-uy-2025'),
('caballa',            'UY','', 320,    NULL, 'UYU','estimado-uy-2025'),
('caseina',            'UY','', 1400,   42,   'UYU','estimado-uy-2025'),

-- Carbos
('arroz-blanco',       'UY','', 45,     NULL, 'UYU','estimado-uy-2025'),
('arroz-integral',     'UY','', 75,     NULL, 'UYU','estimado-uy-2025'),
('avena',              'UY','', 95,     NULL, 'UYU','estimado-uy-2025'),
('boniato',            'UY','', 50,     NULL, 'UYU','estimado-uy-2025'),
('papa',               'UY','', 35,     NULL, 'UYU','estimado-uy-2025'),
('pan-integral',       'UY','', 220,    7,    'UYU','estimado-uy-2025'),
('pan-blanco',         'UY','', 140,    4,    'UYU','estimado-uy-2025'),
('fideos',             'UY','', 70,     NULL, 'UYU','estimado-uy-2025'),
('fideos-integrales',  'UY','', 110,    NULL, 'UYU','estimado-uy-2025'),
('galleta-arroz',      'UY','', NULL,   12,   'UYU','estimado-uy-2025'),
('quinoa',             'UY','', 380,    NULL, 'UYU','estimado-uy-2025'),
('lentejas',           'UY','', 95,     NULL, 'UYU','estimado-uy-2025'),
('garbanzos',          'UY','', 110,    NULL, 'UYU','estimado-uy-2025'),
('porotos-negros',     'UY','', 110,    NULL, 'UYU','estimado-uy-2025'),
('choclo',             'UY','', 45,     NULL, 'UYU','estimado-uy-2025'),
('mandioca',           'UY','', 40,     NULL, 'UYU','estimado-uy-2025'),
('tortilla-trigo',     'UY','', NULL,   8,    'UYU','estimado-uy-2025'),
('granola',            'UY','', 320,    NULL, 'UYU','estimado-uy-2025'),

-- Grasas
('aceite-oliva',       'UY','', 420,    NULL, 'UYU','estimado-uy-2025'),
('aceite-coco',        'UY','', 480,    NULL, 'UYU','estimado-uy-2025'),
('palta',              'UY','', 220,    45,   'UYU','estimado-uy-2025'),
('almendras',          'UY','', 950,    NULL, 'UYU','estimado-uy-2025'),
('nueces',             'UY','', 850,    NULL, 'UYU','estimado-uy-2025'),
('castanas-caju',      'UY','', 1200,   NULL, 'UYU','estimado-uy-2025'),
('pistachos',          'UY','', 1500,   NULL, 'UYU','estimado-uy-2025'),
('mani',               'UY','', 320,    NULL, 'UYU','estimado-uy-2025'),
('mantequilla-almendras','UY','', 1100, NULL, 'UYU','estimado-uy-2025'),
('semillas-chia',      'UY','', 380,    NULL, 'UYU','estimado-uy-2025'),
('semillas-lino',      'UY','', 280,    NULL, 'UYU','estimado-uy-2025'),
('semillas-girasol',   'UY','', 250,    NULL, 'UYU','estimado-uy-2025'),

-- Lacteos
('yogurt-descremado',  'UY','', 120,    24,   'UYU','estimado-uy-2025'),
('yogurt-griego',      'UY','', 280,    50,   'UYU','estimado-uy-2025'),
('leche-descremada',   'UY','', 50,     50,   'UYU','estimado-uy-2025'),
('leche-entera',       'UY','', 50,     50,   'UYU','estimado-uy-2025'),
('queso-cottage',      'UY','', 280,    NULL, 'UYU','estimado-uy-2025'),
('queso-ricota',       'UY','', 220,    NULL, 'UYU','estimado-uy-2025'),
('queso-untable',      'UY','', 380,    NULL, 'UYU','estimado-uy-2025'),
('queso-muzzarella',   'UY','', 480,    NULL, 'UYU','estimado-uy-2025'),

-- Frutas
('banana',             'UY','', 50,     6,    'UYU','estimado-uy-2025'),
('manzana',            'UY','', 90,     16,   'UYU','estimado-uy-2025'),
('arandanos',          'UY','', 580,    NULL, 'UYU','estimado-uy-2025'),
('frutilla',           'UY','', 280,    NULL, 'UYU','estimado-uy-2025'),
('naranja',            'UY','', 60,     8,    'UYU','estimado-uy-2025'),
('mandarina',          'UY','', 70,     6,    'UYU','estimado-uy-2025'),
('pera',               'UY','', 90,     16,   'UYU','estimado-uy-2025'),
('durazno',            'UY','', 100,    15,   'UYU','estimado-uy-2025'),
('sandia',             'UY','', 35,     NULL, 'UYU','estimado-uy-2025'),
('mango',              'UY','', 220,    NULL, 'UYU','estimado-uy-2025'),
('anana',              'UY','', 80,     NULL, 'UYU','estimado-uy-2025'),
('kiwi',               'UY','', 250,    19,   'UYU','estimado-uy-2025'),
('uvas',               'UY','', 220,    NULL, 'UYU','estimado-uy-2025'),
('ciruela',            'UY','', 130,    9,    'UYU','estimado-uy-2025'),

-- Verduras
('brocoli',            'UY','', 140,    NULL, 'UYU','estimado-uy-2025'),
('espinaca',           'UY','', 180,    NULL, 'UYU','estimado-uy-2025'),
('tomate',             'UY','', 90,     11,   'UYU','estimado-uy-2025'),
('zapallo',            'UY','', 50,     NULL, 'UYU','estimado-uy-2025'),
('zanahoria',          'UY','', 50,     NULL, 'UYU','estimado-uy-2025'),
('lechuga',            'UY','', 90,     NULL, 'UYU','estimado-uy-2025'),
('pepino',             'UY','', 70,     NULL, 'UYU','estimado-uy-2025'),
('cebolla',            'UY','', 50,     NULL, 'UYU','estimado-uy-2025'),
('morron',             'UY','', 220,    26,   'UYU','estimado-uy-2025'),
('coliflor',           'UY','', 130,    NULL, 'UYU','estimado-uy-2025'),
('chauchas',           'UY','', 150,    NULL, 'UYU','estimado-uy-2025'),
('berenjena',          'UY','', 80,     NULL, 'UYU','estimado-uy-2025'),
('zucchini',           'UY','', 90,     NULL, 'UYU','estimado-uy-2025'),
('champinones',        'UY','', 220,    NULL, 'UYU','estimado-uy-2025'),
('rucula',             'UY','', 220,    NULL, 'UYU','estimado-uy-2025'),
('esparragos',         'UY','', 380,    NULL, 'UYU','estimado-uy-2025')
ON CONFLICT (food_id, country, city) DO UPDATE SET
  price_per_kg   = EXCLUDED.price_per_kg,
  price_per_unit = EXCLUDED.price_per_unit,
  currency       = EXCLUDED.currency,
  source         = EXCLUDED.source,
  updated_at     = NOW();
