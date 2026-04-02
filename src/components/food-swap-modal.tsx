"use client";

import { useState, useMemo } from "react";
import { X, Search, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import {
  type FoodItem,
  FOOD_DATABASE,
  getFoodById,
  findFoodByName,
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

const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteinas",
  carb: "Carbohidratos",
  fat: "Grasas saludables",
  dairy: "Lacteos",
  fruit: "Frutas",
  vegetable: "Verduras",
  snack: "Snacks",
};

const CATEGORY_ORDER = ["protein", "carb", "fat", "dairy", "fruit", "vegetable", "snack"];

export function FoodSwapModal({ mealName, currentFood, onSwap, onClose }: FoodSwapModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const currentDbFood = useMemo(() => findFoodByName(currentFood.name), [currentFood.name]);

  // Same category foods (excluding current)
  const sameCategoryFoods = useMemo(() => {
    if (!currentDbFood) return [];
    return FOOD_DATABASE.filter(f => f.id !== currentDbFood.id && f.category === currentDbFood.category);
  }, [currentDbFood]);

  // All OTHER category foods (excluding current)
  const otherFoods = useMemo(() => {
    if (!currentDbFood) return FOOD_DATABASE;
    return FOOD_DATABASE.filter(f => f.id !== currentDbFood.id && f.category !== currentDbFood.category);
  }, [currentDbFood]);

  // Filter by search across ALL foods
  const filteredSearch = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const all = FOOD_DATABASE.filter(f => !currentDbFood || f.id !== currentDbFood.id);
    return all.filter((f) => f.name.toLowerCase().includes(q) || f.id.includes(q));
  }, [search, currentDbFood]);

  const isSearching = search.trim().length > 0;

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

  const renderFoodItem = (food: FoodItem) => {
    const isSelected = selected === food.id;
    const grams = currentDbFood ? calculateSwapGrams(currentDbFood, currentFood.grams, food) : 100;
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
            <div className="flex flex-wrap gap-1.5 mt-1.5">
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
          {isSearching ? (
            <p className="text-[10px] text-muted mt-2">
              {filteredSearch.length} resultados para &quot;{search}&quot;
            </p>
          ) : currentDbFood ? (
            <div className="mt-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
              <p className="text-[11px] text-primary font-medium">
                {CATEGORY_LABELS[currentDbFood.category] || currentDbFood.category} — {sameCategoryFoods.length} opciones
              </p>
              <p className="text-[10px] text-muted">
                Estos alimentos mantienen tus macros. La cantidad se ajusta automaticamente.
              </p>
            </div>
          ) : null}
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {!currentDbFood ? (
            <p className="text-sm text-muted text-center py-6">
              Este alimento no esta en la base de datos. No se puede intercambiar.
            </p>
          ) : isSearching ? (
            // Search results across all categories
            filteredSearch.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                No se encontraron alimentos
              </p>
            ) : (
              <div className="space-y-1.5">
                {filteredSearch.map(renderFoodItem)}
              </div>
            )
          ) : (
            // Default: same category list + link to see all
            <div>
              <div className="space-y-1.5">
                {sameCategoryFoods.map(renderFoodItem)}
              </div>
              {!showAllCategories && otherFoods.length > 0 && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="w-full text-center text-xs text-primary font-medium py-3 mt-2 hover:underline"
                >
                  Ver todos los alimentos ({otherFoods.length} mas)
                </button>
              )}
              {showAllCategories && (
                <div className="mt-3 space-y-2">
                  {CATEGORY_ORDER.filter(cat => cat !== currentDbFood.category).map(cat => {
                    const foods = otherFoods.filter(f => f.category === cat);
                    if (foods.length === 0) return null;
                    const isOpen = expandedCategory === cat;
                    return (
                      <div key={cat}>
                        <button
                          onClick={() => setExpandedCategory(isOpen ? null : cat)}
                          className="w-full flex items-center justify-between py-2 px-1"
                        >
                          <span className="text-xs font-bold text-muted uppercase tracking-wider">
                            {CATEGORY_LABELS[cat] || cat} ({foods.length})
                          </span>
                          <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isOpen && (
                          <div className="space-y-1.5 pb-2">
                            {foods.map(renderFoodItem)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview + Confirm */}
        {selected && preview && selectedFood && (
          <div className="p-4 border-t border-card-border shrink-0">
            <div className="bg-card-bg rounded-xl p-3 mb-3">
              <p className="text-xs text-muted mb-1">Vas a comer</p>
              <p className="font-bold text-sm text-primary">{preview.grams}g de {selectedFood.name}</p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="text-center">
                  <p className="text-muted">Actual</p>
                  <p className="font-bold">{currentFood.calories} kcal</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                <div className="text-center">
                  <p className="text-muted">Nuevo</p>
                  <p className="font-bold">{preview.calories} kcal</p>
                </div>
                <div className="text-center">
                  <p className="text-muted">Dif.</p>
                  <p className={`font-bold ${Math.abs(preview.calories - currentFood.calories) > 30 ? "text-warning" : "text-primary"}`}>
                    {preview.calories - currentFood.calories > 0 ? "+" : ""}
                    {preview.calories - currentFood.calories}
                  </p>
                </div>
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
                <>Cambiar a {selectedFood.name}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
