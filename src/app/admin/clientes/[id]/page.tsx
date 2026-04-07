"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, ClipboardList, TrendingUp,
  Calendar, Target, Scale, Mail, Phone, Edit,
  Dumbbell, UtensilsCrossed, Camera, Loader2, Trash2,
  ChevronDown, ChevronUp, Ruler, Image, Save, Plus, X, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { getPhotoUrl } from "@/lib/upload-photo";
import { EXERCISES, MUSCLE_GROUP_LABELS } from "@/lib/exercises-data";
import { getExerciseGif } from "@/lib/exercise-images";
import { FOOD_DATABASE, findFoodByName, calculateSwapGrams, calculateFoodMacros } from "@/lib/food-database";
import {
  WeightChart, MeasurementsLineChart, MeasurementsBarChart,
  MeasurementsChangeChart, MacrosPieChart, WeightChangeBarChart,
  ExerciseProgressCharts,
} from "@/components/progress-charts";

interface ClientData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface SurveyData {
  age: number;
  sex: string;
  weight: number;
  height: number;
  activity_level: string;
  dietary_restrictions: string[];
  target_calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tmb: number;
  tdee: number;
  objective?: string;
  nutritional_goal?: string;
}

interface SubscriptionData {
  id: string;
  duration: string;
  status: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
}

