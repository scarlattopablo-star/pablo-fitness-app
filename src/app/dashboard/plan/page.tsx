"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Dumbbell, UtensilsCrossed, Info, Play, X, Loader2, Target, Save, Check, RefreshCw } from "lucide-react";
import { getExerciseById, getVideoUrl } from "@/lib/exercises-data";
import { getExerciseGif } from "@/lib/exercise-images";
import { generateMealPlan, type MealPlanMeal } from "@/lib/generate-meal-plan";
import { generateTrainingPlan, type TrainingDay } from "@/lib/generate-training-plan";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SubscriptionExpiredBanner } from "@/components/subscription-expired";
import { OfflineBanner } from "@/components/offline-banner";
import { cacheData, getCachedData } from "@/lib/offline-cache";
import { FoodSwapModal } from "@/components/food-swap-modal";
import { findFoodByName, calculateFoodMacros } from "@/lib/food-database";
import { PLANS } from "@/lib/plans-data";
import { ArrowLeft } from "lucide-react";

// Build foodDetails from food strings when plan was created by admin without structured data
function enrichMealWithFoodDetails(meal: MealPlanMeal): MealPlanMeal {
  if (meal.foodDetails && meal.foodDetails.length > 0) return meal;

  const foodDetails: MealPlanMeal["foodDetails"] = [];
  for (const foodStr of meal.foods) {
    // Try to parse patterns like "150g pollo", "2 Huevo entero", "100g arroz integral"
    const gramsMatch = foodStr.match(/^(\d+)\s*g\s+(.+)/i);
    const unitsMatch = foodStr.match(/^(\d+)\s+(.+)/i);

    let name = foodStr;
    let grams = 100;

    if (gramsMatch) {
      grams = parseInt(gramsMatch[1]);
      name = gramsMatch[2];
    } else if (unitsMatch) {
      name = unitsMatch[2];
    }

    const dbFood = findFoodByName(name);
    if (dbFood) {
      const macros = calculateFoodMacros(dbFood, grams);
      foodDetails.push({
        name: dbFood.name,
        grams,
        unit: dbFood.unit,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      });
    } else {
      // Can't resolve - keep as placeholder without swap capability
      foodDetails.push({
        name: foodStr,
        grams: 0,
        unit: "g",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    }
  }

  const totals = foodDetails.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    ...meal,
    foodDetails,
    approxCalories: meal.approxCalories || Math.round(totals.calories),
    approxProtein: meal.approxProtein || Math.round(totals.protein * 10) / 10,
    approxCarbs: meal.approxCarbs || Math.round(totals.carbs * 10) / 10,
    approxFats: meal.approxFats || Math.round(totals.fat * 10) / 10,
  };
}

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


function PlanContent() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("v") === "entrenamiento" || searchParams.get("v") === "nutricion")
    ? searchParams.get("v") as "entrenamiento" | "nutricion"
    : "overview";
  const { user, subscription, isExpired, hasActiveSubscription } = useAuth();
  const [view, setView] = useState<"overview" | "entrenamiento" | "nutricion">(initialView);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<{ meals: MealPlanMeal[]; importantNotes: string[] } | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [objective, setObjective] = useState("");
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { weight: number; reps: number; date: string; prevWeight?: number }>>({});
  const [activeSession, setActiveSession] = useState<string | null>(null); // day name
  const [sessionData, setSessionData] = useState<Record<string, { set: number; weight: number; reps: number }[]>>({});
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [hasSurvey, setHasSurvey] = useState(true);
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
      const latest: Record<string, { weight: number; reps: number; date: string; prevWeight?: number }> = {};
      data.forEach(log => {
        if (!log.sets_data?.length) return;
        const maxSet = log.sets_data.reduce(
          (best: { weight: number; reps: number }, s: { weight: number; reps: number }) =>
            s.weight > best.weight ? s : best,
          log.sets_data[0]
        );
        if (!latest[log.exercise_id]) {
          latest[log.exercise_id] = { weight: maxSet.weight, reps: maxSet.reps, date: log.date };
        } else if (!latest[log.exercise_id].prevWeight) {
          latest[log.exercise_id].prevWeight = maxSet.weight;
        }
      });
      setExerciseLogs(latest);
    }
  };

  const startSession = (dayName: string, exercises: { id: string; sets: number | string; reps: string | number }[]) => {
    const data: Record<string, { set: number; weight: number; reps: number }[]> = {};
    exercises.forEach(ex => {
      const numSets = parseInt(String(ex.sets)) || 4;
      const lastWeight = exerciseLogs[ex.id]?.weight || 0;
      const lastReps = exerciseLogs[ex.id]?.reps || parseInt(String(ex.reps)) || 10;
      data[ex.id] = Array.from({ length: numSets }, (_, i) => ({
        set: i + 1,
        weight: lastWeight,
        reps: lastReps,
      }));
    });
    setSessionData(data);
    setActiveSession(dayName);
    setSessionSaved(false);
  };

  const updateSessionSet = (exId: string, setIdx: number, field: "weight" | "reps", value: number) => {
    setSessionData(prev => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => i === setIdx ? { ...s, [field]: value } : s),
    }));
  };

  const saveSession = async (exercises: { id: string; name: string }[]) => {
    if (!user) return;
    setSavingSession(true);

    for (const ex of exercises) {
      const sets = sessionData[ex.id];
      if (!sets) continue;
      const validSets = sets.filter(s => s.weight > 0);
      if (validSets.length === 0) continue;

      await supabase.from("exercise_logs").insert({
        user_id: user.id,
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets_data: validSets,
      });

      const maxSet = validSets.reduce((best, s) => s.weight > best.weight ? s : best, validSets[0]);
      const prevWeight = exerciseLogs[ex.id]?.weight;
      setExerciseLogs(prev => ({
        ...prev,
        [ex.id]: { weight: maxSet.weight, reps: maxSet.reps, date: new Date().toISOString(), prevWeight },
      }));
    }

    setSavingSession(false);
    setSessionSaved(true);
    setTimeout(() => {
      setActiveSession(null);
      setSessionData({});
      setSessionSaved(false);
    }, 1500);
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
        .select("target_calories, protein, carbs, fats, objective, training_days, wake_hour, sleep_hour, emphasis")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && data.target_calories) {
        setMacros({ calories: data.target_calories, protein: data.protein, carbs: data.carbs, fats: data.fats });
        setObjective(data.objective || "");
        setHasSurvey(true);
        cacheData("survey", data);
      } else {
        setHasSurvey(false);
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
        const emphasis = data.emphasis || "ninguno";
        const generated = generateTrainingPlan(data.training_days || 5, data.objective || "quema-grasa", emphasis);
        setTrainingPlan(generated);
        cacheData("training_plan", generated);
      } else {
        setHasSurvey(false);
        setTrainingPlan(generateTrainingPlan(5));
      }

      if (dbNutrition && dbNutrition.data?.meals?.length > 0) {
        const enrichedMeals = dbNutrition.data.meals.map((m: MealPlanMeal) => enrichMealWithFoodDetails(m));
        const mealData = {
          meals: enrichedMeals,
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

  if (!hasActiveSubscription) return <SubscriptionExpiredBanner />;

  const planName = subscription?.plan_name || OBJECTIVE_LABELS[objective] || "Plan Personalizado";
  const planData = PLANS.find(p => p.slug === objective);
  const planDescription = planData?.description || "Tu plan personalizado diseñado para alcanzar tus objetivos de forma efectiva y sostenible.";

  return (
    <div>
      <OfflineBanner />

      {/* Survey warning */}
      {!hasSurvey && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-500">Encuesta pendiente</p>
            <p className="text-xs text-muted mt-1">Para poder generar tu plan personalizado de entrenamiento y nutricion necesitas completar la encuesta. Los planes que ves ahora son genericos.</p>
            <a href="/encuesta-directa" className="text-xs text-primary font-bold mt-2 inline-block hover:underline">Completar encuesta →</a>
          </div>
        </div>
      )}

      {/* OVERVIEW */}
      {view === "overview" && (
        <div>
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
            <p className="text-sm text-muted mb-4">{planDescription}</p>
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

          {/* Plan Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setView("entrenamiento")}
              className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Plan de Entrenamiento</p>
                <p className="text-xs text-muted mt-0.5">{trainingPlan.length} dias de entrenamiento</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted rotate-180" />
            </button>

            <button
              onClick={() => setView("nutricion")}
              className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold">Plan de Nutricion</p>
                <p className="text-xs text-muted mt-0.5">{mealPlan?.meals.length || 0} comidas diarias</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-muted rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* TRAINING */}
      {view === "entrenamiento" && (
        <div>
          <button
            onClick={() => setView("overview")}
            className="flex items-center gap-2 text-muted hover:text-white mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mi plan
          </button>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Plan de Entrenamiento
          </h2>
          <div className="space-y-4">
            {trainingPlan.map((day) => {
              const isSession = activeSession === day.day;
              return (
                <div key={day.day} className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-card-border flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{day.day}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {day.instructions && <p className="text-xs text-muted">{day.instructions}</p>}
                        {day.estimatedCalories && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            ~{day.estimatedCalories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                    {!isSession && (
                      <button
                        onClick={() => startSession(day.day, day.exercises)}
                        className="gradient-primary text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                      >
                        <Dumbbell className="h-3.5 w-3.5" /> Iniciar sesion
                      </button>
                    )}
                  </div>

                  {/* Normal view: exercise list with last weight */}
                  {!isSession && (
                    <div className="divide-y divide-card-border/30">
                      {day.exercises.map((ex, i) => {
                        const log = exerciseLogs[ex.id];
                        const weightDiff = log?.prevWeight != null ? log.weight - log.prevWeight : null;
                        const exGif = getExerciseGif(ex.id);
                        return (
                          <div key={i} className="p-3 flex items-center gap-3">
                            {exGif && (
                              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10">
                                <img src={exGif} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ex.name}</p>
                              <p className="text-xs text-muted">{ex.sets} series x {ex.reps} | Descanso: {ex.rest}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {log ? (
                                <div className="flex items-center gap-1.5">
                                  {weightDiff !== null && weightDiff !== 0 && (
                                    <span className={`text-[10px] font-bold ${weightDiff > 0 ? "text-primary" : "text-danger"}`}>
                                      {weightDiff > 0 ? "+" : ""}{weightDiff}kg
                                    </span>
                                  )}
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-bold">
                                    {log.weight}kg
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted">Sin registro</span>
                              )}
                              <button onClick={() => setSelectedExercise(ex.id)} className="text-primary">
                                <Info className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Session mode: all exercises with weight inputs */}
                  {isSession && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs text-primary font-bold">SESION EN CURSO</p>
                      </div>
                      <div className="space-y-4">
                        {day.exercises.map((ex, i) => {
                          const log = exerciseLogs[ex.id];
                          const sets = sessionData[ex.id] || [];
                          return (
                            <div key={i} className="bg-card-bg rounded-xl p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-bold text-sm">{ex.name}</p>
                                  <p className="text-[10px] text-muted">{ex.sets}x{ex.reps} | {ex.rest}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {log && (
                                    <span className="text-[10px] text-muted">Anterior: {log.weight}kg</span>
                                  )}
                                  <button onClick={() => setSelectedExercise(ex.id)} className="text-primary">
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                {sets.map((s, si) => (
                                  <div key={si} className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted w-5 shrink-0">S{s.set}</span>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={s.weight || ""}
                                      onChange={e => updateSessionSet(ex.id, si, "weight", Number(e.target.value))}
                                      placeholder="kg"
                                      className="flex-1 bg-background border border-card-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary"
                                    />
                                    <span className="text-[10px] text-muted">x</span>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={s.reps || ""}
                                      onChange={e => updateSessionSet(ex.id, si, "reps", Number(e.target.value))}
                                      placeholder="reps"
                                      className="w-14 bg-background border border-card-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => saveSession(day.exercises.map(ex => ({ id: ex.id, name: ex.name })))}
                          disabled={savingSession}
                          className="flex-1 gradient-primary text-black font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {sessionSaved ? (
                            <><Check className="h-5 w-5" /> Sesion guardada!</>
                          ) : savingSession ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
                          ) : (
                            <><Save className="h-5 w-5" /> Guardar sesion</>
                          )}
                        </button>
                        <button
                          onClick={() => { setActiveSession(null); setSessionData({}); }}
                          className="px-4 py-3 text-muted text-sm rounded-xl hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NUTRITION */}
      {view === "nutricion" && mealPlan && (
        <div>
          <button
            onClick={() => setView("overview")}
            className="flex items-center gap-2 text-muted hover:text-white mb-4 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mi plan
          </button>
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Plan de Nutricion
          </h2>
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
                        ? meal.foodDetails.map((fd: { name: string; grams: number; unit: string; calories: number; protein: number; carbs: number; fat: number }, i: number) => {
                            const canSwap = fd.grams > 0 && fd.calories > 0;
                            return (
                              <li key={i} className="text-sm flex items-center gap-2">
                                <span className="text-primary shrink-0">&#8226;</span>
                                <div className="flex-1 min-w-0">
                                  <span className="text-muted">
                                    {fd.grams > 0 ? `${fd.grams}g ` : ""}{fd.name}
                                  </span>
                                  {fd.calories > 0 && (
                                    <span className="text-[10px] text-muted/60 ml-1">({fd.calories}kcal)</span>
                                  )}
                                </div>
                                {canSwap && (
                                  <button
                                    onClick={() => setSwapTarget({ mealIndex: mealIdx, foodIndex: i, food: fd, mealName: meal.name })}
                                    className="shrink-0 p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Cambiar alimento"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </li>
                            );
                          })
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

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>}>
      <PlanContent />
    </Suspense>
  );
}
