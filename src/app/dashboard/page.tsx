"use client";

import Link from "next/link";
import {
  Flame, TrendingUp, ClipboardList, Camera,
  ArrowRight, Calendar, Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Mock data - will be replaced with Supabase
const MOCK_USER = {
  name: "Cliente Demo",
  plan: "Quema Grasa",
  duration: "3 Meses",
  startDate: "2026-03-01",
  endDate: "2026-06-01",
  macros: { calories: 2100, protein: 150, carbs: 220, fats: 70 },
  currentWeight: 82,
  startWeight: 88,
  daysActive: 30,
};

export default function DashboardPage() {
  const { profile, subscription } = useAuth();
  const userName = profile?.full_name || MOCK_USER.name;
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(MOCK_USER.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
  const weightLost = MOCK_USER.startWeight - MOCK_USER.currentWeight;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black">Hola, {userName}</h1>
        <p className="text-muted">Tu resumen de progreso</p>
      </div>

      {/* Plan Info */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="font-bold">{MOCK_USER.plan}</p>
              <p className="text-sm text-muted">{MOCK_USER.duration}</p>
            </div>
          </div>
          <Link href="/dashboard/plan" className="text-primary text-sm hover:underline flex items-center gap-1">
            Ver plan <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card-bg rounded-xl p-3 text-center">
            <p className="text-xs text-muted">Calorías/día</p>
            <p className="text-xl font-black text-primary">{MOCK_USER.macros.calories}</p>
          </div>
          <div className="bg-card-bg rounded-xl p-3 text-center">
            <p className="text-xs text-muted">Proteínas</p>
            <p className="text-xl font-black text-red-400">{MOCK_USER.macros.protein}g</p>
          </div>
          <div className="bg-card-bg rounded-xl p-3 text-center">
            <p className="text-xs text-muted">Carbos</p>
            <p className="text-xl font-black text-yellow-400">{MOCK_USER.macros.carbs}g</p>
          </div>
          <div className="bg-card-bg rounded-xl p-3 text-center">
            <p className="text-xs text-muted">Grasas</p>
            <p className="text-xl font-black text-blue-400">{MOCK_USER.macros.fats}g</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{weightLost}kg</p>
          <p className="text-xs text-muted">Perdidos</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Calendar className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{MOCK_USER.daysActive}</p>
          <p className="text-xs text-muted">Días activo</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Target className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{MOCK_USER.currentWeight}kg</p>
          <p className="text-xs text-muted">Peso actual</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Calendar className="h-5 w-5 text-warning mb-2" />
          <p className="text-2xl font-black">{daysRemaining}</p>
          <p className="text-xs text-muted">Días restantes</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="font-bold text-lg mb-4">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/plan"
          className="glass-card rounded-2xl p-5 hover-glow transition-all group"
        >
          <ClipboardList className="h-6 w-6 text-primary mb-3" />
          <p className="font-bold group-hover:text-primary transition-colors">Ver Mi Plan</p>
          <p className="text-sm text-muted">Entrenamiento y nutrición de hoy</p>
        </Link>
        <Link
          href="/dashboard/progreso"
          className="glass-card rounded-2xl p-5 hover-glow transition-all group"
        >
          <Camera className="h-6 w-6 text-primary mb-3" />
          <p className="font-bold group-hover:text-primary transition-colors">Registrar Progreso</p>
          <p className="text-sm text-muted">Subir fotos y peso</p>
        </Link>
        <Link
          href="/dashboard/ejercicios"
          className="glass-card rounded-2xl p-5 hover-glow transition-all group"
        >
          <Target className="h-6 w-6 text-primary mb-3" />
          <p className="font-bold group-hover:text-primary transition-colors">Ejercicios</p>
          <p className="text-sm text-muted">Videos y técnica correcta</p>
        </Link>
      </div>
    </div>
  );
}
