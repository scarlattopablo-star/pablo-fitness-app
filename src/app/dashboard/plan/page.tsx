"use client";

import { useState, useEffect } from "react";
import { Dumbbell, UtensilsCrossed, Info, Play, X, Loader2, Target, Save, Check, Edit3, RefreshCw } from "lucide-react";
import { getExerciseById, getVideoUrl } from "@/lib/exercises-data";
import { generateMealPlan, type MealPlanMeal } from "@/lib/generate-meal-plan";
import { generateTrainingPlan, type TrainingDay } from "@/lib/generate-training-plan";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SubscriptionExpiredBanner } from "@/components/subscription-expired";
import { OfflineBanner } from "@/components/offline-banner";
import { cacheData, getCachedData } from "@/lib/offline-cache";
import { FoodSwapModal } from "@/components/food-swap-modal";

const OBJECTIVE_LABELS: Record<string, string> = {
  "quema-grasa": "Quema Grasa",
  "ganancia-muscular": "Ganancia Muscular",
  "tonificacion": "Tonificacion",
  "principiante-total": "Principiante Total",
  "rendimiento-deportivo": "Rendimiento Deportivo",
  "post-parto": "Post-Parto",
  "fuerza-funcional": "Fuerza Funcional",
  "recomposicion-corporal": "Recomposicion Corporal",
  "plan-pareja": "Plan Pareja",
  "competicion": "Competicion",
  "direct-client": "Plan Personalizado",
};


