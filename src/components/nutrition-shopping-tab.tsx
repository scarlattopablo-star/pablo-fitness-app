"use client";

// Nutrition v2 — F2: tab "Compra" en /dashboard/plan
//
// Muestra la shopping list agrupada por pasillo. Si el cliente vive en una
// region con un supermercado local que ofrece compra online (resuelto via
// supermarket-resolver), muestra el boton "Comprar lista en {super}" que
// copia la lista al portapapeles + abre la home del super.

import { useState } from "react";
import { ShoppingCart, Copy, Check, ExternalLink, Search } from "lucide-react";
import type { ShoppingList, AggregatedFood, AisleName } from "@/lib/shopping-list";
import { shoppingListToText } from "@/lib/shopping-list";
import type { PricedShoppingList } from "@/lib/budget-validator";
import type { Supermarket } from "@/lib/supermarket-resolver";
import { buildSearchUrl } from "@/lib/supermarket-resolver";

interface Props {
  list: ShoppingList | PricedShoppingList | null;
  supermarket: Supermarket | null;
  currency?: string;
}

const AISLE_ORDER: AisleName[] = [
  "Carniceria",
  "Pescaderia",
  "Lacteos y huevos",
  "Frutas y verduras",
  "Panaderia",
  "Almacen seco",
  "Suplementacion",
  "Otros",
];

function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg`;
  return `${g} g`;
}

function isPriced(item: AggregatedFood): item is AggregatedFood & { estimatedCost: number; currency: string; hasPriceData: boolean } {
  return "estimatedCost" in item;
}

export function NutritionShoppingTab({ list, supermarket, currency }: Props) {
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (!list) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <ShoppingCart className="h-10 w-10 text-muted mx-auto mb-3" />
        <p className="text-muted">
          Tu lista de compras se genera junto con el plan de nutricion. Si todavia no aparece, regenera tu plan desde el admin o esperá unos segundos.
        </p>
      </div>
    );
  }

  // Banner del periodo arriba de todo (primero que ve el usuario)
  const periodBanner = (
    <div className="text-xs text-center text-muted mb-3">
      Lista <span className="text-primary font-bold">{list.periodLabel.toLowerCase()}</span> · cubre {list.periodDays} dias de comida
    </div>
  );

  const handleCopy = async () => {
    try {
      const text = shoppingListToText(list, currency);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("No se pudo copiar la lista. Intenta de nuevo.");
    }
  };

  const handleOpenSuper = () => {
    if (!supermarket?.onlineUrl) return;
    handleCopy();
    window.open(supermarket.onlineUrl, "_blank", "noopener,noreferrer");
  };

  const toggleItem = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      {periodBanner}

      {/* Header con boton de compra online si hay super disponible */}
      {supermarket && supermarket.hasOnlineShopping && (
        <div className="glass-card rounded-2xl p-4 mb-4 border-l-4 border-primary">
          <p className="text-sm text-muted mb-2">
            Tu region tiene compra online disponible
          </p>
          <p className="font-bold mb-3">
            Super local detectado: <span className="text-primary">{supermarket.name}</span>
          </p>
          <button
            onClick={handleOpenSuper}
            className="w-full gradient-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="h-5 w-5" />
            Comprar lista en {supermarket.name}
            <ExternalLink className="h-4 w-4" />
          </button>
          <p className="text-xs text-muted mt-2 text-center">
            Copiamos la lista al portapapeles y abrimos {supermarket.name}. Pegá cada producto en su buscador.
          </p>
        </div>
      )}

      {/* Boton copiar siempre disponible */}
      <button
        onClick={handleCopy}
        className="w-full glass-card border border-card-border rounded-xl py-3 mb-4 flex items-center justify-center gap-2 font-medium hover:border-primary transition-colors"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        {copied ? "Lista copiada al portapapeles" : "Copiar lista al portapapeles"}
      </button>

      {/* Lista por pasillo */}
      <div className="space-y-4">
        {AISLE_ORDER.map(aisle => {
          const items = list.byAisle[aisle];
          if (!items || items.length === 0) return null;
          return (
            <div key={aisle} className="glass-card rounded-2xl overflow-hidden">
              <div className="bg-card-bg px-4 py-2.5 border-b border-card-border">
                <h3 className="font-bold text-sm uppercase tracking-wide">{aisle}</h3>
              </div>
              <ul className="divide-y divide-card-border">
                {items.map(item => {
                  const id = `${aisle}::${item.foodId}`;
                  const isChecked = !!checked[id];
                  const qty = item.totalUnits
                    ? `${item.totalUnits} ${item.unit.split(" (")[0]}`
                    : formatGrams(item.totalGrams);
                  const priced = isPriced(item);
                  return (
                    <li key={id} className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItem(id)}
                        className="h-4 w-4 rounded border-card-border accent-primary shrink-0"
                      />
                      <div className={`flex-1 min-w-0 ${isChecked ? "opacity-50 line-through" : ""}`}>
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted">{qty}</p>
                      </div>
                      {priced && item.hasPriceData && (
                        <span className="text-xs text-muted shrink-0">
                          ~{Math.round(item.estimatedCost)} {item.currency}
                        </span>
                      )}
                      {supermarket?.hasOnlineShopping && (
                        <button
                          onClick={() => {
                            const url = buildSearchUrl(supermarket, item.name);
                            if (url) window.open(url, "_blank", "noopener,noreferrer");
                          }}
                          className="text-muted hover:text-primary p-1 shrink-0"
                          title={`Buscar ${item.name} en ${supermarket.name}`}
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer: periodo + buffer + total */}
      <p className="text-xs text-muted mt-4 text-center">
        Lista <span className="text-white font-bold">{list.periodLabel.toLowerCase()}</span> ({list.periodDays} dias) ·
        Cantidades incluyen +{Math.round(list.bufferPct * 100)}% por mermas · {list.totalItems} productos
      </p>
    </div>
  );
}