interface ProgressEntry {
  id: string;
  date: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  legs: number | null;
  photo_front: string | null;
  photo_side: string | null;
  photo_back: string | null;
  notes: string | null;
}

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<ClientData | null>(null);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [nutritionPlan, setNutritionPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [expandTraining, setExpandTraining] = useState(false);
  const [expandNutrition, setExpandNutrition] = useState(false);
  const [expandProgress, setExpandProgress] = useState(true);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<any[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [approvingPlan, setApprovingPlan] = useState(false);
  const [editingTraining, setEditingTraining] = useState(false);
  const [editTrainingData, setEditTrainingData] = useState<any[]>([]);
  const [savingTraining, setSavingTraining] = useState(false);
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [editNutritionData, setEditNutritionData] = useState<any[]>([]);
  const [savingNutrition, setSavingNutrition] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState<{ dayIdx: number; exIdx: number; query: string } | null>(null);
  const [foodSearch, setFoodSearch] = useState<{ mealIdx: number; foodIdx: number; query: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadClient();
    }
  }, [id, authLoading, user]);

  const loadClient = async () => {
    // Load profile, survey, subscription, and plans in parallel
    const { data: { session } } = await supabase.auth.getSession();

    const [profileRes, surveyRes, subRes, plansRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("surveys").select("*").eq("user_id", id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      session?.access_token
        ? fetch(`/api/admin/client-plans?clientId=${id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        : Promise.resolve(null),
    ]);

    if (profileRes.data) setClient(profileRes.data);
    if (surveyRes.data) setSurvey(surveyRes.data);
    if (subRes.data) setSubscription(subRes.data);
    if (plansRes?.trainingPlan) setTrainingPlan(plansRes.trainingPlan);
    if (plansRes?.nutritionPlan) setNutritionPlan(plansRes.nutritionPlan);

    // Load progress entries
    const { data: progressData } = await supabase
      .from("progress_entries")
      .select("*")
      .eq("user_id", id)
      .order("date", { ascending: false });
    if (progressData) {
      setProgressEntries(progressData);
      // Load photo URLs
      const paths = progressData.flatMap((e: ProgressEntry) =>
        [e.photo_front, e.photo_side, e.photo_back].filter(Boolean) as string[]
      );
      if (paths.length > 0) {
        const urls: Record<string, string> = {};
        await Promise.all(
          paths.map(async (path) => {
            const url = await getPhotoUrl(path);
            if (url) urls[path] = url;
          })
        );
        setPhotoUrls(urls);
      }
    }

    // Load exercise logs
    const { data: exLogs } = await supabase
      .from("exercise_logs")
      .select("exercise_id, exercise_name, sets_data, date")
      .eq("user_id", id)
      .order("date", { ascending: false });
    if (exLogs) setExerciseLogs(exLogs);

    setLoading(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setDeleteError("No hay sesion activa. Recarga la pagina e intenta de nuevo.");
      setDeleting(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/delete-client?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/admin/clientes";
      } else {
        setDeleteError(data.error || "Error al eliminar el cliente");
        setDeleting(false);
      }
    } catch {
      setDeleteError("Error de conexion");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Cliente no encontrado</p>
        <Link href="/admin/clientes" className="text-primary hover:underline mt-2 inline-block">
          Volver a clientes
        </Link>
      </div>
    );
  }

  const trainingDays = trainingPlan?.data?.days || [];
  const nutritionMeals = nutritionPlan?.data?.meals || [];
  const nutritionNotes = nutritionPlan?.important_notes || nutritionPlan?.data?.importantNotes || [];

  return (
    <div>
      <Link href="/admin/clientes" className="inline-flex items-center gap-2 text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl font-bold text-primary">
            {(client.full_name || client.email || "?")[0].toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-black">{client.full_name || "Sin nombre"}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</span>
            {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phone}</span>}
            <button onClick={() => { setShowEditProfile(true); setEditName(client.full_name || ""); setEditPhone(client.phone || ""); }}
              className="text-primary text-xs hover:underline">Editar datos</button>
          </div>
          {showEditProfile && (
            <div className="mt-3 bg-card-bg border border-card-border rounded-xl p-4 space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Nombre</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Telefono</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                  className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  setSavingProfile(true);
                  await supabase.from("profiles").update({ full_name: editName, phone: editPhone }).eq("id", id);
                  setClient({ ...client, full_name: editName, phone: editPhone });
                  setSavingProfile(false);
                  setProfileSaved(true);
                  setTimeout(() => { setShowEditProfile(false); setProfileSaved(false); }, 1500);
                }} disabled={savingProfile}
                  className="gradient-primary text-black text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">
                  {profileSaved ? "Guardado!" : savingProfile ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => setShowEditProfile(false)} className="text-sm text-muted">Cancelar</button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted mt-1">
            Registrado: {new Date(client.created_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          {/* Plan approval status */}
          {trainingPlan && (
            <div className="flex items-center gap-2 mt-3">
              {trainingPlan.plan_approved ? (
                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">Plan Aprobado</span>
              ) : (
                <>
                  <span className="text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full font-bold">Pendiente de Aprobacion</span>
                  <button
                    onClick={async () => {
                      setApprovingPlan(true);
                      const approvedAt = new Date().toISOString();
                      const tpData = trainingPlan.data ? { ...trainingPlan.data, admin_updated_at: approvedAt } : trainingPlan.data;
                      const npData = nutritionPlan?.data ? { ...nutritionPlan.data, admin_updated_at: approvedAt } : nutritionPlan?.data;
                      await supabase.from("training_plans").update({ plan_approved: true, ...(tpData ? { data: tpData } : {}) }).eq("user_id", id);
                      await supabase.from("nutrition_plans").update({ plan_approved: true, ...(npData ? { data: npData } : {}) }).eq("user_id", id);
                      setTrainingPlan({ ...trainingPlan, plan_approved: true, data: tpData || trainingPlan.data });
                      if (nutritionPlan) setNutritionPlan({ ...nutritionPlan, plan_approved: true, data: npData || nutritionPlan.data });
                      setApprovingPlan(false);
                    }}
                    disabled={approvingPlan}
                    className="inline-flex items-center gap-1 bg-primary text-black font-semibold text-xs px-3 py-1.5 rounded-xl hover:opacity-90 disabled:opacity-50"
                  >
                    {approvingPlan ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
                    Aprobar Plan
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <Link
              href={`/admin/clientes/${id}/plan-editor`}
              className="inline-flex items-center gap-2 gradient-primary text-black font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
            >
              <Edit className="h-4 w-4" /> Crear/Editar Plan
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 bg-danger/10 text-danger font-semibold text-sm px-4 py-2 rounded-xl hover:bg-danger/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="mt-3 bg-danger/10 border border-danger/30 rounded-xl p-4">
              <p className="text-sm font-bold text-danger mb-2">¿Eliminar este cliente?</p>
              <p className="text-xs text-muted mb-3">El cliente sera movido a la papelera y su acceso sera revocado. Podras restaurarlo desde la papelera.</p>
              {deleteError && (
                <p className="text-xs text-danger bg-danger/20 p-2 rounded-lg mb-3">{deleteError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-danger text-white font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? "Eliminando..." : "Si, eliminar"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(""); }}
                  className="text-sm text-muted hover:text-white px-4 py-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {survey ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Datos de Encuesta
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card-bg rounded-lg p-2.5">
                <p className="text-xs text-muted">Edad</p>
                <p className="font-bold">{survey.age}</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2.5">
                <p className="text-xs text-muted">Sexo</p>
                <p className="font-bold capitalize">{survey.sex}</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2.5">
                <p className="text-xs text-muted">Peso</p>
                <p className="font-bold">{survey.weight}kg</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2.5">
                <p className="text-xs text-muted">Altura</p>
                <p className="font-bold">{survey.height}cm</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2.5">
                <p className="text-xs text-muted">Actividad</p>
                <p className="font-bold capitalize">{survey.activity_level?.replace("-", " ")}</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2.5">
                <p className="text-xs text-muted">Restricciones</p>
                <p className="font-bold text-xs">{survey.dietary_restrictions?.join(", ") || "Ninguna"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Macros Calculados
            </h2>
            <div className="space-y-3">
              <div className="bg-card-bg rounded-lg p-3 text-center">
                <p className="text-xs text-muted">Calorias/dia</p>
                <p className="text-2xl font-black text-primary">{survey.target_calories}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card-bg rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted">Proteinas</p>
                  <p className="font-black text-red-400">{survey.protein}g</p>
                </div>
                <div className="bg-card-bg rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted">Carbos</p>
                  <p className="font-black text-yellow-400">{survey.carbs}g</p>
                </div>
                <div className="bg-card-bg rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted">Grasas</p>
                  <p className="font-black text-blue-400">{survey.fats}g</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-card-bg rounded-lg p-2 text-center">
                  <p className="text-muted">TMB</p>
                  <p className="font-bold">{survey.tmb} kcal</p>
                </div>
                <div className="bg-card-bg rounded-lg p-2 text-center">
                  <p className="text-muted">TDEE</p>
                  <p className="font-bold">{survey.tdee} kcal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <p className="text-muted">Este cliente aun no completo la encuesta.</p>
        </div>
      )}

      {/* Subscription */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Suscripcion
        </h3>
        {subscription ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted">Estado</p>
              <p className={subscription.status === "active" ? "text-primary font-bold" : "text-danger font-bold"}>
                {subscription.status === "active" ? "Activa" : subscription.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Duracion</p>
              <p className="font-medium">{subscription.duration}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Inicio</p>
              <p className="font-medium">{new Date(subscription.start_date).toLocaleDateString("es")}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Fin</p>
              <p className="font-medium">{new Date(subscription.end_date).toLocaleDateString("es")}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Pagado</p>
              <p className="font-medium">${subscription.amount_paid}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Sin suscripcion</p>
        )}
      </div>

      {/* Training Plan Detail */}
      <div className="glass-card rounded-2xl p-5 mb-4">
        <button
          onClick={() => setExpandTraining(!expandTraining)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Plan de Entrenamiento
            {trainingDays.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                {trainingDays.length} dias
              </span>
            )}
          </h3>
          {trainingDays.length > 0 && (
            expandTraining ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </button>

        {trainingDays.length === 0 && (
          <p className="text-sm text-muted mt-2">Sin plan asignado</p>
        )}

        {expandTraining && trainingDays.length > 0 && !editingTraining && (
          <div className="mt-4 space-y-3">
            {trainingDays.map((day: any, i: number) => (
              <div key={i} className="bg-card-bg rounded-xl p-3">
                <p className="font-bold text-sm text-primary mb-2">{day.day}</p>
                {day.instructions && (
                  <p className="text-xs text-muted mb-2 italic">{day.instructions}</p>
                )}
                <div className="space-y-1">
                  {(day.exercises || []).map((ex: any, j: number) => (
                    <div key={j} className="flex items-center justify-between text-sm">
                      <span>{ex.name}</span>
                      <span className="text-xs text-muted">
                        {ex.sets}x{ex.reps} {ex.rest && `| ${ex.rest}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setEditTrainingData(JSON.parse(JSON.stringify(trainingDays)));
                setEditingTraining(true);
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary font-bold py-2 border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
            >
              <Edit className="h-4 w-4" /> Editar Rutina
            </button>
          </div>
        )}

        {/* Inline editing mode */}
        {expandTraining && editingTraining && (
          <div className="mt-4 space-y-4">
            {editTrainingData.map((day: any, dayIdx: number) => (
              <div key={dayIdx} className="bg-card-bg rounded-xl p-3">
                <input
                  value={day.day}
                  onChange={(e) => {
                    const updated = [...editTrainingData];
                    updated[dayIdx] = { ...day, day: e.target.value };
                    setEditTrainingData(updated);
                  }}
                  className="w-full bg-transparent font-bold text-sm text-primary mb-2 border-b border-card-border/50 pb-1 focus:outline-none focus:border-primary"
                />
                <div className="space-y-2">
                  {(day.exercises || []).map((ex: any, exIdx: number) => {
                    const isActive = exerciseSearch?.dayIdx === dayIdx && exerciseSearch?.exIdx === exIdx;
                    const currentExercise = ex.id ? EXERCISES.find(e => e.id === ex.id) : EXERCISES.find(e => e.name === ex.name);
                    const currentMuscleGroup = currentExercise?.muscleGroup;

                    return (
                    <div key={exIdx} className="text-sm">
                      <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <button
                          onClick={() => setExerciseSearch(isActive ? null : { dayIdx, exIdx, query: "" })}
                          className="w-full flex items-center gap-2 bg-card-border/20 rounded px-2 py-1.5 text-xs text-left focus:outline-none focus:ring-1 focus:ring-primary hover:bg-card-border/30 transition-colors"
                        >
                          {currentExercise && getExerciseGif(currentExercise.id) && (
                            <img src={getExerciseGif(currentExercise.id)!} className="w-5 h-5 rounded object-cover bg-white/10 flex-shrink-0" />
                          )}
                          <span className="flex-1 truncate">{ex.name || <span className="text-muted">Seleccionar ejercicio...</span>}</span>
                          {currentMuscleGroup && (
                            <span className="text-[10px] text-muted capitalize flex-shrink-0">{MUSCLE_GROUP_LABELS[currentMuscleGroup]}</span>
                          )}
                        </button>
                        {isActive && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card-bg border border-card-border rounded-xl max-h-64 overflow-y-auto shadow-xl">
                            <div className="sticky top-0 bg-card-bg p-2 border-b border-card-border/50">
                              <input
                                autoFocus
                                value={exerciseSearch.query}
                                onChange={(e) => setExerciseSearch({ dayIdx, exIdx, query: e.target.value })}
                                className="w-full bg-card-border/20 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Buscar ejercicio..."
                              />
                            </div>
                            {(() => {
                              const searchTerm = exerciseSearch.query.toLowerCase();
                              const filtered = EXERCISES.filter(e =>
                                !searchTerm || e.name.toLowerCase().includes(searchTerm)
                              );
                              const sameGroup = currentMuscleGroup
                                ? filtered.filter(e => e.muscleGroup === currentMuscleGroup && e.id !== currentExercise?.id)
                                : [];
                              const otherGroup = currentMuscleGroup
                                ? filtered.filter(e => e.muscleGroup !== currentMuscleGroup)
                                : filtered;

                              const renderExOption = (e: typeof EXERCISES[0]) => (
                                <button
                                  key={e.id}
                                  onClick={() => {
                                    const updated = [...editTrainingData];
                                    updated[dayIdx].exercises[exIdx] = { ...ex, id: e.id, name: e.name };
                                    setEditTrainingData(updated);
                                    setExerciseSearch(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/10 text-xs"
                                >
                                  {getExerciseGif(e.id) && (
                                    <img src={getExerciseGif(e.id)!} className="w-6 h-6 rounded object-cover bg-white/10 flex-shrink-0" />
                                  )}
                                  <span className="flex-1">{e.name}</span>
                                  <span className="text-[10px] text-muted capitalize">{MUSCLE_GROUP_LABELS[e.muscleGroup]}</span>
                                </button>
                              );

                              return (
                                <>
                                  {sameGroup.length > 0 && (
                                    <>
                                      <div className="px-3 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5">
                                        {MUSCLE_GROUP_LABELS[currentMuscleGroup!]} ({sameGroup.length})
                                      </div>
                                      {sameGroup.map(renderExOption)}
                                    </>
                                  )}
                                  {otherGroup.length > 0 && (
                                    <>
                                      {sameGroup.length > 0 && (
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-muted/70 uppercase tracking-wider bg-card-border/10">
                                          Otros grupos musculares
                                        </div>
                                      )}
                                      {otherGroup.slice(0, 15).map(renderExOption)}
                                    </>
                                  )}
                                  {sameGroup.length === 0 && otherGroup.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-muted">Sin resultados</p>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <input
                        value={ex.sets}
                        onChange={(e) => {
                          const updated = [...editTrainingData];
                          updated[dayIdx].exercises[exIdx] = { ...ex, sets: Number(e.target.value) || 0 };
                          setEditTrainingData(updated);
                        }}
                        className="w-10 bg-card-border/20 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="S"
                      />
                      <span className="text-xs text-muted">x</span>
                      <input
                        value={ex.reps}
                        onChange={(e) => {
                          const updated = [...editTrainingData];
                          updated[dayIdx].exercises[exIdx] = { ...ex, reps: e.target.value };
                          setEditTrainingData(updated);
                        }}
                        className="w-14 bg-card-border/20 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Reps"
                      />
                      <input
                        value={ex.rest}
                        onChange={(e) => {
                          const updated = [...editTrainingData];
                          updated[dayIdx].exercises[exIdx] = { ...ex, rest: e.target.value };
                          setEditTrainingData(updated);
                        }}
                        className="w-12 bg-card-border/20 rounded px-1 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Rest"
                      />
                      <button
                        onClick={() => {
                          const updated = [...editTrainingData];
                          updated[dayIdx].exercises.splice(exIdx, 1);
                          setEditTrainingData(updated);
                        }}
                        className="text-danger/60 hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      </div>
                    </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      const updated = [...editTrainingData];
                      updated[dayIdx].exercises.push({ id: `custom-${Date.now()}`, name: "", sets: 4, reps: "8-12", rest: "60s" });
                      setEditTrainingData(updated);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                  >
                    <Plus className="h-3 w-3" /> Agregar ejercicio
                  </button>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setSavingTraining(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      alert("Sesión expirada. Recarga la página.");
                      setSavingTraining(false);
                      return;
                    }
                    const res = await fetch("/api/save-plan", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        clientId: id,
                        type: "training",
                        data: { days: editTrainingData },
                      }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: "Error desconocido" }));
                      alert(err.error || "Error al guardar");
                      setSavingTraining(false);
                      return;
                    }
                    const trainingData = { days: editTrainingData, admin_updated_at: new Date().toISOString() };
                    setTrainingPlan({ ...trainingPlan, data: trainingData });
                    setEditingTraining(false);
                  } catch (err) {
                    alert(`Error inesperado: ${err}`);
                  } finally {
                    setSavingTraining(false);
                  }
                }}
                disabled={savingTraining}
                className="flex-1 flex items-center justify-center gap-2 gradient-primary text-black font-bold text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {savingTraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </button>
              <button
                onClick={() => setEditingTraining(false)}
                className="px-4 py-2.5 text-sm text-muted border border-card-border rounded-xl hover:bg-card-border/20"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nutrition Plan Detail */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <button
          onClick={() => setExpandNutrition(!expandNutrition)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-bold text-sm flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            Plan de Nutricion
            {nutritionMeals.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                {nutritionMeals.length} comidas
              </span>
            )}
          </h3>
          {nutritionMeals.length > 0 && (
            expandNutrition ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </button>

        {nutritionMeals.length === 0 && (
          <p className="text-sm text-muted mt-2">Sin plan asignado</p>
        )}

        {expandNutrition && nutritionMeals.length > 0 && !editingNutrition && (
          <div className="mt-4 space-y-3">
            {nutritionNotes.length > 0 && (
              <div className="bg-warning/5 border border-warning/20 rounded-xl p-3">
                <p className="font-bold text-warning text-xs mb-1">IMPORTANTE</p>
                <ul className="space-y-0.5">
                  {nutritionNotes.map((note: string, i: number) => (
                    <li key={i} className="text-xs text-muted">{note}</li>
                  ))}
                </ul>
              </div>
            )}
            {nutritionMeals.map((meal: any, i: number) => (
              <div key={i} className="bg-card-bg rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    {meal.time && <span className="text-xs text-primary font-bold">{meal.time} — </span>}
                    <span className="font-bold text-sm">{meal.name}</span>
                  </div>
                  {(meal.approxCalories || meal.calories) && (
                    <span className="text-xs text-primary font-semibold">
                      {meal.approxCalories || meal.calories} kcal
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {(meal.foodDetails || []).map((food: any, j: number) => (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <span>{food.name} — {food.grams}g</span>
                      <span className="text-muted">{food.calories}kcal | P:{food.protein}g C:{food.carbs}g G:{food.fat}g</span>
                    </div>
                  ))}
                  {(!meal.foodDetails || meal.foodDetails.length === 0) && (meal.foods || []).map((food: string, j: number) => (
                    <p key={j} className="text-xs text-muted">{food}</p>
                  ))}
                </div>
              </div>
            ))}
            {/* Resumen nutricional */}
            {(() => {
              const tC = nutritionMeals.reduce((s: number, m: any) => s + (m.approxCalories || 0), 0);
              const tP = nutritionMeals.reduce((s: number, m: any) => s + (m.approxProtein || 0), 0);
              const tCb = nutritionMeals.reduce((s: number, m: any) => s + (m.approxCarbs || 0), 0);
              const tF = nutritionMeals.reduce((s: number, m: any) => s + (m.approxFats || 0), 0);
              const dC = tC > 0 ? tC : (survey?.target_calories || 0);
              const dP = tP > 0 ? tP : (survey?.protein || 0);
              const dCb2 = tCb > 0 ? tCb : (survey?.carbs || 0);
              const dF = tF > 0 ? tF : (survey?.fats || 0);
              const userTdee = survey?.tdee || 0;

              // Determine goal label comparing meal plan calories vs survey target
              let gLabel = ""; let gIcon = ""; let gColor = "";
              const surveyTarget = survey?.target_calories || 0;
              if (surveyTarget > 0 && dC > 0) {
                const diff = dC - surveyTarget;
                if (diff < -50) { gLabel = "Deficit calorico"; gIcon = "🔥"; gColor = "text-orange-400"; }
                else if (diff > 50) { gLabel = "Superavit calorico"; gIcon = "💪"; gColor = "text-blue-400"; }
                else { gLabel = "Mantenimiento"; gIcon = "⚖️"; gColor = "text-emerald-400"; }
              } else { gLabel = "Personalizado"; gIcon = "🎯"; gColor = "text-primary"; }

              const totMC = (dP * 4) + (dCb2 * 4) + (dF * 9);
              const pp = totMC > 0 ? Math.round((dP * 4 / totMC) * 100) : 0;
              const cp = totMC > 0 ? Math.round((dCb2 * 4 / totMC) * 100) : 0;
              const fp = totMC > 0 ? Math.round((dF * 9 / totMC) * 100) : 0;

              return dC > 0 ? (
                <div className="bg-card-bg rounded-xl p-4 border border-primary/20">
                  <p className="text-xs font-bold mb-3">📊 Resumen del Plan</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span>{gIcon}</span>
                    <span className={`text-xs font-bold ${gColor}`}>{gLabel}</span>
                    {userTdee > 0 && <span className="text-[10px] text-muted ml-auto">TDEE: {userTdee} | Plan: {dC} kcal ({dC > userTdee ? "+" : ""}{dC - userTdee})</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-primary/10">
                      <p className="text-sm font-black text-primary">{dC}</p>
                      <p className="text-[9px] text-muted">kcal</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-500/10">
                      <p className="text-sm font-black text-red-400">{dP}g</p>
                      <p className="text-[9px] text-muted">Prot {pp}%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                      <p className="text-sm font-black text-yellow-400">{dCb2}g</p>
                      <p className="text-[9px] text-muted">Carbs {cp}%</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-500/10">
                      <p className="text-sm font-black text-blue-400">{dF}g</p>
                      <p className="text-[9px] text-muted">Grasas {fp}%</p>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex">
                    <div className="bg-red-400 h-full" style={{ width: `${pp}%` }} />
                    <div className="bg-yellow-400 h-full" style={{ width: `${cp}%` }} />
                    <div className="bg-blue-400 h-full" style={{ width: `${fp}%` }} />
                  </div>
                </div>
              ) : null;
            })()}

            <button
              onClick={() => {
                setEditNutritionData(JSON.parse(JSON.stringify(nutritionMeals)));
                setEditingNutrition(true);
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-primary font-bold py-2 border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
            >
              <Edit className="h-4 w-4" /> Editar Nutricion
            </button>
          </div>
        )}

        {/* Inline nutrition editing */}
        {expandNutrition && editingNutrition && (
          <div className="mt-4 space-y-4">
            {/* Calorie adjustment controls */}
            {(() => {
              const currentCals = editNutritionData.reduce((s: number, m: any) => s + (m.approxCalories || 0), 0);
              const adjustCalories = (delta: number) => {
                if (currentCals <= 0) return;
                const targetCals = Math.max(1200, currentCals + delta);
                const ratio = targetCals / currentCals;
                const adjusted = editNutritionData.map((meal: any) => {
                  const newFoods = (meal.foods || []).map((food: string) => {
                    const match = food.match(/^(\d+)\s*g\s+(.+)/i);
                    if (match) {
                      const newGrams = Math.round(parseInt(match[1]) * ratio);
                      return `${newGrams}g ${match[2]}`;
                    }
                    return food;
                  });
                  const newFoodDetails = (meal.foodDetails || []).map((fd: any) => {
                    const r = ratio;
                    return {
                      ...fd,
                      grams: Math.round(fd.grams * r),
                      calories: Math.round(fd.calories * r),
                      protein: Math.round(fd.protein * r),
                      carbs: Math.round(fd.carbs * r),
                      fat: Math.round(fd.fat * r),
                    };
                  });
                  const newApproxCals = newFoodDetails.length > 0
                    ? newFoodDetails.reduce((s: number, fd: any) => s + fd.calories, 0)
                    : Math.round((meal.approxCalories || 0) * ratio);
                  return {
                    ...meal,
                    foods: newFoods,
                    foodDetails: newFoodDetails.length > 0 ? newFoodDetails : meal.foodDetails,
                    approxCalories: newApproxCals,
                    approxProtein: newFoodDetails.length > 0 ? Math.round(newFoodDetails.reduce((s: number, fd: any) => s + fd.protein, 0)) : Math.round((meal.approxProtein || 0) * ratio),
                    approxCarbs: newFoodDetails.length > 0 ? Math.round(newFoodDetails.reduce((s: number, fd: any) => s + fd.carbs, 0)) : Math.round((meal.approxCarbs || 0) * ratio),
                    approxFats: newFoodDetails.length > 0 ? Math.round(newFoodDetails.reduce((s: number, fd: any) => s + fd.fat, 0)) : Math.round((meal.approxFats || 0) * ratio),
                  };
                });
                setEditNutritionData(adjusted);
              };

              return currentCals > 0 ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs font-bold mb-3 flex items-center gap-2">
                    ⚡ Ajustar Calorias del Plan
                    <span className="text-primary font-black text-sm ml-auto">{currentCals} kcal</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustCalories(-100)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors">
                      -100
                    </button>
                    <button onClick={() => adjustCalories(-50)}
                      className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/30 transition-colors">
                      -50
                    </button>
                    <div className="flex-1 text-center">
                      <div className="w-full h-1.5 rounded-full bg-card-border overflow-hidden">
                        <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(10, (currentCals / (survey?.tdee || 2500)) * 100))}%` }} />
                      </div>
                      <p className="text-[9px] text-muted mt-1">
                        {survey?.tdee ? `${Math.round(((currentCals / survey.tdee) - 1) * 100)}% vs TDEE (${survey.tdee})` : ""}
                      </p>
                    </div>
                    <button onClick={() => adjustCalories(50)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors">
                      +50
                    </button>
                    <button onClick={() => adjustCalories(100)}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/30 transition-colors">
                      +100
                    </button>
                  </div>
                  <p className="text-[9px] text-muted mt-2 text-center">Los gramos de cada alimento se ajustan proporcionalmente</p>
                </div>
              ) : null;
            })()}

            {editNutritionData.map((meal: any, mealIdx: number) => (
              <div key={mealIdx} className="bg-card-bg rounded-xl p-3">
                <div className="flex gap-2 mb-2">
                  <input
                    value={meal.time || ""}
                    onChange={(e) => {
                      const updated = [...editNutritionData];
                      updated[mealIdx] = { ...meal, time: e.target.value };
                      setEditNutritionData(updated);
                    }}
                    className="w-16 bg-card-border/20 rounded px-2 py-1 text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Hora"
                  />
                  <input
                    value={meal.name}
                    onChange={(e) => {
                      const updated = [...editNutritionData];
                      updated[mealIdx] = { ...meal, name: e.target.value };
                      setEditNutritionData(updated);
                    }}
                    className="flex-1 bg-transparent font-bold text-sm border-b border-card-border/50 pb-1 focus:outline-none focus:border-primary"
                    placeholder="Nombre comida"
                  />
                </div>
                <div className="space-y-1.5">
                  {(meal.foods || []).map((food: string, foodIdx: number) => {
                    // Parse existing food string to extract grams and name
                    const gramsMatch = food.match(/^(\d+)\s*g\s+(.+)/i);
                    const originalGrams = gramsMatch ? parseInt(gramsMatch[1]) : 100;
                    const originalName = gramsMatch ? gramsMatch[2] : food;
                    const originalDbFood = originalName ? findFoodByName(originalName) : undefined;
                    const isActive = foodSearch?.mealIdx === mealIdx && foodSearch?.foodIdx === foodIdx;
                    const query = isActive ? foodSearch.query : "";

                    // Build smart food list: same category first with calculated grams
                    const getSortedFoods = () => {
                      const searchTerm = query.toLowerCase();
                      const filtered = FOOD_DATABASE.filter(f =>
                        !searchTerm || f.name.toLowerCase().includes(searchTerm)
                      );
                      if (originalDbFood) {
                        const sameCategory = filtered.filter(f => f.category === originalDbFood.category && f.id !== originalDbFood.id);
                        const otherCategory = filtered.filter(f => f.category !== originalDbFood.category);
                        return { sameCategory, otherCategory };
                      }
                      return { sameCategory: [], otherCategory: filtered };
                    };

                    // Calculate live macros for this food
                    const liveMacros = originalDbFood ? calculateFoodMacros(originalDbFood, originalGrams) : null;

                    return (
                    <div key={foodIdx} className="flex items-center gap-1.5">
                      {/* Grams input */}
                      <input
                        type="number"
                        value={originalGrams}
                        onChange={(e) => {
                          const newGrams = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = [...editNutritionData];
                          const foods = [...(updated[mealIdx].foods || [])];
                          foods[foodIdx] = `${newGrams}g ${originalName}`;
                          updated[mealIdx] = { ...meal, foods };
                          setEditNutritionData(updated);
                        }}
                        className="w-14 bg-card-border/20 rounded px-1.5 py-1.5 text-xs text-center font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        min={0}
                        step={5}
                      />
                      <span className="text-[10px] text-muted">g</span>
                      <div className="flex-1 relative">
                        <button
                          onClick={() => setFoodSearch(isActive ? null : { mealIdx, foodIdx, query: "" })}
                          className="w-full bg-card-border/20 rounded px-2 py-1.5 text-xs text-left focus:outline-none focus:ring-1 focus:ring-primary hover:bg-card-border/30 transition-colors truncate"
                        >
                          {originalName || <span className="text-muted">Seleccionar...</span>}
                        </button>
                        {isActive && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card-bg border border-card-border rounded-xl max-h-64 overflow-y-auto shadow-xl">
                            <div className="sticky top-0 bg-card-bg p-2 border-b border-card-border/50">
                              <input
                                autoFocus
                                value={query}
                                onChange={(e) => setFoodSearch({ mealIdx, foodIdx, query: e.target.value })}
                                className="w-full bg-card-border/20 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Buscar alimento..."
                              />
                            </div>
                            {(() => {
                              const { sameCategory, otherCategory } = getSortedFoods();
                              const renderFoodOption = (f: typeof FOOD_DATABASE[0]) => {
                                const newGrams = originalDbFood
                                  ? calculateSwapGrams(originalDbFood, originalGrams, f)
                                  : 100;
                                const macros = calculateFoodMacros(f, newGrams);
                                return (
                                  <button
                                    key={f.id}
                                    onClick={() => {
                                      const updated = [...editNutritionData];
                                      const foods = [...(updated[mealIdx].foods || [])];
                                      foods[foodIdx] = `${newGrams}g ${f.name}`;
                                      updated[mealIdx] = { ...meal, foods };
                                      setEditNutritionData(updated);
                                      setFoodSearch(null);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-primary/10 text-xs text-left gap-2"
                                  >
                                    <span className="flex-1 font-medium">{f.name}</span>
                                    <span className="text-[10px] text-primary font-bold whitespace-nowrap">{newGrams}g</span>
                                    <span className="text-[10px] text-muted whitespace-nowrap">{macros.calories}kcal</span>
                                  </button>
                                );
                              };
                              return (
                                <>
                                  {sameCategory.length > 0 && (
                                    <>
                                      <div className="px-3 py-1.5 text-[10px] font-bold text-primary/70 uppercase tracking-wider bg-primary/5">
                                        Mismo tipo ({originalDbFood?.category})
                                      </div>
                                      {sameCategory.slice(0, 15).map(renderFoodOption)}
                                    </>
                                  )}
                                  {otherCategory.length > 0 && (
                                    <>
                                      {sameCategory.length > 0 && (
                                        <div className="px-3 py-1.5 text-[10px] font-bold text-muted/70 uppercase tracking-wider bg-card-border/10">
                                          Otros alimentos
                                        </div>
                                      )}
                                      {otherCategory.slice(0, 10).map(renderFoodOption)}
                                    </>
                                  )}
                                  {sameCategory.length === 0 && otherCategory.length === 0 && (
                                    <button
                                      onClick={() => {
                                        const updated = [...editNutritionData];
                                        const foods = [...(updated[mealIdx].foods || [])];
                                        foods[foodIdx] = query;
                                        updated[mealIdx] = { ...meal, foods };
                                        setEditNutritionData(updated);
                                        setFoodSearch(null);
                                      }}
                                      className="w-full px-3 py-2 text-xs text-left text-primary hover:bg-primary/10"
                                    >
                                      Usar: &quot;{query}&quot;
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      {/* Live macros */}
                      {liveMacros && (
                        <span className="text-[9px] text-muted whitespace-nowrap hidden sm:inline">
                          {liveMacros.calories}kcal
                        </span>
                      )}
                      <button
                        onClick={() => {
                          const updated = [...editNutritionData];
                          const foods = [...(updated[mealIdx].foods || [])];
                          foods.splice(foodIdx, 1);
                          updated[mealIdx] = { ...meal, foods };
                          setEditNutritionData(updated);
                        }}
                        className="text-danger/60 hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      const updated = [...editNutritionData];
                      const foods = [...(updated[mealIdx].foods || []), ""];
                      updated[mealIdx] = { ...meal, foods };
                      setEditNutritionData(updated);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Agregar alimento
                  </button>
                  {/* Live meal macros summary */}
                  {(() => {
                    const mealTotals = (meal.foods || []).reduce((acc: { cal: number; p: number; c: number; f: number }, foodStr: string) => {
                      const m = foodStr.match(/^(\d+)\s*g\s+(.+)/i);
                      if (m) {
                        const db = findFoodByName(m[2]);
                        if (db) {
                          const mc = calculateFoodMacros(db, parseInt(m[1]));
                          return { cal: acc.cal + mc.calories, p: acc.p + mc.protein, c: acc.c + mc.carbs, f: acc.f + mc.fat };
                        }
                      }
                      return acc;
                    }, { cal: 0, p: 0, c: 0, f: 0 });
                    return mealTotals.cal > 0 ? (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-card-border/30">
                        <span className="text-[10px] font-bold text-primary">{mealTotals.cal} kcal</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">P:{mealTotals.p}g</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded">C:{mealTotals.c}g</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">G:{mealTotals.f}g</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            ))}

            {/* Total plan macros */}
            {(() => {
              const totals = editNutritionData.reduce((acc: { cal: number; p: number; c: number; f: number }, meal: { foods?: string[] }) => {
                (meal.foods || []).forEach((foodStr: string) => {
                  const m = foodStr.match(/^(\d+)\s*g\s+(.+)/i);
                  if (m) {
                    const db = findFoodByName(m[2]);
                    if (db) {
                      const mc = calculateFoodMacros(db, parseInt(m[1]));
                      acc.cal += mc.calories;
                      acc.p += mc.protein;
                      acc.c += mc.carbs;
                      acc.f += mc.fat;
                    }
                  }
                });
                return acc;
              }, { cal: 0, p: 0, c: 0, f: 0 });
              return totals.cal > 0 ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs font-bold mb-2">Resumen del Plan (en vivo)</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded-lg bg-primary/10">
                      <p className="text-sm font-black text-primary">{totals.cal}</p>
                      <p className="text-[9px] text-muted">kcal</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-500/10">
                      <p className="text-sm font-black text-red-400">{totals.p}g</p>
                      <p className="text-[9px] text-muted">Prot</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-500/10">
                      <p className="text-sm font-black text-yellow-400">{totals.c}g</p>
                      <p className="text-[9px] text-muted">Carbs</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-blue-500/10">
                      <p className="text-sm font-black text-blue-400">{totals.f}g</p>
                      <p className="text-[9px] text-muted">Grasas</p>
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            <button
              onClick={() => {
                setEditNutritionData([...editNutritionData, { name: "", time: "", foods: [""] }]);
              }}
              className="w-full flex items-center justify-center gap-1 text-xs text-primary font-bold py-2 border border-dashed border-primary/30 rounded-xl hover:bg-primary/5"
            >
              <Plus className="h-3 w-3" /> Agregar comida
            </button>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setSavingNutrition(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                      alert("Sesión expirada. Recarga la página.");
                      setSavingNutrition(false);
                      return;
                    }
                    const res = await fetch("/api/save-plan", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        clientId: id,
                        type: "nutrition",
                        data: {
                          meals: editNutritionData.map((meal: any) => {
                            // Rebuild foodDetails from edited foods strings
                            const newFoodDetails = (meal.foods || []).map((foodStr: string) => {
                              const gramsMatch = foodStr.match(/^(\d+)\s*g\s+(.+)/i);
                              const unitsMatch = foodStr.match(/^(\d+)\s+(.+)/i);
                              if (gramsMatch) {
                                const grams = parseInt(gramsMatch[1]);
                                const name = gramsMatch[2].trim();
                                const dbFood = findFoodByName(name);
                                if (dbFood) {
                                  const macros = calculateFoodMacros(dbFood, grams);
                                  return { name: dbFood.name, grams, unit: "g", ...macros };
                                }
                                return { name, grams, unit: "g", calories: 0, protein: 0, carbs: 0, fat: 0 };
                              } else if (unitsMatch) {
                                const units = parseInt(unitsMatch[1]);
                                const name = unitsMatch[2].trim();
                                const dbFood = findFoodByName(name);
                                if (dbFood) {
                                  const defaultGrams = units * 50;
                                  const macros = calculateFoodMacros(dbFood, defaultGrams);
                                  return { name: dbFood.name, grams: defaultGrams, unit: "u", ...macros };
                                }
                                return { name, grams: 0, unit: "u", calories: 0, protein: 0, carbs: 0, fat: 0 };
                              }
                              return { name: foodStr, grams: 0, unit: "", calories: 0, protein: 0, carbs: 0, fat: 0 };
                            });
                            const approxCalories = newFoodDetails.reduce((s: number, fd: any) => s + (fd.calories || 0), 0);
                            const approxProtein = newFoodDetails.reduce((s: number, fd: any) => s + (fd.protein || 0), 0);
                            const approxCarbs = newFoodDetails.reduce((s: number, fd: any) => s + (fd.carbs || 0), 0);
                            const approxFats = newFoodDetails.reduce((s: number, fd: any) => s + (fd.fat || 0), 0);
                            return {
                              ...meal,
                              foodDetails: newFoodDetails,
                              approxCalories,
                              approxProtein,
                              approxCarbs,
                              approxFats,
                            };
                          }),
                          importantNotes: nutritionNotes,
                        },
                      }),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({ error: "Error desconocido" }));
                      alert(err.error || "Error al guardar");
                      setSavingNutrition(false);
                      return;
                    }
                    // Rebuild local state with synced foodDetails
                    const savedMeals = editNutritionData.map((meal: any) => {
                      const newFoodDetails = (meal.foods || []).map((foodStr: string) => {
                        const gramsMatch = foodStr.match(/^(\d+)\s*g\s+(.+)/i);
                        if (gramsMatch) {
                          const grams = parseInt(gramsMatch[1]);
                          const name = gramsMatch[2].trim();
                          const dbFood = findFoodByName(name);
                          if (dbFood) {
                            const macros = calculateFoodMacros(dbFood, grams);
                            return { name: dbFood.name, grams, unit: "g", ...macros };
                          }
                          return { name, grams, unit: "g", calories: 0, protein: 0, carbs: 0, fat: 0 };
                        }
                        return { name: foodStr, grams: 0, unit: "", calories: 0, protein: 0, carbs: 0, fat: 0 };
                      });
                      return {
                        ...meal,
                        foodDetails: newFoodDetails,
                        approxCalories: newFoodDetails.reduce((s: number, fd: any) => s + (fd.calories || 0), 0),
                        approxProtein: newFoodDetails.reduce((s: number, fd: any) => s + (fd.protein || 0), 0),
                        approxCarbs: newFoodDetails.reduce((s: number, fd: any) => s + (fd.carbs || 0), 0),
                        approxFats: newFoodDetails.reduce((s: number, fd: any) => s + (fd.fat || 0), 0),
                      };
                    });
                    const nutritionData = { meals: savedMeals, admin_updated_at: new Date().toISOString() };
                    setNutritionPlan({ ...nutritionPlan, data: nutritionData, important_notes: nutritionNotes });
                    setEditingNutrition(false);
                  } catch (err) {
                    alert(`Error inesperado: ${err}`);
                  } finally {
                    setSavingNutrition(false);
                  }
                }}
                disabled={savingNutrition}
                className="flex-1 flex items-center justify-center gap-2 gradient-primary text-black font-bold text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {savingNutrition ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar Cambios
              </button>
              <button
                onClick={() => setEditingNutrition(false)}
                className="px-4 py-2.5 text-sm text-muted border border-card-border rounded-xl hover:bg-card-border/20"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Section */}
      <div className="mb-6">
        <button
          onClick={() => setExpandProgress(!expandProgress)}
          className="w-full glass-card rounded-2xl p-5 flex items-center justify-between"
        >
          <h3 className="font-bold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Progreso del Cliente
            {progressEntries.length > 0 && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                {progressEntries.length} registros
              </span>
            )}
          </h3>
          {progressEntries.length > 0 ? (
            expandProgress ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />
          ) : (
            <span className="text-sm text-muted">Sin registros</span>
          )}
        </button>

        {expandProgress && progressEntries.length > 0 && (() => {
          const latest = progressEntries.find(e => e.weight);
          const initial = [...progressEntries].reverse().find(e => e.weight);
          const currentWeight = latest?.weight || null;
          const initialWeight = initial?.weight || survey?.weight || null;
          const totalDiff = initialWeight && currentWeight ? Number((initialWeight - currentWeight).toFixed(1)) : null;

          const firstWaist = [...progressEntries].reverse().find(e => e.waist)?.waist || null;
          const latestWaist = progressEntries.find(e => e.waist)?.waist || null;
          const waistDiff = firstWaist && latestWaist ? Number((firstWaist - latestWaist).toFixed(1)) : null;

          const entriesWithPhotos = progressEntries.filter(e => e.photo_front || e.photo_side || e.photo_back);
          const firstPhoto = entriesWithPhotos.length > 0 ? entriesWithPhotos[entriesWithPhotos.length - 1] : null;
          const latestPhoto = entriesWithPhotos.length > 1 ? entriesWithPhotos[0] : null;

          const macrosData = survey ? { calories: survey.target_calories, protein: survey.protein, carbs: survey.carbs, fats: survey.fats } : null;

          return (
            <div className="mt-4 space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="glass-card rounded-xl p-3 text-center">
                  <Scale className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-black">{currentWeight || "-"}<span className="text-xs text-muted">kg</span></p>
                  <p className="text-[10px] text-muted">Peso actual</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className={`text-lg font-black ${totalDiff && totalDiff > 0 ? "text-primary" : ""}`}>
                    {totalDiff !== null ? `${totalDiff > 0 ? "-" : "+"}${Math.abs(totalDiff)}` : "-"}<span className="text-xs text-muted">kg</span>
                  </p>
                  <p className="text-[10px] text-muted">Cambio peso</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <Ruler className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className={`text-lg font-black ${waistDiff && waistDiff > 0 ? "text-primary" : ""}`}>
                    {waistDiff !== null ? `${waistDiff > 0 ? "-" : "+"}${Math.abs(waistDiff)}` : "-"}<span className="text-xs text-muted">cm</span>
                  </p>
                  <p className="text-[10px] text-muted">Cintura</p>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                  <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-black">{progressEntries.length}</p>
                  <p className="text-[10px] text-muted">Registros</p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WeightChart entries={progressEntries} initialWeight={survey?.weight} />
                <MacrosPieChart macros={macrosData} />
                <MeasurementsBarChart entries={progressEntries} />
                <MeasurementsChangeChart entries={progressEntries} />
                <WeightChangeBarChart entries={progressEntries} />
                <MeasurementsLineChart entries={progressEntries} />
              </div>

              {/* Exercise Progress */}
              <ExerciseProgressCharts logs={exerciseLogs} />

              {/* Progress Photos */}
              {firstPhoto && (
                <div className="glass-card rounded-2xl p-4">
                  <p className="text-xs font-bold text-muted mb-3 flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    {latestPhoto ? "Antes / Despues" : "Fotos de Progreso"}
                  </p>
                  <div className={`grid ${latestPhoto ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
                    <div>
                      <p className="text-[10px] text-muted mb-1 text-center">
                        {latestPhoto ? "Inicio" : ""} — {new Date(firstPhoto.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {[firstPhoto.photo_front, firstPhoto.photo_side, firstPhoto.photo_back].map((path, i) => (
                          <div key={i} className="aspect-[3/4] rounded-lg bg-card-bg overflow-hidden">
                            {path && photoUrls[path] ? (
                              <img src={photoUrls[path]} alt={["Frente", "Perfil", "Espalda"][i]} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Camera className="h-3 w-3 text-muted" /></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {latestPhoto && (
                      <div>
                        <p className="text-[10px] text-muted mb-1 text-center">
                          Actual — {new Date(latestPhoto.date).toLocaleDateString("es", { day: "numeric", month: "short" })}
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                          {[latestPhoto.photo_front, latestPhoto.photo_side, latestPhoto.photo_back].map((path, i) => (
                            <div key={i} className="aspect-[3/4] rounded-lg bg-card-bg overflow-hidden">
                              {path && photoUrls[path] ? (
                                <img src={photoUrls[path]} alt={["Frente", "Perfil", "Espalda"][i]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Camera className="h-3 w-3 text-muted" /></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* History */}
              <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-bold text-muted mb-3">Historial</p>
                <div className="space-y-1.5">
                  {progressEntries.map((entry, i) => {
                    const prev = progressEntries[i + 1];
                    const diff = prev?.weight && entry.weight ? Number((entry.weight - prev.weight).toFixed(1)) : 0;
                    return (
                      <div key={entry.id} className="bg-card-bg rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium">
                            {new Date(entry.date).toLocaleDateString("es", { day: "numeric", month: "long" })}
                          </p>
                          <p className="text-[10px] text-muted">
                            {[
                              entry.waist ? `Cintura: ${entry.waist}cm` : null,
                              entry.chest ? `Pecho: ${entry.chest}cm` : null,
                              entry.arms ? `Brazos: ${entry.arms}cm` : null,
                            ].filter(Boolean).join(" | ") || entry.notes || "Sin medidas"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold">{entry.weight ? `${entry.weight}kg` : "-"}</p>
                          {diff !== 0 && (
                            <p className={`text-[10px] font-bold ${diff < 0 ? "text-primary" : "text-danger"}`}>
                              {diff > 0 ? "+" : ""}{diff}kg
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