export default function PlanPage() {
  const { user, subscription, isExpired } = useAuth();
  const [tab, setTab] = useState<"entrenamiento" | "nutricion">("entrenamiento");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<{ meals: MealPlanMeal[]; importantNotes: string[] } | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [objective, setObjective] = useState("");
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { weight: number; reps: number }>>({});
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [savingLog, setSavingLog] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{
    mealIndex: number;
    foodIndex: number;
    food: { name: string; grams: number; unit: string; calories: number; protein: number; carbs: number; fat: number };
    mealName: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadMacros();
      loadExerciseLogs();
    }
  }, [user]);

  const loadExerciseLogs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("exercise_logs")
      .select("exercise_id, sets_data, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (data) {
      const latest: Record<string, { weight: number; reps: number }> = {};
      data.forEach(log => {
        if (!latest[log.exercise_id] && log.sets_data?.length > 0) {
          const maxSet = log.sets_data.reduce((best: { weight: number; reps: number }, s: { weight: number; reps: number }) =>
            s.weight > best.weight ? s : best, log.sets_data[0]);
          latest[log.exercise_id] = { weight: maxSet.weight, reps: maxSet.reps };
        }
      });
      setExerciseLogs(latest);
    }
  };

  const saveExerciseLog = async (exerciseId: string, exerciseName: string) => {
    if (!user || !editWeight) return;
    setSavingLog(true);
    await supabase.from("exercise_logs").insert({
      user_id: user.id,
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      sets_data: [{ set: 1, weight: Number(editWeight), reps: Number(editReps) || 10 }],
    });
    setExerciseLogs(prev => ({ ...prev, [exerciseId]: { weight: Number(editWeight), reps: Number(editReps) || 10 } }));
    setEditingExercise(null);
    setEditWeight("");
    setEditReps("");
    setSavingLog(false);
  };

  const handleSwap = async (newFoodId: string) => {
    if (!swapTarget || !user) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (!refreshed.session?.access_token) return;
    }
    const accessToken = token || (await supabase.auth.getSession()).data.session?.access_token;
    if (!accessToken) return;

    const res = await fetch("/api/swap-food", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mealIndex: swapTarget.mealIndex,
        foodIndex: swapTarget.foodIndex,
        newFoodId,
      }),
    });

    if (res.ok && mealPlan) {
      const { meal: updatedMeal } = await res.json();
      const updatedMeals = [...mealPlan.meals];
      updatedMeals[swapTarget.mealIndex] = updatedMeal;
      const updated = { ...mealPlan, meals: updatedMeals };
      setMealPlan(updated);
      cacheData("nutrition_plan", updated);
    }
    setSwapTarget(null);
  };

  const loadMacros = async () => {
    if (!user) return;

    try {
      // Load survey data for macros display
      const { data } = await supabase
        .from("surveys")
        .select("target_calories, protein, carbs, fats, objective, training_days, wake_hour, sleep_hour")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && data.target_calories) {
        setMacros({ calories: data.target_calories, protein: data.protein, carbs: data.carbs, fats: data.fats });
        setObjective(data.objective || "");
        cacheData("survey", data);
      } else {
        setMacros({ calories: 2100, protein: 150, carbs: 220, fats: 70 });
      }

      // Try to load plans from DB first (admin-edited or auto-generated)
      const { data: dbTraining } = await supabase
        .from("training_plans")
        .select("data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: dbNutrition } = await supabase
        .from("nutrition_plans")
        .select("data, important_notes")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbTraining && dbTraining.data?.days?.length > 0) {
        setTrainingPlan(dbTraining.data.days);
        cacheData("training_plan", dbTraining.data.days);
      } else if (data) {
        const generated = generateTrainingPlan(data.training_days || 5, data.objective || "quema-grasa");
        setTrainingPlan(generated);
        cacheData("training_plan", generated);
      } else {
        setTrainingPlan(generateTrainingPlan(5));
      }

      if (dbNutrition && dbNutrition.data?.meals?.length > 0) {
        const mealData = {
          meals: dbNutrition.data.meals,
          importantNotes: dbNutrition.important_notes || dbNutrition.data.importantNotes || [],
        };
        setMealPlan(mealData);
        cacheData("nutrition_plan", mealData);
      } else if (data) {
        const generated = generateMealPlan(data.target_calories, data.protein, data.carbs, data.fats, data.wake_hour || 7, data.sleep_hour || 23);
        setMealPlan(generated);
        cacheData("nutrition_plan", generated);
      } else {
        setMealPlan(generateMealPlan(2100, 150, 220, 70));
      }
    } catch {
      // Offline fallback - load from cache
      const cachedSurvey = getCachedData<{ target_calories: number; protein: number; carbs: number; fats: number; objective: string }>("survey");
      if (cachedSurvey) {
        setMacros({ calories: cachedSurvey.target_calories, protein: cachedSurvey.protein, carbs: cachedSurvey.carbs, fats: cachedSurvey.fats });
        setObjective(cachedSurvey.objective || "");
      }
      const cachedTraining = getCachedData<TrainingDay[]>("training_plan");
      if (cachedTraining) setTrainingPlan(cachedTraining);
      const cachedNutrition = getCachedData<{ meals: MealPlanMeal[]; importantNotes: string[] }>("nutrition_plan");
      if (cachedNutrition) setMealPlan(cachedNutrition);
    }

    setLoading(false);
  };

  const exerciseDetail = selectedExercise ? getExerciseById(selectedExercise) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isExpired) return <SubscriptionExpiredBanner />;

  const planName = subscription?.plan_name || OBJECTIVE_LABELS[objective] || "Plan Personalizado";

  return (
    <div>
      <OfflineBanner />
      {/* Plan Header */}
      <div className="glass-card rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Target className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="text-xs text-primary font-bold tracking-wider">MI PLAN</p>
            <h1 className="text-xl font-black">{planName}</h1>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card-bg rounded-lg p-2 text-center">
            <p className="text-lg font-black text-primary">{macros.calories.toLocaleString()}</p>
            <p className="text-[9px] text-muted">KCAL/DIA</p>
          </div>
          <div className="bg-card-bg rounded-lg p-2 text-center">
            <p className="text-lg font-black text-red-400">{macros.protein}g</p>
            <p className="text-[9px] text-muted">PROTEINAS</p>
          </div>
          <div className="bg-card-bg rounded-lg p-2 text-center">
            <p className="text-lg font-black text-yellow-400">{macros.carbs}g</p>
            <p className="text-[9px] text-muted">CARBOS</p>
          </div>
          <div className="bg-card-bg rounded-lg p-2 text-center">
            <p className="text-lg font-black text-blue-400">{macros.fats}g</p>
            <p className="text-[9px] text-muted">GRASAS</p>
          </div>
        </div>
      </div>

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
      </div>

      {/* TRAINING */}
      {tab === "entrenamiento" && (
        <div className="space-y-4">
          {trainingPlan.map((day) => (
            <div key={day.day} className="glass-card rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-card-border">
                <h3 className="font-bold">{day.day}</h3>
                {day.instructions && <p className="text-xs text-muted mt-1">{day.instructions}</p>}
              </div>
              <div className="divide-y divide-card-border/30">
                {day.exercises.map((ex, i) => {
                  const log = exerciseLogs[ex.id];
                  const isEditing = editingExercise === `${day.day}-${ex.id}`;
                  return (
                    <div key={i} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ex.name}</p>
                          <p className="text-xs text-muted">{ex.sets} series x {ex.reps} | Descanso: {ex.rest}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {log && !isEditing ? (
                            <button
                              onClick={() => { setEditingExercise(`${day.day}-${ex.id}`); setEditWeight(String(log.weight)); setEditReps(String(log.reps)); }}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-bold flex items-center gap-1"
                            >
                              {log.weight}kg <Edit3 className="h-3 w-3" />
                            </button>
                          ) : !isEditing ? (
                            <button
                              onClick={() => { setEditingExercise(`${day.day}-${ex.id}`); setEditWeight(""); setEditReps("10"); }}
                              className="text-xs bg-card-border text-muted px-2 py-1 rounded-lg flex items-center gap-1 hover:text-primary"
                            >
                              + Peso
                            </button>
                          ) : null}
                          <button onClick={() => setSelectedExercise(ex.id)} className="text-primary">
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-2">
                          <input type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)}
                            placeholder="Peso (kg)" className="w-20 bg-card-bg border border-card-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                          <span className="text-xs text-muted">x</span>
                          <input type="number" value={editReps} onChange={e => setEditReps(e.target.value)}
                            placeholder="Reps" className="w-16 bg-card-bg border border-card-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary" />
                          <button onClick={() => saveExerciseLog(ex.id, ex.name)} disabled={savingLog || !editWeight}
                            className="gradient-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                            {savingLog ? "..." : "OK"}
                          </button>
                          <button onClick={() => setEditingExercise(null)} className="text-muted text-xs">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NUTRITION */}
      {tab === "nutricion" && mealPlan && (
        <div>
          <div className="glass-card rounded-2xl p-4 mb-4 border-l-4 border-warning">
            <p className="font-bold text-warning text-sm mb-1">IMPORTANTE</p>
            <ul className="space-y-1">
              {mealPlan.importantNotes.map((note) => (
                <li key={note} className="text-sm text-muted">{note}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {mealPlan.meals.map((meal, mealIdx) => {
              const hasFoodDetails = meal.foodDetails && meal.foodDetails.length > 0;
              return (
                <div key={meal.name} className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        {meal.time && <span className="text-xs text-primary font-bold">{meal.time} — </span>}
                        <span className="font-bold">{meal.name}</span>
                      </div>
                      <span className="text-xs text-primary font-semibold">{meal.approxCalories} kcal</span>
                    </div>
                    <ul className="space-y-1.5 mb-3">
                      {hasFoodDetails
                        ? meal.foodDetails.map((fd: { name: string; grams: number; unit: string; calories: number; protein: number; carbs: number; fat: number }, i: number) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <span className="text-primary shrink-0">&#8226;</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-muted">{fd.grams}g {fd.name}</span>
                                <span className="text-[10px] text-muted/60 ml-1">({fd.calories}kcal)</span>
                              </div>
                              <button
                                onClick={() => setSwapTarget({ mealIndex: mealIdx, foodIndex: i, food: fd, mealName: meal.name })}
                                className="shrink-0 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Cambiar alimento"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))
                        : meal.foods.map((food: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-0.5">&#8226;</span>
                              <span className="text-muted">{food}</span>
                            </li>
                          ))}
                    </ul>
                    <div className="flex gap-2 pt-2 border-t border-card-border/30">
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded">P: {meal.approxProtein}g</span>
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">C: {meal.approxCarbs}g</span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">G: {meal.approxFats}g</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Food Swap Modal */}
      {swapTarget && (
        <FoodSwapModal
          mealName={swapTarget.mealName}
          currentFood={swapTarget.food}
          onSwap={handleSwap}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* Exercise Detail Modal */}
      {exerciseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedExercise(null)}>
          <div className="glass-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{exerciseDetail.name}</h3>
              <button onClick={() => setSelectedExercise(null)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <span className="inline-block text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize mb-4">
              {exerciseDetail.muscleGroup}
            </span>
            <p className="text-sm text-muted mb-4">{exerciseDetail.description}</p>
            <a href={getVideoUrl(exerciseDetail)} target="_blank" rel="noopener noreferrer"
              className="bg-card-bg rounded-xl p-4 mb-4 flex items-center gap-3 hover:bg-white/5 transition-colors">
              <Play className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Ver Video Demostrativo</p>
                <p className="text-xs text-muted">Ejecución correcta paso a paso</p>
              </div>
            </a>
            <h4 className="font-bold text-sm mb-3">Paso a Paso</h4>
            <ol className="space-y-2">
              {exerciseDetail.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
