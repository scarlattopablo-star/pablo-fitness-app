"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, ClipboardList, TrendingUp,
  Calendar, Target, Scale, Mail, Phone, Edit,
  Dumbbell, UtensilsCrossed, Info, Camera,
} from "lucide-react";

// Mock client detail
const MOCK_CLIENT = {
  id: "1",
  name: "Lorena Vazquez",
  email: "lorena@email.com",
  phone: "+598 99 456 789",
  plan: "Quema Grasa",
  duration: "3 Meses",
  startDate: "2026-01-15",
  endDate: "2026-04-15",
  status: "active",
  survey: {
    age: 32,
    sex: "Mujer",
    weight: 75,
    height: 165,
    activity: "Moderado",
    restrictions: "Sin lactosa",
  },
  macros: {
    calories: 1680,
    protein: 150,
    carbs: 145,
    fats: 50,
  },
  progress: [
    { date: "2026-03-15", weight: 68 },
    { date: "2026-03-01", weight: 70 },
    { date: "2026-02-15", weight: 72 },
    { date: "2026-02-01", weight: 73 },
    { date: "2026-01-15", weight: 75 },
  ],
};

export default function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const client = MOCK_CLIENT;
  const weightLost = client.survey.weight - client.progress[0].weight;

  return (
    <div>
      <Link href="/admin/clientes" className="inline-flex items-center gap-2 text-muted hover:text-white mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Volver a clientes
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xl font-bold text-primary">{client.name[0]}</span>
        </div>
        <div>
          <h1 className="text-2xl font-black">{client.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</span>
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phone}</span>
          </div>
          <Link
            href={`/admin/clientes/${id}/plan-editor`}
            className="mt-2 inline-flex items-center gap-2 gradient-primary text-black font-semibold text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Edit className="h-4 w-4" /> Crear/Editar Plan Personalizado
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Info */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Plan Activo
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Plan</span><span className="font-medium">{client.plan}</span></div>
            <div className="flex justify-between"><span className="text-muted">Duración</span><span>{client.duration}</span></div>
            <div className="flex justify-between"><span className="text-muted">Inicio</span><span>{new Date(client.startDate).toLocaleDateString("es")}</span></div>
            <div className="flex justify-between"><span className="text-muted">Fin</span><span>{new Date(client.endDate).toLocaleDateString("es")}</span></div>
            <div className="flex justify-between">
              <span className="text-muted">Estado</span>
              <span className="text-primary font-bold">Activo</span>
            </div>
          </div>
        </div>

        {/* Survey Data */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Datos de Encuesta
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card-bg rounded-lg p-2.5">
              <p className="text-xs text-muted">Edad</p>
              <p className="font-bold">{client.survey.age}</p>
            </div>
            <div className="bg-card-bg rounded-lg p-2.5">
              <p className="text-xs text-muted">Sexo</p>
              <p className="font-bold">{client.survey.sex}</p>
            </div>
            <div className="bg-card-bg rounded-lg p-2.5">
              <p className="text-xs text-muted">Peso inicial</p>
              <p className="font-bold">{client.survey.weight}kg</p>
            </div>
            <div className="bg-card-bg rounded-lg p-2.5">
              <p className="text-xs text-muted">Altura</p>
              <p className="font-bold">{client.survey.height}cm</p>
            </div>
            <div className="bg-card-bg rounded-lg p-2.5">
              <p className="text-xs text-muted">Actividad</p>
              <p className="font-bold">{client.survey.activity}</p>
            </div>
            <div className="bg-card-bg rounded-lg p-2.5">
              <p className="text-xs text-muted">Restricciones</p>
              <p className="font-bold text-xs">{client.survey.restrictions}</p>
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
              <p className="text-2xl font-black text-primary">{client.macros.calories}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card-bg rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted">Proteínas</p>
                <p className="font-black text-red-400">{client.macros.protein}g</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted">Carbos</p>
                <p className="font-black text-yellow-400">{client.macros.carbs}g</p>
              </div>
              <div className="bg-card-bg rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted">Grasas</p>
                <p className="font-black text-blue-400">{client.macros.fats}g</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progreso
          </h2>
          <span className="text-primary font-bold">-{weightLost}kg</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {[...client.progress].reverse().map((entry, i) => {
            const minW = Math.min(...client.progress.map(p => p.weight));
            const maxW = Math.max(...client.progress.map(p => p.weight));
            const range = maxW - minW || 1;
            const height = ((entry.weight - minW) / range) * 100 + 15;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold">{entry.weight}kg</span>
                <div className="w-full rounded-t-lg gradient-primary" style={{ height: `${height}%` }} />
                <span className="text-[10px] text-muted">
                  {new Date(entry.date).toLocaleDateString("es", { day: "2-digit", month: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Photos */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Fotos de Progreso
        </h2>
        <div className="space-y-4">
          {[
            { date: "15 Mar 2026", label: "Semana 9" },
            { date: "23 Feb 2026", label: "Semana 6" },
            { date: "3 Feb 2026", label: "Semana 3" },
            { date: "15 Ene 2026", label: "Inicio" },
          ].map((entry) => (
            <div key={entry.date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-xs text-muted">{entry.date}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Frente", "Perfil", "Espalda"].map((view) => (
                  <div
                    key={view}
                    className="aspect-[3/4] bg-card-bg border border-card-border rounded-xl flex flex-col items-center justify-center"
                  >
                    <Camera className="h-6 w-6 text-muted mb-1" />
                    <span className="text-[10px] text-muted">{view}</span>
                    <span className="text-[10px] text-primary mt-0.5">Pendiente</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Plan */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Plan de Entrenamiento
          </h2>
          <Link
            href={`/admin/clientes/${id}/plan-editor`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Edit className="h-3 w-3" /> Editar
          </Link>
        </div>
        {[
          {
            day: "Lunes - Pecho y Tríceps",
            exercises: [
              { name: "Press Banca Plano", sets: 4, reps: "10", rest: "90s" },
              { name: "Press Inclinado Mancuernas", sets: 4, reps: "10", rest: "90s" },
              { name: "Aperturas Inclinadas", sets: 4, reps: "12", rest: "60s" },
              { name: "Extensión Tríceps Polea", sets: 4, reps: "12", rest: "60s" },
              { name: "Fondos de Tríceps", sets: 3, reps: "15", rest: "60s" },
            ],
          },
          {
            day: "Martes - Espalda y Bíceps",
            exercises: [
              { name: "Jalón Polea Alta", sets: 4, reps: "10", rest: "90s" },
              { name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
              { name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
              { name: "Curl Bíceps Barra", sets: 4, reps: "10", rest: "60s" },
              { name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
            ],
          },
          {
            day: "Miércoles - Piernas",
            exercises: [
              { name: "Sentadilla con Barra", sets: 4, reps: "10", rest: "120s" },
              { name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
              { name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
              { name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
              { name: "Plancha", sets: 3, reps: "45s", rest: "30s" },
            ],
          },
        ].map((day) => (
          <div key={day.day} className="mb-4 last:mb-0">
            <p className="font-medium text-sm mb-2 text-primary">{day.day}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted border-b border-card-border">
                    <th className="text-left p-2">Ejercicio</th>
                    <th className="text-center p-2">Series</th>
                    <th className="text-center p-2">Reps</th>
                    <th className="text-center p-2">Desc.</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex, i) => (
                    <tr key={i} className="border-b border-card-border/30 last:border-0">
                      <td className="p-2">{ex.name}</td>
                      <td className="p-2 text-center text-primary font-bold">{ex.sets}</td>
                      <td className="p-2 text-center">{ex.reps}</td>
                      <td className="p-2 text-center text-muted">{ex.rest}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Nutrition Plan */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-primary" />
            Plan de Nutrición
          </h2>
          <Link
            href={`/admin/clientes/${id}/plan-editor`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Edit className="h-3 w-3" /> Editar
          </Link>
        </div>

        <div className="glass-card rounded-xl p-3 mb-4 border-l-4 border-warning">
          <p className="font-bold text-warning text-xs mb-1">IMPORTANTE</p>
          <p className="text-xs text-muted">COMER CADA 3 HORAS | TOMAR 3 LITROS DE AGUA | NO AZÚCAR | NO ALCOHOL</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "DESAYUNO", time: "7:00", foods: ["2 huevos revueltos", "30g avena", "1 fruta", "1 café", "Omega 3 + creatina"] },
            { name: "COMIDA 2", time: "10:00", foods: ["Yogurt descremado", "30g avena", "1 manzana", "10g nueces"] },
            { name: "COMIDA 3", time: "13:00", foods: ["150g pollo", "150g boniato", "Ensalada verde"] },
            { name: "COMIDA 4", time: "16:00", foods: ["4 claras de huevo", "2 galletas de arroz", "1 banana"] },
            { name: "COMIDA 5", time: "19:00", foods: ["150g pescado o pollo", "200g zapallo y zanahoria al vapor"] },
            { name: "COMIDA 6", time: "21:00", foods: ["3 claras", "1 galleta de arroz", "Infusión"] },
          ].map((meal) => (
            <div key={meal.name} className="bg-card-bg rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-xs text-primary">{meal.name}</p>
                <span className="text-[10px] text-muted">{meal.time}</span>
              </div>
              <ul className="space-y-0.5">
                {meal.foods.map((food, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-1">
                    <span className="text-primary">&#8226;</span> {food}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
