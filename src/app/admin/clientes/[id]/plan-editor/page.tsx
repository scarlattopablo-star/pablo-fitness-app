"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Save, Dumbbell, UtensilsCrossed,
  GripVertical, Check, RefreshCw, History, X, RotateCcw,
} from "lucide-react";
import { EXERCISES } from "@/lib/exercises-data";
import { FOOD_DATABASE, formatFoodQuantity, findFoodByName, calculateFoodMacros, type FoodItem } from "@/lib/food-database";
import { supabase } from "@/lib/supabase";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import ExerciseGifPicker from "@/components/exercise-gif-picker";

interface TrainingExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
  // Metodo de entrenamiento elegido explicitamente por Pablo (opcional).
  // Si es vacio o "standard", el cliente no ve ninguna nota de metodo.
  method?: string;
}

// Metodos disponibles en el dropdown. value = lo que se guarda; label = lo que ve Pablo.
const METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "",           label: "Sin método" },
  { value: "superset",   label: "Superserie" },
  { value: "giant-set",  label: "Serie gigante" },
  { value: "drop-set",   label: "Drop set" },
  { value: "pyramid",    label: "Piramidal" },
  { value: "rest-pause", label: "Rest-pause" },
  { value: "cluster",    label: "Cluster" },
];

// Plantillas editables para cada metodo. Pablo puede clickear 📋 y se insertan
// en el campo "Nota personal" — despues las edita o las borra a gusto.
const METHOD_TEMPLATES: Record<string, string> = {
  "superset":   "Super serie: hacé este ejercicio y el siguiente seguidos, sin descanso entre medio. Descansá 60-90s al terminar ambos.",
  "giant-set":  "Serie gigante: 3-4 ejercicios seguidos del mismo grupo muscular, sin descanso. Descansá 90s al terminar todos.",
  "drop-set":   "Drop set: al llegar al fallo muscular, bajá el peso 20-25% y seguí sin descanso. Repetí 2 veces más. Solo en la última serie.",
  "pyramid":    "Piramidal: subí peso y bajá reps en cada serie. Ej: 15-12-10-8 reps con peso progresivamente mayor.",
  "rest-pause": "Rest-pause: hacé tus reps al fallo, descansá 15s, seguí hasta fallar otra vez, 15s más, y una última mini-serie.",
  "cluster":    "Cluster: dividí la serie en mini-series de 2-3 reps con 10-15s de descanso entre ellas. Ideal para peso más alto.",
};

interface TrainingDay {
  day: string;
  exercises: TrainingExercise[];
  instructions: string;
}

// Structured food entry in the editor
interface EditorFood {
  foodId: string;    // food-database id, or "" for custom
  name: string;      // display name
  grams: number;     // total grams (computed from units or entered directly)
  unit: string;      // unit type from food-database
  quantity: number;   // unit count (e.g. 3 eggs) or grams if unit="g"
  isUnitBased: boolean; // true = show unit picker, false = show grams input
  // Live macros
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  time: string;
  foods: EditorFood[];
}

// Get grams-per-unit from unit string like "unidad (50g)"
function getGramsPerUnit(unit: string): number {
  const m = unit.match(/\((\d+)\s*g\)/);
  return m ? parseInt(m[1]) : 0;
}

// Check if a food uses units (not plain grams)
function isUnitBasedFood(food: FoodItem): boolean {
  return /^(unidad|rebanada|scoop|cucharada)\s*\(/.test(food.unit);
}

// Get the unit label for display
function getUnitLabel(unit: string, count: number): string {
  const m = unit.match(/^(unidad|rebanada|scoop|cucharada)/);
  if (!m) return "g";
  const base = m[1];
  if (base === "unidad") return count !== 1 ? "unidades" : "unidad";
  if (base === "rebanada") return count !== 1 ? "rebanadas" : "rebanada";
  if (base === "scoop") return count !== 1 ? "scoops" : "scoop";
  if (base === "cucharada") return count !== 1 ? "cucharadas" : "cucharada";
  return "g";
}

// Create an EditorFood from a FoodItem
function makeEditorFood(food: FoodItem, grams: number): EditorFood {
  const unitBased = isUnitBasedFood(food);
  const gpu = getGramsPerUnit(food.unit);
  const quantity = unitBased && gpu > 0 ? Math.round(grams / gpu * 2) / 2 : grams;
  const totalGrams = unitBased && gpu > 0 ? quantity * gpu : grams;
  const macros = calculateFoodMacros(food, totalGrams);
  return {
    foodId: food.id,
    name: food.name,
    grams: totalGrams,
    unit: food.unit,
    quantity,
    isUnitBased: unitBased,
    ...macros,
  };
}

// Empty food placeholder
const EMPTY_EDITOR_FOOD: EditorFood = {
  foodId: "", name: "", grams: 0, unit: "g", quantity: 0,
  isUnitBased: false, calories: 0, protein: 0, carbs: 0, fat: 0,
};

// Parse a food string from existing plan data into EditorFood
function parseFoodToEditor(foodStr: string, foodDetail?: { name: string; grams: number; unit: string }): EditorFood {
  // If we have foodDetails, use them directly
  if (foodDetail) {
    const dbFood = findFoodByName(foodDetail.name);
    if (dbFood) return makeEditorFood(dbFood, foodDetail.grams);
  }

  const trimmed = foodStr.trim();
  if (!trimmed) return { ...EMPTY_EDITOR_FOOD };

  // Try to parse "150g Pollo" or "3 Huevo entero"
  const gramsMatch = trimmed.match(/^(\d+)\s*g\s+(.+)/i);
  const unitsMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)/i);

  if (gramsMatch) {
    const g = parseInt(gramsMatch[1]);
    const n = gramsMatch[2];
    const dbFood = findFoodByName(n);
    if (dbFood) return makeEditorFood(dbFood, g);
  } else if (unitsMatch) {
    const count = parseFloat(unitsMatch[1]);
    let rawName = unitsMatch[2];
    rawName = rawName.replace(/^(rebanadas?|scoops?|cucharadas?|unidad(es)?)\s+/i, "");
    const dbFood = findFoodByName(rawName);
    if (dbFood) {
      const gpu = getGramsPerUnit(dbFood.unit);
      if (gpu > 0) return makeEditorFood(dbFood, Math.round(count * gpu));
      return makeEditorFood(dbFood, count);
    }
  }

  // Fallback: try finding by name
  const dbFood = findFoodByName(trimmed);
  if (dbFood) return makeEditorFood(dbFood, 100);

  return { ...EMPTY_EDITOR_FOOD, name: trimmed };
}

