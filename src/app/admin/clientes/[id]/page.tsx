"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, ClipboardList, TrendingUp,
  Calendar, Target, Scale, Mail, Phone, Edit,
  Dumbbell, UtensilsCrossed, Camera, Loader2, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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
}

interface SubscriptionData {
  id: string;
  duration: string;
  status: string;
  start_date: string;
  end_date: string;
  amount_paid: number;
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
  const [hasTrainingPlan, setHasTrainingPlan] = useState(false);
  const [hasNutritionPlan, setHasNutritionPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      loadClient();
    }
  }, [id, authLoading, user]);

  const loadClient = async () => {
    try {
      // Perfil del cliente
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (profileData) setClient(profileData);

      // Survey
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (surveyData) setSurvey(surveyData);

      // Subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (subData) setSubscription(subData);

      // Check if training/nutrition plans exist
      const { count: trainingCount } = await supabase
        .from("training_plans")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id);
      setHasTrainingPlan((trainingCount || 0) > 0);

      const { count: nutritionCount } = await supabase
        .from("nutrition_plans")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id);
      setHasNutritionPlan((nutritionCount || 0) > 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
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
          </div>
          <p className="text-xs text-muted mt-1">
            Registrado: {new Date(client.created_at).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
          </p>
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
              <p className="text-xs text-muted mb-3">Se eliminara la cuenta, encuesta, suscripcion y todos los datos. Esta accion no se puede deshacer.</p>
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
          {/* Survey Data */}
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

          {/* Macros */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Macros Calculados
            </h2>
            <div className="space-y-3">
              <div className="bg-card-bg rounded-lg p-3 text-center">
                <p className="text-xs text-muted">Calorías/día</p>
                <p className="text-2xl font-black text-primary">{survey.target_calories}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card-bg rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted">Proteínas</p>
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
          <p className="text-muted">Este cliente aún no completó la encuesta.</p>
        </div>
      )}

      {/* Subscription & Plans Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Suscripción
          </h3>
          {subscription ? (
            <div className="space-y-1 text-sm">
              <p>Estado: <span className={subscription.status === "active" ? "text-primary font-bold" : "text-danger font-bold"}>{subscription.status === "active" ? "Activa" : subscription.status}</span></p>
              <p className="text-muted">Duración: {subscription.duration}</p>
              <p className="text-muted">Inicio: {new Date(subscription.start_date).toLocaleDateString("es")}</p>
              <p className="text-muted">Fin: {new Date(subscription.end_date).toLocaleDateString("es")}</p>
              <p className="text-muted">Pagado: ${subscription.amount_paid}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Sin suscripción</p>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-primary" />
            Plan de Entrenamiento
          </h3>
          {hasTrainingPlan ? (
            <p className="text-sm text-primary font-medium">Plan asignado</p>
          ) : (
            <p className="text-sm text-muted">Sin plan asignado</p>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            Plan de Nutrición
          </h3>
          {hasNutritionPlan ? (
            <p className="text-sm text-primary font-medium">Plan asignado</p>
          ) : (
            <p className="text-sm text-muted">Sin plan asignado</p>
          )}
        </div>
      </div>
    </div>
  );
}
