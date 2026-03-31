"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, ClipboardList, TrendingUp,
  Calendar, Target, Scale, Mail, Phone, Edit,
  Dumbbell, UtensilsCrossed, Camera, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<ClientData | null>(null);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileData) setClient(profileData);

    const { data: surveyData } = await supabase
      .from("surveys")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (surveyData) setSurvey(surveyData);

    setLoading(false);
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
          <Link
            href={`/admin/clientes/${id}/plan-editor`}
            className="mt-3 inline-flex items-center gap-2 gradient-primary text-black font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Edit className="h-4 w-4" /> Crear/Editar Plan Personalizado
          </Link>
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
    </div>
  );
}
