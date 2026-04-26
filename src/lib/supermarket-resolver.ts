// Nutrition v2 — F2: resolver de supermercado local
//
// Dado el country + city del cliente (de surveys), determina si hay un
// supermercado local con compra online disponible para mostrar el boton
// correspondiente en la UI de la lista de compras.
//
// Estrategia de match:
//   1. Super activos en el country del cliente
//   2. Si el cliente tiene city: prioriza super que liste esa city
//   3. Sino: super con cities=[] (cobertura nacional)
//   4. Empate: por priority DESC, despues por nombre
//
// La query es SELECT puro a supermarket_catalog (RLS publica).

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Supermarket {
  id: string;
  name: string;
  country: string;
  cities: string[];
  hasOnlineShopping: boolean;
  onlineUrl: string | null;
  searchUrlTemplate: string | null;
  priority: number;
}

interface SupermarketRow {
  id: string;
  name: string;
  country: string;
  cities: string[] | null;
  has_online_shopping: boolean;
  online_url: string | null;
  search_url_template: string | null;
  priority: number;
  active: boolean;
}

function rowToSupermarket(row: SupermarketRow): Supermarket {
  return {
    id: row.id,
    name: row.name,
    country: row.country,
    cities: row.cities ?? [],
    hasOnlineShopping: row.has_online_shopping,
    onlineUrl: row.online_url,
    searchUrlTemplate: row.search_url_template,
    priority: row.priority,
  };
}

// Devuelve el super recomendado para la region del cliente, o null si
// no hay ninguno con compra online en ese pais.
export async function resolveSupermarket(
  supabase: SupabaseClient,
  country: string,
  city?: string | null
): Promise<Supermarket | null> {
  const { data, error } = await supabase
    .from("supermarket_catalog")
    .select("*")
    .eq("country", country)
    .eq("active", true)
    .eq("has_online_shopping", true)
    .order("priority", { ascending: false });

  if (error || !data || data.length === 0) return null;

  const supers = data.map(rowToSupermarket);

  // Si el cliente especifica city, priorizar super que liste esa city
  if (city && city.trim().length > 0) {
    const cityNorm = city.trim().toLowerCase();
    const cityMatch = supers.find(s =>
      s.cities.some(c => c.toLowerCase() === cityNorm)
    );
    if (cityMatch) return cityMatch;
  }

  // Fallback: el primero con cobertura nacional (cities=[]) o cualquiera disponible
  const national = supers.find(s => s.cities.length === 0);
  return national ?? supers[0];
}

// Devuelve TODOS los super activos en la region (para mostrar como opciones
// alternativas debajo del principal).
export async function listSupermarketsForRegion(
  supabase: SupabaseClient,
  country: string
): Promise<Supermarket[]> {
  const { data, error } = await supabase
    .from("supermarket_catalog")
    .select("*")
    .eq("country", country)
    .eq("active", true)
    .order("priority", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToSupermarket);
}

// Construye URL de busqueda para un producto especifico.
// Si el super no soporta busqueda, devuelve onlineUrl o null.
export function buildSearchUrl(supermarket: Supermarket, productName: string): string | null {
  if (!supermarket.hasOnlineShopping) return null;
  if (!supermarket.searchUrlTemplate) {
    return supermarket.onlineUrl ?? null;
  }
  // Sanitizar el nombre: quitar parentesis del catalogo "(cocido)", etc
  const clean = productName.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  return supermarket.searchUrlTemplate.replace("{query}", encodeURIComponent(clean));
}
