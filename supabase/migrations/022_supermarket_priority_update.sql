-- Nutrition v2 — F2 fix: re-priorizar supermercados UY
-- Tienda Inglesa pasa a ser primario (priority 100). Disco baja a 70 porque
-- su pagina de busqueda online fue inestable. Devoto y Tata se mantienen.
-- Si Disco se estabiliza, podemos restaurar priorities con otra migration.

UPDATE public.supermarket_catalog
SET priority = 100, updated_at = NOW()
WHERE id = 'tienda-inglesa-uy';

UPDATE public.supermarket_catalog
SET priority = 70, updated_at = NOW()
WHERE id = 'disco-uy';

UPDATE public.supermarket_catalog
SET priority = 80, updated_at = NOW()
WHERE id = 'devoto-uy';

UPDATE public.supermarket_catalog
SET priority = 60, updated_at = NOW()
WHERE id = 'tata-uy';

-- Tambien actualizo el search_url_template de Tienda Inglesa por las dudas
-- (mantengo el actual pero dejo log explicito).
UPDATE public.supermarket_catalog
SET search_url_template = 'https://www.tiendainglesa.com.uy/buscar/?q={query}',
    online_url = 'https://www.tiendainglesa.com.uy',
    updated_at = NOW()
WHERE id = 'tienda-inglesa-uy';
