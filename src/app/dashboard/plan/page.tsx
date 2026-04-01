"use client";

import { useState, useEffect } from "react";
import { Dumbbell, UtensilsCrossed, Info, Play, X, Loader2, Target } from "lucide-react";
import { getExerciseById, getVideoUrl } from "@/lib/exercises-data";
import { generateMealPlan, type MealPlanMeal } from "@/lib/generate-meal-plan";
import { generateTrainingPlan, type TrainingDay } from "@/lib/generate-training-plan";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

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
  const { user, subscription } = useAuth();
  const [tab, setTab] = useState<"entrenamiento" | "nutricion">("entrenamiento");
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<{ meals: MealPlanMeal[]; importantNotes: string[] } | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [objective, setObjective] = useState("");
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    if (user) loadMacros();
  }, [user]);

  const loadMacros = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("surveys")
      .select("target_calories, protein, carbs, fats, objective, training_days, wake_hour, sleep_hour")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data && data.target_calories) {
      setMealPlan(generateMealPlan(data.target_calories, data.protein, data.carbs, data.fats));
      setTrainingPlan(generateTrainingPlan(data.training_days || 5));
      setMacros({ calories: data.target_calories, protein: data.protein, carbs: data.carbs, fats: data.fats });
      setObjective(data.objective || "");
    } else {
      setMealPlan(generateMealPlan(2100, 150, 220, 70));
      setTrainingPlan(generateTrainingPlan(5));
      setMacros({ calories: 2100, protein: 150, carbs: 220, fats: 70 });
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

  const planName = subscription?.plan_name || OBJECTIVE_LABELS[objective] || "Plan Personalizado";

  return (
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted text-xs border-b border-card-border">
                      <th className="text-left p-3 font-medium">Ejercicio</th>
                      <th className="text-center p-3 font-medium">Series</th>
                      <th className="text-center p-3 font-medium">Reps</th>
                      <th className="text-center p-3 font-medium">Descanso</th>
                      <th className="text-center p-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.exercises.map((ex, i) => (
                      <tr key={i} className="border-b border-card-border/50 last:border-0">
                        <td className="p-3 font-medium">{ex.name}</td>
                        <td className="p-3 text-center text-primary font-bold">{ex.sets}</td>
                        <td className="p-3 text-center">{ex.reps}</td>
                        <td className="p-3 text-center text-muted">{ex.rest}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => setSelectedExercise(ex.id)} className="text-primary hover:text-primary-light">
                            <Info className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            {mealPlan.meals.map((meal) => (
              <div key={meal.name} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-card-border/50">
                  <div className="mb-1">
                    <h3 className="font-bold">{meal.name}</h3>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded">{meal.approxCalories} kcal</span>
                    <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded">P: {meal.approxProtein}g</span>
                    <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">C: {meal.approxCarbs}g</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">G: {meal.approxFats}g</span>
                  </div>
                </div>
                <div className="p-4">
                  <ul className="space-y-1.5">
                    {meal.foods.map((food, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">&#8226;</span>
                        <span className="text-muted">{food}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
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
