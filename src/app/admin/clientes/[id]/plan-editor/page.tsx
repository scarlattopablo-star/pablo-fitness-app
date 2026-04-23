"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, Save, Dumbbell, UtensilsCrossed,
  GripVertical, Check, RefreshCw,
} from "lucide-react";
import { EXERCISES } from "@/lib/exercises-data";
import { supabase } from "@/lib/supabase";
import { generateTrainingPlan } from "@/lib/generate-training-plan";

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

interface Meal {
  name: string;
  time: string;
  foods: string[];
}

const EMPTY_EXERCISE: TrainingExercise = {
  exerciseId: "", name: "", sets: 4, reps: "10", rest: "60s", notes: "", method: "",
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const EMPTY_MEAL: Meal = { name: "", time: "", foods: [""] };

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
    { name: "DESAYUNO", time: "07:00", foods: [""] },
    { name: "COMIDA 2", time: "10:00", foods: [""] },
    { name: "COMIDA 3", time: "13:00", foods: [""] },
    { name: "COMIDA 4", time: "16:00", foods: [""] },
    { name: "COMIDA 5", time: "19:00", foods: [""] },
    { name: "COMIDA 6", time: "21:00", foods: [""] },
  ]);
  const [nutritionNotes, setNutritionNotes] = useState<string[]>([
    "COMER CADA 3 HORAS",
    "TOMAR 3 LITROS DE AGUA AL DÍA",
    "NO AZÚCAR, ENDULZAR CON EDULCORANTE",
    "NO ALCOHOL",
  ]);

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
          setTrainingDays(trainingData.data.days);
        }

        if (nutritionData && nutritionData.data?.meals?.length > 0) {
          // Convert meals: if they have foodDetails, build foods strings from them
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loadedMeals: Meal[] = nutritionData.data.meals.map((m: any) => ({
            name: m.name || "",
            time: m.time || "",
            foods: m.foodDetails && m.foodDetails.length > 0
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? m.foodDetails.map((fd: any) => fd.grams > 0 ? `${fd.grams}g ${fd.name}` : fd.name)
              : m.foods || [""],
          }));
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
    setMeals([...meals, { name: `COMIDA ${meals.length + 1}`, time: "", foods: [""] }]);
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
    updated[mealIdx].foods.push("");
    setMeals(updated);
  };

  const updateFood = (mealIdx: number, foodIdx: number, value: string) => {
    const updated = [...meals];
    updated[mealIdx].foods[foodIdx] = value;
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
            ? { days: trainingDays }
            : { meals, importantNotes: nutritionNotes },
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
      </div>

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
          {meals.map((meal, mealIdx) => (
            <div key={mealIdx} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
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
              {meal.foods.map((food, foodIdx) => (
                <div key={foodIdx} className="flex items-center gap-2 mb-2">
                  <span className="text-primary text-sm">&#8226;</span>
                  <input
                    value={food}
                    onChange={(e) => updateFood(mealIdx, foodIdx, e.target.value)}
                    className="flex-1 bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Ej: 150g pollo, 100g arroz integral..."
                  />
                  <button onClick={() => removeFood(mealIdx, foodIdx)} className="text-muted hover:text-danger">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => addFood(mealIdx)} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Agregar alimento
              </button>
            </div>
          ))}

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
