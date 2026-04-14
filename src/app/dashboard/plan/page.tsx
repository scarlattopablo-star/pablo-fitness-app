"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Dumbbell, UtensilsCrossed, Info, Play, X, Loader2, Target, Save, Check, RefreshCw, ChefHat, Clock } from "lucide-react";
import RestTimer from "@/components/rest-timer";
import { suggestRecipe, type Recipe } from "@/lib/recipes-database";
import { RatLoader } from "@/components/rat-loader";
import { getExerciseById, getVideoUrl } from "@/lib/exercises-data";
import { getExerciseGif } from "@/lib/exercise-images";
import { generateMealPlan, type MealPlanMeal } from "@/lib/generate-meal-plan";
import { generateTrainingPlan, type TrainingDay } from "@/lib/generate-training-plan";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SubscriptionExpiredBanner } from "@/components/subscription-expired";
import { OfflineBanner } from "@/components/offline-banner";
import { cacheData, getCachedData } from "@/lib/offline-cache";
import dynamic from "next/dynamic";
const FoodSwapModal = dynamic(() => import("@/components/food-swap-modal").then(m => m.FoodSwapModal));
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
    approxProtein: meal.approxProtein || Math.round(totals.protein),
    approxCarbs: meal.approxCarbs || Math.round(totals.carbs),
    approxFats: meal.approxFats || Math.round(totals.fat),
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
  "kitesurf": "Kitesurf Performance",
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
  const [kitesurfMealPlans, setKitesurfMealPlans] = useState<{ gymDay: { meals: MealPlanMeal[]; importantNotes: string[] }; kitesurfDay: { meals: MealPlanMeal[]; importantNotes: string[] } } | null>(null);
  const [kiteDayType, setKiteDayType] = useState<"gym" | "kitesurf">("gym");
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [objective, setObjective] = useState("");
  const [nutritionalGoal, setNutritionalGoal] = useState("");
  const [tdee, setTdee] = useState(0);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { weight: number; reps: number; date: string; prevWeight?: number }>>({});
  const [activeSession, setActiveSession] = useState<string | null>(() => {
    try { return JSON.parse(localStorage.getItem("active_session_day") || "null"); } catch { return null; }
  });
  const [sessionData, setSessionData] = useState<Record<string, { set: number; weight: number; reps: number; completed?: boolean }[]>>(() => {
    try { return JSON.parse(localStorage.getItem("active_session_data") || "{}"); } catch { return {}; }
  });
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Persist session data to localStorage so it survives navigation and app close
  useEffect(() => {
    if (activeSession && Object.keys(sessionData).length > 0) {
      localStorage.setItem("active_session_day", JSON.stringify(activeSession));
      localStorage.setItem("active_session_data", JSON.stringify(sessionData));
    }
  }, [activeSession, sessionData]);
  const [hasSurvey, setHasSurvey] = useState(true);
  const [planPending, setPlanPending] = useState(false);
  const [expandedGif, setExpandedGif] = useState<{ src: string; name: string } | null>(null);
  const [recipeModal, setRecipeModal] = useState<Recipe | null>(null);
  const [swapTarget, setSwapTarget] = useState<{
    mealIndex: number;
    foodIndex: number;
    food: { name: string; grams: number; unit: string; calories: number; protein: number; carbs: number; fat: number };
    mealName: string;
  } | null>(null);
  const [planUpdatedBanner, setPlanUpdatedBanner] = useState(false);

  useEffect(() => {
    if (user) {
      loadMacros();
      loadExerciseLogs();
    }
  }, [user]);

  // Realtime subscription: re-fetch when admin updates plans
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('plan-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'training_plans', filter: `user_id=eq.${user.id}` },
        () => { loadMacros(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'nutrition_plans', filter: `user_id=eq.${user.id}` },
        () => { loadMacros(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'training_plans', filter: `user_id=eq.${user.id}` },
        () => { loadMacros(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nutrition_plans', filter: `user_id=eq.${user.id}` },
        () => { loadMacros(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Rest timer state
  const [restTimer, setRestTimer] = useState<{ exerciseId: string; seconds: number } | null>(null);

  const startSession = (dayName: string, exercises: { id: string; sets: number | string; reps: string | number }[]) => {
    const data: Record<string, { set: number; weight: number; reps: number; completed: boolean }[]> = {};
    exercises.forEach(ex => {
      const numSets = parseInt(String(ex.sets)) || 4;
      const lastWeight = exerciseLogs[ex.id]?.weight || 0;
      const lastReps = exerciseLogs[ex.id]?.reps || parseInt(String(ex.reps)) || 10;
      data[ex.id] = Array.from({ length: numSets }, (_, i) => ({
        set: i + 1,
        weight: lastWeight,
        reps: lastReps,
        completed: false,
      }));
    });
    setSessionData(data);
    setActiveSession(dayName);
    setSessionSaved(false);
    setRestTimer(null);
  };

  const toggleSetComplete = (exId: string, setIdx: number, restTime: string) => {
    const current = sessionData[exId];
    if (!current) return;

    const wasCompleted = current[setIdx]?.completed;
    const updated = current.map((s, i) =>
      i === setIdx ? { ...s, completed: !s.completed } : s
    );

    setSessionData(prev => ({ ...prev, [exId]: updated }));

    // If marking as complete (not unchecking), start rest timer
    if (!wasCompleted) {
      const allDone = updated.every(s => s.completed);
      if (!allDone) {
        // Parse rest time (e.g. "90s", "3min", "60s", "2-3min")
        let secs = 60;
        const cleaned = restTime.replace(/[^0-9mins]/g, "");
        if (cleaned.includes("min")) secs = (parseInt(cleaned) || 2) * 60;
        else secs = parseInt(cleaned) || 60;
        setRestTimer({ exerciseId: exId, seconds: secs });
      } else {
        setRestTimer(null);
      }
    }
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

    // Send push notification
    import("@/lib/push-notifications").then(({ sendPushNotification }) => {
      const msgs = [
        "Tremendo! Otra sesion completada. Segui asi!",
        "Bien ahi! Entrenamiento registrado. Cada dia cuenta!",
        "Sesion registrada! Sos imparable!",
        "Excelente! Los resultados se construyen dia a dia.",
      ];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      sendPushNotification(user.id, "Entrenamiento registrado!", msg, "/dashboard/plan");
    }).catch(() => {});

    // Record gamification: XP + streak + achievements + toast
    fetch("/api/gamification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, action: "session_logged" }),
    }).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json();
      const { triggerAchievementToast } = await import("@/components/achievement-toast");
      if (data.levelUp) {
        const { triggerCelebration } = await import("@/components/celebration");
        triggerCelebration("levelup");
        triggerAchievementToast({ icon: "⚡", title: `Nivel ${data.newLevel}!`, subtitle: `+${data.xpGained} XP`, type: "levelup" });
      } else if (data.newAchievements?.length > 0) {
        triggerAchievementToast({ icon: "🏆", title: "Nuevo logro!", subtitle: `+${data.xpGained} XP`, type: "badge" });
      }
    }).catch(() => {});

    // Trigger celebration animation
    import("@/components/celebration").then(({ triggerCelebration }) => {
      triggerCelebration("workout");
    }).catch(() => {});

    setSavingSession(false);
    setSessionSaved(true);
    // Clear persisted session data after successful save
    localStorage.removeItem("active_session_day");
    localStorage.removeItem("active_session_data");
    setTimeout(() => {
      setActiveSession(null);
      setSessionData({});
      setSessionSaved(false);
    }, 1500);
  };

  const handleSwap = async (newFoodId: string) => {
    if (!swapTarget || !user) return;

    // Get a valid access token, refreshing if needed
    let accessToken: string | undefined;
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;
    if (!accessToken) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      accessToken = refreshed.session?.access_token;
    }
    if (!accessToken) {
      alert("Sesion expirada. Recarga la pagina e intenta de nuevo.");
      setSwapTarget(null);
      return;
    }

    try {
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        alert(`Error al cambiar alimento: ${err.error || "intenta de nuevo"}`);
        setSwapTarget(null);
        return;
      }

      await res.json(); // consume response

      // Always reload the full plan from database to ensure UI is in sync
      await loadMacros();
    } catch {
      alert("Error de conexion. Verifica tu internet e intenta de nuevo.");
    }
    setSwapTarget(null);
  };

  const loadMacros = async () => {
    if (!user) return;

    try {
      // Load all data in parallel
      const [surveyRes, trainingRes, nutritionRes] = await Promise.all([
        supabase.from("surveys")
          .select("target_calories, protein, carbs, fats, objective, nutritional_goal, training_days, wake_hour, sleep_hour, emphasis, sex, activity_level, tdee")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("training_plans")
          .select("data, plan_approved")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("nutrition_plans")
          .select("data, important_notes, plan_approved")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const data = surveyRes.data;
      const dbTraining = trainingRes.data;
      const dbNutrition = nutritionRes.data;

      if (data && data.target_calories) {
        setMacros({ calories: data.target_calories, protein: data.protein, carbs: data.carbs, fats: data.fats });
        setObjective(data.objective || "");
        setNutritionalGoal(data.nutritional_goal || "");
        setTdee(data.tdee || 0);
        setHasSurvey(true);
        cacheData("survey", data);
      } else {
        setHasSurvey(false);
        setMacros({ calories: 2100, protein: 150, carbs: 220, fats: 70 });
      }

      // Check if plan exists but is pending admin approval
      if (dbTraining && dbTraining.data?.days?.length > 0 && dbTraining.plan_approved === false) {
        setPlanPending(true);
        setLoading(false);
        return;
      }

      // Check if admin updated the plan since last client visit
      const trainingUpdated = dbTraining?.data?.admin_updated_at;
      const nutritionUpdated = dbNutrition?.data?.admin_updated_at;
      const latestUpdate = trainingUpdated && nutritionUpdated
        ? (trainingUpdated > nutritionUpdated ? trainingUpdated : nutritionUpdated)
        : trainingUpdated || nutritionUpdated;
      if (latestUpdate) {
        const lastSeen = localStorage.getItem(`plan_seen_${user.id}`);
        if (!lastSeen || lastSeen < latestUpdate) {
          setPlanUpdatedBanner(true);
        }
        localStorage.setItem(`plan_seen_${user.id}`, new Date().toISOString());
      }

      if (dbTraining && dbTraining.data?.days?.length > 0) {
        setTrainingPlan(dbTraining.data.days);
        cacheData("training_plan", dbTraining.data.days);
      } else if (data) {
        const emphasis = data.emphasis || "ninguno";
        const userSex = data.sex || "hombre";
        const actLevel = data.activity_level || "moderado";
        const generated = generateTrainingPlan(data.training_days || 5, data.objective || "quema-grasa", emphasis, 70, userSex, actLevel);
        setTrainingPlan(generated);
        cacheData("training_plan", generated);
      } else {
        setHasSurvey(false);
        setTrainingPlan(generateTrainingPlan(5));
      }

      if (dbNutrition && dbNutrition.data?.gymDay && dbNutrition.data?.kitesurfDay && dbNutrition.plan_approved !== false) {
        // Kitesurf dual nutrition format
        const enrichGym = dbNutrition.data.gymDay.meals.map((m: MealPlanMeal) => enrichMealWithFoodDetails(m));
        const enrichKite = dbNutrition.data.kitesurfDay.meals.map((m: MealPlanMeal) => enrichMealWithFoodDetails(m));
        const dual = {
          gymDay: { meals: enrichGym, importantNotes: dbNutrition.data.gymDay.importantNotes || [] },
          kitesurfDay: { meals: enrichKite, importantNotes: dbNutrition.data.kitesurfDay.importantNotes || [] },
        };
        setKitesurfMealPlans(dual);
        setMealPlan(dual.gymDay); // default to gym day
        cacheData("nutrition_plan", dual.gymDay);
      } else if (dbNutrition && dbNutrition.data?.meals?.length > 0 && dbNutrition.plan_approved !== false) {
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
      const cachedSurvey = getCachedData<{ target_calories: number; protein: number; carbs: number; fats: number; objective: string; nutritional_goal?: string; tdee?: number }>("survey");
      if (cachedSurvey) {
        setMacros({ calories: cachedSurvey.target_calories, protein: cachedSurvey.protein, carbs: cachedSurvey.carbs, fats: cachedSurvey.fats });
        setObjective(cachedSurvey.objective || "");
        setNutritionalGoal(cachedSurvey.nutritional_goal || "");
        setTdee(cachedSurvey.tdee || 0);
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
        <RatLoader size={64} />
      </div>
    );
  }

  if (!hasActiveSubscription) return <SubscriptionExpiredBanner />;

  if (planPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-6">
          <Dumbbell className="h-8 w-8 text-black" />
        </div>
        <RatLoader size={64} className="mb-6" />
        <h2 className="text-xl font-black mb-2">Pablo Scarlatto tu entrenador esta creando tu rutina</h2>
        <p className="text-muted text-sm max-w-sm">Pronto tendras tu plan personalizado de entrenamiento y nutricion. Te notificaremos cuando este listo.</p>
      </div>
    );
  }

  const planName = subscription?.plan_name || OBJECTIVE_LABELS[objective] || "Plan Personalizado";
  const planData = PLANS.find(p => p.slug === objective);
  const planDescription = planData?.description || "Tu plan personalizado diseñado para alcanzar tus objetivos de forma efectiva y sostenible.";

  return (
    <div>
      <OfflineBanner />

      {/* Plan updated banner */}
      {planUpdatedBanner && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4 flex items-start gap-3 relative">
          <RefreshCw className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-primary">Tu plan fue actualizado</p>
            <p className="text-xs text-muted mt-1">Tu entrenador realizo cambios en tu plan. Revisa las novedades en entrenamiento y nutricion.</p>
          </div>
          <button
            onClick={() => setPlanUpdatedBanner(false)}
            className="absolute top-3 right-3 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                              <button onClick={() => setExpandedGif({ src: exGif, name: ex.name })} className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 hover:ring-2 hover:ring-primary/50 transition-all">
                                <img src={exGif} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ex.name}</p>
                              <p className="text-xs text-muted">{ex.sets} series x {ex.reps} | Descanso: {ex.rest}</p>
                              {"notes" in ex && ex.notes && <p className="text-[10px] text-primary/70 italic mt-0.5">{String(ex.notes)}</p>}
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

                  {/* Session mode: all exercises with weight inputs, checkboxes, timer */}
                  {isSession && (() => {
                    const allExercises = day.exercises;
                    const totalEx = allExercises.filter(e => !["hiit-cinta", "hiit-casa", "burpees", "jumping-jacks", "high-knees", "saltar-cuerda"].includes(e.id)).length;
                    const completedEx = allExercises.filter(e => {
                      const sets = sessionData[e.id];
                      return sets && sets.length > 0 && sets.every(s => s.completed);
                    }).length;
                    return (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-xs text-primary font-bold">SESION EN CURSO</p>
                        </div>
                        <span className="text-[10px] text-muted">{completedEx}/{totalEx} ejercicios</span>
                      </div>
                      {/* Session progress bar */}
                      <div className="h-1.5 rounded-full bg-card-bg overflow-hidden mb-4">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${totalEx > 0 ? (completedEx / totalEx) * 100 : 0}%` }} />
                      </div>
                      <div className="space-y-4">
                        {allExercises.map((ex, i) => {
                          const log = exerciseLogs[ex.id];
                          const sets = sessionData[ex.id] || [];
                          const isCardioEx = ["hiit-cinta", "hiit-casa", "burpees", "jumping-jacks", "high-knees", "saltar-cuerda"].includes(ex.id);
                          const allSetsComplete = sets.length > 0 && sets.every(s => s.completed);
                          const completedSets = sets.filter(s => s.completed).length;
                          return (
                            <div key={i} className={`rounded-xl p-3 transition-colors ${allSetsComplete ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-card-bg"}`}>
                              <div className="flex items-center gap-3 mb-2">
                                {(() => { const gif = getExerciseGif(ex.id); return gif ? (
                                  <button onClick={() => setExpandedGif({ src: gif, name: ex.name })} className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 hover:ring-2 hover:ring-primary/50 transition-all">
                                    <img src={gif} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                                  </button>
                                ) : null; })()}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm truncate">{ex.name}</p>
                                    {allSetsComplete && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                                  </div>
                                  <p className="text-[10px] text-muted">
                                    {isCardioEx ? ex.reps : `${ex.sets}x${ex.reps} | ${ex.rest}`}
                                    {!isCardioEx && sets.length > 0 && ` — ${completedSets}/${sets.length} series`}
                                  </p>
                                  {"notes" in ex && ex.notes && <p className="text-[9px] text-primary/70 italic">{String(ex.notes)}</p>}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!isCardioEx && log && (
                                    <span className="text-[10px] text-muted">Ant: {log.weight}kg</span>
                                  )}
                                  <button onClick={() => setSelectedExercise(ex.id)} className="text-primary">
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {isCardioEx ? (
                                <div className="flex items-center gap-2 text-xs text-primary font-medium py-1">
                                  <span>Sin peso — solo tiempo</span>
                                </div>
                              ) : (
                              <div className="space-y-1.5">
                                {sets.map((s, si) => (
                                  <div key={si} className={`flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors ${s.completed ? "bg-emerald-500/5" : ""}`}>
                                    <button
                                      onClick={() => toggleSetComplete(ex.id, si, ex.rest)}
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${s.completed ? "bg-emerald-500 border-emerald-500" : "border-card-border hover:border-primary"}`}
                                    >
                                      {s.completed && <Check className="h-3 w-3 text-black" />}
                                    </button>
                                    <span className="text-[10px] text-muted w-4 shrink-0">S{s.set}</span>
                                    <input
                                      type="number"
                                      inputMode="decimal"
                                      value={s.weight || ""}
                                      onChange={e => updateSessionSet(ex.id, si, "weight", Number(e.target.value))}
                                      placeholder="kg"
                                      className={`flex-1 bg-background border border-card-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary ${s.completed ? "opacity-60" : ""}`}
                                    />
                                    <span className="text-[10px] text-muted">x</span>
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      value={s.reps || ""}
                                      onChange={e => updateSessionSet(ex.id, si, "reps", Number(e.target.value))}
                                      placeholder="reps"
                                      className={`w-14 bg-background border border-card-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary ${s.completed ? "opacity-60" : ""}`}
                                    />
                                  </div>
                                ))}
                                {/* Rest timer for this exercise */}
                                {restTimer?.exerciseId === ex.id && (
                                  <RestTimer
                                    seconds={restTimer.seconds}
                                    onComplete={() => setRestTimer(null)}
                                  />
                                )}
                              </div>
                              )}
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
                          onClick={() => { setActiveSession(null); setSessionData({}); setRestTimer(null); }}
                          className="px-4 py-3 text-muted text-sm rounded-xl hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                    );
                  })()}
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

          {/* Kitesurf day toggle */}
          {kitesurfMealPlans && (
            <div className="flex gap-2 mb-4">
              {(["gym", "kitesurf"] as const).map((type) => (
                <button key={type} onClick={() => {
                  setKiteDayType(type);
                  setMealPlan(type === "gym" ? kitesurfMealPlans.gymDay : kitesurfMealPlans.kitesurfDay);
                }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    kiteDayType === type
                      ? "gradient-primary text-black"
                      : "bg-card-bg text-muted border border-card-border"
                  }`}>
                  {type === "gym" ? "Dia de Gym" : "Dia de Kitesurf"}
                </button>
              ))}
            </div>
          )}
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
                    <div className="flex items-center gap-2 pt-2 border-t border-card-border/30">
                      <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded">P: {meal.approxProtein}g</span>
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">C: {meal.approxCarbs}g</span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">G: {meal.approxFats}g</span>
                      <div className="flex-1" />
                      {(() => {
                        const mealFoods = meal.foodDetails
                          ? meal.foodDetails.map((fd: { name: string }) => fd.name)
                          : meal.foods;
                        const recipe = suggestRecipe(meal.name, mealFoods as string[]);
                        if (!recipe) return null;
                        return (
                          <button
                            onClick={() => setRecipeModal(recipe)}
                            className="flex items-center gap-1 text-[10px] text-accent font-bold hover:text-accent/80 transition-colors"
                          >
                            <ChefHat className="h-3 w-3" />
                            Receta
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===== RESUMEN NUTRICIONAL ===== */}
          {(() => {
            const tCals = mealPlan.meals.reduce((s: number, m: { approxCalories?: number }) => s + (m.approxCalories || 0), 0);
            const tProt = mealPlan.meals.reduce((s: number, m: { approxProtein?: number }) => s + (m.approxProtein || 0), 0);
            const tCarbs = mealPlan.meals.reduce((s: number, m: { approxCarbs?: number }) => s + (m.approxCarbs || 0), 0);
            const tFats = mealPlan.meals.reduce((s: number, m: { approxFats?: number }) => s + (m.approxFats || 0), 0);
            const dCals = tCals > 0 ? tCals : macros.calories;
            const dProt = tProt > 0 ? tProt : macros.protein;
            const dCarbs = tCarbs > 0 ? tCarbs : macros.carbs;
            const dFats = tFats > 0 ? tFats : macros.fats;

            // Determine goal label comparing plan calories vs TDEE (maintenance)
            let gLabel = ""; let gIcon = ""; let gColor = "";
            const compareBase = tdee > 0 ? tdee : macros.calories;
            if (compareBase > 0 && dCals > 0) {
              const diff = dCals - compareBase;
              if (diff < -100) {
                gLabel = "Deficit calorico"; gIcon = "🔥"; gColor = "text-orange-400";
              } else if (diff > 100) {
                gLabel = "Superavit calorico"; gIcon = "💪"; gColor = "text-blue-400";
              } else {
                gLabel = "Mantenimiento"; gIcon = "⚖️"; gColor = "text-emerald-400";
              }
            } else {
              gLabel = "Plan personalizado"; gIcon = "🎯"; gColor = "text-primary";
            }

            const totalMC = (dProt * 4) + (dCarbs * 4) + (dFats * 9);
            const pPct = totalMC > 0 ? Math.round((dProt * 4 / totalMC) * 100) : 0;
            const cPct = totalMC > 0 ? Math.round((dCarbs * 4 / totalMC) * 100) : 0;
            const fPct = totalMC > 0 ? Math.round((dFats * 9 / totalMC) * 100) : 0;

            return (
              <div className="glass-card rounded-2xl p-5 mt-6 border-t-4 border-primary">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                  📊 Resumen de tu Plan Nutricional
                </h3>

                {/* Objetivo */}
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-card-bg">
                  <span className="text-2xl">{gIcon}</span>
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider">Objetivo</p>
                    <p className={`font-bold text-sm ${gColor}`}>{gLabel}</p>
                  </div>
                </div>

                {/* Calorias totales */}
                <div className="text-center mb-4">
                  <p className="text-3xl font-black text-primary">{dCals}</p>
                  <p className="text-xs text-muted">calorias diarias objetivo</p>
                  {tdee > 0 && (
                    <p className="text-[10px] text-muted mt-1">
                      TDEE estimado: {tdee} kcal ({dCals > tdee ? "+" : ""}{dCals - tdee} kcal)
                    </p>
                  )}
                </div>

                {/* Macros breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-red-500/10">
                    <p className="text-lg font-black text-red-400">{dProt}g</p>
                    <p className="text-[10px] text-muted">Proteina</p>
                    <p className="text-[10px] text-red-400/70">{pPct}%</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-yellow-500/10">
                    <p className="text-lg font-black text-yellow-400">{dCarbs}g</p>
                    <p className="text-[10px] text-muted">Carbohidratos</p>
                    <p className="text-[10px] text-yellow-400/70">{cPct}%</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-blue-500/10">
                    <p className="text-lg font-black text-blue-400">{dFats}g</p>
                    <p className="text-[10px] text-muted">Grasas</p>
                    <p className="text-[10px] text-blue-400/70">{fPct}%</p>
                  </div>
                </div>

                {/* Macro bar */}
                <div className="w-full h-3 rounded-full overflow-hidden flex mb-2">
                  <div className="bg-red-400 h-full" style={{ width: `${pPct}%` }} />
                  <div className="bg-yellow-400 h-full" style={{ width: `${cPct}%` }} />
                  <div className="bg-blue-400 h-full" style={{ width: `${fPct}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-muted">
                  <span>Proteina {pPct}%</span>
                  <span>Carbos {cPct}%</span>
                  <span>Grasas {fPct}%</span>
                </div>
              </div>
            );
          })()}

          {/* Kitesurf Supplementation */}
          {objective === "kitesurf" && (
            <div className="glass-card rounded-2xl p-4 mt-4">
              <h3 className="font-bold text-sm mb-3 text-primary">Suplementacion Recomendada</h3>
              <div className="space-y-2">
                {[
                  { name: "Proteina Whey", dose: "1 scoop (30g) post-entrenamiento", desc: "Recuperacion muscular rapida" },
                  { name: "Creatina Monohidrato", dose: "5g/dia todos los dias", desc: "Fuerza, potencia y rendimiento" },
                  { name: "Electrolitos", dose: "Antes y durante sesiones de kitesurf", desc: "Prevenir calambres y deshidratacion" },
                  { name: "Omega-3", dose: "2-3g/dia (EPA+DHA)", desc: "Antiinflamatorio — articulaciones y recuperacion" },
                ].map((s) => (
                  <div key={s.name} className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">&#8226;</span>
                    <div>
                      <p className="text-sm font-medium">{s.name} — <span className="text-muted">{s.dose}</span></p>
                      <p className="text-[10px] text-muted">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kitesurf Performance Tips */}
          {objective === "kitesurf" && (
            <div className="glass-card rounded-2xl p-4 mt-4 border-l-4 border-primary">
              <h3 className="font-bold text-sm mb-3">Tips para Kitesurf</h3>
              <div className="space-y-3 text-sm text-muted">
                <div>
                  <p className="font-medium text-white">Mejorar el Grip</p>
                  <p>Entrena dead hangs y farmer walks 3x/semana. Usa toalla sobre la barra para simular el agarre inestable. Evita usar straps en ejercicios de traccion para fortalecer los antebrazos.</p>
                </div>
                <div>
                  <p className="font-medium text-white">Resistencia del Core</p>
                  <p>Prioriza ejercicios anti-rotacion (Pallof Press) sobre crunches. El core en kitesurf resiste fuerzas, no las genera. Plancha lateral + hollow hold son clave para sesiones largas.</p>
                </div>
                <div>
                  <p className="font-medium text-white">Prevencion de Fatiga</p>
                  <p>Hidratate con electrolitos desde 1 hora antes de navegar. Cada 20 min de sesion, toma un trago. Lleva barritas energeticas para sesiones de +2 horas. Elongar hombros y caderas al terminar.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Food Swap Modal */}
      {/* RECIPE MODAL */}
      {recipeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setRecipeModal(null)}>
          <div className="bg-card-bg border border-card-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card-bg border-b border-card-border/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-accent" />
                <h3 className="font-bold">{recipeModal.name}</h3>
              </div>
              <button onClick={() => setRecipeModal(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Info badges */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] px-2.5 py-1 bg-accent/10 text-accent rounded-full font-bold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {recipeModal.prepTime} min
                </span>
                <span className="text-[10px] px-2.5 py-1 bg-primary/10 text-primary rounded-full font-bold">
                  {recipeModal.difficulty === "facil" ? "Facil" : "Medio"}
                </span>
                <span className="text-[10px] px-2.5 py-1 bg-white/10 text-muted rounded-full font-bold">
                  {recipeModal.servings} porcion{recipeModal.servings > 1 ? "es" : ""}
                </span>
              </div>
              {/* Macros */}
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">{recipeModal.calories} kcal</span>
                <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded">P: {recipeModal.protein}g</span>
                <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">C: {recipeModal.carbs}g</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">G: {recipeModal.fat}g</span>
              </div>
              {/* Ingredients */}
              <div>
                <h4 className="font-bold text-sm mb-2">Ingredientes</h4>
                <ul className="space-y-1">
                  {recipeModal.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-2">
                      <span className="text-accent mt-0.5">&#8226;</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Steps */}
              <div>
                <h4 className="font-bold text-sm mb-2">Preparacion</h4>
                <ol className="space-y-2">
                  {recipeModal.steps.map((step, i) => (
                    <li key={i} className="text-sm text-muted flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {swapTarget && (
        <FoodSwapModal
          mealName={swapTarget.mealName}
          currentFood={swapTarget.food}
          onSwap={handleSwap}
          onClose={() => setSwapTarget(null)}
        />
      )}

      {/* Expanded GIF Modal */}
      {expandedGif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setExpandedGif(null)}>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setExpandedGif(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white/10 rounded-2xl overflow-hidden">
              <img src={expandedGif.src} alt={expandedGif.name} className="w-72 h-72 sm:w-80 sm:h-80 object-contain" />
            </div>
            <p className="text-center text-sm font-bold mt-3">{expandedGif.name}</p>
          </div>
        </div>
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
    <Suspense fallback={<div className="flex items-center justify-center py-20"><RatLoader size={64} /></div>}>
      <PlanContent />
    </Suspense>
  );
}