// Build save payload from editor meals
function buildMealsForSave(meals: Meal[]) {
  return meals.map(meal => {
    const validFoods = meal.foods.filter(f => f.name.trim());
    const foodDetails = validFoods.map(f => ({
      name: f.name, grams: f.grams, unit: f.unit,
      calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat,
    }));
    const totals = validFoods.reduce(
      (acc, f) => ({ calories: acc.calories + f.calories, protein: acc.protein + f.protein, carbs: acc.carbs + f.carbs, fat: acc.fat + f.fat }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      name: meal.name,
      time: meal.time,
      foods: validFoods.map(f => formatFoodQuantity(f.name, f.grams, f.unit)),
      foodDetails,
      approxCalories: Math.round(totals.calories),
      approxProtein: Math.round(totals.protein),
      approxCarbs: Math.round(totals.carbs),
      approxFats: Math.round(totals.fat),
    };
  });
}

// ====================== FOOD SEARCH HELPERS ======================
// Aliases and plural handling for Spanish food search
const FOOD_ALIASES: Record<string, string[]> = {
  "huevo-entero": ["huevo", "huevos", "huevo entero", "huevos enteros"],
  "clara-huevo": ["clara", "claras", "clara de huevo", "claras de huevo"],
  "whey-protein": ["whey", "proteina", "suero", "scoop", "batido"],
  "caseina": ["caseina", "casein"],
  "pollo-pechuga": ["pollo", "pechuga", "pechugas"],
  "pollo-muslo": ["muslo", "muslos"],
  "carne-magra": ["carne", "bife", "lomo vacuno"],
  "carne-molida": ["carne molida", "picada"],
  "arroz-blanco": ["arroz blanco", "arroz"],
  "arroz-integral": ["arroz integral"],
  "avena": ["avena", "avena instantanea"],
  "boniato": ["boniato", "batata", "camote"],
  "pan-integral": ["pan integral", "pan negro", "pan"],
  "pan-blanco": ["pan blanco", "pan de molde"],
  "galleta-arroz": ["galleta", "galletas", "galleta de arroz", "galletas de arroz"],
  "aceite-oliva": ["aceite", "aceite de oliva", "oliva"],
  "aceite-coco": ["aceite de coco", "coco aceite"],
  "banana": ["banana", "bananas", "platano", "platanos"],
  "manzana": ["manzana", "manzanas"],
  "naranja": ["naranja", "naranjas"],
  "palta": ["palta", "aguacate", "avocado"],
  "tomate": ["tomate", "tomates"],
  "mani": ["mani", "mantequilla de mani", "pasta de mani"],
  "fideos": ["fideos", "pasta", "pastas", "espagueti", "spaghetti"],
  "yogurt-descremado": ["yogurt", "yogur", "yoghurt"],
  "yogurt-griego": ["yogurt griego", "yogur griego", "griego"],
  "leche-descremada": ["leche", "leche descremada"],
  "queso-cottage": ["cottage", "queso cottage"],
  "salmon": ["salmon", "salmón"],
  "atun": ["atun", "atún"],
  "merluza": ["merluza"],
  "tortilla-trigo": ["tortilla", "tortillas", "wrap", "wraps"],
  "semillas-chia": ["chia", "chía", "semillas de chia"],
  "semillas-lino": ["lino", "linaza", "semillas de lino"],
  "morron": ["morron", "morrón", "pimiento", "pimientos"],
  "frutilla": ["frutilla", "frutillas", "fresa", "fresas"],
  "lentejas": ["lentejas", "lenteja"],
  "garbanzos": ["garbanzos", "garbanzo"],
};

function normalizeSearch(term: string): string {
  return term.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove accents
    .trim();
}

function searchFoods(term: string): FoodItem[] {
  if (!term || term.length < 1) return [];
  const normalized = normalizeSearch(term);

  // Score each food
  const scored = FOOD_DATABASE.map(f => {
    const nameNorm = normalizeSearch(f.name);
    const idNorm = f.id.toLowerCase();
    let score = 0;

    // Exact name match
    if (nameNorm === normalized) score = 100;
    // Name starts with search
    else if (nameNorm.startsWith(normalized)) score = 80;
    // Name contains search
    else if (nameNorm.includes(normalized)) score = 60;
    // ID contains search
    else if (idNorm.includes(normalized)) score = 50;
    // Alias match
    else {
      const aliases = FOOD_ALIASES[f.id];
      if (aliases?.some(a => normalizeSearch(a).includes(normalized) || normalized.includes(normalizeSearch(a)))) {
        score = 70;
      }
    }

    // Singular/plural: strip trailing 's' and retry
    if (score === 0 && normalized.endsWith("s")) {
      const singular = normalized.slice(0, -1);
      if (nameNorm.includes(singular) || idNorm.includes(singular)) score = 40;
    }
    // Or add 's' and retry
    if (score === 0) {
      const plural = normalized + "s";
      if (nameNorm.includes(plural)) score = 35;
    }

    return { food: f, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(s => s.food);
}

// ====================== FOOD ROW COMPONENT ======================
function FoodRow({
  food,
  onSelect,
  onQuantityChange,
  onToggleUnit,
  onRemove,
}: {
  food: EditorFood;
  onSelect: (f: FoodItem) => void;
  onQuantityChange: (qty: number) => void;
  onToggleUnit: () => void;
  onRemove: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredFoods = searchFoods(searchTerm);

  const handleSelect = (f: FoodItem) => {
    onSelect(f);
    setSearchTerm("");
    setShowDropdown(false);
  };

  // Check if this food CAN use units (exists in DB with unit type)
  const dbFood = food.foodId ? FOOD_DATABASE.find(f => f.id === food.foodId) : null;
  const canUseUnits = dbFood ? isUnitBasedFood(dbFood) : false;
  const step = food.isUnitBased ? 0.5 : 5;
  const gpu = canUseUnits && dbFood ? getGramsPerUnit(dbFood.unit) : 0;

  return (
    <div className="mb-3">
      {food.name ? (
        /* ===== SELECTED FOOD ===== */
        <div className="bg-card-bg border border-card-border rounded-xl p-3">
          {/* Row 1: Name + remove */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => { onSelect({ id: "", name: "", category: "protein", calories: 0, protein: 0, carbs: 0, fat: 0, unit: "g", mealTypes: [], maxGrams: 0 } as FoodItem); }}
              className="text-sm text-white font-medium hover:text-primary transition-colors flex items-center gap-1.5"
              title="Cambiar alimento"
            >
              <span className="text-primary">&#8226;</span>
              {food.name}
              <span className="text-muted text-xs">&#x270E;</span>
            </button>
            <button onClick={onRemove} className="text-muted hover:text-danger p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Row 2: Quantity + unit toggle */}
          <div className="flex items-center gap-2 mb-2">
            {/* Quantity controls */}
            <button
              onClick={() => onQuantityChange(Math.max(step, food.quantity - step))}
              className="w-7 h-7 rounded-lg bg-background border border-card-border text-muted hover:text-white hover:border-primary/50 text-sm flex items-center justify-center transition-colors"
            >−</button>
            <input
              type="number"
              value={food.quantity}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) onQuantityChange(v);
              }}
              step={step}
              min={step}
              className="w-16 bg-background border border-card-border rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => onQuantityChange(food.quantity + step)}
              className="w-7 h-7 rounded-lg bg-background border border-card-border text-muted hover:text-white hover:border-primary/50 text-sm flex items-center justify-center transition-colors"
            >+</button>

            {/* Unit toggle — only for foods that support units */}
            {canUseUnits ? (
              <div className="flex rounded-lg border border-card-border overflow-hidden ml-1">
                <button
                  onClick={() => { if (!food.isUnitBased) onToggleUnit(); }}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    food.isUnitBased
                      ? "bg-primary text-black"
                      : "bg-background text-muted hover:text-white"
                  }`}
                >
                  {getUnitLabel(dbFood!.unit, 2)}
                </button>
                <button
                  onClick={() => { if (food.isUnitBased) onToggleUnit(); }}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    !food.isUnitBased
                      ? "bg-primary text-black"
                      : "bg-background text-muted hover:text-white"
                  }`}
                >
                  gramos
                </button>
              </div>
            ) : (
              <span className="text-xs text-muted ml-1">gramos</span>
            )}

            {/* Show equivalent */}
            {canUseUnits && gpu > 0 && (
              <span className="text-[10px] text-muted ml-auto">
                {food.isUnitBased
                  ? `= ${food.grams}g`
                  : `= ${(food.grams / gpu).toFixed(1)} ${getUnitLabel(dbFood!.unit, food.grams / gpu)}`
                }
              </span>
            )}
          </div>

          {/* Row 3: Macros */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-white font-bold">{food.calories} cal</span>
            <span className="text-blue-400">{food.protein}P</span>
            <span className="text-amber-400">{food.carbs}C</span>
            <span className="text-rose-400">{food.fat}G</span>
          </div>
        </div>
      ) : (
        /* ===== FOOD SEARCH ===== */
        <div className="flex items-center gap-2">
          <span className="text-primary text-sm shrink-0">&#8226;</span>
          <div className="flex-1 relative">
            <input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
              onFocus={() => { if (searchTerm.length >= 1) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              placeholder="Buscar alimento... (ej: pollo, arroz, huevo)"
            />
            {showDropdown && filteredFoods.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-card-border rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto">
                {filteredFoods.map(f => {
                  const hasUnits = isUnitBasedFood(f);
                  const unitLabel = hasUnits ? f.unit.split("(")[0].trim() : "";
                  const gpuInfo = hasUnits ? f.unit.match(/\((\d+)\s*g\)/) : null;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleSelect(f)}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary/10 text-sm flex items-center justify-between border-b border-card-border/30 last:border-0"
                    >
                      <div>
                        <span className="text-white">{f.name}</span>
                        <span className="text-[10px] text-muted ml-2">
                          {f.calories} cal/100g
                        </span>
                      </div>
                      {hasUnits && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0 ml-2">
                          {unitLabel} {gpuInfo ? `(${gpuInfo[1]}g)` : ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button onClick={onRemove} className="text-muted hover:text-danger shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const EMPTY_EXERCISE: TrainingExercise = {
  exerciseId: "", name: "", sets: 4, reps: "10", rest: "60s", notes: "", method: "",
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const EMPTY_MEAL: Meal = { name: "", time: "", foods: [{ ...EMPTY_EDITOR_FOOD }] };

const OBJECTIVE_OPTIONS = [
  { value: "ganancia-muscular", label: "Ganancia Muscular" },
  { value: "quema-grasa", label: "Quema Grasa" },
  { value: "tonificacion", label: "Tonificación" },
  { value: "fuerza-funcional", label: "Fuerza Funcional" },
  { value: "principiante-total", label: "Principiante Total" },
  { value: "recomposicion-corporal", label: "Recomposición Corporal" },
  { value: "rendimiento-deportivo", label: "Rendimiento Deportivo" },
  { value: "post-parto", label: "Post-Parto" },
  { value: "entrenamiento-casa", label: "Entrenamiento en Casa" },
];

const EMPHASIS_OPTIONS = [
  { value: "ninguno", label: "Equilibrado", desc: "Todas las zonas por igual" },
  { value: "pecho", label: "Pecho", desc: "Pecho y brazos" },
  { value: "espalda", label: "Espalda", desc: "Espalda y hombros" },
  { value: "piernas", label: "Piernas", desc: "Piernas y glúteos" },
  { value: "abdomen", label: "Abdomen", desc: "Core y abdominales" },
  { value: "tren-superior", label: "Tren Superior", desc: "Pecho, espalda, brazos" },
  { value: "tren-inferior", label: "Tren Inferior", desc: "Piernas, glúteos, core" },
];

export default function PlanEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  const [tab, setTab] = useState<"entrenamiento" | "nutricion">("entrenamiento");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Training state
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([
    { day: "Lunes", exercises: [{ ...EMPTY_EXERCISE }], instructions: "" },
  ]);

  // Plan generation config (loaded from survey)
  const [objective, setObjective] = useState("ganancia-muscular");
  const [emphasis, setEmphasis] = useState("ninguno");
  const [clientWeight, setClientWeight] = useState(70);
  const [clientSex, setClientSex] = useState("hombre");
  const [clientActivityLevel, setClientActivityLevel] = useState("moderado");
  const [regenerating, setRegenerating] = useState(false);

  // Nutrition state
  const [meals, setMeals] = useState<Meal[]>([
    { name: "DESAYUNO", time: "07:00", foods: [{ ...EMPTY_EDITOR_FOOD }] },
    { name: "COMIDA 2", time: "10:00", foods: [{ ...EMPTY_EDITOR_FOOD }] },
    { name: "COMIDA 3", time: "13:00", foods: [{ ...EMPTY_EDITOR_FOOD }] },
    { name: "COMIDA 4", time: "16:00", foods: [{ ...EMPTY_EDITOR_FOOD }] },
    { name: "COMIDA 5", time: "19:00", foods: [{ ...EMPTY_EDITOR_FOOD }] },
    { name: "COMIDA 6", time: "21:00", foods: [{ ...EMPTY_EDITOR_FOOD }] },
  ]);
  const [nutritionNotes, setNutritionNotes] = useState<string[]>([
    "COMER CADA 3 HORAS",
    "TOMAR 3 LITROS DE AGUA AL DÍA",
    "NO AZÚCAR, ENDULZAR CON EDULCORANTE",
    "NO ALCOHOL",
  ]);

  // Version history state
  interface PlanVersion {
    id: string;
    plan_type: string;
    version_number: number;
    created_at: string;
  }
  interface PlanVersionFull extends PlanVersion {
    data: Record<string, unknown>;
    important_notes?: string[];
  }
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<PlanVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<PlanVersionFull | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadVersionHistory = async () => {
    setLoadingVersions(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const planType = tab === "entrenamiento" ? "training" : "nutrition";
      const res = await fetch(
        `/api/admin/plan-versions?clientId=${clientId}&type=${planType}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        setVersions(json.versions || []);
      }
    } catch {
      // Silent fail
    }
    setLoadingVersions(false);
  };

  const loadVersionPreview = async (versionId: string) => {
    setLoadingPreview(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch(
        `/api/admin/plan-versions?clientId=${clientId}&versionId=${versionId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        setPreviewVersion(json.version);
      }
    } catch {
      // Silent fail
    }
    setLoadingPreview(false);
  };

  const restoreVersion = (version: PlanVersionFull) => {
    const planType = version.plan_type;
    if (planType === "training" && version.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const days = (version.data as any).days || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = days.map((day: any) => ({
        day: day.day || "",
        instructions: day.instructions || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exercises: (day.exercises || []).map((ex: any) => ({
          exerciseId: ex.exerciseId || ex.id || "",
          name: ex.name || "",
          sets: ex.sets || 4,
          reps: ex.reps || "10",
          rest: ex.rest || "60s",
          notes: ex.notes || "",
          method: ex.method || "",
        })),
      }));
      setTrainingDays(normalized);
      setTab("entrenamiento");
    } else if (planType === "nutrition" && version.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vMeals = (version.data as any).meals || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadedMeals: Meal[] = vMeals.map((m: any) => {
        const foodDetails = m.foodDetails || [];
        const foodStrings = m.foods || [];
        const foods: EditorFood[] = foodDetails.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? foodDetails.map((fd: any, i: number) => parseFoodToEditor(foodStrings[i] || "", fd))
          : foodStrings.length > 0
            ? foodStrings.map((f: string) => parseFoodToEditor(f))
            : [{ ...EMPTY_EDITOR_FOOD }];
        return { name: m.name || "", time: m.time || "", foods };
      });
      setMeals(loadedMeals);
      if (version.important_notes?.length) {
        setNutritionNotes(version.important_notes);
      }
      setTab("nutricion");
    }
    setPreviewVersion(null);
    setShowHistory(false);
  };

  // Load existing plans on mount
  const [loadingPlan, setLoadingPlan] = useState(true);
  useEffect(() => {
    const loadExisting = async () => {
      try {
        // Load plans via server-side API (bypasses RLS)
        const { data: { session } } = await supabase.auth.getSession();
        let trainingData = null;
        let nutritionData = null;

        if (session?.access_token) {
          const res = await fetch(`/api/admin/client-plans?clientId=${clientId}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const plans = await res.json();
            trainingData = plans.trainingPlan;
            nutritionData = plans.nutritionPlan;
            // Load survey config for plan generation
            if (plans.survey) {
              if (plans.survey.objective) setObjective(plans.survey.objective);
              if (plans.survey.emphasis) setEmphasis(plans.survey.emphasis);
              if (plans.survey.weight) setClientWeight(Number(plans.survey.weight));
              if (plans.survey.sex) setClientSex(plans.survey.sex);
              if (plans.survey.activity_level) setClientActivityLevel(plans.survey.activity_level);
            }
          }
        }

        if (trainingData && trainingData.data?.days?.length > 0) {
          // Normalize: the generator/client uses `id`, the editor uses `exerciseId`
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const normalized = trainingData.data.days.map((day: any) => ({
            day: day.day || "",
            instructions: day.instructions || "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            exercises: (day.exercises || []).map((ex: any) => ({
              exerciseId: ex.exerciseId || ex.id || "",
              name: ex.name || "",
              sets: ex.sets || 4,
              reps: ex.reps || "10",
              rest: ex.rest || "60s",
              notes: ex.notes || "",
              method: ex.method || "",
            })),
          }));
          setTrainingDays(normalized);
        }

        if (nutritionData && nutritionData.data?.meals?.length > 0) {
          // Convert meals: parse into EditorFood objects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedMeals: Meal[] = nutritionData.data.meals.map((m: any) => {
            const foodDetails = m.foodDetails || [];
            const foodStrings = m.foods || [];
            const foods: EditorFood[] = foodDetails.length > 0
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? foodDetails.map((fd: any, i: number) => parseFoodToEditor(foodStrings[i] || "", fd))
              : foodStrings.length > 0
                ? foodStrings.map((f: string) => parseFoodToEditor(f))
                : [{ ...EMPTY_EDITOR_FOOD }];
            return { name: m.name || "", time: m.time || "", foods };
          });
          setMeals(loadedMeals);
        }

        if (nutritionData && nutritionData.important_notes?.length > 0) {
          setNutritionNotes(nutritionData.important_notes);
        } else if (nutritionData && nutritionData.data?.importantNotes?.length > 0) {
          setNutritionNotes(nutritionData.data.importantNotes);
        }
      } catch {
        // Keep defaults if load fails
      }
      setLoadingPlan(false);
    };
    loadExisting();
  }, [clientId]);

  // Training handlers
  const addDay = () => {
    const usedDays = trainingDays.map(d => d.day);
    const nextDay = DAYS.find(d => !usedDays.includes(d)) || `Día ${trainingDays.length + 1}`;
    setTrainingDays([...trainingDays, { day: nextDay, exercises: [{ ...EMPTY_EXERCISE }], instructions: "" }]);
  };

  const removeDay = (dayIdx: number) => {
    setTrainingDays(trainingDays.filter((_, i) => i !== dayIdx));
  };

  const updateDay = (dayIdx: number, field: "day" | "instructions", value: string) => {
    const updated = [...trainingDays];
    updated[dayIdx][field] = value;
    setTrainingDays(updated);
  };

  const addExercise = (dayIdx: number) => {
    const updated = [...trainingDays];
    updated[dayIdx].exercises.push({ ...EMPTY_EXERCISE });
    setTrainingDays(updated);
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    const updated = [...trainingDays];
    updated[dayIdx].exercises = updated[dayIdx].exercises.filter((_, i) => i !== exIdx);
    setTrainingDays(updated);
  };

  // Detect muscle groups from exercises and build day label + instructions
  const MUSCLE_LABELS: Record<string, string> = {
    pecho: "Pecho", espalda: "Espalda", piernas: "Piernas",
    hombros: "Hombros", biceps: "Bíceps", triceps: "Tríceps", abdomen: "Abdomen",
    cardio: "Cardio",
  };

  function buildDayLabel(dayIdx: number, exercises: TrainingExercise[]): string {
    const groups: string[] = [];
    for (const ex of exercises) {
      const found = EXERCISES.find(e => e.id === ex.exerciseId);
      if (found?.muscleGroup && !groups.includes(found.muscleGroup)) {
        groups.push(found.muscleGroup);
      }
    }
    if (groups.length === 0) return DAYS[dayIdx] || `Día ${dayIdx + 1}`;
    const labels = groups.map(g => MUSCLE_LABELS[g] || g).join(" y ");
    return `${DAYS[dayIdx] || `Día ${dayIdx + 1}`} - ${labels}`;
  }

  function buildDayInstructions(exercises: TrainingExercise[]): string {
    const groups: string[] = [];
    for (const ex of exercises) {
      const found = EXERCISES.find(e => e.id === ex.exerciseId);
      if (found?.muscleGroup && !groups.includes(found.muscleGroup)) {
        groups.push(found.muscleGroup);
      }
    }
    if (groups.length === 0) return "";
    const labels = groups.map(g => MUSCLE_LABELS[g] || g).join(", ");
    const focus = `Enfoque: ${labels}.`;
    // Add objective-based tip
    switch (objective) {
      case "ganancia-muscular":
        return `${focus} Fase excentrica lenta (2-3s). Peso moderado-alto.`;
      case "quema-grasa":
      case "recomposicion-corporal":
        return `${focus} Ritmo alto, descansos cortos. Mantener frecuencia cardiaca elevada.`;
      case "fuerza-funcional":
      case "competicion":
      case "rendimiento-deportivo":
        return `${focus} Peso alto. Tecnica perfecta. Descanso completo.`;
      case "tonificacion":
      case "post-parto":
        return `${focus} Peso moderado. Movimientos controlados.`;
      case "principiante-total":
        return `${focus} Peso liviano, aprender tecnica. Aumentar gradualmente.`;
      default:
        return `${focus} Peso moderado. Buena tecnica.`;
    }
  }

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof TrainingExercise, value: string | number) => {
    const updated = [...trainingDays];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[dayIdx].exercises[exIdx] as any)[field] = value;
    if (field === "exerciseId") {
      const ex = EXERCISES.find(e => e.id === value);
      if (ex) updated[dayIdx].exercises[exIdx].name = ex.name;
      // Auto-update day name and instructions based on muscle groups
      updated[dayIdx].day = buildDayLabel(dayIdx, updated[dayIdx].exercises);
      updated[dayIdx].instructions = buildDayInstructions(updated[dayIdx].exercises);
    }
    setTrainingDays(updated);
  };

  // Nutrition handlers
  const addMeal = () => {
    setMeals([...meals, { name: `COMIDA ${meals.length + 1}`, time: "", foods: [{ ...EMPTY_EDITOR_FOOD }] }]);
  };

  const removeMeal = (idx: number) => {
    setMeals(meals.filter((_, i) => i !== idx));
  };

  const updateMeal = (idx: number, field: "name" | "time", value: string) => {
    const updated = [...meals];
    updated[idx][field] = value;
    setMeals(updated);
  };

  const addFood = (mealIdx: number) => {
    const updated = [...meals];
    updated[mealIdx].foods.push({ ...EMPTY_EDITOR_FOOD });
    setMeals(updated);
  };

  const selectFood = (mealIdx: number, foodIdx: number, food: FoodItem) => {
    const updated = [...meals];
    if (!food.id) {
      // Reset to empty (change food)
      updated[mealIdx].foods[foodIdx] = { ...EMPTY_EDITOR_FOOD };
    } else {
      const ef = makeEditorFood(food, food.unit === "g" ? 100 : getGramsPerUnit(food.unit) || 100);
      updated[mealIdx].foods[foodIdx] = ef;
    }
    setMeals(updated);
  };

  const updateFoodQuantity = (mealIdx: number, foodIdx: number, qty: number) => {
    const updated = [...meals];
    const f = { ...updated[mealIdx].foods[foodIdx] };
    f.quantity = qty;
    if (f.isUnitBased) {
      const gpu = getGramsPerUnit(f.unit);
      f.grams = Math.round(qty * gpu);
    } else {
      f.grams = qty;
    }
    const dbFood = findFoodByName(f.name);
    if (dbFood) {
      const macros = calculateFoodMacros(dbFood, f.grams);
      f.calories = macros.calories;
      f.protein = macros.protein;
      f.carbs = macros.carbs;
      f.fat = macros.fat;
    }
    updated[mealIdx].foods[foodIdx] = f;
    setMeals(updated);
  };

  const toggleFoodUnit = (mealIdx: number, foodIdx: number) => {
    const updated = [...meals];
    const f = { ...updated[mealIdx].foods[foodIdx] };
    const dbFood = f.foodId ? FOOD_DATABASE.find(fd => fd.id === f.foodId) : null;
    if (!dbFood) return;
    const gpu = getGramsPerUnit(dbFood.unit);
    if (!gpu) return;

    if (f.isUnitBased) {
      // Switching to grams: keep current grams, set quantity = grams
      f.isUnitBased = false;
      f.quantity = f.grams;
    } else {
      // Switching to units: convert grams to units
      f.isUnitBased = true;
      f.quantity = Math.max(0.5, Math.round(f.grams / gpu * 2) / 2);
      f.grams = Math.round(f.quantity * gpu);
      // Recalculate macros with snapped grams
      const macros = calculateFoodMacros(dbFood, f.grams);
      f.calories = macros.calories;
      f.protein = macros.protein;
      f.carbs = macros.carbs;
      f.fat = macros.fat;
    }
    updated[mealIdx].foods[foodIdx] = f;
    setMeals(updated);
  };

  const removeFood = (mealIdx: number, foodIdx: number) => {
    const updated = [...meals];
    updated[mealIdx].foods = updated[mealIdx].foods.filter((_, i) => i !== foodIdx);
    setMeals(updated);
  };

  const addNote = () => setNutritionNotes([...nutritionNotes, ""]);
  const updateNote = (idx: number, value: string) => {
    const updated = [...nutritionNotes];
    updated[idx] = value;
    setNutritionNotes(updated);
  };
  const removeNote = (idx: number) => setNutritionNotes(nutritionNotes.filter((_, i) => i !== idx));

  // Regenerate training plan from config
  const handleRegenerate = () => {
    setRegenerating(true);
    try {
      const numDays = trainingDays.length || 5;
      const generated = generateTrainingPlan(numDays, objective, emphasis, clientWeight, clientSex, clientActivityLevel);
      // Map generated format (id) to editor format (exerciseId).
      // Ya NO pegamos el texto largo del metodo en `notes` — lo guardamos como
      // `method` para que Pablo elija desde el dropdown. El cliente solo ve un
      // badge corto segun el metodo, nunca parrafos automaticos.
      const mapped: TrainingDay[] = generated.map(day => ({
        day: day.day,
        instructions: day.instructions || "",
        exercises: day.exercises.map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          notes: "", // <-- dejar vacio; Pablo escribe lo que quiera
          method: ex.method && ex.method !== "standard" ? ex.method : "",
        })),
      }));
      setTrainingDays(mapped);
    } finally {
      setRegenerating(false);
    }
  };

  // Save via server-side API (bypasses RLS)
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSaveError("Sesion expirada. Recarga la pagina.");
        setSaving(false);
        return;
      }

      const isTraining = tab === "entrenamiento";
      const res = await fetch("/api/save-plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          type: isTraining ? "training" : "nutrition",
          data: isTraining
            ? {
                days: trainingDays.map(day => ({
                  day: day.day,
                  instructions: day.instructions,
                  exercises: day.exercises.map(ex => ({
                    id: ex.exerciseId,
                    name: ex.name,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest: ex.rest,
                    notes: ex.notes || "",
                    method: ex.method || "",
                  })),
                })),
              }
            : { meals: buildMealsForSave(meals), importantNotes: nutritionNotes },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        setSaveError(err.error || "Error al guardar");
        setSaving(false);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(`Error inesperado: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link href={`/admin/clientes/${clientId}`} className="inline-flex items-center gap-2 text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver al cliente
      </Link>

      <h1 className="text-2xl font-black mb-2">Editor de Plan</h1>
      <p className="text-muted mb-6">{loadingPlan ? "Cargando plan existente..." : "Editá el plan personalizado para este cliente"}</p>

      {loadingPlan && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!loadingPlan && (<>
      {/* Rest of editor renders only after plan loads */}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("entrenamiento")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            tab === "entrenamiento" ? "gradient-primary text-black" : "glass-card text-muted hover:text-white"
          }`}
        >
          <Dumbbell className="h-4 w-4" /> Entrenamiento
        </button>
        <button
          onClick={() => setTab("nutricion")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            tab === "nutricion" ? "gradient-primary text-black" : "glass-card text-muted hover:text-white"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" /> Nutrición
        </button>
        <div className="flex-1" />
        <button
          onClick={() => { setShowHistory(true); loadVersionHistory(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm glass-card text-muted hover:text-white hover:border-primary/50 transition-all"
        >
          <History className="h-4 w-4" /> Historial
        </button>
      </div>

      {/* Version History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowHistory(false); setPreviewVersion(null); }}>
          <div className="bg-[#111] border border-card-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-card-border">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Historial de Versiones — {tab === "entrenamiento" ? "Entrenamiento" : "Nutricion"}
              </h2>
              <button onClick={() => { setShowHistory(false); setPreviewVersion(null); }} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-muted text-center py-8">No hay versiones anteriores guardadas todavia. Se guardaran automaticamente cada vez que edites y guardes un plan.</p>
              ) : previewVersion ? (
                /* Preview a specific version */
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPreviewVersion(null)} className="text-muted hover:text-white text-sm flex items-center gap-1">
                      <ArrowLeft className="h-3 w-3" /> Volver a la lista
                    </button>
                    <span className="text-xs text-muted">
                      Version {previewVersion.version_number} — {new Date(previewVersion.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {previewVersion.plan_type === "nutrition" && (previewVersion.data as { meals?: { name: string; foods?: string[]; foodDetails?: { name: string; grams: number; unit: string }[]; approxCalories?: number; approxProtein?: number; approxCarbs?: number; approxFats?: number }[] }).meals?.map((meal: { name: string; foods?: string[]; foodDetails?: { name: string; grams: number; unit: string }[]; approxCalories?: number; approxProtein?: number; approxCarbs?: number; approxFats?: number }, mi: number) => (
                    <div key={mi} className="glass-card rounded-xl p-3">
                      <p className="font-bold text-sm text-primary mb-1">{meal.name}</p>
                      {meal.approxCalories != null && (
                        <p className="text-xs text-muted mb-2">{meal.approxCalories} cal | {meal.approxProtein}P | {meal.approxCarbs}C | {meal.approxFats}G</p>
                      )}
                      <ul className="text-sm text-white/80 space-y-0.5">
                        {(meal.foodDetails && meal.foodDetails.length > 0
                          ? meal.foodDetails.map((fd: { name: string; grams: number; unit: string }) => formatFoodQuantity(fd.name, fd.grams, fd.unit))
                          : meal.foods || []
                        ).map((f: string, fi: number) => (
                          <li key={fi}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {previewVersion.plan_type === "training" && (previewVersion.data as { days?: { day: string; exercises?: { name: string; sets: number; reps: string; rest: string }[] }[] }).days?.map((day: { day: string; exercises?: { name: string; sets: number; reps: string; rest: string }[] }, di: number) => (
                    <div key={di} className="glass-card rounded-xl p-3">
                      <p className="font-bold text-sm text-primary mb-2">{day.day}</p>
                      <ul className="text-sm text-white/80 space-y-0.5">
                        {day.exercises?.map((ex: { name: string; sets: number; reps: string; rest: string }, ei: number) => (
                          <li key={ei}>• {ex.name} — {ex.sets}x{ex.reps} (desc: {ex.rest})</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <button
                    onClick={() => restoreVersion(previewVersion)}
                    className="w-full gradient-primary text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <RotateCcw className="h-4 w-4" /> Restaurar esta version
                  </button>
                  <p className="text-xs text-muted text-center">Esto cargara la version en el editor. Despues tenes que darle Guardar para aplicar los cambios.</p>
                </div>
              ) : (
                /* Version list */
                <div className="space-y-2">
                  {versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => loadVersionPreview(v.id)}
                      className="w-full glass-card rounded-xl p-3 hover:border-primary/50 transition-all text-left flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        v{v.version_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Version {v.version_number}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(v.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-muted rotate-180" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TRAINING EDITOR */}
      {tab === "entrenamiento" && (
        <div className="space-y-6">
          {/* Config panel */}
          <div className="glass-card rounded-2xl p-4 border-l-4 border-primary">
            <p className="font-bold text-primary text-sm mb-3">CONFIGURACION DEL PLAN</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Objetivo</label>
                <select
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {OBJECTIVE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Enfasis muscular</label>
                <select
                  value={emphasis}
                  onChange={(e) => setEmphasis(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                >
                  {EMPHASIS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {regenerating
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generando...</>
                : <><RefreshCw className="h-4 w-4" /> Regenerar Entrenamiento</>
              }
            </button>
            <p className="text-xs text-muted mt-2 text-center">Regenera todos los ejercicios segun el objetivo y enfasis. Podes ajustar manualmente despues.</p>
          </div>

          {trainingDays.map((day, dayIdx) => (
            <div key={dayIdx} className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-card-border flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted" />
                <input
                  value={day.day}
                  onChange={(e) => updateDay(dayIdx, "day", e.target.value)}
                  className="flex-1 bg-transparent font-bold focus:outline-none focus:border-b focus:border-primary"
                  placeholder="Nombre del día (ej: Lunes - Pecho y Tríceps)"
                />
                <button onClick={() => removeDay(dayIdx)} className="text-muted hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {day.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="flex flex-col gap-2 bg-card-bg rounded-xl p-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={ex.exerciseId}
                        onChange={(e) => updateExercise(dayIdx, exIdx, "exerciseId", e.target.value)}
                        className="flex-1 min-w-[200px] bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="">Seleccionar ejercicio...</option>
                        {EXERCISES.map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                        ))}
                      </select>
                      <input
                        value={ex.sets}
                        onChange={(e) => updateExercise(dayIdx, exIdx, "sets", Number(e.target.value))}
                        type="number"
                        min={1}
                        className="w-16 bg-background border border-card-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-primary"
                        placeholder="Sets"
                      />
                      <span className="text-xs text-muted">x</span>
                      <input
                        value={ex.reps}
                        onChange={(e) => updateExercise(dayIdx, exIdx, "reps", e.target.value)}
                        className="w-20 bg-background border border-card-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-primary"
                        placeholder="Reps"
                      />
                      <input
                        value={ex.rest}
                        onChange={(e) => updateExercise(dayIdx, exIdx, "rest", e.target.value)}
                        className="w-20 bg-background border border-card-border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-primary"
                        placeholder="Desc."
                      />
                      <button onClick={() => removeExercise(dayIdx, exIdx)} className="text-muted hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Buscador de GIF externo — solo visible si el ejercicio esta seleccionado */}
                    {ex.exerciseId && ex.name && (
                      <div className="flex items-center gap-2 -mt-1">
                        <ExerciseGifPicker exerciseId={ex.exerciseId} exerciseName={ex.name} />
                        <span className="text-[10px] text-muted">Buscá un GIF externo si el actual no te convence.</span>
                      </div>
                    )}

                    {/* Metodo opcional + nota personal. Solo se muestran al cliente si tienen valor. */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={ex.method || ""}
                        onChange={(e) => updateExercise(dayIdx, exIdx, "method", e.target.value)}
                        className="min-w-[140px] bg-background border border-card-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                        title="Método de entrenamiento (opcional)"
                      >
                        {METHOD_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <input
                        value={ex.notes || ""}
                        onChange={(e) => updateExercise(dayIdx, exIdx, "notes", e.target.value)}
                        className="flex-1 min-w-[150px] bg-background border border-card-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                        placeholder="Nota personal (opcional) — ej: cuidar rodillas"
                        maxLength={200}
                      />
                      {ex.method && METHOD_TEMPLATES[ex.method] && (
                        <button
                          type="button"
                          onClick={() => updateExercise(dayIdx, exIdx, "notes", METHOD_TEMPLATES[ex.method || ""] || "")}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors font-semibold whitespace-nowrap"
                          title="Insertar la plantilla del método en la nota"
                        >
                          📋 Usar plantilla
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addExercise(dayIdx)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Agregar ejercicio
                </button>
              </div>

              <div className="px-4 pb-4">
                <input
                  value={day.instructions}
                  onChange={(e) => updateDay(dayIdx, "instructions", e.target.value)}
                  className="w-full bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="Instrucciones del día (ej: Circuito sin descanso, 4 vueltas...)"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addDay}
            className="w-full border-2 border-dashed border-card-border rounded-2xl p-4 text-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" /> Agregar Día de Entrenamiento
          </button>
        </div>
      )}

      {/* NUTRITION EDITOR */}
      {tab === "nutricion" && (
        <div className="space-y-6">
          {/* Important Notes */}
          <div className="glass-card rounded-2xl p-4 border-l-4 border-warning">
            <p className="font-bold text-warning text-sm mb-3">NOTAS IMPORTANTES</p>
            {nutritionNotes.map((note, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  value={note}
                  onChange={(e) => updateNote(idx, e.target.value)}
                  className="flex-1 bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  placeholder="Nota importante..."
                />
                <button onClick={() => removeNote(idx)} className="text-muted hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={addNote} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
              <Plus className="h-3 w-3" /> Agregar nota
            </button>
          </div>

          {/* Meals */}
          {meals.map((meal, mealIdx) => {
            const mealTotals = meal.foods.reduce(
              (acc, f) => ({ cal: acc.cal + f.calories, p: acc.p + f.protein, c: acc.c + f.carbs, f: acc.f + f.fat }),
              { cal: 0, p: 0, c: 0, f: 0 },
            );
            return (
            <div key={mealIdx} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-1">
                <input
                  value={meal.name}
                  onChange={(e) => updateMeal(mealIdx, "name", e.target.value)}
                  className="flex-1 bg-transparent font-bold text-primary focus:outline-none"
                  placeholder="NOMBRE COMIDA"
                />
                <input
                  type="time"
                  value={meal.time}
                  onChange={(e) => updateMeal(mealIdx, "time", e.target.value)}
                  className="bg-card-bg border border-card-border rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={() => removeMeal(mealIdx)} className="text-muted hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {/* Meal totals */}
              {mealTotals.cal > 0 && (
                <p className="text-xs text-muted mb-3 ml-1">
                  {mealTotals.cal} cal &middot; {mealTotals.p}P &middot; {mealTotals.c}C &middot; {mealTotals.f}G
                </p>
              )}
              {meal.foods.map((food, foodIdx) => (
                <FoodRow
                  key={foodIdx}
                  food={food}
                  onSelect={(f) => selectFood(mealIdx, foodIdx, f)}
                  onQuantityChange={(qty) => updateFoodQuantity(mealIdx, foodIdx, qty)}
                  onToggleUnit={() => toggleFoodUnit(mealIdx, foodIdx)}
                  onRemove={() => removeFood(mealIdx, foodIdx)}
                />
              ))}
              <button onClick={() => addFood(mealIdx)} className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                <Plus className="h-3 w-3" /> Agregar alimento
              </button>
            </div>
          );})}

          {/* Day totals */}
          {(() => {
            const dayTotals = meals.reduce(
              (acc, m) => {
                m.foods.forEach(f => {
                  acc.cal += f.calories; acc.p += f.protein; acc.c += f.carbs; acc.f += f.fat;
                });
                return acc;
              },
              { cal: 0, p: 0, c: 0, f: 0 },
            );
            return dayTotals.cal > 0 ? (
              <div className="glass-card rounded-2xl p-4 border-l-4 border-primary">
                <p className="font-bold text-primary text-sm mb-1">TOTALES DEL DIA</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{dayTotals.cal}</p>
                    <p className="text-xs text-muted">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{dayTotals.p}g</p>
                    <p className="text-xs text-muted">Proteina</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{dayTotals.c}g</p>
                    <p className="text-xs text-muted">Carbos</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{dayTotals.f}g</p>
                    <p className="text-xs text-muted">Grasas</p>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          <button
            onClick={addMeal}
            className="w-full border-2 border-dashed border-card-border rounded-2xl p-4 text-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" /> Agregar Comida
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="sticky bottom-4 mt-8">
        {saveError && (
          <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 mb-3">
            <p className="text-sm text-danger font-mono">{saveError}</p>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
            saved
              ? "bg-primary text-black"
              : "gradient-primary text-black hover:opacity-90"
          } disabled:opacity-50`}
        >
          {saved ? (
            <><Check className="h-5 w-5" /> Guardado!</>
          ) : saving ? (
            "Guardando..."
          ) : (
            <><Save className="h-5 w-5" /> Guardar {tab === "entrenamiento" ? "Entrenamiento" : "Nutrición"}</>
          )}
        </button>
      </div>
    </>)}
    </div>
  );
}
