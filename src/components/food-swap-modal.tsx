"use client";

import { useState, useMemo } from "react";
import { X, Search, Loader2, ArrowRight } from "lucide-react";
import {
  type FoodItem,
  getFoodById,
  findFoodByName,
  getSwapAlternatives,
  calculateSwapGrams,
  calculateFoodMacros,
} from "@/lib/food-database";

interface MealFood {
  name: string;
  grams: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodSwapModalProps {
  mealName: string;
  currentFood: MealFood;
  onSwap: (newFoodId: string) => Promise<void>;
  onClose: () => void;
}

export function FoodSwapModal({ mealName, currentFood, onSwap, onClose }: FoodSwapModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  const currentDbFood = useMemo(() => findFoodByName(currentFood.name), [currentFood.name]);

  const alternatives = useMemo(() => {
    if (!currentDbFood) return [];
    return getSwapAlternatives(currentDbFood.id, mealName);
  }, [currentDbFood, mealName]);

  const filtered = useMemo(() => {
    if (!search.trim()) return alternatives;
    const q = search.toLowerCase();
    return alternatives.filter((f) => f.name.toLowerCase().includes(q));
  }, [alternatives, search]);

  const selectedFood = selected ? getFoodById(selected) : null;
  const preview = useMemo(() => {
    if (!selectedFood || !currentDbFood) return null;
    const grams = calculateSwapGrams(currentDbFood, currentFood.grams, selectedFood);
    const macros = calculateFoodMacros(selectedFood, grams);
    return { grams, ...macros };
  }, [selectedFood, currentDbFood, currentFood.grams]);

  const handleConfirm = async () => {
    if (!selected) return;
    setSwapping(true);
    await onSwap(selected);
    setSwapping(false);
  };

  const categoryLabel: Record<string, string> = {
    protein: "Proteina",
    carb: "Carbohidrato",
    fat: "Grasa",
    vegetable: "Verdura",
    fruit: "Fruta",
    dairy: "Lacteo",
    snack: "Snack",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="bg-background w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-card-border shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">Cambiar alimento</h3>
            <button onClick={onClose} className="text-muted hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-card-bg rounded-xl p-3">
            <p className="text-xs text-muted mb-1">Alimento actual</p>
            <p className="font-bold text-sm">{currentFood.name}</p>
            <div className="flex gap-2 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded">{currentFood.grams}g</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded">{currentFood.calories} kcal</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">P:{currentFood.protein}g</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">C:{currentFood.carbs}g</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">G:{currentFood.fat}g</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alimento..."
              className="w-full bg-card-bg border border-card-border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          {currentDbFood && (
            <p className="text-[10px] text-muted mt-2">
              Categoria: {categoryLabel[currentDbFood.category] || currentDbFood.category} — {filtered.length} alternativas
            </p>
          )}
        </div>

        {/* Alternatives list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          {!currentDbFood ? (
            <p className="text-sm text-muted text-center py-6">
              Este alimento no esta en la base de datos. No se puede intercambiar.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">
              No hay alternativas disponibles
            </p>
          ) : (
            filtered.map((food) => {
              const isSelected = selected === food.id;
              const grams = calculateSwapGrams(currentDbFood, currentFood.grams, food);
              const macros = calculateFoodMacros(food, grams);
              return (
                <button
                  key={food.id}
                  onClick={() => setSelected(isSelected ? null : food.id)}
                  className={`w-full text-left rounded-xl p-3 transition-all ${
                    isSelected
                      ? "bg-primary/10 border border-primary/40"
                      : "bg-card-bg border border-transparent hover:border-card-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{food.name}</p>
                    <span className="text-xs text-primary font-bold">{grams}g</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-muted">{macros.calories} kcal</span>
                    <span className="text-[10px] text-red-400">P:{macros.protein}g</span>
                    <span className="text-[10px] text-yellow-400">C:{macros.carbs}g</span>
                    <span className="text-[10px] text-blue-400">G:{macros.fat}g</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Preview + Confirm */}
        {selected && preview && (
          <div className="p-4 border-t border-card-border shrink-0">
            <div className="flex items-center gap-2 mb-3 text-xs">
              <div className="flex-1 text-center">
                <p className="text-muted">Actual</p>
                <p className="font-bold">{currentFood.calories} kcal</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-muted">Nuevo</p>
                <p className="font-bold">{preview.calories} kcal</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-muted">Diferencia</p>
                <p className={`font-bold ${Math.abs(preview.calories - currentFood.calories) > 30 ? "text-warning" : "text-primary"}`}>
                  {preview.calories - currentFood.calories > 0 ? "+" : ""}
                  {preview.calories - currentFood.calories} kcal
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              disabled={swapping}
              className="w-full gradient-primary text-black font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {swapping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Cambiar a {selectedFood?.name}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
